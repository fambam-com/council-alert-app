import Logger from "./util/Logger";
import { getDBInstance, NotificationDTO, UserDTO } from "./util/DBOperator";
import { Collection, ObjectId } from "mongodb";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

const run = async (): Promise<void> => {
  Logger.info(`Notification Sender is running...`);

  const db = await getDBInstance();

  const notificationCollection = db.collection(
    `Notification`
  ) as Collection<NotificationDTO>;

  Logger.info(`Start to query unprocessed notifications`);

  const notificationCursor = notificationCollection
    .find({ status: `ready` })
    .sort({ blockNumber: 1 })
    .limit(10);

  if ((await notificationCursor.count()) === 0) {
    Logger.info("There is no unprocessed notification. Wait for the next run");

    return;
  }

  const notifications = (await notificationCursor.toArray()) as Array<
    NotificationDTO & { _id: ObjectId }
  >;

  const userCollection = db.collection(`User`) as Collection<UserDTO>;

  // TODO: Filter out inacitve users
  const userCursor = userCollection
    .find({})
    .project({ notificationToken: 1, _id: 1 });

  const users = await userCursor.toArray();

  users.forEach(async (u) => {
    await send(u.notificationToken as string, notifications);
  });

  await userCursor.forEach(
    (u: { notificationToken: string; _id: ObjectId }) => {
      notifications.forEach(async (n) => {
        await userCollection.updateOne(
          { _id: u._id },
          {
            $push: {
              notifications: n,
            },
          }
        );
      });
    }
  );

  await notificationCollection.updateMany(
    {
      _id: {
        $in: notifications.map((n) => n._id),
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

const send = async (token: string, notifications: Array<NotificationDTO>) => {
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
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        console.error(error);
      }
    }
  })();
};

export default run;
