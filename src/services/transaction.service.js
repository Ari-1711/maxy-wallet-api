const prisma = require('../utils/prisma');
const { v4: uuidv4 } = require('uuid');

class TransactionService {
  async topup(userId, amount) {
    const top_up_id = uuidv4();
    
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const balance_before = user.balance;
      const balance_after = balance_before + BigInt(amount);
      
      await tx.user.update({
        where: { id: userId },
        data: { balance: balance_after }
      });

      const transaction = await tx.transaction.create({
        data: {
          user_id: userId,
          reference_id: top_up_id,
          transaction_type: 'CREDIT',
          amount: BigInt(amount),
          balance_before,
          balance_after,
          remarks: 'Top Up'
        }
      });
      
      return transaction;
    });

    return {
      top_up_id: result.reference_id,
      amount_top_up: result.amount,
      balance_before: result.balance_before,
      balance_after: result.balance_after,
      created_date: result.created_date
    };
  }

  async pay(userId, amount, remarks) {
    const payment_id = uuidv4();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user.balance < BigInt(amount)) {
        const err = new Error('Balance is not enough');
        err.statusCode = 400;
        throw err;
      }
      
      const balance_before = user.balance;
      const balance_after = balance_before - BigInt(amount);
      
      await tx.user.update({
        where: { id: userId },
        data: { balance: balance_after }
      });

      const transaction = await tx.transaction.create({
        data: {
          user_id: userId,
          reference_id: payment_id,
          transaction_type: 'DEBIT',
          amount: BigInt(amount),
          balance_before,
          balance_after,
          remarks: remarks || ''
        }
      });
      
      return transaction;
    });

    return {
      payment_id: result.reference_id,
      amount: result.amount,
      remarks: result.remarks,
      balance_before: result.balance_before,
      balance_after: result.balance_after,
      created_date: result.created_date
    };
  }

  async transfer(senderId, targetUserId, amount, remarks) {
    const transfer_id = uuidv4();

    const result = await prisma.$transaction(async (tx) => {
      const sender = await tx.user.findUnique({ where: { id: senderId } });
      if (sender.balance < BigInt(amount)) {
        const err = new Error('Balance is not enough');
        err.statusCode = 400;
        throw err;
      }

      const receiver = await tx.user.findUnique({ where: { id: targetUserId } });
      if (!receiver) {
        const err = new Error('Target user not found');
        err.statusCode = 400;
        throw err;
      }
      
      const sender_balance_before = sender.balance;
      const sender_balance_after = sender_balance_before - BigInt(amount);
      
      const receiver_balance_before = receiver.balance;
      const receiver_balance_after = receiver_balance_before + BigInt(amount);
      
      await tx.user.update({
        where: { id: senderId },
        data: { balance: sender_balance_after }
      });

      await tx.user.update({
        where: { id: targetUserId },
        data: { balance: receiver_balance_after }
      });

      const senderTx = await tx.transaction.create({
        data: {
          user_id: senderId,
          reference_id: transfer_id,
          transaction_type: 'DEBIT',
          amount: BigInt(amount),
          balance_before: sender_balance_before,
          balance_after: sender_balance_after,
          remarks: remarks || ''
        }
      });

      await tx.transaction.create({
        data: {
          user_id: targetUserId,
          reference_id: transfer_id,
          transaction_type: 'CREDIT',
          amount: BigInt(amount),
          balance_before: receiver_balance_before,
          balance_after: receiver_balance_after,
          remarks: remarks || ''
        }
      });
      
      return senderTx;
    });

    return {
      transfer_id: result.reference_id,
      amount: result.amount,
      remarks: result.remarks,
      balance_before: result.balance_before,
      balance_after: result.balance_after,
      created_date: result.created_date
    };
  }

  async getTransactions(userId) {
    const transactions = await prisma.transaction.findMany({
      where: { user_id: userId },
      orderBy: { created_date: 'desc' }
    });
    
    return transactions;
  }
}

module.exports = new TransactionService();
