import { Router, type IRouter } from "express";
import { eq, and, sql, inArray } from "drizzle-orm";
import { db, usersTable, servicesTable, appointmentsTable, notificationsTable, scheduleSettingsTable, scheduleBlocksTable } from "@workspace/db";
import {
  ListAppointmentsQueryParams,
  CreateAppointmentBody,
  GetAppointmentParams,
  UpdateAppointmentParams,
  UpdateAppointmentBody,
} from "@workspace/api-zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const router: IRouter = Router();

router.post("/appointments/book", authMiddleware, async (req, res): Promise<void> => {
  const { serviceId, date, time, notes } = req.body;
  if (!serviceId || !date || !time) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const svcId = parseInt(serviceId, 10);
  if (isNaN(svcId)) { res.status(400).json({ error: "Invalid serviceId" }); return; }
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, svcId));
  if (!service) { res.status(400).json({ error: "Service not found" }); return; }

  const doctors = await db.select().from(usersTable).where(eq(usersTable.role, "doctor"));
  if (doctors.length === 0) { res.status(503).json({ error: "No doctors available" }); return; }
  const doctor = doctors[0];

  const [apt] = await db.insert(appointmentsTable).values({
    patientId: req.userId!,
    doctorId: doctor.id,
    serviceId: svcId,
    date,
    time,
    notes: notes || null,
    status: "pending",
  }).returning();

  res.status(201).json({ success: true, appointmentId: apt.id });
});

router.post("/appointments/public", async (req, res): Promise<void> => {
  const { firstName, lastName, phone, serviceId, date, time, notes } = req.body;
  if (!firstName || !lastName || !phone || !serviceId || !date || !time) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const svcId = parseInt(serviceId, 10);
  if (isNaN(svcId)) {
    res.status(400).json({ error: "Invalid serviceId" });
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, svcId));
  if (!service) {
    res.status(400).json({ error: "Service not found" });
    return;
  }

  const guestEmail = `guest_${phone.replace(/\D/g, "")}@royal-guest.com`;
  let patient: typeof usersTable.$inferSelect;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, guestEmail));
  if (existing) {
    await db.update(usersTable).set({ firstName, lastName, phone }).where(eq(usersTable.id, existing.id));
    patient = { ...existing, firstName, lastName, phone };
  } else {
    const [created] = await db.insert(usersTable).values({
      firstName,
      lastName,
      email: guestEmail,
      password: hashPassword(phone),
      phone,
      role: "patient",
    }).returning();
    patient = created;
  }

  const doctors = await db.select().from(usersTable).where(eq(usersTable.role, "doctor"));
  if (doctors.length === 0) {
    res.status(503).json({ error: "No doctors available" });
    return;
  }
  const doctor = doctors[0];

  const [apt] = await db.insert(appointmentsTable).values({
    patientId: patient.id,
    doctorId: doctor.id,
    serviceId: svcId,
    date,
    time,
    notes: notes || null,
    status: "pending",
  }).returning();

  res.status(201).json({ success: true, appointmentId: apt.id });
});

function formatAppointment(apt: any, patient: any, doctor: any, service: any) {
  return {
    id: apt.id,
    patientId: apt.patientId,
    doctorId: apt.doctorId,
    serviceId: apt.serviceId,
    date: apt.date,
    time: apt.time,
    status: apt.status,
    visitStatus: apt.visitStatus ?? "not_arrived",
    notes: apt.notes,
    queuePosition: apt.queuePosition ?? null,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientPhone: patient.phone ?? null,
    doctorName: `${doctor.firstName} ${doctor.lastName}`,
    serviceName: service.name,
    patientIsSubscribed: patient.isSubscribed === "true",
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

  const appointments = await query.orderBy(
    sql`COALESCE(${appointmentsTable.queuePosition}, 9999)`,
    sql`${appointmentsTable.createdAt} DESC`
  );

  if (appointments.length === 0) {
    res.json([]);
    return;
  }

  // Batch fetch related data to avoid N+1 queries
  const patientIds = [...new Set(appointments.map(a => a.patientId))];
  const doctorIds = [...new Set(appointments.map(a => a.doctorId))];
  const serviceIds = [...new Set(appointments.map(a => a.serviceId))];

  const [patients, doctors, services] = await Promise.all([
    db.select().from(usersTable).where(inArray(usersTable.id, patientIds)),
    db.select().from(usersTable).where(inArray(usersTable.id, doctorIds)),
    db.select().from(servicesTable).where(inArray(servicesTable.id, serviceIds)),
  ]);

  const patientMap = new Map(patients.map(p => [p.id, p]));
  const doctorMap = new Map(doctors.map(d => [d.id, d]));
  const serviceMap = new Map(services.map(s => [s.id, s]));

  const result = appointments
    .filter(apt => patientMap.has(apt.patientId) && doctorMap.has(apt.doctorId) && serviceMap.has(apt.serviceId))
    .map(apt => formatAppointment(apt, patientMap.get(apt.patientId)!, doctorMap.get(apt.doctorId)!, serviceMap.get(apt.serviceId)!));

  res.json(result);
});

router.post("/appointments/by-receptionist", authMiddleware, requireRole("receptionist", "admin"), async (req, res): Promise<void> => {
  const { patientId, doctorId, serviceId, date, time, notes } = req.body;
  if (!patientId || !doctorId || !serviceId || !date || !time) {
    res.status(400).json({ error: "patientId, doctorId, serviceId, date, time are required" });
    return;
  }
  const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, Number(patientId)));
  const [doctor] = await db.select().from(usersTable).where(eq(usersTable.id, Number(doctorId)));
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, Number(serviceId)));
  if (!patient || !doctor || !service) {
    res.status(404).json({ error: "Patient, doctor or service not found" });
    return;
  }
  const nextPos = (await db.select().from(appointmentsTable)
    .where(and(eq(appointmentsTable.status, "confirmed"), eq(appointmentsTable.date, String(date))))
  ).length + 1;
  const [apt] = await db.insert(appointmentsTable).values({
    patientId: Number(patientId),
    doctorId: Number(doctorId),
    serviceId: Number(serviceId),
    date: String(date),
    time,
    notes: notes ?? null,
    status: "confirmed",
    queuePosition: nextPos,
  }).returning();
  await db.insert(notificationsTable).values({
    userId: Number(patientId),
    title: "تم حجز موعد لك",
    message: `تم حجز موعدك مع الدكتور ${doctor.firstName} ${doctor.lastName} في ${date} الساعة ${time}.`,
    type: "appointment",
  });
  res.status(201).json(formatAppointment(apt, patient, doctor, service));
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
    title: "موعد جديد",
    message: `${patient.firstName} ${patient.lastName} حجز موعداً في ${parsed.data.date} الساعة ${parsed.data.time}`,
    type: "appointment",
  });

  await db.insert(notificationsTable).values({
    userId: req.userId!,
    title: "تم الحجز",
    message: `تم حجز موعدك مع الدكتور ${doctor.firstName} ${doctor.lastName} في ${parsed.data.date} الساعة ${parsed.data.time}.`,
    type: "appointment",
  });

  res.status(201).json(formatAppointment(apt, patient, doctor, service));
});

function generateSlots(openTime: string, closeTime: string, slotMinutes: number): string[] {
  const slots: string[] = [];
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  let cur = oh * 60 + om;
  const end = ch * 60 + cm;
  while (cur + slotMinutes <= end) {
    const h = String(Math.floor(cur / 60)).padStart(2, "0");
    const m = String(cur % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    cur += slotMinutes;
  }
  return slots;
}

router.get("/appointments/available-slots", async (req, res): Promise<void> => {
  const { date, doctorId } = req.query as { date?: string; doctorId?: string };
  if (!date || !doctorId) {
    res.status(400).json({ error: "date and doctorId are required" });
    return;
  }
  const docId = parseInt(doctorId, 10);
  if (isNaN(docId)) { res.status(400).json({ error: "Invalid doctorId" }); return; }

  const dateObj = new Date(date + "T00:00:00");
  const dayOfWeek = dateObj.getDay();

  const [daySetting] = await db.select().from(scheduleSettingsTable)
    .where(eq(scheduleSettingsTable.dayOfWeek, dayOfWeek));

  const isOpen = daySetting?.isOpen ?? true;
  const openTime = daySetting?.openTime ?? "09:00";
  const closeTime = daySetting?.closeTime ?? "17:30";
  const slotDuration = daySetting?.slotDuration ?? 30;

  if (!isOpen) { res.json([]); return; }

  const [fullDayBlock] = await db.select().from(scheduleBlocksTable)
    .where(and(eq(scheduleBlocksTable.blockedDate, date), eq(scheduleBlocksTable.isFullDay, true)));
  if (fullDayBlock) { res.json([]); return; }

  const [partialBlocks, booked] = await Promise.all([
    db.select().from(scheduleBlocksTable)
      .where(and(eq(scheduleBlocksTable.blockedDate, date), eq(scheduleBlocksTable.isFullDay, false))),
    db.select({ time: appointmentsTable.time })
      .from(appointmentsTable)
      .where(and(
        eq(appointmentsTable.doctorId, docId),
        eq(appointmentsTable.date, date),
        sql`${appointmentsTable.status} != 'cancelled'`
      )),
  ]);

  const bookedTimes = new Set(booked.map(b => b.time));
  const allSlots = generateSlots(openTime, closeTime, slotDuration);

  res.json(allSlots.map(time => {
    const [h, m] = time.split(":").map(Number);
    const slotMin = h * 60 + m;
    const blocked = partialBlocks.some(block => {
      if (!block.startTime || !block.endTime) return false;
      const [bsh, bsm] = block.startTime.split(":").map(Number);
      const [beh, bem] = block.endTime.split(":").map(Number);
      return slotMin >= bsh * 60 + bsm && slotMin < beh * 60 + bem;
    });
    return { time, available: !bookedTimes.has(time) && !blocked };
  }));
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

  const [[patient], [doctor], [service]] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, apt.patientId)),
    db.select().from(usersTable).where(eq(usersTable.id, apt.doctorId)),
    db.select().from(servicesTable).where(eq(servicesTable.id, apt.serviceId)),
  ]);

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

  const [existing] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  if (req.userRole === "patient") {
    if (existing.patientId !== req.userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    if (body.data.status && body.data.status !== "cancelled") {
      res.status(403).json({ error: "Patients can only cancel appointments" });
      return;
    }
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.status !== undefined) updateData.status = body.data.status;
  if (body.data.notes !== undefined) updateData.notes = body.data.notes;
  if (body.data.date !== undefined && req.userRole !== "receptionist") updateData.date = body.data.date;
  if (body.data.time !== undefined && req.userRole !== "receptionist") updateData.time = body.data.time;
  if (body.data.queuePosition !== undefined) updateData.queuePosition = body.data.queuePosition;
  if ((req.body as any).visitStatus !== undefined) updateData.visitStatus = (req.body as any).visitStatus;

  const [apt] = await db.update(appointmentsTable).set(updateData).where(eq(appointmentsTable.id, params.data.id)).returning();
  if (!apt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const [[patient], [doctor], [service]] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, apt.patientId)),
    db.select().from(usersTable).where(eq(usersTable.id, apt.doctorId)),
    db.select().from(servicesTable).where(eq(servicesTable.id, apt.serviceId)),
  ]);

  if (body.data.status) {
    const statusMsg: Record<string, string> = {
      confirmed: "تم تأكيد موعدك",
      cancelled: "تم إلغاء موعدك",
      completed: "تم إتمام موعدك",
    };
    await db.insert(notificationsTable).values({
      userId: apt.patientId,
      title: "تحديث الموعد",
      message: `${statusMsg[body.data.status] || "تم تحديث موعدك"} في ${apt.date} الساعة ${apt.time}.`,
      type: "appointment",
    });
  }

  res.json(formatAppointment(apt, patient, doctor, service));
});

export default router;
