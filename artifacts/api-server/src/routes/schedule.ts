import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, scheduleSettingsTable, scheduleBlocksTable } from "@workspace/db";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const DEFAULT_SCHEDULE = [
  { dayOfWeek: 0, isOpen: false, openTime: "09:00", closeTime: "17:30", slotDuration: 30 }, // Sun
  { dayOfWeek: 1, isOpen: true, openTime: "09:00", closeTime: "17:30", slotDuration: 30 },  // Mon
  { dayOfWeek: 2, isOpen: true, openTime: "09:00", closeTime: "17:30", slotDuration: 30 },  // Tue
  { dayOfWeek: 3, isOpen: true, openTime: "09:00", closeTime: "17:30", slotDuration: 30 },  // Wed
  { dayOfWeek: 4, isOpen: true, openTime: "09:00", closeTime: "17:30", slotDuration: 30 },  // Thu
  { dayOfWeek: 5, isOpen: true, openTime: "09:00", closeTime: "14:00", slotDuration: 30 },  // Fri
  { dayOfWeek: 6, isOpen: true, openTime: "09:00", closeTime: "13:00", slotDuration: 30 },  // Sat
];

async function ensureDefaults() {
  const existing = await db.select().from(scheduleSettingsTable);
  if (existing.length === 0) {
    await db.insert(scheduleSettingsTable).values(DEFAULT_SCHEDULE);
  }
}

router.get("/schedule", async (_req, res): Promise<void> => {
  await ensureDefaults();
  const settings = await db.select().from(scheduleSettingsTable).orderBy(scheduleSettingsTable.dayOfWeek);
  res.json(settings);
});

router.get("/schedule/blocks", async (req, res): Promise<void> => {
  const { from, to } = req.query as { from?: string; to?: string };
  let query = db.select().from(scheduleBlocksTable).$dynamic();
  const blocks = await db.select().from(scheduleBlocksTable).orderBy(scheduleBlocksTable.blockedDate);
  const filtered = blocks.filter((b) => {
    if (from && b.blockedDate < from) return false;
    if (to && b.blockedDate > to) return false;
    return true;
  });
  res.json(filtered);
});

router.put(
  "/schedule/:dayOfWeek",
  authMiddleware,
  requireRole("admin", "receptionist"),
  async (req, res): Promise<void> => {
    const dayOfWeek = Number(req.params.dayOfWeek);
    const { isOpen, openTime, closeTime, slotDuration } = req.body as {
      isOpen?: boolean; openTime?: string; closeTime?: string; slotDuration?: number;
    };

    await ensureDefaults();
    const [existing] = await db.select().from(scheduleSettingsTable)
      .where(eq(scheduleSettingsTable.dayOfWeek, dayOfWeek));

    const updates: Partial<typeof scheduleSettingsTable.$inferInsert> = { updatedAt: new Date() };
    if (isOpen !== undefined) updates.isOpen = isOpen;
    if (openTime !== undefined) updates.openTime = openTime;
    if (closeTime !== undefined) updates.closeTime = closeTime;
    if (slotDuration !== undefined) updates.slotDuration = slotDuration;

    if (existing) {
      const [updated] = await db.update(scheduleSettingsTable).set(updates)
        .where(eq(scheduleSettingsTable.dayOfWeek, dayOfWeek)).returning();
      res.json(updated);
    } else {
      const [created] = await db.insert(scheduleSettingsTable).values({
        dayOfWeek,
        isOpen: isOpen ?? true,
        openTime: openTime ?? "09:00",
        closeTime: closeTime ?? "17:30",
        slotDuration: slotDuration ?? 30,
      }).returning();
      res.json(created);
    }
  }
);

router.post(
  "/schedule/blocks",
  authMiddleware,
  requireRole("admin", "receptionist"),
  async (req, res): Promise<void> => {
    const { blockedDate, startTime, endTime, reason, isFullDay } = req.body as {
      blockedDate: string; startTime?: string; endTime?: string; reason?: string; isFullDay?: boolean;
    };
    if (!blockedDate) { res.status(400).json({ error: "blockedDate required" }); return; }
    const [block] = await db.insert(scheduleBlocksTable).values({
      blockedDate,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
      reason: reason ?? null,
      isFullDay: isFullDay ?? false,
      createdById: req.userId!,
    }).returning();
    res.status(201).json(block);
  }
);

router.delete(
  "/schedule/blocks/:id",
  authMiddleware,
  requireRole("admin", "receptionist"),
  async (req, res): Promise<void> => {
    await db.delete(scheduleBlocksTable).where(eq(scheduleBlocksTable.id, Number(req.params.id)));
    res.sendStatus(204);
  }
);

export default router;
