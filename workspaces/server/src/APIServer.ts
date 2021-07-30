import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";

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
    `/notification/token`,
    jsonParser,
    (request: Request, response: Response) => {
      // console.log(request.query, request);
      console.log(request.body);

      response.send({ token: `Token received` });
    }
  );

  app.listen(process.env.API_SERVER_PORT, () => {
    console.log(`Server is listing to ${process.env.API_SERVER_PORT}`);
  });
};
