import { Router } from "express";
import adminAuthRoutes from "./admin-auth";
import articleRoutes from "./articles";
import orderRoutes from "./orders";
import settingsRoutes from "./settings";
import storageRoutes from "./storage";

const router = Router();

// Admin auth routes (no auth required)
router.use(adminAuthRoutes);

// Protected routes (auth required)
router.use("/articles", articleRoutes);
router.use("/orders", orderRoutes);
router.use("/settings", settingsRoutes);
router.use("/storage", storageRoutes);

export default router;
