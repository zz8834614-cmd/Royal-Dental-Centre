import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const defaultUsers = [
  {
    firstName: "Admin",
    lastName: "Royal",
    email: "admin@royal.com",
    password: hashPassword("Admin@2024"),
    phone: "+213555000001",
    role: "admin" as const,
    dateOfBirth: "1990-01-01",
  },
  {
    firstName: "Dr. Ahmed",
    lastName: "Benali",
    email: "doctor@royal.com",
    password: hashPassword("Doctor@2024"),
    phone: "+213555000002",
    role: "doctor" as const,
    dateOfBirth: "1985-03-15",
  },
  {
    firstName: "Receptionist",
    lastName: "Royal",
    email: "reception@royal.com",
    password: hashPassword("Reception@2024"),
    phone: "+213555000003",
    role: "receptionist" as const,
    dateOfBirth: "1992-06-20",
  },
];

export async function seedDefaultUsers(): Promise<void> {
  for (const userData of defaultUsers) {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, userData.email));
    if (existing.length === 0) {
      await db.insert(usersTable).values(userData);
      console.log(`[seed] Created default ${userData.role}: ${userData.email}`);
    }
  }
}
