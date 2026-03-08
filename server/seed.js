/**
 * Aura Seed Script — 100 Doctors + 15 Patients + 25-Day Activity + Chat History
 * Run: node server/seed.js
 * Safe to re-run: skips existing emails
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const DoctorProfile = require('./models/DoctorProfile');
const Journal = require('./models/Journal');
const ChatMessage = require('./models/ChatMessage');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/aura';

// ─────────────────────────────────────────────
// DATA BANK
// ─────────────────────────────────────────────

const SPECIALIZATIONS = [
    'Psychiatry', 'Clinical Psychology', 'Cognitive Behavioral Therapy',
    'Dialectical Behavior Therapy', 'Trauma & PTSD Therapy', 'Anxiety & Stress Management',
    'Depression & Mood Disorders', 'ADHD & Neurodiversity', 'Mindfulness-Based Therapy',
    'Couples & Relationship Therapy', 'Grief & Bereavement Counseling', 'Child & Adolescent Psychiatry',
    'Addiction & Recovery', 'Sleep Disorders', 'Eating Disorders & Body Image',
    'OCD & Intrusive Thoughts', 'Bipolar Disorder Specialist', 'Positive Psychology',
    'Existential Therapy', 'Somatic Experiencing'
];

const EDUCATIONS = [
    'MD, NIMHANS Bangalore', 'PhD Clinical Psychology, AIIMS Delhi', 'MPhil Psychiatry, CMC Vellore',
    'MD Psychiatry, KMC Manipal', 'MSc Mental Health, University of Edinburgh',
    'PhD Psychology, JNU New Delhi', 'MD, Grant Medical College Mumbai',
    'MSc Clinical Psychology, Christ University', 'MBBS + DPM, Osmania Medical College',
    'PsyD Clinical Psychology, MAHE Manipal', 'MRCPsych, Royal College of Psychiatrists UK',
    'PhD Neuropsychology, Hyderabad Central University', 'MD, Kasturba Medical College',
    'MSW + Counseling, TISS Mumbai', 'MA Counseling Psychology, Ambedkar University'
];

const FIRST_NAMES_F = [
    'Sanhitha', 'Ananya', 'Priya', 'Kavya', 'Divya', 'Meera', 'Nandita', 'Shreya',
    'Aishwarya', 'Rekha', 'Padma', 'Sunita', 'Asha', 'Lakshmi', 'Geeta',
    'Nalini', 'Sudha', 'Hema', 'Vidya', 'Ritu', 'Pooja', 'Swati', 'Neha',
    'Kiran', 'Anjali', 'Deepa', 'Radha', 'Sridevi', 'Bhavana', 'Chitra'
];

const FIRST_NAMES_M = [
    'Arjun', 'Vikram', 'Rohit', 'Karthik', 'Suresh', 'Rajan', 'Mohan', 'Prasad',
    'Venkat', 'Aditya', 'Sanjay', 'Ramesh', 'Girish', 'Harish', 'Naresh',
    'Mahesh', 'Rajesh', 'Ganesh', 'Dinesh', 'Suresh', 'Praveen', 'Naveen',
    'Santosh', 'Ashwin', 'Varun', 'Nikhil', 'Abhishek', 'Rahul', 'Deepak', 'Ajay',
    'Samuel', 'David', 'Emmanuel', 'John', 'Thomas', 'George', 'Felix', 'Aaron',
    'Cyrus', 'Irfan'
];

const LAST_NAMES = [
    'Reddy', 'Sharma', 'Patel', 'Kumar', 'Singh', 'Rao', 'Nair', 'Menon',
    'Iyer', 'Pillai', 'Bhat', 'Joshi', 'Verma', 'Gupta', 'Mishra',
    'Krishnan', 'Naidu', 'Choudhary', 'Agarwal', 'Srivastava', 'Pandey',
    'Chauhan', 'Malhotra', 'Kapoor', 'Mehta', 'Shah', 'Saxena', 'Bansal',
    'Nambiar', 'Varma', 'D\'Souza', 'Fernandes', 'Almeida', 'Rodrigues',
    'Khan', 'Ali', 'Hussain', 'Shaikh', 'Ansari', 'Siddiqui'
];

const BIO_TEMPLATES = [
    (name, spec, exp) => `Dr. ${name} is a dedicated ${spec} specialist with ${exp} years of clinical experience. Known for a compassionate, evidence-based approach, Dr. ${name} helps patients navigate complex emotional landscapes and build sustainable mental health habits.`,
    (name, spec, exp) => `With ${exp} years practicing ${spec}, Dr. ${name} brings a unique blend of traditional therapeutic wisdom and modern neuroscience. Trained at top institutions, Dr. ${name} has helped over ${300 + exp * 40} patients find lasting relief.`,
    (name, spec, exp) => `Dr. ${name} specializes in ${spec} and has ${exp}+ years of experience working with individuals, couples, and families. A firm believer in holistic healing, Dr. ${name} integrates mindfulness and somatic techniques with clinical therapy.`,
    (name, spec, exp) => `Passionate about destigmatizing mental health, Dr. ${name} has spent ${exp} years championing accessible ${spec} care. Published in leading journals and a sought-after speaker, Dr. ${name} brings expertise and empathy in equal measure.`,
    (name, spec, exp) => `Dr. ${name} founded their private practice in ${spec} after ${exp} years in public hospital systems. With direct experience treating acute, chronic, and complex mental health conditions, Dr. ${name} offers a safe, non-judgmental space for healing.`
];

const REVIEW_COMMENTS = [
    'Incredibly understanding and non-judgmental. Changed my perspective completely.',
    'Dr. {name} has a gift for making you feel heard. Best therapist I have ever seen.',
    'Professional, warm, and deeply knowledgeable. Highly recommend.',
    'I was skeptical about online therapy but {name} proved me wrong. Life-changing.',
    'The techniques Dr. {name} taught me work in real life. Finally managing my anxiety.',
    'Compassionate, thorough, and always available when it matters. 5 stars.',
    'Great listener with practical tools. My mood has improved significantly.',
    'Helped me work through trauma I had been avoiding for years. Truly grateful.',
    'Clear, structured sessions that actually produce results. Excellent doctor.',
    'Dr. {name} is the reason I am still here. Forever grateful.',
    'Patient, insightful, and professional. Could not ask for more.',
    'Transformed the way I think about my mental health. A true healer.',
    'Very methodical approach, explained everything clearly. Felt very supported.',
    'Has a deep understanding of trauma and recovery. Exceptional care.',
    'Sessions with Dr. {name} are the highlight of my week. Real progress being made.'
];

const PATIENT_FIRST = ['Sattar', 'Zara', 'Dev', 'Aisha', 'Rohan', 'Meena', 'Tarun', 'Nia', 'Kabir', 'Riya', 'Aman', 'Sana', 'Yash', 'Aditi', 'Om'];
const PATIENT_LAST = ['Sheikh', 'Mirza', 'Sharma', 'Patel', 'Malhotra', 'Kapoor', 'Verma', 'Bose', 'Jain', 'Gupta', 'Wren', 'Chen', 'Tanaka', 'Silva', 'Hassan'];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, d = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(d));
const padded = (n) => String(n).padStart(2, '0');

function getNextNDays(n) {
    const days = [];
    for (let i = 0; i < n; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push(`${d.getFullYear()}-${padded(d.getMonth() + 1)}-${padded(d.getDate())}`);
    }
    return days;
}

function buildSlots(sessionTypes = ['Video', 'Voice', 'Chat']) {
    const slotTimes = [
        ['09:00', '09:30'],
        ['09:30', '10:00'],
        ['10:00', '10:30'],
        ['10:30', '11:00'],
        ['11:00', '11:30'],
        ['14:00', '14:30'],
        ['14:30', '15:00'],
        ['15:00', '15:30'],
        ['15:30', '16:00'],
        ['16:30', '17:00'],
        ['17:00', '17:30'],
        ['18:00', '18:30']
    ];
    // Pick 4-8 slots per day
    const count = rand(4, 8);
    const chosen = slotTimes.sort(() => Math.random() - 0.5).slice(0, count);
    return chosen.map(([start, end]) => ({
        startTime: start,
        endTime: end,
        duration: 30,
        status: Math.random() > 0.3 ? 'available' : 'off',
        sessionType: pick(sessionTypes)
    }));
}

function buildClinicalForm(firstName) {
    return {
        title: `${firstName}'s Pre-Session Intake`,
        description: 'Please complete this form before your consultation. Your answers help us serve you better.',
        isActive: true,
        fields: [
            { key: 'chief_complaint', label: 'What brings you in today?', type: 'textarea', required: true, placeholder: 'Describe what you\'ve been experiencing...', helpText: 'Be as detailed as you\'re comfortable with.', options: [], order: 0 },
            { key: 'duration', label: 'How long have you been feeling this way?', type: 'select', required: true, options: ['Less than 2 weeks', '2-4 weeks', '1-3 months', '3-6 months', 'More than 6 months', 'Years'], order: 1 },
            { key: 'severity', label: 'Rate your current distress level (1 = minimal, 10 = severe)', type: 'number', required: true, min: 1, max: 10, placeholder: '1-10', order: 2 },
            { key: 'sleep_quality', label: 'How would you rate your sleep lately?', type: 'radio', required: false, options: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'], order: 3 },
            { key: 'prior_therapy', label: 'Have you had therapy before?', type: 'radio', required: true, options: ['Yes, currently', 'Yes, in the past', 'No, first time'], order: 4 },
            { key: 'medications', label: 'Are you currently on any psychiatric medications?', type: 'checkbox', required: false, placeholder: 'Check if yes', helpText: 'We will ask for details during the session.', options: [], order: 5 },
            { key: 'goals', label: 'What are your therapy goals?', type: 'multiselect', required: false, options: ['Reduce anxiety', 'Manage depression', 'Process trauma', 'Improve relationships', 'Build self-esteem', 'Develop coping tools', 'Understand diagnosis'], order: 6 },
            { key: 'emergency_contact', label: 'Emergency contact name & phone', type: 'text', required: false, placeholder: 'Name — Phone number', order: 7 }
        ]
    };
}

function buildReviews(firstName, count) {
    const reviewers = ['Priya M.', 'Rohan K.', 'Aisha S.', 'Dev T.', 'Zara N.', 'Felix R.', 'Meena P.', 'Sanjay V.', 'Nia B.', 'Kabir A.'];
    return Array.from({ length: count }, (_, i) => ({
        patientName: reviewers[i % reviewers.length],
        rating: randFloat(4.2, 5.0, 1),
        comment: pick(REVIEW_COMMENTS).replace(/{name}/g, firstName),
        date: new Date(Date.now() - rand(1, 180) * 24 * 60 * 60 * 1000)
    }));
}

// ─────────────────────────────────────────────
// JOURNAL ENTRIES — 25+ days of varied content
// ─────────────────────────────────────────────

const JOURNAL_ENTRIES = [
    { mood: 'happy', tags: ['gratitude', 'morning'], content: 'Woke up feeling genuinely light today. The sunlight through the window felt like a welcoming sign. Made myself a proper breakfast for the first time in weeks — eggs, toast, and chai. Small wins matter.', aiAnalysis: { mood: 'positive', score: 8, summary: 'Patient shows signs of improved morning routine and gratitude practice.', clinicalInsight: 'Behavioral activation through routine breakfast suggests recovery from anhedonia.', positiveReframing: 'You\'re rebuilding nourishing rituals — this is meaningful progress.', suggestions: ['Continue morning routine', 'Try adding 5-minute gratitude journaling'] } },
    { mood: 'anxious', tags: ['work', 'overthinking'], content: 'Presentation at work tomorrow and I can feel the dread crawling up my throat. Practiced the breathing exercise from the app 3 times. It helped a bit but the thoughts keep spiraling — what if I forget everything? What if they judge me?', aiAnalysis: { mood: 'anxious', score: 4, summary: 'Anticipatory anxiety about work performance. Patient is using coping tools.', clinicalInsight: 'Catastrophic thinking pattern about public speaking. Good sign that breathing exercises were attempted proactively.', positiveReframing: 'You reached for your tools before the crisis hit — that\'s growth.', suggestions: ['Preparation reduces uncertainty', 'Visualize success for 2 minutes', 'Use the 5-4-3-2-1 grounding technique'] } },
    { mood: 'sad', tags: ['loneliness', 'night'], content: 'The evening hit hard. Everyone on social media seems to have plans, people, places. Deleted Instagram for the night. Journaling here instead. I know comparison is the thief of joy but knowing doesn\'t stop the ache.', aiAnalysis: { mood: 'melancholic', score: 3, summary: 'Evening loneliness triggered by social media comparison.', clinicalInsight: 'Social comparison and evening rumination pattern. Positive that patient chose journaling over continued scrolling.', positiveReframing: 'Choosing to journal instead of doom-scroll is powerful self-awareness.', suggestions: ['Limit social media after 8pm', 'Reach out to one friend tomorrow', 'Evening wind-down routine'] } },
    { mood: 'calm', tags: ['meditation', 'progress'], content: 'Completed the loving kindness meditation from the Wellness Hub. Felt strange at first sending compassion to myself but by the end I was tearing up in a good way. Maybe I deserve kindness too.', aiAnalysis: { mood: 'hopeful', score: 7, summary: 'Breakthrough moment in self-compassion practice through metta meditation.', clinicalInsight: 'Self-compassion deficit is improving. Emotional release during meditation indicates therapeutic processing.', positiveReframing: 'You absolutely deserve kindness — and you\'re learning to give it to yourself.', suggestions: ['Practice metta meditation 3x/week', 'Write a compassion letter to yourself', 'Notice self-critical thoughts today'] } },
    { mood: 'angry', tags: ['family', 'boundaries'], content: 'Mom called again asking why I\'m not married yet. I set a boundary for the first time — told her the topic is off limits. She went silent. I feel guilty but also strangely proud. Boundaries are hard but necessary.', aiAnalysis: { mood: 'conflicted-but-empowered', score: 6, summary: 'First boundary-setting experience with family. Mixed emotions of guilt and empowerment.', clinicalInsight: 'Assertiveness skill development. Guilt after boundary-setting is normative and temporary.', positiveReframing: 'Setting that boundary took courage. Guilt is proof you care, not proof you were wrong.', suggestions: ['Journal about what boundaries mean to you', 'Practice "no" in low-stakes situations', 'Discuss family dynamics in next therapy session'] } },
    { mood: 'hopeful', tags: ['therapy', 'insight'], content: 'Had a session with Dr. Kavya today. We talked about my inner critic and she called it "the old security system" — it was trying to protect me but it\'s outdated. That metaphor clicked. I\'m not broken, I\'m updating.', aiAnalysis: { mood: 'insightful', score: 8, summary: 'Therapeutic breakthrough on inner critic reframing.', clinicalInsight: 'Cognitive reframing of self-criticism as outdated protective mechanism. Strong therapeutic alliance.', positiveReframing: 'You\'re not broken — you\'re evolving. What a powerful reframe.', suggestions: ['Notice when the "old system" activates', 'Thank it and choose a new response', 'Write down 3 ways you\'ve grown this year'] } },
    { mood: 'tired', tags: ['sleep', 'exhaustion'], content: 'Barely slept last night. Brain wouldn\'t turn off. Tried the body scan from UCLA MARC but fell asleep halfway through and then woke at 3am with my phone on my chest. Going to try the no-screens rule tonight.', aiAnalysis: { mood: 'fatigued', score: 4, summary: 'Sleep disruption with racing thoughts. Patient attempting evidence-based sleep hygiene.', clinicalInsight: 'Insomnia pattern with cognitive hyperarousal. Body scan partially effective — consider full protocol.', positiveReframing: 'Falling asleep during the body scan means it was working!', suggestions: ['No screens 1hr before bed', 'Keep a "worry dump" pad by bed', 'Cool dark room, consistent wake time'] } },
    { mood: 'grateful', tags: ['friendship', 'connection'], content: 'Met Rohan for coffee after avoiding plans for weeks. He didn\'t judge the gap. We laughed about stupid things and for 2 hours I forgot about everything heavy. Human connection is medicine.', aiAnalysis: { mood: 'warm', score: 9, summary: 'Social reconnection after period of withdrawal. Positive interpersonal experience.', clinicalInsight: 'Social withdrawal recovery. Patient experiencing natural mood lift from connection, reinforcing behavioral activation.', positiveReframing: 'You showed up despite resistance — and joy was waiting on the other side.', suggestions: ['Schedule one social activity per week', 'Text a friend right now', 'Reflect on what made this meetup easy'] } },
    { mood: 'neutral', tags: ['reflection', 'midweek'], content: 'Nothing dramatic happened today. Worked, ate, walked, breathed. And you know what? That\'s okay. Not every day needs to be a revelation. Sometimes "fine" is its own victory.', aiAnalysis: { mood: 'stable', score: 6, summary: 'Patient finding peace in ordinary days — sign of emotional regulation improvement.', clinicalInsight: 'Acceptance of neutral emotional states indicates reduced black-and-white thinking.', positiveReframing: 'A "fine" day means your baseline has risen. That\'s quiet progress.', suggestions: ['Celebrate neutral days', 'Practice mindful awareness during routine tasks', 'Notice what "fine" feels like in your body'] } },
    { mood: 'anxious', tags: ['health', 'worry'], content: 'Random chest pain sent me spiraling. Googled symptoms for an hour (I know, I know). Heart is fine — it\'s anxiety manifesting physically. Did the 3-minute breathing space from the MBSR section and it actually brought me back.', aiAnalysis: { mood: 'anxious', score: 4, summary: 'Somatic anxiety symptoms with health anxiety spiral. MBSR technique effective.', clinicalInsight: 'Health anxiety with cyberchondria pattern. Good that patient recognized somatic anxiety and used grounding.', positiveReframing: 'You caught the spiral AND used a tool to stop it. That\'s mastery in action.', suggestions: ['Ban health Googling — call a nurse line instead', 'Body scan to befriend physical sensations', 'Log anxiety triggers for pattern recognition'] } },
    { mood: 'happy', tags: ['achievement', 'growth'], content: 'Got through the whole presentation without a panic attack! Hands shook a little but I breathed through it. My manager said I did well. A year ago I would have called in sick. Progress isn\'t always linear but today it\'s real.', aiAnalysis: { mood: 'triumphant', score: 9, summary: 'Overcame anticipatory anxiety about work presentation. Significant progress marker.', clinicalInsight: 'Exposure success with managed anxiety response. Self-efficacy improving.', positiveReframing: 'From avoidance to achievement — look how far you\'ve come.', suggestions: ['Record this win in a "victory" list', 'Reward yourself today', 'Share the success with someone supportive'] } },
    { mood: 'sad', tags: ['grief', 'memory'], content: 'Dad\'s birthday today. He\'s been gone 3 years and it still hits like a truck every December. Made his chai recipe. Sat with the grief instead of running from it, like Dr. Kavya suggested. Painful but somehow respectful.', aiAnalysis: { mood: 'grieving', score: 3, summary: 'Grief anniversary reaction. Patient practicing acceptance of painful emotions.', clinicalInsight: 'Grief processing through ritualistic connection. Sitting with grief indicates healthy mourning capacity.', positiveReframing: 'Making his chai is honoring his memory. Grief is love with nowhere to go.', suggestions: ['Write a letter to your father', 'Allow space for sadness without judgment', 'Connect with a family member today'] } },
    { mood: 'motivated', tags: ['goals', 'planning'], content: 'Made a 30-day wellness plan: meditate 5 min daily, journal every evening, walk 20 min, limit social media to 30 min. Starting small. Not trying to be perfect, just consistent. The Atomic Habits approach.', aiAnalysis: { mood: 'motivated', score: 8, summary: 'Proactive wellness planning with realistic, incremental goals.', clinicalInsight: 'Good behavioral activation plan. Small achievable targets reduce all-or-nothing thinking.', positiveReframing: 'Consistency over intensity — you\'re setting yourself up for sustainable change.', suggestions: ['Track completion with simple checkmarks', 'Habit stack: meditate right after brushing teeth', 'Review and adjust plan weekly'] } },
    { mood: 'confused', tags: ['identity', 'existential'], content: 'Who am I without the anxiety? It\'s been a companion so long I don\'t know where it ends and I begin. Therapist says that\'s normal in recovery — mourning the old self even when it was unhealthy. Strange kind of grief.', aiAnalysis: { mood: 'reflective', score: 5, summary: 'Identity questioning during recovery — existential processing.', clinicalInsight: 'Identity reconstruction phase of recovery. Common in chronic anxiety patients. Needs normalization.', positiveReframing: 'The fact that you\'re asking this question means you\'re creating space for something new.', suggestions: ['Explore values independent of anxiety', 'Who would you be without fear?', 'Try one thing the anxious version of you wouldn\'t do'] } },
    { mood: 'calm', tags: ['nature', 'mindful-walk'], content: 'Did the mindful walking exercise from the MBSR workbook in the park. Felt the grass, heard the birds, noticed my feet on earth. For 10 minutes, my brain was quiet. Not numb — quiet. There\'s a difference and I finally get it.', aiAnalysis: { mood: 'serene', score: 8, summary: 'Mindful walking in nature producing genuine calm. Key therapeutic milestone.', clinicalInsight: 'Patient distinguishing between emotional numbing and genuine calm — a sign of increased interoceptive awareness.', positiveReframing: 'Quiet is not empty — it\'s full of peace. You touched something real today.', suggestions: ['Make nature walks weekly', 'Practice barefoot grounding', 'Journal about the quiet feeling to remember it'] } },
    { mood: 'frustrated', tags: ['setback', 'honesty'], content: 'Snapped at a colleague for no real reason today. The old me showing up again. Apologized immediately which is new but I\'m disappointed. Two steps forward, one step back. At least I\'m still moving forward, right?', aiAnalysis: { mood: 'self-aware', score: 5, summary: 'Emotional regulation setback but with immediate repair and self-reflection.', clinicalInsight: 'Interpersonal conflict with rapid repair indicates improved emotional intelligence despite regulation lapse.', positiveReframing: 'Apologizing immediately IS the growth. Old you wouldn\'t have even noticed.', suggestions: ['Identify the underlying trigger', 'Practice HALT: Hungry, Angry, Lonely, Tired?', 'Self-compassion, not self-punishment'] } },
    { mood: 'hopeful', tags: ['milestone', 'celebration'], content: '100 days since I started therapy. I can actually feel the difference — I still have bad days but they don\'t define weeks anymore. I have tools now. I have language for what I feel. That\'s everything.', aiAnalysis: { mood: 'empowered', score: 9, summary: '100-day therapy milestone. Patient demonstrating meta-awareness of progress.', clinicalInsight: 'Strong therapeutic gains. Meta-cognitive awareness of emotional tools and vocabulary development.', positiveReframing: 'You did the hardest thing — you showed up consistently. 100 days of choosing yourself.', suggestions: ['Write a letter to your day-1 self', 'Share progress with therapist', 'Set intentions for the next 100 days'] } },
    { mood: 'anxious', tags: ['social', 'event'], content: 'Invited to a party this weekend. My first instinct was to make up an excuse. But I said yes. Now the anxiety is here but I\'m going to sit with it. Courage isn\'t absence of fear, it\'s action despite it.', aiAnalysis: { mood: 'nervous-but-brave', score: 6, summary: 'Social anxiety exposure — patient choosing approach over avoidance.', clinicalInsight: 'Voluntary exposure to social situation despite anxiety. Demonstrates growing self-efficacy and distress tolerance.', positiveReframing: 'Saying yes when your brain screams no — that\'s courage in its purest form.', suggestions: ['Plan an early exit strategy for safety', 'Bring a grounding object (stone, bracelet)', 'Set a small goal: talk to 2 people'] } },
    { mood: 'peaceful', tags: ['evening', 'self-care'], content: 'Cooked dinner with music on, took a long shower, did 10 minutes of metta meditation, and now I\'m in bed journaling by lamplight. If healing has a feeling, this is it. Not perfect. Not ecstatic. Just... safe.', aiAnalysis: { mood: 'content', score: 9, summary: 'Rich self-care evening. Patient creating consistent nurturing routines.', clinicalInsight: 'Internalized self-care routine indicating strong recovery trajectory. Safety and contentment as markers of healing.', positiveReframing: 'You built this peaceful evening yourself. You are your own safe place now.', suggestions: ['Protect this evening routine', 'Name this feeling so you can find it again', 'You\'ve earned this rest'] } },
    { mood: 'melancholic', tags: ['rain', 'reflection'], content: 'Rainy day. Memories of childhood flooding in — playing in puddles, Amma\'s pakodas, the petrichor. Some nostalgia is warm, some is sharp. Today it\'s both. Wrote a poem about it. Poetry helps when prose can\'t hold the weight.', aiAnalysis: { mood: 'bittersweet', score: 5, summary: 'Nostalgia-triggered processing. Creative expression as coping mechanism.', clinicalInsight: 'Using poetry as emotional processing tool. Bittersweet affect indicates healthy relationship with complex emotions.', positiveReframing: 'Poetry is the language of the soul processing. You\'re turning pain into art.', suggestions: ['Keep writing poems', 'Share one with someone you trust', 'Revisit childhood memories mindfully'] } },
    { mood: 'happy', tags: ['surprise', 'kindness'], content: 'A stranger held the door open, smiled, and said "you look like you\'re having a good day." I wasn\'t, but after that I was. Tiny kindnesses ripple. Paid it forward and bought chai for the office intern.', aiAnalysis: { mood: 'uplifted', score: 8, summary: 'Positive social interaction creating upward emotional spiral.', clinicalInsight: 'Responsive to positive social cues and engaging in prosocial behavior. Emotional contagion functioning well.', positiveReframing: 'You didn\'t just receive kindness — you amplified it. That\'s who you are.', suggestions: ['Practice one random act of kindness daily', 'Notice small positive moments', 'Kindness to others is kindness to yourself'] } },
    { mood: 'scared', tags: ['vulnerability', 'opening-up'], content: 'Told Meena about my anxiety today. First friend I\'ve told. She hugged me and said "thank you for trusting me." I cried, which was embarrassing, but she said tears are just feelings escaping. I love her words.', aiAnalysis: { mood: 'vulnerable-brave', score: 7, summary: 'Disclosure of mental health struggles to friend. Strong social support received.', clinicalInsight: 'Social disclosure is a major therapeutic milestone. Positive reception reinforces help-seeking behavior.', positiveReframing: 'Vulnerability is not weakness — it\'s the birthplace of connection. You gave someone the gift of knowing the real you.', suggestions: ['Trust this friendship', 'Consider who else might be safe to share with', 'Notice how disclosure actually felt'] } },
    { mood: 'determined', tags: ['routine', 'discipline'], content: 'Day 14 of no alcohol. Brain fog is lifting, sleep is better, mornings are clearer. Not saying it\'s easy but the compound effect is real. Each day sober is a deposit in the bank of future me.', aiAnalysis: { mood: 'resolute', score: 8, summary: 'Two-week sobriety milestone. Noticing cognitive and sleep improvements.', clinicalInsight: 'Alcohol cessation showing expected improvements. Patient framing sobriety with healthy financial metaphor.', positiveReframing: '14 days of choosing yourself. The clarity you\'re feeling is your brain saying thank you.', suggestions: ['Celebrate this milestone', 'Plan for challenging social situations', 'Track sleep quality improvements'] } },
    { mood: 'neutral', tags: ['mundane', 'acceptance'], content: 'Laundry, groceries, cooking, cleaning. The unglamorous parts of being alive. But I did them all without the heavy resistance that used to paralyze me. Functional feels good when you remember what non-functional felt like.', aiAnalysis: { mood: 'functional', score: 7, summary: 'Completing daily tasks without resistance. Behavioral activation success.', clinicalInsight: 'ADL completion without resistance compared to previous periods of functional impairment. Major recovery indicator.', positiveReframing: 'Adulting when depression made it impossible is its own kind of hero story.', suggestions: ['Appreciate your ability to function', 'These small acts ARE your life being lived', 'Keep the momentum gentle and steady'] } },
    { mood: 'inspired', tags: ['reading', 'growth'], content: 'Started reading "The Body Keeps the Score" from the Wellness Hub book list. Chapter 3 hit me — my body has been keeping track of everything my mind tried to forget. Time to listen to it. Booked a yoga class for tomorrow.', aiAnalysis: { mood: 'awakened', score: 8, summary: 'Psychoeducation through reading leading to somatic awareness and action.', clinicalInsight: 'Self-directed psychoeducation catalyzing mind-body integration. Converting insight into action (yoga class).', positiveReframing: 'Your body has been your ally all along, waiting for you to tune in. Welcome home.', suggestions: ['Continue the book slowly — it can be activating', 'Gentle yoga, not power flow', 'Journal about body sensations after yoga'] } },
    { mood: 'mixed', tags: ['therapy', 'hard-session'], content: 'Therapy was rough today. We went into the childhood stuff. I dissociated briefly and Dr. Kavya brought me back with grounding. I hate that it still affects me. But she said healing isn\'t deleting the past, it\'s changing your relationship to it.', aiAnalysis: { mood: 'processing', score: 4, summary: 'Trauma processing session with brief dissociation. Grounding successful. Therapeutic reframe received.', clinicalInsight: 'Trauma activation with dissociative response managed in-session. Patient processing childhood events with clinical support.', positiveReframing: 'Going to the hard places with support is the definition of bravery. You didn\'t have to go alone this time.', suggestions: ['Extra self-care today and tomorrow', 'Grounding exercises before bed', 'Journaling about what came up when ready'] } },
];

// Chat conversation templates (user + assistant pairs)
const CHAT_CONVERSATIONS = [
    [
        { role: 'user', content: 'Hey Aurova, I\'m feeling really low today. Don\'t even know why.', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'I\'m here with you. Sometimes sadness arrives without a clear invitation — and that\'s okay. You don\'t need to justify how you feel. Can you tell me more about what your day has been like so far?', riskLevel: 'safe' },
        { role: 'user', content: 'Nothing happened really. Woke up, stared at the ceiling for 20 minutes, dragged myself to make tea. Everything feels gray.', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'That heavy, colorless feeling can be so exhausting. The fact that you made tea, even when everything felt gray, tells me there\'s a part of you still showing up. Would you like to try a gentle grounding exercise together, or would you rather just talk?', riskLevel: 'safe' },
        { role: 'user', content: 'Let\'s just talk for now.', riskLevel: 'safe' },
        { role: 'assistant', content: 'Of course. I\'m right here. Sometimes when we feel low without a clear reason, our body might be processing something beneath the surface — stress, fatigue, or emotions we haven\'t named yet. Has anything been sitting heavy lately, even if it seems small?', riskLevel: 'safe' },
    ],
    [
        { role: 'user', content: 'I had a panic attack at work today. In the bathroom. Nobody knows.', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'That sounds really frightening and isolating — having to manage something so intense alone while at work. I want you to know you\'re safe right now. How are you feeling in this moment?', riskLevel: 'safe' },
        { role: 'user', content: 'Better now but my hands are still shaking a little. I\'m scared it\'ll happen again tomorrow.', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'The anticipatory fear can sometimes feel worse than the panic itself. Let\'s start with where you are right now — can you press your feet flat on the ground and take one slow breath with me? In for 4... hold for 2... out for 6. Just one breath.', riskLevel: 'safe' },
        { role: 'user', content: 'Okay... done. That actually helps a little.', riskLevel: 'safe' },
        { role: 'assistant', content: 'Good. That\'s your anchor — you can come back to it anytime, anywhere. Panic attacks peak and pass within minutes. Having a plan can reduce the fear of the next one. Would you like to create a small "panic toolkit" we can work on together?', riskLevel: 'safe' },
    ],
    [
        { role: 'user', content: 'Can\'t sleep. It\'s 2am and my brain won\'t stop.', riskLevel: 'safe' },
        { role: 'assistant', content: 'Those 2am racing thoughts are the worst — your brain treating you like a problem to solve when all you need is rest. What\'s keeping your mind busy tonight?', riskLevel: 'safe' },
        { role: 'user', content: 'Replaying a conversation from work. I said something stupid in the meeting and now I\'m convinced everyone thinks I\'m an idiot.', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'Ah, the midnight replay machine. Here\'s something interesting: research shows that other people spend about 10% of the time thinking about our mistakes compared to how much WE think about them. That meeting moment has likely already faded from everyone else\'s memory.', riskLevel: 'safe' },
        { role: 'user', content: 'Logically I know that but my brain doesn\'t care about logic at 2am.', riskLevel: 'safe' },
        { role: 'assistant', content: 'Exactly right. At 2am your emotional brain (the amygdala) is in charge and your rational brain is half asleep. So let\'s speak its language: try putting your hand on your chest and saying "I did my best today. Tomorrow is new." Then try the body scan from the Wellness Hub — start at your toes and work up. Let sleep come.', riskLevel: 'safe' },
    ],
    [
        { role: 'user', content: 'I\'m thinking about whether therapy is actually helping or if I\'m just wasting money.', riskLevel: 'safe' },
        { role: 'assistant', content: 'That\'s a really honest and valid question to sit with. Questioning the process is actually part of the process. Can you tell me — are there moments, even small ones, where you\'ve noticed a difference since starting?', riskLevel: 'safe' },
        { role: 'user', content: 'I guess I react less explosively. And I actually journal now. But the big stuff — the anxiety, the sadness — is still there.', riskLevel: 'safe' },
        { role: 'assistant', content: 'So the volume has changed even if the song hasn\'t. Reacting less explosively and journaling consistently are actually significant changes — they mean your nervous system is rewiring. The "big stuff" often shifts gradually, like a tide going out. You might not see it day-to-day but over weeks, the waterline has moved.', riskLevel: 'safe' },
        { role: 'user', content: 'I like that metaphor. Okay, I\'ll give it more time.', riskLevel: 'safe' },
        { role: 'assistant', content: 'Good instinct. I\'d also suggest telling your therapist exactly what you told me — that you\'re questioning the process. Good therapists welcome that conversation, and it often leads to the most productive sessions.', riskLevel: 'safe' },
    ],
    [
        { role: 'user', content: 'I feel like I\'m faking being okay and nobody knows the real me.', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'That feeling of wearing a mask is exhausting — performing "okay" while something entirely different lives underneath. It takes enormous energy. How long have you been carrying this gap between inside and outside?', riskLevel: 'safe' },
        { role: 'user', content: 'Years. Since college maybe. I\'m the "strong friend" and everyone dumps their problems on me. Nobody asks how I am.', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'The strong friend paradox — the more capable you appear, the less support you receive. But here\'s the truth: strength isn\'t the absence of needing help. It\'s the courage to ask for it. What would happen if you let one person see that you\'re struggling?', riskLevel: 'safe' },
        { role: 'user', content: 'Terrifying thought. But I told Meena recently and she was amazing about it.', riskLevel: 'safe' },
        { role: 'assistant', content: 'That\'s a huge step. Meena\'s response — being "amazing about it" — is data that the world can hold your truth. You don\'t have to tell everyone. Just having one or two people who see the real you can transform how heavy the mask feels. You\'ve already started.', riskLevel: 'safe' },
    ],
    [
        { role: 'user', content: 'My mother keeps criticizing everything I do. I set a boundary today and now I feel terrible.', riskLevel: 'safe' },
        { role: 'assistant', content: 'Setting a boundary with a parent, especially one you love, can feel like betrayal — even when it\'s healthy. What boundary did you set, if you\'re comfortable sharing?', riskLevel: 'safe' },
        { role: 'user', content: 'Told her she can\'t comment on my weight anymore. She went silent and then said I\'m "too sensitive."', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'Classic invalidation response. When someone says "you\'re too sensitive," what they often mean is "your boundary is uncomfortable for me." Your sensitivity is not the problem — it\'s the data that told you something needed to change.', riskLevel: 'safe' },
        { role: 'user', content: 'That reframe actually helps. But I still feel guilty.', riskLevel: 'safe' },
        { role: 'assistant', content: 'Guilt after setting a boundary is almost universal — especially in cultures that emphasize family hierarchy. It doesn\'t mean you were wrong. Think of guilt as the transition tax between people-pleasing and self-honoring. It fades with practice. You did something brave today.', riskLevel: 'safe' },
    ],
    [
        { role: 'user', content: 'It\'s the anniversary of my dad\'s death. I don\'t know what to do with myself.', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'I\'m so sorry. Grief anniversaries reopen the wound in ways that can feel as raw as day one. There\'s no right way to get through today. What feels true for you right now — do you want to remember him, distract yourself, or just be present with whatever comes?', riskLevel: 'safe' },
        { role: 'user', content: 'I want to remember him. I made his chai recipe this morning.', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'Making his chai is such a beautiful act of love — you\'re keeping a piece of him alive through your hands, the aroma, the taste. Grief is love with nowhere to go, and rituals like this give it somewhere. What was he like?', riskLevel: 'safe' },
        { role: 'user', content: 'Quiet. Kind. He\'d read the newspaper every morning and save the comics for me even when I was 25. I miss that.', riskLevel: 'emotional_distress' },
        { role: 'assistant', content: 'What a tender detail — saving comics for his adult child. That\'s a man who expressed love through small, consistent acts. You carry that same quality, you know — showing up here, journaling, reaching out. Like father, like child. He would be proud of the person you\'re becoming.', riskLevel: 'safe' },
    ],
    [
        { role: 'user', content: 'I read that stress manifests physically and now I\'m noticing tension in my body everywhere. Is that normal?', riskLevel: 'safe' },
        { role: 'assistant', content: 'Yes, absolutely. Once you become aware of the mind-body connection, it\'s like discovering a hidden channel that was always broadcasting. Common areas: jaw (clenching), shoulders (carrying tension), stomach (butterflies, nausea), chest (tightness). Where do you notice it most?', riskLevel: 'safe' },
        { role: 'user', content: 'Definitely shoulders and jaw. I catch myself clenching all day.', riskLevel: 'safe' },
        { role: 'assistant', content: 'Jaw and shoulders are the body\'s stress filing cabinet. Try this right now: drop your shoulders away from your ears, unclench your jaw, and put the tip of your tongue on the roof of your mouth — it\'s physically impossible to clench when you do that.', riskLevel: 'safe' },
        { role: 'user', content: 'Whoa that actually works. My whole face relaxed.', riskLevel: 'safe' },
        { role: 'assistant', content: 'That\'s your body\'s reset button. Set a phone reminder every 2 hours: "shoulders down, jaw soft." Within a week, you\'ll start catching tension before it builds. The body keeps the score, but YOU get to update the scoreboard.', riskLevel: 'safe' },
    ],
];

// ─────────────────────────────────────────────
// MAIN SEED
// ─────────────────────────────────────────────

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI.replace(/\/\/.*@/, '//***@'));

    const DEMO_PASSWORD = await bcrypt.hash('Demo@1234', 10);
    let doctorsCreated = 0;
    let patientsCreated = 0;

    // ── 100 Doctors ──
    console.log('\n📋 Seeding 100 doctors...');

    const allFirstNames = [
        ...FIRST_NAMES_F.map(n => ({ name: n, gender: 'F' })),
        ...FIRST_NAMES_M.map(n => ({ name: n, gender: 'M' }))
    ];

    for (let i = 0; i < 100; i++) {
        const { name: firstName, gender } = allFirstNames[i % allFirstNames.length];
        const altFirst = firstName + (i >= allFirstNames.length ? `${Math.floor(i / allFirstNames.length) + 1}` : '');
        const lastName = LAST_NAMES[i % LAST_NAMES.length];
        const fullName = `Dr. ${altFirst} ${lastName}`;
        const email = `doctor${i + 1}@aura.com`;
        const spec = SPECIALIZATIONS[i % SPECIALIZATIONS.length];
        const exp = rand(3, 28);
        const numReviews = rand(3, 12);
        const reviews = buildReviews(altFirst, numReviews);
        const avgRating = parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1));
        const meetingsTaken = rand(exp * 20, exp * 80);

        try {
            // Upsert user
            let user = await User.findOne({ email });
            if (!user) {
                user = new User({ email, password: DEMO_PASSWORD, displayName: fullName, role: 'doctor' });
                user.password = DEMO_PASSWORD; // pre-hashed, bypass hook
                await User.collection.insertOne({
                    email,
                    password: DEMO_PASSWORD,
                    displayName: fullName,
                    role: 'doctor',
                    createdAt: new Date()
                });
                user = await User.findOne({ email });
            }

            // Skip if profile already exists
            const existing = await DoctorProfile.findOne({ userId: user._id });
            if (existing) { process.stdout.write('.'); continue; }

            const form = buildClinicalForm(altFirst);
            const formDoc = {...form, _id: new mongoose.Types.ObjectId() };

            const dailySchedules = getNextNDays(14).map(date => ({
                date,
                slots: buildSlots(['Video', 'Voice', 'Chat'])
            }));

            await DoctorProfile.create({
                userId: user._id,
                fullName,
                specialization: spec,
                licenseId: `AURA-${2020 + (i % 5)}-${String(10000 + i).padStart(5, '0')}`,
                experienceYears: exp,
                education: EDUCATIONS[i % EDUCATIONS.length],
                bio: BIO_TEMPLATES[i % BIO_TEMPLATES.length](altFirst, spec, exp),
                profileImage: gender === 'F' ?
                    `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=b6e3f4` : `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=d1d4f9`,
                dailySchedules,
                clinicalForms: [formDoc],
                activeFormId: formDoc._id,
                stats: {
                    amountEarned: meetingsTaken * rand(300, 800),
                    meetingsTaken,
                    hoursCommitted: Math.round(meetingsTaken * 0.75),
                    avgRating
                },
                reviews,
                isVerified: Math.random() > 0.15
            });

            doctorsCreated++;
            process.stdout.write(doctorsCreated % 10 === 0 ? `${doctorsCreated}` : '✓');
        } catch (err) {
            process.stdout.write(`✗`);
            if (process.env.SEED_VERBOSE) console.error(`\n  Error doctor ${i + 1}:`, err.message);
        }
    }

    console.log(`\n✅ Doctors created: ${doctorsCreated}`);

    // ── 15 Patients ──
    console.log('\n👤 Seeding 15 patients...');
    for (let i = 0; i < 15; i++) {
        const firstName = PATIENT_FIRST[i];
        const lastName = PATIENT_LAST[i];
        const email = `patient${i + 1}@aura.com`;
        try {
            const exists = await User.findOne({ email });
            if (!exists) {
                await User.collection.insertOne({
                    email,
                    password: DEMO_PASSWORD,
                    displayName: `${firstName} ${lastName}`,
                    role: 'user',
                    createdAt: new Date()
                });
                patientsCreated++;
                process.stdout.write('✓');
            } else {
                process.stdout.write('.');
            }
        } catch (err) {
            process.stdout.write('✗');
        }
    }
    console.log(`\n✅ Patients created: ${patientsCreated}`);

    // ── Demo Accounts (for Quick Login) ──
    console.log('\n🔑 Seeding demo accounts...');
    const demoAccounts = [
        { email: 'demo.doctor@aura.com', name: 'Dr. Demo Sanhitha', role: 'doctor' },
        { email: 'demo.patient@aura.com', name: 'Demo Patient', role: 'user' },
        { email: 'shadowdemo@anonymous.aura', name: 'Shadow Demo', role: 'anonymous' }
    ];

    for (const acc of demoAccounts) {
        try {
            const exists = await User.findOne({ email: acc.email });
            if (!exists) {
                await User.collection.insertOne({
                    email: acc.email,
                    password: DEMO_PASSWORD,
                    displayName: acc.name,
                    role: acc.role,
                    createdAt: new Date()
                });
                console.log(`  ✅ Created: ${acc.email}`);

                // Build demo doctor profile
                if (acc.role === 'doctor') {
                    const user = await User.findOne({ email: acc.email });
                    const form = buildClinicalForm('Demo');
                    const formDoc = {...form, _id: new mongoose.Types.ObjectId() };
                    await DoctorProfile.create({
                        userId: user._id,
                        fullName: acc.name,
                        specialization: 'Clinical Psychology',
                        licenseId: 'AURA-DEMO-00001',
                        experienceYears: 8,
                        education: 'PhD Clinical Psychology, AIIMS Delhi',
                        bio: 'Dr. Demo Sanhitha is your evaluation account for testing the Aura clinical platform. All features are available and functional.',
                        profileImage: 'https://api.dicebear.com/7.x/personas/svg?seed=DemoDoctor&backgroundColor=b6e3f4',
                        dailySchedules: getNextNDays(14).map(date => ({ date, slots: buildSlots() })),
                        clinicalForms: [formDoc],
                        activeFormId: formDoc._id,
                        stats: { meetingsTaken: 42, hoursCommitted: 31, amountEarned: 16800, avgRating: 4.9 },
                        reviews: buildReviews('Demo', 5),
                        isVerified: true
                    });
                    console.log('  ✅ Demo doctor profile created');
                }
            } else {
                console.log(`  ⏭ Already exists: ${acc.email}`);
            }
        } catch (err) {
            console.error(`  ✗ Error for ${acc.email}:`, err.message);
        }
    }

    // ── Seed Journal Entries (25+ days) for demo patient + first 5 patients ──
    console.log('\n📓 Seeding journal entries...');
    const journalTargets = ['demo.patient@aura.com', 'patient1@aura.com', 'patient2@aura.com', 'patient3@aura.com', 'patient4@aura.com', 'patient5@aura.com'];
    let journalsCreated = 0;

    for (const email of journalTargets) {
        const user = await User.findOne({ email });
        if (!user) { console.log(`  ⏭ ${email} not found`); continue; }

        // Skip if journals already exist for this user
        const existing = await Journal.countDocuments({ userId: user._id });
        if (existing >= 10) { console.log(`  ⏭ ${email} already has ${existing} journals`); continue; }

        // Generate 25 journal entries across 25 days
        const entries = JOURNAL_ENTRIES.map((entry, idx) => ({
            userId: user._id,
            content: entry.content,
            mood: entry.mood,
            tags: entry.tags,
            isPrivate: true,
            aiAnalysis: entry.aiAnalysis,
            createdAt: new Date(Date.now() - (JOURNAL_ENTRIES.length - idx) * 24 * 60 * 60 * 1000 + rand(0, 8) * 3600000)
        }));

        await Journal.insertMany(entries);
        journalsCreated += entries.length;
        console.log(`  ✅ ${email}: ${entries.length} journal entries`);
    }
    console.log(`✅ Total journal entries created: ${journalsCreated}`);

    // ── Seed Chat History (8 conversations) for demo patient + first 3 patients ──
    console.log('\n💬 Seeding chat messages...');
    const chatTargets = ['demo.patient@aura.com', 'patient1@aura.com', 'patient2@aura.com', 'patient3@aura.com'];
    let chatsCreated = 0;

    for (const email of chatTargets) {
        const user = await User.findOne({ email });
        if (!user) { console.log(`  ⏭ ${email} not found`); continue; }

        // Skip if chats already exist
        const existing = await ChatMessage.countDocuments({ userId: user._id });
        if (existing >= 20) { console.log(`  ⏭ ${email} already has ${existing} chat messages`); continue; }

        // Create multiple sessions with varied timestamps
        const conversations = CHAT_CONVERSATIONS.map((conv, convIdx) => {
            const sessionId = `seed-session-${user._id}-${convIdx + 1}`;
            const sessionStart = new Date(Date.now() - (CHAT_CONVERSATIONS.length - convIdx) * 2 * 24 * 60 * 60 * 1000);
            return conv.map((msg, msgIdx) => ({
                userId: user._id,
                role: msg.role === 'assistant' ? 'model' : msg.role,
                content: msg.content,
                sessionId,
                riskLevel: msg.riskLevel,
                createdAt: new Date(sessionStart.getTime() + msgIdx * 45000) // 45s between messages
            }));
        }).flat();

        await ChatMessage.insertMany(conversations);
        chatsCreated += conversations.length;
        console.log(`  ✅ ${email}: ${conversations.length} messages across ${CHAT_CONVERSATIONS.length} sessions`);
    }
    console.log(`✅ Total chat messages created: ${chatsCreated}`);

    // ── Summary ──
    const totalDoctors = await DoctorProfile.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalJournals = await Journal.countDocuments();
    const totalChats = await ChatMessage.countDocuments();
    console.log('\n─────────────────────────────────────');
    console.log(`📊 Total DoctorProfiles in DB: ${totalDoctors}`);
    console.log(`📊 Total Users in DB:          ${totalUsers}`);
    console.log(`📊 Total Journal Entries:       ${totalJournals}`);
    console.log(`📊 Total Chat Messages:         ${totalChats}`);
    console.log(`✅ Seed complete!`);
    console.log('\n📋 Patient credentials (password: Demo@1234):');
    for (let i = 1; i <= 5; i++) console.log(`   patient${i}@aura.com`);
    console.log('\n📋 Doctor credentials (password: Demo@1234):');
    for (let i = 1; i <= 3; i++) console.log(`   doctor${i}@aura.com`);
    console.log(`   demo.doctor@aura.com (Quick Login Demo)`);
    console.log('\n📋 Demo accounts (password: Demo@1234):');
    console.log('   demo.patient@aura.com  — 25+ days journals + 8 chat sessions');
    console.log('   demo.doctor@aura.com   — Full doctor profile + 14-day slots');
    console.log('   shadowdemo@anonymous.aura — Anonymous access');
    console.log('─────────────────────────────────────\n');

    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});