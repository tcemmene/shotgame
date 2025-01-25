import WebSocket from "ws";
import Redis, { RedisOptions } from "ioredis";
import { ScoreOverview } from "../controllers/score.controller";

export default class RedisWebSocket {
  protected static _instance: RedisWebSocket;
  public static get instance(): RedisWebSocket {
    if (!this._instance) {
      this._instance = new RedisWebSocket();
    }
    return this._instance;
  }

  protected wsServer: WebSocket.Server;
  protected wsPort: number;
  protected redisSubscriber: Redis;
  protected redisPublisher: Redis;
  protected redisConfig: RedisOptions = {};
  protected activeConnections: Set<WebSocket>;

  private constructor() {
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

  public run() {
    this.wsServer = new WebSocket.Server({ port: this.wsPort }); // Set your desired WebSocket server port

    this.redisSubscriber = new Redis(this.redisConfig);
    this.redisPublisher = new Redis(this.redisConfig);
    this.redisSubscriber.subscribe("score:total");
    this.redisSubscriber.subscribe("score:add");
    this.redisSubscriber.subscribe("score:remove");

    this.wsServer.on("listening", () => {
      console.log(`WebSocket server is running on port ${this.redisConfig.port}.`);
    });
    this.wsServer.on("connection", (ws: WebSocket) => {
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
    this.redisSubscriber.on("message", (channel: string, message: string) => {
      this.sendAll(message);
    });
  }

  public close() {
    this.wsServer.close((err) => {
      if (err) {
        console.error("Error closing WebSocket server:", err);
      } else {
        console.log("WebSocket server closed.");
      }
    });
  }

  public broadcastTotalScore(uuid: string, newScore: number) {
    const channel = "score:total";
    const message = JSON.stringify({ channel, uuid, newScore });
    this.redisPublisher.publish(channel, message);
  }

  public broadcastAddScore(score: ScoreOverview) {
    const channel = "score:add";
    const message = JSON.stringify({ channel, ...score });
    this.redisPublisher.publish(channel, message);
  }

  public broadcastRemoveScore(score: ScoreOverview) {
    const channel = "score:remove";
    const message = JSON.stringify({ channel, ...score });
    this.redisPublisher.publish(channel, message);
  }

  public sendAll(message: string) {
    this.activeConnections.forEach((ws: WebSocket) => {
      ws.send(message);
    });
  }
}
