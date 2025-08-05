const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

// Define the User schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required."],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required."],
        unique: true,
        trim: true,
        lowercase: true,
        // Basic email format validation
        match: [/.+@.+\..+/, "Please enter a valid email address."]
    },
    password: {
        type: String,
        required: [true, "Password is required."],
        minlength: [6, "Password must be at least 6 characters long."],
        // This makes sure the password is not returned in queries by default
        select: false 
    }
}, {
    timestamps: true
});

// --- CRITICAL FIX: Add a pre-save hook to hash the password ---
UserSchema.pre('save', async function(next) {
    const user = this;

    // Only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    try {
        // Generate a salt and hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    } catch (error) {
        // Pass the error to the next middleware
        next(error);
    }
});

// Create the UserAccount model from the schema
const UserAccount = mongoose.model('UserAccount', UserSchema);
module.exports = UserAccount;