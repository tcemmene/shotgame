"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@prisma/client");
// Singleton of Data Source
let db;
if (!global.__dbClient) {
    global.__dbClient = new client_1.PrismaClient();
}
exports.db = db = global.__dbClient;
