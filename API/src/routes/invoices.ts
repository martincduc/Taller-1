import { Router } from "express";
import { DB, id, now } from "../db.js";
import { InvoiceEmailStatus } from "../enums.js";

export const invoices = Router();

// emitir boleta de un pedido
invoices.post("/:orderId", (req, res) => {
  const order = DB.orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).end();
  const inv = {
    id: id(), orderId: order.id, folio: "F" + Math.floor(Math.random() * 999999),
    totalAmount: order.amount, taxAmount: Math.round(order.amount * 0.19),
    pdfUrl: `https://fake/boleta/${order.id}.pdf`, createdAt: now()
  };
  DB.invoices.push(inv);
  res.status(201).json(inv);
});

// log envío email
invoices.post("/:invoiceId/send-email", (req, res) => {
  const inv = DB.invoices.find(i => i.id === req.params.invoiceId);
  if (!inv) return res.status(404).end();
  const to = req.body?.to ?? "cliente@correo.cl";
  const log = { id: id(), invoiceId: inv.id, toEmail: to, status: InvoiceEmailStatus.sent, attempts: 1, lastAttemptAt: now() };
  DB.invoiceEmails.push(log);
  res.status(201).json(log);
});
