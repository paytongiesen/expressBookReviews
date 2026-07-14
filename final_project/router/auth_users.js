const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
    // Filter the users array for any user with the same username
    let userswithsamename = users.filter((user) => {
        return user.username === username;
    });
    // Return false if any user with the same username is found, otherwise true
    if (userswithsamename.length > 0) {
        return false;
    } else {
        return true;
    }
}

const authenticatedUser = (username,password)=>{ //returns boolean
    // Filter the users array for any user with the same username and password
    let validusers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });
    // Return true if any valid user is found, otherwise false
    if (validusers.length > 0) {
        return true;
    } else {
        return false;
    }
}

//only registered users can login
regd_users.post("/login", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Check if username or password is missing
    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in" });
    }

    // Authenticate user
    if (authenticatedUser(username, password)) {
        // Generate JWT access token
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });

        // Store access token and username in session
        req.session.authorization = {
            accessToken, username
        }
        return res.status(200).send("User successfully logged in");
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (!book) {
        return res.status(404).json({ message: "Unable to find book!" });
    }

    // Review must come from query parameter
    const review = req.query.review;
    if (!review) {
        return res.status(400).json({ message: "Review query parameter is required" });
    }

    // Username must come from session
    const username = req.session.authorization.username;

    // Ensure reviews object exists
    if (!book.reviews) {
        book.reviews = {};
    }

    // Add or update review for this user
    book.reviews[username] = review;

    return res.status(200).json({
        message: `Review for ISBN ${isbn} posted/updated by ${username}.`,
        reviews: book.reviews
    });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (!book) {
        return res.status(404).json({ message: "Unable to find book!" });
    }

    // Username must come from session
    const username = req.session.authorization.username;

    // Ensure reviews object exists
    if (!book.reviews) {
        book.reviews = {};
    }

    // Delete review for this user
    book.reviews[username] = "";

    return res.status(200).json({
        message: `Review for ISBN ${isbn} deleted by ${username}.`,
        reviews: book.reviews
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
