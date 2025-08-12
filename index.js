require('dotenv').config();
const express = require("express");
const path = require("path");
const mongoose = require('mongoose');
const session = require('express-session');
const nodemailer = require('nodemailer');
const NodeCache = require("node-cache"); // Import the caching library

console.log("1. Starting server setup...");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_super_secret_key_very_long_and_random',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));
app.use(express.static(path.join(__dirname, "public")));
app.use('/JAVASCRIPT', express.static(path.join(__dirname, 'JAVASCRIPT')));
app.use('/static', express.static(path.join(__dirname, 'static')));

console.log(`Static files served.`);

// --- View-engine setup ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
console.log(`EJS view engine configured.`);

// --- Mongoose Schemas and Models ---
const Contactus = require('./models/Contactus');
const UserAccount = require('./models/UserAccounts');
const PasswordResetToken = require('./models/PasswordResetToken');
const EngineerSchema = require('./models/Engineermodels');

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
    // ... (your nodemailer config here) ...
});

console.log("Nodemailer transporter configured.");

// --- Paths ---
const localEngineersDataPath = path.join(__dirname, 'data', 'engineers.json');

// --- Caching Initialization ---
const myCache = new NodeCache({ stdTTL: 600 }); // Initialize cache with a 10-minute expiration
console.log("✅ In-memory cache initialized with a 10-minute TTL.");

let engineersDbConnection;
let Engineer; 

console.log("4. Attempting to start server...");

async function startServer() {
    try {
        console.time('query');
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrsample_local';
        const MONGO_URI2 = process.env.MONGO_URI2;
        if (!MONGO_URI2) {
            throw new Error("MONGO_URI2 environment variable is not defined for engineers database.");
        }

        const [
            mainDbConnection,
            engineersDbConnectionInstance
        ] = await Promise.all([
            mongoose.connect(MONGODB_URI),
            mongoose.createConnection(MONGO_URI2).asPromise()
        ]);
        console.timeEnd('query');
        console.log("✅ Connected to Main MongoDB (User, Contact, etc.)");
        console.log("✅ Connected to Engineers Detailed DB: hanuramdb");

        engineersDbConnection = engineersDbConnectionInstance;
        Engineer = engineersDbConnection.model('Engineer', EngineerSchema, 'engineers');

        // Load and Use Routes
        const mainRoutes = require('./routes/main')(Contactus);
        const authRoutes = require('./routes/auth')(UserAccount, Contactus);
        const apiRoutes = require('./routes/api')();
        const forgotPasswordRoutes = require('./routes/forgotpassword')(UserAccount, PasswordResetToken, transporter);
        
        // Pass the cache instance to your routes that need it
        const engineersRouter = require('./routes/engineersroutes')(localEngineersDataPath, Engineer, myCache);

        app.use('/', mainRoutes);
        app.use('/auth', authRoutes);
        app.use('/api', apiRoutes);
        app.use('/api/forgot-password', forgotPasswordRoutes);
        app.use('/engineers', engineersRouter);

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("❌ Critical error: Server failed to start or connect to DB!", error.message);
        process.exit(1);
    }
}

startServer();