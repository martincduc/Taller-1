import { NextFunction, Request, Response } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const code = err.status || 400;
  res.status(code).json({ error: err.message || "Unexpected error" });
}
