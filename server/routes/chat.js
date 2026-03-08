const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const Memory = require('../models/Memory');
const SafetyEvent = require('../models/SafetyEvent');
const auth = require('../middleware/authMiddleware');
const aiService = require('../services/aiService');
const Journal = require('../models/Journal');
const mongoose = require('mongoose');

const router = express.Router();

router.post('/', auth, async(req, res) => {
    try {
        const { text, sessionId, frontendContext, language } = req.body;
        const userId = req.user.id;
        if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required' });
        const riskLevel = await aiService.classifyRisk(text);
        const userMsg = new ChatMessage({ userId, role: 'user', content: text, sessionId, riskLevel });
        await userMsg.save();
        if (riskLevel === 'self_harm_risk' || riskLevel === 'suicide_risk') {
            await new SafetyEvent({ userId, messageId: userMsg._id, riskLevel }).save();
            const safetyResponse = 'I hear you, and I want you to know that you are not alone. Please reach out to iCALL at +91-9152987821 or KIRAN at 1800-599-0019. You matter deeply, and help is available.';
            await new ChatMessage({ userId, role: 'model', content: safetyResponse, sessionId, riskLevel: 'safe' }).save();
            return res.json({ response: safetyResponse, riskLevel, isCrisis: true, retrievedCount: 0, memoriesStored: 0, provider: 'safety' });
        }
        (async() => {
            try {
                const dec = await aiService.shouldExtractMemory(text);
                if (dec.shouldRemember) {
                    const emb = await aiService.generateEmbedding(text);
                    // Store in MongoDB (persists embeddings across Python service restarts)
                    if (emb) await new Memory({ userId, embedding: emb, sourceText: text, memoryType: dec.memoryType }).save();
                    // Also store in Python vector service (fast in-memory retrieval)
                    await aiService.storeInVectorService(userId.toString(), dec.summary || text, 'user', 'chat');
                }
            } catch (e) { console.error('Memory err:', e.message); }
        })();
        const rawHistory = await ChatMessage.find({ userId, sessionId }).sort({ createdAt: -1 }).limit(14);
        const history = rawHistory.reverse().map(m => ({ role: m.role, text: m.content }));
        let memoryContext = '',
            retrievedCount = 0;

        // Strategy 1: Python vector service (fast in-memory cosine search)
        const pyResults = await aiService.retrieveFromVectorService(userId.toString(), text, 4, 0.5);
        if (pyResults.length) {
            retrievedCount = pyResults.length;
            memoryContext = 'Remembered Context:\n' + pyResults.map(r => '- ' + (r.text || r)).join('\n');
        }

        // Strategy 2: MongoDB cosine similarity (uses stored embeddings)
        if (!memoryContext) {
            const emb = await aiService.generateEmbedding(text);
            if (emb) {
                const all = await Memory.find({ userId });
                const rel = all
                    .filter(m => m.embedding && m.embedding.length)
                    .map(m => ({ text: m.sourceText, sim: aiService.cosineSimilarity(emb, m.embedding) }))
                    .filter(m => m.sim > 0.60)
                    .sort((a, b) => b.sim - a.sim)
                    .slice(0, 4);
                if (rel.length) {
                    retrievedCount = rel.length;
                    memoryContext = 'Remembered Context:\n' + rel.map(m => '- ' + m.text).join('\n');
                }
            }
        }

        // Strategy 3: MongoDB keyword fallback (no embeddings needed)
        if (!memoryContext) {
            const keywords = text.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4);
            if (keywords.length) {
                const regex = new RegExp(keywords.slice(0, 5).join('|'), 'i');
                const keywordMems = await Memory.find({ userId, sourceText: { $regex: regex } }).limit(3);
                if (keywordMems.length) {
                    retrievedCount = keywordMems.length;
                    memoryContext = 'Remembered Context:\n' + keywordMems.map(m => '- ' + m.sourceText).join('\n');
                }
            }
        }
        let journalContext = '';
        const journals = await Journal.find({ userId }).sort({ createdAt: -1 }).limit(3);
        if (journals.length) {
            journalContext = 'Recent Journals:\n' + journals.map(j => {
                const mood = (j.aiAnalysis && j.aiAnalysis.mood) ? j.aiAnalysis.mood : 'Reflection';
                return '- [' + mood + '] ' + j.content.substring(0, 150) + '...';
            }).join('\n');
        }
        const { text: botText, provider } = await aiService.generateChatReply({ userText: text, history, memoryContext, journalContext, frontendContext, riskLevel, language });
        await new ChatMessage({ userId, role: 'model', content: botText, sessionId, riskLevel: 'safe' }).save();
        return res.json({ response: botText, riskLevel, isCrisis: false, retrievedCount, memoriesStored: 0, provider });
    } catch (err) {
        console.error('Chat Error:', err.message);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

router.get('/history/:sessionId', auth, async(req, res) => {
    try {
        const messages = await ChatMessage.find({ userId: req.user.id, sessionId: req.params.sessionId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.get('/sessions', auth, async(req, res) => {
    try {
        const uid = new mongoose.Types.ObjectId(req.user.id);
        const sessions = await ChatMessage.aggregate([
            { $match: { userId: uid, role: 'user' } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$sessionId', lastMessage: { $first: '$content' }, lastAt: { $first: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { lastAt: -1 } },
            { $limit: 20 }
        ]);
        res.json(sessions);
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;