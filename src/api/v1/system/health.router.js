import express from "express";

const router = express.Router();

/**
 * @swagger
 * /api/v1/healthz:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and database connection
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-10-13T10:30:00.000Z
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                   description: Server uptime in seconds
 *                 database:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 database:
 *                   type: string
 *                   example: disconnected
 */
router.get("/", async (req, res) => {
  const { prisma } = req.scope.cradle;

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

export { router as healthRouter };
