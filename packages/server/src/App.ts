import { inject, injectable } from "inversify";
import express, { Express, urlencoded } from "express";
import { TYPES } from "./injectableTypes";
import { IEnvironmentService } from "./features/config/IEnvironmentService";
import { MainController } from "./features/common/MainController";
import { AuthController } from "./features/auth/AuthController";
import { ExceptionFilter } from "./features/exceptions/ExceptionFilter";
import { AuthMiddleware } from "./features/auth/AuthMiddleware";
import { AuthService } from "./features/auth/AuthService";
import { UsersController } from "./features/users/UsersController";
import { UsersService } from "./features/users/UsersService";
import { ILogger } from "./features/logger/ILogger";
import { Server as HttpServer } from "https";
import cors, { CorsOptions } from "cors";
import { json } from "body-parser";
import cookieParser from "cookie-parser";
import { WebsocketSystem } from "./features/webSockets/WebsocketSystem";
import { UsersRealtimeService } from "./features/users/UsersRealtimeService";
import { PageRealtimeService } from "./features/pages/PageRealtimeService";
import { ChannelsRemoteStore } from "./features/channels/ChannelsRemoteStore";
import { Server as SocketServer } from "socket.io";
import { ChannelDetailsRemoteStore } from "./features/channels/ChannelDetailsRemoteStore";
import { ChannelDetailsStore } from "./features/channels/ChannelDetailsStore";
import { PeerToPeerSystem } from "./features/p2p/PeerToPeerSystem";

@injectable()
export class App {
  httpApp: Express;

  _server: HttpServer;
  _port: number;
  _corsOptions: CorsOptions;
  _corsOrigin: string;
  _websocketSystem: WebsocketSystem;
  _websocketServer: SocketServer;

  _pageRealtimeService: PageRealtimeService;
  _channelsRemoteStore: ChannelsRemoteStore;
  _channelDetailsRemoteStore: ChannelDetailsRemoteStore;
  _peerToPeerSystem: PeerToPeerSystem;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.EnvironmentService) private environmentService: IEnvironmentService,
    @inject(TYPES.MainController) private mainController: MainController,
    @inject(TYPES.UsersController) private usersController: UsersController,
    @inject(TYPES.AuthController) private authController: AuthController,
    @inject(TYPES.ExceptionFilter) private exceptionFilter: ExceptionFilter,
    @inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.UsersService) private usersSerivce: UsersService,
    @inject(TYPES.UsersRealtimeService) private usersRealtimeService: UsersRealtimeService,
  ) {
    this.httpApp = express();
    this._port = parseInt(this.environmentService.get("PORT"));
    this._corsOptions = {
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    };
    this._websocketSystem = new WebsocketSystem(
      this.httpApp,
      { cors: this._corsOptions },
      this.authService,
      this.usersSerivce,
      this.usersRealtimeService,
      this.logger,
    );

    this._websocketServer = this._websocketSystem.socketServer;
    this._channelsRemoteStore = new ChannelsRemoteStore(this._websocketServer);

    const channelDetailsStore = new ChannelDetailsStore(this._channelsRemoteStore, usersRealtimeService);
    this._channelDetailsRemoteStore = new ChannelDetailsRemoteStore(this._websocketServer, channelDetailsStore);

    const peerToPeerSystem = new PeerToPeerSystem(
      this._websocketServer,
      channelDetailsStore,
      usersRealtimeService,
      this._channelDetailsRemoteStore,
    );
    this._peerToPeerSystem = peerToPeerSystem;
  }

  private handleRealtimeSystems() {
    this._websocketSystem.addHandler(this._channelsRemoteStore.socketHandler);
    this._websocketSystem.addHandler(this._channelDetailsRemoteStore.socketHandler);
    this._websocketSystem.addHandler(this._peerToPeerSystem.socketHandler);
  }

  private useRoutes() {
    this.httpApp.use("/", this.authController.router);
    this.httpApp.use("/", this.mainController.router);
    this.httpApp.use("/", this.usersController.router);
  }

  private useMiddleware() {
    this.httpApp.use(cors());
    this.httpApp.use(json());
    this.httpApp.use(cookieParser());
    this.httpApp.use(urlencoded({ extended: true }));

    this.httpApp.use(this.authMiddleware.execute.bind(this.authMiddleware));
  }

  useExeptionFilters() {
    this.httpApp.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
  }

  async init() {
    this.useMiddleware();
    this.useRoutes();

    this._websocketSystem.init();
    this.handleRealtimeSystems();

    this.useExeptionFilters();

    this._websocketSystem.listen(this._port, () => {
      this.logger.log(`[App] API сервер запущен на http://localhost:${this._port}`);
    });
  }
}
