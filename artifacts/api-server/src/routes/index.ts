import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import tripsRouter from "./trips.js";
import whatsappRouter from "./whatsapp.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/trips", tripsRouter);
router.use("/whatsapp", whatsappRouter);

export default router;
