require('dotenv').config(); // Load environment variables from .env file (for local development)
const express = require("express");
const fs = require("fs"); // Not directly used in the current version, but often helpful
const path = require("path");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // For password encryption
const session = require('express-session'); // For session management
const nodemailer = require('nodemailer'); // For sending emails
const crypto = require('crypto'); // For generating random PINs
// Dynamic engineer data
const engineers = require('./data/engineers.json');



console.log("1. Starting server setup...");

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for PORT or default to 3000

// --- Middleware ---
app.use(express.json()); // Parses JSON-formatted request bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded request bodies
console.log("3. Middleware configured.");

// Configure express-session middleware for user sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_super_secret_key_very_long_and_random', // **CRITICAL: Use a strong, random, long string from environment variables!**
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

// --- Nodemailer Transporter Setup ---
// Configure your email service provider details here
const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'outlook', 'sendgrid', etc.
    auth: {
        user: process.env.EMAIL_USER, // Your email address (from .env)
        pass: process.env.EMAIL_PASS  // Your email password or app-specific password (from .env)
    },
    // *** IMPORTANT: Add these logging options to see SMTP communication in your main app ***
    logger: true, // Enable verbose logging
    debug: true   // Enable detailed SMTP communication logging
    // Optional: For some services or if you encounter issues, you might need to specify host/port
    // host: 'smtp.gmail.com',
    // port: 587,
    // secure: false, // true for 465, false for other ports
    // tls: {
    //     rejectUnauthorized: false // Use this only if you are having issues with self-signed certs (not recommended for production)
    // }
});
console.log("Nodemailer transporter configured with debug logging."); // Updated log message

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
UserAccountSchema.pre('save', async function (next) {
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

const UserAccount = mongoose.model('UserAccount', UserAccountSchema); // Creates the 'useraccounts' collection

// Schema for Password Reset Tokens (New)
const PasswordResetTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true // Index for faster lookup
    },
    pin: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index: documents will automatically be removed after expiresAt
    },
    used: {
        type: Boolean,
        default: false
    }
});
const PasswordResetToken = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);

// --- Routes ---

// Add this route *after* your app.use(express.static(...))
// but *before* other specific app.get("/html/...") routes


// --- View-engine setup (ADD THIS) ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get("/", (req, res) => {
    console.log("GET / requested. Serving home.html");
    res.sendFile(path.join(__dirname, "html", "home.html"));
});


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

// // GET route for the Login/Create Account page
// app.get("/html/engineerss/engineer1.html", (req, res) => {
//     console.log("GET /html/engineers/engineer1.html requested.");
//     res.sendFile(path.join(__dirname, "html/engineerss", "engineer1.html"));
// });

// // GET route for the Login/Create Account page
// app.get("/html/engineerss/engineer2.html", (req, res) => {
//     console.log("GET /html/engineers/engineer2.html requested.");
//     res.sendFile(path.join(__dirname, "html/engineerss", "engineer2.html"));
// });


// // GET route for the Login/Create Account page
// app.get("/html/engineerss/engineer3.html", (req, res) => {
//     console.log("GET /html/engineers/engineer1.html requested.");
//     res.sendFile(path.join(__dirname, "html/engineerss", "engineer3.html"));
// });


// // GET route for the Login/Create Account page
// app.get("/html/engineerss/engineer4.html", (req, res) => {
//     console.log("GET /html/engineers/engineer4.html requested.");
//     res.sendFile(path.join(__dirname, "html/engineerss", "engineer4.html"));
// });

// --- Dynamic Engineer Profile Route (NEW) ---
app.get('/engineers/:id', (req, res) => {
  const engineer = engineers.find(e => e.engineerId === req.params.id);
  if (!engineer) {
    return res.status(404).send('Engineer not found');
  }
  res.render('engineer', { engineer });
});




// GET route for the Login/Create Account page
app.get("/html/forgetpassword.html", (req, res) => {
    console.log("GET /html/forgetpassword.html requested.");
    res.sendFile(path.join(__dirname, "html", "forgetpassword.html"));
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
        res.clearCookie('connect.sid'); // Clears the session cookie from the browser
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

// POST route for Create Account (User Registration) - Corrected from duplicate login route
app.post("/home/createaccount", async (req, res) => {
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
        // Find user by email and explicitly select the password field
        const user = await UserAccount.findOne({ email }).select('+password');

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

// --- Forgot Password Routes (New) ---

// POST /api/forgot-password/send-email: Send verification email with PIN
app.post('/api/forgot-password/send-email', async (req, res) => {
    const { email } = req.body;
    console.log(`[DEBUG] Received request to send reset email for: ${email}`); // ADDED LOG

    if (!email) {
        console.log("[DEBUG] Email not provided in request body."); // ADDED LOG
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const user = await UserAccount.findOne({ email });
        if (!user) {
            // For security, always respond with a generic message even if email not found
            console.log(`[DEBUG] Forgot password attempt for non-existent email: ${email}. Sending generic success.`); // ADDED LOG
            return res.status(200).json({ message: 'If an account with that email exists, a verification PIN has been sent.' });
        }

        console.log(`[DEBUG] Found user: ${user.email}. Generating PIN...`); // ADDED LOG
        // Generate a 6-digit PIN
        const pin = crypto.randomBytes(3).toString('hex').toUpperCase(); // Generates 6 hex characters (3 bytes)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // PIN valid for 15 minutes

        // Delete any existing unused PINs for this email
        await PasswordResetToken.deleteMany({ email, used: false });
        console.log(`[DEBUG] Existing unused PINs for ${email} cleared.`); // ADDED LOG

        const newResetToken = new PasswordResetToken({ email, pin, expiresAt });
        await newResetToken.save();
        console.log(`[DEBUG] Generated PIN for ${email}: ${pin}. Saved to DB.`); // ADDED LOG

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: email, // List of recipients
            subject: 'Georget - Password Reset Verification', // Subject line
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #007bff;">Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>You have requested to reset your password for your Georget account.</p>
                    <p>Your verification **PIN is: <strong style="font-size: 1.5em; color: #007bff;">${pin}</strong></p>
                    <p>This PIN is valid for 15 minutes. Please enter it on the password reset page to continue.</p>
                    <p>If you did not request a password reset, please ignore this email.</p>
                    <p>Thank you,<br>The Georget Team</p>
                </div>
            `
        };

        console.log(`[DEBUG] Attempting to send verification email to ${email}...`); // ADDED LOG
        let info = await transporter.sendMail(mailOptions);
        console.log(`[DEBUG] Verification email sent to ${email}`); // ADDED LOG
        console.log("[DEBUG] Message ID (from main app):", info.messageId); // ADDED LOG
        res.status(200).json({ message: 'Verification email sent. Check your inbox!' });

    } catch (error) {
        console.error("❌ Error sending password reset email in main app:", error); // Make this more distinct
        if (error.response) {
            console.error("SMTP Response in main app:", error.response);
        }
        if (error.responseCode) {
            console.error("SMTP Response Code in main app:", error.responseCode);
        }
        if (error.code) {
            console.error("Error Code in main app:", error.code);
        }
        res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
    }
});

// POST /api/forgot-password/verify-pin: Verify the PIN
app.post('/api/forgot-password/verify-pin', async (req, res) => {
    const { email, pin } = req.body;
    console.log(`Received request to verify PIN for ${email} with PIN: ${pin}`);

    if (!email || !pin) {
        return res.status(400).json({ message: 'Email and PIN are required.' });
    }

    try {
        const resetToken = await PasswordResetToken.findOne({ email, pin, used: false });

        if (!resetToken) {
            console.log(`PIN verification failed for ${email}: PIN not found or already used.`);
            return res.status(400).json({ message: 'Invalid or expired PIN.' });
        }

        if (resetToken.expiresAt < new Date()) {
            console.log(`PIN verification failed for ${email}: PIN expired.`);
            // Optionally mark as used or delete expired PINs
            await PasswordResetToken.deleteOne({ _id: resetToken._id });
            return res.status(400).json({ message: 'Invalid or expired PIN.' });
        }

        // Mark the PIN as used to prevent reuse
        resetToken.used = true;
        await resetToken.save();
        console.log(`PIN verified successfully for ${email}.`);

        // For the frontend to proceed to the new password step, we might store a temporary flag in session
        // or rely on the frontend's state management after this successful response.
        // For simplicity, we'll just send a success message.
        req.session.resetEmail = email; // Store email in session to use in next step
        res.status(200).json({ message: 'PIN verified successfully!' });

    } catch (error) {
        console.error("Error verifying PIN:", error);
        res.status(500).json({ message: 'Failed to verify PIN. Please try again later.' });
    }
});

// POST /api/forgot-password/resend-pin: Resend a new PIN
app.post('/api/forgot-password/resend-pin', async (req, res) => {
    const { email } = req.body;
    console.log(`Received request to resend PIN for: ${email}`);

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const user = await UserAccount.findOne({ email });
        if (!user) {
            console.log(`Resend PIN attempt for non-existent email: ${email}`);
            return res.status(200).json({ message: 'If an account with that email exists, a new verification PIN has been sent.' });
        }

        // Generate a new 6-digit PIN
        const pin = crypto.randomBytes(3).toString('hex').toUpperCase();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // New PIN valid for 15 minutes

        // Delete any existing unused PINs for this email
        await PasswordResetToken.deleteMany({ email, used: false });

        const newResetToken = new PasswordResetToken({ email, pin, expiresAt });
        await newResetToken.save();
        console.log(`Resent PIN for ${email}: ${pin}`);

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Hanuram Constructions- Password Reset Verification (Resent)',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #007bff;">Password Reset Request (Resent)</h2>
                    <p>Hello,</p>
                    <p>You have requested to resend your password reset PIN for your hanuram constructions account.</p>
                    <p>Your new verification **PIN is: <strong style="font-size: 1.5em; color: #007bff;">${pin}</strong></p>
                    <p>This PIN is valid for 15 minutes. Please enter it on the password reset page to continue.</p>
                    <p>If you did not request a password reset, please ignore this email.</p>
                    <p>Thank you,<br>The Georget Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Resent verification email to ${email}`);
        res.status(200).json({ message: 'New verification PIN sent. Check your inbox!' });

    } catch (error) {
        console.error("Error resending password reset email:", error);
        res.status(500).json({ message: 'Failed to resend verification email. Please try again later.' });
    }
});

// POST /api/forgot-password/set-new-password: Set the new password
app.post('/api/forgot-password/set-new-password', async (req, res) => {
    const { email, newPin } = req.body; // 'newPin' here refers to the new password
    console.log(`Received request to set new password for: ${email}`);

    // Ensure the email was verified in the previous step (e.g., from session)
    // This is a basic check. For stronger security, you'd use a one-time token
    // passed from the verify-pin step to this step.
    if (!req.session.resetEmail || req.session.resetEmail !== email) {
        return res.status(403).json({ message: 'Unauthorized: Please go through the PIN verification process first.' });
    }

    if (!newPin) {
        return res.status(400).json({ message: 'New password is required.' });
    }

    try {
        const user = await UserAccount.findOne({ email });
        if (!user) {
            console.log(`Password reset attempt for non-existent user: ${email}`);
            return res.status(404).json({ message: 'User not found.' });
        }

        // Hash the new password and update the user
        user.password = newPin; // The pre-save hook will hash this
        await user.save();
        console.log(`Password for ${email} has been reset successfully.`);

        // Clean up: Delete all reset tokens for this email after successful password reset
        await PasswordResetToken.deleteMany({ email });
        delete req.session.resetEmail; // Clear the session flag

        res.status(200).json({ message: 'Password updated successfully! You can now log in with your new password.' });

    } catch (error) {
        console.error("Error setting new password:", error);
        res.status(500).json({ message: 'Failed to set new password. Please try again later.' });
    }
});


// --- Server Start and MongoDB Connection ---
console.log("4. Attempting to start server...");
async function startServer() {
    try {
        // Use an environment variable for the MongoDB URI, with a fallback for local development
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrsample_local';

        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connection Established to MongoDB: hrsample"); // This log might need adjustment for the dynamic name

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