const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;
const secretKey = 'your_secret_key';

const db = new sqlite3.Database('database.sqlite');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        weight TEXT,
        image TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        productId INTEGER,
        quantity INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (productId) REFERENCES products(id)
    )`);
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hashedPassword], function(err) {
        if (err) {
            return res.status(500).send('User already exists');
        }
        res.status(200).send('User registered');
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) {
            return res.status(400).send('Invalid credentials');
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).send('Invalid credentials');
        }
        const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1h' });
        res.json({ token });
    });
});

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

app.post('/admin/products', authenticateJWT, (req, res) => {
    const { name, price, weight, image } = req.body;
    db.run(`INSERT INTO products (name, price, weight, image) VALUES (?, ?, ?, ?)`, [name, price, weight, image], function(err) {
        if (err) {
            return res.status(500).send('Failed to add product');
        }
        res.status(200).send('Product added');
    });
});

app.get('/products', (req, res) => {
    db.all(`SELECT * FROM products`, (err, rows) => {
        if (err) {
            return res.status(500).send('Failed to fetch products');
        }
        res.json(rows);
    });
});

app.post('/cart', authenticateJWT, (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
    db.get(`SELECT * FROM cart WHERE userId = ? AND productId = ?`, [userId, productId], (err, row) => {
        if (row) {
            db.run(`UPDATE cart SET quantity = quantity + 1 WHERE userId = ? AND productId = ?`, [userId, productId], function(err) {
                if (err) {
                    return res.status(500).send('Failed to update cart');
                }
                res.status(200).send('Cart updated');
            });
        } else {
            db.run(`INSERT INTO cart (userId, productId, quantity) VALUES (?, ?, ?)`, [userId, productId, 1], function(err) {
                if (err) {
                    return res.status(500).send('Failed to add to cart');
                }
                res.status(200).send('Added to cart');
            });
        }
    });
});

app.get('/cart', authenticateJWT, (req, res) => {
    const userId = req.user.id;
    db.all(`SELECT cart.*, products.name, products.price, products.weight, products.image FROM cart JOIN products ON cart.productId = products.id WHERE cart.userId = ?`, [userId], (err, rows) => {
        if (err) {
            return res.status(500).send('Failed to fetch cart items');
        }
        res.json(rows);
    });
});

app.post('/checkout', authenticateJWT, (req, res) => {
    const userId = req.user.id;
    db.run(`DELETE FROM cart WHERE userId = ?`, [userId], function(err) {
        if (err) {
            return res.status(500).send('Failed to checkout');
        }
        res.status(200).send('Checkout successful');
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
