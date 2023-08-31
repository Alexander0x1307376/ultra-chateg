import { inject, injectable } from "inversify";
import express, { Express, urlencoded } from "express";
import { TYPES } from "./injectableTypes";
import { IEnvironmentService } from "./features/config/IEnvironmentService";
import { DataSource } from "./features/dataSource/DataSource";
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

@injectable()
export class App {
  httpApp: Express;

  server: HttpServer;
  port: number;
  corsOptions: CorsOptions;
  corsOrigin: string;
  websocketSystem: WebsocketSystem;
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.EnvironmentService) private environmentService: IEnvironmentService,
    @inject(TYPES.DataSource) private dataSource: DataSource,
    @inject(TYPES.MainController) private mainController: MainController,
    @inject(TYPES.UsersController) private usersController: UsersController,
    @inject(TYPES.AuthController) private authController: AuthController,
    @inject(TYPES.ExceptionFilter) private exceptionFilter: ExceptionFilter,
    @inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.UsersService) private usersSerivce: UsersService,
  ) {
    this.httpApp = express();
    this.port = parseInt(this.environmentService.get("PORT"));
    this.corsOptions = {
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    };
    this.websocketSystem = new WebsocketSystem(
      this.httpApp,
      {
        cors: this.corsOptions,
      },
      this.authService,
      this.usersSerivce,
      this.logger,
    );
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

    this.websocketSystem.init();

    this.useExeptionFilters();

    this.websocketSystem.listen(this.port, () => {
      this.logger.log(`[App] API сервер запущен на http://localhost:${this.port}`);
    });
  }
}
