import { db, otpVerificationsTable, adminUsersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// For development - logs OTP to console
// For production, integrate with SMS service like Twilio, Vonage, etc.
export const sendOTP = async (
  phoneNumber: string,
  otp: string,
): Promise<boolean> => {
  // Development mode - log to console
  console.log(`\n=========================================`);
  console.log(`📱 OTP VERIFICATION`);
  console.log(`Phone: ${phoneNumber}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Valid for: ${OTP_EXPIRY_MINUTES} minutes`);
  console.log(`=========================================\n`);

  // TODO: For production, uncomment and configure your SMS provider
  /*
  // Example with Twilio
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Your verification code is: ${otp}`,
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER,
  });
  */

  return true;
};

export const storeOTP = async (
  phoneNumber: string,
  otp: string,
): Promise<void> => {
  // Delete old unused OTPs for this number
  await db
    .delete(otpVerificationsTable)
    .where(
      and(
        eq(otpVerificationsTable.phoneNumber, phoneNumber),
        eq(otpVerificationsTable.isUsed, false),
      ),
    );

  // Store new OTP
  await db.insert(otpVerificationsTable).values({
    phoneNumber,
    otp,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    isUsed: false,
  });
};

export const verifyOTP = async (
  phoneNumber: string,
  otp: string,
): Promise<boolean> => {
  const [verification] = await db
    .select()
    .from(otpVerificationsTable)
    .where(
      and(
        eq(otpVerificationsTable.phoneNumber, phoneNumber),
        eq(otpVerificationsTable.otp, otp),
        eq(otpVerificationsTable.isUsed, false),
        gt(otpVerificationsTable.expiresAt, new Date()),
      ),
    );

  if (!verification) {
    return false;
  }

  // Mark OTP as used
  await db
    .update(otpVerificationsTable)
    .set({ isUsed: true })
    .where(eq(otpVerificationsTable.id, verification.id));

  return true;
};
