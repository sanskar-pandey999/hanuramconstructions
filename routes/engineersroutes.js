// C:\Users\sansk\OneDrive\Desktop\HRSAMPLE\JS\routes\engineersroutes.js

const express = require('express');
const router = express.Router();
const NodeCache = require("node-cache"); // Make sure NodeCache is required here as well

// IMPORTANT: Assuming you are using Mongoose.
// You MUST have your Engineer Mongoose Model defined and imported here.
// const Engineer = require('../models/Engineer'); // <-- REMOVED THIS LINE! It's passed as EngineerModel instead.

module.exports = function (localEngineersDataPath, EngineerModel) { // EngineerModel is passed as an argument
    const router = express.Router();
    const myCache = new NodeCache({ stdTTL: 600 });
    let engineersData = [];

    // Load static JSON data once
    try {
        const fs = require('fs'); // fs needs to be required if not already global
        const data = fs.readFileSync(localEngineersDataPath, 'utf8');
        engineersData = JSON.parse(data);
    } catch (err) {
        console.error("❌ Error loading engineers.json:", err);
    }

    // API: Get all engineers (for card list fetch)
    router.get('/api/main', (req, res) => {
        try {
            res.json(engineersData);
        } catch (err) {
            console.error("Failed to serve main engineers data from JSON:", err);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    // View: Render engineer detail page using engineerId
    router.get('/:id', async (req, res) => {
        try {
            const engineerId = req.params.id; // This captures the ID from the URL
            const cacheKey = `engineer-detail-${engineerId}`;
            let engineer = myCache.get(cacheKey);

            if (!engineer) {
                // Fetch from DB if not in cache
                // Use the passed EngineerModel here
                const mongooseDoc = await EngineerModel.findOne({ engineerId: engineerId });

                if (!mongooseDoc) {
                    // If engineer is NOT found, render your dedicated 404 page,
                    // NOT the engineer.ejs page without the 'engineer' object.
                    console.log(`❌ Engineer with ID ${engineerId} not found in DB. Rendering 404 page.`);
                    // return res.status(404).render('404', { message: `Engineer with ID "${engineerId}" not found.` });
                    return res.status(404).send(`Engineer with ID ${engineerId} not found.`);

                }

                // Convert the Mongoose document to a plain object before caching
                engineer = mongooseDoc.toObject();
                myCache.set(cacheKey, engineer);
            }
            
            // If engineer data is found (either from cache or DB), render the engineer.ejs
            console.log(`✅ Engineer data found for ID: ${engineerId}. Rendering engineer page.`);
            res.render('engineer', {engineer});

        } catch (err) {
            console.error(`🚨 Error rendering engineer profile for ID ${req.params.id}:`, err);
            res.status(500).render('error', { message: "Something went wrong.", error: err.message }); // Pass error.message for more info
        }
    });

    return router;
};
