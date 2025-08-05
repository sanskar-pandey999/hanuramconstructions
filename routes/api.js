const express = require('express');
const router = express.Router();

// This module exports a function that returns the router.
// Since these routes don't require any Mongoose models or other dependencies,
// the function doesn't take any arguments.

module.exports = function() {

    // API endpoint to check current user session status (for client-side UI updates)
    // The path is now '/user-status' because the main server.js file uses app.use('/api', apiRoutes),
    // which automatically prefixes this route with '/api'.
    router.get('/user-status', (req, res) => {
        if (req.session.user) {
            console.log(`User session active: ${req.session.user.email}`);
            res.json({ loggedIn: true, name: req.session.user.name });
        } else {
            console.log("No user session found.");
            res.json({ loggedIn: false });
        }
    });

    // API endpoint for user logout
    // The path is now '/logout' for the same reason as above.
    router.post('/logout', (req, res) => {
        if (req.session.user) {
            console.log(`Attempting to log out user: ${req.session.user.email}`);
        } else {
            console.log("Logout request received, but no active session.");
        }

        req.session.destroy(err => { // Destroys the session
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).json({ message: "Failed to log out due to server error." });
            }
            // Clears the session cookie from the browser
            // 'connect.sid' is the default name for the session cookie
            res.clearCookie('connect.sid'); 
            res.json({ message: "Logged out successfully!" });
        });
    });

    return router;
};
