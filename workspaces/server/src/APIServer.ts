import express, { Application, Request, Response } from "express";

const app: Application = express();

export default async () => {
  app.get(`/`, (request: Request, response: Response) => {
    response.send(`Allan is awesome!!`);
  });

  app.listen(process.env.API_SERVER_PORT, () => {
    console.log(`Server is listing to ${process.env.API_SERVER_PORT}`);
  });
};
