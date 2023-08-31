/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Response } from "express";

export type ControllerMethod = (req: any, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>;
