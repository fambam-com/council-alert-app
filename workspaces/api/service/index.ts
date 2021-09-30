import { getAllChaininfo } from "../endpoint";
import {
  getUserInfo,
  createUser,
  userIsActive,
  updateToken,
  saveEvents,
  NotificationDTO,
  getDBInstance,
  UserDTO,
  NotificationStatus,
  snoozeNotification,
} from "../util/DBOperator";
import axios from "axios";
import { Collection, ObjectId } from "mongodb";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

const logger = require("pino")();

export const handleApi = async (body: any) => {
  const { operation } = body || {};

  switch (operation) {
    case `meta-data`:
      return await getMetaData();
    case `setting`:
      return await getSetting();
    case `user`:
      return await handleUserInfo(body);
    case `user/notification`:
      return await getUserNotification(body);
    case `user/snooze-notification`:
      return await snoozeNotification(body);
    case `system-admin`:
      logger.info(`call from system-admin`);

      return await processData(body, {
        saveEventOnly:
          body.saveEventOnly !== undefined ? body.saveEventOnly : true,
      });
    default:
      return await handleHeartbeat();
  }
};

const handleHeartbeat = async () => {
  return `Council alert app is running...`;
};

const getMetaData = async () => {
  const infos = await getAllChaininfo();

  return infos;
};

const getSetting = async () => {
  return {};
};

const handleUserInfo = async ({
  token,
  id,
  operation,
  ...restInfo
}: {
  token: string;
  id: string;
  operation: string;
}) => {
  const user = await getUserInfo({ id });

  if (user) {
    if (user.notificationToken !== token) {
      await updateToken({
        _id: user._id as ObjectId,
        token,
      });
    }

    await userIsActive(user._id as ObjectId);

    return user;
  }

  // Create user
  const createResult = await createUser({ id, token, deviceInfo: restInfo });

  if (createResult === `USER_CREATED`) {
    const createdUser = await getUserInfo({ id });

    return createdUser;
  }

  return null;
};

const getUserNotification = async ({ id }: { id: string }) => {
  const user = await getUserInfo({ id });

  return user?.notifications;
};

interface PolkastatsApiResult<T> {
  status: boolean;
  message: string;
  data: T;
}

interface SystemRemark {
  block_number: number;
  extrinsic_hash: string;
  signer: string;
  remark: string;
  datetime: string;
}

interface ProposalEvent {
  block_number: number;
  section: string;
  method: string;
  data: Array<any>;
  datetime: string;
}

export const workerDo = async () => {
  const [srReponse, proposalReponse]: [
    { data: PolkastatsApiResult<Array<SystemRemark>> },
    { data: PolkastatsApiResult<Array<ProposalEvent>> }
  ] = await Promise.all([
    axios.get(`${process.env.POLKASTATS_SYSTEM_REMARK_URI}`),
    axios.get(`${process.env.POLKASTATS_COUNCIL_EVENT_URI}`),
  ]);

  const [
    {
      data: { data: srEvents },
    },
    {
      data: { data: proposalEvents },
    },
  ] = [srReponse, proposalReponse];

  logger.info(`call from workerDo`);

  logger.info(`system remark event count: ${(srEvents || []).length}`);

  logger.info(`proposal event count: ${(proposalEvents || []).length}`);

  await processData({ srEvents, proposalEvents });
};

export const processData = async (
  { srEvents = [], proposalEvents = [] },
  options = {}
) => {
  logger.info(`processData data call: options: ${JSON.stringify(options)}`);

  const events = [
    ...srEvents.map((e) => ({
      ...e,
      _type: `system.remark`,
      _key: `${e.block_number}-${e.extrinsic_hash}`,
    })),
    ...proposalEvents.map(getProposalEvent),
  ]
    .filter((e) => filterEvents(e))
    .map((e) => processEvent(e));

  await saveEvents(events);

  const { saveEventOnly } = options as { saveEventOnly: boolean };

  if (!saveEventOnly) {
    await senderDo();
  }
};

const getProposalEvent = (e: ProposalEvent) => {
  const { block_number, data, method } = e;

  let proposalHash = data[0];

  if (method.toLowerCase() === `proposed`) {
    if (Array.isArray(data)) {
      proposalHash = data[2];
    } else if (typeof data === "string") {
      try {
        proposalHash = JSON.parse(data)[2];
      } catch (error) {
        logger.error(
          `proposed proposal event is not an array. Error happened when parsing`
        );

        proposalHash = data[2];
      }
    }
  }

  if (method.toLowerCase() === `voted`) {
    proposalHash = data[1];
  }

  return {
    ...e,
    _type: `proposal`,
    _key: `${block_number}-${proposalHash}`,
    _proposalHash: proposalHash,
  };
};

const filterEvents = (event) => {
  if (event._type === `system.remark`) {
    const { remark } = event;

    if (remark.startsWith(`0xRMRK::`)) {
      return false;
    }

    try {
      const _remark = JSON.parse(remark);

      if (!_remark.alertCouncil || _remark.message === undefined) {
        return false;
      }
    } catch (e) {
      logger.info(e);

      return false;
    }
  }

  return true;
};

const processEvent = (e) => {
  let _remark = undefined;
  let content = undefined;
  let subject = `Alert Message`;

  if (e._type === `system.remark`) {
    _remark = JSON.parse(e.remark);
    content = _remark.message;
    subject = `System Remark`;
  }

  // TODO: proposal
  if (!content && e._type === `proposal`) {
    content = `Proposal ${e.method}: ${e._proposalHash}`;
    subject = `Proposal Action`;
  }

  const importance = e.importance || e.level || `medium`;

  if (importance === `urgent`) {
    subject = `(URGENT)${subject}`;
  }

  return {
    ...e,
    status: `ready`,
    chainName: `kusama`,
    createdTime: Date.parse(e.datetime),
    updatedTime: Date.parse(e.datetime),
    importance: importance,
    subject,
    content,
  };
};

const senderDo = async () => {
  const db = await getDBInstance();

  const eventCollection = db.collection(`Event`);

  const eventCursor = eventCollection
    .find({ status: `ready` })
    .sort({ block_number: 1 });

  if ((await eventCursor.count()) === 0) {
    return;
  }

  const events = (await eventCursor.toArray()) as Array<NotificationDTO>;

  const userCollection = db.collection(`User`) as Collection<UserDTO>;

  // TODO: Filter out inacitve users
  const userCursor = userCollection
    .find({})
    .project({ notificationToken: 1, _id: 1, notifications: 1, id: 1 });

  const users = await userCursor.toArray();

  users.forEach(async (u) => {
    let success = false;

    // Filter out events
    const _events = events.filter(
      (e) => !Array.isArray(e.userId) || e.userId.includes(u.id)
    );

    try {
      await sendNotification(u.notificationToken as string, _events);

      success = true;
    } catch (error) {
      success = false;
    }

    // Insert into user.notifications with the sent/error status
    userCollection.updateOne(
      {
        _id: u._id as ObjectId,
      },
      {
        $set: {
          notifications: [
            ..._events.map((n) => ({
              ...n,
              status: (success ? `sent` : `error`) as NotificationStatus,
            })),
            ...(u.notifications as Array<NotificationDTO>),
          ],
        },
      }
    );
  });

  await eventCollection.updateMany(
    {
      _id: {
        $in: events.map((n) => n._id),
      },
    },
    {
      $set: {
        status: `sent`,
      },
    }
  );
};

let expo: Expo | null = null;

const sendNotification = async (
  token: string,
  notifications: Array<NotificationDTO>
) => {
  // Create a new Expo SDK client
  // optionally providing an access token if you have enabled push security
  if (!expo) {
    expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  }

  const messages: Array<ExpoPushMessage> = notifications.map((n) => ({
    to: token,
    body: n.content,
    title: n.subject,
    priority: n.importance === `urgent` ? `high` : `default`,
  }));

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      // NOTE: If a ticket contains an error code in ticket.details.error, you
      // must handle it appropriately. The error codes are listed in the Expo
      // documentation:
      // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
    }
  })();
};

export const cleanup = async () => {
  const CLEANUP_SETTING = {
    EventCleanupDays: 7,
    InactiveUserCleanupDays: 30,
  };

  const db = await getDBInstance();

  const eventCollection = db.collection(`Event`);

  logger.info(`start to cleanup Event collection`);

  const eventCleanupTime = new Date();
  eventCleanupTime.setDate(
    eventCleanupTime.getDate() - CLEANUP_SETTING.EventCleanupDays
  );

  logger.info(`EventCleanupTime before: ${eventCleanupTime}`);

  const eventDeletedResult = await eventCollection.deleteMany({
    status: `sent`,
    createdTime: { $lt: eventCleanupTime.getTime() },
  });

  logger.info(
    `there are ${eventDeletedResult.deletedCount} Event records deleted`
  );

  logger.info(`start to cleanup User collection`);

  const userCleanupTime = new Date();
  userCleanupTime.setDate(
    userCleanupTime.getDate() - CLEANUP_SETTING.InactiveUserCleanupDays
  );

  logger.info(`UserCleanupTime before: ${userCleanupTime}`);

  const userCollection = db.collection(`User`);

  const userDeletedResult = await userCollection.deleteMany({
    lastActiveTime: { $lt: userCleanupTime.getTime() },
  });

  logger.info(
    `there are ${userDeletedResult.deletedCount} User records deleted`
  );

  logger.info(`start to cleanup User.Notifications`);

  const activeUsersCusor = userCollection.find({});

  const activeUsers = await activeUsersCusor.toArray();

  activeUsers.forEach((u) => {
    try {
      userCollection.updateOne(
        {
          _id: u._id as ObjectId,
        },
        {
          $set: {
            notifications: [
              ...u.notifications.filter((n) => {
                if (n.updatedTime) {
                  return (
                    n.updatedTime > eventCleanupTime.getTime() ||
                    n.status !== `sent`
                  );
                }

                return (
                  n.createdTime > eventCleanupTime.getTime() ||
                  n.status !== `sent`
                );
              }),
            ],
          },
        }
      );
    } catch (error) {
      logger.error(error);
    }
  });
};
