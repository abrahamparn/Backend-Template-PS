# 🚀 RBAC Quick Cheat Sheet

## Basic Setup (3 steps)

```javascript
// 1. Import
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { checkPermission } from "../../middleware/rbac.middleware.js";

// 2. Require authentication for all routes
router.use(authMiddleware);

// 3. Add permission checks
router.get("/", checkPermission("users:view"), controller.getUsers);
router.post("/", checkPermission("users:create"), controller.createUser);
router.patch("/:id", checkPermission("users:update"), controller.updateUser);
router.delete("/:id", checkPermission("users:delete"), controller.deleteUser);
```

---

## Common Patterns

```javascript
// Single permission
checkPermission("users:view");

// Multiple permissions (ANY) - user needs at least one
checkPermission(["users:view", "users:admin"]);

// Multiple permissions (ALL) - user needs all of them
checkPermission(["invoices:view", "invoices:approve"], { requireAll: true });

// Different permissions per HTTP method
router
  .route("/assets")
  .get(checkPermission("assets:view"), controller.list)
  .post(checkPermission("assets:create"), controller.create);

// Special operations
router.post("/:id/publish", checkPermission("posts:publish"), controller.publish);
router.post("/:id/approve", checkPermission("invoices:approve"), controller.approve);
```

---

## All Available Permissions (from seed)

### Users (4)

- `users:view`
- `users:create`
- `users:update`
- `users:delete`

### Assets (6)

- `assets:view`
- `assets:create`
- `assets:update`
- `assets:delete`
- `assets:assign`
- `assets:transfer`

### Content (13)

- `posts:view`, `posts:create`, `posts:update`, `posts:delete`, `posts:publish`, `posts:unpublish`
- `pages:view`, `pages:create`, `pages:update`, `pages:delete`
- `media:view`, `media:upload`, `media:delete`

### Finance (10)

- `invoices:view`, `invoices:create`, `invoices:update`, `invoices:delete`, `invoices:approve`, `invoices:pay`, `invoices:send`
- `payments:view`, `payments:create`, `payments:refund`

### RBAC (5)

- `roles:view`, `roles:create`, `roles:update`, `roles:delete`
- `permissions:assign`

### System (5)

- `settings:view`, `settings:update`
- `logs:view`
- `reports:view`, `reports:export`

---

## Test Users & Their Permissions

```javascript
// Super Admin - ALL 43 permissions
{ username: "abrahamnaiborhu", password: "admin123" }

// Admin - 35 permissions (most admin tasks)
{ username: "admin", password: "admin123" }

// Manager - 22 permissions (assets, invoices, content)
{ username: "manager", password: "user123" }

// Editor - 10 permissions (content only)
{ username: "editor", password: "user123" }

// Accountant - 9 permissions (finance only)
{ username: "accountant", password: "user123" }

// User - 4 permissions (view only)
{ username: "johndoe", password: "user123" }
```

---

## Error Responses

```json
// 401 - Not authenticated
{ "success": false, "error": "Authentication required" }

// 403 - No permission
{ "success": false, "error": "Insufficient permissions" }

// 401 - Role changed (token invalidated)
{ "success": false, "error": "Token invalidated - please login again" }
```

---

## Complete Example

```javascript
import express from "express";
import userController from "./user.controller.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { checkPermission } from "../../middleware/rbac.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// CRUD operations
router.get("/", checkPermission("users:view"), userController.getUsers);
router.get("/:id", checkPermission("users:view"), userController.getUserById);
router.post("/", checkPermission("users:create"), userController.createUser);
router.patch("/:id", checkPermission("users:update"), userController.updateUser);
router.delete("/:id", checkPermission("users:delete"), userController.deleteUser);

// Special operations
router.post(
  "/:id/assign-role",
  checkPermission(["users:update", "roles:view"], { requireAll: true }),
  userController.assignRole
);

export { router as userRouter };
```

---
