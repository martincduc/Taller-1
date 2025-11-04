import { Request } from "express";

export function money(n: number) { return Math.round(n * 100) / 100; }

export function requireBody<T = any>(req: Request, fields: (keyof T)[]): T {
  const body = req.body || {};
  for (const f of fields) {
    if (body[f as string] === undefined) throw new Error(`Missing field: ${String(f)}`);
  }
  return body as T;
}
