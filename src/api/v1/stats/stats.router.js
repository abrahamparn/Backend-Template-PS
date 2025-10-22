import express from "express";
import statsController from "./stats.controller.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { checkPermission } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/stats/user-activity:
 *   get:
 *     summary: Get user activity statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Inclusive ISO date to start the range (default last 30 days)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Inclusive ISO date to end the range (defaults to today)
 *     responses:
 *       200:
 *         description: Aggregated user activity metrics
 *       403:
 *         description: Insufficient permissions (requires reports:view)
 */
router.get(
  "/user-activity",
  checkPermission("reports:view"),
  statsController.getUserActivity
);

export { router as statsRouter };
