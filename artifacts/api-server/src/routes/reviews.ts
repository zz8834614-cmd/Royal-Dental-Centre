import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, servicesTable, reviewsTable } from "@workspace/db";
import { ListReviewsQueryParams, CreateReviewBody } from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsQueryParams.safeParse(req.query);

  let query = db.select().from(reviewsTable);
  if (params.success && params.data.serviceId) {
    query = query.where(eq(reviewsTable.serviceId, params.data.serviceId)) as typeof query;
  }

  const reviews = await query.orderBy(sql`${reviewsTable.createdAt} DESC`);

  const result = [];
  for (const r of reviews) {
    const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, r.patientId));
    let serviceName: string | null = null;
    if (r.serviceId) {
      const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, r.serviceId));
      serviceName = service?.name ?? null;
    }
    result.push({
      id: r.id,
      patientId: r.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown",
      serviceId: r.serviceId,
      serviceName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    });
  }

  res.json(result);
});

router.post("/reviews", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    patientId: req.userId!,
    serviceId: parsed.data.serviceId ?? null,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  }).returning();

  const [patient] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  let serviceName: string | null = null;
  if (review.serviceId) {
    const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, review.serviceId));
    serviceName = service?.name ?? null;
  }

  res.status(201).json({
    id: review.id,
    patientId: review.patientId,
    patientName: `${patient.firstName} ${patient.lastName}`,
    serviceId: review.serviceId,
    serviceName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
