const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const transactionController = require('../controllers/transaction.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.put('/profile', authMiddleware, userController.updateProfile);

router.post('/topup', authMiddleware, transactionController.topup);
router.post('/pay', authMiddleware, transactionController.pay);
router.post('/transfer', authMiddleware, transactionController.transfer);
router.get('/transactions', authMiddleware, transactionController.getTransactions);

module.exports = router;
