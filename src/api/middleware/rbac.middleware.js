import { UnauthorizedError, ForbiddenError } from "../../core/errors/httpErrors.js";

/**
 * Check if user has specific permission(s)
 * @param {string|string[]} requiredPermission - Permission code(s) like "users:create"
 * @param {object} options - Additional options
 * @param {boolean} options.requireAll - If true, user must have ALL permissions
 */
export const checkPermission = (requiredPermission, options = {}) => {
  const { requireAll = false } = options;
  return async (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const rbacRepository = req.scope.resolve("rbacRepository");
    const userPermissions = await rbacRepository.getUserPermissions(req.user.userId);
    const permissionCodes = userPermissions.map((p) => p.code);

    const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

    let hasPermission;

    if (requireAll) {
      hasPermission = required.every((perm) => permissionCodes.includes(perm));
    } else {
      hasPermission = required.some((perm) => permissionCodes.includes(perm));
    }

    if (!hasPermission) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
};
