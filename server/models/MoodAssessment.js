const mongoose = require('mongoose');

const moodAssessmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  overallMood: { type: String, enum: ['very_low', 'low', 'neutral', 'good', 'great'], required: true },
  moodScore: { type: Number, min: 1, max: 10, required: true },
  sleepQuality: { type: Number, min: 1, max: 5, default: 3 },
  sleepHours: { type: Number, min: 0, max: 24, default: 7 },
  appetiteChange: { type: String, enum: ['decreased', 'normal', 'increased'], default: 'normal' },
  stressLevel: { type: Number, min: 1, max: 10, default: 5 },
  anxietyLevel: { type: Number, min: 1, max: 10, default: 5 },
  symptoms: [{ type: String }],
  copingStrategies: [{ type: String }],
  socialInteraction: { type: String, enum: ['isolated', 'minimal', 'moderate', 'active'], default: 'moderate' },
  selfHarmThoughts: { type: Boolean, default: false },
  medicationAdherence: { type: String, enum: ['not_applicable', 'consistent', 'missed_some', 'stopped'], default: 'not_applicable' },
  additionalNotes: { type: String, default: '' },
  periodStart: { type: Date },
  periodEnd: { type: Date },
  reviewed: { type: Boolean, default: false },
  doctorNotes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('MoodAssessment', moodAssessmentSchema);
