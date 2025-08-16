require('dotenv').config();
const express = require("express");
const path = require("path");
const mongoose = require('mongoose');
const session = require('express-session');
const nodemailer = require('nodemailer');
const NodeCache = require("node-cache");

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
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Static file serving
app.use(express.static(path.join(__dirname, "public")));
app.use('/JAVASCRIPT', express.static(path.join(__dirname, 'JAVASCRIPT')));
app.use('/static', express.static(path.join(__dirname, 'static')));

// --- View-engine setup ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Mongoose Schemas and Models ---
const Contactus = require('./models/Contactus');
const UserAccount = require('./models/UserAccounts');
const PasswordResetToken = require('./models/PasswordResetToken');
const EngineerSchema = require('./models/Engineermodels');

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
    // Configure your transporter here
});

// --- Paths ---
const localEngineersDataPath = path.join(__dirname, 'data', 'engineers.json');

// --- Caching Initialization ---
const myCache = new NodeCache({ stdTTL: 600 }); 

// Vars for DB connection & model
let engineersDbConnection;
let Engineer; 

// --- Start Server Function ---
async function startServer() {
    try {
        // Load environment variables
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrsample_local';
        const MONGO_URI2 = process.env.MONGO_URI2;

        if (!MONGO_URI2) {
            throw new Error("MONGO_URI2 environment variable is required for the engineers database.");
        }

        // Connect to both databases
        const mainDbPromise = mongoose.connect(MONGODB_URI);
        const engineersDbPromise = mongoose.createConnection(MONGO_URI2).asPromise();

        const [mainDbConnection, engineersDbConnectionInstance] = await Promise.all([
            mainDbPromise,
            engineersDbPromise
        ]);

        // Assign engineers DB connection
        engineersDbConnection = engineersDbConnectionInstance;
        Engineer = engineersDbConnection.model('Engineer', EngineerSchema, 'engineers');

        // --- Load Routes ---
        const mainRoutes = require('./routes/main')(Contactus);
        const authRoutes = require('./routes/auth')(UserAccount, Contactus);
        const apiRoutes = require('./routes/api')();
        const forgotPasswordRoutes = require('./routes/forgotpassword')(UserAccount, PasswordResetToken, transporter);
        const engineersRouter = require('./routes/engineersroutes')(localEngineersDataPath, Engineer, myCache);

        // --- Mount Routes ---
        app.use('/', mainRoutes);
        app.use('/auth', authRoutes);
        app.use('/api', apiRoutes);
        app.use('/api/forgot-password', forgotPasswordRoutes);
        app.use('/engineers', engineersRouter);

        // --- Start Express Server ---
        app.listen(PORT, () => {
            console.log(`🚀 Server running at: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("❌ Critical error: Could not connect to DB or start server!");
        console.error("Error:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the start function
startServer();