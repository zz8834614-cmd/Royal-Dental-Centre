import { Router, type IRouter } from "express";
import { eq, or, and, sql, inArray } from "drizzle-orm";
import { db, usersTable, conversationsTable, messagesTable, messageReactionsTable } from "@workspace/db";
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

  const allParticipantIds = [...new Set(convs.flatMap(c => [c.participant1Id, c.participant2Id]))];
  const allUsers = await db.select().from(usersTable).where(inArray(usersTable.id, allParticipantIds));
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  const convIds = convs.map(c => c.id);
  const allLastMsgs = await db.select().from(messagesTable)
    .where(inArray(messagesTable.conversationId, convIds))
    .orderBy(sql`${messagesTable.createdAt} DESC`);

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
    const lastContent = lastMsg
      ? lastMsg.messageType === "image" ? "📷 صورة"
        : lastMsg.messageType === "file" ? `📎 ${lastMsg.fileName ?? "ملف"}`
        : lastMsg.content
      : null;
    return {
      id: c.id,
      participantIds: [c.participant1Id, c.participant2Id],
      participantNames: [
        p1 ? `${p1.firstName} ${p1.lastName}` : "Unknown",
        p2 ? `${p2.firstName} ${p2.lastName}` : "Unknown",
      ],
      lastMessage: lastContent,
      lastMessageAt: lastMsg?.createdAt?.toISOString() ?? null,
      unreadCount: 0,
      createdAt: c.createdAt.toISOString(),
    };
  });

  res.json(result);
});

router.post("/conversations", authMiddleware, async (req, res): Promise<void> => {
  const participantId = Number(req.body?.participantId);
  if (!participantId || isNaN(participantId)) {
    res.status(400).json({ error: "participantId is required" });
    return;
  }

  const existing = await db.select().from(conversationsTable).where(
    or(
      and(eq(conversationsTable.participant1Id, req.userId!), eq(conversationsTable.participant2Id, participantId)),
      and(eq(conversationsTable.participant1Id, participantId), eq(conversationsTable.participant2Id, req.userId!))
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
    participant2Id: participantId,
  }).returning();

  const [p1Users, p2Users] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, conv.participant1Id)),
    db.select().from(usersTable).where(eq(usersTable.id, conv.participant2Id)),
  ]);

  res.status(201).json({
    id: conv.id,
    participantIds: [conv.participant1Id, conv.participant2Id],
    participantNames: [
      p1Users[0] ? `${p1Users[0].firstName} ${p1Users[0].lastName}` : "Unknown",
      p2Users[0] ? `${p2Users[0].firstName} ${p2Users[0].lastName}` : "Unknown",
    ],
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
    createdAt: conv.createdAt.toISOString(),
  });
});

router.get("/messages", authMiddleware, async (req, res): Promise<void> => {
  const conversationId = Number(req.query?.conversationId);
  if (!conversationId || isNaN(conversationId)) {
    res.status(400).json({ error: "conversationId is required" });
    return;
  }

  const msgs = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(messagesTable.createdAt);

  if (msgs.length === 0) {
    res.json([]);
    return;
  }

  const senderIds = [...new Set(msgs.map(m => m.senderId))];
  const senders = await db.select().from(usersTable).where(inArray(usersTable.id, senderIds));
  const senderMap = new Map(senders.map(s => [s.id, s]));

  const msgIds = msgs.map(m => m.id);
  const reactions = await db.select().from(messageReactionsTable)
    .where(inArray(messageReactionsTable.messageId, msgIds));

  const reactionsMap = new Map<number, { emoji: string; userId: number }[]>();
  for (const r of reactions) {
    if (!reactionsMap.has(r.messageId)) reactionsMap.set(r.messageId, []);
    reactionsMap.get(r.messageId)!.push({ emoji: r.emoji, userId: r.userId });
  }

  res.json(msgs.map(m => {
    const sender = senderMap.get(m.senderId);
    const rawReactions = reactionsMap.get(m.id) ?? [];
    const grouped: Record<string, number[]> = {};
    for (const r of rawReactions) {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push(r.userId);
    }
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown",
      content: m.content,
      messageType: m.messageType,
      fileName: m.fileName ?? null,
      fileData: m.fileData ?? null,
      reactions: grouped,
      createdAt: m.createdAt.toISOString(),
    };
  }));
});

router.post("/messages", authMiddleware, async (req, res): Promise<void> => {
  const { conversationId, content, messageType, fileName, fileData } = req.body ?? {};

  if (!conversationId || !content) {
    res.status(400).json({ error: "conversationId and content are required" });
    return;
  }

  const type = ["text", "image", "file"].includes(messageType) ? messageType : "text";

  const [msg] = await db.insert(messagesTable).values({
    conversationId: Number(conversationId),
    senderId: req.userId!,
    content: String(content),
    messageType: type,
    fileName: fileName ? String(fileName) : null,
    fileData: fileData ? String(fileData) : null,
  }).returning();

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  res.status(201).json({
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown",
    content: msg.content,
    messageType: msg.messageType,
    fileName: msg.fileName ?? null,
    fileData: msg.fileData ?? null,
    reactions: {},
    createdAt: msg.createdAt.toISOString(),
  });
});

router.post("/messages/:id/reactions", authMiddleware, async (req, res): Promise<void> => {
  const msgId = parseInt(req.params.id);
  if (isNaN(msgId)) {
    res.status(400).json({ error: "Invalid message id" });
    return;
  }

  const emoji = req.body?.emoji;
  if (!emoji || typeof emoji !== "string" || emoji.trim().length === 0) {
    res.status(400).json({ error: "emoji is required" });
    return;
  }

  const existing = await db.select().from(messageReactionsTable).where(
    and(
      eq(messageReactionsTable.messageId, msgId),
      eq(messageReactionsTable.userId, req.userId!),
      eq(messageReactionsTable.emoji, emoji)
    )
  );

  if (existing.length > 0) {
    await db.delete(messageReactionsTable).where(eq(messageReactionsTable.id, existing[0].id));
    res.json({ removed: true, emoji });
    return;
  }

  await db.insert(messageReactionsTable).values({
    messageId: msgId,
    userId: req.userId!,
    emoji,
  });

  res.status(201).json({ added: true, emoji });
});

export default router;
