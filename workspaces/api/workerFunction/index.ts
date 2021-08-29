import { AzureFunction, Context } from "@azure/functions";
import { workerDo } from "../service";

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  var timeStamp = new Date().toISOString();

  context.log("Timer trigger function ran!", timeStamp);

  await workerDo();
};

export default timerTrigger;
