import { OAuth2Client } from "google-auth-library";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(
    "Google OAuth credentials not found. Google login will not work.",
  );
}

// IMPORTANT: This should be your Next.js app URL
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const CALLBACK_URL = `${APP_URL}/api/admin-auth/google/callback`;

console.log("Google OAuth Callback URL:", CALLBACK_URL);

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  CALLBACK_URL,
);

export const generateGoogleAuthUrl = (): string => {
  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["email", "profile"],
    prompt: "consent",
  });
  console.log("Generated Google Auth URL:", url);
  return url;
};

export const verifyGoogleToken = async (code: string) => {
  console.log(
    "Verifying Google token with code:",
    code.substring(0, 10) + "...",
  );
  const { tokens } = await googleClient.getToken(code);
  console.log("Got tokens, verifying ID token...");

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  console.log("Google payload received:", {
    email: payload?.email,
    name: payload?.name,
  });

  return {
    email: payload?.email,
    firstName: payload?.given_name,
    lastName: payload?.family_name,
    profileImageUrl: payload?.picture,
    googleId: payload?.sub,
  };
};
