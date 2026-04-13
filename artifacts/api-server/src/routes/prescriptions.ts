import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, prescriptionsTable, notificationsTable } from "@workspace/db";
import { ListPrescriptionsQueryParams, CreatePrescriptionBody, GetPrescriptionParams, UpdatePrescriptionParams, UpdatePrescriptionBody } from "@workspace/api-zod";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

async function formatPrescription(p: any) {
  const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, p.patientId));
  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, p.doctorId));

  let patientAge: number | null = null;
  if (patient?.dateOfBirth) {
    const dob = new Date(patient.dateOfBirth);
    const today = new Date();
    patientAge = today.getFullYear() - dob.getFullYear();
  }

  return {
    id: p.id,
    patientId: p.patientId,
    doctorId: p.doctorId,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown",
    patientAge,
    doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Unknown",
    items: p.items as any[],
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/prescriptions", authMiddleware, async (req, res): Promise<void> => {
  const params = ListPrescriptionsQueryParams.safeParse(req.query);

  let query = db.select().from(prescriptionsTable);

  if (req.userRole === "patient") {
    query = query.where(eq(prescriptionsTable.patientId, req.userId!)) as typeof query;
  } else if (params.success && params.data.patientId) {
    query = query.where(eq(prescriptionsTable.patientId, params.data.patientId)) as typeof query;
  }

  const prescriptions = await query.orderBy(sql`${prescriptionsTable.createdAt} DESC`);
  const result = [];
  for (const p of prescriptions) {
    result.push(await formatPrescription(p));
  }

  res.json(result);
});

router.post("/prescriptions", authMiddleware, requireRole("doctor", "admin"), async (req, res): Promise<void> => {
  const parsed = CreatePrescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [prescription] = await db.insert(prescriptionsTable).values({
    patientId: parsed.data.patientId,
    doctorId: req.userId!,
    items: parsed.data.items,
    notes: parsed.data.notes ?? null,
  }).returning();

  await db.insert(notificationsTable).values({
    userId: parsed.data.patientId,
    title: "وصفة طبية جديدة",
    message: "لديك وصفة طبية جديدة من طبيبك.",
    type: "prescription",
  });

  res.status(201).json(await formatPrescription(prescription));
});

router.get("/prescriptions/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetPrescriptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [p] = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, params.data.id));
  if (!p) {
    res.status(404).json({ error: "Prescription not found" });
    return;
  }

  res.json(await formatPrescription(p));
});

router.patch("/prescriptions/:id", authMiddleware, requireRole("doctor", "admin"), async (req, res): Promise<void> => {
  const params = UpdatePrescriptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdatePrescriptionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Prescription not found" });
    return;
  }

  if (req.userRole !== "admin" && existing.doctorId !== req.userId) {
    res.status(403).json({ error: "Not authorized to edit this prescription" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.items !== undefined) updateData.items = body.data.items;
  if (body.data.notes !== undefined) updateData.notes = body.data.notes;

  const [prescription] = await db.update(prescriptionsTable).set(updateData).where(eq(prescriptionsTable.id, params.data.id)).returning();

  res.json(await formatPrescription(prescription));
});

router.delete("/prescriptions/:id", authMiddleware, requireRole("doctor", "admin"), async (req, res): Promise<void> => {
  const params = GetPrescriptionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Prescription not found" });
    return;
  }

  if (req.userRole !== "admin" && existing.doctorId !== req.userId) {
    res.status(403).json({ error: "Not authorized to delete this prescription" });
    return;
  }

  await db.delete(prescriptionsTable).where(eq(prescriptionsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
