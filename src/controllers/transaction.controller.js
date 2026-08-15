const transactionService = require('../services/transaction.service');

class TransactionController {
  async topup(req, res, next) {
    try {
      const { amount } = req.body;
      const result = await transactionService.topup(req.user.id, amount);
      res.json({ status: "SUCCESS", result });
    } catch (err) {
      next(err);
    }
  }

  async pay(req, res, next) {
    try {
      const { amount, remarks } = req.body;
      const result = await transactionService.pay(req.user.id, amount, remarks);
      res.json({ status: "SUCCESS", result });
    } catch (err) {
      if (err.message === 'Balance is not enough') {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  }

  async transfer(req, res, next) {
    try {
      const { target_user_id, amount, remarks } = req.body;
      const result = await transactionService.transfer(req.user.id, target_user_id, amount, remarks);
      res.json({ status: "SUCCESS", result });
    } catch (err) {
      if (err.message === 'Balance is not enough') {
        return res.status(400).json({ message: err.message });
      }
      next(err);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const result = await transactionService.getTransactions(req.user.id);
      res.json({ status: "SUCCESS", result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TransactionController();
