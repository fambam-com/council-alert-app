import React, { createContext, useContext } from "react";
import { NotificationDTO, UserDTO } from "../../../server/src/util/DBOperator";

export type STATE_TYPE = {
  setState: (values: any) => void;
  getNotification: (id: string) => Promise<Array<NotificationDTO>>;
  id: string;
  notificationToken: string;
  loadingMetaData: boolean;
  user: UserDTO;
};

export const STATE: STATE_TYPE = {
  loadingMetaData: true,
} as STATE_TYPE;

export default createContext(STATE);
