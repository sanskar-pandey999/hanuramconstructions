const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');

module.exports = function(UserAccount, Contactus) {

    router.post("/home/createaccount", async (req, res) => {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).send("<script>alert('All fields are required to create an account.'); window.location.href='/html/login.html';</script>");
        }

        try {
            const existingUser = await UserAccount.findOne({ email });
            if (existingUser) {
                return res.status(409).send("<script>alert('Email already registered. Please login or use a different email.'); window.location.href='/html/login.html';</script>");
            }

            const newUser = new UserAccount({ name, email, password });
            await newUser.save();

            req.session.user = { id: newUser._id, name: newUser.name, email: newUser.email };
            res.redirect("/html/home.html");

        } catch (error) {
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

    router.post("/home/login", async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("<script>alert('Email and password are required for login.'); window.location.href='/html/login.html';</script>");
        }

        try {
            const user = await UserAccount.findOne({ email }).select('+password');

            if (!user) {
                return res.status(401).send("<script>alert('Invalid email or password.'); window.location.href='/html/login.html';</script>");
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).send("<script>alert('Invalid email or password.'); window.location.href='/html/login.html';</script>");
            }

            req.session.user = { id: user._id, name: user.name, email: user.email };
            res.redirect("/html/home.html");

        } catch (error) {
            console.error(`Error during login for email ${email}:`, error);
            res.status(500).send("<script>alert('Failed to process login due to a server error. Please try again.'); window.location.href='/html/login.html';</script>");
        }
    });
    
    router.post("/home/contactus", async (req, res) => {
        try {
            const newContact = new Contactus(req.body);
            await newContact.save();
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
