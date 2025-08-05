// models/PasswordResetToken.js
const mongoose = require('mongoose');

// Schema for Password Reset Tokens
const PasswordResetTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    pin: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index
    },
    used: {
        type: Boolean,
        default: false
    }
});

// Creates the 'passwordresettokens' collection and exports the model
const PasswordResetToken = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
module.exports = PasswordResetToken;