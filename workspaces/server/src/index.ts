import Logger from "./util/Logger";
import crawlerRun from "./Crawler";
import parserRun from "./Parser";
import notificationSenderRun from "./NotificationSender";
import apiRun from "./APIServer";
import { getAllChaininfo } from "./endpoint";

require("dotenv").config({ path: `../../.env` });

(async () => {
  await apiRun();
})();

(async () => {
  const chainInfos = await getAllChaininfo();

  // chainInfos.map((ci) => crawlerRun(ci));
})();

(() => {
  const _interval = 1000 * 3;
  let _finished = true;

  setInterval(async () => {
    if (_finished) {
      _finished = false;

      // await parserRun();

      _finished = true;
    }
  }, _interval);
})();

(() => {
  const _interval = 1000 * 10;
  let _finished = true;

  setInterval(async () => {
    if (_finished) {
      _finished = false;

      // await notificationSenderRun();

      _finished = true;
    }
  }, _interval);
})();
