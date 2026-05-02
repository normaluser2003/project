import { Router, type IRouter } from "express";
import healthRouter from "./health";
import issuersRouter from "./issuers";
import certificatesRouter from "./certificates";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(issuersRouter);
router.use(certificatesRouter);
router.use(dashboardRouter);

export default router;
