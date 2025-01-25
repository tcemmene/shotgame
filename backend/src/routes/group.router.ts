import express, { Request, Response } from "express";
import GroupController from "../controllers/group.controller";

import { handleAsync } from "../utils/handle.async";
import { standardErrorHandler } from "../utils/handle.error";
import { authenticateGroupToken } from "../auth/group.auth";

const router = express.Router();
const controller = GroupController.instance;

router.get(
  "/",
  handleAsync(async (req: Request, res: Response) => {
    const { details } = req.query;
    if (details === "true") {
      const detailGroups = await controller.getDetails();
      return res.status(200).send(detailGroups);
    }
    const overviewGroups = await controller.getOverview();
    return res.status(200).send(overviewGroups);
  })
);

router.post(
  "/",
  handleAsync(async (req: Request, res: Response) => {
    const group = await controller.createOne(req.body);
    return res.status(200).send(group);
  })
);

router.get(
  "/:uuid",
  handleAsync(async (req: Request, res: Response) => {
    const { uuid } = req.params;
    const group = await controller.getOne({ uuid });
    return res.status(200).send(group);
  })
);

router.delete(
  "/:uuid",
  handleAsync(async (req: Request, res: Response) => {
    const { uuid } = req.params;
    const group = await controller.deleteOne({ uuid });
    return res.status(200).send(group);
  })
);

router.put(
  "/:uuid/modifyName",
  // authenticateGroupToken,
  handleAsync(async (req: Request, res: Response) => {
    const { uuid } = req.params;
    const { newName } = req.body;
    const group = await controller.modifyName({ uuid, newName });
    return res.status(200).send(group);
  })
);

router.put(
  "/:uuid/modifyColor",
  // authenticateGroupToken,
  handleAsync(async (req: Request, res: Response) => {
    const { uuid } = req.params;
    const { newColor } = req.body;

    // Check if newColor is provided in the request body
    if (!newColor || typeof newColor !== "string") {
      return res.status(400).send("Please provide a valid 'newColor' string in the request body.");
    }
    const group = await controller.modifyColor({ uuid, newColor });
    return res.status(200).send(group);
  })
);

router.use(standardErrorHandler);

export default router;
