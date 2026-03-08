const mongoose = require('mongoose');

/**
 * BreathworkLog — breathwork session tracker
 * Transaction Form (Wellness — T Neha)
 */
const BreathworkLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    pattern: { type: String, required: true },
    durationMinutes: { type: Number, min: 1, required: true },
    rounds: { type: Number, min: 1, required: true },
    note: { type: String, maxlength: 1000 },
    feltBefore: { type: Number, min: 1, max: 10, default: 5 },
    feltAfter: { type: Number, min: 1, max: 10, default: 5 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

BreathworkLogSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('BreathworkLog', BreathworkLogSchema);