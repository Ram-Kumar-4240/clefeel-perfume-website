const UserModel = require('../models/userModel');
const { generateToken } = require('../middleware/auth');
const { sendVerificationEmail } = require('../config/email');
const crypto = require('crypto');

const AuthController = {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const user = await UserModel.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        verificationToken
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, verificationToken, firstName);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      // Generate token
      const token = generateToken(user);

      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isVerified: user.is_verified
        },
        token
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await UserModel.verifyPassword(user, password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = generateToken(user);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          isVerified: user.is_verified
        },
        token
      });
    } catch (error) {
      next(error);
    }
  },

  async googleAuth(req, res, next) {
    try {
      const { googleId, email, firstName, lastName, picture } = req.body;

      // Check if user exists with Google ID
      let user = await UserModel.findByGoogleId(googleId);

      if (!user) {
        // Check if email exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
          // Link Google account to existing user
          // This would require an update method - simplified for now
          return res.status(409).json({ error: 'Email already registered with password' });
        }

        // Create new user
        user = await UserModel.create({
          email,
          googleId,
          firstName,
          lastName,
          password: null
        });
      }

      const token = generateToken(user);

      res.json({
        message: 'Google login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isVerified: true
        },
        token
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;

      const user = await UserModel.verifyEmail(token);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          isVerified: user.is_verified
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone } = req.body;
      
      const user = await UserModel.updateProfile(req.user.id, {
        first_name: firstName,
        last_name: lastName,
        phone
      });

      res.json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  },

  async getOrderHistory(req, res, next) {
    try {
      const orders = await UserModel.getOrderHistory(req.user.id);
      res.json({ orders });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res) {
    res.json({ message: 'Logout successful' });
  }
};

module.exports = AuthController;
