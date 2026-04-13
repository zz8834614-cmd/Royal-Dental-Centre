import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, servicesTable } from "@workspace/db";
import { CreateServiceBody, UpdateServiceParams, UpdateServiceBody, DeleteServiceParams } from "@workspace/api-zod";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/services", async (_req, res): Promise<void> => {
  const services = await db.select().from(servicesTable).orderBy(servicesTable.createdAt);
  res.json(services.map(s => ({
    id: s.id,
    name: s.name,
    nameAr: s.nameAr,
    description: s.description,
    descriptionAr: s.descriptionAr,
    duration: s.duration,
    price: Number(s.price),
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/services", authMiddleware, requireRole("doctor", "admin"), async (req, res): Promise<void> => {
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [service] = await db.insert(servicesTable).values({
    name: parsed.data.name,
    nameAr: parsed.data.nameAr,
    description: parsed.data.description,
    descriptionAr: parsed.data.descriptionAr,
    duration: parsed.data.duration,
    price: String(parsed.data.price),
    isActive: true,
  }).returning();

  res.status(201).json({
    id: service.id,
    name: service.name,
    nameAr: service.nameAr,
    description: service.description,
    descriptionAr: service.descriptionAr,
    duration: service.duration,
    price: Number(service.price),
    isActive: service.isActive,
    createdAt: service.createdAt.toISOString(),
  });
});

router.patch("/services/:id", authMiddleware, requireRole("doctor", "admin"), async (req, res): Promise<void> => {
  const params = UpdateServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateServiceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.name !== undefined) updateData.name = body.data.name;
  if (body.data.nameAr !== undefined) updateData.nameAr = body.data.nameAr;
  if (body.data.description !== undefined) updateData.description = body.data.description;
  if (body.data.descriptionAr !== undefined) updateData.descriptionAr = body.data.descriptionAr;
  if (body.data.duration !== undefined) updateData.duration = body.data.duration;
  if (body.data.price !== undefined) updateData.price = String(body.data.price);
  if (body.data.isActive !== undefined) updateData.isActive = body.data.isActive;

  const [service] = await db.update(servicesTable).set(updateData).where(eq(servicesTable.id, params.data.id)).returning();
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  res.json({
    id: service.id,
    name: service.name,
    nameAr: service.nameAr,
    description: service.description,
    descriptionAr: service.descriptionAr,
    duration: service.duration,
    price: Number(service.price),
    isActive: service.isActive,
    createdAt: service.createdAt.toISOString(),
  });
});

router.delete("/services/:id", authMiddleware, requireRole("doctor", "admin"), async (req, res): Promise<void> => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    await db.delete(servicesTable).where(eq(servicesTable.id, params.data.id));
    res.sendStatus(204);
  } catch (err: any) {
    if (err?.message?.includes("foreign key constraint") || err?.message?.includes("violates foreign key")) {
      res.status(409).json({ error: "لا يمكن حذف هذه الخدمة لأنها مرتبطة بمواعيد أو مراجعات موجودة. يمكنك تعطيلها بدلاً من حذفها." });
    } else {
      throw err;
    }
  }
});

export default router;
