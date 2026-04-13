import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { ListUsersQueryParams, GetUserParams, UpdateUserParams, UpdateUserBody } from "@workspace/api-zod";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

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

  const updateData: Record<string, unknown> = {};
  if (body.data.firstName !== undefined) updateData.firstName = body.data.firstName;
  if (body.data.lastName !== undefined) updateData.lastName = body.data.lastName;
  if (body.data.phone !== undefined) updateData.phone = body.data.phone;
  if (body.data.dateOfBirth !== undefined) updateData.dateOfBirth = body.data.dateOfBirth;

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

export default router;
