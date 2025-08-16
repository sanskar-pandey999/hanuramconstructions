// models/Engineer.js
const mongoose = require('mongoose');

// Schema for Engineer data
const EngineerSchema = new mongoose.Schema({
    engineerId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    profilePictureUrl: String,
    specialization: {
        type: String,
        required: true
    },
    experience: {
        type: Number
    },
    location: String,
    contact: {
        phone: String,
        email: String
    },
    bio: String,
    description: String,
    qualifications: [{
        degree: String,
        university: String
    }],
    projectHighlights: [String],
    videos: [String],
    servicesOffered: [{
        service: String,
        price: Number,
        timeRequired: String
    }]
});

// We're not creating the model here, we are just exporting the schema.
// This allows you to define the model in your main file with the specific database connection.
module.exports = EngineerSchema;