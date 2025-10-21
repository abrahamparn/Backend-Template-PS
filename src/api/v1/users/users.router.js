import express from "express";
import usersController from "./users.controller.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { checkPermission } from "../../middleware/rbac.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Insufficient permissions (requires users:view)
 */
router.get("/", checkPermission("users:view"), usersController.getUsers);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       403:
 *         description: Insufficient permissions (requires users:view)
 */
router.get("/:id", checkPermission("users:view"), usersController.getUserById);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: User created
 *       403:
 *         description: Insufficient permissions (requires users:create)
 */
router.post("/", checkPermission("users:create"), usersController.createUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Insufficient permissions (requires users:update)
 */
router.patch("/:id", checkPermission("users:update"), usersController.updateUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Insufficient permissions (requires users:delete)
 */
router.delete("/:id", checkPermission("users:delete"), usersController.deleteUser);

export { router as usersRouter };
