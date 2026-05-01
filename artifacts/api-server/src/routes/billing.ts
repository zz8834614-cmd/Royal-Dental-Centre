import { Router, type IRouter } from "express";
import { eq, sql, desc, sum, and } from "drizzle-orm";
import { db, invoicesTable, paymentsTable, usersTable } from "@workspace/db";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

async function buildInvoiceResponse(invoice: typeof invoicesTable.$inferSelect) {
  const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, invoice.patientId));
  const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, invoice.createdById));
  const payments = await db.select().from(paymentsTable)
    .where(eq(paymentsTable.invoiceId, invoice.id))
    .orderBy(desc(paymentsTable.paymentDate));

  const paymentList = await Promise.all(payments.map(async (p) => {
    let receiverName = null;
    if (p.receivedById) {
      const [r] = await db.select().from(usersTable).where(eq(usersTable.id, p.receivedById));
      receiverName = r ? `${r.firstName} ${r.lastName}` : null;
    }
    return {
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      notes: p.notes,
      receiverName,
      paymentDate: p.paymentDate.toISOString(),
    };
  }));

  return {
    id: invoice.id,
    patientId: invoice.patientId,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown",
    patientPhone: patient?.phone ?? null,
    createdByName: creator ? `${creator.firstName} ${creator.lastName}` : "Unknown",
    description: invoice.description,
    totalAmount: Number(invoice.totalAmount),
    paidAmount: Number(invoice.paidAmount),
    remainingAmount: Number(invoice.totalAmount) - Number(invoice.paidAmount),
    status: invoice.status,
    notes: invoice.notes,
    dueDate: invoice.dueDate?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    payments: paymentList,
  };
}

router.get(
  "/invoices",
  authMiddleware,
  requireRole("admin", "receptionist"),
  async (req, res): Promise<void> => {
    const { patientId, status } = req.query as { patientId?: string; status?: string };

    let query = db.select().from(invoicesTable).$dynamic();

    const conditions = [];
    if (patientId) conditions.push(eq(invoicesTable.patientId, Number(patientId)));
    if (status) conditions.push(eq(invoicesTable.status, status as "pending" | "partial" | "paid" | "cancelled"));

    if (conditions.length > 0) query = query.where(and(...conditions));

    const invoices = await query.orderBy(desc(invoicesTable.createdAt));
    const result = await Promise.all(invoices.map(buildInvoiceResponse));
    res.json(result);
  }
);

router.get(
  "/invoices/summary",
  authMiddleware,
  requireRole("admin", "receptionist"),
  async (_req, res): Promise<void> => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dayResult] = await db
      .select({ total: sum(paymentsTable.amount) })
      .from(paymentsTable)
      .where(sql`${paymentsTable.paymentDate} >= ${startOfDay}`);

    const [monthResult] = await db
      .select({ total: sum(paymentsTable.amount) })
      .from(paymentsTable)
      .where(sql`${paymentsTable.paymentDate} >= ${startOfMonth}`);

    const [outstandingResult] = await db
      .select({ total: sql<string>`SUM(${invoicesTable.totalAmount} - ${invoicesTable.paidAmount})` })
      .from(invoicesTable)
      .where(sql`${invoicesTable.status} != 'paid' AND ${invoicesTable.status} != 'cancelled'`);

    const [totalRevenue] = await db
      .select({ total: sum(paymentsTable.amount) })
      .from(paymentsTable);

    const [invoiceCounts] = await db
      .select({
        pending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')`,
        partial: sql<number>`COUNT(*) FILTER (WHERE status = 'partial')`,
        paid: sql<number>`COUNT(*) FILTER (WHERE status = 'paid')`,
        total: sql<number>`COUNT(*)`,
      })
      .from(invoicesTable);

    res.json({
      todayIncome: Number(dayResult?.total ?? 0),
      monthIncome: Number(monthResult?.total ?? 0),
      totalRevenue: Number(totalRevenue?.total ?? 0),
      outstandingAmount: Number(outstandingResult?.total ?? 0),
      invoiceCounts: {
        pending: Number(invoiceCounts?.pending ?? 0),
        partial: Number(invoiceCounts?.partial ?? 0),
        paid: Number(invoiceCounts?.paid ?? 0),
        total: Number(invoiceCounts?.total ?? 0),
      },
    });
  }
);

router.get(
  "/invoices/:id",
  authMiddleware,
  requireRole("admin", "receptionist"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
    res.json(await buildInvoiceResponse(invoice));
  }
);

router.post(
  "/invoices",
  authMiddleware,
  requireRole("admin", "receptionist"),
  async (req, res): Promise<void> => {
    const { patientId, description, totalAmount, notes, dueDate } = req.body as {
      patientId: number; description: string; totalAmount: number; notes?: string; dueDate?: string;
    };

    if (!patientId || !description || !totalAmount) {
      res.status(400).json({ error: "patientId, description, totalAmount are required" });
      return;
    }

    const [invoice] = await db.insert(invoicesTable).values({
      patientId,
      createdById: req.userId!,
      description,
      totalAmount: String(totalAmount),
      notes: notes ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
    }).returning();

    res.status(201).json(await buildInvoiceResponse(invoice));
  }
);

router.patch(
  "/invoices/:id",
  authMiddleware,
  requireRole("admin", "receptionist"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const { description, totalAmount, notes, dueDate, status } = req.body as {
      description?: string; totalAmount?: number; notes?: string; dueDate?: string | null; status?: string;
    };

    const [existing] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Invoice not found" }); return; }

    const updates: Partial<typeof invoicesTable.$inferInsert> = { updatedAt: new Date() };
    if (description !== undefined) updates.description = description;
    if (totalAmount !== undefined) updates.totalAmount = String(totalAmount);
    if (notes !== undefined) updates.notes = notes;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) updates.status = status as "pending" | "partial" | "paid" | "cancelled";

    const [updated] = await db.update(invoicesTable).set(updates).where(eq(invoicesTable.id, id)).returning();
    res.json(await buildInvoiceResponse(updated));
  }
);

router.delete(
  "/invoices/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    await db.delete(invoicesTable).where(eq(invoicesTable.id, id));
    res.sendStatus(204);
  }
);

router.post(
  "/invoices/:id/payments",
  authMiddleware,
  requireRole("admin", "receptionist"),
  async (req, res): Promise<void> => {
    const invoiceId = Number(req.params.id);
    const { amount, method, notes } = req.body as { amount: number; method?: string; notes?: string };

    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Valid amount is required" });
      return;
    }

    const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoiceId));
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

    await db.insert(paymentsTable).values({
      invoiceId,
      amount: String(amount),
      method: (method ?? "cash") as "cash" | "card" | "insurance" | "other",
      notes: notes ?? null,
      receivedById: req.userId!,
      paymentDate: new Date(),
    });

    const newPaid = Number(invoice.paidAmount) + amount;
    const total = Number(invoice.totalAmount);
    const newStatus: "pending" | "partial" | "paid" =
      newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "pending";

    const [updated] = await db.update(invoicesTable).set({
      paidAmount: String(newPaid),
      status: newStatus,
      updatedAt: new Date(),
    }).where(eq(invoicesTable.id, invoiceId)).returning();

    res.status(201).json(await buildInvoiceResponse(updated));
  }
);

export default router;
