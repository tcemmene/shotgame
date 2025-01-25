"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardErrorHandler = exports.globalErrorHandler = void 0;
const zod_1 = require("zod");
const globalErrorHandler = (error, req, res, next) => {
    console.error("Global Error:", error);
    res.status(500).json({ message: "Internal server error" });
};
exports.globalErrorHandler = globalErrorHandler;
const standardErrorHandler = (err, req, res, next) => {
    if (err instanceof zod_1.z.ZodError) {
        return res.status(400).send({ error: "Invalid request parameters.", issues: err.issues });
    }
    if (err instanceof Error) {
        return res.status(500).send({ error: err.message });
    }
    return res.status(500).json({ error: err });
};
exports.standardErrorHandler = standardErrorHandler;
