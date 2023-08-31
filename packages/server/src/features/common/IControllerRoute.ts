/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response, Router } from "express";
import { IMiddleware } from "./IMiddleware";

export interface IControllerRoute {
  path: string;
  func: (req: Request, res: Response, next: NextFunction) => void;
  method: keyof Pick<Router, "get" | "post" | "delete" | "patch" | "put">;
  middlewares?: IMiddleware<any>[];
}

export type ExpressReturnType = Response<any, Record<string, any>>;
