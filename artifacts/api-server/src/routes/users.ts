import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { ListUsersQueryParams, GetUserParams, UpdateUserParams, UpdateUserBody } from "@workspace/api-zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const router: IRouter = Router();

router.get("/team", async (_req, res): Promise<void> => {
  const doctors = await db.select().from(usersTable).where(
    eq(usersTable.role, "doctor")
  );
  const admins = await db.select().from(usersTable).where(
    eq(usersTable.role, "admin")
  );
  const all = [...doctors, ...admins].filter(u => u.speciality || u.bio);
  res.json(all.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    speciality: u.speciality,
    bio: u.bio,
  })));
});

function formatUser(u: any) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    dateOfBirth: u.dateOfBirth,
    isSubscribed: u.isSubscribed === "true",
    speciality: u.speciality,
    bio: u.bio,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/users", authMiddleware, async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  let query = db.select().from(usersTable);

  if (params.success && params.data.role) {
    query = query.where(eq(usersTable.role, params.data.role)) as typeof query;
  }

  const users = await query;
  res.json(users.map(formatUser));
});

router.get("/users/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.patch("/users/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (req.userRole !== "admin" && req.userRole !== "receptionist" && req.userId !== params.data.id) {
    res.status(403).json({ error: "Not authorized to update this user" });
    return;
  }

  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // Prevent users from changing their own role
  if (body.data.role !== undefined && req.userId === params.data.id) {
    res.status(403).json({ error: "Cannot change your own role" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.firstName !== undefined) updateData.firstName = body.data.firstName;
  if (body.data.lastName !== undefined) updateData.lastName = body.data.lastName;
  if (body.data.phone !== undefined) updateData.phone = body.data.phone;
  if (body.data.dateOfBirth !== undefined) updateData.dateOfBirth = body.data.dateOfBirth;

  if ("speciality" in body.data) updateData.speciality = body.data.speciality ?? null;
  if ("bio" in body.data) updateData.bio = body.data.bio ?? null;

  // Only admin/receptionist can change role and subscription
  if (req.userRole === "admin" || req.userRole === "receptionist") {
    if (body.data.role !== undefined) updateData.role = body.data.role;
    if (body.data.isSubscribed !== undefined) updateData.isSubscribed = body.data.isSubscribed ? "true" : "false";
  }

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.post("/users", authMiddleware, requireRole("admin"), async (req, res): Promise<void> => {
  const { firstName, lastName, email, password, role, speciality, bio, phone } = req.body;
  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ error: "firstName, lastName, email and password are required" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const [user] = await db.insert(usersTable).values({
    firstName,
    lastName,
    email,
    password: hashPassword(password),
    phone: phone ?? null,
    role: role ?? "doctor",
    speciality: speciality ?? null,
    bio: bio ?? null,
  }).returning();
  res.status(201).json(formatUser(user));
});

router.delete("/users/:id", authMiddleware, requireRole("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (id === req.userId) {
    res.status(403).json({ error: "Cannot delete your own account" });
    return;
  }
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
