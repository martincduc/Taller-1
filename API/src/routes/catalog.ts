import { Router } from "express";
import { DB, id } from "../db.js";
import { ProductStatus } from "../enums.js";

export const catalog = Router();

// categorías y productos
catalog.get("/categories", (_req, res) => res.json(DB.categories));
catalog.get("/products", (req, res) => {
  const q = (req.query.q as string)?.toLowerCase();
  let data = DB.products.filter(p => p.status === ProductStatus.active);
  if (q) data = data.filter(p => p.name.toLowerCase().includes(q));
  res.json(data);
});
catalog.post("/products", (req, res) => {
  const { name, description, price, stock, categoryId } = req.body ?? {};
  const p = { id: id(), name, description, price, stock, status: ProductStatus.active, categoryId, imageUrl: "" };
  DB.products.push(p);
  res.status(201).json(p);
});
