import express from "express";
import Router from "./routes";
import { globalErrorHandler } from "./utils/handle.error";
import RedisWebSocket from "./websocket/redis.wsserver";

const cors = require("cors");
const morgan = require("morgan");
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("combined"));
app.use(globalErrorHandler);
app.use("/", Router);
const ws = RedisWebSocket.instance;
ws.run();

module.exports = app;
