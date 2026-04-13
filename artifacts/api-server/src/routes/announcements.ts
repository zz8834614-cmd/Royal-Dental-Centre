import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, announcementsTable } from "@workspace/db";
import { CreateAnnouncementBody, DeleteAnnouncementParams } from "@workspace/api-zod";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/announcements", async (_req, res): Promise<void> => {
  const announcements = await db.select().from(announcementsTable)
    .orderBy(sql`${announcementsTable.createdAt} DESC`);

  const result = [];
  for (const a of announcements) {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, a.authorId));
    result.push({
      id: a.id,
      title: a.title,
      titleAr: a.titleAr,
      content: a.content,
      contentAr: a.contentAr,
      type: a.type,
      isActive: a.isActive,
      authorName: author ? `${author.firstName} ${author.lastName}` : "Unknown",
      createdAt: a.createdAt.toISOString(),
    });
  }

  res.json(result);
});

router.post("/announcements", authMiddleware, requireRole("doctor", "admin"), async (req, res): Promise<void> => {
  const parsed = CreateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [announcement] = await db.insert(announcementsTable).values({
    title: parsed.data.title,
    titleAr: parsed.data.titleAr,
    content: parsed.data.content,
    contentAr: parsed.data.contentAr,
    type: parsed.data.type,
    authorId: req.userId!,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  res.status(201).json({
    id: announcement.id,
    title: announcement.title,
    titleAr: announcement.titleAr,
    content: announcement.content,
    contentAr: announcement.contentAr,
    type: announcement.type,
    isActive: announcement.isActive,
    authorName: `${author.firstName} ${author.lastName}`,
    createdAt: announcement.createdAt.toISOString(),
  });
});

router.delete("/announcements/:id", authMiddleware, requireRole("doctor", "admin"), async (req, res): Promise<void> => {
  const params = DeleteAnnouncementParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(announcementsTable).where(eq(announcementsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
