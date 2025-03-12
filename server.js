require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ 
  origin: "*",  // Allow frontend to call APIs
  methods: ["GET", "POST"], 
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Define Email Schema and Model
const emailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  subscribedAt: { type: Date, default: Date.now },
});

const Email = mongoose.model("Email", emailSchema);

// ✅ Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,          // Your Gmail email
    pass: process.env.EMAIL_PASSWORD, // Your Gmail App Password
  },
});

// ✅ API Endpoint for Subscription
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  // Validate Email Format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format!" });
  }

  try {
    // Check if Email Already Exists in Database
    const existingEmail = await Email.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already subscribed!" });
    }

    // Save Email to Database
    const newEmail = new Email({ email });
    await newEmail.save();

    // Send Confirmation Email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Thanks for Subscribing to Our Newsletter!",
      text: `Hello,\n\nThank you for subscribing to our newsletter! Stay tuned for the latest updates on organic products, farming tips, and exclusive offers.\n\nBest Regards,\nAgro Direct Team`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Subscription successful! A confirmation email has been sent." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
