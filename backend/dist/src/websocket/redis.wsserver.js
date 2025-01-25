"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const ioredis_1 = __importDefault(require("ioredis"));
class RedisWebSocket {
    static get instance() {
        if (!this._instance) {
            this._instance = new RedisWebSocket();
        }
        return this._instance;
    }
    constructor() {
        this.redisConfig = {};
        // setup redis config
        if (process.env.REDIS_HOST) {
            this.redisConfig.host = process.env.REDIS_HOST;
        }
        if (process.env.REDIS_PORT) {
            this.redisConfig.port = parseInt(process.env.REDIS_PORT);
        }
        if (process.env.WEBSOCKET_PORT) {
            this.wsPort = parseInt(process.env.WEBSOCKET_PORT);
        }
        this.activeConnections = new Set();
    }
    run() {
        this.wsServer = new ws_1.default.Server({ port: this.wsPort }); // Set your desired WebSocket server port
        this.redisSubscriber = new ioredis_1.default(this.redisConfig);
        this.redisPublisher = new ioredis_1.default(this.redisConfig);
        this.redisSubscriber.subscribe("score:total");
        this.redisSubscriber.subscribe("score:add");
        this.redisSubscriber.subscribe("score:remove");
        this.wsServer.on("listening", () => {
            console.log(`WebSocket server is running on port ${this.redisConfig.port}.`);
        });
        this.wsServer.on("connection", (ws) => {
            this.activeConnections.add(ws);
            ws.on("close", () => {
                this.activeConnections.delete(ws);
            });
        });
        this.wsServer.on("close", () => {
            this.redisSubscriber.unsubscribe("score:total");
            this.redisSubscriber.unsubscribe("score:add");
            this.redisSubscriber.unsubscribe("score:remove");
            this.redisSubscriber.quit();
        });
        // send messages to all clients
        this.redisSubscriber.on("message", (channel, message) => {
            this.sendAll(message);
        });
    }
    close() {
        this.wsServer.close((err) => {
            if (err) {
                console.error("Error closing WebSocket server:", err);
            }
            else {
                console.log("WebSocket server closed.");
            }
        });
    }
    broadcastTotalScore(uuid, newScore) {
        const channel = "score:total";
        const message = JSON.stringify({ channel, uuid, newScore });
        this.redisPublisher.publish(channel, message);
    }
    broadcastAddScore(score) {
        const channel = "score:add";
        const message = JSON.stringify(Object.assign({ channel }, score));
        this.redisPublisher.publish(channel, message);
    }
    broadcastRemoveScore(score) {
        const channel = "score:remove";
        const message = JSON.stringify(Object.assign({ channel }, score));
        this.redisPublisher.publish(channel, message);
    }
    sendAll(message) {
        this.activeConnections.forEach((ws) => {
            ws.send(message);
        });
    }
}
exports.default = RedisWebSocket;
