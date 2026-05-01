import { pgTable, text, serial, timestamp, integer, boolean, time } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const scheduleSettingsTable = pgTable("schedule_settings", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(),
  isOpen: boolean("is_open").notNull().default(true),
  openTime: text("open_time").notNull().default("09:00"),
  closeTime: text("close_time").notNull().default("17:30"),
  slotDuration: integer("slot_duration").notNull().default(30),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scheduleBlocksTable = pgTable("schedule_blocks", {
  id: serial("id").primaryKey(),
  blockedDate: text("blocked_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  reason: text("reason"),
  isFullDay: boolean("is_full_day").notNull().default(false),
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ScheduleSetting = typeof scheduleSettingsTable.$inferSelect;
export type ScheduleBlock = typeof scheduleBlocksTable.$inferSelect;
