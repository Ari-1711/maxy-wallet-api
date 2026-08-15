const userService = require('../services/user.service');

class UserController {
  async register(req, res, next) {
    try {
      const result = await userService.register(req.body);
      res.json({ status: "SUCCESS", result });
    } catch (err) {
      if (err.message === 'Phone Number already registered') {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { phone_number, pin } = req.body;
      const result = await userService.login(phone_number, pin);
      res.json({ status: "SUCCESS", result });
    } catch (err) {
      if (err.message === "Phone number and pin doesn't match.") {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const result = await userService.updateProfile(req.user.id, req.body);
      res.json({ status: "SUCCESS", result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
