const mongoose = require('mongoose');

/**
 * MoodEntry — daily mood check-in log
 * Transaction Form (Wellness — T Neha)
 */
const MoodEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    score: { type: Number, min: 1, max: 10, required: true },
    emotions: { type: [String], default: [] },
    triggers: { type: [String], default: [] },
    note: { type: String, maxlength: 1000 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

MoodEntrySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('MoodEntry', MoodEntrySchema);