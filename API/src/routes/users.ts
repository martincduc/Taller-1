import { Router } from "express";
import { DB } from "../db.js";

export const users = Router();

users.get("/", (_req, res) => res.json(DB.users));
users.get("/:id", (req, res) => {
  const u = DB.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).end();
  res.json(u);
});
