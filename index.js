const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }))

const users = []; // In-memory user storage for demonstration

// Utility function to create a JWT
function createToken(user) {
    return jwt.sign({ username: user.username }, "your_jwt_secret", { expiresIn: '60m' });
}

// Registration route
app.post("/customer/auth/register", (req, res) => {
    const { username, password } = req.body;
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }
    users.push({ username, password }); // In a real app, hash the password
    res.status(201).json({ message: "User registered successfully" });
});

// Login route
app.post("/customer/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = createToken(user); // Create JWT token
    res.json({ token });
});

// Authentication middleware
function auth(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    jwt.verify(token, "your_jwt_secret", (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = decoded; // Save decoded user info to request
        next(); // Pass control to the next middleware or route handler
    });
}

const PORT = 3333;

// Apply the auth middleware to protected routes
app.use("/", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));
