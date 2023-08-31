import { Express } from "express";
import { ServerOptions, Server as SocketServer } from "socket.io";
import { ILogger } from "../logger/ILogger";
import { AuthService } from "../auth/AuthService";
import { UsersService } from "../users/UsersService";
import { createServer, Server as HttpServer } from "http";
import { ClientToServerEvents, ServerToClientEvents } from "./webSocketEvents";

export class WebsocketSystem {
  private _wsServer: HttpServer;
  private _socketServer: SocketServer<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    app: Express,
    options: Partial<ServerOptions>,
    private authService: AuthService,
    private usersSerivce: UsersService,
    private logger: ILogger,
  ) {
    this._wsServer = createServer(app);
    this._socketServer = new SocketServer(this._wsServer, options);
  }

  init() {}

  listen(port: number, callback: () => void) {
    this._wsServer.listen(port, callback);
  }
}
