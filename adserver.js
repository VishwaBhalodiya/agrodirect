const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 4000;
const SECRET_KEY = "05b530690e8e128a5967adbebacf74b49930128db0416ce3c84f2057391c1d98f97a22f43c17cbae7eee56425578a3269dd3d1d7084ac5164759faf3ee277e24"; // Change this in production

// Middleware
app.use(express.json());
app.use(cors({
    credentials: true,
    origin: ["http://127.0.0.1:5500", "http://localhost:3000"] // Allow frontend origins
}));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/agrodirect', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('✅ MongoDB connected'));

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

const User = mongoose.model('User', userSchema);

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign({ id: user._id, name: user.name, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
};

// Middleware to verify token
const authenticateUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

// Sign-Up Route
app.post('/signup', async (req, res) => {
    try {
        const { email, name, password, role } = req.body;

        if (!email || !name || !password || !role) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        const user = new User({ email, name, password, role });
        await user.save();

        res.status(201).json({ message: '✅ Sign-up successful!' });
    } catch (error) {
        res.status(500).json({ message: '❌ Error signing up.', error });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: '❌ User not found.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: '❌ Incorrect password.' });

        const token = generateToken(user);

        // Store token in an HTTP-only cookie
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: false, // Change to true in production (HTTPS)
            sameSite: "lax"
        });
                

        res.status(200).json({ message: '✅ Login successful!' });

    } catch (error) {
        res.status(500).json({ message: '❌ Login error.', error });
    }
});

// Fetch Logged-In User
app.get('/user', authenticateUser, (req, res) => {
    res.json({ name: req.user.name, role: req.user.role });
});

// Logout Route
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: '✅ Logged out successfully' });
});

// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: '❌ Email not found.' });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
        await user.save();

        const resetLink = `http://localhost:4000/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: 'your-email@gmail.com', pass: 'your-email-password' }
        });

        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: email,
            subject: '🔑 Password Reset Request',
            text: `Click the link to reset your password: ${resetLink}`
        });

        res.status(200).json({ message: '📩 Password reset link sent to email.' });
    } catch (error) {
        res.status(500).json({ message: '❌ Error sending email.', error });
    }
});

// Reset Password Route
app.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: '❌ Invalid or expired token.' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: '✅ Password reset successful.' });
    } catch (error) {
        res.status(500).json({ message: '❌ Error resetting password.', error });
    }
});

// Start Server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
