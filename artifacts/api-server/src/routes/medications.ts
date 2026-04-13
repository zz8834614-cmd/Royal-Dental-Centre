import { Router, type IRouter } from "express";
import { eq, ilike, and, sql } from "drizzle-orm";
import { db, medicationsTable } from "@workspace/db";
import { ListMedicationsQueryParams, CreateMedicationBody, DeleteMedicationParams } from "@workspace/api-zod";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/medications", authMiddleware, async (req, res): Promise<void> => {
  const params = ListMedicationsQueryParams.safeParse(req.query);

  const conditions = [];
  if (params.success) {
    if (params.data.search) {
      conditions.push(sql`${medicationsTable.name} ILIKE ${'%' + params.data.search + '%'}` as any);
    }
    if (params.data.category) {
      conditions.push(eq(medicationsTable.category, params.data.category));
    }
  }

  let query = db.select().from(medicationsTable);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const meds = await query.orderBy(medicationsTable.name);
  res.json(meds.map(m => ({
    id: m.id,
    name: m.name,
    category: m.category,
    dosageForm: m.dosageForm,
    strength: m.strength,
    description: m.description,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/medications", authMiddleware, requireRole("doctor"), async (req, res): Promise<void> => {
  const parsed = CreateMedicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [med] = await db.insert(medicationsTable).values({
    name: parsed.data.name,
    category: parsed.data.category,
    dosageForm: parsed.data.dosageForm,
    strength: parsed.data.strength,
    description: parsed.data.description ?? null,
  }).returning();

  res.status(201).json({
    id: med.id,
    name: med.name,
    category: med.category,
    dosageForm: med.dosageForm,
    strength: med.strength,
    description: med.description,
    createdAt: med.createdAt.toISOString(),
  });
});

router.delete("/medications/:id", authMiddleware, requireRole("doctor"), async (req, res): Promise<void> => {
  const params = DeleteMedicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(medicationsTable).where(eq(medicationsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
