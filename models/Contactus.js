const mongoose = require('mongoose');




// Schema for Contact Us form submissions
const ContactusSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true 
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

module.exports=Contactus