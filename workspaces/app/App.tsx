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
    const { data: notifications } = await $post(`/user/notification`, {
      id,
    });

    _setState({
      user: {
        ...state.user,
        notifications: notifications,
      },
    });

    // Reset badge count
    Notifications.setBadgeCountAsync(0);

    return notifications;
  };

  return (
    <StateContext.Provider
      value={{
        ...state,
        setState: _setState,
        getNotification: _getNotifications,
      }}
    >
      <App />
    </StateContext.Provider>
  );
};
