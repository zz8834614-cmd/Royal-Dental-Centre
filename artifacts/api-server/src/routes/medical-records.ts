import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, usersTable, medicalRecordsTable } from "@workspace/db";
import {
  ListMedicalRecordsQueryParams,
  CreateMedicalRecordBody,
  UpdateMedicalRecordParams,
  UpdateMedicalRecordBody,
} from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/medical-records", authMiddleware, async (req, res): Promise<void> => {
  const params = ListMedicalRecordsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const records = await db.select().from(medicalRecordsTable)
    .where(eq(medicalRecordsTable.patientId, params.data.patientId))
    .orderBy(medicalRecordsTable.createdAt);

  if (records.length === 0) {
    res.json([]);
    return;
  }

  // Batch fetch doctors
  const doctorIds = [...new Set(records.map(r => r.doctorId))];
  const doctors = await db.select().from(usersTable).where(inArray(usersTable.id, doctorIds));
  const doctorMap = new Map(doctors.map(d => [d.id, d]));

  res.json(records.map(r => {
    const doctor = doctorMap.get(r.doctorId);
    return {
      id: r.id,
      patientId: r.patientId,
      doctorId: r.doctorId,
      doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Unknown",
      diagnosis: r.diagnosis,
      treatment: r.treatment,
      notes: r.notes,
      toothNumber: r.toothNumber,
      createdAt: r.createdAt.toISOString(),
    };
  }));
});

router.post("/medical-records", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreateMedicalRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.insert(medicalRecordsTable).values({
    patientId: parsed.data.patientId,
    doctorId: req.userId!,
    diagnosis: parsed.data.diagnosis,
    treatment: parsed.data.treatment,
    notes: parsed.data.notes ?? null,
    toothNumber: parsed.data.toothNumber ?? null,
  }).returning();

  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  res.status(201).json({
    id: record.id,
    patientId: record.patientId,
    doctorId: record.doctorId,
    doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Unknown",
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    notes: record.notes,
    toothNumber: record.toothNumber,
    createdAt: record.createdAt.toISOString(),
  });
});

router.patch("/medical-records/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = UpdateMedicalRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateMedicalRecordBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [record] = await db.update(medicalRecordsTable).set(body.data).where(eq(medicalRecordsTable.id, params.data.id)).returning();
  if (!record) {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, record.doctorId));

  res.json({
    id: record.id,
    patientId: record.patientId,
    doctorId: record.doctorId,
    doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Unknown",
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    notes: record.notes,
    toothNumber: record.toothNumber,
    createdAt: record.createdAt.toISOString(),
  });
});

export default router;
