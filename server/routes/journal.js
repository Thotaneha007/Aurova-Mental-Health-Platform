const express = require('express');
const Journal = require('../models/Journal');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// ── INSERT ─────────────────────────────────────────────────
// @route   POST /api/journal
// @desc    Create a new journal entry
// @access  Private
router.post('/', auth, async(req, res) => {
    try {
        const { content, aiAnalysis, mood, tags, isPrivate } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        let resolvedMood = mood;
        if (!resolvedMood && aiAnalysis && aiAnalysis.mood) {
            resolvedMood = aiAnalysis.mood;
        }
        if (!resolvedMood) resolvedMood = '';

        const newEntry = new Journal({
            userId: req.user.id,
            content,
            mood: resolvedMood,
            tags: tags || [],
            isPrivate: isPrivate !== undefined ? isPrivate : true,
            aiAnalysis
        });

        const entry = await newEntry.save();
        res.json(entry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── DISPLAY (all) ──────────────────────────────────────────
// @route   GET /api/journal
// @desc    Get all journal entries for a user
// @access  Private
router.get('/', auth, async(req, res) => {
    try {
        const entries = await Journal.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── SEARCH ─────────────────────────────────────────────────
// @route   GET /api/journal/ops/search?q=&mood=&from=&to=
// @desc    Search journal entries
// @access  Private
router.get('/ops/search', auth, async(req, res) => {
    try {
        const { q, mood, from, to, tag } = req.query;
        const filter = { userId: req.user.id };

        if (q) {
            filter.content = { $regex: q, $options: 'i' };
        }
        if (mood) {
            filter.$or = [
                { mood: { $regex: mood, $options: 'i' } },
                { 'aiAnalysis.mood': { $regex: mood, $options: 'i' } }
            ];
        }
        if (tag) {
            filter.tags = { $in: [tag] };
        }
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const entries = await Journal.find(filter).sort({ createdAt: -1 });
        res.json(entries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── DISPLAY (single) ──────────────────────────────────────
// @route   GET /api/journal/:id
// @desc    Get a single journal entry by ID
// @access  Private
router.get('/:id', auth, async(req, res) => {
    try {
        const entry = await Journal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        res.json(entry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── UPDATE ─────────────────────────────────────────────────
// @route   PUT /api/journal/:id
// @desc    Update a journal entry
// @access  Private
router.put('/:id', auth, async(req, res) => {
    try {
        const { content, mood, tags, isPrivate, aiAnalysis } = req.body;
        const entry = await Journal.findOne({ _id: req.params.id, userId: req.user.id });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        if (content !== undefined) entry.content = content;
        if (mood !== undefined) entry.mood = mood;
        if (tags !== undefined) entry.tags = tags;
        if (isPrivate !== undefined) entry.isPrivate = isPrivate;
        if (aiAnalysis !== undefined) entry.aiAnalysis = aiAnalysis;

        const updated = await entry.save();
        res.json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── DELETE ──────────────────────────────────────────────────
// @route   DELETE /api/journal/:id
// @desc    Delete a journal entry
// @access  Private
router.delete('/:id', auth, async(req, res) => {
    try {
        const entry = await Journal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        res.json({ message: 'Entry deleted', id: req.params.id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;