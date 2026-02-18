const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const UserModel = {
  async create(userData) {
    const { email, password, firstName, lastName, phone, googleId, verificationToken } = userData;
    
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const result = await query(
      `INSERT INTO users (email, password_hash, google_id, first_name, last_name, phone, verification_token, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, first_name, last_name, role, is_verified, created_at`,
      [email, passwordHash, googleId || null, firstName, lastName, phone || null, verificationToken || null, !!googleId]
    );

    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await query(
      'SELECT id, email, first_name, last_name, phone, role, is_verified, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findByGoogleId(googleId) {
    const result = await query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );
    return result.rows[0] || null;
  },

  async verifyEmail(token) {
    const result = await query(
      `UPDATE users 
       SET is_verified = TRUE, verification_token = NULL 
       WHERE verification_token = $1 
       RETURNING id, email, is_verified`,
      [token]
    );
    return result.rows[0] || null;
  },

  async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [passwordHash, userId]
    );
    return result.rows[0];
  },

  async updateProfile(userId, updates) {
    const allowedFields = ['first_name', 'last_name', 'phone'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) return null;

    values.push(userId);
    const result = await query(
      `UPDATE users SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramIndex} 
       RETURNING id, email, first_name, last_name, phone`,
      values
    );

    return result.rows[0];
  },

  async verifyPassword(user, password) {
    if (!user.password_hash) return false;
    return bcrypt.compare(password, user.password_hash);
  },

  async getOrderHistory(userId) {
    const result = await query(
      `SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'perfume_name', oi.perfume_name,
          'size', oi.size,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price
        )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
};

module.exports = UserModel;
