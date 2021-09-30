import React, { useState } from "react";
import { NotificationDTO } from "../server/src/util/DBOperator";
import App from "./src/App";
import LocalApp from "./src/Local";
import StateContext, { STATE, STATE_TYPE } from "./src/Context";
import { $post } from "./src/Util/Request";
import * as Notifications from "expo-notifications";

export default () => {
  // return <LocalApp></LocalApp>;

  const [state, setState] = useState(STATE);

  const _setState = (values) => {
    setState({
      ...state,
      ...values,
    });
  };

  const _getNotifications = async (id: string) => {
    _setState({
      ...state,
      refreshing: true,
    });

    const { data: notifications } = await $post(`/user/notification`, {
      id,
    });

    _setState({
      refreshing: false,
      ...state,
      user: {
        ...state.user,
        notifications: notifications,
      },
    });

    // Reset badge count
    Notifications.setBadgeCountAsync(0);

    return notifications;
  };

  const _snoozeNotifications = async ({
    userId,
    notificationKey,
    snoozedUntil,
  }: {
    userId: string;
    notificationKey: string;
    snoozedUntil: number | null;
  }) => {
    await $post(`/user/snooze-notification`, {
      userId,
      notificationKey,
      scheduledTime: snoozedUntil,
    });
  };

  return (
    <StateContext.Provider
      value={{
        ...state,
        setState: _setState,
        getNotification: _getNotifications,
        snoozeNotification: _snoozeNotifications,
      }}
    >
      <App />
    </StateContext.Provider>
  );
};
