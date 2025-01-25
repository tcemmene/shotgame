import * as dotenv from "dotenv";

// read environment
dotenv.config();
if (!process.env.APP_PORT) {
  process.exit(1);
}
const port = process.env.APP_PORT;

// setup server
const app = require("./app");
app.listen(port, () => {
  console.log(`API runs at port ${port}`);
});
