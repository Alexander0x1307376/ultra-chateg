import { Express } from "express";
import { ServerOptions, Socket, Server as SocketServer } from "socket.io";
import { ILogger } from "../logger/ILogger";
import { AuthService } from "../auth/AuthService";
import { UsersService } from "../users/UsersService";
import { createServer, Server as HttpServer } from "http";
import { UserData, UserTransfer } from "../users/userTypes";
import { UsersRealtimeService } from "../users/UsersRealtimeService";
import { ExtendedError } from "socket.io/dist/namespace";
import { getTokenFromHeader } from "../../utils/getTokenFromHeader";
import { NOT_AUTHORIZED } from "./webSocketErrorMessages";

export type SocketHandler = (socket: Socket, user: UserData) => void;

export type ClientToServerEvents = {
  //
};

export class WebsocketSystem {
  private _wsServer: HttpServer;
  private _socketServer: SocketServer; //<ClientToServerEvents, ServerToClientEvents>;
  private _webSocketHandlers: SocketHandler[];

  get socketServer() {
    return this._socketServer;
  }

  constructor(
    app: Express,
    options: Partial<ServerOptions>,
    private authService: AuthService,
    private usersSerivce: UsersService,
    private usersRealtimeService: UsersRealtimeService,

    private logger: ILogger,
  ) {
    this._wsServer = createServer(app);
    this._socketServer = new SocketServer(this._wsServer, options);
    this._webSocketHandlers = [];

    this.init = this.init.bind(this);
    this.listen = this.listen.bind(this);
    this.addHandler = this.addHandler.bind(this);
    this.authHandler = this.authHandler.bind(this);

    this._socketServer.use(this.authHandler);
  }

  addHandler(handler: SocketHandler) {
    this._webSocketHandlers.push(handler);
  }

  init() {
    this._socketServer.on("connection", async (socket) => {
      // TODO: добавить вменяемую обработку ошибок с сокетами после соединения!!!
      try {
        // const user: UserTransfer = await this.usersSerivce.getUserById(socket.handshake.auth.id);
        const user: UserTransfer = await this.usersSerivce.getUserById(parseInt(socket.handshake.auth.id));
        const currentUserOnline = this.usersRealtimeService.addUser(socket.id, user);
        this.logger.log(`[WebSocketSystem]: user ${user.name} id: ${user.id} connected`);

        this._webSocketHandlers.forEach((handler) => {
          handler(socket, currentUserOnline);
        });

        socket.on("disconnect", () => {
          this.usersRealtimeService.removeUser(user.id);
          this.logger.log(`[WebSocketSystem]: user ${user.name} id: ${user.id} disconnected`);
        });
      } catch (e) {
        console.log("!!!ERROR!!!", e);
        socket.emit("error", { message: `No user with id: ${socket.handshake.auth.id} found` });
      }
    });
  }

  listen(port: number, callback: () => void) {
    this._wsServer.listen(port, callback);
  }

  private authHandler(socket: Socket, next: (err?: ExtendedError) => void) {
    const authHeader = socket.handshake.headers.authorization;
    const auth = socket.handshake.auth;

    const accessToken = getTokenFromHeader(authHeader);
    const payload = this.authService.validateToken(accessToken, "access");
    if (!payload || !auth.id) {
      this.logger.error("[WebSocketSystem]: Socket connection isn't authorized");
      next(new Error(NOT_AUTHORIZED));
      return;
    }
    return next();
  }
}
