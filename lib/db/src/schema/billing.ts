import { pgTable, text, serial, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "insurance", "other"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["pending", "partial", "paid", "cancelled"]);

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => usersTable.id),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id),
  description: text("description").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: invoiceStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoicesTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull().default("cash"),
  notes: text("notes"),
  receivedById: integer("received_by_id").references(() => usersTable.id),
  paymentDate: timestamp("payment_date", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true, createdAt: true, updatedAt: true, paidAmount: true, status: true,
});
export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true });

export type Invoice = typeof invoicesTable.$inferSelect;
export type Payment = typeof paymentsTable.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
