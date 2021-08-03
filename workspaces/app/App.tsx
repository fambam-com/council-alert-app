import React, { useState } from "react";
import App from "./src/App";
import StateContext, { STATE, STATE_TYPE } from "./src/Context";

export default () => {
  const [state, setState] = useState(STATE);

  return (
    <StateContext.Provider value={{ ...state, setState }}>
      <App />
    </StateContext.Provider>
  );
};
