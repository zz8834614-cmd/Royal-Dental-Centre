import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await db.select().from(siteSettingsTable);
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  res.json(result);
});

router.put("/settings", authMiddleware, requireRole("admin"), async (req, res): Promise<void> => {
  const body = req.body as Record<string, string>;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string") continue;
    const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
    if (existing.length > 0) {
      await db.update(siteSettingsTable).set({ value, updatedAt: new Date() }).where(eq(siteSettingsTable.key, key));
    } else {
      await db.insert(siteSettingsTable).values({ key, value });
    }
  }

  const settings = await db.select().from(siteSettingsTable);
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  res.json(result);
});

export default router;
