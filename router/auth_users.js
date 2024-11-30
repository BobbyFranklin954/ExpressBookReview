const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = []; // In-memory user storage for demonstration

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

// Registration route
regd_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  users.push({ username, password }); // In a real app, hash the password before storing
  res.status(201).json({ message: "User registered successfully" });
});

// Login route
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body; // Get username and password from request body

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  // Find the user in the users array
  const user = users.find(user => user.username === username);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username: user.username }, "your_jwt_secret", { expiresIn: '60m' }); // Use the same secret
  res.json({ token });
});

// Add or modify a book review (accessible only by authenticated users)
regd_users.put("/auth/review/:isbn", auth, (req, res) => {
  const isbn = req.params.isbn; // Get the ISBN from the request parameters
  const { rating, comment } = req.body; // Get review details from the request body
  const username = req.user.username; // Get the username from the authenticated user

  // Check if the book exists
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Check if review details are provided
  if (rating === undefined || !comment) {
    return res.status(400).json({ message: "Rating and comment are required" });
  }

  // Check if the user has already reviewed this book
  if (book.reviews[username]) {
    // User has already reviewed, update the existing review
    book.reviews[username] = { rating, comment };
    res.status(200).json({ message: "Review updated successfully", book });
  } else {
    // Add a new review
    book.reviews[username] = { rating, comment };
    res.status(201).json({ message: "Review added successfully", book });
  }
});

// Delete a book review (accessible only by authenticated users)
regd_users.delete("/auth/review/:isbn", auth, (req, res) => {
  const isbn = req.params.isbn; // Get the ISBN from the request parameters
  const username = req.user.username; // Get the username from the authenticated user

  // Check if the book exists
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Check if the user has a review for this book
  if (!book.reviews[username]) {
    return res.status(404).json({ message: "Review not found for this user" });
  }

  // Remove the review
  delete book.reviews[username];
  res.status(200).json({ message: "Review deleted successfully", book });
});

module.exports.authenticated = regd_users;
module.exports.users = users;
