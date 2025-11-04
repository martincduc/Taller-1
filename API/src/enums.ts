export enum UserStatus { active = "active", pending_verification = "pending_verification" }

export enum ProductStatus { active = "active", archived = "archived" }

export enum OrderStatus { confirmed="confirmed", pending_payment="pending_payment", paid="paid", cancelled="cancelled" }

export enum PaymentStatus { initiated="initiated", authorized="authorized", rejected="rejected", cancelled="cancelled" }

export enum DispatchStatus { pending="pending", prep="prep", shipped="shipped", delivered="delivered" }

export enum InvoiceEmailStatus { sent="sent", bounced="bounced", retried="retried" }
