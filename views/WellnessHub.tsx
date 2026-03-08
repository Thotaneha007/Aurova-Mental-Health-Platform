
import React, { useEffect, useState, useMemo } from 'react';
import { AppView } from '../types';

interface Routine {
  title: string;
  duration: string;
  level: string;
  color: string;
  icon: string;
  desc: string;
  source?: string;
  sourceUrl?: string;
  steps: string[];
}

interface Book {
  title: string;
  author: string;
  tag: string;
  color: string;
  desc: string;
  summary: string;
  takeaways: string[];
  amazonUrl?: string;
}

interface WellnessHubProps {
  onBack: () => void;
  isLoggedIn: boolean;
  onNavigate?: (view: AppView) => void;
}

const COLORS = ['bg-card-yellow', 'bg-card-blue', 'bg-card-purple', 'bg-primary', 'bg-secondary', 'bg-aura-cream', 'bg-card-orange'];

const WellnessHub: React.FC<WellnessHubProps> = ({ onBack, isLoggedIn, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'movement' | 'books'>('movement');
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [bookCategory, setBookCategory] = useState<string>('All');
  const [bookSearch, setBookSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal-hub').forEach((el, i) => {
        setTimeout(() => el.classList.add('active'), i * 80);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab, activeRoutine, activeBook]);

  // ═══════════════════════════════════════════════════
  //  EXERCISES — WHO, UCLA MARC, UMass MBSR + Yoga
  // ═══════════════════════════════════════════════════

  const yogaRoutines: Routine[] = [
    // WHO "Doing What Matters in Times of Stress"
    {
      title: 'Grounding with 5 Senses',
      duration: '5 min', level: 'Beginner', color: 'bg-card-yellow', icon: 'self_improvement',
      desc: 'A WHO-recommended grounding exercise to anchor yourself when overwhelmed by stress or anxiety.',
      source: 'WHO — Doing What Matters in Times of Stress',
      sourceUrl: 'https://www.who.int/publications/i/item/9789240003927',
      steps: [
        "Sit or stand comfortably. Press your feet firmly into the ground and notice the sensation of contact.",
        "Look around slowly. Name 5 things you can SEE — notice colors, textures, shapes around you.",
        "Close your eyes. Name 4 things you can FEEL — the chair beneath you, fabric on your skin, the air temperature.",
        "Listen carefully. Name 3 things you can HEAR — a fan humming, distant traffic, your own breathing.",
        "Notice 2 things you can SMELL and 1 thing you can TASTE — even if subtle, like the air or last drink.",
        "Take 3 slow breaths. You are here. You are grounded. Open your eyes gently."
      ]
    },
    {
      title: 'Unhooking from Difficult Thoughts',
      duration: '8 min', level: 'All Levels', color: 'bg-card-blue', icon: 'psychology',
      desc: 'A WHO technique for noticing thoughts without being controlled by them — creating space between you and your worries.',
      source: 'WHO — Doing What Matters in Times of Stress',
      sourceUrl: 'https://www.who.int/publications/i/item/9789240003927',
      steps: [
        "Sit comfortably and close your eyes. Take three slow breaths to settle in.",
        "Notice a difficult thought that has been bothering you. Silently say: 'I am having the thought that\u2026' and name it.",
        "Now add: 'I notice that I am having the thought that\u2026' \u2014 feel how this creates distance.",
        "Imagine the thought as a cloud passing through the sky. You are the sky \u2014 vast and unchanging.",
        "If the thought hooks you again, gently repeat: 'I notice\u2026' No pushing away, just observing.",
        "Take two deep breaths. Thank yourself for practicing. Open your eyes."
      ]
    },
    {
      title: 'Acting on Your Values',
      duration: '10 min', level: 'All Levels', color: 'bg-card-purple', icon: 'favorite',
      desc: 'WHO values-guided exercise: reconnect with what truly matters and take one small meaningful step today.',
      source: 'WHO — Doing What Matters in Times of Stress',
      sourceUrl: 'https://www.who.int/publications/i/item/9789240003927',
      steps: [
        "Find a quiet place. Close your eyes and take 5 slow breaths to center yourself.",
        "Ask: 'What kind of person do I want to be?' Not achievements, but qualities \u2014 Kind? Brave? Creative?",
        "Choose ONE value that feels most alive right now. Hold it like a warm light.",
        "Ask: 'What tiny action can I take today guided by this value?' Even a text, a stretch, a genuine smile.",
        "Visualize yourself performing that action. Notice how it feels \u2014 even imagining is nourishing.",
        "Open your eyes and commit to doing it within the next hour."
      ]
    },
    {
      title: 'Making Room for Difficult Feelings',
      duration: '7 min', level: 'Beginner', color: 'bg-secondary', icon: 'spa',
      desc: 'WHO practice: instead of fighting painful emotions, learn to create space so they can pass naturally.',
      source: 'WHO — Doing What Matters in Times of Stress',
      sourceUrl: 'https://www.who.int/publications/i/item/9789240003927',
      steps: [
        "Sit comfortably with hands open on your lap. Breathe slowly for a minute.",
        "Name a mildly difficult emotion: 'I notice sadness' or 'I notice worry.'",
        "Locate where in your body you feel it. Place a hand gently there.",
        "Breathe INTO that area. Imagine your breath creating gentle space around the feeling.",
        "Say silently: 'I don\u2019t like this feeling, and that\u2019s okay. I can make room for it.'",
        "Notice if the feeling has shifted. Often it softens when we stop fighting it. Take a final deep breath."
      ]
    },

    // UCLA MARC Guided Meditations
    {
      title: 'Breathing Meditation',
      duration: '5 min', level: 'Beginner', color: 'bg-primary', icon: 'air',
      desc: 'UCLA MARC guided breathing meditation \u2014 anchor your awareness on the breath to cultivate calm.',
      source: 'UCLA MARC Guided Meditations',
      sourceUrl: 'https://www.uclahealth.org/programs/marc/free-guided-meditations',
      steps: [
        "Find a comfortable position. Let your eyes gently close.",
        "Notice the natural rhythm of your breath. Don\u2019t change it \u2014 just observe.",
        "Focus on sensations at your nostrils \u2014 cool air entering, warm air leaving.",
        "When your mind wanders, gently return attention to the breath without judgment.",
        "Deepen each breath: inhale 4 counts, pause 1, exhale 6 counts. Repeat 2 minutes.",
        "Release counting, return to natural breath. Sit quietly, then gently open your eyes."
      ]
    },
    {
      title: 'Body Scan for Sleep',
      duration: '12 min', level: 'All Levels', color: 'bg-card-blue', icon: 'bedtime',
      desc: 'UCLA-style progressive body scan to release tension and prepare for restful sleep.',
      source: 'UCLA MARC Guided Meditations',
      sourceUrl: 'https://www.uclahealth.org/programs/marc/free-guided-meditations',
      steps: [
        "Lie on your back, arms at sides, palms up. Close your eyes.",
        "FEET: Notice sensations \u2014 tingling, warmth, tension. Breathe into them and let go.",
        "LEGS: Tense calves, knees, thighs for 3 seconds, then release completely.",
        "ABDOMEN: Breathe deeply and feel your belly rise and fall like gentle waves.",
        "CHEST, SHOULDERS, ARMS: Let shoulders drop from ears. Feel arms sinking.",
        "JAW, FOREHEAD, EYES: Unclench jaw. Smooth brow. Let your whole body feel heavy.",
        "Rest in full-body awareness for 3 minutes. Each exhale takes you deeper."
      ]
    },
    {
      title: 'Loving Kindness Meditation',
      duration: '10 min', level: 'All Levels', color: 'bg-card-yellow', icon: 'volunteer_activism',
      desc: 'UCLA-inspired mett\u0101 practice: cultivate compassion for yourself and others.',
      source: 'UCLA MARC Guided Meditations',
      sourceUrl: 'https://www.uclahealth.org/programs/marc/free-guided-meditations',
      steps: [
        "Sit comfortably with eyes closed. Take 5 deep breaths.",
        "Think of someone you love. Silently offer: 'May you be happy. May you be healthy. May you be safe.'",
        "Direct those words to YOURSELF. Hand on heart: 'May I be happy. May I be healthy. May I be safe.'",
        "Think of a neutral person. Extend the same wishes to them.",
        "If able, bring to mind someone difficult: 'May you be happy. May you be healthy.'",
        "Expand to ALL beings: 'May all beings be happy. May all beings be free from suffering.'",
        "Sit with the warmth for a minute. When ready, open your eyes."
      ]
    },

    // UMass MBSR
    {
      title: 'Mindful Eating Raisin Exercise',
      duration: '10 min', level: 'Beginner', color: 'bg-card-purple', icon: 'restaurant',
      desc: 'Classic MBSR exercise by Jon Kabat-Zinn: use a raisin to practice deep mindful awareness.',
      source: 'UMass MBSR Workbook',
      sourceUrl: 'https://www.umassmed.edu/globalassets/center-for-mindfulness/documents/mbsr-workbook.pdf',
      steps: [
        "Take a single raisin. Hold it as if you\u2019ve never seen one before.",
        "LOOK: Observe color, shape, wrinkles, light reflections with curiosity.",
        "TOUCH: Roll between fingers. Smooth? Sticky? Temperature? Weight?",
        "SMELL: Hold under your nose. Breathe deeply. What aromas?",
        "TASTE: Place on tongue without chewing. Feel texture. Slowly begin to chew \u2014 one bite at a time.",
        "SWALLOW: Feel the impulse. Notice it traveling down. Sit with the aftertaste.",
        "Reflect: What was different? Mindful eating brings us back to the present."
      ]
    },
    {
      title: 'Sitting Meditation (MBSR)',
      duration: '15 min', level: 'Intermediate', color: 'bg-secondary', icon: 'self_improvement',
      desc: 'Formal MBSR sitting: systematic awareness of breath, body, sounds, and thoughts.',
      source: 'UMass MBSR Workbook',
      sourceUrl: 'https://www.umassmed.edu/globalassets/center-for-mindfulness/documents/mbsr-workbook.pdf',
      steps: [
        "Sit upright, feet flat, hands resting. Dignified but not rigid. Close eyes.",
        "BREATH (3 min): Full attention on breath at abdomen. Rising\u2026 falling\u2026 If thoughts arise, note 'thinking' and return.",
        "BODY (3 min): Expand attention to whole body. Sense weight, temperature, aliveness.",
        "SOUNDS (3 min): Open to sounds near and far. Receive without labeling.",
        "THOUGHTS (3 min): Observe thoughts like clouds. You are the sky.",
        "CHOICELESS (3 min): Let go of any focus. Rest in open awareness.",
        "Wiggle fingers and toes. Open eyes. Carry this awareness forward."
      ]
    },
    {
      title: 'Mindful Walking',
      duration: '10 min', level: 'All Levels', color: 'bg-card-yellow', icon: 'directions_walk',
      desc: 'MBSR walking meditation: transform a simple walk into deep present-moment awareness.',
      source: 'UMass MBSR Workbook',
      sourceUrl: 'https://www.umassmed.edu/globalassets/center-for-mindfulness/documents/mbsr-workbook.pdf',
      steps: [
        "Choose a short path (10\u201320 feet). Stand at one end. Feel the ground beneath you.",
        "Begin walking VERY slowly. Notice lifting\u2026 moving\u2026 placing each foot.",
        "Keep gaze soft, a few feet ahead. Don\u2019t look at feet \u2014 feel them.",
        "Notice: weight shift, muscles engaging, the moment of balance between steps.",
        "When mind wanders, stop. Breathe. Resume with full attention.",
        "After 5 min, gradually increase to normal pace with the same quality of attention.",
        "Stop at end. Stand 30 seconds. Notice how body and mind feel now vs. when you started."
      ]
    },
    {
      title: 'Three-Minute Breathing Space',
      duration: '3 min', level: 'Beginner', color: 'bg-primary', icon: 'hourglass_bottom',
      desc: 'MBSR micro-practice: a quick reset anywhere \u2014 desk, queue, or mid-crisis.',
      source: 'UMass MBSR Workbook',
      sourceUrl: 'https://www.umassmed.edu/globalassets/center-for-mindfulness/documents/mbsr-workbook.pdf',
      steps: [
        "MINUTE 1 \u2014 AWARENESS: Stop. Ask: 'What is my experience right now?' Notice thoughts, feelings, body sensations.",
        "MINUTE 2 \u2014 GATHERING: Narrow focus to breath at belly. Each in-breath and out-breath fully.",
        "MINUTE 3 \u2014 EXPANDING: Expand to whole body \u2014 posture, facial expression, hands. You are complete, breathing, here.",
        "Open your eyes. Carry this expanded awareness into whatever comes next."
      ]
    },

    // Original Yoga
    {
      title: 'Morning Aura Rise', duration: '15 min', level: 'Beginner', color: 'bg-card-yellow', icon: 'wb_sunny',
      desc: 'A gentle flow to awaken your senses and set a positive intention for the day.',
      steps: [
        "Find a quiet space and sit cross-legged. Close your eyes and take 3 deep breaths.",
        "Gently roll your neck in circles, letting go of any overnight tension.",
        "Transition to Cat-Cow on all fours to wake up your spine.",
        "Enter Child\u2019s Pose and focus on your heartbeat for 2 minutes.",
        "Slowly stand, reach for sky, exhale visualizing a bright aura around you."
      ]
    },
    {
      title: 'Sleepy Soul Flow', duration: '20 min', level: 'All Levels', color: 'bg-card-blue', icon: 'dark_mode',
      desc: 'Slower movements to calm the nervous system before rest.',
      steps: [
        "Dim lights. Sit and observe your breath without changing it.",
        "Legs against a wall (Viparita Karani) to drain the day\u2019s fatigue.",
        "Seated forward fold, reaching for toes with soft knees.",
        "On your back, hug knees to chest and rock gently side to side.",
        "Savasana \u2014 count backwards from 50 until completely heavy."
      ]
    },
    {
      title: 'Desk Release Yoga', duration: '5 min', level: 'Intermediate', color: 'bg-card-purple', icon: 'chair',
      desc: 'Targeted desk stretches for shoulders and neck. Perfect for mid-work breaks.',
      steps: [
        "Sit upright, feet flat on the floor.",
        "Clasp hands behind back, pull shoulders down and back.",
        "Seated spinal twist \u2014 30 seconds each shoulder.",
        "Interlace fingers, push palms to ceiling, arch slightly.",
        "Close eyes, 5 box breaths (Inhale 4, Hold 4, Exhale 4, Hold 4)."
      ]
    },
    {
      title: 'Vibrant Energy Flow', duration: '30 min', level: 'Advanced', color: 'bg-primary', icon: 'bolt',
      desc: 'A high-energy Vinyasa flow to build strength and clear mental fog.',
      steps: [
        "5 rounds of Sun Salutation A to build internal heat.",
        "Warrior II each side for 10 breaths, steady gaze.",
        "Balancing tree pose to center your focus.",
        "Plank 1 minute, then powerful Downward Dog.",
        "Seated meditation \u2014 visualize energy flowing like liquid light."
      ]
    },
  ];

  // ═══════════════════════════════════════════════════
  //  BOOKS — Full curated library with Amazon links
  // ═══════════════════════════════════════════════════

  const bookList: Book[] = [
    // CBT / Evidence-Based
    { title: 'Feeling Good: The New Mood Therapy', author: 'David D. Burns', tag: 'CBT / Evidence-Based', color: 'bg-card-yellow', desc: 'The classic that has helped millions overcome depression using CBT.', summary: 'Burns presents clinically proven techniques to lift your spirits and develop a positive outlook without drugs or lengthy therapy.', takeaways: ['Identify and correct cognitive distortions behind depression.', 'Develop self-esteem through realistic self-assessment.', 'Handle guilt, anger, and approval addiction.'], amazonUrl: 'https://www.amazon.com/dp/0380810336' },
    { title: 'Feeling Great', author: 'David D. Burns', tag: 'CBT / Evidence-Based', color: 'bg-card-blue', desc: 'The revolutionary sequel combining CBT with acceptance-based techniques.', summary: 'Introduces TEAM-CBT addressing resistance to change head-on for faster breakthroughs.', takeaways: ['Overcome resistance with paradoxical techniques.', 'Use the "magic dial" for ideal emotion levels.', 'Integrate acceptance with CBT.'], amazonUrl: 'https://www.amazon.com/dp/168373288X' },
    { title: 'The Feeling Good Handbook', author: 'David D. Burns', tag: 'CBT / Evidence-Based', color: 'bg-card-purple', desc: 'A comprehensive companion workbook for applying CBT day-to-day.', summary: 'Practical exercises and daily mood logs for anxiety, phobias, and relationship problems.', takeaways: ['Use the Daily Mood Log to track thought patterns.', 'Apply assertiveness skills for healthier communication.', 'Self-administer anxiety and depression assessments.'], amazonUrl: 'https://www.amazon.com/dp/0452281326' },
    { title: 'Mind Over Mood', author: 'Dennis Greenberger & Christine Padesky', tag: 'CBT / Evidence-Based', color: 'bg-secondary', desc: 'The go-to CBT workbook recommended by therapists worldwide.', summary: 'Step-by-step worksheets to change moods and thought patterns causing depression, anxiety, anger, guilt, and shame.', takeaways: ['Learn the situation-thought-mood connection.', 'Build core beliefs supporting mental health.', 'Track mood changes with evidence-based worksheets.'], amazonUrl: 'https://www.amazon.com/dp/1462520421' },
    { title: 'Cognitive Behavioral Therapy Made Simple', author: 'Seth J. Gillihan', tag: 'CBT / Evidence-Based', color: 'bg-card-yellow', desc: '10 strategies for managing anxiety, depression, and stress.', summary: 'A clear guide distilling CBT into thought records, behavioral activation, and exposure therapy.', takeaways: ['Apply the ABC model for emotional reactions.', 'Use behavioral activation for depression.', 'Practice graduated exposure for anxiety.'], amazonUrl: 'https://www.amazon.com/dp/1939754852' },
    { title: 'Retrain Your Brain', author: 'Seth J. Gillihan', tag: 'CBT / Evidence-Based', color: 'bg-primary', desc: 'Concrete CBT tools to transform your thinking patterns.', summary: 'Combines cognitive restructuring with mindfulness to rewire automatic negative thought patterns.', takeaways: ['Identify cognitive distortions in real-time.', 'Build a personalized restructuring plan.', 'Integrate mindfulness with CBT.'], amazonUrl: 'https://www.amazon.com/dp/1623157803' },
    { title: 'The Anxiety and Phobia Workbook', author: 'Edmund Bourne', tag: 'CBT / Evidence-Based', color: 'bg-card-blue', desc: 'The comprehensive guide to managing anxiety disorders \u2014 7th edition.', summary: 'Covers relaxation, cognitive restructuring, exposure therapy, nutrition, exercise, and medication.', takeaways: ['Progressive muscle relaxation and visualization.', 'Systematic desensitization for phobias.', 'Role of nutrition and exercise in anxiety.'], amazonUrl: 'https://www.amazon.com/dp/1684034833' },
    { title: 'The Worry Cure', author: 'Robert Leahy', tag: 'CBT / Evidence-Based', color: 'bg-card-purple', desc: 'Seven steps to stop worry from stopping you.', summary: 'Identifies seven worry types with targeted strategies from productive worry to existential rumination.', takeaways: ['Distinguish productive from toxic worry.', 'Challenge the belief that worrying keeps you safe.', 'Accept uncertainty as normal.'], amazonUrl: 'https://www.amazon.com/dp/1400097665' },
    { title: 'The CBT Toolbox', author: 'Jeff Riggenbach', tag: 'CBT / Evidence-Based', color: 'bg-secondary', desc: 'Clinical-grade CBT worksheets and exercises.', summary: '200+ pages of hands-on tools for anger, anxiety, depression, self-esteem, and personality patterns.', takeaways: ['Thought challenging worksheets daily.', 'Identify core beliefs driving patterns.', 'Behavioral experiments to test predictions.'], amazonUrl: 'https://www.amazon.com/dp/1936128306' },
    { title: 'The Depression Cure', author: 'Stephen Ilardi', tag: 'CBT / Evidence-Based', color: 'bg-card-yellow', desc: 'The 6-step program to beat depression without drugs.', summary: 'Therapeutic Lifestyle Change targeting brain chemistry through exercise, omega-3s, sleep, social connection, sunlight.', takeaways: ['Modern lifestyles fuel depression.', 'Implement a 6-element anti-depressant lifestyle.', 'Anti-rumination techniques break thought cycles.'], amazonUrl: 'https://www.amazon.com/dp/0738213888' },

    // Mindfulness & Meditation
    { title: 'The Mindful Way Through Depression', author: 'Mark Williams', tag: 'Mindfulness & Meditation', color: 'bg-card-blue', desc: 'Freeing yourself from chronic unhappiness using MBCT.', summary: 'Integrates mindfulness with cognitive therapy to break chronic depression by changing your relationship with thoughts.', takeaways: ['Recognize the rumination-depression spiral.', 'Practice the 3-minute breathing space.', 'Respond to warning signs with mindful awareness.'], amazonUrl: 'https://www.amazon.com/dp/1593851286' },
    { title: 'Wherever You Go There You Are', author: 'Jon Kabat-Zinn', tag: 'Mindfulness & Meditation', color: 'bg-card-purple', desc: 'Mindfulness meditation in everyday life \u2014 the accessible classic.', summary: 'Makes the case for wakefulness in daily life with simple but powerful meditations.', takeaways: ['The present moment is the only moment you have.', 'Non-doing is as important as doing.', 'Mindfulness is paying attention with intention.'], amazonUrl: 'https://www.amazon.com/dp/1401307787' },
    { title: 'Full Catastrophe Living', author: 'Jon Kabat-Zinn', tag: 'Mindfulness & Meditation', color: 'bg-primary', desc: 'The foundational MBSR textbook for stress, pain, and illness.', summary: 'The definitive guide to MBSR developed at UMass Medical Center, now used worldwide.', takeaways: ['Body scan, sitting meditation, and mindful yoga.', 'Cope with chronic pain and illness.', 'Integrate awareness into eating, walking, communication.'], amazonUrl: 'https://www.amazon.com/dp/0345536932' },
    { title: 'Mindfulness for Beginners', author: 'Jon Kabat-Zinn', tag: 'Mindfulness & Meditation', color: 'bg-secondary', desc: 'Reclaiming the present moment \u2014 and your life.', summary: 'Accessible introduction to mindfulness with guided practices for those who don\u2019t know where to start.', takeaways: ['You don\u2019t need to quiet the mind.', 'Awareness is itself healing.', 'Start with just 5 minutes daily.'], amazonUrl: 'https://www.amazon.com/dp/1622036670' },
    { title: '10% Happier', author: 'Dan Harris', tag: 'Mindfulness & Meditation', color: 'bg-card-yellow', desc: 'A skeptic\u2019s journey to meditation after an on-air panic attack.', summary: 'ABC News anchor makes the case for mindfulness for non-believers with humor and honesty.', takeaways: ['Meditation won\u2019t make you blissed out \u2014 10% happier.', 'The voice in your head is not you.', 'Respond, don\u2019t react.'], amazonUrl: 'https://www.amazon.com/dp/0062917609' },
    { title: 'The Miracle of Mindfulness', author: 'Thich Nhat Hanh', tag: 'Mindfulness & Meditation', color: 'bg-card-blue', desc: 'A manual on meditation from the beloved Zen master.', summary: 'Simple exercises from washing dishes to walking that transform routine activities into meditation.', takeaways: ['Wash the dishes to wash the dishes.', 'Breathing bridges life to consciousness.', 'Every act can be meditation.'], amazonUrl: 'https://www.amazon.com/dp/0807012394' },
    { title: 'Radical Acceptance', author: 'Tara Brach', tag: 'Mindfulness & Meditation', color: 'bg-card-purple', desc: 'Embracing your life with the heart of a Buddha.', summary: 'Combines Buddhist teachings with Western psychology to address the trance of unworthiness through radical self-acceptance.', takeaways: ['The trance of unworthiness keeps us stuck.', 'Acceptance is not resignation \u2014 it\u2019s a doorway.', 'RAIN: Recognize, Allow, Investigate, Nurture.'], amazonUrl: 'https://www.amazon.com/dp/0553380990' },
    { title: 'Self-Compassion', author: 'Kristin Neff', tag: 'Mindfulness & Meditation', color: 'bg-primary', desc: 'The proven power of being kind to yourself.', summary: 'Pioneers the science of self-compassion with exercises to replace self-criticism with warmth.', takeaways: ['Self-kindness, common humanity, mindfulness.', 'Self-compassion builds resilience, not indulgence.', 'Use the Self-Compassion Break in difficulty.'], amazonUrl: 'https://www.amazon.com/dp/0061733520' },
    { title: 'The Self-Compassion Workbook', author: 'Kristin Neff', tag: 'Mindfulness & Meditation', color: 'bg-card-yellow', desc: 'Practical exercises to transform your inner dialogue.', summary: 'A hands-on workbook with guided meditations, journaling prompts, and exercises for building self-compassion as a daily practice.', takeaways: ['Create a self-compassion mantra.', 'Journal with compassionate awareness.', 'Transform your inner critic into an inner ally.'], amazonUrl: 'https://www.amazon.com/dp/1462526780' },

    // Anxiety & Stress
    { title: 'Dare', author: 'Barry McDonagh', tag: 'Anxiety & Stress', color: 'bg-card-blue', desc: 'The new way to end anxiety and stop panic attacks fast.', summary: 'Instead of fighting anxiety, dare it \u2014 break the fear-of-fear cycle maintaining panic.', takeaways: ['Defuse: "So what?" and "Whatever."', 'Allow the anxiety wave to pass.', 'Run toward: dare anxiety to intensify \u2014 paradoxically it fades.'], amazonUrl: 'https://www.amazon.com/dp/0956596258' },
    { title: 'Hope and Help for Your Nerves', author: 'Claire Weekes', tag: 'Anxiety & Stress', color: 'bg-card-purple', desc: 'The pioneering guide to nervous illness \u2014 timeless since 1962.', summary: 'Four-step method \u2014 face, accept, float, let time pass \u2014 one of the most effective non-drug anxiety treatments.', takeaways: ['Face: don\u2019t run from fear.', 'Accept: let feelings exist without fighting.', 'Float: pass through sensations.'], amazonUrl: 'https://www.amazon.com/dp/0451167228' },
    { title: 'The Anxiety Toolkit', author: 'Alice Boyes', tag: 'Anxiety & Stress', color: 'bg-secondary', desc: 'Strategies for fine-tuning your mind and moving past stuck points.', summary: 'Evidence-based strategies for five anxiety subtypes with targeted exercises for each.', takeaways: ['Identify your anxiety profile.', 'Behavioral experiments for anxious predictions.', 'Implementation intentions for procrastination.'], amazonUrl: 'https://www.amazon.com/dp/0399169253' },
    { title: 'Rewire Your Anxious Brain', author: 'Catherine Pittman', tag: 'Anxiety & Stress', color: 'bg-card-yellow', desc: 'Neuroscience of fear to end anxiety, panic, and worry.', summary: 'Explains amygdala and cortex pathways creating anxiety with path-specific exercises.', takeaways: ['Amygdala anxiety: exposure-based strategies.', 'Cortex anxiety: thought monitoring.', 'Exercise and sleep calm the amygdala.'], amazonUrl: 'https://www.amazon.com/dp/1626251134' },
    { title: 'The Upside of Stress', author: 'Kelly McGonigal', tag: 'Anxiety & Stress', color: 'bg-primary', desc: 'Why stress is good for you and how to get better at it.', summary: 'Your attitude toward stress determines its impact \u2014 embracing stress makes you stronger.', takeaways: ['Stress response can fuel growth.', 'Changing mindset changes biology.', 'Seeing stress as enhancing improves performance.'], amazonUrl: 'https://www.amazon.com/dp/1101982934' },
    { title: 'Hardwiring Happiness', author: 'Rick Hanson', tag: 'Anxiety & Stress', color: 'bg-card-blue', desc: 'The new brain science of contentment, calm, and confidence.', summary: 'HEAL method for converting everyday positive experiences into lasting neural structures.', takeaways: ['The brain has a negativity bias \u2014 5:1 ratio needed.', 'Absorb positive experiences for 15+ seconds.', 'Link positive feelings to old wounds.'], amazonUrl: 'https://www.amazon.com/dp/0385347316' },
    { title: 'Why Zebras Don\u2019t Get Ulcers', author: 'Robert Sapolsky', tag: 'Anxiety & Stress', color: 'bg-card-purple', desc: 'The acclaimed guide to stress, stress-related disease, and coping.', summary: 'Stanford neuroscientist explains how chronic psychological stress differs from acute physical stress.', takeaways: ['Humans suffer chronic anticipatory stress.', 'Stress impairs memory, immunity, sleep.', 'Social support is the strongest stress buffer.'], amazonUrl: 'https://www.amazon.com/dp/0805073698' },
    { title: 'The Stress-Proof Brain', author: 'Melanie Greenberg', tag: 'Anxiety & Stress', color: 'bg-secondary', desc: 'Master your emotional response to stress using the power of mindfulness, neuroplasticity, and CBT.', summary: 'Neuroscience-informed strategies to rewire stress circuits and build emotional resilience.', takeaways: ['Stress circuits can be rewired.', 'Mindfulness changes brain structure.', 'Cognitive reappraisal reduces cortisol.'], amazonUrl: 'https://www.amazon.com/dp/1626252661' },

    // Depression & Healing
    { title: 'The Upward Spiral', author: 'Alex Korb', tag: 'Depression & Healing', color: 'bg-card-yellow', desc: 'Using neuroscience to reverse depression, one small change at a time.', summary: 'Small behavioral shifts create an upward spiral of positive neurotransmitter activity.', takeaways: ['Gratitude activates serotonin production.', 'Exercise matches medication for mild-moderate depression.', 'Making ANY decision activates the prefrontal cortex.'], amazonUrl: 'https://www.amazon.com/dp/1626251207' },
    { title: 'Lost Connections', author: 'Johann Hari', tag: 'Depression & Healing', color: 'bg-card-blue', desc: 'Uncovering the real causes of depression \u2014 and unexpected solutions.', summary: 'Nine causes of depression beyond brain chemistry \u2014 disconnection from work, nature, people, values.', takeaways: ['Depression is often a signal, not a malfunction.', 'Disconnection from community fuels depression.', 'Reconnection, not just medication, is essential.'], amazonUrl: 'https://www.amazon.com/dp/163286830X' },
    { title: 'The Noonday Demon', author: 'Andrew Solomon', tag: 'Depression & Healing', color: 'bg-card-purple', desc: 'An atlas of depression \u2014 National Book Award winner.', summary: 'Extraordinary exploration of depression in personal, cultural, medical, and political dimensions.', takeaways: ['Depression is the flaw in love.', 'Treatment works best combining medication and therapy.', 'Cross-cultural depression reveals universal themes.'], amazonUrl: 'https://www.amazon.com/dp/1501123882' },
    { title: 'I Want to Die but I Want to Eat Tteokbokki', author: 'Baek Se-hee', tag: 'Depression & Healing', color: 'bg-primary', desc: 'Honest conversations between a young woman and her psychiatrist.', summary: 'Candid dialogue-form memoir capturing the reality of persistent depressive disorder.', takeaways: ['Mental illness can coexist with functioning.', 'Self-awareness is the first step, not the solution.', 'Bad days don\u2019t erase progress.'], amazonUrl: 'https://www.amazon.com/dp/1526650475' },
    { title: 'I Had a Black Dog', author: 'Matthew Johnstone', tag: 'Depression & Healing', color: 'bg-secondary', desc: 'An illustrated journey through living with depression.', summary: 'Winston Churchill\u2019s metaphor brought to life \u2014 simple illustrations making the invisible visible.', takeaways: ['Naming depression gives you power.', 'Small daily actions keep the black dog in check.', 'Asking for help is strength.'], amazonUrl: 'https://www.amazon.com/dp/1845295897' },
    { title: 'Undoing Depression', author: 'Richard O\u2019Connor', tag: 'Depression & Healing', color: 'bg-card-yellow', desc: 'What therapy doesn\u2019t teach you and medication can\u2019t give you.', summary: 'Depression creates habits of thinking, feeling, and behaving that become ingrained \u2014 this book teaches how to undo them.', takeaways: ['Depression is a set of learned habits.', 'Challenge depressive patterns systematically.', 'Build an \"anti-depressant\" daily routine.'], amazonUrl: 'https://www.amazon.com/dp/0316043419' },

    // Trauma & Recovery
    { title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', tag: 'Trauma & Recovery', color: 'bg-primary', desc: 'Brain, mind, and body in the healing of trauma.', summary: 'Landmark work showing trauma reshapes brain and body; explores EMDR, yoga, neurofeedback, theater.', takeaways: ['Trauma imprints on body as much as mind.', 'Reclaiming body ownership is central.', 'Movement and sensory work heal like talk therapy.'], amazonUrl: 'https://www.amazon.com/dp/0143127748' },
    { title: 'Complex PTSD: From Surviving to Thriving', author: 'Pete Walker', tag: 'Trauma & Recovery', color: 'bg-card-yellow', desc: 'A guide for recovering from childhood trauma.', summary: 'Maps the four F responses (Fight, Flight, Freeze, Fawn) and provides a path from survival to thriving.', takeaways: ['Identify your dominant trauma response.', 'Emotional flashbacks are the hallmark of C-PTSD.', 'Develop an inner compassionate witness.'], amazonUrl: 'https://www.amazon.com/dp/1492871842' },
    { title: 'Trauma and Recovery', author: 'Judith Herman', tag: 'Trauma & Recovery', color: 'bg-card-blue', desc: 'The foundational text on psychological trauma.', summary: 'Connects the syndromes of war veterans with survivors of domestic violence, establishing a new framework for understanding trauma.', takeaways: ['Trauma disconnects and recovery reconnects.', 'Safety is the first stage of trauma recovery.', 'Bearing witness is therapeutic for survivor and listener.'], amazonUrl: 'https://www.amazon.com/dp/0465087302' },
    { title: 'It Didn\u2019t Start with You', author: 'Mark Wolynn', tag: 'Trauma & Recovery', color: 'bg-card-purple', desc: 'How inherited family trauma shapes who we are.', summary: 'Traumatic experiences can pass through generations; exercises to identify and break inherited patterns.', takeaways: ['Unexplained anxiety may have intergenerational roots.', 'Core language approach reveals family imprints.', 'Healing requires acknowledging what came before.'], amazonUrl: 'https://www.amazon.com/dp/1101980389' },
    { title: 'What Happened to You?', author: 'Oprah Winfrey & Bruce Perry', tag: 'Trauma & Recovery', color: 'bg-secondary', desc: 'Conversations on trauma, resilience, and healing.', summary: 'Shifting from "What\u2019s wrong with you?" to "What happened to you?" \u2014 a compassionate reframing.', takeaways: ['Behavior is adaptation to experience.', 'Early experiences shape the stress response.', 'Healing requires safe, regulated connections.'], amazonUrl: 'https://www.amazon.com/dp/1250223180' },
    { title: 'Running on Empty', author: 'Jonice Webb', tag: 'Trauma & Recovery', color: 'bg-card-yellow', desc: 'Overcome your childhood emotional neglect.', summary: 'Identifies Childhood Emotional Neglect \u2014 what DIDN\u2019T happen \u2014 and its pervasive effects.', takeaways: ['Emotional neglect is invisible but corrosive.', 'CEN makes you feel something is wrong but unnamed.', 'Learning to attend to your own emotions is the cure.'], amazonUrl: 'https://www.amazon.com/dp/161448242X' },
    { title: 'Running on Empty No More', author: 'Jonice Webb', tag: 'Trauma & Recovery', color: 'bg-card-blue', desc: 'Transform your relationships after emotional neglect.', summary: 'Extends CEN framework to show how emotional neglect affects relationships and how to repair connections.', takeaways: ['CEN affects every relationship you have.', 'Learning emotional vocabulary is foundational.', 'Both partners can heal when CEN is understood.'], amazonUrl: 'https://www.amazon.com/dp/161448607X' },
    { title: 'Waking the Tiger', author: 'Peter Levine', tag: 'Trauma & Recovery', color: 'bg-card-purple', desc: 'Healing trauma through the body\u2019s innate capacity.', summary: 'Levine\u2019s somatic experiencing approach shows how the body holds and can release traumatic energy.', takeaways: ['Animals in the wild don\u2019t get traumatized \u2014 they discharge the energy.', 'Trauma is stored in the body, not just the mind.', 'Titration: process trauma in small, manageable doses.'], amazonUrl: 'https://www.amazon.com/dp/155643233X' },
    { title: 'The Courage to Heal', author: 'Ellen Bass', tag: 'Trauma & Recovery', color: 'bg-primary', desc: 'A guide for survivors of child sexual abuse.', summary: 'The pioneering comprehensive guide for adult survivors of childhood sexual abuse, with exercises for each stage of healing.', takeaways: ['Believing yourself is the first step.', 'Healing happens in stages, not all at once.', 'You deserve to heal \u2014 it is never too late.'], amazonUrl: 'https://www.amazon.com/dp/0061284335' },

    // Resilience & Growth
    { title: 'Man\u2019s Search for Meaning', author: 'Viktor Frankl', tag: 'Resilience & Growth', color: 'bg-card-yellow', desc: 'Finding purpose in suffering \u2014 a Holocaust survivor\u2019s message.', summary: 'Logotherapy \u2014 the search for meaning \u2014 emerged from Nazi concentration camp experiences.', takeaways: ['He who has a why can bear almost any how.', 'We cannot avoid suffering but we can choose how to cope.', 'Meaning found in work, love, and courage.'], amazonUrl: 'https://www.amazon.com/dp/0807014273' },
    { title: 'The Gifts of Imperfection', author: 'Bren\u00e9 Brown', tag: 'Resilience & Growth', color: 'bg-card-blue', desc: 'Let go of who you think you\u2019re supposed to be.', summary: 'Shame resilience research leads to ten guideposts for wholehearted living.', takeaways: ['Owning our story is the bravest thing.', 'Vulnerability is the birthplace of joy.', 'Perfectionism is self-destructive.'], amazonUrl: 'https://www.amazon.com/dp/159285849X' },
    { title: 'Daring Greatly', author: 'Bren\u00e9 Brown', tag: 'Resilience & Growth', color: 'bg-card-purple', desc: 'How the courage to be vulnerable transforms how we live.', summary: 'Twelve years of research proving vulnerability is not weakness but our most accurate measure of courage.', takeaways: ['Vulnerability is the core of shame, fear \u2014 and joy, love, belonging.', 'Armor strategies protect but isolate.', 'Daring leadership requires showing up.'], amazonUrl: 'https://www.amazon.com/dp/1592408419' },
    { title: 'Rising Strong', author: 'Bren\u00e9 Brown', tag: 'Resilience & Growth', color: 'bg-primary', desc: 'The reckoning, the rumble, the revolution of getting back up.', summary: 'A three-step process for recovering from setbacks: reckon with emotions, rumble with the story, revolutionize how you live.', takeaways: ['The most dangerous stories are the ones we tell ourselves.', 'Get curious about what you\u2019re feeling.', 'Choose how your story ends.'], amazonUrl: 'https://www.amazon.com/dp/0812985818' },
    { title: 'Emotional Agility', author: 'Susan David', tag: 'Resilience & Growth', color: 'bg-secondary', desc: 'Get unstuck, embrace change, and thrive.', summary: 'Unhook from difficult emotions, live your values, make powerful shifts in mindset and habits.', takeaways: ['Emotions are data, not directives.', 'Show up: face emotions with curiosity.', 'Walk your why: align actions with values.'], amazonUrl: 'https://www.amazon.com/dp/1592409490' },
    { title: 'Flourish', author: 'Martin Seligman', tag: 'Resilience & Growth', color: 'bg-card-yellow', desc: 'A visionary understanding of happiness and well-being.', summary: 'Positive psychology\u2019s father moves beyond happiness to PERMA model.', takeaways: ['Well-being has five elements (PERMA).', 'Character strengths are the gateway.', 'Post-traumatic growth is as common as PTSD.'], amazonUrl: 'https://www.amazon.com/dp/1439190763' },
    { title: 'Learned Optimism', author: 'Martin Seligman', tag: 'Resilience & Growth', color: 'bg-card-blue', desc: 'How to change your mind and your life.', summary: 'Seligman\u2019s research shows optimism can be learned, changing how you handle setbacks, health, and relationships.', takeaways: ['Explanatory style determines resilience.', 'Pessimism is learned \u2014 and can be unlearned.', 'The ABCDE model for disputing negative beliefs.'], amazonUrl: 'https://www.amazon.com/dp/1400078393' },
    { title: 'Option B', author: 'Sheryl Sandberg', tag: 'Resilience & Growth', color: 'bg-card-purple', desc: 'Facing adversity, building resilience, and finding joy.', summary: 'After the sudden death of her husband, Sandberg explores the science of recovery with psychologist Adam Grant.', takeaways: ['Resilience is not fixed \u2014 it can be built.', 'The three Ps: personalization, pervasiveness, permanence.', 'Post-traumatic growth begins with small steps.'], amazonUrl: 'https://www.amazon.com/dp/1524732680' },

    // Habits & Lifestyle
    { title: 'Atomic Habits', author: 'James Clear', tag: 'Habits & Lifestyle', color: 'bg-card-yellow', desc: 'Tiny changes, remarkable results.', summary: 'The compound effect of small decisions \u2014 design good habits, break bad ones.', takeaways: ['Systems over goals.', 'Make it obvious, attractive, easy, satisfying.', 'Habits embody your identity.'], amazonUrl: 'https://www.amazon.com/dp/0735211299' },
    { title: 'Tiny Habits', author: 'BJ Fogg', tag: 'Habits & Lifestyle', color: 'bg-card-blue', desc: 'The small changes that change everything.', summary: 'Anchor tiny behaviors to existing habits and celebrate immediately.', takeaways: ['After [existing habit], I will [tiny behavior].', 'Emotions create habits, not repetition.', 'Celebration wires in new habits.'], amazonUrl: 'https://www.amazon.com/dp/0358003326' },
    { title: 'The Power of Habit', author: 'Charles Duhigg', tag: 'Habits & Lifestyle', color: 'bg-card-purple', desc: 'Why we do what we do in life and business.', summary: 'Explores the science of habit loops \u2014 cue, routine, reward \u2014 and how to change them for personal and organizational transformation.', takeaways: ['Every habit has a cue, routine, and reward.', 'Keystone habits trigger cascades of change.', 'Change the routine, keep the cue and reward.'], amazonUrl: 'https://www.amazon.com/dp/081298160X' },
    { title: 'The Happiness Advantage', author: 'Shawn Achor', tag: 'Habits & Lifestyle', color: 'bg-primary', desc: 'How a positive brain fuels success.', summary: 'Happiness fuels success (not vice versa) with seven actionable principles.', takeaways: ['Happiness is a work ethic.', '20-second rule: make good habits easier.', 'Social investment is the best predictor.'], amazonUrl: 'https://www.amazon.com/dp/0307591557' },
    { title: 'The How of Happiness', author: 'Sonja Lyubomirsky', tag: 'Habits & Lifestyle', color: 'bg-secondary', desc: 'A scientific approach to getting the life you want.', summary: 'Research showing 40% of happiness is within our control, with 12 evidence-based strategies to increase it.', takeaways: ['50% genetics, 10% circumstances, 40% intentional activity.', 'Gratitude and kindness are proven happiness boosters.', 'Variety is essential \u2014 hedonic adaptation is real.'], amazonUrl: 'https://www.amazon.com/dp/0143114956' },
    { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', tag: 'Habits & Lifestyle', color: 'bg-card-yellow', desc: 'A counterintuitive approach to living a good life.', summary: 'Choose what matters, struggle better, accept life\u2019s negatives rather than fighting them.', takeaways: ['Not giving a f*ck means choosing what matters.', 'Pain is inevitable; suffering is a choice of values.', 'Inaction is also a choice.'], amazonUrl: 'https://www.amazon.com/dp/0062457713' },
    { title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', tag: 'Habits & Lifestyle', color: 'bg-card-blue', desc: 'Powerful lessons in personal change.', summary: 'Covey\u2019s principle-centered approach to solving personal and professional problems through character ethics.', takeaways: ['Be proactive: choose your response.', 'Begin with the end in mind.', 'Seek first to understand, then to be understood.'], amazonUrl: 'https://www.amazon.com/dp/1982137274' },
    { title: 'The Four Agreements', author: 'Don Miguel Ruiz', tag: 'Habits & Lifestyle', color: 'bg-card-purple', desc: 'A practical guide to personal freedom.', summary: 'Ancient Toltec wisdom distilled into four agreements that transform life when consistently practiced.', takeaways: ['Be impeccable with your word.', 'Don\u2019t take anything personally.', 'Don\u2019t make assumptions; always do your best.'], amazonUrl: 'https://www.amazon.com/dp/1878424319' },

    // Memoirs
    { title: 'Maybe You Should Talk to Someone', author: 'Lori Gottlieb', tag: 'Memoirs', color: 'bg-card-yellow', desc: 'A therapist, her therapist, and the human condition.', summary: 'Tells the story of her own therapy alongside patients\u2019, illuminating the courage to face ourselves.', takeaways: ['Therapists need therapy too.', 'Change begins with one honest conversation.', 'We are all more similar than different.'], amazonUrl: 'https://www.amazon.com/dp/1328662055' },
    { title: 'Reasons to Stay Alive', author: 'Matt Haig', tag: 'Memoirs', color: 'bg-card-blue', desc: 'A beautiful, honest account of surviving depression.', summary: 'Haig\u2019s breakdown at 24 and the slow path back \u2014 memoir, lists, facts, and tender encouragement.', takeaways: ['Depression lies \u2014 it says nothing gets better. It\u2019s wrong.', 'Reading itself can be therapeutic.', 'You don\u2019t have to be positive \u2014 just alive.'], amazonUrl: 'https://www.amazon.com/dp/0143128728' },
    { title: 'Notes on a Nervous Planet', author: 'Matt Haig', tag: 'Memoirs', color: 'bg-card-purple', desc: 'How to feel less anxious in a world designed to make us more so.', summary: 'Haig explores how modern life \u2014 social media, news, consumerism \u2014 amplifies anxiety and offers countermeasures.', takeaways: ['The world is designed to make you anxious.', 'Disconnecting is not laziness \u2014 it\u2019s self-preservation.', 'Boredom can be beautiful.'], amazonUrl: 'https://www.amazon.com/dp/0143133438' },
    { title: 'Furiously Happy', author: 'Jenny Lawson', tag: 'Memoirs', color: 'bg-primary', desc: 'A funny book about horrible things.', summary: 'Weaponizing humor against mental illness \u2014 being "furiously happy" to fight the darkness.', takeaways: ['Laughing at horrible things reduces their power.', 'Being broken doesn\u2019t mean you can\u2019t be brilliant.', 'Community and honesty are antidotes to shame.'], amazonUrl: 'https://www.amazon.com/dp/1250077028' },
    { title: 'An Unquiet Mind', author: 'Kay Redfield Jamison', tag: 'Memoirs', color: 'bg-secondary', desc: 'A memoir of moods and madness by a leading bipolar expert.', summary: 'Johns Hopkins professor writes about her own bipolar disorder with unflinching honesty.', takeaways: ['Bipolar can coexist with professional success.', 'Medication compliance is hardest and most essential.', 'Accepting help is survival.'], amazonUrl: 'https://www.amazon.com/dp/0679763309' },
    { title: 'Darkness Visible', author: 'William Styron', tag: 'Memoirs', color: 'bg-card-yellow', desc: 'A memoir of madness \u2014 a slim, devastating masterpiece.', summary: 'Styron\u2019s account of his descent into and emergence from suicidal depression, written with literary brilliance.', takeaways: ['Depression\u2019s pain is unimaginable to those who haven\u2019t suffered it.', 'True despair is beyond tears.', 'Recovery is possible even from the deepest abyss.'], amazonUrl: 'https://www.amazon.com/dp/0679736395' },
    { title: 'Girl, Interrupted', author: 'Susanna Kaysen', tag: 'Memoirs', color: 'bg-card-blue', desc: 'A memoir of mental illness and institutionalization.', summary: 'Kaysen\u2019s two years in a psychiatric hospital after being diagnosed with borderline personality disorder at 18.', takeaways: ['The line between sanity and insanity is thin.', 'Institutional power shapes identity.', 'Recovery means creating your own definition of normal.'], amazonUrl: 'https://www.amazon.com/dp/0679746048' },

    // Workbooks
    { title: 'The DBT Skills Workbook', author: 'Matthew McKay', tag: 'Workbooks', color: 'bg-card-purple', desc: 'Practical DBT for mindfulness, distress tolerance, and emotion regulation.', summary: 'Best-selling DBT workbook covering all four skill modules.', takeaways: ['TIPP skills for crisis moments.', 'Opposite action: do the opposite of emotion urges.', 'DEAR MAN for assertive communication.'], amazonUrl: 'https://www.amazon.com/dp/1572245131' },
    { title: 'The Happiness Trap', author: 'Russ Harris', tag: 'Workbooks', color: 'bg-card-yellow', desc: 'Stop struggling and start living using ACT.', summary: 'Acceptance and Commitment Therapy through defusion, values clarification, and committed action.', takeaways: ['Happiness is not absence of negative feelings.', 'Defusion: thoughts are words, not facts.', 'Values-guided action creates meaning even with pain.'], amazonUrl: 'https://www.amazon.com/dp/1590305841' },
    { title: 'The Confidence Gap', author: 'Russ Harris', tag: 'Workbooks', color: 'bg-card-blue', desc: 'A guide to overcoming fear and self-doubt with ACT.', summary: 'Confidence follows action, not the other way around.', takeaways: ['Confidence is not absence of fear.', 'Actions of confidence come first; feelings follow.', 'Defuse from the "not good enough" story.'], amazonUrl: 'https://www.amazon.com/dp/1590309235' },
    { title: 'The Acceptance and Commitment Therapy Workbook', author: 'Russ Harris', tag: 'Workbooks', color: 'bg-card-purple', desc: 'Get out of your mind and into your life.', summary: 'Practical ACT exercises for psychological flexibility, values-driven living, and defusion from painful thoughts.', takeaways: ['Psychological flexibility is the key to mental health.', 'Willingness to experience discomfort opens opportunities.', 'Clarify values, then take committed action.'], amazonUrl: 'https://www.amazon.com/dp/1572244259' },
    { title: 'The Self-Esteem Workbook', author: 'Glenn Schiraldi', tag: 'Workbooks', color: 'bg-primary', desc: 'Proven techniques for building healthy self-worth.', summary: 'Step-by-step exercises to evaluate, improve, and maintain healthy self-esteem using CBT and positive psychology.', takeaways: ['Self-esteem is a skill that can be developed.', 'Challenge core beliefs about unworthiness.', 'Daily practices build lasting self-worth.'], amazonUrl: 'https://www.amazon.com/dp/1626255938' },

    // Positive Psychology
    { title: 'The Art of Happiness', author: 'Dalai Lama', tag: 'Positive Psychology', color: 'bg-card-yellow', desc: 'A handbook for living \u2014 conversations with the Dalai Lama.', summary: 'Exploring sources of everyday happiness through intimate conversations with a psychiatrist.', takeaways: ['The purpose of life is happiness \u2014 it can be cultivated.', 'Compassion creates inner peace.', 'Shifting mental attitude reduces suffering.'], amazonUrl: 'https://www.amazon.com/dp/1573227544' },
    { title: 'Stumbling on Happiness', author: 'Daniel Gilbert', tag: 'Positive Psychology', color: 'bg-card-blue', desc: 'Why we\u2019re bad at predicting what will make us happy.', summary: 'Harvard psychologist reveals systematic mistakes our brains make about future happiness.', takeaways: ['Our "psychological immune system" rationalizes outcomes.', 'We overestimate the impact of future events.', 'Asking experienced people is more reliable than imagining.'], amazonUrl: 'https://www.amazon.com/dp/1400077427' },
    { title: 'The Happiness Hypothesis', author: 'Jonathan Haidt', tag: 'Positive Psychology', color: 'bg-card-purple', desc: 'Finding modern truth in ancient wisdom.', summary: 'Tests ancient wisdom from Plato to Buddha against modern research on happiness and virtue.', takeaways: ['Mind is like a rider on an elephant.', 'We need love AND adversity to grow.', 'Happiness comes from the right balance of connections.'], amazonUrl: 'https://www.amazon.com/dp/0465028020' },
    { title: 'The Little Book of Hygge', author: 'Meik Wiking', tag: 'Positive Psychology', color: 'bg-secondary', desc: 'Danish secrets to happy living.', summary: 'Wiking, CEO of the Happiness Research Institute, reveals the Danish concept of hygge \u2014 coziness, togetherness, and well-being.', takeaways: ['Hygge is about atmosphere, presence, and pleasure.', 'Candles, comfort, and connection create well-being.', 'Small daily rituals compound into happiness.'], amazonUrl: 'https://www.amazon.com/dp/0062658808' },
  ];

  const bookCategories = useMemo(() => {
    const cats = new Set(['All']);
    bookList.forEach(b => cats.add(b.tag));
    return Array.from(cats);
  }, []);

  const filteredBooks = useMemo(() => {
    return bookList.filter(b => {
      const matchCat = bookCategory === 'All' || b.tag === bookCategory;
      const matchSearch = !bookSearch || b.title.toLowerCase().includes(bookSearch.toLowerCase()) || b.author.toLowerCase().includes(bookSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [bookCategory, bookSearch]);

  const handleStartRoutine = (routine: Routine) => { setActiveRoutine(routine); setCurrentStep(0); };
  const handleOpenBook = (book: Book) => { setActiveBook(book); };

  // ═════ ROUTINE DETAIL VIEW ═════
  if (activeRoutine) {
    return (
      <div className="pt-24 pb-40 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen">
        <button onClick={() => setActiveRoutine(null)} className="flex items-center gap-2 mb-10 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors group">
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">close</span> Exit Routine
        </button>
        <div className="reveal-hub reveal bg-white dark:bg-card-dark border-2 border-black rounded-[4rem] shadow-brutalist overflow-hidden flex flex-col items-center text-center p-12 lg:p-20">
          <div className={`w-24 h-24 ${activeRoutine.color} border-2 border-black rounded-3xl flex items-center justify-center mb-10 shadow-brutalist-sm animate-bounce`}>
            <span className="material-symbols-outlined text-black text-4xl">{activeRoutine.icon}</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-2">{activeRoutine.title}</h2>
          {activeRoutine.source && (
            <a href={activeRoutine.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline mb-4 no-underline">
              Source: {activeRoutine.source}
            </a>
          )}
          <p className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-12">Step {currentStep + 1} of {activeRoutine.steps.length}</p>
          <div className="min-h-[200px] flex items-center justify-center mb-16 px-4">
            <p className="text-2xl md:text-3xl font-display leading-relaxed italic animate-in fade-in slide-in-from-bottom-4 duration-700">
              &ldquo;{activeRoutine.steps[currentStep]}&rdquo;
            </p>
          </div>
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            <button onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} disabled={currentStep === 0}
              className="w-full sm:w-auto px-10 py-5 border-2 border-black rounded-2xl font-bold uppercase text-xs tracking-widest transition-all disabled:opacity-20 shadow-brutalist-sm hover:bg-gray-50 active:translate-y-1">
              Previous
            </button>
            {currentStep < activeRoutine.steps.length - 1 ? (
              <button onClick={() => setCurrentStep(prev => prev + 1)}
                className="w-full sm:w-auto px-16 py-5 bg-primary text-white border-2 border-black rounded-2xl font-bold uppercase text-xs tracking-widest shadow-retro-white hover:scale-105 active:translate-y-1 transition-all">
                Next Step
              </button>
            ) : (
              <button onClick={() => setActiveRoutine(null)}
                className="w-full sm:w-auto px-16 py-5 bg-black text-white border-2 border-black rounded-2xl font-bold uppercase text-xs tracking-widest shadow-retro-white hover:scale-105 active:translate-y-1 transition-all">
                Complete Flow
              </button>
            )}
          </div>
          <div className="mt-16 w-full max-w-xs bg-gray-100 dark:bg-white/5 h-2 rounded-full overflow-hidden border border-black/10">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${((currentStep + 1) / activeRoutine.steps.length) * 100}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  // ═════ BOOK DETAIL VIEW ═════
  if (activeBook) {
    return (
      <div className="pt-24 pb-40 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen">
        <button onClick={() => setActiveBook(null)} className="flex items-center gap-2 mb-10 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors group">
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span> Back to Library
        </button>
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 reveal-hub reveal">
            <div className={`aspect-[3/4] ${activeBook.color} border-2 border-black rounded-tr-[5rem] rounded-bl-[2rem] p-12 shadow-brutalist flex flex-col justify-end relative overflow-hidden`}>
              <div className="absolute top-10 left-10 opacity-20"><span className="material-symbols-outlined text-8xl">auto_stories</span></div>
              <h2 className="text-5xl font-display font-bold text-black leading-tight mb-4">{activeBook.title}</h2>
              <p className="text-xl font-bold text-gray-700 uppercase tracking-tight">{activeBook.author}</p>
              <div className="absolute top-0 right-0 w-4 h-full bg-black/5"></div>
            </div>
          </div>
          <div className="lg:col-span-7 space-y-12 reveal-hub reveal [transition-delay:150ms]">
            <header>
              <span className="text-xs font-bold text-primary uppercase tracking-[0.4em] mb-4 block">{activeBook.tag}</span>
              <h3 className="text-4xl font-display font-bold dark:text-white italic">Mindful Insight</h3>
            </header>
            <section className="bg-white dark:bg-card-dark border-2 border-black p-8 rounded-[3rem] shadow-brutalist-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">The Essence</h4>
              <p className="text-xl leading-relaxed text-gray-800 dark:text-gray-200">{activeBook.summary}</p>
            </section>
            <section className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Key Aura Takeaways</h4>
              <ul className="space-y-6">
                {activeBook.takeaways.map((point, idx) => (
                  <li key={idx} className="flex gap-4 items-start bg-aura-cream dark:bg-white/5 p-6 rounded-2xl border border-black/5">
                    <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0 border border-primary/20">
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                    </span>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300 italic">&ldquo;{point}&rdquo;</p>
                  </li>
                ))}
              </ul>
            </section>
            <div className="pt-8 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recommended for</p>
                <p className="text-sm font-bold text-black dark:text-white mt-1">{activeBook.tag}</p>
              </div>
              {activeBook.amazonUrl && (
                <a href={activeBook.amazonUrl} target="_blank" rel="noopener noreferrer"
                  className="px-12 py-5 bg-primary text-white border-2 border-black rounded-2xl font-bold uppercase text-xs tracking-widest shadow-retro-white hover:scale-105 active:translate-y-1 transition-all inline-block text-center no-underline">
                  Buy on Amazon
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═════ MAIN HUB ═════
  return (
    <div className="pt-24 pb-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen">
      <header className="mb-10 reveal-hub reveal">
        <button onClick={onBack} className="flex items-center gap-2 mb-5 text-sm font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors active:translate-y-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Dashboard
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-display font-bold dark:text-white leading-tight">The <span className="text-primary italic">Soul Hub.</span></h1>
          <div className="flex bg-white dark:bg-card-dark border-2 border-black rounded-2xl p-1 shadow-brutalist-sm shrink-0">
            <button onClick={() => setActiveTab('movement')} className={`px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === 'movement' ? 'bg-primary text-white shadow-retro' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}>
              Exercises
            </button>
            <button onClick={() => setActiveTab('books')} className={`px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === 'books' ? 'bg-primary text-white shadow-retro' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}>
              Library ({bookList.length})
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mt-3 leading-relaxed">
          Evidence-based exercises from WHO, UCLA MARC &amp; UMass MBSR, plus {bookList.length}+ curated mental health books with Amazon links.
        </p>
      </header>

      {onNavigate && (
        <div className="mb-10 reveal-hub reveal">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary">assignment</span>
            <h2 className="text-sm font-bold uppercase tracking-widest dark:text-white">My Wellness Tracking</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Wellness Profile', sub: 'Master Form', icon: 'psychology_alt', color: 'bg-card-yellow', view: AppView.WELLNESS_PREFERENCE },
              { label: 'Mood Tracker', sub: 'Transaction', icon: 'mood', color: 'bg-card-blue', view: AppView.MOOD_TRACKER },
              { label: 'Breathwork Log', sub: 'Transaction', icon: 'air', color: 'bg-card-purple', view: AppView.BREATHWORK_LOG },
              { label: 'Routine Progress', sub: 'Transaction', icon: 'fitness_center', color: 'bg-card-yellow', view: AppView.ROUTINE_PROGRESS },
            ].map(f => (
              <button key={f.label} onClick={() => onNavigate(f.view)}
                className={`${f.color} border-2 border-black rounded-2xl p-5 shadow-retro hover:shadow-brutalist transition-all text-left group active:translate-y-1`}>
                <span className="material-symbols-outlined text-2xl text-black mb-2 block group-hover:scale-110 transition-transform">{f.icon}</span>
                <p className="font-bold text-black text-sm leading-tight">{f.label}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 mt-0.5">{f.sub}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'movement' ? (
        <div>
          <div className="flex flex-wrap gap-2 mb-8 reveal-hub reveal">
            <a href="https://www.who.int/publications/i/item/9789240003927" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-black rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-brutalist-sm hover:-translate-y-0.5 transition-all no-underline text-black">
              <span className="material-symbols-outlined text-sm text-blue-500">public</span> WHO Stress Guide
            </a>
            <a href="https://www.uclahealth.org/programs/marc/free-guided-meditations" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-black rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-brutalist-sm hover:-translate-y-0.5 transition-all no-underline text-black">
              <span className="material-symbols-outlined text-sm text-purple-500">self_improvement</span> UCLA MARC
            </a>
            <a href="https://www.umassmed.edu/globalassets/center-for-mindfulness/documents/mbsr-workbook.pdf" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-black rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-brutalist-sm hover:-translate-y-0.5 transition-all no-underline text-black">
              <span className="material-symbols-outlined text-sm text-green-600">psychology</span> UMass MBSR
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {yogaRoutines.map((routine, i) => (
              <div key={routine.title}
                className="reveal-hub reveal bg-white dark:bg-card-dark border-2 border-black rounded-[3rem] p-8 shadow-brutalist hover:shadow-brutalist-hover hover:-translate-y-2 transition-all group flex flex-col"
                style={{ transitionDelay: `${i * 60}ms` }}>
                <div className={`w-14 h-14 ${routine.color} border-2 border-black rounded-2xl flex items-center justify-center mb-4 shadow-brutalist-sm group-hover:rotate-12 transition-transform`}>
                  <span className="material-symbols-outlined text-black">{routine.icon}</span>
                </div>
                <h3 className="text-xl font-display font-bold mb-1 group-hover:text-primary transition-colors leading-tight">{routine.title}</h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{routine.duration}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{routine.level}</span>
                </div>
                {routine.source && <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mb-2 block">{routine.source.split(' — ')[0]}</span>}
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic mb-6 flex-grow line-clamp-3">&ldquo;{routine.desc}&rdquo;</p>
                <button onClick={() => handleStartRoutine(routine)}
                  className="w-full py-3 bg-black text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-retro-white hover:scale-105 active:translate-y-1 transition-all">
                  Start Practice
                </button>
              </div>
            ))}
          </div>
          <div className="mt-10 reveal-hub reveal bg-aura-black p-10 rounded-[3rem] border-2 border-primary/30 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative group">
            <div className="relative z-10">
              <h4 className="text-3xl font-display font-bold text-white mb-2">Aura Recommended</h4>
              <p className="text-gray-400 mb-8 italic">Based on your mood, try the 3-minute breathing space \u2014 a quick reset anywhere.</p>
              <button onClick={() => handleStartRoutine(yogaRoutines.find(r => r.title === 'Three-Minute Breathing Space') || yogaRoutines[0])}
                className="px-10 py-4 bg-primary text-white border-2 border-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-retro-white">
                Begin Breathwork
              </button>
            </div>
            <span className="material-symbols-outlined text-[10rem] text-primary/10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform">air</span>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-8 space-y-4 reveal-hub reveal">
            <div className="relative h-12 max-w-md">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-black/20 text-xl">search</span>
              <input type="text" placeholder="Search books or authors..." value={bookSearch} onChange={e => setBookSearch(e.target.value)}
                className="w-full h-full bg-aura-cream border-2 border-black rounded-2xl pl-12 pr-4 font-bold text-sm focus:border-primary transition-all" />
            </div>
            <div className="flex flex-wrap gap-2">
              {bookCategories.map(cat => (
                <button key={cat} onClick={() => setBookCategory(cat)}
                  className={`px-5 py-2 rounded-xl border-2 font-bold text-[9px] uppercase tracking-widest transition-all ${bookCategory === cat ? 'bg-black text-white border-black shadow-retro scale-105' : 'bg-white border-black/10 hover:border-black'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 font-bold">{filteredBooks.length} books</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {filteredBooks.map((book, i) => (
              <div key={book.title} className="reveal-hub reveal flex flex-col group cursor-pointer" style={{ transitionDelay: `${i * 40}ms` }} onClick={() => handleOpenBook(book)}>
                <div className={`aspect-[3/4] ${book.color} border-2 border-black rounded-tr-[3rem] rounded-bl-[1rem] p-6 shadow-brutalist group-hover:shadow-brutalist-hover group-hover:-translate-y-2 group-hover:-rotate-1 transition-all flex flex-col justify-end relative overflow-hidden mb-4`}>
                  <div className="absolute top-4 left-4 opacity-10 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-3xl">auto_stories</span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-black leading-tight mb-1">{book.title}</h3>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{book.author}</p>
                  <div className="absolute top-0 right-0 w-2 h-full bg-black/5"></div>
                </div>
                <div className="px-1">
                  <span className="text-[8px] font-bold text-primary uppercase tracking-widest mb-0.5 block">{book.tag}</span>
                  <p className="text-[10px] text-gray-500 line-clamp-2 italic">&ldquo;{book.desc}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-20 reveal-hub reveal bg-aura-cream dark:bg-white/5 p-10 rounded-[4rem] border-2 border-black shadow-brutalist flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-5xl text-primary mb-4">self_care</span>
        <h4 className="text-2xl font-display font-bold dark:text-white mb-2 italic">Mindful consistency is key.</h4>
        <p className="text-sm text-gray-500 max-w-xl mx-auto">Wellness is a marathon, not a sprint. Take your time with these resources &mdash; they are here whenever you need a retreat.</p>
      </div>
    </div>
  );
};

export default WellnessHub;
