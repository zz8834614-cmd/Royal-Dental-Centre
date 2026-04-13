import { Router, type IRouter } from "express";
import { eq, sql, count, and, gte } from "drizzle-orm";
import { db, usersTable, appointmentsTable, servicesTable, reviewsTable, notificationsTable } from "@workspace/db";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", authMiddleware, requireRole("doctor", "admin"), async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [totalPatients] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "patient"));
  const [todayAppointments] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.date, today));
  const [pendingAppointments] = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.status, "pending"));
  const [completedToday] = await db.select({ count: count() }).from(appointmentsTable).where(and(eq(appointmentsTable.date, today), eq(appointmentsTable.status, "completed")));
  const [newPatientsThisMonth] = await db.select({ count: count() }).from(usersTable).where(and(eq(usersTable.role, "patient"), gte(usersTable.createdAt, monthStart)));
  const [cancelledThisMonth] = await db.select({ count: count() }).from(appointmentsTable).where(and(eq(appointmentsTable.status, "cancelled"), gte(appointmentsTable.createdAt, monthStart)));

  const avgRating = await db.select({ avg: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)` }).from(reviewsTable);
  const completedAppts = await db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.status, "completed"));

  res.json({
    totalPatients: totalPatients.count,
    todayAppointments: todayAppointments.count,
    pendingAppointments: pendingAppointments.count,
    completedToday: completedToday.count,
    totalRevenue: Number(completedAppts[0].count) * 50,
    averageRating: Number(avgRating[0].avg) || 0,
    newPatientsThisMonth: newPatientsThisMonth.count,
    cancelledThisMonth: cancelledThisMonth.count,
  });
});

router.get("/dashboard/appointments-by-service", authMiddleware, requireRole("doctor", "admin"), async (_req, res): Promise<void> => {
  const results = await db
    .select({
      serviceId: appointmentsTable.serviceId,
      count: count(),
    })
    .from(appointmentsTable)
    .groupBy(appointmentsTable.serviceId);

  const formatted = [];
  for (const r of results) {
    const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, r.serviceId));
    formatted.push({
      serviceName: service?.name ?? "Unknown",
      count: r.count,
    });
  }

  res.json(formatted);
});

router.get("/dashboard/recent-activity", authMiddleware, requireRole("doctor", "admin"), async (_req, res): Promise<void> => {
  const recentAppointments = await db.select().from(appointmentsTable)
    .orderBy(sql`${appointmentsTable.createdAt} DESC`).limit(10);

  const activities = [];
  let activityId = 1;

  for (const apt of recentAppointments) {
    const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, apt.patientId));
    activities.push({
      id: activityId++,
      type: "appointment" as const,
      description: `${patient?.firstName ?? "Unknown"} ${patient?.lastName ?? ""} - ${apt.status} appointment on ${apt.date}`,
      timestamp: apt.createdAt.toISOString(),
    });
  }

  res.json(activities);
});

router.get("/dashboard/daily-patient-count", authMiddleware, requireRole("doctor", "admin"), async (_req, res): Promise<void> => {
  const results = await db
    .select({
      date: appointmentsTable.date,
      count: count(),
    })
    .from(appointmentsTable)
    .groupBy(appointmentsTable.date)
    .orderBy(appointmentsTable.date)
    .limit(30);

  res.json(results.map(r => ({
    date: r.date,
    count: r.count,
  })));
});

router.get("/notifications", authMiddleware, async (req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId!))
    .orderBy(sql`${notificationsTable.createdAt} DESC`)
    .limit(50);

  res.json(notifications.map(n => ({
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.patch("/notifications/:id/read", authMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid notification ID" });
    return;
  }

  const [notification] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  });
});

export default router;
