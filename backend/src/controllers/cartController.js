const CartModel = require('../models/cartModel');
const { query } = require('../config/database');

const CartController = {
  async getCart(req, res, next) {
    try {
      const cartItems = await CartModel.getCart(req.user.id);
      
      // Calculate totals
      let total = 0;
      const items = cartItems.map(item => {
        const itemTotal = item.quantity * item.price;
        total += itemTotal;
        return {
          cartId: item.cart_id,
          variantId: item.variant_id,
          perfumeId: item.perfume_id,
          perfumeName: item.perfume_name,
          slug: item.slug,
          size: item.size,
          price: item.price,
          quantity: item.quantity,
          stockQuantity: item.stock_quantity,
          image: item.images?.[0] || null,
          total: itemTotal
        };
      });

      res.json({
        items,
        count: items.reduce((sum, item) => sum + item.quantity, 0),
        total: parseFloat(total.toFixed(2))
      });
    } catch (error) {
      next(error);
    }
  },

  async addItem(req, res, next) {
    try {
      const { variantId, quantity = 1 } = req.body;

      // Check if variant exists and has stock
      const variantResult = await query(
        `SELECT v.*, p.name as perfume_name, p.is_active 
         FROM variants v 
         JOIN perfumes p ON v.perfume_id = p.id 
         WHERE v.id = $1`,
        [variantId]
      );

      if (variantResult.rows.length === 0) {
        return res.status(404).json({ error: 'Product variant not found' });
      }

      const variant = variantResult.rows[0];

      if (!variant.is_active) {
        return res.status(400).json({ error: 'Product is not available' });
      }

      if (variant.stock_quantity < quantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock',
          available: variant.stock_quantity
        });
      }

      const cartItem = await CartModel.addItem(req.user.id, variantId, quantity);

      res.status(201).json({
        message: 'Item added to cart',
        cartItem: {
          cartId: cartItem.id,
          variantId: cartItem.variant_id,
          quantity: cartItem.quantity
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateQuantity(req, res, next) {
    try {
      const { cartId } = req.params;
      const { quantity } = req.body;

      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }

      // Check stock
      const stockResult = await query(
        `SELECT v.stock_quantity 
         FROM cart c
         JOIN variants v ON c.variant_id = v.id
         WHERE c.id = $1 AND c.user_id = $2`,
        [cartId, req.user.id]
      );

      if (stockResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      if (stockResult.rows[0].stock_quantity < quantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock',
          available: stockResult.rows[0].stock_quantity
        });
      }

      const cartItem = await CartModel.updateQuantity(cartId, req.user.id, quantity);

      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      res.json({
        message: 'Quantity updated',
        cartItem: {
          cartId: cartItem.id,
          quantity: cartItem.quantity
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async removeItem(req, res, next) {
    try {
      const { cartId } = req.params;
      const result = await CartModel.removeItem(cartId, req.user.id);

      if (!result) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      res.json({ message: 'Item removed from cart' });
    } catch (error) {
      next(error);
    }
  },

  async clearCart(req, res, next) {
    try {
      await CartModel.clearCart(req.user.id);
      res.json({ message: 'Cart cleared' });
    } catch (error) {
      next(error);
    }
  },

  async getCount(req, res, next) {
    try {
      const count = await CartModel.getCartCount(req.user.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  },

  async validateStock(req, res, next) {
    try {
      const outOfStock = await CartModel.validateStock(req.user.id);
      
      if (outOfStock.length > 0) {
        return res.status(400).json({
          error: 'Some items are out of stock',
          items: outOfStock.map(item => ({
            name: item.name,
            size: item.size,
            requested: item.quantity,
            available: item.stock_quantity
          }))
        });
      }

      res.json({ valid: true });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = CartController;
