const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async ({ name, email, password }) => {
  const hashed = await bcrypt.hash(password, 10);
  const result = await db.query(`
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3) RETURNING id, name, email
  `, [name, email, hashed]);
  return result.rows[0];
};

exports.login = async ({ email, password }) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) throw new Error('Invalid email or password');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Invalid email or password');

  const payload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  return token;
};