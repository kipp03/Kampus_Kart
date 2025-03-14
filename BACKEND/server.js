const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/campuscarts', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// User model
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model('User', userSchema);

// Item model
const itemSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const Item = mongoose.model('Item', itemSchema);

// Routes
app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        await user.save();
        res.status(201).send('User created successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to create user');
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(401).send('Invalid credentials');
        const isValidPassword = await bcrypt.compare(req.body.password, user.password);
        if (!isValidPassword) return res.status(401).send('Invalid credentials');
        const token = jwt.sign({ userId: user._id }, 'secretkey', { expiresIn: '1h' });
        res.cookie('jwt', token, { httpOnly: true });
        res.send('Logged in successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to login');
    }
});

app.post('/items', async (req, res) => {
    try {
        const item = new Item({
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            seller: req.user._id
        });
        await item.save();
        res.status(201).send('Item created successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to create item');
    }
});

app.get('/items', async (req, res) => {
    try {
        const items = await Item.find().populate('seller', 'name email');
        res.send(items);
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to fetch items');
    }
});

const port = 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
