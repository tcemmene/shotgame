import express, { Request, Response } from "express";
import { handleAsync } from "../utils/handle.async";
import { standardErrorHandler } from "../utils/handle.error";
import { authenticateGroupToken } from "../auth/group.auth";
import ScoreController from "../controllers/score.controller";

const router = express.Router();
const controller = new ScoreController();

router.get(
  "/",
  handleAsync(async (req: Request, res: Response) => {
    const groups = await controller.getAll();
    return res.status(200).send(groups);
  })
);

router.post(
  "/",
  handleAsync(async (req: Request, res: Response) => {
    const { gameGroupUuid, username, amount, special } = req.body;
    const score = await controller.addScore({ gameGroupUuid, username, amount, special });
    return res.status(200).send(score);
  })
);

router.delete(
  "/:uuid",
  handleAsync(async (req: Request, res: Response) => {
    const { uuid } = req.params;
    const response = await controller.removeScore({ uuid });
    return res.status(200).send(response);
  })
);

router.use(standardErrorHandler);

export default router;
