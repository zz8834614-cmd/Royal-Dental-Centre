import { Router, type IRouter } from "express";
import { eq, or, and, sql, inArray } from "drizzle-orm";
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

  if (convs.length === 0) {
    res.json([]);
    return;
  }

  // Batch fetch all participants in one query
  const allParticipantIds = [...new Set(convs.flatMap(c => [c.participant1Id, c.participant2Id]))];
  const allUsers = await db.select().from(usersTable).where(inArray(usersTable.id, allParticipantIds));
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // Batch fetch last message per conversation
  const convIds = convs.map(c => c.id);
  const allLastMsgs = await db.select().from(messagesTable)
    .where(inArray(messagesTable.conversationId, convIds))
    .orderBy(sql`${messagesTable.createdAt} DESC`);

  // Group by conversationId and keep only the first (latest) per conversation
  const lastMsgMap = new Map<number, typeof allLastMsgs[0]>();
  for (const msg of allLastMsgs) {
    if (!lastMsgMap.has(msg.conversationId)) {
      lastMsgMap.set(msg.conversationId, msg);
    }
  }

  const result = convs.map(c => {
    const p1 = userMap.get(c.participant1Id);
    const p2 = userMap.get(c.participant2Id);
    const lastMsg = lastMsgMap.get(c.id);
    return {
      id: c.id,
      participantIds: [c.participant1Id, c.participant2Id],
      participantNames: [
        p1 ? `${p1.firstName} ${p1.lastName}` : "Unknown",
        p2 ? `${p2.firstName} ${p2.lastName}` : "Unknown",
      ],
      lastMessage: lastMsg?.content ?? null,
      lastMessageAt: lastMsg?.createdAt?.toISOString() ?? null,
      unreadCount: 0,
      createdAt: c.createdAt.toISOString(),
    };
  });

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
    const [p1, p2] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, c.participant1Id)),
      db.select().from(usersTable).where(eq(usersTable.id, c.participant2Id)),
    ]);
    res.status(201).json({
      id: c.id,
      participantIds: [c.participant1Id, c.participant2Id],
      participantNames: [
        p1[0] ? `${p1[0].firstName} ${p1[0].lastName}` : "Unknown",
        p2[0] ? `${p2[0].firstName} ${p2[0].lastName}` : "Unknown",
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

  const [p1Users, p2Users] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, conv.participant1Id)),
    db.select().from(usersTable).where(eq(usersTable.id, conv.participant2Id)),
  ]);
  const p1 = p1Users[0];
  const p2 = p2Users[0];

  res.status(201).json({
    id: conv.id,
    participantIds: [conv.participant1Id, conv.participant2Id],
    participantNames: [
      p1 ? `${p1.firstName} ${p1.lastName}` : "Unknown",
      p2 ? `${p2.firstName} ${p2.lastName}` : "Unknown",
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

  if (msgs.length === 0) {
    res.json([]);
    return;
  }

  // Batch fetch senders
  const senderIds = [...new Set(msgs.map(m => m.senderId))];
  const senders = await db.select().from(usersTable).where(inArray(usersTable.id, senderIds));
  const senderMap = new Map(senders.map(s => [s.id, s]));

  res.json(msgs.map(m => {
    const sender = senderMap.get(m.senderId);
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown",
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    };
  }));
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
    senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown",
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
