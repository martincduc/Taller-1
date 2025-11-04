import { DispatchStatus, InvoiceEmailStatus, OrderStatus, PaymentStatus, ProductStatus, UserStatus } from "./enums.js";

export type UUID = string; // usamos uuid()

export interface User {
  id: UUID;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  status: UserStatus;
  createdAt: string;
  passwordHash: string; // mock
}

export interface EmailVerificationToken {
  id: UUID;
  userId: UUID;
  token: string;
  expiresAt: string;
}

export interface Category { id: UUID; name: string; }

export interface Product {
  id: UUID;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock: number;
  status: ProductStatus;
  categoryId: UUID;
}

export interface StockReservation { id: UUID; productId: UUID; qty: number; expiresAt: string; }
export interface StockItem { productId: UUID; qty: number; }

export interface Cart { id: UUID; userId?: UUID; total: number; updatedAt: string; }
export interface CartItem { id: UUID; cartId: UUID; productId: UUID; name: string; price: number; qty: number; subtotal: number; }

export interface Order {
  id: UUID;
  number: string;
  customerEmail: string;
  shippingAddress: string;
  status: OrderStatus;
  amount: number;
  createdAt: string;
}

export interface OrderItem { id: UUID; orderId: UUID; productId: UUID; name: string; price: number; qty: number; subtotal: number; }

export interface Payment {
  id: UUID; orderId: UUID; amount: number; status: PaymentStatus;
  gateway: string; transactionId?: string; createdAt: string;
}

export interface Invoice {
  id: UUID; orderId: UUID; folio: string; totalAmount: number; taxAmount: number; pdfUrl: string; createdAt: string;
}

export interface InvoiceEmailLog {
  id: UUID; invoiceId: UUID; toEmail: string; status: InvoiceEmailStatus; attempts: number; lastAttemptAt: string;
}

export interface DispatchOrder {
  id: UUID; orderId: UUID; dispatchNumber: string; address: string; status: DispatchStatus; eta: string; createdAt: string;
}

export interface DispatchStatusLog {
  id: UUID; dispatchOrderId: UUID; oldStatus: DispatchStatus; newStatus: DispatchStatus; changedBy: UUID; changedAt: string;
}

export interface TrackingSession {
  id: UUID; dispatchOrderId: UUID; currentStatus: DispatchStatus; lastLocation?: string; eta?: string; lastUpdateAt: string;
}

export interface TrackingEvent {
  id: UUID; trackingSessionId: UUID; status: DispatchStatus; timestamp: string; note?: string;
}

export interface RefundRequest {
  id: UUID; orderId: UUID; reason: string; refundAmount: number; status: "pending" | "approved" | "rejected"; createdAt: string;
}

export interface SalesReport {
  id: UUID; rangeFrom: string; rangeTo: string; status: "ready" | "empty"; totalOrders: number; totalAmount: number; topProducts: string[];
}
