const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const SARVAM_KEY = process.env.SARVAM_API_KEY;
const SARVAM_BASE = 'https://api.sarvam.ai';

// @route   POST /api/sarvam/stt
// @desc    Proxy audio -> Sarvam STT, returns { transcript }
// @access  Public (IP-level auth via API key only)
router.post('/stt', upload.single('file'), async(req, res) => {
    if (!SARVAM_KEY) return res.status(503).json({ error: 'Sarvam API key not configured.' });
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded. Send as multipart field "file".' });

    try {
        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename: req.file.originalname || 'audio.wav',
            contentType: req.file.mimetype || 'audio/wav',
        });
        form.append('model', process.env.SARVAM_STT_MODEL || 'saaras:v3');
        form.append('language_code', req.body.language_code || 'en-IN');

        const response = await axios.post(`${SARVAM_BASE}/speech-to-text`, form, {
            headers: {
                'api-subscription-key': SARVAM_KEY,
                ...form.getHeaders(),
            },
            timeout: 30000,
        });

        const transcript = (response.data && response.data.transcript) || (response.data && response.data.text) || '';
        res.json({ transcript });
    } catch (err) {
        console.error('Sarvam STT error:', (err.response && err.response.data) || err.message);
        res.status(500).json({ error: (err.response && err.response.data && err.response.data.message) || 'Sarvam STT failed.' });
    }
});

// @route   POST /api/sarvam/tts
// @desc    Proxy text -> Sarvam TTS, returns { audio_base64, content_type }
// @access  Public
router.post('/tts', async(req, res) => {
    if (!SARVAM_KEY) return res.status(503).json({ error: 'Sarvam API key not configured.' });

    const { text, language, speaker } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Missing "text" in request body.' });

    try {
        const payload = {
            inputs: [text.slice(0, 500)],
            target_language_code: language || process.env.SARVAM_TTS_LANG || 'en-IN',
            speaker: speaker || process.env.SARVAM_TTS_SPEAKER || 'shubh',
            model: process.env.SARVAM_TTS_MODEL || 'bulbul:v3',
        };

        const response = await axios.post(`${SARVAM_BASE}/text-to-speech`, payload, {
            headers: {
                'api-subscription-key': SARVAM_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        // Sarvam returns { audios: [ "<base64 wav>" ] }
        const audios = (response.data && response.data.audios) || (response.data && response.data.audio);
        const audioBase64 = Array.isArray(audios) ? audios[0] : audios;
        res.json({ audio_base64: audioBase64, content_type: 'audio/wav' });
    } catch (err) {
        console.error('Sarvam TTS error:', (err.response && err.response.data) || err.message);
        res.status(500).json({ error: (err.response && err.response.data && err.response.data.message) || 'Sarvam TTS failed.' });
    }
});

module.exports = router;