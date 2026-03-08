const mongoose = require('mongoose');

/**
 * SoulFeedSuggestion — community submission of inspirational figures
 * Transaction Form (Wellness — T Neha)
 */
const SoulFeedSuggestionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: { type: String, required: true, trim: true },
    knownFor: { type: String, required: true, trim: true },
    struggle: { type: String, required: true, maxlength: 500 },
    whyInspires: { type: String, required: true, maxlength: 500 },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

SoulFeedSuggestionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('SoulFeedSuggestion', SoulFeedSuggestionSchema);