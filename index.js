require('dotenv').config();
const express = require("express");
const path = require("path");
const mongoose = require('mongoose');
const session = require('express-session');
const nodemailer = require('nodemailer');
const NodeCache = require("node-cache");

console.log("1️⃣ Starting server setup...");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
console.log("2️⃣ Setting up middleware...");
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
console.log("✅ Session middleware configured.");

// Static file serving
app.use(express.static(path.join(__dirname, "public")));
app.use('/JAVASCRIPT', express.static(path.join(__dirname, 'JAVASCRIPT')));
app.use('/static', express.static(path.join(__dirname, 'static')));
console.log("✅ Static files served from /public, /JAVASCRIPT, /static");

// --- View-engine setup ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
console.log("✅ EJS view engine configured.");

// --- Mongoose Schemas and Models ---
console.log("3️⃣ Loading Mongoose models...");
const Contactus = require('./models/Contactus');
const UserAccount = require('./models/UserAccounts');
const PasswordResetToken = require('./models/PasswordResetToken');
const EngineerSchema = require('./models/Engineermodels');
console.log("✅ Models loaded.");

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
    // Configure your transporter here
});
console.log("✅ Nodemailer transporter configured.");

// --- Paths ---
const localEngineersDataPath = path.join(__dirname, 'data', 'engineers.json');

// --- Caching Initialization ---
const myCache = new NodeCache({ stdTTL: 600 }); 
console.log("✅ In-memory cache initialized with a 10-minute TTL.");

// Vars for DB connection & model
let engineersDbConnection;
let Engineer; 

// --- Start Server Function ---
console.log("4️⃣ Preparing to connect to databases and start server...");

async function startServer() {
    try {
        console.time('⏳ DB Connection Time');

        // Load environment variables
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrsample_local';
        const MONGO_URI2 = process.env.MONGO_URI2;

        console.log(`ℹ️ MONGODB_URI (Main DB): ${MONGODB_URI}`);
        console.log(`ℹ️ MONGO_URI2 (Engineers DB): ${MONGO_URI2 ? '✅ Provided' : '❌ Missing'}`);

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

        console.timeEnd('⏳ DB Connection Time');
        console.log("✅ Connected to Main MongoDB (Users, Contactus, etc.)");
        console.log("✅ Connected to Engineers MongoDB");

        // Assign engineers DB connection
        engineersDbConnection = engineersDbConnectionInstance;
        Engineer = engineersDbConnection.model('Engineer', EngineerSchema, 'engineers');
        console.log("✅ Engineer model registered in engineers DB.");

        // --- 🔍 Test DB to confirm correct connection ---
        console.log("🔍 Checking if 'santosh_rai_1' exists in Engineers DB...");
        const testEngineer = await Engineer.findOne({ engineerId: "santosh_rai_1" }).lean();
        if (testEngineer) {
            console.log("✅ FOUND engineer in Engineers DB:", testEngineer.name);
            console.log("📌 Source DB:", engineersDbConnection.name);
        } else {
            console.warn("⚠️ Engineer 'santosh_rai_1' NOT found in Engineers DB!");
            console.warn("📌 Check if your MONGO_URI2 points to the correct database.");
        }

        // --- Load Routes ---
        console.log("5️⃣ Loading routes...");
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
        console.log("✅ Routes mounted successfully.");

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
