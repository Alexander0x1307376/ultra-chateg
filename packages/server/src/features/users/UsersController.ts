import { inject, injectable } from "inversify";
import { BaseController } from "../common/BaseController";
import { LoggerService } from "../logger/LoggerService";
import { TYPES } from "../../injectableTypes";
import { UsersService } from "./UsersService";
import { Request, Response } from "express";

@injectable()
export class UsersController extends BaseController {
  constructor(
    @inject(TYPES.Logger) private loggerService: LoggerService,
    @inject(TYPES.UsersService) private authService: UsersService,
  ) {
    super(loggerService);
    this.bindRoutes([
      {
        path: "/checkNameUniqueness",
        method: "post",
        func: this.checkNameUniqueness,
      },
    ]);
  }

  async checkNameUniqueness(req: Request<object, object, { name: string }>, res: Response) {
    const result = await this.authService.checkNameUniqueness(req.body.name);
    this.ok(res, result);
  }
}
