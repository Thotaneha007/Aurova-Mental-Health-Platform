const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    mood: {
        type: String,
        default: ''
    },
    tags: {
        type: [String],
        default: []
    },
    isPrivate: {
        type: Boolean,
        default: true
    },
    aiAnalysis: {
        mood: String,
        score: Number,
        summary: String,
        clinicalInsight: String,
        positiveReframing: String,
        suggestions: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Journal', JournalSchema);