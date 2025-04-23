require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./db');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Connect to MongoDB
connectDB();

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
  cart: [{
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String },
    type: { type: String },
    age: { type: String, required: false }, // Make optional for debugging
    size: { type: String, required: false } // Make optional for debugging
  }]
}, {
  strict: false // Temporarily allow additional fields
});

console.log("MONGO_URI =", process.env.MONGO_URI);

// Admin Schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Routes

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { email, name, password, role } = req.body;

  try {
    // Check if user exists
    let Model = role === 'admin' ? Admin : User;
    const exists = await Model.findOne({ email });

    if (exists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user/admin
    const newUser = await Model.create({
      email,
      name,
      password: hashedPassword,
      role
    });

    // Generate token
    const token = generateToken(newUser._id, role);

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Find user based on role
    let Model = role === 'admin' ? Admin : User;
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Protected route example
app.get('/api/protected', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user based on role
    let Model = decoded.role === 'admin' ? Admin : User;
    const user = await Model.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Add this to your server.js routes
app.post('/api/validate-session', async (req, res) => {
  try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ valid: false });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const Model = decoded.role === 'admin' ? Admin : User;
      const user = await Model.findById(decoded.id).select('-password');
      
      if (!user) return res.status(401).json({ valid: false });
      
      res.json({ valid: true, user });
  } catch (error) {
      res.status(401).json({ valid: false });
  }
});



app.post('/api/logout', async (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({ success: true });
});



app.get('/api/cart', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ cart: user.cart });
  } catch (err) {
    res.status(401).json({ error: 'Token invalid' });
  }
});

app.post('/api/cart/add', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    console.log('Received cart add request:', req.body); // Log incoming data

    const { name, price, quantity, unit, type } = req.body;

    // Validate input more thoroughly
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Invalid product name' });
    }
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    if (!['kg', 'g', 'packet', 'sapling', '250ml', '500ml', '1ltr'].includes(unit)) {
      return res.status(400).json({ error: 'Invalid unit' });
    }

    // Convert to proper types
    const parsedPrice = parseFloat(price);
    const parsedQuantity = unit === 'sapling' ? parseInt(quantity) : parseFloat(quantity);

    // Check for existing item
    const existingItemIndex = user.cart.findIndex(item => 
      item.name === name && item.unit === unit && item.type === type
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      user.cart[existingItemIndex].quantity += parsedQuantity;
    } else {
      // Add new item
      user.cart.push({
        name,
        price: parsedPrice,
        quantity: parsedQuantity,
        unit,
        type
      });
    }

    // Save with error handling
    try {
      await user.save();
      console.log('Cart updated successfully for user:', user._id);
      return res.json({ 
        success: true, 
        cart: user.cart,
        message: 'Item added to cart successfully'
      });
    } catch (saveError) {
      console.error('Database save error:', saveError);
      return res.status(500).json({ 
        error: 'Database operation failed',
        details: saveError.message
      });
    }

  } catch (err) {
    console.error('Cart add endpoint error:', err);
    return res.status(500).json({ 
      error: 'Failed to update cart',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
app.put('/api/cart/update', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { itemId, newQuantity } = req.body;

    // Find item and update quantity
    const item = user.cart.find(item => item._id == itemId);
    if (!item) return res.status(404).json({ error: 'Item not found in cart' });

    item.quantity = newQuantity;
    await user.save();

    res.json({ success: true, cart: user.cart });
  } catch (err) {
    console.error("Cart update error:", err.message);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});
app.delete('/api/cart/remove', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.body;

  try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.cart = user.cart.filter(item => item._id.toString() !== itemId);
      await user.save();

      res.json({ message: 'Item removed successfully', cart: user.cart });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error while removing item' });
  }
});
