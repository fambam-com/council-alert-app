import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { handleApi } from "../service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const response = await handleApi(req.body);

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: response,
  };
};

export default httpTrigger;
