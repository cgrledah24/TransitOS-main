import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messageDirectionEnum = pgEnum("message_direction", [
  "inbound",
  "outbound",
]);

export const whatsappConfigTable = pgTable("whatsapp_config", {
  id: serial("id").primaryKey(),
  phoneNumberId: text("phone_number_id"),
  accessToken: text("access_token"),
  verifyToken: text("verify_token"),
  businessAccountId: text("business_account_id"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappMessagesTable = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  messageId: text("message_id"),
  contactPhone: text("contact_phone").notNull(),
  contactName: text("contact_name"),
  body: text("body").notNull(),
  direction: messageDirectionEnum("direction").notNull(),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessagesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;
export type WhatsappMessage = typeof whatsappMessagesTable.$inferSelect;
export type WhatsappConfig = typeof whatsappConfigTable.$inferSelect;
