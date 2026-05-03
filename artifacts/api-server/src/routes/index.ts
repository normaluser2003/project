import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import issuersRouter from "./issuers";
import certificatesRouter from "./certificates";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(issuersRouter);
router.use(certificatesRouter);
router.use(dashboardRouter);

export default router;
