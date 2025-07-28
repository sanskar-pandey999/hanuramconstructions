const express = require("express");
const fs = require("fs"); // Not directly used in the current version, but often helpful
const path = require("path");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // For password encryption so that it csn not be hijacked

const session = require('express-session'); // For session management login remeber rkhne k liye cookiess

console.log("1. Starting server setup...");

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(express.json()); // Parses JSON-formatted request bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded request bodies
console.log("3. Middleware configured.");

// Configure express-session middleware for user sessions
app.use(session({
    secret: 'your_super_secret_key_very_long_and_random', // **CRITICAL: Replace with a strong, random, long string for production!**
    resave: false, // Prevents saving the session back to the session store if it hasn't changed
    saveUninitialized: false, // Prevents saving new sessions that have not been modified
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // Cookie expires in 1 day (in milliseconds)
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === 'production' // Only send cookie over HTTPS in production
    }
}));
console.log("Session middleware configured.");

// Serve static files (CSS, images, client-side JS) from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));
console.log(`Static files served from: ${path.join(__dirname, "public")}`);

// --- Mongoose Schema Definitions ---

// Schema for Contact Us form submissions
const ContactusSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // Ensures each email submitted is unique
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    contactPreference: {
        type: String,
        required: true,
        enum: ['Call me', 'Email me'] // Restricts values to these two options
    },
    requirementType: {
        type: String,
        required: true,
        enum: [ // Restricts values to these specific types
            'Supervision and Management',
            'Flat/Bungalow in HR Society',
            'Renovated Bungalow/Flat (HR)'
        ]
    },
    detailsChecked: {
        type: Boolean,
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now // Automatically sets the submission date
    }
});
const Contactus = mongoose.model('Contactus', ContactusSchema); // Creates the 'contactuses' collection

// Schema for User Accounts (Login/Create Account)
const UserAccountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // Ensures each email used for an account is unique
    },
    password: { // This field will store the hashed password
        type: String,
        required: true,
        select: false // **IMPORTANT:** Prevents the password from being returned by default in queries
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically sets the account creation date
    }
});

// Pre-save hook for UserAccountSchema to hash the password before saving a new user
UserAccountSchema.pre('save', async function (next)
// above line specifies before starting the  
 {
    if (this.isModified('password')) { // Only hash if the password field is new or modified
        try {
            this.password = await bcrypt.hash(this.password, 10); // Hashes password with 10 salt rounds
            console.log(`Password for ${this.email} hashed successfully.`);
            next(); // Proceed with saving
        } catch (error) {
            console.error("Error hashing password:", error);
            next(error); // Pass the error to the next middleware
        }
    } else {
        next(); // If password isn't modified, move on
    }
});

// above code hash the password so that id someone takes the data base can not read the passwords
const UserAccount = mongoose.model('UserAccount', UserAccountSchema); // Creates the 'useraccounts' collection

// --- Routes ---

// GET route for the main home page
app.get("/html/home.html", (req, res) => {
    console.log("GET /html/home.html requested.");
    res.sendFile(path.join(__dirname, "html", "home.html"));
});

// GET route for the About Us page
app.get("/html/about.html", (req, res) => {
    console.log("GET /html/about.html requested.");
    res.sendFile(path.join(__dirname, "html", "about.html"));
});

// GET route for the Contact Us page
app.get("/html/contactus.html", (req, res) => {
    console.log("GET /html/contactus.html requested.");
    res.sendFile(path.join(__dirname, "html", "contactus.html"));
});

// GET route for the Services page
app.get("/html/services.html", (req, res) => {
    console.log("GET /html/services.html requested.");
    res.sendFile(path.join(__dirname, "html", "services.html"));
});

// GET route for the Login/Create Account page
app.get("/html/login.html", (req, res) => {
    console.log("GET /html/login.html requested.");
    res.sendFile(path.join(__dirname, "html", "login.html"));
});

// GET route for the Login/Create Account page
app.get("/html/engineers.html", (req, res) => {
    console.log("GET /html/engineers.html requested.");
    res.sendFile(path.join(__dirname, "html", "engineers.html"));
});

// GET route for the Login/Create Account page
app.get("/html/engineerss/engineer1.html", (req, res) => {
    console.log("GET /html/engineers/engineer1.html requested.");
    res.sendFile(path.join(__dirname, "html/engineerss", "engineer1.html"));
});

// GET route for the Login/Create Account page
app.get("/html/engineerss/engineer2.html", (req, res) => {
    console.log("GET /html/engineers/engineer2.html requested.");
    res.sendFile(path.join(__dirname, "html/engineerss", "engineer2.html"));
});


// GET route for the Login/Create Account page
app.get("/html/engineerss/engineer3.html", (req, res) => {
    console.log("GET /html/engineers/engineer1.html requested.");
    res.sendFile(path.join(__dirname, "html/engineerss", "engineer3.html"));
});


// GET route for the Login/Create Account page
app.get("/html/engineerss/engineer4.html", (req, res) => {
    console.log("GET /html/engineers/engineer4.html requested.");
    res.sendFile(path.join(__dirname, "html/engineerss", "engineer4.html"));
});


// API endpoint to check current user session status (for client-side UI updates)
app.get('/api/user-status', (req, res) => {
    if (req.session.user) {
        console.log(`User session active: ${req.session.user.email}`);
        res.json({ loggedIn: true, name: req.session.user.name });
    } else {
        console.log("No user session found.");
        res.json({ loggedIn: false });
    }
});

// API endpoint for user logout
app.post('/api/logout', (req, res) => {
    if (req.session.user) {
        console.log(`Attempting to log out user: ${req.session.user.email}`);
    } else {
        console.log("Logout request received, but no active session.");
    }

    req.session.destroy(err => { // Destroys the session
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Failed to log out due to server error." });
        }
        res.clearCookie('connect.sid'); // Clears the session cookie from the browser joki automatic login mein use hoti
        res.json({ message: "Logged out successfully!" });
    });
});

// POST route for Contact Us form submission
app.post("/home/contactus", async (req, res) => {
    console.log("POST /home/contactus received:", req.body);
    try {
        const newContact = new Contactus(req.body);
        await newContact.save(); // Saves the new contact entry to MongoDB
        console.log("Contact form entry saved:", newContact.email);
        // Redirects to home page after successful submission
        res.status(200).send("<script>alert('Your message has been sent successfully!'); window.location.href='/html/home.html';</script>");
    } catch (error) {
        console.error("Error saving contact form entry:", error);
        if (error.code === 11000) { // MongoDB duplicate key error (email is unique)
            return res.status(409).send("<script>alert('Email already registered for contact. Please use a different email or login.'); window.location.href='/html/contactus.html';</script>");
        } else if (error.name === 'ValidationError') { // Mongoose validation error (e.g., missing required fields)
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).send(`<script>alert('Validation failed: ${messages.join(', ')}'); window.location.href='/html/contactus.html';</script>`);
        } else { // Generic server error
            return res.status(500).send("<script>alert('Failed to submit contact form due to a server error. Please try again.'); window.location.href='/html/contactus.html';</script>");
        }
    }
});

// POST route for Create Account (User Registration)
app.post("/home/login", async (req, res) => {
    console.log("POST /home/createaccount received:", req.body);
    const { name, email, password } = req.body;

    // Basic server-side validation for required fields
    if (!name || !email || !password) {
        return res.status(400).send("<script>alert('All fields are required to create an account.'); window.location.href='/html/login.html';</script>");
    }

    try {
        const existingUser = await UserAccount.findOne({ email }); // Check if user already exists
        if (existingUser) {
            console.log(`Account creation attempt: Email ${email} already registered.`);
            return res.status(409).send("<script>alert('Email already registered. Please login or use a different email.'); window.location.href='/html/login.html';</script>");
        }

        const newUser = new UserAccount({ name, email, password }); // Create new user instance
        await newUser.save(); // Save the new user (password will be hashed by pre-save hook)
        console.log(`New user account created: ${newUser.email}`);


        // Automatically log in the user after successful account creation
        req.session.user = { id: newUser._id, name: newUser.name, email: newUser.email };
        console.log(`Session created for new user: ${newUser.email}`);
        res.redirect("/html/home.html"); // Redirect to home page

    } catch (error) {
        console.error("Error during account creation:", error);
        if (error.code === 11000) { // MongoDB duplicate key error (email is unique)
            return res.status(409).send("<script>alert('Email already registered. Please login or use a different email.'); window.location.href='/html/login.html';</script>");
        } else if (error.name === 'ValidationError') { // Mongoose validation error
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).send(`<script>alert('Validation failed during account creation: ${messages.join(', ')}'); window.location.href='/html/login.html';</script>`);
        }
        // Generic server error for other unexpected issues
        res.status(500).send("<script>alert('Failed to create account due to a server error. Please try again.'); window.location.href='/html/login.html';</script>");
    }
});

// POST route for User Login
app.post("/home/login", async (req, res) => {
    console.log("POST /home/login received:", req.body);
    const { email, password } = req.body;

    // Basic server-side validation for required fields
    if (!email || !password) {
        return res.status(400).send("<script>alert('Email and password are required for login.'); window.location.href='/html/login.html';</script>");
    }

    try {
        // Find user by email and explicitly select the password field because it's set to `select: false`
        const user = await UserAccount.findOne({ email }).select('+password');
        // await will complete this line then only it will allow further tasks

        // Check if user exists
        if (!user) {
            console.log(`Login attempt: User with email ${email} not found.`);
            return res.status(401).send("<script>alert('Invalid email or password.'); window.location.href='/html/login.html';</script>");
        }

        console.log(`Login attempt for ${email}. User input password length: ${password.length}`);
        // Compare provided password with the hashed password from the database

        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password comparison result for ${email}: ${isMatch}`);

        if (!isMatch) {
            console.log(`Login attempt failed for ${email}: Incorrect password.`);
            return res.status(401).send("<script>alert('Invalid email or password.'); window.location.href='/html/login.html';</script>");
        }

        // Successful login: Set user data in the session
        req.session.user = { id: user._id, name: user.name, email: user.email };
        console.log(`User ${user.email} successfully logged in. Session created.`);
        res.redirect("/html/home.html"); // Redirect to home page

    } catch (error) {
        console.error(`Error during login for email ${email}:`, error);
        // Generic server error for unexpected issues
        res.status(500).send("<script>alert('Failed to process login due to a server error. Please try again.'); window.location.href='/html/login.html';</script>");
    }
});

// --- Server Start and MongoDB Connection ---
console.log("4. Attempting to start server...");
async function startServer() {
    try {
        // Connect to MongoDB database named 'hrsample'
        await mongoose.connect('mongodb://127.0.0.1:27017/hrsample');
        console.log("✅ Connection Established to MongoDB: hrsample");

        // Start the Express server
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        // Log critical error and exit if MongoDB connection fails
        console.error("❌ Critical error: Server failed to start or connect to DB!", error.message);
        process.exit(1); // Exit process with failure code
    }
}

startServer(); // Call the function to start the server and connect to DB
