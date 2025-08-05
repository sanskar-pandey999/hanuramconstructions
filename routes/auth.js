const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');

// This module exports a function that takes the Mongoose models as arguments.
// This allows the main server.js to create the models after connecting to the DB
// and pass them here, ensuring the models are ready to be used.
module.exports = function(UserAccount, Contactus) {

    // POST route for Create Account (User Registration)
    router.post("/home/createaccount", async (req, res) => {
        console.log("POST /home/createaccount received:", req.body);
        const { name, email, password } = req.body;

        // Basic server-side validation for required fields
        if (!name || !email || !password) {
            console.error("Account creation failed: Missing required fields.");
            return res.status(400).send("<script>alert('All fields are required to create an account.'); window.location.href='/html/login.html';</script>");
        }

        try {
            // Find user using the UserAccount model passed as a function argument.
            const existingUser = await UserAccount.findOne({ email });
            if (existingUser) {
                console.log(`Account creation attempt: Email ${email} already registered.`);
                return res.status(409).send("<script>alert('Email already registered. Please login or use a different email.'); window.location.href='/html/login.html';</script>");
            }

            // The password hashing is now handled by the pre('save') hook in the model.
            const newUser = new UserAccount({ name, email, password });
            await newUser.save();
            console.log(`New user account created: ${newUser.email}`);

            req.session.user = { id: newUser._id, name: newUser.name, email: newUser.email };
            console.log(`Session created for new user: ${newUser.email}`);
            res.redirect("/html/home.html");

        } catch (error) {
            // Log the error for debugging. This will help you see what's failing.
            console.error("Error during account creation:", error);

            if (error.code === 11000) {
                return res.status(409).send("<script>alert('Email already registered. Please login or use a different email.'); window.location.href='/html/login.html';</script>");
            } else if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).send(`<script>alert('Validation failed during account creation: ${messages.join(', ')}'); window.location.href='/html/login.html';</script>`);
            }
            res.status(500).send("<script>alert('Failed to create account due to a server error. Please try again.'); window.location.href='/html/login.html';</script>");
        }
    });

    // POST route for User Login
    router.post("/home/login", async (req, res) => {
        console.log("POST /home/login received:", req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("<script>alert('Email and password are required for login.'); window.location.href='/html/login.html';</script>");
        }

        try {
            const user = await UserAccount.findOne({ email }).select('+password');

            if (!user) {
                console.log(`Login attempt: User with email ${email} not found.`);
                return res.status(401).send("<script>alert('Invalid email or password.'); window.location.href='/html/login.html';</script>");
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                console.log(`Login attempt failed for ${email}: Incorrect password.`);
                return res.status(401).send("<script>alert('Invalid email or password.'); window.location.href='/html/login.html';</script>");
            }

            req.session.user = { id: user._id, name: user.name, email: user.email };
            console.log(`User ${user.email} successfully logged in. Session created.`);
            res.redirect("/html/home.html");

        } catch (error) {
            console.error(`Error during login for email ${email}:`, error);
            res.status(500).send("<script>alert('Failed to process login due to a server error. Please try again.'); window.location.href='/html/login.html';</script>");
        }
    });
    
    // POST route for Contact Us form submission (now in the correct router)
    router.post("/home/contactus", async (req, res) => {
        console.log("POST /home/contactus received:", req.body);
        try {
            // Use the Contactus model passed as an argument
            const newContact = new Contactus(req.body);
            await newContact.save();
            console.log("Contact form entry saved:", newContact.email);
            res.status(200).send("<script>alert('Your message has been sent successfully!'); window.location.href='/html/home.html';</script>");
        } catch (error) {
            console.error("Error saving contact form entry:", error);
            if (error.code === 11000) {
                return res.status(409).send("<script>alert('Email already registered for contact. Please use a different email or login.'); window.location.href='/html/contactus.html';</script>");
            } else if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).send(`<script>alert('Validation failed: ${messages.join(', ')}'); window.location.href='/html/contactus.html';</script>`);
            } else {
                return res.status(500).send("<script>alert('Failed to submit contact form due to a server error. Please try again.'); window.location.href='/html/contactus.html';</script>");
            }
        }
    });

    return router;
};
