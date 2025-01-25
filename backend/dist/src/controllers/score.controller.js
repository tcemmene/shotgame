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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_server_1 = require("../utils/db.server");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const group_controller_1 = __importDefault(require("./group.controller"));
const redis_wsserver_1 = __importDefault(require("../websocket/redis.wsserver"));
const AddScoreEntrySchema = zod_1.z.object({
    gameGroupUuid: zod_1.z.string(),
    username: zod_1.z.string(),
    amount: zod_1.z.number(),
});
const RemoveScoreEntrySchema = zod_1.z.object({
    uuid: zod_1.z.string(),
});
const ws = redis_wsserver_1.default.instance;
const groupController = group_controller_1.default.instance;
class ScoreController {
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const scores = yield db_server_1.db.scoreEntry.findMany({
                select: {
                    uuid: true,
                    gameGroupUuid: true,
                    username: true,
                    amount: true,
                    createdAt: true,
                    special: true,
                },
            });
            const sortedScores = scores.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return scores;
        });
    }
    addScore({ gameGroupUuid, username, amount, special = false, }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                AddScoreEntrySchema.parse({ gameGroupUuid, username, amount });
                const score = yield db_server_1.db.scoreEntry.create({
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
                const groupScore = yield groupController.aggregateGroupScore(gameGroupUuid);
                ws.broadcastTotalScore(gameGroupUuid, groupScore);
                ws.broadcastAddScore(score);
                return score;
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
                    throw new Error("Group does not exist.");
                }
                throw error;
            }
        });
    }
    removeScore({ uuid }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                RemoveScoreEntrySchema.parse({ uuid });
                const score = yield db_server_1.db.scoreEntry.delete({
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
                const groupScore = yield groupController.aggregateGroupScore(score.gameGroupUuid);
                ws.broadcastTotalScore(score.gameGroupUuid, groupScore);
                ws.broadcastRemoveScore(score);
                return { message: "Score removed successfully." };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                    throw new Error("Score does not exist anymore.");
                }
                throw error;
            }
        });
    }
}
exports.default = ScoreController;
