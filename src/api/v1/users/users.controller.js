export default {
  async getUsers(req, res, next) {
    try {
      const userService = req.scope.resolve("userService");
      const result = await userService.getUsers(req.query);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req, res, next) {
    try {
      const userService = req.scope.resolve("userService");
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async createUser(req, res, next) {
    try {
      const userService = req.scope.resolve("userService");
      const user = await userService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const userService = req.scope.resolve("userService");
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const userService = req.scope.resolve("userService");
      await userService.deleteUser(req.params.id, req.user.userId);
      res.status(200).json({ success: true, message: "User deleted" });
    } catch (error) {
      next(error);
    }
  },
};
