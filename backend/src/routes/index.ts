import { Router } from "express";
import observacionesRouter from "./observaciones";

const router = Router();

router.use("/observaciones", observacionesRouter);

router.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "soy_conservacion_backend",
    message: "API operativa",
    timestamp: new Date().toISOString(),
  });
});

export default router;
