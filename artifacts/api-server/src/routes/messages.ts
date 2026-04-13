import { Router, type IRouter } from "express";
import { eq, or, and, sql, count } from "drizzle-orm";
import { db, usersTable, conversationsTable, messagesTable } from "@workspace/db";
import { ListMessagesQueryParams, SendMessageBody, CreateConversationBody } from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/conversations", authMiddleware, async (req, res): Promise<void> => {
  const convs = await db.select().from(conversationsTable).where(
    or(
      eq(conversationsTable.participant1Id, req.userId!),
      eq(conversationsTable.participant2Id, req.userId!)
    )
  ).orderBy(sql`${conversationsTable.createdAt} DESC`);

  const result = [];
  for (const c of convs) {
    const [p1] = await db.select().from(usersTable).where(eq(usersTable.id, c.participant1Id));
    const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, c.participant2Id));

    const lastMsg = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, c.id))
      .orderBy(sql`${messagesTable.createdAt} DESC`)
      .limit(1);

    result.push({
      id: c.id,
      participantIds: [c.participant1Id, c.participant2Id],
      participantNames: [
        p1 ? `${p1.firstName} ${p1.lastName}` : "Unknown",
        p2 ? `${p2.firstName} ${p2.lastName}` : "Unknown",
      ],
      lastMessage: lastMsg[0]?.content ?? null,
      lastMessageAt: lastMsg[0]?.createdAt?.toISOString() ?? null,
      unreadCount: 0,
      createdAt: c.createdAt.toISOString(),
    });
  }

  res.json(result);
});

router.post("/conversations", authMiddleware, async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(conversationsTable).where(
    or(
      and(eq(conversationsTable.participant1Id, req.userId!), eq(conversationsTable.participant2Id, parsed.data.participantId)),
      and(eq(conversationsTable.participant1Id, parsed.data.participantId), eq(conversationsTable.participant2Id, req.userId!))
    )
  );

  if (existing.length > 0) {
    const c = existing[0];
    const [p1] = await db.select().from(usersTable).where(eq(usersTable.id, c.participant1Id));
    const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, c.participant2Id));
    res.status(201).json({
      id: c.id,
      participantIds: [c.participant1Id, c.participant2Id],
      participantNames: [
        `${p1.firstName} ${p1.lastName}`,
        `${p2.firstName} ${p2.lastName}`,
      ],
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: 0,
      createdAt: c.createdAt.toISOString(),
    });
    return;
  }

  const [conv] = await db.insert(conversationsTable).values({
    participant1Id: req.userId!,
    participant2Id: parsed.data.participantId,
  }).returning();

  const [p1] = await db.select().from(usersTable).where(eq(usersTable.id, conv.participant1Id));
  const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, conv.participant2Id));

  res.status(201).json({
    id: conv.id,
    participantIds: [conv.participant1Id, conv.participant2Id],
    participantNames: [
      `${p1.firstName} ${p1.lastName}`,
      `${p2.firstName} ${p2.lastName}`,
    ],
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
    createdAt: conv.createdAt.toISOString(),
  });
});

router.get("/messages", authMiddleware, async (req, res): Promise<void> => {
  const params = ListMessagesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const msgs = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.conversationId))
    .orderBy(messagesTable.createdAt);

  const result = [];
  for (const m of msgs) {
    const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, m.senderId));
    result.push({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown",
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    });
  }

  res.json(result);
});

router.post("/messages", authMiddleware, async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    conversationId: parsed.data.conversationId,
    senderId: req.userId!,
    content: parsed.data.content,
  }).returning();

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  res.status(201).json({
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: `${sender.firstName} ${sender.lastName}`,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
