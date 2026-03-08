const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const DoctorProfile = require('../models/DoctorProfile');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const Journal = require('../models/Journal');

const ALLOWED_FORM_FIELD_TYPES = new Set(['text', 'textarea', 'select', 'checkbox', 'number', 'date', 'radio', 'multiselect', 'email', 'phone', 'url', 'image']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/;

const isValidHttpUrl = (value) => {
    try {
        const parsed = new URL(String(value));
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const isValidImageReference = (value) => {
    if (!value) return true;
    const stringValue = String(value).trim();
    if (!stringValue) return true;
    return stringValue.startsWith('data:image/') || isValidHttpUrl(stringValue);
};

const parseNumberOrUndefined = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeFormFields = (fields = []) => {
    if (!Array.isArray(fields)) {
        throw new Error('Form fields must be an array');
    }

    return fields.map((field, index) => {
        const label = (field && field.label ? field.label : '').trim();
        if (!label) {
            throw new Error(`Field ${index + 1} is missing a label`);
        }

        const type = (field && field.type ? field.type : 'text').toLowerCase();
        if (!ALLOWED_FORM_FIELD_TYPES.has(type)) {
            const badType = field && field.type ? field.type : 'unknown';
            throw new Error(`Unsupported field type: ${badType}`);
        }

        const normalized = {
            key: (field && field.key ? field.key : `field_${index + 1}`).trim(),
            label,
            type,
            options: Array.isArray(field && field.options ? field.options : null) ? field.options.map(o => String(o).trim()).filter(Boolean) : [],
            placeholder: (field && field.placeholder) ? String(field.placeholder).trim() : '',
            helpText: (field && field.helpText) ? String(field.helpText).trim() : '',
            referenceImage: (field && field.referenceImage) ? String(field.referenceImage).trim() : '',
            min: parseNumberOrUndefined(field && field.min !== undefined ? field.min : undefined),
            max: parseNumberOrUndefined(field && field.max !== undefined ? field.max : undefined),
            minLength: parseNumberOrUndefined(field && field.minLength !== undefined ? field.minLength : undefined),
            maxLength: parseNumberOrUndefined(field && field.maxLength !== undefined ? field.maxLength : undefined),
            pattern: (field && field.pattern) ? String(field.pattern).trim() : '',
            required: Boolean(field && field.required ? field.required : false),
            order: Number.isFinite(Number(field && field.order !== undefined ? field.order : NaN)) ? Number(field.order) : index
        };

        if ((type === 'select' || type === 'radio' || type === 'multiselect') && normalized.options.length === 0) {
            throw new Error(`Field "${label}" requires options`);
        }

        if (!isValidImageReference(normalized.referenceImage)) {
            throw new Error(`Field "${label}" has invalid reference image`);
        }

        if (normalized.min !== undefined && normalized.max !== undefined && normalized.min > normalized.max) {
            throw new Error(`Field "${label}" has invalid number range`);
        }

        if (normalized.minLength !== undefined && normalized.maxLength !== undefined && normalized.minLength > normalized.maxLength) {
            throw new Error(`Field "${label}" has invalid text length range`);
        }

        if (normalized.pattern) {
            try {
                // Validate regex string at creation time so submission checks don't crash later.
                new RegExp(normalized.pattern);
            } catch {
                throw new Error(`Field "${label}" has invalid regex pattern`);
            }
        }

        return normalized;
    });
};

const DEFAULT_CLINICAL_FORM_TEMPLATES = [{
        title: 'General Intake Form',
        description: 'Mental health intake before first consultation.',
        fields: [
            { key: 'main_concern', label: 'What mental health concern brings you here today?', type: 'textarea', required: true, placeholder: 'Describe your concern...' },
            { key: 'mood_last_week', label: 'How would you describe your mood over the last 7 days?', type: 'radio', required: true, options: ['Stable', 'Low', 'Anxious', 'Irritable', 'Mixed'] },
            { key: 'goal', label: 'What do you want to improve from therapy?', type: 'text', required: true, placeholder: 'Your goal' },
            { key: 'duration', label: 'How long has this been affecting you?', type: 'select', required: true, options: ['< 1 month', '1-3 months', '3-12 months', '1+ year'] }
        ]
    },
    {
        title: 'Mental Health Baseline',
        description: 'Baseline screening of stress, sleep, and anxiety symptoms.',
        fields: [
            { key: 'stress_level', label: 'Current stress level (1-10)', type: 'number', required: true, min: 1, max: 10 },
            { key: 'sleep_hours', label: 'Average sleep (hours)', type: 'number', required: true, min: 0, max: 24 },
            { key: 'sleep_quality', label: 'Sleep quality', type: 'radio', required: true, options: ['Good', 'Average', 'Poor'] },
            { key: 'panic_recent', label: 'Any panic/anxiety episodes in last 7 days?', type: 'checkbox', required: false },
            { key: 'focus_impact', label: 'Has mood/anxiety impacted your focus or daily routine?', type: 'radio', required: true, options: ['Not at all', 'Somewhat', 'Significantly'] }
        ]
    },
    {
        title: 'Session Safety & Consent',
        description: 'Mental health safety check, support system, and consent.',
        fields: [
            { key: 'emergency_contact', label: 'Emergency contact number', type: 'phone', required: true, placeholder: '+1...' },
            { key: 'consent', label: 'I consent to treatment discussion and record notes', type: 'checkbox', required: true },
            { key: 'risk_screen', label: 'Are you currently feeling unsafe or at risk of self-harm?', type: 'radio', required: true, options: ['No', 'Unsure', 'Yes'] },
            { key: 'support_person', label: 'Do you have a trusted support person?', type: 'radio', required: true, options: ['Yes', 'No'] },
            { key: 'communication_preference', label: 'Preferred communication style', type: 'multiselect', required: true, options: ['Direct', 'Gentle', 'Structured', 'Open conversation'] },
            { key: 'extra_notes', label: 'Anything important your doctor should know before session?', type: 'textarea', required: false }
        ]
    }
];

const ensureDefaultClinicalForms = (profile) => {
    if (!profile) return false;
    if (!Array.isArray(profile.clinicalForms)) profile.clinicalForms = [];

    let changed = false;
    const existingTitles = new Set(
        profile.clinicalForms.map(function(form) {
            return form && form.title ? String(form.title).trim().toLowerCase() : '';
        }).filter(Boolean)
    );

    for (const template of DEFAULT_CLINICAL_FORM_TEMPLATES) {
        if (existingTitles.has(template.title.toLowerCase())) continue;
        profile.clinicalForms.push({
            title: template.title,
            description: template.description,
            fields: normalizeFormFields(template.fields),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        changed = true;
    }

    if (!profile.activeFormId && profile.clinicalForms.length > 0) {
        profile.activeFormId = profile.clinicalForms[0]._id;
        changed = true;
    }

    return changed;
};

const buildBookingBasicInfo = async({ userId, anonymousBooking }) => {
    const user = await User.findById(userId).select('displayName email role');
    const userRole = (user && user.role) ? user.role : '';
    const isAnonymous = Boolean(anonymousBooking) || userRole === 'anonymous';

    let displayName = 'Patient';
    if (!isAnonymous && user && user.displayName) {
        displayName = user.displayName;
    } else if (isAnonymous) {
        displayName = 'Anonymous Patient';
    }

    let email = null;
    if (!isAnonymous && user && user.email) {
        email = user.email;
    }

    return {
        patientId: userId,
        isAnonymous,
        displayName,
        email
    };
};

const validateResponseByFieldType = (field, value) => {
    if (value === undefined || value === null || value === '') {
        return !field.required;
    }

    const stringValue = typeof value === 'string' ? value : String(value);

    switch (field.type) {
        case 'checkbox':
            return typeof value === 'boolean' && (!field.required || value === true);
        case 'number':
            {
                const numeric = Number(value);
                if (Number.isNaN(numeric)) return false;
                if (field.min !== undefined && numeric < Number(field.min)) return false;
                if (field.max !== undefined && numeric > Number(field.max)) return false;
                return true;
            }
        case 'email':
            return EMAIL_REGEX.test(stringValue.trim());
        case 'phone':
            {
                const trimmed = stringValue.trim();
                const digits = trimmed.replace(/\D/g, '');
                return PHONE_REGEX.test(trimmed) && digits.length >= 7;
            }
        case 'url':
        case 'image':
            return isValidImageReference(stringValue);
        case 'date':
            return !Number.isNaN(new Date(stringValue).getTime());
        case 'select':
        case 'radio':
            return Array.isArray(field.options) && field.options.includes(stringValue);
        case 'multiselect':
            if (!Array.isArray(value)) return false;
            if (field.required && value.length === 0) return false;
            return value.every(v => Array.isArray(field.options) && field.options.includes(String(v)));
        case 'text':
        case 'textarea':
            {
                const trimmed = stringValue;
                if (field.minLength !== undefined && trimmed.length < Number(field.minLength)) return false;
                if (field.maxLength !== undefined && trimmed.length > Number(field.maxLength)) return false;
                if (field.pattern) {
                    try {
                        const regex = new RegExp(field.pattern);
                        if (!regex.test(trimmed)) return false;
                    } catch {
                        return false;
                    }
                }
                return true;
            }
        default:
            return true;
    }
};

// ============================================================
// PUBLIC ROUTES (Authentication required, any role allowed)
// ============================================================

// @route   GET /api/doctor/discovery
// @desc    Get all verified doctors for patient booking (PUBLIC for logged-in users)
router.get('/discovery', auth, async(req, res) => {
    try {
        const doctors = await DoctorProfile.find({})
            .select('-licenseId -stats.amountEarned -stats.hoursCommitted -clinicalForms.fields')
            .populate('userId', 'displayName email');

        // Cleanup expired locks
        const now = new Date();
        for (let doc of doctors) {
            let changed = false;
            if (ensureDefaultClinicalForms(doc)) changed = true;
            doc.dailySchedules.forEach(day => {
                day.slots.forEach(slot => {
                    if (slot.status === 'in-progress' && slot.lockExpires && slot.lockExpires < now) {
                        slot.status = 'available';
                        slot.lockExpires = null;
                        changed = true;
                    }
                });
            });
            if (changed) await doc.save();
        }

        res.json(doctors);
    } catch (err) {
        console.error('Discovery Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ============================================================
// SLOT BOOKING ROUTES (For patients)
// ============================================================

// @route   POST /api/doctor/slots/lock
// @desc    Lock a slot temporarily for booking
router.post('/slots/lock', auth, async(req, res) => {
    const { doctorId, date, slotId } = req.body;
    try {
        const profile = await DoctorProfile.findOne({ userId: doctorId });
        if (!profile) return res.status(404).json({ message: 'Doctor not found' });

        const day = profile.dailySchedules.find(d => d.date === date);
        if (!day) return res.status(404).json({ message: 'Date not available' });

        const slot = day.slots.id(slotId);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });

        if (slot.status !== 'available') {
            return res.status(400).json({ message: 'Slot is no longer available' });
        }

        // Lock the slot for 10 minutes
        slot.status = 'in-progress';
        slot.lockExpires = new Date(Date.now() + 10 * 60 * 1000);
        await profile.save();

        // Return active form if doctor has one
        const activeForm = profile.clinicalForms.id(profile.activeFormId);

        res.json({
            message: 'Slot locked successfully',
            lockExpires: slot.lockExpires,
            clinicalForm: activeForm || null
        });
    } catch (err) {
        console.error('Lock Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/doctor/slots/unlock
// @desc    Release a locked slot
router.post('/slots/unlock', auth, async(req, res) => {
    const { doctorId, date, slotId } = req.body;
    try {
        const profile = await DoctorProfile.findOne({ userId: doctorId });
        if (!profile) return res.status(404).json({ message: 'Doctor not found' });

        const day = profile.dailySchedules.find(d => d.date === date);
        if (!day) return res.status(404).json({ message: 'Date not found' });

        const slot = day.slots.id(slotId);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });

        if (slot.status === 'in-progress') {
            slot.status = 'available';
            slot.lockExpires = null;
            await profile.save();
        }

        res.json({ message: 'Slot released' });
    } catch (err) {
        console.error('Unlock Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/doctor/slots/book
// @desc    Confirm booking (payment must be confirmed). If doctor has active form, it is assigned as a post-booking prerequisite.
router.post('/slots/book', auth, async(req, res) => {
    const { doctorId, date, slotId, sessionType, paymentConfirmed, anonymousBooking } = req.body;
    try {
        if (!paymentConfirmed) {
            return res.status(402).json({ message: 'Payment confirmation is required before booking.' });
        }

        const profile = await DoctorProfile.findOne({ userId: doctorId });
        if (!profile) return res.status(404).json({ message: 'Doctor not found' });

        const day = profile.dailySchedules.find(d => d.date === date);
        if (!day) return res.status(404).json({ message: 'Date not found' });

        const slot = day.slots.id(slotId);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });

        if (slot.status !== 'in-progress') {
            return res.status(400).json({ message: 'Slot booking window expired. Please try again.' });
        }

        // Confirm booking
        slot.status = 'booked';
        slot.patientId = req.user.id;
        slot.lockExpires = null;
        if (sessionType) slot.sessionType = sessionType;

        const activeForm = profile.activeFormId ? profile.clinicalForms.id(profile.activeFormId) : null;
        const bookingBasicInfo = await buildBookingBasicInfo({
            userId: req.user.id,
            anonymousBooking
        });

        if (activeForm) {
            slot.clinicalFormData = {
                formId: activeForm._id,
                title: activeForm.title,
                status: 'pending',
                basicInfo: bookingBasicInfo,
                fieldsSnapshot: activeForm.fields || [],
                responses: {},
                filledAt: new Date()
            };
        }

        ensureDefaultClinicalForms(profile);
        await profile.save();

        // Create consultation record
        const consultation = new Consultation({
            doctorId: doctorId,
            patientId: req.user.id,
            doctorProfileId: profile._id,
            scheduledTime: new Date(`${date}T${slot.startTime}:00`),
            duration: slot.duration || 30,
            sessionType: slot.sessionType,
            clinicalFormData: activeForm ? {
                formId: activeForm._id,
                title: activeForm.title,
                status: 'pending',
                basicInfo: bookingBasicInfo,
                fieldsSnapshot: activeForm.fields || [],
                responses: {},
                filledAt: new Date()
            } : {
                status: 'not-required',
                basicInfo: bookingBasicInfo,
                responses: {},
                filledAt: new Date()
            },
            status: 'upcoming'
        });
        await consultation.save();

        res.json({
            message: 'Booking confirmed!',
            consultation: {
                id: consultation._id,
                scheduledTime: consultation.scheduledTime,
                sessionType: consultation.sessionType,
                doctorName: profile.fullName,
                clinicalFormStatus: (consultation.clinicalFormData && consultation.clinicalFormData.status) ? consultation.clinicalFormData.status : 'not-required'
            },
            prerequisiteFormRequired: Boolean(activeForm)
        });
    } catch (err) {
        console.error('Booking Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/patient/bookings
// @desc    Get patient's own bookings
router.get('/patient/bookings', auth, async(req, res) => {
    try {
        const consultations = await Consultation.find({ patientId: req.user.id })
            .populate('doctorId', 'displayName email')
            .sort({ scheduledTime: -1 });

        // Get doctor profiles for additional info
        const enrichedConsultations = await Promise.all(consultations.map(async(c) => {
            const profile = await DoctorProfile.findOne({ userId: c.doctorId._id })
                .select('fullName specialization profileImage');
            return {
                id: c._id,
                scheduledTime: c.scheduledTime,
                duration: c.duration,
                sessionType: c.sessionType,
                status: c.status,
                doctor: {
                    id: c.doctorId._id,
                    name: (profile && profile.fullName) ? profile.fullName : c.doctorId.displayName,
                    specialization: (profile && profile.specialization) ? profile.specialization : null,
                    image: (profile && profile.profileImage) ? profile.profileImage : null
                },
                clinicalFormData: c.clinicalFormData,
                notes: c.notes,
                rating: c.rating
            };
        }));

        res.json(enrichedConsultations);
    } catch (err) {
        console.error('Patient Bookings Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/patient/forms/pending
// @desc    Get pending prerequisite forms for logged-in patient
router.get('/patient/forms/pending', auth, async(req, res) => {
    try {
        const consultations = await Consultation.find({
                patientId: req.user.id,
                'clinicalFormData.status': 'pending'
            })
            .populate('doctorId', 'displayName email')
            .sort({ scheduledTime: -1 });

        const data = await Promise.all(consultations.map(async(c) => {
            const doctorId = (c.doctorId && c.doctorId._id) ? c.doctorId._id : c.doctorId;
            const profile = await DoctorProfile.findOne({ userId: doctorId }).select('fullName specialization profileImage');
            return {
                consultationId: c._id,
                scheduledTime: c.scheduledTime,
                doctor: {
                    id: doctorId,
                    name: (profile && profile.fullName) ? profile.fullName : ((c.doctorId && c.doctorId.displayName) ? c.doctorId.displayName : 'Doctor'),
                    specialization: (profile && profile.specialization) ? profile.specialization : '',
                    image: (profile && profile.profileImage) ? profile.profileImage : ''
                },
                form: c.clinicalFormData
            };
        }));

        res.json(data);
    } catch (err) {
        console.error('Pending Forms Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/doctor/patient/consultations/:consultationId/form
// @desc    Submit prerequisite form after booking/payment
router.post('/patient/consultations/:consultationId/form', auth, async(req, res) => {
    const { responses } = req.body;
    try {
        const consultation = await Consultation.findOne({
            _id: req.params.consultationId,
            patientId: req.user.id
        });
        if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

        const formData = consultation.clinicalFormData || {};
        if (!formData.formId || formData.status !== 'pending') {
            return res.status(400).json({ message: 'No pending prerequisite form for this booking.' });
        }

        const fields = Array.isArray(formData.fieldsSnapshot) ? formData.fieldsSnapshot : [];
        const payload = (responses && typeof responses === 'object') ? responses : {};

        for (const field of fields) {
            const key = field.key || field.label;
            const value = payload[key];
            if (!validateResponseByFieldType(field, value)) {
                return res.status(400).json({
                    message: `Invalid response for field "${field.label}"`
                });
            }
        }

        formData.responses = payload;
        formData.status = 'submitted';
        formData.submittedBy = req.user.id;
        formData.submittedAt = new Date();
        formData.filledAt = new Date();
        consultation.clinicalFormData = formData;
        await consultation.save();

        const profile = await DoctorProfile.findOne({ userId: consultation.doctorId });
        if (profile) {
            const targetDate = new Date(consultation.scheduledTime).toLocaleDateString('en-CA');
            const timeStr = new Date(consultation.scheduledTime).toTimeString().slice(0, 5);
            const day = profile.dailySchedules.find(d => d.date === targetDate);
            const slot = day ? day.slots.find(s => s.startTime === timeStr && String(s.patientId) === String(req.user.id)) : null;
            if (slot) {
                slot.clinicalFormData = {
                    ...(slot.clinicalFormData || {}),
                    responses: payload,
                    status: 'submitted',
                    submittedBy: req.user.id,
                    submittedAt: new Date(),
                    filledAt: new Date()
                };
                await profile.save();
            }
        }

        res.json({
            message: 'Prerequisite form submitted successfully.',
            consultationId: consultation._id,
            clinicalFormData: consultation.clinicalFormData
        });
    } catch (err) {
        console.error('Submit Form Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ============================================================
// DOCTOR-ONLY ROUTES
// ============================================================

// Middleware to check doctor role for routes below
// Middleware to check doctor role for routes below
// We allow 'user' and 'patient' to access these for auto-provisioning/upgrading
const doctorOnly = role(['doctor', 'user', 'patient']);

// Helper to ensure user role is upgraded in DB
const ensureDoctorRole = async(userId) => {
    try {
        const user = await User.findById(userId);
        if (user && user.role !== 'doctor') {
            user.role = 'doctor';
            await user.save();
            console.log(`✅ Upgraded user ${userId} to doctor role in DB`);
        }
    } catch (err) {
        console.error('Failed to upgrade user role:', err.message);
    }
};

// @route   GET /api/doctor/profile
// @desc    Get doctor's own profile
router.get('/profile', auth, doctorOnly, async(req, res) => {
    try {
        console.log(`🔍 GET /profile - User ID: ${req.user.id}, Role: ${req.user.role}`);
        // Upgrade role in DB if needed (backwards compatibility/testing)
        await ensureDoctorRole(req.user.id);

        let profile = await DoctorProfile.findOne({ userId: req.user.id });

        if (!profile) {
            // Create default profile for new doctors
            const user = await User.findById(req.user.id);
            profile = new DoctorProfile({
                userId: req.user.id,
                fullName: (user && user.displayName) ? user.displayName : 'Doctor',
                specialization: 'General',
                licenseId: `LICENSE-${req.user.id}`,
                experienceYears: 0,
                bio: 'Please update your bio.'
            });
            await profile.save();
        }

        // Cleanup expired locks
        const now = new Date();
        let changed = false;
        if (ensureDefaultClinicalForms(profile)) changed = true;
        profile.dailySchedules.forEach(day => {
            day.slots.forEach(slot => {
                if (slot.status === 'in-progress' && slot.lockExpires && slot.lockExpires < now) {
                    slot.status = 'available';
                    slot.lockExpires = null;
                    changed = true;
                }
            });
        });
        if (changed) await profile.save();

        res.json(profile);
    } catch (err) {
        console.error('Get Profile Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/doctor/profile
// @desc    Update doctor's profile and schedule
router.put('/profile', auth, doctorOnly, async(req, res) => {
    const {
        fullName,
        specialization,
        licenseId,
        experienceYears,
        education,
        bio,
        profileImage,
        dailySchedules
    } = req.body;

    try {
        console.log(`💾 PUT /profile - User ID: ${req.user.id}, Role: ${req.user.role}`);
        // Upgrade role in DB if needed
        await ensureDoctorRole(req.user.id);

        let profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) {
            console.log('🐣 Creating missing doctor profile during update...');
            const user = await User.findById(req.user.id);
            profile = new DoctorProfile({
                userId: req.user.id,
                fullName: (user && user.displayName) ? user.displayName : 'Doctor',
                specialization: specialization || 'General',
                licenseId: licenseId || `LICENSE-${req.user.id}`,
                experienceYears: experienceYears || 0,
                bio: bio || 'Please update your bio.'
            });
            // Don't save yet, let the updates below fill in more data
        }

        // Update basic fields
        if (fullName) profile.fullName = fullName;
        if (specialization) profile.specialization = specialization;
        if (licenseId) profile.licenseId = licenseId;
        if (experienceYears !== undefined) profile.experienceYears = experienceYears;
        if (education) profile.education = education;
        if (bio) profile.bio = bio;
        if (profileImage) profile.profileImage = profileImage;

        // Handle schedule updates
        if (dailySchedules) {
            console.log('📅 Updating schedules...');

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            // Filter to future dates only
            const filteredSchedules = dailySchedules.filter(day => {
                const dayDate = new Date(day.date);
                return dayDate >= now;
            });

            // Validate booked slots are preserved
            for (const newDay of filteredSchedules) {
                const existingDay = profile.dailySchedules.find(d => d.date === newDay.date);

                if (existingDay) {
                    for (const existingSlot of existingDay.slots) {
                        if (existingSlot.status === 'booked' || existingSlot.status === 'in-progress') {
                            const foundInUpdate = newDay.slots.find(s =>
                                s.startTime === existingSlot.startTime &&
                                (s.status === 'booked' || s.status === 'in-progress')
                            );

                            if (!foundInUpdate) {
                                return res.status(400).json({
                                    message: `Cannot remove booked slot at ${existingSlot.startTime} on ${newDay.date}`
                                });
                            }
                        }
                    }
                }
            }

            profile.dailySchedules = filteredSchedules;
            console.log('✅ Schedule validation passed');
        }

        await profile.save();
        console.log('✅ Profile saved successfully');

        res.json(profile);
    } catch (err) {
        console.error('❌ Profile update error:', err.message);
        res.status(400).json({ message: err.message || 'Failed to update profile' });
    }
});

// @route   GET /api/doctor/forms
// @desc    List doctor's form templates
router.get('/forms', auth, doctorOnly, async(req, res) => {
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        res.json({
            activeFormId: profile.activeFormId || null,
            forms: profile.clinicalForms || []
        });
    } catch (err) {
        console.error('List Forms Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/forms/:formId
// @desc    Get a form template by id
router.get('/forms/:formId', auth, doctorOnly, async(req, res) => {
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        const form = profile.clinicalForms.id(req.params.formId);
        if (!form) return res.status(404).json({ message: 'Form not found' });
        res.json(form);
    } catch (err) {
        console.error('Get Form Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/doctor/forms
// @desc    Create a new clinical form template
router.post('/forms', auth, doctorOnly, async(req, res) => {
    const { title, description, fields } = req.body;
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        const safeTitle = String(title || '').trim();
        if (!safeTitle) {
            return res.status(400).json({ message: 'Form title is required' });
        }

        const normalizedFields = normalizeFormFields(fields || []);
        const newForm = {
            title: safeTitle,
            description: description ? String(description).trim() : '',
            fields: normalizedFields,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        profile.clinicalForms.push(newForm);
        await profile.save();

        const createdForm = profile.clinicalForms[profile.clinicalForms.length - 1];
        res.status(201).json(createdForm);
    } catch (err) {
        console.error('Create Form Error:', err.message);
        res.status(400).json({ message: err.message || 'Server Error' });
    }
});

// @route   PUT /api/doctor/forms/:formId
// @desc    Update a clinical form template
router.put('/forms/:formId', auth, doctorOnly, async(req, res) => {
    const { title, description, fields, isActive } = req.body;
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        const form = profile.clinicalForms.id(req.params.formId);
        if (!form) return res.status(404).json({ message: 'Form not found' });

        if (title !== undefined) {
            const safeTitle = String(title || '').trim();
            if (!safeTitle) return res.status(400).json({ message: 'Form title cannot be empty' });
            form.title = safeTitle;
        }
        if (description !== undefined) form.description = String(description || '').trim();
        if (fields !== undefined) form.fields = normalizeFormFields(fields);
        if (isActive !== undefined) form.isActive = Boolean(isActive);
        form.updatedAt = new Date();

        await profile.save();
        res.json(form);
    } catch (err) {
        console.error('Update Form Error:', err.message);
        res.status(400).json({ message: err.message || 'Server Error' });
    }
});

// @route   DELETE /api/doctor/forms/:formId
// @desc    Delete a clinical form template
router.delete('/forms/:formId', auth, doctorOnly, async(req, res) => {
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        const form = profile.clinicalForms.id(req.params.formId);
        if (!form) return res.status(404).json({ message: 'Form not found' });

        form.deleteOne();
        if (String(profile.activeFormId || '') === String(req.params.formId)) {
            profile.activeFormId = null;
        }

        ensureDefaultClinicalForms(profile);
        await profile.save();
        res.json({ message: 'Form deleted successfully' });
    } catch (err) {
        console.error('Delete Form Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/doctor/forms/:formId/activate
// @desc    Set a form as the active intake form for bookings
router.put('/forms/:formId/activate', auth, doctorOnly, async(req, res) => {
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        const form = profile.clinicalForms.id(req.params.formId);
        if (!form) return res.status(404).json({ message: 'Form not found' });

        profile.activeFormId = form._id;
        await profile.save();

        res.json({ message: 'Form activated', formId: form._id });
    } catch (err) {
        console.error('Activate Form Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/doctor/forms/deactivate
// @desc    Disable active intake form requirement
router.put('/forms/deactivate', auth, doctorOnly, async(req, res) => {
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        profile.activeFormId = null;
        await profile.save();
        res.json({ message: 'Active prerequisite form removed' });
    } catch (err) {
        console.error('Deactivate Form Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/consultations
// @desc    Get doctor's consultations (upcoming and past)
router.get('/consultations', auth, doctorOnly, async(req, res) => {
    try {
        const consultations = await Consultation.find({ doctorId: req.user.id })
            .populate('patientId', 'displayName email')
            .sort({ scheduledTime: -1 });

        res.json(consultations);
    } catch (err) {
        console.error('Consultations Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/consultations/upcoming
// @desc    Get doctor's upcoming consultations only
router.get('/consultations/upcoming', auth, doctorOnly, async(req, res) => {
    try {
        const now = new Date();
        const consultations = await Consultation.find({
                doctorId: req.user.id,
                scheduledTime: { $gte: now },
                status: { $in: ['upcoming', 'in-session'] }
            })
            .populate('patientId', 'displayName email')
            .sort({ scheduledTime: 1 });

        res.json(consultations);
    } catch (err) {
        console.error('Upcoming Consultations Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/stats
// @desc    Get doctor's practice statistics
router.get('/stats', auth, doctorOnly, async(req, res) => {
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        const consultations = await Consultation.find({ doctorId: req.user.id });

        const now = new Date();
        const stats = {
            totalConsultations: consultations.length,
            completedConsultations: consultations.filter(c => c.status === 'completed').length,
            upcomingConsultations: consultations.filter(c => c.scheduledTime > now && c.status === 'upcoming').length,
            cancelledConsultations: consultations.filter(c => c.status === 'cancelled').length,
            avgRating: (profile && profile.stats && profile.stats.avgRating) ? profile.stats.avgRating : 0,
            totalReviews: (profile && profile.reviews) ? profile.reviews.length : 0,
            hoursCommitted: (profile && profile.stats && profile.stats.hoursCommitted) ? profile.stats.hoursCommitted : 0
        };

        res.json(stats);
    } catch (err) {
        console.error('Stats Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/doctor/consultations/:id/notes
// @desc    Add/update notes for a consultation
router.put('/consultations/:id/notes', auth, doctorOnly, async(req, res) => {
    try {
        const { notes } = req.body;
        const consultation = await Consultation.findOneAndUpdate({ _id: req.params.id, doctorId: req.user.id }, { $set: { notes } }, { new: true });
        if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
        res.json(consultation);
    } catch (err) {
        console.error('Update Notes Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/vault
// @desc    Get patient vault (all patients doctor has consulted with)
router.get('/vault', auth, doctorOnly, async(req, res) => {
    try {
        const consultations = await Consultation.find({ doctorId: req.user.id })
            .populate('patientId', 'displayName email')
            .sort({ scheduledTime: -1 });

        // Group by patient
        const patientMap = new Map();
        consultations.forEach(c => {
            if (!c.patientId) return;
            const patientId = c.patientId._id.toString();
            if (!patientMap.has(patientId)) {
                patientMap.set(patientId, {
                    patient: {
                        id: c.patientId._id,
                        displayName: c.patientId.displayName,
                        email: c.patientId.email
                    },
                    consultationCount: 0,
                    lastConsultation: null,
                    consultations: []
                });
            }
            const entry = patientMap.get(patientId);
            entry.consultationCount++;
            if (!entry.lastConsultation || new Date(c.scheduledTime) > new Date(entry.lastConsultation)) {
                entry.lastConsultation = c.scheduledTime;
            }
            entry.consultations.push({
                id: c._id,
                scheduledTime: c.scheduledTime,
                sessionType: c.sessionType,
                status: c.status,
                hasNotes: !!c.notes,
                hasFormData: !!c.clinicalFormData
            });
        });

        res.json(Array.from(patientMap.values()));
    } catch (err) {
        console.error('Vault Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/patients/:patientId/summary
// @desc    Get detailed patient summary
router.get('/patients/:patientId/summary', auth, doctorOnly, async(req, res) => {
    try {
        // Verify doctor has consulted with this patient
        const hasConsultation = await Consultation.exists({
            doctorId: req.user.id,
            patientId: req.params.patientId
        });

        if (!hasConsultation) {
            return res.status(403).json({ message: 'Access denied: No prior consultation with this patient.' });
        }

        const patient = await User.findById(req.params.patientId).select('displayName email');
        const consultations = await Consultation.find({
            doctorId: req.user.id,
            patientId: req.params.patientId
        }).sort({ scheduledTime: -1 });

        // Get patient journals if available (with patient consent)
        const journals = await Journal.find({ userId: req.params.patientId })
            .sort({ createdAt: -1 })
            .limit(10);

        const insights = journals.map(j => ({
            date: j.createdAt,
            mood: (j.aiAnalysis && j.aiAnalysis.mood) ? j.aiAnalysis.mood : undefined,
            score: (j.aiAnalysis && j.aiAnalysis.score) ? j.aiAnalysis.score : undefined,
            summary: (j.aiAnalysis && j.aiAnalysis.summary) ? j.aiAnalysis.summary : undefined
        })).filter(i => i.mood);

        res.json({
            patient,
            consultations: consultations.map(c => ({
                id: c._id,
                scheduledTime: c.scheduledTime,
                sessionType: c.sessionType,
                status: c.status,
                notes: c.notes,
                clinicalFormData: c.clinicalFormData,
                rating: c.rating
            })),
            journals: journals.map(j => ({
                id: j._id,
                date: j.createdAt,
                content: j.content,
                aiAnalysis: j.aiAnalysis
            })),
            insights
        });
    } catch (err) {
        console.error('Patient Summary Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/doctor/slots/cancel
// @desc    Cancel an available slot (doctor only)
router.post('/slots/cancel', auth, doctorOnly, async(req, res) => {
    const { date, slotId } = req.body;
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        const day = profile.dailySchedules.find(d => d.date === date);
        if (!day) return res.status(404).json({ message: 'Date not found' });

        const slot = day.slots.id(slotId);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });

        if (slot.status === 'booked' || slot.status === 'in-progress') {
            return res.status(400).json({
                message: 'Cannot cancel slot with active booking'
            });
        }

        slot.status = 'off';
        await profile.save();

        res.json({ message: 'Slot cancelled' });
    } catch (err) {
        console.error('Cancel Slot Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ============================================================
// SANHITHA AC — Additional CRUD endpoints
// ============================================================

// @route   DELETE /api/doctor/profile
// @desc    Delete doctor profile
router.delete('/profile', auth, doctorOnly, async(req, res) => {
    try {
        const profile = await DoctorProfile.findOneAndDelete({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        res.json({ message: 'Doctor profile deleted' });
    } catch (err) {
        console.error('Delete Profile Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/consultations/search
// @desc    Search consultations by patient name, status, date range, keyword
router.get('/consultations/search', auth, doctorOnly, async(req, res) => {
    try {
        const { q, status, from, to } = req.query;
        let query = { doctorId: req.user.id };
        if (status) query.status = status;
        if (from || to) {
            query.scheduledTime = {};
            if (from) query.scheduledTime.$gte = new Date(from);
            if (to) query.scheduledTime.$lte = new Date(to);
        }
        let consultations = await Consultation.find(query)
            .populate('patientId', 'displayName email')
            .sort({ scheduledTime: -1 });
        if (q) {
            const lower = q.toLowerCase();
            consultations = consultations.filter(c =>
                ((c.patientId && c.patientId.displayName) ? c.patientId.displayName : '').toLowerCase().includes(lower) ||
                (c.notes || '').toLowerCase().includes(lower) ||
                (c.sessionType || '').toLowerCase().includes(lower)
            );
        }
        res.json(consultations);
    } catch (err) {
        console.error('Search Consultations Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/consultations/:id
// @desc    Get single consultation detail
router.get('/consultations/:id', auth, doctorOnly, async(req, res) => {
    try {
        const consultation = await Consultation.findOne({
            _id: req.params.id,
            doctorId: req.user.id
        }).populate('patientId', 'displayName email');
        if (!consultation) return res.status(404).json({ message: 'Not found' });
        res.json(consultation);
    } catch (err) {
        console.error('Get Consultation Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/doctor/consultations/:id/notes
// @desc    Clear notes from a consultation
router.delete('/consultations/:id/notes', auth, doctorOnly, async(req, res) => {
    try {
        const consultation = await Consultation.findOneAndUpdate({ _id: req.params.id, doctorId: req.user.id }, { $set: { notes: '' } }, { new: true });
        if (!consultation) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Notes cleared', consultation });
    } catch (err) {
        console.error('Delete Notes Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/doctor/consultations/:id/status
// @desc    Update consultation status
router.put('/consultations/:id/status', auth, doctorOnly, async(req, res) => {
    try {
        const { status } = req.body;
        const valid = ['upcoming', 'in-session', 'completed', 'cancelled', 'no-show'];
        if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
        const consultation = await Consultation.findOneAndUpdate({ _id: req.params.id, doctorId: req.user.id }, { $set: { status } }, { new: true });
        if (!consultation) return res.status(404).json({ message: 'Not found' });
        res.json(consultation);
    } catch (err) {
        console.error('Update Status Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/slots/:date
// @desc    Get slots for a specific date
router.get('/slots/:date', auth, doctorOnly, async(req, res) => {
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        const day = profile.dailySchedules.find(d => d.date === req.params.date);
        res.json(day ? day.slots : []);
    } catch (err) {
        console.error('Get Slots Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/doctor/slots
// @desc    Create a new slot for a date
router.post('/slots', auth, doctorOnly, async(req, res) => {
    try {
        const { date, startTime, endTime, duration, sessionType } = req.body;
        if (!date || !startTime || !endTime) return res.status(400).json({ message: 'date, startTime, endTime required' });
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        let day = profile.dailySchedules.find(d => d.date === date);
        if (!day) {
            profile.dailySchedules.push({ date, slots: [] });
            day = profile.dailySchedules[profile.dailySchedules.length - 1];
        }
        day.slots.push({
            startTime,
            endTime,
            duration: duration || 30,
            status: 'available',
            sessionType: sessionType || 'Video'
        });
        await profile.save();
        const refreshDay = profile.dailySchedules.find(d => d.date === date);
        const newSlot = refreshDay.slots[refreshDay.slots.length - 1];
        res.status(201).json(newSlot);
    } catch (err) {
        console.error('Create Slot Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/doctor/slots/:date/:slotId
// @desc    Permanently remove a slot
router.delete('/slots/:date/:slotId', auth, doctorOnly, async(req, res) => {
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        const day = profile.dailySchedules.find(d => d.date === req.params.date);
        if (!day) return res.status(404).json({ message: 'Date not found' });
        const slot = day.slots.id(req.params.slotId);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        if (slot.status === 'booked' || slot.status === 'in-progress') {
            return res.status(400).json({ message: 'Cannot delete an active slot' });
        }
        slot.deleteOne();
        await profile.save();
        res.json({ message: 'Slot deleted' });
    } catch (err) {
        console.error('Delete Slot Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/doctor/slots/:date/:slotId
// @desc    Update a slot (status, session type, time)
router.put('/slots/:date/:slotId', auth, doctorOnly, async(req, res) => {
    try {
        const { startTime, endTime, duration, sessionType, status } = req.body;
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        const day = profile.dailySchedules.find(d => d.date === req.params.date);
        if (!day) return res.status(404).json({ message: 'Date not found' });
        const slot = day.slots.id(req.params.slotId);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        if (startTime) slot.startTime = startTime;
        if (endTime) slot.endTime = endTime;
        if (duration) slot.duration = duration;
        if (sessionType) slot.sessionType = sessionType;
        if (status) slot.status = status;
        await profile.save();
        res.json(slot);
    } catch (err) {
        console.error('Update Slot Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/slots/search
// @desc    Search slots across dates
router.get('/slots/ops/search', auth, doctorOnly, async(req, res) => {
    try {
        const { from, to, status, sessionType } = req.query;
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        let results = [];
        for (const day of profile.dailySchedules) {
            if (from && day.date < from) continue;
            if (to && day.date > to) continue;
            for (const slot of day.slots) {
                if (status && slot.status !== status) continue;
                if (sessionType && slot.sessionType !== sessionType) continue;
                results.push({ date: day.date, ...slot.toObject() });
            }
        }
        res.json(results);
    } catch (err) {
        console.error('Search Slots Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/forms/ops/search
// @desc    Search clinical form templates
router.get('/forms/ops/search', auth, doctorOnly, async(req, res) => {
    try {
        const { q, active } = req.query;
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ forms: [] });
        let forms = profile.clinicalForms || [];
        if (active === 'true') forms = forms.filter(f => f.isActive);
        if (active === 'false') forms = forms.filter(f => !f.isActive);
        if (q) {
            const lower = q.toLowerCase();
            forms = forms.filter(f =>
                (f.title || '').toLowerCase().includes(lower) ||
                (f.description || '').toLowerCase().includes(lower)
            );
        }
        res.json({ forms, activeFormId: profile.activeFormId });
    } catch (err) {
        console.error('Search Forms Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/intake-reviews
// @desc    Get all patient intake form responses across consultations
router.get('/intake-reviews', auth, doctorOnly, async(req, res) => {
    try {
        const consultations = await Consultation.find({
                doctorId: req.user.id,
                'clinicalFormData.status': 'submitted'
            })
            .populate('patientId', 'displayName email')
            .sort({ scheduledTime: -1 });
        const reviews = consultations.map(c => ({
            consultationId: c._id,
            patient: c.patientId,
            scheduledTime: c.scheduledTime,
            sessionType: c.sessionType,
            status: c.status,
            formTitle: (c.clinicalFormData && c.clinicalFormData.title) ? c.clinicalFormData.title : 'Untitled',
            formStatus: c.clinicalFormData ? c.clinicalFormData.status : undefined,
            responses: c.clinicalFormData ? c.clinicalFormData.responses : undefined,
            fieldsSnapshot: c.clinicalFormData ? c.clinicalFormData.fieldsSnapshot : undefined,
            submittedAt: (c.clinicalFormData && c.clinicalFormData.submittedAt) ? c.clinicalFormData.submittedAt : ((c.clinicalFormData && c.clinicalFormData.filledAt) ? c.clinicalFormData.filledAt : undefined),
            basicInfo: c.clinicalFormData ? c.clinicalFormData.basicInfo : undefined
        }));
        res.json(reviews);
    } catch (err) {
        console.error('Intake Reviews Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/intake-reviews/search
// @desc    Search intake reviews
router.get('/intake-reviews/search', auth, doctorOnly, async(req, res) => {
    try {
        const { q, from, to } = req.query;
        let query = { doctorId: req.user.id, 'clinicalFormData.status': 'submitted' };
        if (from || to) {
            query.scheduledTime = {};
            if (from) query.scheduledTime.$gte = new Date(from);
            if (to) query.scheduledTime.$lte = new Date(to);
        }
        let consultations = await Consultation.find(query)
            .populate('patientId', 'displayName email')
            .sort({ scheduledTime: -1 });
        if (q) {
            const lower = q.toLowerCase();
            consultations = consultations.filter(c =>
                ((c.patientId && c.patientId.displayName) ? c.patientId.displayName : '').toLowerCase().includes(lower) ||
                ((c.clinicalFormData && c.clinicalFormData.title) ? c.clinicalFormData.title : '').toLowerCase().includes(lower) ||
                JSON.stringify(c.clinicalFormData && c.clinicalFormData.responses ? c.clinicalFormData.responses : {}).toLowerCase().includes(lower)
            );
        }
        const reviews = consultations.map(c => ({
            consultationId: c._id,
            patient: c.patientId,
            scheduledTime: c.scheduledTime,
            sessionType: c.sessionType,
            status: c.status,
            formTitle: (c.clinicalFormData && c.clinicalFormData.title) ? c.clinicalFormData.title : 'Untitled',
            formStatus: c.clinicalFormData ? c.clinicalFormData.status : undefined,
            responses: c.clinicalFormData ? c.clinicalFormData.responses : undefined,
            fieldsSnapshot: c.clinicalFormData ? c.clinicalFormData.fieldsSnapshot : undefined,
            submittedAt: (c.clinicalFormData && c.clinicalFormData.submittedAt) ? c.clinicalFormData.submittedAt : ((c.clinicalFormData && c.clinicalFormData.filledAt) ? c.clinicalFormData.filledAt : undefined),
            basicInfo: c.clinicalFormData ? c.clinicalFormData.basicInfo : undefined
        }));
        res.json(reviews);
    } catch (err) {
        console.error('Search Intake Reviews Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/doctor/intake-reviews/:consultationId
// @desc    Clear intake form data from a consultation
router.delete('/intake-reviews/:consultationId', auth, doctorOnly, async(req, res) => {
    try {
        const consultation = await Consultation.findOneAndUpdate({ _id: req.params.consultationId, doctorId: req.user.id }, { $set: { 'clinicalFormData.status': 'not-required', 'clinicalFormData.responses': null, 'clinicalFormData.submittedAt': null } }, { new: true });
        if (!consultation) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Intake form data cleared' });
    } catch (err) {
        console.error('Delete Intake Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/doctor/analytics
// @desc    Get comprehensive doctor analytics
router.get('/analytics', auth, doctorOnly, async(req, res) => {
    try {
        const profile = await DoctorProfile.findOne({ userId: req.user.id });
        const consultations = await Consultation.find({ doctorId: req.user.id });
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentConsultations = consultations.filter(c => new Date(c.scheduledTime) >= thirtyDaysAgo);

        // Consultation status breakdown
        const statusBreakdown = {};
        consultations.forEach(c => { statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1; });

        // Session type breakdown
        const sessionTypeBreakdown = {};
        consultations.forEach(c => { sessionTypeBreakdown[c.sessionType] = (sessionTypeBreakdown[c.sessionType] || 0) + 1; });

        // Monthly trend (last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const count = consultations.filter(c => {
                const cd = new Date(c.scheduledTime);
                return cd >= d && cd <= monthEnd;
            }).length;
            monthlyTrend.push({ month: d.toLocaleString('default', { month: 'short', year: 'numeric' }), count });
        }

        // Slot utilization
        let totalSlots = 0,
            bookedSlots = 0,
            completedSlots = 0;
        const schedules = (profile && profile.dailySchedules) ? profile.dailySchedules : [];
        schedules.forEach(day => {
            day.slots.forEach(slot => {
                totalSlots++;
                if (slot.status === 'booked') bookedSlots++;
                if (slot.status === 'completed') completedSlots++;
            });
        });

        // Form completion rate
        const withForm = consultations.filter(c => c.clinicalFormData && c.clinicalFormData.status === 'submitted').length;
        const formRate = consultations.length > 0 ? Math.round((withForm / consultations.length) * 100) : 0;

        // Average rating
        const rated = consultations.filter(c => c.rating);
        const avgRating = rated.length > 0 ? (rated.reduce((sum, c) => sum + c.rating, 0) / rated.length).toFixed(1) : 'N/A';

        res.json({
            totalConsultations: consultations.length,
            recentConsultations: recentConsultations.length,
            completedConsultations: consultations.filter(c => c.status === 'completed').length,
            cancelledRate: consultations.length > 0 ? Math.round((consultations.filter(c => c.status === 'cancelled').length / consultations.length) * 100) : 0,
            statusBreakdown,
            sessionTypeBreakdown,
            monthlyTrend,
            slotUtilization: { totalSlots, bookedSlots, completedSlots },
            formCompletionRate: formRate,
            avgRating,
            totalReviews: (profile && profile.reviews) ? profile.reviews.length : 0,
            totalPatients: new Set(consultations.map(c => c.patientId ? c.patientId.toString() : null).filter(Boolean)).size,
            formsCreated: (profile && profile.clinicalForms) ? profile.clinicalForms.length : 0
        });
    } catch (err) {
        console.error('Analytics Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;