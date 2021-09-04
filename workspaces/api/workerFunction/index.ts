import { AzureFunction, Context } from "@azure/functions";
import { workerDo, cleanup } from "../service";
const logger = require("pino")();

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  var timeStamp = new Date().toISOString();

  context.log("Timer trigger function ran!", timeStamp);

  try {
    logger.info(`processing main worker logic`);

    await workerDo();

    logger.info(`main worker logic finished`);
  } catch (error) {
    logger.error(error);
  }

  try {
    logger.info(`processing cleanup logic`);

    await cleanup();

    logger.info(`cleanup finished`);
  } catch (error) {
    logger.error(error);
  }
};

export default timerTrigger;
