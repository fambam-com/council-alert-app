import { log } from "./util";

setInterval(() => {
  log.info(`Hello Allan`);
}, 1000 * 1);

setInterval(() => {
  log.error(`Hello Allan Again`);
}, 1000 * 3);
