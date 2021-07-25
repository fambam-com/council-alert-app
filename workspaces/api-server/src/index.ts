import express, { Application, Request, Response } from "express";

const app: Application = express();

app.get(`/`, (request: Request, response: Response) => {
  response.send(`Allan is awesome!!`);
});

app.listen(`3000`, () => {
  console.log(`Server is listing to 3000`);
});
