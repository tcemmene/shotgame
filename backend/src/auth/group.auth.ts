import { NextFunction, Request, Response } from "express";
import { db } from "../utils/db.server";

export const authenticateGroupToken = async (req: Request, res: Response, next: NextFunction) => {
  const uuid = req.params.uuid; // Assuming the group ID is passed as a URL parameter
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

  try {
    const group = await db.gameGroup.findUnique({
      where: { uuid },
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found." });
    }

    if (group.token !== token) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    // Attach the retrieved group to the request object for later use if needed
    res.locals.group = group;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
