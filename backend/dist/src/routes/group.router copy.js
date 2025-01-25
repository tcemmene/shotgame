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
const group_controller_1 = __importDefault(require("../controllers/group.controller"));
const handle_async_1 = require("../utils/handle.async");
const errorhandler_1 = require("../utils/errorhandler");
const group_auth_1 = require("../auth/group.auth");
const router = express_1.default.Router();
const controller = new group_controller_1.default();
router.get("/", (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const groups = yield controller.getAll();
    return res.status(200).send(groups);
})));
router.post("/", (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const group = yield controller.createOne(req.body);
    return res.status(200).send(group);
})));
router.put("/:uuid/modify", group_auth_1.authenticateGroupToken, (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid } = req.params;
    const { newName } = req.body;
    const group = yield controller.modifyName({ uuid, newName });
    return res.status(200).send(group);
})));
router.put("/:uuid/addScore", (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid } = req.params;
    const { username, amount } = req.body;
    const group = yield controller.addScore({ gameGroupUuid: uuid, username, amount });
    return res.status(200).send(group);
})));
router.use(errorhandler_1.standardErrorHandler);
exports.default = router;
