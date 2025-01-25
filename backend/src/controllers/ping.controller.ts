export type Pong = {
  message: string;
};

export default class PingController {
  public async getPing(): Promise<Pong> {
    return {
      message: "pong",
    };
  }
}
