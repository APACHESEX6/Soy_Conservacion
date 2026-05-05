import { Router } from "express";
import logger from "../utils/logger";

const healthRouter: Router = Router();

/**
 * Health check endpoint for load balancers/k8s
 * Returns 200 if the service is healthy
 */
healthRouter.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
  logger.debug("Health check performed");
});

/**
 * Readiness probe for k8s
 * Returns 200 only when the service is fully ready to handle traffic
 * Add database connectivity checks here as needed
 */
healthRouter.get("/ready", async (_req, res) => {
  try {
    // TODO: Add database connectivity check
    // const dbHealthy = await checkDatabaseConnection();
    // if (!dbHealthy) {
    //   return res.status(503).json({ status: "not_ready", reason: "database" });
    // }

    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
      checks: {
        // database: dbHealthy,
        // redis: redisHealthy,
      },
    });
  } catch (error) {
    logger.error("Readiness check failed", { error });
    res.status(503).json({
      status: "not_ready",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Liveness probe for k8s
 * Returns 500 if the service should be restarted
 */
healthRouter.get("/live", (_req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

export default healthRouter;
