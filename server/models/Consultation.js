const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Reference to doctor profile for quick access
    doctorProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DoctorProfile'
    },
    scheduledTime: { type: Date, required: true },
    duration: { type: Number, default: 30 },
    sessionType: {
        type: String,
        enum: ['Video', 'Voice', 'Chat'],
        default: 'Video'
    },
    status: {
        type: String,
        enum: ['upcoming', 'in-session', 'completed', 'cancelled', 'no-show'],
        default: 'upcoming'
    },
    // Clinical form filled by patient
    clinicalFormData: {
        formId: mongoose.Schema.Types.ObjectId,
        title: String,
        status: {
            type: String,
            enum: ['pending', 'submitted', 'not-required'],
            default: 'not-required'
        },
        basicInfo: mongoose.Schema.Types.Mixed,
        fieldsSnapshot: [mongoose.Schema.Types.Mixed],
        responses: mongoose.Schema.Types.Mixed,
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        submittedAt: Date,
        filledAt: Date
    },
    // Doctor's notes after consultation
    notes: { type: String, default: '' },
    // Session link for video/audio calls
    meetingLink: { type: String },
    // Rating and feedback
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

consultationSchema.pre('save', async function() {
    this.updatedAt = new Date();
});

// Index for efficient querying
consultationSchema.index({ doctorId: 1, scheduledTime: -1 });
consultationSchema.index({ patientId: 1, scheduledTime: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);