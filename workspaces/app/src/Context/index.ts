import React, { createContext, useContext } from "react";
import { UserDTO } from "../../../server/src/util/DBOperator";

export type STATE_TYPE = {
  setState: (values: any) => void;
  id: string;
  notificationToken: string;
  loadingMetaData: boolean;
  user: UserDTO;
};

export const STATE: STATE_TYPE = {
  loadingMetaData: true,
} as STATE_TYPE;

export default createContext(STATE);
