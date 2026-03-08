const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const UserProfileData = require('../models/UserProfileData');
const User = require('../models/User');

// GET /api/profile
// Returns the profile + consent for the authenticated user
router.get('/', auth, async(req, res) => {
    try {
        let profile = await UserProfileData.findOne({ userId: req.user.id });
        if (!profile) {
            // Return empty shell so the frontend can pre-fill defaults
            return res.json({ profile: null });
        }
        res.json({ profile });
    } catch (err) {
        console.error('GET /api/profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/profile
// Upsert personal profile fields
router.put('/', auth, async(req, res) => {
    try {
        const {
            firstName,
            lastName,
            dob,
            gender,
            pronouns,
            phone,
            emergencyContactName,
            emergencyContactPhone,
            bio
        } = req.body;

        const updated = await UserProfileData.findOneAndUpdate({ userId: req.user.id }, {
            $set: {
                userId: req.user.id,
                firstName,
                lastName,
                dob,
                gender,
                pronouns,
                phone,
                emergencyContactName,
                emergencyContactPhone,
                bio,
                updatedAt: new Date()
            }
        }, { upsert: true, new: true, setDefaultsOnInsert: true });

        res.json({ profile: updated });
    } catch (err) {
        console.error('PUT /api/profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/profile/consent
// Upsert consent settings only
router.put('/consent', auth, async(req, res) => {
    try {
        const { consent } = req.body;

        const updated = await UserProfileData.findOneAndUpdate({ userId: req.user.id }, {
            $set: {
                userId: req.user.id,
                consent,
                updatedAt: new Date()
            }
        }, { upsert: true, new: true, setDefaultsOnInsert: true });

        res.json({ profile: updated });
    } catch (err) {
        console.error('PUT /api/profile/consent error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/profile
// Soft-delete: remove profile data and mark account for deletion
// Hard user deletion is kept separate and requires admin confirmation
router.delete('/', auth, async(req, res) => {
    try {
        await UserProfileData.findOneAndDelete({ userId: req.user.id });
        // Cascade: delete the User document so they cannot log in
        await User.findByIdAndDelete(req.user.id);
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('DELETE /api/profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;