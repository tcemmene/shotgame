"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ping_router_1 = __importDefault(require("./ping.router"));
const group_router_1 = __importDefault(require("./group.router"));
const score_router_1 = __importDefault(require("./score.router"));
const router = express_1.default.Router();
router.use("/ping", ping_router_1.default);
router.use("/groups", group_router_1.default);
router.use("/scores", score_router_1.default);
exports.default = router;
