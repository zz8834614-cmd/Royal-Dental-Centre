import { Router, type IRouter } from "express";
import { eq, ilike, and, sql, count } from "drizzle-orm";
import { db, usersTable, appointmentsTable } from "@workspace/db";
import { ListPatientsQueryParams, GetPatientParams } from "@workspace/api-zod";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/patients", authMiddleware, requireRole("doctor", "admin"), async (req, res): Promise<void> => {
  const params = ListPatientsQueryParams.safeParse(req.query);

  const conditions = [eq(usersTable.role, "patient")];
  if (params.success && params.data.search) {
    conditions.push(
      sql`(${usersTable.firstName} ILIKE ${'%' + params.data.search + '%'} OR ${usersTable.lastName} ILIKE ${'%' + params.data.search + '%'} OR ${usersTable.email} ILIKE ${'%' + params.data.search + '%'})` as any
    );
  }

  const patients = await db.select().from(usersTable).where(and(...conditions));

  const result = [];
  for (const p of patients) {
    const appointmentCount = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.patientId, p.id));
    const lastApt = await db.select().from(appointmentsTable).where(eq(appointmentsTable.patientId, p.id)).orderBy(sql`${appointmentsTable.createdAt} DESC`).limit(1);

    result.push({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      dateOfBirth: p.dateOfBirth,
      medicalHistory: p.medicalHistory,
      allergies: p.allergies,
      totalAppointments: appointmentCount[0]?.count ?? 0,
      lastVisit: lastApt[0]?.date ?? null,
      createdAt: p.createdAt.toISOString(),
    });
  }

  res.json(result);
});

router.get("/patients/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetPatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [p] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!p) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const appointmentCount = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.patientId, p.id));
  const lastApt = await db.select().from(appointmentsTable).where(eq(appointmentsTable.patientId, p.id)).orderBy(sql`${appointmentsTable.createdAt} DESC`).limit(1);

  res.json({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone,
    dateOfBirth: p.dateOfBirth,
    medicalHistory: p.medicalHistory,
    allergies: p.allergies,
    totalAppointments: appointmentCount[0]?.count ?? 0,
    lastVisit: lastApt[0]?.date ?? null,
    createdAt: p.createdAt.toISOString(),
  });
});

export default router;
