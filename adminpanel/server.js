const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/agrodirect", {  
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ✅ **Schemas**
const itemSchema = new mongoose.Schema({
    name: String,
    img: String,
    price: Number,
    desc: String,
    rating: Number,
    isAvailable: { type: Boolean, default: false }
});

const oilExtractSchema = new mongoose.Schema({
    name: String,
    img: String,
    price: Number,
    desc: String,
    rating: Number,
    isAvailable: { type: Boolean, default: false },
    size: { type: String, enum: ['500ml', '1l'], default: '500ml' }
});

const Fruit = mongoose.model("Fruit", itemSchema);
const Vegetable = mongoose.model("Vegetable", itemSchema);
const Seed = mongoose.model("Seed", itemSchema);
const Sapling = mongoose.model("Sapling", itemSchema);
const OilExtract = mongoose.model("OilExtract",itemSchema); // Using your existing collection

// ✅ **Admin: Get All Items**
app.get("/admin/fruits", async (req, res) => {
    const fruits = await Fruit.find();
    res.json(fruits);
});

app.get("/admin/vegetables", async (req, res) => {
    const Vegetables = await Vegetable.find();
    res.json(Vegetables);
});

app.get("/admin/seeds", async (req, res) => {
    const seeds = await Seed.find();
    res.json(seeds);
});

app.get("/admin/saplings", async (req, res) => {
    const saplings = await Sapling.find();
    res.json(saplings);
});

app.get("/admin/oilextract", async (req, res) => {
    const oilExtracts = await OilExtract.find();
    res.json(oilExtracts);
});

// ✅ **Admin: Update Availability**
app.post("/admin/select-fruit", async (req, res) => {
    const { name, isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
        return res.status(400).json({ success: false, message: "Invalid isAvailable value" });
    }

    const result = await Fruit.updateOne({ name }, { $set: { isAvailable } });

    if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Fruit not found" });
    }

    res.json({ success: true, message: "Fruit availability updated" });
});

app.post("/admin/select-vegetable", async (req, res) => {
    const { name, isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
        return res.status(400).json({ success: false, message: "Invalid isAvailable value" });
    }

    const result = await Vegetable.updateOne({ name }, { $set: { isAvailable } });

    if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Vegetable not found" });
    }

    res.json({ success: true, message: "Vegetable availability updated" });
});

app.post("/admin/select-seed", async (req, res) => {
    const { name, isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
        return res.status(400).json({ success: false, message: "Invalid isAvailable value" });
    }

    const result = await Seed.updateOne({ name }, { $set: { isAvailable } });

    if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Seed not found" });
    }

    res.json({ success: true, message: "Seed availability updated" });
});

app.post("/admin/select-sapling", async (req, res) => {
    const { name, isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
        return res.status(400).json({ success: false, message: "Invalid isAvailable value" });
    }

    const result = await Sapling.updateOne({ name }, { $set: { isAvailable } });

    if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Sapling not found" });
    }

    res.json({ success: true, message: "Sapling availability updated" });
});

app.post("/admin/select-oilextract", async (req, res) => {
    const { name, isAvailable, size } = req.body;

    if (typeof isAvailable !== "boolean") {
        return res.status(400).json({ success: false, message: "Invalid isAvailable value" });
    }

    const update = size ? { isAvailable, size } : { isAvailable };

    const result = await OilExtract.updateOne({ name }, { $set: update });

    if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Oil extract not found" });
    }

    res.json({ 
        success: true, 
        message: size ? `Oil extract size and availability updated` : "Oil extract availability updated" 
    });
});

// ✅ **Client: Get Available Items**
app.get("/client/fruits", async (req, res) => {
    const fruits = await Fruit.find({ isAvailable: true });
    res.json(fruits);
});

app.get("/client/vegetables", async (req, res) => {
    const vegetables = await Vegetable.find({ isAvailable: true });
    res.json(vegetables);
});

app.get("/client/seeds", async (req, res) => {
    const seeds = await Seed.find({ isAvailable: true });
    res.json(seeds);
});

app.get("/client/saplings", async (req, res) => {
    const saplings = await Sapling.find({ isAvailable: true });
    res.json(saplings);
});

app.get("/client/oilextract", async (req, res) => {
    const oilExtracts = await OilExtract.find({ isAvailable: true });
    res.json(oilExtracts);
});

// ✅ **Change Port to 5003**
const PORT = 5003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));