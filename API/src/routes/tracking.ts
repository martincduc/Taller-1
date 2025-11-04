import { Router } from "express";
import { DB, id, now } from "../db.js";
import { DispatchStatus } from "../enums.js";

export const tracking = Router();

tracking.post("/:dispatchId/session", (req, res) => {
  const d = DB.dispatchOrders.find(x => x.id === req.params.dispatchId);
  if (!d) return res.status(404).end();
  const s = { id: id(), dispatchOrderId: d.id, currentStatus: d.status, lastLocation: "SCL", lastUpdateAt: now() };
  DB.trackingSessions.push(s);
  res.status(201).json(s);
});

tracking.post("/events/:sessionId", (req, res) => {
  const s = DB.trackingSessions.find(x => x.id === req.params.sessionId);
  if (!s) return res.status(404).end();
  const status = req.body?.status as DispatchStatus;
  const e = { id: id(), trackingSessionId: s.id, status, timestamp: now(), note: req.body?.note };
  DB.trackingEvents.push(e);
  s.currentStatus = status; s.lastUpdateAt = e.timestamp;
  res.status(201).json(e);
});

tracking.get("/events/:sessionId", (req, res) => {
  res.json(DB.trackingEvents.filter(x => x.trackingSessionId === req.params.sessionId));
});
