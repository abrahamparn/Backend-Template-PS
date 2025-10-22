import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/httpErrors.js";

export function makeRoleService({ rbacRepository, logger }) {
  return {
    async listRoles() {
      return rbacRepository.listRoles();
    },

    async getRoleById(id) {
      const role = await rbacRepository.findRoleById(id);
      if (!role) {
        throw new NotFoundError("Role not found");
      }
      return role;
    },

    async createRole({ name, description, priority = 0 }) {
      if (!name?.trim()) {
        throw new ValidationError("Role name is required");
      }

      const existing = await rbacRepository.findRoleByName(name);
      if (existing) {
        throw new ConflictError("Role name already exists");
      }

      const role = await rbacRepository.createRole({
        name: name.trim(),
        description,
        priority,
      });

      logger.info({ roleId: role.id }, "Role created");
      return role;
    },

    async updateRole(id, data) {
      const role = await this.getRoleById(id);

      if (data.name && data.name !== role.name) {
        const existing = await rbacRepository.findRoleByName(data.name);
        if (existing && existing.id !== id) {
          throw new ConflictError("Role name already exists");
        }
      }

      const updated = await rbacRepository.updateRole(id, data);
      logger.info({ roleId: id }, "Role updated");
      return updated;
    },

    async deleteRole(id) {
      await this.getRoleById(id);
      await rbacRepository.deleteRole(id);
      logger.info({ roleId: id }, "Role deleted");
      return { success: true };
    },

    async assignPermission(roleId, { permissionId, permissionCode }) {
      await this.getRoleById(roleId);
      if (!permissionId && !permissionCode) {
        throw new ValidationError("permissionId or permissionCode is required");
      }

      let permission;
      if (permissionId) {
        permission = await rbacRepository.findPermissionById(permissionId);
      } else {
        permission = await rbacRepository.findPermissionByCode(permissionCode);
        permissionId = permission?.id;
      }

      if (!permission || !permissionId) {
        throw new NotFoundError("Permission not found");
      }

      await rbacRepository.assignPermissionToRole(roleId, permissionId);
      logger.info({ roleId, permissionId }, "Permission assigned to role");
      return this.getRoleById(roleId);
    },

    async revokePermission(roleId, { permissionId, permissionCode }) {
      await this.getRoleById(roleId);
      if (!permissionId && !permissionCode) {
        throw new ValidationError("permissionId or permissionCode is required");
      }

      let permission;
      if (permissionId) {
        permission = await rbacRepository.findPermissionById(permissionId);
      } else {
        permission = await rbacRepository.findPermissionByCode(permissionCode);
        permissionId = permission?.id;
      }

      if (!permission || !permissionId) {
        throw new NotFoundError("Permission not found");
      }

      await rbacRepository.removePermissionFromRole(roleId, permissionId);
      logger.info({ roleId, permissionId }, "Permission revoked from role");
      return this.getRoleById(roleId);
    },

    async listPermissions(filters = {}) {
      return rbacRepository.listPermissions(filters);
    },
  };
}
