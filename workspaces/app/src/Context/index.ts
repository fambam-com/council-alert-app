import React, { createContext, useContext } from "react";

export type STATE_TYPE = {
  id: string;
  loadingMetaData: boolean;
  setState: (NEW_STATE: STATE_TYPE) => void;
};

export const STATE: STATE_TYPE = {
  loadingMetaData: true,
} as STATE_TYPE;

export default createContext(STATE);
