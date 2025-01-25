"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupModifyNameSchema = void 0;
const db_server_1 = require("../utils/db.server");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const handle_error_1 = require("../utils/handle.error");
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
exports.GroupModifyNameSchema = zod_1.z.object({
    uuid: zod_1.z.string(),
    newName: zod_1.z.string(),
});
class GroupController {
    static get instance() {
        if (!this._instance) {
            this._instance = new GroupController();
        }
        return this._instance;
    }
    constructor() { }
    getOverview() {
        return __awaiter(this, void 0, void 0, function* () {
            const groups = yield db_server_1.db.gameGroup.findMany({
                select: {
                    uuid: true,
                    name: true,
                    color: true,
                },
            });
            const groupUuids = groups.map((group) => group.uuid);
            const groupOverviews = [];
            for (const uuid of groupUuids) {
                const score = yield this.aggregateGroupScore(uuid);
                const group = groups.find((group) => group.uuid === uuid);
                // Construct the group overview object
                const groupOverview = {
                    uuid: uuid,
                    name: (group === null || group === void 0 ? void 0 : group.name) || "", // Fetch the group name
                    score: score, // Total score for the group
                    color: (group === null || group === void 0 ? void 0 : group.color) || "",
                };
                groupOverviews.push(groupOverview);
            }
            return groupOverviews;
        });
    }
    getDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            const gameGroups = yield db_server_1.db.gameGroup.findMany({
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
            const formattedGroups = gameGroups.map((group) => {
                const scores = group.entries.map((entry) => ({
                    uuid: entry.uuid,
                    createdAt: entry.createdAt,
                    username: entry.username,
                    amount: entry.amount,
                    special: entry.special,
                }));
                const totalScore = group.entries.reduce((acc, entry) => acc + entry.amount, 0);
                return {
                    uuid: group.uuid,
                    name: group.name,
                    score: totalScore,
                    scores: scores,
                    color: group.color,
                };
            });
            return formattedGroups;
        });
    }
    getOne({ uuid }) {
        return __awaiter(this, void 0, void 0, function* () {
            const score = yield this.aggregateGroupScore(uuid);
            // Retrieve group information based on the UUID
            const group = yield db_server_1.db.gameGroup.findUnique({
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
            const scoreEntries = yield db_server_1.db.scoreEntry.findMany({
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
            const groupOverview = {
                uuid: group.uuid,
                name: group.name,
                score: score, // Total score for the group
                color: group.color,
                scores: scoreEntries, // Individual score entries for the group
            };
            return groupOverview; // Return the group information and scores
        });
    }
    createOne({ name, email }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if email already exists
                const existingEmail = yield db_server_1.db.gameGroup.findUnique({
                    where: { email },
                });
                if (existingEmail) {
                    throw new Error("User with this email already exists.");
                }
                // Check if name already exists
                const existingName = yield db_server_1.db.gameGroup.findUnique({
                    where: { name },
                });
                if (existingName) {
                    throw new Error("Group with this name already exists.");
                }
                // If neither email nor name exists, create the group
                const nofGroups = yield db_server_1.db.gameGroup.count();
                const group = yield db_server_1.db.gameGroup.create({
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
            }
            catch (error) {
                throw error;
            }
        });
    }
    deleteOne({ uuid }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield db_server_1.db.gameGroup.delete({
                    where: {
                        uuid: uuid,
                    },
                });
                return { message: "Group deleted successfully.", uuid: uuid };
            }
            catch (err) {
                if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                    throw new handle_error_1.ClientError("Could not delete group. Group not found.", { uuid: uuid });
                }
                else {
                    throw err;
                }
            }
        });
    }
    modifyName({ uuid, newName }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                exports.GroupModifyNameSchema.parse({ uuid, newName });
                const group = yield db_server_1.db.gameGroup.update({
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
            }
            catch (err) {
                if (err instanceof zod_1.z.ZodError) {
                    return new handle_error_1.ClientError("Invalid request parameters.", err.issues);
                }
                if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                    throw new Error("Group with this name does not exist.");
                }
                else {
                    throw err;
                }
            }
        });
    }
    modifyColor({ uuid, newColor, }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure the UUID and newColor are not empty strings
            if (!uuid.trim() || !newColor.trim()) {
                throw new Error("UUID and newColor must be provided.");
            }
            const updatedGroup = yield db_server_1.db.gameGroup.update({
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
        });
    }
    aggregateGroupScore(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const groupScore = yield db_server_1.db.scoreEntry.groupBy({
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
        });
    }
}
exports.default = GroupController;
