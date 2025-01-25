"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardErrorHandler = exports.globalErrorHandler = exports.ClientError = void 0;
class ClientError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
    }
}
exports.ClientError = ClientError;
const globalErrorHandler = (error, req, res, next) => {
    console.error("Global Error:", error);
    res.status(500).json({ message: "Internal server error" });
};
exports.globalErrorHandler = globalErrorHandler;
const standardErrorHandler = (err, req, res, next) => {
    if (err instanceof ClientError) {
        return res.status(404).send({ error: err.message, details: err.details });
    }
    if (err instanceof Error) {
        return res.status(500).send({ error: err.message });
    }
    return res.status(500).json({ error: err });
};
exports.standardErrorHandler = standardErrorHandler;
