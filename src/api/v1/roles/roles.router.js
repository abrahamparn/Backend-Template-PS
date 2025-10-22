import express from "express";
import rolesController from "./roles.controller.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { checkPermission } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: List all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles with permission counts
 *       403:
 *         description: Insufficient permissions (requires roles:view)
 */
router.get("/", checkPermission("roles:view"), rolesController.listRoles);

/**
 * @swagger
 * /api/v1/roles/permissions:
 *   get:
 *     summary: List available permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of permissions
 *       403:
 *         description: Insufficient permissions (requires roles:view)
 */
router.get("/permissions", checkPermission("roles:view"), rolesController.listPermissions);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
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
 *         description: Role details
 *       403:
 *         description: Insufficient permissions (requires roles:view)
 */
router.get("/:id", checkPermission("roles:view"), rolesController.getRoleById);

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Role created
 *       403:
 *         description: Insufficient permissions (requires roles:create)
 */
router.post("/", checkPermission("roles:create"), rolesController.createRole);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   patch:
 *     summary: Update a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: Insufficient permissions (requires roles:update)
 */
router.patch("/:id", checkPermission("roles:update"), rolesController.updateRole);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
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
 *         description: Role deleted
 *       403:
 *         description: Insufficient permissions (requires roles:delete)
 */
router.delete("/:id", checkPermission("roles:delete"), rolesController.deleteRole);

/**
 * @swagger
 * /api/v1/roles/{id}/permissions:
 *   post:
 *     summary: Assign a permission to a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionId:
 *                 type: string
 *               permissionCode:
 *                 type: string
 *             description: Provide either permissionId or permissionCode.
 *     responses:
 *       200:
 *         description: Permission assigned
 *       403:
 *         description: Insufficient permissions (requires permissions:assign)
 */
router.post(
  "/:id/permissions",
  checkPermission("permissions:assign"),
  rolesController.assignPermission
);

/**
 * @swagger
 * /api/v1/roles/{id}/permissions/{permissionId}:
 *   delete:
 *     summary: Revoke a permission from a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID to revoke.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionId:
 *                 type: string
 *               permissionCode:
 *                 type: string
 *             description: Provide either permissionId or permissionCode.
 *     responses:
 *       200:
 *         description: Permission revoked
 *       403:
 *         description: Insufficient permissions (requires permissions:assign)
 */
router.delete(
  "/:id/permissions/:permissionId",
  checkPermission("permissions:assign"),
  rolesController.revokePermission
);

export { router as rolesRouter };
