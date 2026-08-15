const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserService {
  async register(data) {
    const { first_name, last_name, phone_number, address, pin } = data;
    const existingUser = await prisma.user.findUnique({
      where: { phone_number }
    });
    if (existingUser) {
      const err = new Error('Phone Number already registered');
      err.statusCode = 400;
      throw err;
    }
    const hashedPin = await bcrypt.hash(pin, 10);
    const user = await prisma.user.create({
      data: {
        first_name,
        last_name,
        phone_number,
        address,
        pin: hashedPin
      }
    });
    return {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      address: user.address,
      created_date: user.created_date
    };
  }

  async login(phone_number, pin) {
    const user = await prisma.user.findUnique({
      where: { phone_number }
    });
    if (!user) {
      const err = new Error("Phone number and pin doesn't match.");
      err.statusCode = 400;
      throw err;
    }
    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) {
      const err = new Error("Phone number and pin doesn't match.");
      err.statusCode = 400;
      throw err;
    }
    
    const access_token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refresh_token = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    
    return { access_token, refresh_token };
  }

  async updateProfile(userId, data) {
    const { first_name, last_name, address } = data;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { first_name, last_name, address }
    });
    return {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      address: user.address,
      updated_date: user.updated_date
    };
  }
}

module.exports = new UserService();
