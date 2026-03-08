const mongoose = require('mongoose');

/**
 * WellnessPreference — wellness goals, activities & reminder settings
 * Master Form (Wellness — T Neha)
 */
const WellnessPreferenceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    goals: { type: [String], default: [] },
    preferredActivities: { type: [String], default: [] },
    sessionDuration: {
        type: String,
        enum: ['5min', '10min', '20min', '30min+'],
        default: '10min'
    },
    reminderEnabled: { type: Boolean, default: false },
    reminderTime: { type: String, default: '08:00' },
    notes: { type: String, maxlength: 1000 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

WellnessPreferenceSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('WellnessPreference', WellnessPreferenceSchema);