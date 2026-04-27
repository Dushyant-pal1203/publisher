import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  publisherName: text("publisher_name").notNull().default("My Publishing House"),
  tagline: text("tagline"),
  about: text("about"),
  whatsappNumber: text("whatsapp_number").notNull().default(""),
  contactEmail: text("contact_email"),
  contactAddress: text("contact_address"),
  currency: text("currency").notNull().default("INR"),
  upiId: text("upi_id"),
  bankDetails: text("bank_details"),
  paymentInstructions: text("payment_instructions"),
});

export type Settings = typeof settingsTable.$inferSelect;
