import { ObjectId } from "bson";
import { getAllChaininfo } from "../../endpoint";
import {
  getUserInfo,
  createUser,
  userIsActive,
  updateToken,
} from "../../util/DBOperator";

export const handleApi = async (body: any) => {
  const { operation } = body || {};

  switch (operation) {
    case `meta-data`:
      return await getMetaData();
    case `user`:
      return await handleUserInfo(body);
    case `user/notification`:
      return await getUserNotification(body);
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
