import { Router } from "express";
import { DB, id, now } from "../db.js";

export const refunds = Router();

refunds.post("/:orderId", (req, res) => {
  const o = DB.orders.find(x => x.id === req.params.orderId);
  if (!o) return res.status(404).end();
  const r = { id: id(), orderId: o.id, reason: req.body?.reason ?? "No indicado", refundAmount: Math.min(req.body?.amount ?? o.amount, o.amount), status: "pending" as const, createdAt: now() };
  DB.refunds.push(r);
  res.status(201).json(r);
});

refunds.post("/decide/:refundId", (req, res) => {
  const r = DB.refunds.find(x => x.id === req.params.refundId);
  if (!r) return res.status(404).end();
  r.status = (req.body?.status ?? "approved");
  res.json(r);
});
