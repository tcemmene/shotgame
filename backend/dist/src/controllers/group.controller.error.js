"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupActionError = void 0;
class GroupActionError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
    }
}
exports.GroupActionError = GroupActionError;
