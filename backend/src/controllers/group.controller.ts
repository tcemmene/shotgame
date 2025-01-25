import { db } from "../utils/db.server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { ScoreOverview } from "./score.controller";
import { ClientError } from "../utils/handle.error";

export type GroupCreate = {
  name: string;
  email: string;
};

export type GroupCreateResponse = {
  uuid: string;
  name: string;
  email: string;
  token: string;
};

export type GroupGet = {
  uuid: string;
};

export type GroupGetResponse = {
  uuid: string;
  name: string;
  score: number;
  color: string;
  scores: ScoreOverviewSparse[];
};

export type GroupDelete = {
  uuid: string;
};

export type GroupDeleteResponse = {
  message: string;
  uuid: string;
};

type ScoreOverviewSparse = Omit<ScoreOverview, "gameGroupUuid">;

const GROUP_DEFAULT_COLORS = [
  "#1f77b4", // blue
  "#ff7f0e", // orange
  "#2ca02c", // green
  "#d62728", // red
  "#9467bd", // purple
  "#8c564b", // brown
  "#e377c2", // pink
  "#7f7f7f", // gray
  "#bcbd22", // olive
  "#17becf", // cyan
  "#ff9896", // light red
  "#aec7e8", // light blue
  "#ffbb78", // light orange
  "#98df8a", // light green
  "#ff9896", // light red
];

export type GroupModifyName = {
  uuid: string;
  newName: string;
};

export type GroupModifyNameResponse = {
  name: string;
};

export type GroupOverview = {
  uuid: string;
  name: string;
  score: number;
  color:string;
};

export type GroupModifyColor = {
  uuid: string;
  newColor: string;
};

export type GroupModifyColorResponse = {
  color: string;
};

export type AddScoreEntry = {
  gameGroupUuid: string;
  username: string;
  amount: number;
};

export const GroupModifyNameSchema = z.object({
  uuid: z.string(),
  newName: z.string(),
});

export default class GroupController {
  protected static _instance: GroupController;
  public static get instance(): GroupController {
    if (!this._instance) {
      this._instance = new GroupController();
    }
    return this._instance;
  }

  private constructor() {}

  public async getOverview(): Promise<GroupOverview[]> {
    const groups = await db.gameGroup.findMany({
      select: {
        uuid: true,
        name: true,
        color:true,
      },
    });

    const groupUuids = groups.map((group) => group.uuid);

    const groupOverviews: GroupOverview[] = [];

    for (const uuid of groupUuids) {
      const score = await this.aggregateGroupScore(uuid);
const group = groups.find((group) => group.uuid === uuid);
      // Construct the group overview object
      const groupOverview: GroupOverview = {
        uuid: uuid,
        name: group?.name || "", // Fetch the group name
        score: score, // Total score for the group
        color: group?.color || "",
      };

      groupOverviews.push(groupOverview);
    }

    return groupOverviews;
  }

  public async getDetails(): Promise<GroupGetResponse[]> {
    const gameGroups = await db.gameGroup.findMany({
      include: {
        entries: {
          select: {
            uuid: true,
            createdAt: true,
            username: true,
            amount: true,
            special: true,
          },
        },
      },
    });

    const formattedGroups: GroupGetResponse[] = gameGroups.map((group) => {
      const scores: ScoreOverviewSparse[] = group.entries.map((entry) => ({
        uuid: entry.uuid,
        createdAt: entry.createdAt,
        username: entry.username,
        amount: entry.amount,
        special: entry.special,
      }));

      const totalScore: number = group.entries.reduce((acc, entry) => acc + entry.amount, 0);

      return {
        uuid: group.uuid,
        name: group.name,
        score: totalScore,
        scores: scores,
        color: group.color,
      };
    });

    return formattedGroups;
  }

  public async getOne({ uuid }: GroupGet): Promise<GroupGetResponse | null> {
    const score = await this.aggregateGroupScore(uuid);

    // Retrieve group information based on the UUID
    const group = await db.gameGroup.findUnique({
      where: {
        uuid,
      },
      select: {
        uuid: true,
        name: true,
        color: true,
      },
    });

    if (!group) {
      return null; // Group not found
    }

    // Retrieve individual score entries for the group
    const scoreEntries = await db.scoreEntry.findMany({
      where: {
        gameGroupUuid: uuid,
      },
      select: {
        uuid: true,
        username: true,
        amount: true,
        createdAt: true,
        special: true,
      },
    });

    // Construct the response object containing group information and scores
    const groupOverview: GroupGetResponse = {
      uuid: group.uuid,
      name: group.name,
      score: score, // Total score for the group
      color: group.color,
      scores: scoreEntries, // Individual score entries for the group
    };

    return groupOverview; // Return the group information and scores
  }

  public async createOne({ name, email }: GroupCreate): Promise<GroupCreateResponse> {
    try {
      // Check if email already exists
      const existingEmail = await db.gameGroup.findUnique({
        where: { email },
      });

      if (existingEmail) {
        throw new Error("User with this email already exists.");
      }

      // Check if name already exists
      const existingName = await db.gameGroup.findUnique({
        where: { name },
      });

      if (existingName) {
        throw new Error("Group with this name already exists.");
      }

      // If neither email nor name exists, create the group
      const nofGroups = await db.gameGroup.count();
      const group = await db.gameGroup.create({
        data: {
          name,
          email,
          color: GROUP_DEFAULT_COLORS[nofGroups],
        },
        select: {
          uuid: true,
          name: true,
          email: true,
          token: true,
          color: true,
        },
      });
      return group;
    } catch (error) {
      throw error;
    }
  }

  public async deleteOne({ uuid }: GroupDelete): Promise<GroupDeleteResponse> {
    try {
      await db.gameGroup.delete({
        where: {
          uuid: uuid,
        },
      });
      return { message: "Group deleted successfully.", uuid: uuid };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new ClientError("Could not delete group. Group not found.", { uuid: uuid });
      } else {
        throw err;
      }
    }
  }

  public async modifyName({ uuid, newName }: GroupModifyName): Promise<GroupModifyNameResponse> {
    try {
      GroupModifyNameSchema.parse({ uuid, newName });
      const group = await db.gameGroup.update({
        where: {
          uuid: uuid,
        },
        data: {
          name: newName,
        },
        select: {
          name: true,
        },
      });
      return group;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return new ClientError("Invalid request parameters.", err.issues);
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new Error("Group with this name does not exist.");
      } else {
        throw err;
      }
    }
  }

  public async modifyColor({
    uuid,
    newColor,
  }: GroupModifyColor): Promise<GroupModifyColorResponse> {
    // Ensure the UUID and newColor are not empty strings
    if (!uuid.trim() || !newColor.trim()) {
      throw new Error("UUID and newColor must be provided.");
    }

    const updatedGroup = await db.gameGroup.update({
      where: {
        uuid: uuid,
      },
      data: {
        color: newColor,
      },
      select: {
        color: true,
      },
    });

    if (!updatedGroup) {
      throw new Error("Failed to update group color.");
    }

    return { color: updatedGroup.color };
  }

  public async aggregateGroupScore(uuid: string): Promise<number> {
    const groupScore = await db.scoreEntry.groupBy({
      by: ["gameGroupUuid"],
      _sum: {
        amount: true,
      },
      having: {
        gameGroupUuid: {
          equals: uuid,
        },
      },
    });

    if (groupScore.length !== 0) {
      return groupScore[0]._sum.amount || 0;
    }

    return 0; // If no score entries are found for the group, return 0
  }
}
