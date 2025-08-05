// Import necessary modules
const express = require('express');
const router = express.Router();
const path = require('path');

// Correctly import the engineers.json file using a relative path.
// The path '..' moves up one directory from the 'routes' folder to the main 'JS' folder.
// Then it moves into the 'data' folder to find the file.
const engineersData = require('../data/engineers.json');

// This module exports a function that returns the router.
// It receives the Contactus Mongoose model as an argument from the main server file.
module.exports = function (Contactus) {

    // GET route for the main home page
    router.get("/", (req, res) => {
        console.log("GET / requested. Serving home.html");
        res.sendFile(path.join(__dirname, "..", "html", "home.html"));
    });

    // GET route for the main home page (direct access)
    router.get("/html/home.html", (req, res) => {
        console.log("GET /html/home.html requested.");
        res.sendFile(path.join(__dirname, "..", "html", "home.html"));
    });

    // GET route for the About Us page
    router.get("/html/about.html", (req, res) => {
        console.log("GET /html/about.html requested.");
        res.sendFile(path.join(__dirname, "..", "html", "about.html"));
    });

    // GET route for the Services page
    router.get("/html/services.html", (req, res) => {
        console.log("GET /html/services.html requested.");
        res.sendFile(path.join(__dirname, "..", "html", "services.html"));
    });

    // GET route for the Engineers main page
    router.get("/html/main.html", (req, res) => {
        console.log("GET /html/main.html requested.");
        res.sendFile(path.join(__dirname, "..", "html", "main.html"));
    });


    // GET route to serve the JSON data for the engineers
    router.get('/api/main', (req, res) => {
        console.log("GET /api/main requested. Serving static JSON data.");
        res.json(engineersData);
    });


    // GET route for the Forgot Password page
    router.get("/html/forgetpassword.html", (req, res) => {
        console.log("GET /html/forgetpassword.html requested.");
        res.sendFile(path.join(__dirname, "..", "html", "forgetpassword.html"));
    });

    // GET route for the Contact Us page
    router.get("/html/contactus.html", (req, res) => {
        console.log("GET /html/contactus.html requested.");
        res.sendFile(path.join(__dirname, "..", "html", "contactus.html"));
    });

    // GET route for the login page
    router.get("/html/login.html", (req, res) => {
        console.log("GET /html/login.html requested.");
        res.sendFile(path.join(__dirname, "..", "html", "login.html"));
    });

    // POST route for Contact Us form submission
    router.post("/home/contactus", async (req, res) => {
        console.log("POST /home/contactus received:", req.body);
        try {
            // Use the Contactus model passed as an argument
            const newContact = new Contactus(req.body);
            await newContact.save(); // Saves the new contact entry to MongoDB
            console.log("Contact form entry saved:", newContact.email);
            // Redirects to home page after successful submission
            res.status(200).send("<script>alert('Your message has been sent successfully!'); window.location.href='/html/home.html';</script>");
        } catch (error) {
            console.error("Error saving contact form entry:", error);
            if (error.code === 11000) { // MongoDB duplicate key error (if email was unique)
                return res.status(409).send("<script>alert('Email already registered for contact. Please use a different email or login.'); window.location.href='/html/contactus.html';</script>");
            } else if (error.name === 'ValidationError') { // Mongoose validation error (e.g., missing required fields)
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).send(`<script>alert('Validation failed: ${messages.join(', ')}'); window.location.href='/html/contactus.html';</script>`);
            } else { // Generic server error
                return res.status(500).send("<script>alert('Failed to submit contact form due to a server error. Please try again.'); window.location.href='/html/contactus.html';</script>");
            }
        }
    });

    return router;
};