const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOrderNotification = async (orderData) => {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@clefeel.com';
  
  const { order, items, customer } = orderData;
  
  const itemsList = items.map(item => 
    `- ${item.perfume_name} (${item.size}) x ${item.quantity} = $${item.total_price}`
  ).join('\n');

  const mailOptions = {
    from: `"Clefeel Orders" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `New Order Received - #${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #c9a962; margin-bottom: 20px; border-bottom: 2px solid #c9a962; padding-bottom: 10px;">
            🛍️ New Order Received
          </h2>
          
          <div style="margin-bottom: 25px;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order.order_number}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #c9a962; font-weight: bold;">${order.status.toUpperCase()}</span></p>
          </div>

          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #333;">Customer Details</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${customer.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${customer.email}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${customer.phone}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong><br>${customer.address.replace(/\n/g, '<br>')}</p>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Order Items</h3>
            <pre style="background: #f9f9f9; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 14px;">${itemsList}</pre>
          </div>

          <div style="background: #c9a962; color: #fff; padding: 15px; border-radius: 5px; text-align: center;">
            <h3 style="margin: 0; font-size: 24px;">Total: $${order.total_amount}</h3>
          </div>

          <div style="margin-top: 25px; text-align: center;">
            <a href="${process.env.ADMIN_URL}/orders/${order.id}" 
               style="background: #333; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Order in Admin
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>Clefeel Parfumerie - Premium Fragrances</p>
        </div>
      </div>
    `,
    text: `
New Order Received - #${order.order_number}

Customer Details:
Name: ${customer.name}
Email: ${customer.email}
Phone: ${customer.phone}
Address: ${customer.address}

Order Items:
${itemsList}

Total Amount: $${order.total_amount}

View Order: ${process.env.ADMIN_URL}/orders/${order.id}
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Order notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

const sendVerificationEmail = async (email, token, name) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email.html?token=${token}`;

  const mailOptions = {
    from: `"Clefeel" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Clefeel',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #c9a962;">Welcome to Clefeel, ${name}!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" 
           style="background: #c9a962; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Verify Email
        </a>
        <p style="color: #999; font-size: 12px;">Or copy this link: ${verificationUrl}</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

  const mailOptions = {
    from: `"Clefeel" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset - Clefeel',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #c9a962;">Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" 
           style="background: #c9a962; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #999; font-size: 12px;">This link expires in 1 hour.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendOrderNotification,
  sendVerificationEmail,
  sendPasswordResetEmail
};
