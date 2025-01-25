import express, { Request, Response } from "express";
import PingController from "../controllers/ping.controller";

const router = express.Router();
const controller = new PingController();

router.get("/", async (request: Request, response: Response) => {
  const result = await controller.getPing();
  return response.send(result);
});

export default router;
