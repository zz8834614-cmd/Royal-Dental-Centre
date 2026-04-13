import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, usersTable, servicesTable, appointmentsTable, notificationsTable } from "@workspace/db";
import {
  ListAppointmentsQueryParams,
  CreateAppointmentBody,
  GetAppointmentParams,
  UpdateAppointmentParams,
  UpdateAppointmentBody,
  GetAvailableSlotsQueryParams,
} from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

function formatAppointment(apt: any, patient: any, doctor: any, service: any) {
  return {
    id: apt.id,
    patientId: apt.patientId,
    doctorId: apt.doctorId,
    serviceId: apt.serviceId,
    date: apt.date,
    time: apt.time,
    status: apt.status,
    notes: apt.notes,
    patientName: `${patient.firstName} ${patient.lastName}`,
    doctorName: `${doctor.firstName} ${doctor.lastName}`,
    serviceName: service.name,
    createdAt: apt.createdAt.toISOString(),
  };
}

router.get("/appointments", authMiddleware, async (req, res): Promise<void> => {
  const params = ListAppointmentsQueryParams.safeParse(req.query);

  const conditions = [];
  if (params.success) {
    if (params.data.status) conditions.push(eq(appointmentsTable.status, params.data.status));
    if (params.data.date) conditions.push(eq(appointmentsTable.date, params.data.date));
    if (params.data.doctorId) conditions.push(eq(appointmentsTable.doctorId, params.data.doctorId));
    if (params.data.patientId) conditions.push(eq(appointmentsTable.patientId, params.data.patientId));
  }

  if (req.userRole === "patient") {
    conditions.push(eq(appointmentsTable.patientId, req.userId!));
  }

  let query = db.select().from(appointmentsTable);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const appointments = await query.orderBy(sql`${appointmentsTable.createdAt} DESC`);

  const result = [];
  for (const apt of appointments) {
    const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, apt.patientId));
    const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, apt.doctorId));
    const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, apt.serviceId));
    if (patient && doctor && service) {
      result.push(formatAppointment(apt, patient, doctor, service));
    }
  }

  res.json(result);
});

router.post("/appointments", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [apt] = await db.insert(appointmentsTable).values({
    patientId: req.userId!,
    doctorId: parsed.data.doctorId,
    serviceId: parsed.data.serviceId,
    date: parsed.data.date,
    time: parsed.data.time,
    notes: parsed.data.notes ?? null,
    status: "pending",
  }).returning();

  const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.doctorId));
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, parsed.data.serviceId));

  await db.insert(notificationsTable).values({
    userId: parsed.data.doctorId,
    title: "New Appointment",
    message: `${patient.firstName} ${patient.lastName} booked an appointment for ${parsed.data.date} at ${parsed.data.time}`,
    type: "appointment",
  });

  await db.insert(notificationsTable).values({
    userId: req.userId!,
    title: "Appointment Booked",
    message: `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} on ${parsed.data.date} at ${parsed.data.time} has been booked.`,
    type: "appointment",
  });

  res.status(201).json(formatAppointment(apt, patient, doctor, service));
});

router.get("/appointments/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [apt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, params.data.id));
  if (!apt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, apt.patientId));
  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, apt.doctorId));
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, apt.serviceId));

  res.json(formatAppointment(apt, patient, doctor, service));
});

router.patch("/appointments/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = UpdateAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateAppointmentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.status !== undefined) updateData.status = body.data.status;
  if (body.data.notes !== undefined) updateData.notes = body.data.notes;
  if (body.data.date !== undefined) updateData.date = body.data.date;
  if (body.data.time !== undefined) updateData.time = body.data.time;

  const [apt] = await db.update(appointmentsTable).set(updateData).where(eq(appointmentsTable.id, params.data.id)).returning();
  if (!apt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, apt.patientId));
  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, apt.doctorId));
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, apt.serviceId));

  if (body.data.status) {
    await db.insert(notificationsTable).values({
      userId: apt.patientId,
      title: "Appointment Update",
      message: `Your appointment on ${apt.date} at ${apt.time} has been ${body.data.status}.`,
      type: "appointment",
    });
  }

  res.json(formatAppointment(apt, patient, doctor, service));
});

router.get("/appointments/available-slots", async (req, res): Promise<void> => {
  const params = GetAvailableSlotsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const booked = await db.select({ time: appointmentsTable.time })
    .from(appointmentsTable)
    .where(and(
      eq(appointmentsTable.doctorId, params.data.doctorId),
      eq(appointmentsTable.date, params.data.date),
      sql`${appointmentsTable.status} != 'cancelled'`
    ));

  const bookedTimes = new Set(booked.map(b => b.time));
  const allSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ];

  res.json(allSlots.map(time => ({
    time,
    available: !bookedTimes.has(time),
  })));
});

export default router;
