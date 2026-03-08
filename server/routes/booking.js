const express = require('express');
const Consultation = require('../models/Consultation');
const DoctorProfile = require('../models/DoctorProfile');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// ── INSERT ─────────────────────────────────────────────────
// @route   POST /api/booking
// @desc    Create a new booking (patient-side)
// @access  Private
router.post('/', auth, async(req, res) => {
    try {
        const {
            doctorId,
            scheduledDate,
            scheduledTime,
            duration,
            sessionType,
            reason,
            symptoms,
            urgencyLevel,
            notes
        } = req.body;

        if (!scheduledDate || !scheduledTime) {
            return res.status(400).json({ message: 'Date and time are required' });
        }

        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

        // Only link to a doctor profile if a valid-looking doctorId was provided
        const mongoose = require('mongoose');
        let resolvedDoctorId = null;
        let resolvedDoctorProfileId = null;
        if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
            const doctor = await DoctorProfile.findOne({ userId: doctorId });
            if (doctor) {
                resolvedDoctorId = doctorId;
                resolvedDoctorProfileId = doctor._id;
            }
        }

        const consultation = new Consultation({
            doctorId: resolvedDoctorId,
            patientId: req.user.id,
            doctorProfileId: resolvedDoctorProfileId,
            scheduledTime: scheduledDateTime,
            duration: duration || 30,
            sessionType: sessionType || 'Video',
            status: 'upcoming',
            clinicalFormData: {
                status: 'pending',
                basicInfo: { reason, symptoms, urgencyLevel },
                responses: {}
            },
            notes: notes || ''
        });

        const saved = await consultation.save();
        res.json(saved);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── DISPLAY (all patient bookings) ─────────────────────────
// @route   GET /api/booking
// @desc    Get all bookings for the logged-in patient
// @access  Private
router.get('/', auth, async(req, res) => {
    try {
        const bookings = await Consultation.find({ patientId: req.user.id })
            .sort({ scheduledTime: -1 })
            .populate('doctorId', 'name email displayName')
            .populate('doctorProfileId', 'fullName specialization profileImage');
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── SEARCH ─────────────────────────────────────────────────
// @route   GET /api/booking/ops/search?status=&from=&to=&type=
// @desc    Search bookings
// @access  Private
router.get('/ops/search', auth, async(req, res) => {
    try {
        const { status, from, to, type, q } = req.query;
        const filter = { patientId: req.user.id };

        if (status) filter.status = status;
        if (type) filter.sessionType = type;
        if (from || to) {
            filter.scheduledTime = {};
            if (from) filter.scheduledTime.$gte = new Date(from);
            if (to) filter.scheduledTime.$lte = new Date(to);
        }
        if (q) {
            filter.$or = [
                { notes: { $regex: q, $options: 'i' } },
                { 'clinicalFormData.basicInfo.reason': { $regex: q, $options: 'i' } }
            ];
        }

        const bookings = await Consultation.find(filter)
            .sort({ scheduledTime: -1 })
            .populate('doctorId', 'name email displayName')
            .populate('doctorProfileId', 'fullName specialization profileImage');
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── SINGLE BOOKING ─────────────────────────────────────────
// @route   GET /api/booking/:id
// @desc    Get a single booking by ID for the logged-in patient
// @access  Private
router.get('/:id', auth, async(req, res) => {
    try {
        const booking = await Consultation.findOne({ _id: req.params.id, patientId: req.user.id })
            .populate('doctorId', 'name email displayName')
            .populate('doctorProfileId', 'fullName specialization profileImage');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── UPDATE ─────────────────────────────────────────────────
// @route   PUT /api/booking/:id
// @desc    Update a booking (reschedule, update notes, session type)
// @access  Private
router.put('/:id', auth, async(req, res) => {
    try {
        const { scheduledDate, scheduledTime, sessionType, duration, notes, reason, symptoms, urgencyLevel } = req.body;

        const booking = await Consultation.findOne({ _id: req.params.id, patientId: req.user.id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'completed' || booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot update a completed or cancelled booking' });
        }

        if (scheduledDate && scheduledTime) {
            booking.scheduledTime = new Date(`${scheduledDate}T${scheduledTime}`);
        }
        if (sessionType) booking.sessionType = sessionType;
        if (duration) booking.duration = duration;
        if (notes !== undefined) booking.notes = notes;
        if (reason || symptoms || urgencyLevel) {
            booking.clinicalFormData = booking.clinicalFormData || {};
            booking.clinicalFormData.basicInfo = {
                ...booking.clinicalFormData.basicInfo,
                ...(reason && { reason }),
                ...(symptoms && { symptoms }),
                ...(urgencyLevel && { urgencyLevel })
            };
        }

        const updated = await booking.save();
        res.json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── DELETE ──────────────────────────────────────────────────
// @route   DELETE /api/booking/:id
// @desc    Cancel/delete a booking
// @access  Private
router.delete('/:id', auth, async(req, res) => {
    try {
        const booking = await Consultation.findOne({ _id: req.params.id, patientId: req.user.id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'completed') {
            return res.status(400).json({ message: 'Cannot delete a completed booking' });
        }

        booking.status = 'cancelled';
        await booking.save();
        res.json({ message: 'Booking cancelled', id: req.params.id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── PREREQUISITE FORM: INSERT/UPDATE ───────────────────────
// @route   PUT /api/booking/:id/form
// @desc    Submit prerequisite consultation form data
// @access  Private
router.put('/:id/form', auth, async(req, res) => {
    try {
        const { responses } = req.body;
        const booking = await Consultation.findOne({ _id: req.params.id, patientId: req.user.id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.clinicalFormData = booking.clinicalFormData || {};
        booking.clinicalFormData.responses = responses;
        booking.clinicalFormData.status = 'submitted';
        booking.clinicalFormData.submittedBy = req.user.id;
        booking.clinicalFormData.submittedAt = new Date();

        const updated = await booking.save();
        res.json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── PREREQUISITE FORM: DISPLAY ──────────────────────────────
// @route   GET /api/booking/:id/form
// @desc    Get prerequisite form data for a booking
// @access  Private
router.get('/:id/form', auth, async(req, res) => {
    try {
        const booking = await Consultation.findOne({ _id: req.params.id, patientId: req.user.id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking.clinicalFormData || {});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ── PREREQUISITE FORM: DELETE ───────────────────────────────
// @route   DELETE /api/booking/:id/form
// @desc    Clear prerequisite form responses
// @access  Private
router.delete('/:id/form', auth, async(req, res) => {
    try {
        const booking = await Consultation.findOne({ _id: req.params.id, patientId: req.user.id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.clinicalFormData.responses = {};
        booking.clinicalFormData.status = 'pending';
        booking.clinicalFormData.submittedAt = null;

        const updated = await booking.save();
        res.json({ message: 'Form cleared', formData: updated.clinicalFormData });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;