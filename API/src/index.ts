import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.js";
import { notFound } from "./middleware/notFound.js";

import { auth } from "./routes/auth.js";
import { users } from "./routes/users.js";
import { catalog } from "./routes/catalog.js";
import { cart } from "./routes/cart.js";
import { orders } from "./routes/orders.js";
import { payments } from "./routes/payments.js";
import { invoices } from "./routes/invoices.js";
import { dispatch } from "./routes/dispatch.js";
import { tracking } from "./routes/tracking.js";
import { refunds } from "./routes/refunds.js";
import { reports } from "./routes/reports.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ ok: true, name: "Libre & Rico API" }));

app.use("/auth", auth);
app.use("/users", users);
app.use("/catalog", catalog);
app.use("/cart", cart);
app.use("/orders", orders);
app.use("/payments", payments);
app.use("/invoices", invoices);
app.use("/dispatch", dispatch);
app.use("/tracking", tracking);
app.use("/refunds", refunds);
app.use("/reports", reports);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
