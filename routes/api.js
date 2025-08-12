const express = require('express');
const router = express.Router(); // This is the corrected line

module.exports = function() {

    router.get('/user-status', (req, res) => {
        if (req.session.user) {
            console.log(`User session active: ${req.session.user.email}`);
            res.json({ loggedIn: true, name: req.session.user.name });
        } else {
            console.log("No user session found.");
            res.json({ loggedIn: false });
        }
    });

    router.post('/logout', (req, res) => {
        if (req.session.user) {
            console.log(`Attempting to log out user: ${req.session.user.email}`);
        } else {
            console.log("Logout request received, but no active session.");
        }

        req.session.destroy(err => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).json({ message: "Failed to log out due to server error." });
            }
            res.clearCookie('connect.sid');
            res.json({ message: "Logged out successfully!" });
        });
    });

    return router;
};
