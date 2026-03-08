/**
 * aiService.js — Groq-only AI service with local embedding support
 * ─────────────────────────────────────────────────────────────────
 * • All AI (chat, risk, memory extraction) → Groq (llama-3.3-70b-versatile)
 * • Embeddings → Python sentence-transformer service (all-MiniLM-L6-v2, local, free)
 *   └─ If Python service is down → MongoDB cosine-similarity fallback still finds
 *      previously stored embeddings; no embeddings = skips memory retrieval silently.
 */

const Groq = require("groq-sdk");
const axios = require("axios");

// ── Groq client ──────────────────────────────────────────────────────────────
let groqClient;

function initGroq() {
    if (!groqClient && process.env.GROQ_API_KEY) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}

// ── Shared Groq completion helper ────────────────────────────────────────────
async function groqComplete(messages, { max_tokens = 256, temperature = 0.3, json = false } = {}) {
    const client = initGroq();
    if (!client) throw new Error('Groq not initialised — missing GROQ_API_KEY');
    const opts = {
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        max_tokens,
        temperature,
    };
    if (json) opts.response_format = { type: 'json_object' };
    const res = await client.chat.completions.create(opts);
    return (res.choices[0].message.content || '').trim();
}

// backwards-compat no-op
function init() {}

// \u2500\u2500 Risk classification (Groq) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
exports.classifyRisk = async(text) => {
    try {
        const resp = await groqComplete([{
                role: 'system',
                content: 'You are a mental health risk classifier. Respond with ONLY one word: safe, emotional_distress, self_harm_risk, or suicide_risk. No explanation, no punctuation.'
            },
            {
                role: 'user',
                content: `Classify the mental health risk level of this message:\n"${text}"`
            }
        ], { max_tokens: 10, temperature: 0 });
        const valid = ['safe', 'emotional_distress', 'self_harm_risk', 'suicide_risk'];
        const lower = resp.toLowerCase().replace(/[".]/g, '').trim();
        return valid.find(v => lower.includes(v)) || 'safe';
    } catch (err) {
        console.error('Risk classification error:', err.message);
        return 'safe';
    }
};

// \u2500\u2500 Embedding via Python sentence-transformer service \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const EMBED_BASE = (process.env.EMBEDDING_SERVICE_URL || 'http://localhost:5001/embed').replace('/embed', '');
const EMBED_URL = EMBED_BASE + '/embed';
const STORE_URL = EMBED_BASE + '/store';
const RETRIEVE_URL = EMBED_BASE + '/retrieve';

exports.generateEmbedding = async(text) => {
    try {
        const res = await axios.post(EMBED_URL, { text }, { timeout: 4000 });
        if (res.data && res.data.embedding) return res.data.embedding;
    } catch (err) {
        if (err.code !== 'ECONNREFUSED') console.warn('Embedding service error:', err.message);
    }
    return null;
};

exports.storeInVectorService = async(uid, text, role = 'user', source = 'chat') => {
    try {
        await axios.post(STORE_URL, { uid, text, role, source }, { timeout: 4000 });
        return true;
    } catch { return false; }
};

exports.retrieveFromVectorService = async(uid, query, topK = 4, threshold = 0.55) => {
    try {
        const res = await axios.post(RETRIEVE_URL, { uid, query, topK, threshold }, { timeout: 4000 });
        return (res.data && res.data.results) || [];
    } catch { return []; }
};

// ── Cosine similarity (pure JS) ───────────────────────────────────────────────
exports.cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0,
        nA = 0,
        nB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        nA += vecA[i] * vecA[i];
        nB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(nA) * Math.sqrt(nB);
    return denom ? dot / denom : 0;
};

// \u2500\u2500 Memory extraction decision (Groq) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
exports.shouldExtractMemory = async(text) => {
    try {
        const resp = await groqComplete([{
                role: 'system',
                content: `You decide if a chat message contains important personal context worth saving long-term (emotions, life events, preferences, recurring themes).
Respond with ONLY valid JSON, no markdown, no code blocks.
If worth saving: {"shouldRemember":true,"memoryType":"emotion|recurring_theme|preference|life_context","summary":"brief factual summary max 20 words"}
If not:          {"shouldRemember":false}`
            },
            { role: 'user', content: `Message: "${text}"` }
        ], { max_tokens: 100, temperature: 0, json: true });

        const match = resp.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        return { shouldRemember: false };
    } catch (err) {
        console.error('Memory extraction error:', err.message);
        return { shouldRemember: false };
    }
};

// ── Main chat reply (Groq only) ───────────────────────────────────────────────
const LANG_NAMES = {
    'en-IN': 'English',
    'hi-IN': 'Hindi',
    'te-IN': 'Telugu',
    'ta-IN': 'Tamil',
    'kn-IN': 'Kannada',
    'ml-IN': 'Malayalam',
    'mr-IN': 'Marathi',
    'bn-IN': 'Bengali',
    'gu-IN': 'Gujarati',
    'pa-IN': 'Punjabi',
    'or-IN': 'Odia',
    'ur-IN': 'Urdu',
};

/**
 * @param {Object} params
 * @param {string} params.userText
 * @param {Array}  params.history          [{role:'user'|'model', text:'...'}]
 * @param {string} [params.memoryContext]
 * @param {string} [params.journalContext]
 * @param {string} [params.frontendContext]
 * @param {string} [params.riskLevel]
 * @param {string} [params.language]       BCP-47 e.g. 'hi-IN'
 * @returns {Promise<{text:string, provider:'groq'|'fallback'}>}
 */
exports.generateChatReply = async({
        userText,
        history = [],
        memoryContext = '',
        journalContext = '',
        frontendContext = '',
        riskLevel = 'safe',
        language = 'en-IN'
    } = {}) => {
        const langName = LANG_NAMES[language] || 'English';
        const langInstruction = language && language !== 'en-IN' ?
            `\n\nCRITICAL — LANGUAGE: The user is communicating in ${langName}. You MUST reply ONLY in ${langName}. Match their script exactly (Devanagari for Hindi, Telugu script for Telugu, etc.). If they mix languages, mirror the mix but keep ${langName} dominant.` :
            '';

        const systemPrompt = `You are Aurova, a warm and empathetic mental health AI companion. You listen deeply, respond with genuine care, and support users through emotional challenges without judgment.

CORE PRINCIPLES:
- Be present, warm, and human — not robotic or clinical.
- Acknowledge feelings before offering perspective.
- Use gentle open-ended questions to encourage reflection.
- Keep responses concise but meaningful (2–4 sentences unless the user needs more).
- Never diagnose, prescribe, or give medical advice.
- If the user shows high distress, gently encourage professional help.
${journalContext  ? `\nRECENT JOURNALS:\n${journalContext}`   : ''}
${memoryContext   ? `\nREMEMBERED CONTEXT:\n${memoryContext}` : ''}
${frontendContext ? `\nEXTRA CONTEXT: ${frontendContext}`     : ''}
${riskLevel && riskLevel !== 'safe' ? `\nRISK SIGNAL: ${riskLevel} — respond with extra care and sensitivity.` : ''}${langInstruction}`.trim();

    try {
        const messages = [{ role: 'system', content: systemPrompt }];
        for (const m of history.slice(-8)) {
            messages.push({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text });
        }
        messages.push({ role: 'user', content: userText });

        const text = await groqComplete(messages, { max_tokens: 512, temperature: 0.75 });
        if (text) return { text, provider: 'groq' };
    } catch (err) {
        console.error('Groq chat error:', err.message);
    }

    return {
        text: "I'm here with you. I couldn't quite formulate a response right now, but please know I'm listening. Could you tell me more about what you're feeling?",
        provider: 'fallback'
    };
};