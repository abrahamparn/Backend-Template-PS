export default {
  async listRoles(req, res, next) {
    try {
      const roleService = req.scope.resolve("roleService");
      const roles = await roleService.listRoles();
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  },

  async getRoleById(req, res, next) {
    try {
      const roleService = req.scope.resolve("roleService");
      const role = await roleService.getRoleById(req.params.id);
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async createRole(req, res, next) {
    try {
      const roleService = req.scope.resolve("roleService");
      const role = await roleService.createRole(req.body);
      res.status(201).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async updateRole(req, res, next) {
    try {
      const roleService = req.scope.resolve("roleService");
      const role = await roleService.updateRole(req.params.id, req.body);
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async deleteRole(req, res, next) {
    try {
      const roleService = req.scope.resolve("roleService");
      await roleService.deleteRole(req.params.id);
      res.status(200).json({ success: true, message: "Role deleted" });
    } catch (error) {
      next(error);
    }
  },

  async assignPermission(req, res, next) {
    try {
      const roleService = req.scope.resolve("roleService");
      const role = await roleService.assignPermission(req.params.id, {
        permissionId: req.body.permissionId,
        permissionCode: req.body.permissionCode,
      });
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async revokePermission(req, res, next) {
    try {
      const roleService = req.scope.resolve("roleService");
      const role = await roleService.revokePermission(req.params.id, {
        permissionId: req.params.permissionId ?? req.body?.permissionId,
        permissionCode: req.body?.permissionCode,
      });
      res.status(200).json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  },

  async listPermissions(req, res, next) {
    try {
      const roleService = req.scope.resolve("roleService");
      const permissions = await roleService.listPermissions(req.query);
      res.status(200).json({ success: true, data: permissions });
    } catch (error) {
      next(error);
    }
  },
};
