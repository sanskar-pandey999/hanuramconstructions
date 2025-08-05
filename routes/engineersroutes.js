// routes/engineersroutes.js
const express = require("express");
const path = require('path');
const fs = require('fs');

module.exports = function (localEngineersDataPath, Engineer) {
    const router = express.Router();
    let engineersData = [];

    // Load the static JSON data once when the server starts
    try {
        const data = fs.readFileSync(localEngineersDataPath, 'utf8');
        engineersData = JSON.parse(data);
        console.log("✅ Engineers card data loaded from local JSON file.");
    } catch (err) {
        console.error("❌ Error loading engineers.json:", err);
    }

    // API: Get all engineers (for card list fetch)
    // This route now serves the static data from the local JSON file.
    router.get('/api/main', (req, res) => {
        try {
            res.json(engineersData);
        } catch (err) {
            console.error("Failed to serve main engineers data from JSON:", err);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });

    // View: Render engineer detail page using engineerId
    // This route still fetches the detailed profile from the MongoDB database.
    router.get('/:id', async (req, res) => {
        try {
            const engineerId = req.params.id;
            const engineer = await Engineer.findOne({ engineerId: engineerId });

            if (!engineer) {
                return res.status(404).render('404', { message: `Engineer with ID ${engineerId} not found.` });
            }

            res.render('engineer', { engineer });
        } catch (err) {
            console.error("Error rendering engineer profile:", err);
            res.status(500).render('error', { message: "Something went wrong." });
        }
    });

    return router;
};