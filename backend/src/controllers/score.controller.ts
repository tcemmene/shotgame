import { db } from "../utils/db.server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import GroupController from "./group.controller";
import RedisWebSocket from "../websocket/redis.wsserver";

export type ScoreOverview = {
  uuid: string;
  createdAt: Date;
  gameGroupUuid: string;
  username: string;
  amount: number;
  special: boolean;
};

export type AddScoreEntry = {
  gameGroupUuid: string;
  username: string;
  amount: number;
  special: boolean;
};

export type RemoveScoreEntry = {
  uuid: string;
};

export type RemoveScoreEntryResponse = {
  message: string;
};

const AddScoreEntrySchema = z.object({
  gameGroupUuid: z.string(),
  username: z.string(),
  amount: z.number(),
});

const RemoveScoreEntrySchema = z.object({
  uuid: z.string(),
});

const ws = RedisWebSocket.instance;
const groupController = GroupController.instance;

export default class ScoreController {
  public async getAll(): Promise<ScoreOverview[]> {
    const scores = await db.scoreEntry.findMany({
      select: {
        uuid: true,
        gameGroupUuid: true,
        username: true,
        amount: true,
        createdAt: true,
        special: true,
      },
    });
    const sortedScores = scores.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return scores;
  }

  public async addScore({
    gameGroupUuid,
    username,
    amount,
    special = false,
  }: AddScoreEntry): Promise<ScoreOverview> {
    try {
      AddScoreEntrySchema.parse({ gameGroupUuid, username, amount });

      const score = await db.scoreEntry.create({
        data: {
          gameGroupUuid: gameGroupUuid,
          username: username,
          amount: amount,
          special: special,
        },
        select: {
          uuid: true,
          createdAt: true,
          gameGroupUuid: true,
          username: true,
          amount: true,
          special: true,
        },
      });
      // notify websocket clients
      const groupScore = await groupController.aggregateGroupScore(gameGroupUuid);
      ws.broadcastTotalScore(gameGroupUuid, groupScore);
      ws.broadcastAddScore(score);
      return score;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new Error("Group does not exist.");
      }
      throw error;
    }
  }

  public async removeScore({ uuid }: RemoveScoreEntry): Promise<RemoveScoreEntryResponse> {
    try {
      RemoveScoreEntrySchema.parse({ uuid });

      const score = await db.scoreEntry.delete({
        where: {
          uuid: uuid,
        },
        select: {
          uuid: true,
          createdAt: true,
          gameGroupUuid: true,
          username: true,
          amount: true,
          special: true,
        },
      });

      // notify websocket clients
      const groupScore = await groupController.aggregateGroupScore(score.gameGroupUuid);
      ws.broadcastTotalScore(score.gameGroupUuid, groupScore);
      ws.broadcastRemoveScore(score);
      return { message: "Score removed successfully." };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new Error("Score does not exist anymore.");
      }

      throw error;
    }
  }
}
