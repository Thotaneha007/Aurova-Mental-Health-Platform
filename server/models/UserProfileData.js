const mongoose = require('mongoose');

/**
 * UserProfileData — personal details & consent preferences
 * Master Form (Core User Experience — Shaik Abdus Sattar)
 */
const UserProfileDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    dob: { type: String }, // ISO date string YYYY-MM-DD
    gender: { type: String, default: 'Prefer not to say' },
    pronouns: { type: String, default: 'prefer not to say' },
    phone: { type: String, trim: true },
    emergencyContactName: { type: String, trim: true },
    emergencyContactPhone: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },

    // Consent flags
    consent: {
        dataStorage: { type: Boolean, default: true },
        aiAnalysis: { type: Boolean, default: true },
        communityVisible: { type: Boolean, default: false },
        emailNotifications: { type: Boolean, default: true },
        crisisAlerts: { type: Boolean, default: true },
        dataExport: { type: Boolean, default: true }
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

UserProfileDataSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('UserProfileData', UserProfileDataSchema);