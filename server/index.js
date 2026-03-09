require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const journalRoutes = require('./routes/journal');
const chatRoutes = require('./routes/chat');
const doctorRoutes = require('./routes/doctor');
const profileRoutes = require('./routes/profile');
const wellnessRoutes = require('./routes/wellness');
const bookingRoutes = require('./routes/booking');
const sarvamRoutes = require('./routes/sarvam');
const moodRoutes = require('./routes/moodRoutes');
const moodAssessmentRoutes = require('./routes/moodAssessment');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/sarvam', sarvamRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/mood-assessments', moodAssessmentRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Auth server is running' });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });