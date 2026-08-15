const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/utils/prisma');

// Generate unique phone numbers for the test run
const phone1 = `081${Math.floor(Math.random() * 1000000000)}`;
const phone2 = `081${Math.floor(Math.random() * 1000000000)}`;

let accessToken1;
let targetUserId;

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Maxy Wallet Flow', () => {
  it('1. Register User 1', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        first_name: 'Test',
        last_name: 'User 1',
        phone_number: phone1,
        address: 'Test Address 1',
        pin: '123456'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('SUCCESS');
    expect(res.body.result).toHaveProperty('user_id');
    expect(res.body.result).toHaveProperty('first_name');
    expect(res.body.result).toHaveProperty('last_name');
    expect(res.body.result).toHaveProperty('phone_number');
    expect(res.body.result).toHaveProperty('address');
    expect(res.body.result).toHaveProperty('created_date');
  });

  it('2. Login User 1', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        phone_number: phone1,
        pin: '123456'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('SUCCESS');
    expect(res.body.result).toHaveProperty('access_token');
    expect(res.body.result).toHaveProperty('refresh_token');
    
    accessToken1 = res.body.result.access_token;
  });

  it('3. Topup User 1', async () => {
    const res = await request(app)
      .post('/topup')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({ amount: 100000 });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('SUCCESS');
    expect(res.body.result).toHaveProperty('top_up_id');
    expect(res.body.result).toHaveProperty('amount_top_up');
    expect(res.body.result).toHaveProperty('balance_before');
    expect(res.body.result).toHaveProperty('balance_after');
    expect(res.body.result).toHaveProperty('created_date');
    expect(res.body.result.balance_after).toBe(100000);
  });

  it('4. Pay User 1', async () => {
    const res = await request(app)
      .post('/pay')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({ amount: 20000, remarks: 'Beli makan' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('SUCCESS');
    expect(res.body.result).toHaveProperty('payment_id');
    expect(res.body.result).toHaveProperty('amount');
    expect(res.body.result).toHaveProperty('remarks');
    expect(res.body.result).toHaveProperty('balance_before');
    expect(res.body.result).toHaveProperty('balance_after');
    expect(res.body.result).toHaveProperty('created_date');
    expect(res.body.result.balance_after).toBe(80000);
  });

  it('5. Register Target User', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        first_name: 'Target',
        last_name: 'User',
        phone_number: phone2,
        address: 'Test Address 2',
        pin: '123456'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('SUCCESS');
    targetUserId = res.body.result.user_id;
  });

  it('6. Transfer User 1 to Target User', async () => {
    const res = await request(app)
      .post('/transfer')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({ target_user_id: targetUserId, amount: 10000, remarks: 'Hutang' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('SUCCESS');
    expect(res.body.result).toHaveProperty('transfer_id');
    expect(res.body.result).toHaveProperty('amount');
    expect(res.body.result).toHaveProperty('remarks');
    expect(res.body.result).toHaveProperty('balance_before');
    expect(res.body.result).toHaveProperty('balance_after');
    expect(res.body.result).toHaveProperty('created_date');
    expect(res.body.result.balance_after).toBe(70000);
  });
});
