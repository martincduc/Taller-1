import { Router } from "express";
import { DB, id, now } from "../db.js";
import { UserStatus } from "../enums.js";

export const auth = Router();

// registro (mock)
auth.post("/register", (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password) throw new Error("name/email/password required");
  if (DB.users.some(u => u.email === email)) throw new Error("email exists");
  const user = { id: id(), name, email, status: UserStatus.pending_verification, createdAt: now(), passwordHash: password };
  DB.users.push(user);
  res.json({ user });
});

// login (mock)
auth.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const u = DB.users.find(x => x.email === email && x.passwordHash === password);
  if (!u) throw new Error("invalid credentials");
  res.json({ user: u });
});
