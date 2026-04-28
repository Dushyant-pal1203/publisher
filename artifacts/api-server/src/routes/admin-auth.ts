import { Router, type Request, type Response } from "express";
import {
  createAdminToken,
  setAdminCookie,
  clearAdminSession,
  findAdminByEmailOrPhone,
  verifyPassword,
  createAdminUser,
  findAdminByEmail,
  findAdminByPhone,
  updateAdminLastLogin,
} from "../lib/admin-auth";
import { generateOTP, sendOTP, storeOTP, verifyOTP } from "../lib/otp-service";
import { generateGoogleAuthUrl, verifyGoogleToken } from "../lib/google-auth";

const router = Router();

// Validation functions
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePhoneNumber = (phone: string): boolean => {
  return /^[0-9]{10,15}$/.test(phone.replace(/[^0-9]/g, ""));
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// Check if admin exists (for first-time setup)
router.get("/admin-auth/check", async (req: Request, res: Response) => {
  try {
    const { db, adminUsersTable } = await import("@workspace/db");

    const admins = await db.select().from(adminUsersTable);
    const hasAdmin = admins.length > 0;

    console.log(
      `Admin check: ${hasAdmin ? `${admins.length} admin(s) found` : "No admins found"}`,
    );
    res.json({ hasAdmin });
  } catch (error) {
    console.error("Error checking admin:", error);
    res.json({ hasAdmin: false }); // Assume no admin on error
  }
});

// Email/Password Login
router.post("/admin-auth/login/email", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    const user = await findAdminByEmailOrPhone(email);

    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Update last login
    await updateAdminLastLogin(user.id);

    const token = await createAdminToken({
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
    });

    setAdminCookie(res, token);
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Send OTP for phone login
router.post(
  "/admin-auth/login/phone/send-otp",
  async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        res.status(400).json({ error: "Phone number is required" });
        return;
      }

      const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
      if (!validatePhoneNumber(cleanPhone)) {
        res.status(400).json({ error: "Invalid phone number" });
        return;
      }

      const user = await findAdminByPhone(cleanPhone);

      // For security, don't reveal if user exists or not
      if (user) {
        const otp = generateOTP();
        await storeOTP(cleanPhone, otp);
        await sendOTP(cleanPhone, otp);
      } else {
        // Auto-create user for new phone numbers
        await createAdminUser({ phoneNumber: cleanPhone });
        const otp = generateOTP();
        await storeOTP(cleanPhone, otp);
        await sendOTP(cleanPhone, otp);
      }

      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  },
);

// Verify OTP and login
router.post(
  "/admin-auth/login/phone/verify",
  async (req: Request, res: Response) => {
    try {
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber || !otp) {
        res.status(400).json({ error: "Phone number and OTP are required" });
        return;
      }

      const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
      if (!validatePhoneNumber(cleanPhone)) {
        res.status(400).json({ error: "Invalid phone number" });
        return;
      }

      if (!otp || otp.length !== 6) {
        res.status(400).json({ error: "Invalid OTP format" });
        return;
      }

      const isValid = await verifyOTP(cleanPhone, otp);

      if (!isValid) {
        res.status(401).json({ error: "Invalid or expired OTP" });
        return;
      }

      const user = await findAdminByPhone(cleanPhone);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await updateAdminLastLogin(user.id);

      const token = await createAdminToken({
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
      });

      setAdminCookie(res, token);
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  },
);

// Register first admin (only if no admin exists)
router.post("/admin-auth/register", async (req: Request, res: Response) => {
  try {
    const { db, adminUsersTable } = await import("@workspace/db");
    const { hashPassword } = await import("../lib/admin-auth");

    // Check if any admin exists
    const existingAdmins = await db.select().from(adminUsersTable);

    if (existingAdmins.length > 0) {
      res
        .status(403)
        .json({ error: "Admin already exists. Please login instead." });
      return;
    }

    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    if (!validatePassword(password)) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await createAdminUser({
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
    });

    const token = await createAdminToken({
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
    });

    setAdminCookie(res, token);
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Google OAuth login - Redirect to Google
router.get("/admin-auth/google", (req: Request, res: Response) => {
  const url = generateGoogleAuthUrl();
  console.log("Redirecting to Google OAuth URL:", url);
  res.redirect(url);
});

// Google OAuth callback - Handle Google's response
router.get(
  "/admin-auth/google/callback",
  async (req: Request, res: Response) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        console.error("No code received from Google");
        res.redirect(
          "http://localhost:3000/admin/login?error=google_auth_failed",
        );
        return;
      }

      console.log("Received Google callback with code");

      const googleUser = await verifyGoogleToken(code);
      console.log("Google user verified:", googleUser.email);

      let user = await findAdminByEmail(googleUser.email!);

      if (!user) {
        // Create new user with Google data
        console.log("Creating new user for:", googleUser.email);
        user = await createAdminUser({
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          profileImageUrl: googleUser.profileImageUrl,
          googleId: googleUser.googleId,
        });
      }

      await updateAdminLastLogin(user.id);

      const token = await createAdminToken({
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
      });

      setAdminCookie(res, token);
      console.log("Login successful, redirecting to /admin");
      res.redirect("http://localhost:3000/admin");
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(
        "http://localhost:3000/admin/login?error=google_auth_failed",
      );
    }
  },
);

// Logout
router.post("/admin-auth/logout", (req: Request, res: Response) => {
  clearAdminSession(res);
  res.json({ success: true });
});

// Get current user
router.get("/admin-auth/me", async (req: Request, res: Response) => {
  try {
    const { getAdminToken, verifyAdminToken } =
      await import("../lib/admin-auth");
    const token = getAdminToken(req);

    if (!token) {
      res.json({ user: null });
      return;
    }

    const user = await verifyAdminToken(token);
    res.json({ user });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.json({ user: null });
  }
});

export default router;
