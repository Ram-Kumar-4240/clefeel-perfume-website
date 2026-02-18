const OrderModel = require('../models/orderModel');
const CartModel = require('../models/cartModel');
const { query } = require('../config/database');
const { sendOrderNotification } = require('../config/email');

const OrderController = {
  async create(req, res, next) {
    try {
      const { items, customer, paymentMethod, notes } = req.body;
      const userId = req.user?.id || null;

      // Validate items and calculate total
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        // Get variant details
        const variantResult = await query(
          `SELECT v.*, p.name as perfume_name, p.is_active
           FROM variants v
           JOIN perfumes p ON v.perfume_id = p.id
           WHERE v.id = $1`,
          [item.variantId]
        );

        if (variantResult.rows.length === 0) {
          return res.status(404).json({ error: `Variant ${item.variantId} not found` });
        }

        const variant = variantResult.rows[0];

        if (!variant.is_active) {
          return res.status(400).json({ error: `${variant.perfume_name} is not available` });
        }

        if (variant.stock_quantity < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for ${variant.perfume_name} (${variant.size})`,
            available: variant.stock_quantity
          });
        }

        const itemTotal = item.quantity * variant.price;
        totalAmount += itemTotal;

        orderItems.push({
          variantId: item.variantId,
          perfumeName: variant.perfume_name,
          size: variant.size,
          quantity: item.quantity,
          unitPrice: variant.price,
          totalPrice: itemTotal
        });
      }

      // Create order
      const order = await OrderModel.create({
        userId,
        guestEmail: customer.email,
        guestPhone: customer.phone,
        guestName: customer.name,
        items: orderItems,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        shippingAddress: {
          street: customer.address,
          city: customer.city,
          state: customer.state,
          zipCode: customer.zipCode,
          country: customer.country || 'India'
        },
        billingAddress: customer.billingAddress || null,
        paymentMethod,
        notes
      });

      // Send email notification to admin
      try {
        await sendOrderNotification({
          order,
          items: orderItems,
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address
          }
        });
      } catch (emailError) {
        console.error('Failed to send order notification:', emailError);
        // Don't fail the order if email fails
      }

      res.status(201).json({
        message: 'Order placed successfully',
        order: {
          id: order.id,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          status: order.status,
          createdAt: order.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async createFromCart(req, res, next) {
    try {
      const { customer, paymentMethod, notes } = req.body;
      const userId = req.user.id;

      // Get cart items
      const cartItems = await CartModel.getCart(userId);

      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Check stock
      const outOfStock = await CartModel.validateStock(userId);
      if (outOfStock.length > 0) {
        return res.status(400).json({
          error: 'Some items are out of stock',
          items: outOfStock
        });
      }

      // Calculate total
      let totalAmount = 0;
      const orderItems = cartItems.map(item => {
        const itemTotal = item.quantity * item.price;
        totalAmount += itemTotal;
        return {
          variantId: item.variant_id,
          perfumeName: item.perfume_name,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: itemTotal
        };
      });

      // Create order
      const order = await OrderModel.create({
        userId,
        guestEmail: null,
        guestPhone: customer.phone,
        guestName: customer.name,
        items: orderItems,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        shippingAddress: {
          street: customer.address,
          city: customer.city,
          state: customer.state,
          zipCode: customer.zipCode,
          country: customer.country || 'India'
        },
        billingAddress: customer.billingAddress || null,
        paymentMethod,
        notes
      });

      // Send email notification
      try {
        const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
        const userEmail = userResult.rows[0]?.email;

        await sendOrderNotification({
          order,
          items: orderItems,
          customer: {
            name: customer.name,
            email: userEmail || customer.email,
            phone: customer.phone,
            address: customer.address
          }
        });
      } catch (emailError) {
        console.error('Failed to send order notification:', emailError);
      }

      res.status(201).json({
        message: 'Order placed successfully',
        order: {
          id: order.id,
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          status: order.status,
          createdAt: order.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await OrderModel.findById(id);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Check if user owns this order or is admin
      if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ order });
    } catch (error) {
      next(error);
    }
  },

  async getMyOrders(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const orders = await OrderModel.findByUser(
        req.user.id,
        parseInt(limit),
        (parseInt(page) - 1) * parseInt(limit)
      );

      res.json({ orders });
    } catch (error) {
      next(error);
    }
  },

  // Admin methods
  async getAll(req, res, next) {
    try {
      const { status, page = 1, limit = 50 } = req.query;
      const orders = await OrderModel.findAll({
        status,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      res.json({ orders });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await OrderModel.updateStatus(id, status);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ message: 'Order status updated', order });
    } catch (error) {
      next(error);
    }
  },

  async getDashboardStats(req, res, next) {
    try {
      const stats = await OrderModel.getDashboardStats();
      res.json({ stats });
    } catch (error) {
      next(error);
    }
  },

  async getRecentOrders(req, res, next) {
    try {
      const orders = await OrderModel.getRecentOrders(10);
      res.json({ orders });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = OrderController;
