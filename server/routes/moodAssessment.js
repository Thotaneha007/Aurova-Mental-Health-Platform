const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const MoodAssessment = require('../models/MoodAssessment');

// POST / — Patient submits a mood assessment
router.post('/', auth, async (req, res) => {
  try {
    const assessment = new MoodAssessment({
      patientId: req.user.id,
      ...req.body,
    });
    await assessment.save();
    res.status(201).json(assessment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit assessment', error: err.message });
  }
});

// GET / — Patient retrieves their own assessments
router.get('/', auth, async (req, res) => {
  try {
    const assessments = await MoodAssessment.find({ patientId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assessments', error: err.message });
  }
});

// GET /doctor — Doctor retrieves all patient assessments
router.get('/doctor', auth, async (req, res) => {
  try {
    const assessments = await MoodAssessment.find()
      .populate('patientId', 'displayName email')
      .sort({ createdAt: -1 });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assessments', error: err.message });
  }
});

// PUT /:id/review — Doctor reviews an assessment and adds notes
router.put('/:id/review', auth, async (req, res) => {
  try {
    const { doctorNotes, reviewed } = req.body;
    const assessment = await MoodAssessment.findByIdAndUpdate(
      req.params.id,
      { doctorNotes, reviewed },
      { new: true }
    ).populate('patientId', 'displayName email');
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update review', error: err.message });
  }
});

module.exports = router;
