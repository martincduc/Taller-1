import { Router } from "express";
import { DB, id, now } from "../db.js";

export const reports = Router();

reports.post("/", (req, res) => {
  const rep = {
    id: id(),
    rangeFrom: req.body?.from ?? new Date(Date.now()-7*86400000).toISOString(),
    rangeTo: req.body?.to ?? now(),
    status: "ready" as const,
    totalOrders: DB.orders.length,
    totalAmount: DB.orders.reduce((s, o) => s + o.amount, 0),
    topProducts: [...new Set(DB.orderItems.map(i => i.name))].slice(0, 5)
  };
  DB.reports.push(rep);
  res.status(201).json(rep);
});

reports.get("/:id", (req, res) => {
  const r = DB.reports.find(x => x.id === req.params.id);
  if (!r) return res.status(404).end();
  res.json(r);
});
