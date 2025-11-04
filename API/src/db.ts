import { randomUUID as uuid } from "node:crypto";
import {
  Category, Product, Cart, CartItem, User, EmailVerificationToken, Order, OrderItem, Payment,
  Invoice, InvoiceEmailLog, DispatchOrder, DispatchStatusLog, TrackingSession, TrackingEvent,
  RefundRequest, SalesReport
} from "./models.js";
import { DispatchStatus, InvoiceEmailStatus, OrderStatus, PaymentStatus, ProductStatus, UserStatus } from "./enums.js";

export const DB = {
  users: [] as User[],
  tokens: [] as EmailVerificationToken[],
  categories: [] as Category[],
  products: [] as Product[],
  carts: [] as Cart[],
  cartItems: [] as CartItem[],
  orders: [] as Order[],
  orderItems: [] as OrderItem[],
  payments: [] as Payment[],
  invoices: [] as Invoice[],
  invoiceEmails: [] as InvoiceEmailLog[],
  dispatchOrders: [] as DispatchOrder[],
  dispatchLogs: [] as DispatchStatusLog[],
  trackingSessions: [] as TrackingSession[],
  trackingEvents: [] as TrackingEvent[],
  refunds: [] as RefundRequest[],
  reports: [] as SalesReport[]
};

// seeds mínimos
(function seed() {
  const catPan = { id: uuid(), name: "Pan" };
  const catSnack = { id: uuid(), name: "Snack" };
  DB.categories.push(catPan, catSnack);

  DB.products.push(
    { id: uuid(), name: "Pan molde sin gluten 450g", description: "Pan artesanal", price: 3990, imageUrl: "", stock: 8, status: ProductStatus.active, categoryId: catPan.id },
    { id: uuid(), name: "Galletas de arroz", description: "Snack liviano", price: 2490, imageUrl: "", stock: 0, status: ProductStatus.active, categoryId: catSnack.id }
  );

  const user: User = {
    id: uuid(), name: "Demo", email: "demo@lr.cl", address: "Santiago", phone: "+569...", status: UserStatus.active, createdAt: new Date().toISOString(), passwordHash: "demo"
  };
  DB.users.push(user);

  const cart: Cart = { id: uuid(), userId: user.id, total: 0, updatedAt: new Date().toISOString() };
  DB.carts.push(cart);
})();

export const id = () => uuid();
export const now = () => new Date().toISOString();
export const today = (plusDays = 0) => new Date(Date.now() + plusDays * 86400000).toISOString();
export const pick = <T extends object, K extends keyof T>(o: T, keys: K[]): Pick<T, K> =>
  keys.reduce((a, k) => ((a[k] = o[k]), a), {} as any);
