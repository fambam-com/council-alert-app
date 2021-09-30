import React, { createContext, useContext } from "react";
import { NotificationDTO, UserDTO } from "../../../server/src/util/DBOperator";
import { ChainInfo } from "../../../server/src/endpoint/index";

export type STATE_TYPE = {
  setState: (values: any) => void;
  getNotification: (id: string) => Promise<Array<NotificationDTO>>;
  snoozeNotification: ({
    userId,
    notificationKey,
    snoozedUntil,
  }: {
    userId: string;
    notificationKey: string;
    snoozedUntil: number | null;
  }) => Promise<void>;
  id: string; // user id
  notificationToken: string;
  loadingMetaData: boolean;
  user: UserDTO;
  availableChains: Array<ChainInfo>;
  currentChain: ChainInfo;
  refreshing: false;
};

export const STATE: STATE_TYPE = {
  loadingMetaData: true,
} as STATE_TYPE;

export default createContext(STATE);
