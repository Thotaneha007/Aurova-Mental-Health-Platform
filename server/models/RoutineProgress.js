const mongoose = require('mongoose');

/**
 * RoutineProgress — wellness routine completion tracker
 * Transaction Form (Wellness — T Neha)
 */
const RoutineProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    routineTitle: { type: String, required: true },
    completedSteps: { type: Number, min: 0, required: true },
    totalSteps: { type: Number, min: 1, required: true },
    durationMinutes: { type: Number, min: 1, required: true },
    note: { type: String, maxlength: 1000 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

RoutineProgressSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('RoutineProgress', RoutineProgressSchema);