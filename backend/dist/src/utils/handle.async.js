"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAsync = void 0;
// Async wrapper function to handle errors in async route handlers
const handleAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.handleAsync = handleAsync;
