export default {
  async getUserActivity(req, res, next) {
    try {
      const statsService = req.scope.resolve("statsService");
      const stats = await statsService.getUserActivityStats({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};
