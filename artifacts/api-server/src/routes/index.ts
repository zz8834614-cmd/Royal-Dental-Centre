import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import servicesRouter from "./services";
import appointmentsRouter from "./appointments";
import patientsRouter from "./patients";
import medicalRecordsRouter from "./medical-records";
import medicationsRouter from "./medications";
import prescriptionsRouter from "./prescriptions";
import messagesRouter from "./messages";
import announcementsRouter from "./announcements";
import reviewsRouter from "./reviews";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(servicesRouter);
router.use(appointmentsRouter);
router.use(patientsRouter);
router.use(medicalRecordsRouter);
router.use(medicationsRouter);
router.use(prescriptionsRouter);
router.use(messagesRouter);
router.use(announcementsRouter);
router.use(reviewsRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);
router.use(settingsRouter);

export default router;
