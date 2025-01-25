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
exports.authenticateGroupToken = void 0;
const db_server_1 = require("../utils/db.server");
const authenticateGroupToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const uuid = req.params.uuid; // Assuming the group ID is passed as a URL parameter
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]; // Extract token from Authorization header
    try {
        const group = yield db_server_1.db.gameGroup.findUnique({
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
    }
    catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.authenticateGroupToken = authenticateGroupToken;
