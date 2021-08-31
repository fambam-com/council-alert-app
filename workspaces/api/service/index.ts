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
} from "../util/DBOperator";
import axios from "axios";
import { Collection, ObjectId } from "mongodb";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

export const handleApi = async (body: any) => {
  const { operation } = body || {};

  switch (operation) {
    case `meta-data`:
      return await getMetaData();
    case `user`:
      return await handleUserInfo(body);
    case `user/notification`:
      return await getUserNotification(body);
    case `system-admin`:
      console.log(`call from system-admin`);

      return await processData(body, { saveEventOnly: true });
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

const handleUserInfo = async ({ token, id }: { token: string; id: string }) => {
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
  const createResult = await createUser({ id, token });

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

export const workerDo = async () => {
  const [srReponse, proposalReponse] = await Promise.all([
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

  console.log(`call from workerDo`);

  await processData({ srEvents, proposalEvents });
};

export const processData = async (
  { srEvents = [], proposalEvents = [] },
  options = {}
) => {
  console.log(`processData data call: options: ${JSON.stringify(options)}`);

  const events = [
    ...srEvents.map((e) => ({
      ...e,
      _type: `system.remark`,
      _key: `${e.block_number}-${e.extrinsic_hash}`,
    })),
    ...proposalEvents.map(({ block_number, data, datetime }) => ({
      block_number,
      datetime,
      _type: `proposal`,
      _key: `${block_number}-${data[2]}`,
      _account: data[0],
      _proposalIndex: data[1],
      _proposal: data[2],
      _memberCount: data[3],
    })),
  ]
    .filter((e) => filterEvents(e))
    .map((e) => processEvent(e));

  await saveEvents(events);

  const { saveEventOnly } = options as { saveEventOnly: boolean };

  if (!saveEventOnly) {
    await senderDo();
  }
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
      console.log(e);

      return false;
    }
  }

  return true;
};

const processEvent = (e) => {
  let _remark = undefined;
  let content = undefined;

  if (e._type === `system.remark`) {
    _remark = JSON.parse(e.remark);
    content = _remark.message;
  }

  // TODO: proposal
  if (!content && e._type === `proposal`) {
    content = `Proposal action: ${e._proposal}`;
  }

  return {
    ...e,
    status: `ready`,
    chainName: `kusama`,
    createdTime: Date.parse(e.datetime),
    importance: `medium`,
    subject: `Alert Message`,
    content,
    // _remark,
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
    .project({ notificationToken: 1, _id: 1, notifications: 1 });

  const users = await userCursor.toArray();

  users.forEach(async (u) => {
    let success = false;

    try {
      await sendNotification(u.notificationToken as string, events);

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
            ...events.map((n) => ({
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
