import { Router } from "express";
import { DB, id, now } from "../db.js";
import { money } from "../util.js";

export const cart = Router();

// leer carrito de un usuario (mock: primero del store)
cart.get("/", (_req, res) => {
  const c = DB.carts[0];
  const items = DB.cartItems.filter(i => i.cartId === c.id);
  res.json({ cart: c, items });
});

// agregar item
cart.post("/items", (req, res) => {
  const c = DB.carts[0];
  const { productId, qty } = req.body ?? {};
  const p = DB.products.find(x => x.id === productId);
  if (!p) throw new Error("product not found");
  if (p.stock < qty) throw new Error("insufficient stock");
  const existing = DB.cartItems.find(i => i.cartId === c.id && i.productId === productId);
  if (existing) {
    existing.qty += qty; existing.subtotal = money(existing.qty * existing.price);
  } else {
    DB.cartItems.push({
      id: id(), cartId: c.id, productId: p.id, name: p.name, price: p.price, qty, subtotal: money(p.price * qty)
    });
  }
  c.updatedAt = now();
  c.total = DB.cartItems.filter(i => i.cartId === c.id).reduce((s, i) => s + i.subtotal, 0);
  res.status(201).json({ cart: c, items: DB.cartItems.filter(i => i.cartId === c.id) });
});

// vaciar
cart.delete("/items", (_req, res) => {
  const c = DB.carts[0];
  DB.cartItems = DB.cartItems.filter(i => i.cartId !== c.id);
  c.total = 0;
  res.status(204).end();
});
