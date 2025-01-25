import express, { Request, Response } from "express";
import PingRouter from "./ping.router";
import GroupRouter from "./group.router";
import ScoreRouter from "./score.router";

const router = express.Router();

router.use("/ping", PingRouter);
router.use("/groups", GroupRouter);
router.use("/scores", ScoreRouter);

export default router;
