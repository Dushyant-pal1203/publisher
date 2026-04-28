import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { type Request, type Response } from "express";
import { db, adminUsersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

export const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this";
export const ADMIN_COOKIE = "admin_token";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AdminUser {
  id: number;
  email: string | null;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const createAdminToken = async (user: AdminUser): Promise<string> => {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
  return token;
};

export const verifyAdminToken = async (
  token: string,
): Promise<AdminUser | null> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const [user] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.id, decoded.id));

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
    };
  } catch (error) {
    return null;
  }
};

export const getAdminToken = (req: Request): string | undefined => {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[ADMIN_COOKIE];
};

export const clearAdminSession = (res: Response): void => {
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
};

export const setAdminCookie = (res: Response, token: string): void => {
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
};

export const findAdminByEmail = async (email: string) => {
  if (!email) return null;
  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.email, email));
  return user;
};

export const findAdminByPhone = async (phoneNumber: string) => {
  if (!phoneNumber) return null;
  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.phoneNumber, phoneNumber));
  return user;
};

export const findAdminByEmailOrPhone = async (identifier: string) => {
  if (!identifier) return null;
  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(
      or(
        eq(adminUsersTable.email, identifier),
        eq(adminUsersTable.phoneNumber, identifier),
      ),
    );
  return user;
};

export const createAdminUser = async (data: {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  googleId?: string;
  profileImageUrl?: string;
}) => {
  const [user] = await db
    .insert(adminUsersTable)
    .values({
      email: data.email || null,
      phoneNumber: data.phoneNumber || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      password: data.password || null,
      googleId: data.googleId || null,
      profileImageUrl: data.profileImageUrl || null,
      role: "admin",
      isActive: true,
    })
    .returning();
  return user;
};

export const updateAdminLastLogin = async (id: number) => {
  await db
    .update(adminUsersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsersTable.id, id));
};
