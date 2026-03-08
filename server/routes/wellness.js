const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const WellnessPreference = require('../models/WellnessPreference');
const MoodEntry = require('../models/MoodEntry');
const BreathworkLog = require('../models/BreathworkLog');
const RoutineProgress = require('../models/RoutineProgress');
const SoulFeedSuggestion = require('../models/SoulFeedSuggestion');

// ─────────────────────────────────────────────
// WELLNESS PREFERENCES  /api/wellness/preferences
// ─────────────────────────────────────────────

// GET all preferences for user
router.get('/preferences', auth, async(req, res) => {
    try {
        const items = await WellnessPreference.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ preferences: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create new preference
router.post('/preferences', auth, async(req, res) => {
    try {
        const { goals, preferredActivities, sessionDuration, reminderEnabled, reminderTime, notes } = req.body;
        const item = new WellnessPreference({
            userId: req.user.id,
            goals,
            preferredActivities,
            sessionDuration,
            reminderEnabled,
            reminderTime,
            notes
        });
        await item.save();
        res.status(201).json({ preference: item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update  /api/wellness/preferences/:id
router.put('/preferences/:id', auth, async(req, res) => {
    try {
        const { goals, preferredActivities, sessionDuration, reminderEnabled, reminderTime, notes } = req.body;
        const item = await WellnessPreference.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: { goals, preferredActivities, sessionDuration, reminderEnabled, reminderTime, notes, updatedAt: new Date() } }, { new: true });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ preference: item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE  /api/wellness/preferences/:id
router.delete('/preferences/:id', auth, async(req, res) => {
    try {
        const item = await WellnessPreference.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// MOOD ENTRIES  /api/wellness/mood
// ─────────────────────────────────────────────

router.get('/mood', auth, async(req, res) => {
    try {
        const items = await MoodEntry.find({ userId: req.user.id }).sort({ date: -1 });
        res.json({ entries: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/mood', auth, async(req, res) => {
    try {
        const { date, score, emotions, triggers, note } = req.body;
        const item = new MoodEntry({ userId: req.user.id, date, score, emotions, triggers, note });
        await item.save();
        res.status(201).json({ entry: item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/mood/:id', auth, async(req, res) => {
    try {
        const { date, score, emotions, triggers, note } = req.body;
        const item = await MoodEntry.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: { date, score, emotions, triggers, note, updatedAt: new Date() } }, { new: true });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ entry: item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/mood/:id', auth, async(req, res) => {
    try {
        const item = await MoodEntry.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// BREATHWORK LOGS  /api/wellness/breathwork
// ─────────────────────────────────────────────

router.get('/breathwork', auth, async(req, res) => {
    try {
        const items = await BreathworkLog.find({ userId: req.user.id }).sort({ date: -1 });
        res.json({ logs: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/breathwork', auth, async(req, res) => {
    try {
        const { date, pattern, durationMinutes, rounds, note, feltBefore, feltAfter } = req.body;
        const item = new BreathworkLog({ userId: req.user.id, date, pattern, durationMinutes, rounds, note, feltBefore, feltAfter });
        await item.save();
        res.status(201).json({ log: item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/breathwork/:id', auth, async(req, res) => {
    try {
        const { date, pattern, durationMinutes, rounds, note, feltBefore, feltAfter } = req.body;
        const item = await BreathworkLog.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: { date, pattern, durationMinutes, rounds, note, feltBefore, feltAfter, updatedAt: new Date() } }, { new: true });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ log: item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/breathwork/:id', auth, async(req, res) => {
    try {
        const item = await BreathworkLog.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// ROUTINE PROGRESS  /api/wellness/routine
// ─────────────────────────────────────────────

router.get('/routine', auth, async(req, res) => {
    try {
        const items = await RoutineProgress.find({ userId: req.user.id }).sort({ date: -1 });
        res.json({ entries: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/routine', auth, async(req, res) => {
    try {
        const { date, routineTitle, completedSteps, totalSteps, durationMinutes, note } = req.body;
        const item = new RoutineProgress({ userId: req.user.id, date, routineTitle, completedSteps, totalSteps, durationMinutes, note });
        await item.save();
        res.status(201).json({ entry: item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/routine/:id', auth, async(req, res) => {
    try {
        const { date, routineTitle, completedSteps, totalSteps, durationMinutes, note } = req.body;
        const item = await RoutineProgress.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: { date, routineTitle, completedSteps, totalSteps, durationMinutes, note, updatedAt: new Date() } }, { new: true });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ entry: item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/routine/:id', auth, async(req, res) => {
    try {
        const item = await RoutineProgress.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// SOULFEED SUGGESTIONS  /api/wellness/soulfeed
// ─────────────────────────────────────────────

router.get('/soulfeed', auth, async(req, res) => {
    try {
        const items = await SoulFeedSuggestion.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ suggestions: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/soulfeed', auth, async(req, res) => {
    try {
        const { name, knownFor, struggle, whyInspires } = req.body;
        const item = new SoulFeedSuggestion({ userId: req.user.id, name, knownFor, struggle, whyInspires });
        await item.save();
        res.status(201).json({ suggestion: item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/soulfeed/:id', auth, async(req, res) => {
    try {
        const { name, knownFor, struggle, whyInspires } = req.body;
        const item = await SoulFeedSuggestion.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: { name, knownFor, struggle, whyInspires, updatedAt: new Date() } }, { new: true });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ suggestion: item });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/soulfeed/:id', auth, async(req, res) => {
    try {
        const item = await SoulFeedSuggestion.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;