import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storageRouter from "./storage";
import articlesRouter from "./articles";
import ordersRouter from "./orders";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(articlesRouter);
router.use(ordersRouter);
router.use(settingsRouter);

export default router;
