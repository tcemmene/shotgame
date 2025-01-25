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
const express_1 = __importDefault(require("express"));
const handle_async_1 = require("../utils/handle.async");
const handle_error_1 = require("../utils/handle.error");
const score_controller_1 = __importDefault(require("../controllers/score.controller"));
const router = express_1.default.Router();
const controller = new score_controller_1.default();
router.get("/", (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const groups = yield controller.getAll();
    return res.status(200).send(groups);
})));
router.post("/", (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { gameGroupUuid, username, amount, special } = req.body;
    const score = yield controller.addScore({ gameGroupUuid, username, amount, special });
    return res.status(200).send(score);
})));
router.delete("/:uuid", (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid } = req.params;
    const response = yield controller.removeScore({ uuid });
    return res.status(200).send(response);
})));
router.use(handle_error_1.standardErrorHandler);
exports.default = router;
