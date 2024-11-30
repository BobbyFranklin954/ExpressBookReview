const express = require('express');
const axios = require('axios'); // Import Axios
let books = require("./booksdb.js");
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Async function to simulate a database query
const getBooksByAuthorFromDatabase = async (author) => {
  return new Promise((resolve, reject) => {
    try {
      // Filter books by matching the author's name (case-insensitive)
      const booksByAuthor = Object.values(books).filter(book =>
        book.author.toLowerCase().includes(author.toLowerCase())
      );

      // Resolve the promise with the result
      resolve(booksByAuthor);
    } catch (error) {
      // Reject the promise if an error occurs
      reject(error);
    }
  });
};

public_users.post("/register", (req, res) => {
  const { username, password } = req.body; // Get username and password from request body

  // Check if username is provided
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  // Check if user already exists
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Add new user to the users array
  users.push({ username, password }); // In a real app, hash the password before storing
  res.status(201).json({ message: "User registered successfully" });
});

// Endpoint to serve the books data
public_users.get('/books', (req, res) => {
  res.json(books); // Send the list of books as a JSON response
});

// Merged endpoint to get book details based on ISBN using Axios
public_users.get('/isbn/:isbn', async (req, res) => {
  const isbn = req.params.isbn; // Get the ISBN from the request parameters

  try {
    // Fetch book details from the local endpoint
    const response = await axios.get(`http://localhost:3333/books/${isbn}`); // Use the local endpoint
    res.json(response.data); // Send the book details as a JSON response
  } catch (error) {
    console.error("Error fetching book details:", error);
    res.status(404).json({ message: "Book not found" }); // Handle case where book is not found
  }
});

// Endpoint to serve selected book based on ISBN
public_users.get('/books/:isbn', (req, res) => {
  const isbn = req.params.isbn; // Get the ISBN from the request parameters
  const book = books[isbn]; // Access the book directly using ISBN as the key

  if (book) {
    res.json(book); // Send the book details as a JSON response
  } else {
    res.status(404).json({ message: "Book not found" }); // Handle case where book is not found
  }
});

// Get the book list available in the shop using async-await with Axios
public_users.get('/', async (req, res) => {
  try {
    // Fetch books from the local endpoint
    const response = await axios.get('http://localhost:3333/books'); // Use the local endpoint
    res.json(response.data); // Send the list of books as a JSON response
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Error fetching books" });
  }
});

// Endpoint to get all books by a specific author using Promise callbacks
public_users.post('/author', async (req, res) => {
  try {
    const { author } = req.body; // Extract 'author' from the JSON body

    if (!author) {
      return res.status(400).json({ message: "Author is required for search criteria" });
    }

    const booksByAuthor = await getBooksByAuthorFromDatabase(author);

    if (booksByAuthor.length > 0) {
      res.json(booksByAuthor);
    } else {
      res.status(404).json({ message: "No books found for this author" });
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
});

// Refactored endpoint to get books based on title using async-await with Axios
public_users.post('/title', async (req, res) => {
  const { title } = req.body; // Get the title from the request body

  if (!title) {
    return res.status(400).json({ message: "Title is required" }); // Handle case where title is not provided
  }

  try {
    // Fetch all books from the local endpoint
    const response = await axios.get('http://localhost:3333/books'); // Fetch all books
    const books = response.data; // The books object
    const booksByTitle = Object.values(books).filter(book =>
      book.title.toLowerCase().includes(title.toLowerCase()));
    if (booksByTitle.length > 0) {
      res.json(booksByTitle); // Send the list of books matching the title as a JSON response
    } else {
      res.status(404).json({ message: "No books found with this title" }); // Handle case where no books are found
    }
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Error fetching books" }); // Handle server error
  }
});

// Get book reviews based on ISBN
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn; // Get the ISBN from the request parameters
  const book = books[isbn]; // Access the book directly using ISBN as the key

  if (book) {
    res.json(book.reviews); // Send the reviews of the book as a JSON response
  } else {
    res.status(404).json({ message: "Book not found" }); // Handle case where book is not found
  }
});



module.exports.general = public_users;
