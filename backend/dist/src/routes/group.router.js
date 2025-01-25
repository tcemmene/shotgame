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
const handle_error_1 = require("../utils/handle.error");
const router = express_1.default.Router();
const controller = group_controller_1.default.instance;
router.get("/", (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { details } = req.query;
    if (details === "true") {
        const detailGroups = yield controller.getDetails();
        return res.status(200).send(detailGroups);
    }
    const overviewGroups = yield controller.getOverview();
    return res.status(200).send(overviewGroups);
})));
router.post("/", (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const group = yield controller.createOne(req.body);
    return res.status(200).send(group);
})));
router.get("/:uuid", (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid } = req.params;
    const group = yield controller.getOne({ uuid });
    return res.status(200).send(group);
})));
router.delete("/:uuid", (0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid } = req.params;
    const group = yield controller.deleteOne({ uuid });
    return res.status(200).send(group);
})));
router.put("/:uuid/modifyName", 
// authenticateGroupToken,
(0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid } = req.params;
    const { newName } = req.body;
    const group = yield controller.modifyName({ uuid, newName });
    return res.status(200).send(group);
})));
router.put("/:uuid/modifyColor", 
// authenticateGroupToken,
(0, handle_async_1.handleAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { uuid } = req.params;
    const { newColor } = req.body;
    // Check if newColor is provided in the request body
    if (!newColor || typeof newColor !== "string") {
        return res.status(400).send("Please provide a valid 'newColor' string in the request body.");
    }
    const group = yield controller.modifyColor({ uuid, newColor });
    return res.status(200).send(group);
})));
router.use(handle_error_1.standardErrorHandler);
exports.default = router;
