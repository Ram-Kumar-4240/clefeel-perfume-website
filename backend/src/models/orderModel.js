const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const OrderModel = {
  async create(orderData) {
    const {
      userId,
      guestEmail,
      guestPhone,
      guestName,
      items,
      totalAmount,
      shippingAddress,
      billingAddress,
      paymentMethod = 'cod',
      notes
    } = orderData;

    const orderNumber = `CF${Date.now().toString(36).toUpperCase()}`;

    const client = await query('BEGIN');

    try {
      // Create order
      const orderResult = await query(
        `INSERT INTO orders (order_number, user_id, guest_email, guest_phone, guest_name, total_amount, shipping_address, billing_address, payment_method, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [orderNumber, userId || null, guestEmail || null, guestPhone || null, guestName || null, 
         totalAmount, JSON.stringify(shippingAddress), billingAddress ? JSON.stringify(billingAddress) : null, 
         paymentMethod, notes || null, 'pending']
      );

      const order = orderResult.rows[0];

      // Create order items and update stock
      for (const item of items) {
        // Add order item
        await query(
          `INSERT INTO order_items (order_id, variant_id, perfume_name, size, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [order.id, item.variantId, item.perfumeName, item.size, item.quantity, item.unitPrice, item.totalPrice]
        );

        // Update stock
        await query(
          'UPDATE variants SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.variantId]
        );
      }

      // Clear cart if user is logged in
      if (userId) {
        await query('DELETE FROM cart WHERE user_id = $1', [userId]);
      }

      await query('COMMIT');
      return this.findById(order.id);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  },

  async findById(id) {
    const orderResult = await query(
      `SELECT o.*, 
        json_build_object(
          'name', COALESCE(u.first_name || ' ' || u.last_name, o.guest_name),
          'email', COALESCE(u.email, o.guest_email),
          'phone', COALESCE(u.phone, o.guest_phone)
        ) as customer
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) return null;

    const itemsResult = await query(
      `SELECT oi.*, p.images->>0 as image
       FROM order_items oi
       LEFT JOIN variants v ON oi.variant_id = v.id
       LEFT JOIN perfumes p ON v.perfume_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    return {
      ...orderResult.rows[0],
      items: itemsResult.rows
    };
  },

  async findByOrderNumber(orderNumber) {
    const result = await query(
      'SELECT id FROM orders WHERE order_number = $1',
      [orderNumber]
    );
    if (result.rows.length === 0) return null;
    return this.findById(result.rows[0].id);
  },

  async findByUser(userId, limit = 20, offset = 0) {
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
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async findAll(filters = {}) {
    const { status, limit = 50, offset = 0 } = filters;
    
    let whereClause = '';
    const params = [limit, offset];
    
    if (status) {
      whereClause = 'WHERE o.status = $3';
      params.push(status);
    }

    const result = await query(
      `SELECT o.*, 
        json_build_object(
          'name', COALESCE(u.first_name || ' ' || u.last_name, o.guest_name),
          'email', COALESCE(u.email, o.guest_email),
          'phone', COALESCE(u.phone, o.guest_phone)
        ) as customer,
        COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       ${whereClause}
       GROUP BY o.id, u.id
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );
    return result.rows;
  },

  async updateStatus(orderId, status) {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const result = await query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, orderId]
    );
    return result.rows[0];
  },

  async updatePaymentStatus(orderId, paymentStatus, paymentMethod = null) {
    const result = await query(
      `UPDATE orders SET payment_status = $1, payment_method = COALESCE($3, payment_method), updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [paymentStatus, orderId, paymentMethod]
    );
    return result.rows[0];
  },

  async getDashboardStats() {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as orders_30d,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_30d,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM perfumes WHERE is_active = true) as active_products,
        (SELECT COUNT(*) FROM enquiries WHERE status = 'new') as new_enquiries
    `);
    return stats.rows[0];
  },

  async getRecentOrders(limit = 10) {
    const result = await query(
      `SELECT o.*, 
        json_build_object(
          'name', COALESCE(u.first_name || ' ' || u.last_name, o.guest_name),
          'email', COALESCE(u.email, o.guest_email)
        ) as customer
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
};

module.exports = OrderModel;
