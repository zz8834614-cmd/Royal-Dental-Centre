import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { ListUsersQueryParams, GetUserParams, UpdateUserParams, UpdateUserBody } from "@workspace/api-zod";
import { authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/users", authMiddleware, async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  let query = db.select().from(usersTable);

  if (params.success && params.data.role) {
    query = query.where(eq(usersTable.role, params.data.role)) as typeof query;
  }

  const users = await query;
  res.json(users.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    dateOfBirth: u.dateOfBirth,
    createdAt: u.createdAt.toISOString(),
  })));
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

  res.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    dateOfBirth: user.dateOfBirth,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/:id", authMiddleware, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (req.userRole !== "admin" && req.userId !== params.data.id) {
    res.status(403).json({ error: "Not authorized to update this user" });
    return;
  }

  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [user] = await db.update(usersTable).set(body.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    dateOfBirth: user.dateOfBirth,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
