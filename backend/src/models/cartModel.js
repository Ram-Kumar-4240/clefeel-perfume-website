const { query } = require('../config/database');

const CartModel = {
  async getCart(userId) {
    const result = await query(
      `SELECT c.id as cart_id, c.quantity,
        v.id as variant_id, v.size, v.price, v.stock_quantity,
        p.id as perfume_id, p.name as perfume_name, p.slug, p.images
       FROM cart c
       JOIN variants v ON c.variant_id = v.id
       JOIN perfumes p ON v.perfume_id = p.id
       WHERE c.user_id = $1 AND v.is_active = true AND p.is_active = true`,
      [userId]
    );
    return result.rows;
  },

  async addItem(userId, variantId, quantity = 1) {
    // Check if item already in cart
    const existing = await query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND variant_id = $2',
      [userId, variantId]
    );

    if (existing.rows.length > 0) {
      // Update quantity
      const newQuantity = existing.rows[0].quantity + quantity;
      const result = await query(
        'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
        [newQuantity, existing.rows[0].id]
      );
      return result.rows[0];
    }

    // Add new item
    const result = await query(
      'INSERT INTO cart (user_id, variant_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [userId, variantId, quantity]
    );
    return result.rows[0];
  },

  async updateQuantity(cartId, userId, quantity) {
    const result = await query(
      'UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, cartId, userId]
    );
    return result.rows[0] || null;
  },

  async removeItem(cartId, userId) {
    const result = await query(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id',
      [cartId, userId]
    );
    return result.rows[0];
  },

  async clearCart(userId) {
    const result = await query(
      'DELETE FROM cart WHERE user_id = $1 RETURNING id',
      [userId]
    );
    return result.rows;
  },

  async getCartCount(userId) {
    const result = await query(
      'SELECT COALESCE(SUM(quantity), 0) as count FROM cart WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  },

  async getCartTotal(userId) {
    const result = await query(
      `SELECT COALESCE(SUM(c.quantity * v.price), 0) as total
       FROM cart c
       JOIN variants v ON c.variant_id = v.id
       WHERE c.user_id = $1`,
      [userId]
    );
    return parseFloat(result.rows[0].total);
  },

  async validateStock(userId) {
    const result = await query(
      `SELECT c.id, c.quantity, v.stock_quantity, p.name, v.size
       FROM cart c
       JOIN variants v ON c.variant_id = v.id
       JOIN perfumes p ON v.perfume_id = p.id
       WHERE c.user_id = $1 AND c.quantity > v.stock_quantity`,
      [userId]
    );
    return result.rows;
  }
};

module.exports = CartModel;
