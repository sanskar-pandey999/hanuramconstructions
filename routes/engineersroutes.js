const express = require("express");
const path = require('path');
const fs = require('fs');
const NodeCache = require("node-cache");

module.exports = function (localEngineersDataPath, Engineer) {
    const router = express.Router();
    const myCache = new NodeCache({ stdTTL: 600 });
    let engineersData = [];

    // Load static JSON data once
    try {
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
            const engineerId = req.params.id;
            const cacheKey = `engineer-detail-${engineerId}`;
            let engineer = myCache.get(cacheKey);

            if (!engineer) {
                // Fetch from DB if not in cache
                const mongooseDoc = await Engineer.findOne({ engineerId: engineerId });

                if (!mongooseDoc) {
                    return res.status(404).render('404', { message: `Engineer with ID ${engineerId} not found.` });
                }
                
                // Convert the Mongoose document to a plain object before caching
                engineer = mongooseDoc.toObject();
                myCache.set(cacheKey, engineer);
            }
            
            res.render('engineer', { engineer });
        } catch (err) {
            console.error("Error rendering engineer profile:", err);
            res.status(500).render('error', { message: "Something went wrong." });
        }
    });

    return router;
};
