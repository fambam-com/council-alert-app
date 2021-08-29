import React, { useState } from "react";
import { NotificationDTO } from "../server/src/util/DBOperator";
import App from "./src/App";
import StateContext, { STATE, STATE_TYPE } from "./src/Context";
import { $get } from "./src/Util/Request";

export default () => {
  const [state, setState] = useState(STATE);

  const _setState = (values) => {
    setState({
      ...state,
      ...values,
    });
  };

  const _getNotifications = async (id: string) => {
    const { data: notifications } = await $get(`/user/notification`, {
      id,
    });

    _setState({
      user: {
        ...state.user,
        notifications: notifications,
      },
    });

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
