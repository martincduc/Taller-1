import { Router } from "express";
import { DB, id, now } from "../db.js";
import { OrderStatus } from "../enums.js";
import { money } from "../util.js";

export const orders = Router();

orders.post("/", (req, res) => {
  const { email, address } = req.body ?? {};
  const cart = DB.carts[0];
  const items = DB.cartItems.filter(i => i.cartId === cart.id);
  if (!items.length) throw new Error("empty cart");

  const total = items.reduce((s, i) => s + i.subtotal, 0) + 4000;
  const orderId = id();
  DB.orders.push({
    id: orderId,
    number: "O-" + Math.floor(Math.random() * 100000),
    customerEmail: email,
    shippingAddress: address,
    status: OrderStatus.pending_payment,
    amount: money(total),
    createdAt: now()
  });
  items.forEach(i => DB.orderItems.push({ id: id(), orderId, productId: i.productId, name: i.name, price: i.price, qty: i.qty, subtotal: i.subtotal }));
  // (opcional) reservar stock
  res.status(201).json({ orderId });
});

orders.get("/:id", (req, res) => {
  const o = DB.orders.find(x => x.id === req.params.id);
  if (!o) return res.status(404).end();
  const items = DB.orderItems.filter(i => i.orderId === o.id);
  res.json({ order: o, items });
});
