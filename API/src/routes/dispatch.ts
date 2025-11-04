import { Router } from "express";
import { DB, id, now, today } from "../db.js";
import { DispatchStatus } from "../enums.js";

export const dispatch = Router();

// crear orden de despacho para pedido pagado
dispatch.post("/:orderId", (req, res) => {
  const o = DB.orders.find(x => x.id === req.params.orderId);
  if (!o) return res.status(404).end();
  const d = { id: id(), orderId: o.id, dispatchNumber: "D-" + Math.floor(Math.random()*100000), address: o.shippingAddress, status: DispatchStatus.prep, eta: today(2), createdAt: now() };
  DB.dispatchOrders.push(d);

  // primer log
  DB.dispatchLogs.push({ id: id(), dispatchOrderId: d.id, oldStatus: DispatchStatus.pending, newStatus: DispatchStatus.prep, changedBy: o.id, changedAt: now() });

  res.status(201).json(d);
});

// cambiar estado + log
dispatch.post("/:dispatchId/status", (req, res) => {
  const d = DB.dispatchOrders.find(x => x.id === req.params.dispatchId);
  if (!d) return res.status(404).end();
  const newStatus = req.body?.status as DispatchStatus;
  const oldStatus = d.status;
  d.status = newStatus;
  DB.dispatchLogs.push({ id: id(), dispatchOrderId: d.id, oldStatus, newStatus, changedBy: req.body?.by ?? d.orderId, changedAt: now() });
  res.json(d);
});

// ver logs
dispatch.get("/:dispatchId/logs", (req, res) => {
  const logs = DB.dispatchLogs.filter(l => l.dispatchOrderId === req.params.dispatchId);
  res.json(logs);
});
