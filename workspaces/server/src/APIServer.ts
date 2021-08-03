import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import {
  getUserInfo,
  createUser,
  userIsActive,
  updateToken,
} from "./util/DBOperator";
import { ObjectId } from "bson";

export default async () => {
  const app: Application = express();

  // create application/json parser
  var jsonParser = bodyParser.json();

  // create application/x-www-form-urlencoded parser
  var urlencodedParser = bodyParser.urlencoded({ extended: false });

  app.get(`/`, (request: Request, response: Response) => {
    response.send(`Council alert app is running...`);
  });

  app.post(
    `/user`,
    jsonParser,
    async (request: Request, response: Response) => {
      const { token, id } = request.body;

      const user = await getUserInfo({ id });

      if (user) {
        if (user.notificationToken !== token) {
          await updateToken({
            _id: user._id as ObjectId,
            token,
          });
        }

        await userIsActive(user._id as ObjectId);

        response.send(user);

        return;
      }

      // Create user
      const createResult = await createUser({ id, token });

      if (createResult === `USER_CREATED`) {
        const createdUser = await getUserInfo({ id });

        response.send(createdUser);

        return;
      }

      response.sendStatus(400);
    }
  );

  app.listen(process.env.API_SERVER_PORT, () => {
    console.log(`Server is listing to ${process.env.API_SERVER_PORT}`);
  });
};
