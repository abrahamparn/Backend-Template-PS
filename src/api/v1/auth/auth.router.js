import express from "express";
import authController from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { loginSchema, refreshTokenSchema, registerationSchema } from "./auth.validator.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { authLimiter } from "../../middleware/ratelimit.middleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           example: johndoe
 *           description: User's username
 *         password:
 *           type: string
 *           minLength: 1
 *           example: SecurePass123!
 *           description: User's password
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             refreshToken:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: 123e4567-e89b-12d3-a456-426614174000
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: john@example.com
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 role:
 *                   type: string
 *                   enum: [USER, ADMIN, SUPER_ADMIN]
 *                   example: USER
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - username
 *         - name
 *         - password
 *         - confirmPassword
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: johndoe@example.com
 *         username:
 *           type: string
 *           minLength: 3
 *           example: johndoe
 *         name:
 *           type: string
 *           minLength: 3
 *           example: John Doe
 *         phoneNumber:
 *           type: string
 *           minLength: 12
 *           example: "+123456789012"
 *           description: Optional E.164 formatted phone number
 *         password:
 *           type: string
 *           minLength: 8
 *           example: "StrongPass123!"
 *         confirmPassword:
 *           type: string
 *           minLength: 8
 *           example: "StrongPass123!"
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: string
 *           example: Successfully created, please validate your email
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return access and refresh tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid credentials
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/login", authLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate the user's refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/logout", authMiddleware, authController.logout);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user with permissions
 *     description: Returns current user details with fresh permissions list for UI control
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         priority:
 *                           type: integer
 *                     status:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["users:view", "assets:create", "posts:publish"]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/me", authMiddleware, authController.me);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends a verification email
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Duplicate email or username
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Email already exists
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/register", validate(registerationSchema), authController.createUser);

export { router as authRouter };
