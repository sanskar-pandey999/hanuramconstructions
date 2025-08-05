const express = require('express');
const router = express.Router();
const crypto = require('crypto');



// This module now exports a function that returns the router.
// It receives its dependencies (Mongoose models and the Nodemailer transporter)
// as arguments from the main server.js file.
module.exports = function(UserAccount, PasswordResetToken, transporter) {

    // POST /send-email: Send verification email with PIN
    // The path is now '/send-email', as the main server will handle the '/api/forgot-password' prefix.
    router.post('/send-email', async (req, res) => {
        const { email } = req.body;
        console.log(`[DEBUG] Received request to send reset email for: ${email}`);

        if (!email) {
            console.log("[DEBUG] Email not provided in request body.");
            return res.status(400).json({ message: 'Email is required.' });
        }

        try {
            const user = await UserAccount.findOne({ email });
            if (!user) {
                // For security, always respond with a generic message even if email not found
                console.log(`[DEBUG] Forgot password attempt for non-existent email: ${email}. Sending generic success.`);
                return res.status(200).json({ message: 'If an account with that email exists, a verification PIN has been sent.' });
            }

            console.log(`[DEBUG] Found user: ${user.email}. Generating PIN...`);
            // Generate a 6-digit alphanumeric PIN (using hex for now, as per your code)
            const pin = crypto.randomBytes(3).toString('hex').toUpperCase(); // Generates 6 hex characters (3 bytes)
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // PIN valid for 15 minutes

            // Delete any existing unused PINs for this email
            await PasswordResetToken.deleteMany({ email, used: false });
            console.log(`[DEBUG] Existing unused PINs for ${email} cleared.`);

            const newResetToken = new PasswordResetToken({ email, pin, expiresAt });
            await newResetToken.save();
            console.log(`[DEBUG] Generated PIN for ${email}: ${pin}. Saved to DB.`);

            // Send email
            const mailOptions = {
                from: process.env.EMAIL_USER, // Sender address
                to: email, // List of recipients
                subject: 'Georget - Password Reset Verification', // Subject line
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #007bff;">Password Reset Request</h2>
                        <p>Hello,</p>
                        <p>You have requested to reset your password for your Georget account.</p>
                        <p>Your verification **PIN is: <strong style="font-size: 1.5em; color: #007bff;">${pin}</strong></p>
                        <p>This PIN is valid for 15 minutes. Please enter it on the password reset page to continue.</p>
                        <p>If you did not request a password reset, please ignore this email.</p>
                        <p>Thank you,<br>The Georget Team</p>
                    </div>
                `
            };

            console.log(`[DEBUG] Attempting to send verification email to ${email}...`);
            let info = await transporter.sendMail(mailOptions);
            console.log(`[DEBUG] Verification email sent to ${email}`);
            console.log("[DEBUG] Message ID (from main app):", info.messageId);
            res.status(200).json({ message: 'Verification email sent. Check your inbox!' });

        } catch (error) {
            console.error("❌ Error sending password reset email in main app:", error);
            if (error.response) {
                console.error("SMTP Response in main app:", error.response);
            }
            if (error.responseCode) {
                console.error("SMTP Response Code in main app:", error.responseCode);
            }
            if (error.code) {
                console.error("Error Code in main app:", error.code);
            }
            res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
        }
    });

    // POST /verify-pin: Verify the PIN
    router.post('/verify-pin', async (req, res) => {
        const { email, pin } = req.body;
        console.log(`Received request to verify PIN for ${email} with PIN: ${pin}`);

        if (!email || !pin) {
            return res.status(400).json({ message: 'Email and PIN are required.' });
        }

        try {
            const resetToken = await PasswordResetToken.findOne({ email, pin, used: false });

            if (!resetToken) {
                console.log(`PIN verification failed for ${email}: PIN not found or already used.`);
                return res.status(400).json({ message: 'Invalid or expired PIN.' });
            }

            if (resetToken.expiresAt < new Date()) {
                console.log(`PIN verification failed for ${email}: PIN expired.`);
                // Optionally mark as used or delete expired PINs
                await PasswordResetToken.deleteOne({ _id: resetToken._id });
                return res.status(400).json({ message: 'Invalid or expired PIN.' });
            }

            // Mark the PIN as used to prevent reuse
            resetToken.used = true;
            await resetToken.save();
            console.log(`PIN verified successfully for ${email}.`);

            // Store email in session to use in next step for password reset
            req.session.resetEmail = email;
            res.status(200).json({ message: 'PIN verified successfully!' });

        } catch (error) {
            console.error("Error verifying PIN:", error);
            res.status(500).json({ message: 'Failed to verify PIN. Please try again later.' });
        }
    });

    // POST /resend-pin: Resend a new PIN
    router.post('/resend-pin', async (req, res) => {
        const { email } = req.body;
        console.log(`Received request to resend PIN for: ${email}`);

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        try {
            const user = await UserAccount.findOne({ email });
            if (!user) {
                console.log(`Resend PIN attempt for non-existent email: ${email}`);
                return res.status(200).json({ message: 'If an account with that email exists, a new verification PIN has been sent.' });
            }

            // Generate a new 6-digit alphanumeric PIN
            const pin = crypto.randomBytes(3).toString('hex').toUpperCase();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // New PIN valid for 15 minutes

            // Delete any existing unused PINs for this email
            await PasswordResetToken.deleteMany({ email, used: false });

            const newResetToken = new PasswordResetToken({ email, pin, expiresAt });
            await newResetToken.save();
            console.log(`Resent PIN for ${email}: ${pin}`);

            // Send email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Hanuram Constructions - Password Reset Verification (Resent)',
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #007bff;">Password Reset Request (Resent)</h2>
                        <p>Hello,</p>
                        <p>You have requested to resend your password reset PIN for your hanuram constructions account.</p>
                        <p>Your new verification **PIN is: <strong style="font-size: 1.5em; color: #007bff;">${pin}</strong></p>
                        <p>This PIN is valid for 15 minutes. Please enter it on the password reset page to continue.</p>
                        <p>If you did not request a password reset, please ignore this email.</p>
                        <p>Thank you,<br>The Georget Team</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Resent verification email to ${email}`);
            res.status(200).json({ message: 'New verification PIN sent. Check your inbox!' });

        } catch (error) {
            console.error("Error resending password reset email:", error);
            res.status(500).json({ message: 'Failed to resend verification email. Please try again later.' });
        }
    });

    // POST /set-new-password: Set the new password
    router.post('/set-new-password', async (req, res) => {
        const { email, newPassword } = req.body;
        console.log(`Received request to set new password for: ${email}`);

        // Ensure the email was verified in the previous step (e.g., from session)
        if (!req.session.resetEmail || req.session.resetEmail !== email) {
            return res.status(403).json({ message: 'Unauthorized: Please go through the PIN verification process first.' });
        }

        if (!newPassword) {
            return res.status(400).json({ message: 'New password is required.' });
        }

        try {
            const user = await UserAccount.findOne({ email });
            if (!user) {
                console.log(`Password reset attempt for non-existent user: ${email}`);
                return res.status(404).json({ message: 'User not found.' });
            }

            // Hash the new password and update the user
            user.password = newPassword;
            await user.save();
            console.log(`Password for ${email} has been reset successfully.`);

            // Clean up: Delete all reset tokens for this email after successful password reset
            await PasswordResetToken.deleteMany({ email });
            delete req.session.resetEmail; // Clear the session flag

            res.status(200).json({ message: 'Password updated successfully! You can now log in with your new password.' });

        } catch (error) {
            console.error("Error setting new password:", error);
            res.status(500).json({ message: 'Failed to set new password. Please try again later.' });
        }
    });

    return router;
};
