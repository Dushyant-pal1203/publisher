import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  text,
  integer,
} from "drizzle-orm/pg-core";

export const adminUsersTable = pgTable("admin_users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).unique(),
  phoneNumber: varchar("phone_number", { length: 20 }).unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  password: varchar("password", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }).unique(),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").notNull().default(true),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const otpVerificationsTable = pgTable("otp_verifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AdminUser = typeof adminUsersTable.$inferSelect;
export type InsertAdminUser = typeof adminUsersTable.$inferInsert;
export type OTPVerification = typeof otpVerificationsTable.$inferSelect;
