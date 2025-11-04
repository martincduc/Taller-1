import { Router } from "express";
import { DB, id, now } from "../db.js";
import { OrderStatus, PaymentStatus } from "../enums.js";

export const payments = Router();

payments.post("/:orderId/authorize", (req, res) => {
  const order = DB.orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).end();
  const result: PaymentStatus = (req.body?.result || PaymentStatus.authorized) as any;

  const p = { id: id(), orderId: order.id, amount: order.amount, status: result, gateway: "mock", transactionId: id(), createdAt: now() };
  DB.payments.push(p);

  if (result === PaymentStatus.authorized) order.status = OrderStatus.paid;
  else if (result === PaymentStatus.rejected) order.status = OrderStatus.pending_payment;

  res.json({ payment: p, orderStatus: order.status });
});
