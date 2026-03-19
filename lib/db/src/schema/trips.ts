import { pgTable, text, serial, timestamp, integer, real, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tripStatusEnum = pgEnum("trip_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  driverId: integer("driver_id")
    .notNull()
    .references(() => usersTable.id),
  notes: text("notes"),
  amount: real("amount"),
  status: tripStatusEnum("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
