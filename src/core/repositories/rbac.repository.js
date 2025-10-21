/**
 * RBAC Repository
 * Handles all role-based access control database operations
 */
export function makeRbacRepository({ prisma }) {
  return {
    /**
     * Find a role by name
     * @param {string} name - Role name (e.g., "ADMIN")
     * @returns {Promise<object|null>}
     */
    async findRoleByName(name) {
      return prisma.role.findUnique({
        where: { name },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    },

    /**
     * Find a role by ID
     * @param {string} id - Role ID
     * @returns {Promise<object|null>}
     */
    async findRoleById(id) {
      return prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    },

    /**
     * List all roles
     * @returns {Promise<Array>}
     */
    async listRoles() {
      return prisma.role.findMany({
        include: {
          _count: {
            select: { users: true, permissions: true },
          },
        },
        orderBy: { priority: "desc" },
      });
    },

    /**
     * Create a new role
     * @param {object} data - Role data
     * @returns {Promise<object>}
     */
    async createRole({ name, description, priority = 0 }) {
      return prisma.role.create({
        data: { name, description, priority },
      });
    },

    /**
     * Update a role
     * @param {string} id - Role ID
     * @param {object} data - Update data
     * @returns {Promise<object>}
     */
    async updateRole(id, data) {
      return prisma.role.update({
        where: { id },
        data,
      });
    },

    /**
     * Delete a role (only if not system role)
     * @param {string} id - Role ID
     * @returns {Promise<object>}
     */
    async deleteRole(id) {
      const role = await prisma.role.findUnique({ where: { id } });
      if (role?.isSystem) {
        throw new Error("Cannot delete system role");
      }
      return prisma.role.delete({ where: { id } });
    },

    /**
     * Find permission by code
     * @param {string} code - Permission code (e.g., "users:create")
     * @returns {Promise<object|null>}
     */
    async findPermissionByCode(code) {
      return prisma.permission.findUnique({
        where: { code },
      });
    },

    /**
     * List all permissions
     * @param {object} filters - Optional filters
     * @returns {Promise<Array>}
     */
    async listPermissions(filters = {}) {
      const where = {};
      if (filters.category) where.category = filters.category;
      if (filters.resource) where.resource = filters.resource;

      return prisma.permission.findMany({
        where,
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });
    },

    /**
     * Create a permission
     * @param {object} data - Permission data
     * @returns {Promise<object>}
     */
    async createPermission({ resource, action, description, category }) {
      const code = `${resource}:${action}`;
      return prisma.permission.create({
        data: { resource, action, code, description, category },
      });
    },

    /**
     * Update a permission
     * @param {string} id - Permission ID
     * @param {object} data - Update data
     * @returns {Promise<object>}
     */
    async updatePermission(id, data) {
      return prisma.permission.update({
        where: { id },
        data,
      });
    },

    /**
     * Delete a permission
     * @param {string} id - Permission ID
     * @returns {Promise<object>}
     */
    async deletePermission(id) {
      return prisma.permission.delete({ where: { id } });
    },

    /**
     * Assign a permission to a role
     * @param {string} roleId - Role ID
     * @param {string} permissionId - Permission ID
     * @returns {Promise<object>}
     */
    async assignPermissionToRole(roleId, permissionId) {
      return prisma.rolePermission.create({
        data: { roleId, permissionId },
      });
    },

    /**
     * Remove a permission from a role
     * @param {string} roleId - Role ID
     * @param {string} permissionId - Permission ID
     * @returns {Promise<void>}
     */
    async removePermissionFromRole(roleId, permissionId) {
      await prisma.rolePermission.deleteMany({
        where: { roleId, permissionId },
      });
    },

    /**
     * Get all permissions for a role
     * @param {string} roleId - Role ID
     * @returns {Promise<Array>}
     */
    async getRolePermissions(roleId) {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          permission: true,
        },
      });

      return rolePermissions.map((rp) => rp.permission);
    },

    /**
     * Get all effective permissions for a user
     * Combines role permissions + user-specific overrides
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    async getUserPermissions(userId) {
      // Get user with role and permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: {
                select: {
                  permission: { select: { code: true } },
                },
              },
            },
          },
          userPermissions: {
            where: {
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            select: {
              granted: true,
              permission: { select: { code: true } },
            },
          },
        },
      });

      if (!user) return [];

      const permissionMap = new Map();

      if (user.role?.permissions) {
        user.role.permissions.forEach((rp) => {
          permissionMap.set(rp.permission.code, {
            ...rp.permission,
            source: "role",
          });
        });
      }

      // Apply user-specific overrides
      user.userPermissions.forEach((up) => {
        if (up.granted) {
          permissionMap.set(up.permission.code, {
            ...up.permission,
            source: "user",
            grantedBy: up.grantedBy,
            reason: up.reason,
          });
        } else {
          // Revoke permission (remove)
          permissionMap.delete(up.permission.code);
        }
      });

      return Array.from(permissionMap.values());
    },

    /**
     * Grant a permission directly to a user
     * @param {string} userId - User ID
     * @param {string} permissionId - Permission ID
     * @param {string} grantedBy - ID of user granting permission
     * @param {string} reason - Reason for granting
     * @returns {Promise<object>}
     */
    async grantUserPermission(userId, permissionId, grantedBy, reason) {
      return prisma.userPermission.upsert({
        where: {
          userId_permissionId: { userId, permissionId },
        },
        create: {
          userId,
          permissionId,
          granted: true,
          grantedBy,
          reason,
        },
        update: {
          granted: true,
          grantedBy,
          reason,
          updatedAt: new Date(),
        },
      });
    },

    /**
     * Revoke a permission from a user
     * @param {string} userId - User ID
     * @param {string} permissionId - Permission ID
     * @param {string} grantedBy - ID of user revoking permission
     * @param {string} reason - Reason for revoking
     * @returns {Promise<object>}
     */
    async revokeUserPermission(userId, permissionId, grantedBy, reason) {
      return prisma.userPermission.upsert({
        where: {
          userId_permissionId: { userId, permissionId },
        },
        create: {
          userId,
          permissionId,
          granted: false,
          grantedBy,
          reason,
        },
        update: {
          granted: false,
          grantedBy,
          reason,
          updatedAt: new Date(),
        },
      });
    },

    /**
     * Remove user permission override
     * @param {string} userId - User ID
     * @param {string} permissionId - Permission ID
     * @returns {Promise<void>}
     */
    async removeUserPermission(userId, permissionId) {
      await prisma.userPermission.deleteMany({
        where: { userId, permissionId },
      });
    },

    /**
     * Get user-specific permission overrides
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    async getUserPermissionOverrides(userId) {
      return prisma.userPermission.findMany({
        where: { userId },
        include: {
          permission: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },

    /**
     * Check if user has a specific permission
     * @param {string} userId - User ID
     * @param {string} permissionCode - Permission code (e.g., "users:create")
     * @returns {Promise<boolean>}
     */
    async userHasPermission(userId, permissionCode) {
      const permissions = await this.getUserPermissions(userId);
      return permissions.some((p) => p.code === permissionCode);
    },

    /**
     * Check if user has any of the given permissions
     * @param {string} userId - User ID
     * @param {Array<string>} permissionCodes - Array of permission codes
     * @returns {Promise<boolean>}
     */
    async userHasAnyPermission(userId, permissionCodes) {
      const permissions = await this.getUserPermissions(userId);
      const userPermissionCodes = permissions.map((p) => p.code);
      return permissionCodes.some((code) => userPermissionCodes.includes(code));
    },

    /**
     * Check if user has all of the given permissions
     * @param {string} userId - User ID
     * @param {Array<string>} permissionCodes - Array of permission codes
     * @returns {Promise<boolean>}
     */
    async userHasAllPermissions(userId, permissionCodes) {
      const permissions = await this.getUserPermissions(userId);
      const userPermissionCodes = permissions.map((p) => p.code);
      return permissionCodes.every((code) => userPermissionCodes.includes(code));
    },

    /**
     * Get user with role information
     * @param {string} userId - User ID
     * @returns {Promise<object|null>}
     */
    async getUserWithRole(userId) {
      return prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
        },
      });
    },
  };
}
