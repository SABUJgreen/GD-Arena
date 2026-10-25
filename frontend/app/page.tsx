'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Brain,
  ChevronDown,
  ChevronRight,
  Clock3,
  LockKeyhole,
  LogOut,
  Mail,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Eye,
  EyeOff,
  Send,
  Zap,
  AlertCircle,
  Play,
  ArrowLeft,
  Grid,
  ListFilter,
  X,
  Scale,
  Mic,
  MicOff,
  CheckCircle2,
  Award,
  BookOpen,
  Shuffle,
  Flame,
  HelpCircle,
  Compass,
  Lightbulb,
  Check,
  Square
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { ThemeToggle } from './theme-toggle';

const Results = dynamic(() => import('./results'), { ssr: false });

type Screen = 'auth' | 'home' | 'setup' | 'briefing' | 'discussion' | 'results';
type Message = { speaker: string; role: string; content: string; round: number; timestamp?: string };

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Approachable & personality-rich personas
const people = [
  {
    name: 'Analytical',
    roleTitle: 'The Data Detective',
    tag: 'Grounds arguments with metrics & logic',
    color: '#2563eb',
    gradient: 'from-blue-600 to-cyan-500',
    bgLight: 'bg-blue-50/90 dark:bg-blue-950/40',
    borderLight: 'border-blue-200 dark:border-blue-800/60',
    textLight: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    glow: 'rgba(37, 99, 235, 0.18)',
    avatarEmoji: '📊',
    quoteStyle: 'border-l-blue-500'
  },
  {
    name: 'Challenger',
    roleTitle: "The Devil's Advocate",
    tag: 'Respectfully questions assumptions & trade-offs',
    color: '#e11d48',
    gradient: 'from-rose-500 to-pink-500',
    bgLight: 'bg-rose-50/90 dark:bg-rose-950/40',
    borderLight: 'border-rose-200 dark:border-rose-800/60',
    textLight: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    glow: 'rgba(225, 29, 72, 0.18)',
    avatarEmoji: '⚡',
    quoteStyle: 'border-l-rose-500'
  },
  {
    name: 'Creative',
    roleTitle: 'The Big Picture Thinker',
    tag: 'Brings unexpected angles & cross-domain ideas',
    color: '#7c3aed',
    gradient: 'from-violet-600 to-fuchsia-500',
    bgLight: 'bg-purple-50/90 dark:bg-purple-950/40',
    borderLight: 'border-purple-200 dark:border-purple-800/60',
    textLight: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    glow: 'rgba(124, 58, 237, 0.18)',
    avatarEmoji: '💡',
    quoteStyle: 'border-l-purple-500'
  },
  {
    name: 'Balanced',
    roleTitle: 'The Synthesizer',
    tag: 'Connects diverse views and drives consensus',
    color: '#d97706',
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50/90 dark:bg-amber-950/40',
    borderLight: 'border-amber-200 dark:border-amber-800/60',
    textLight: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    glow: 'rgba(217, 119, 6, 0.18)',
    avatarEmoji: '🤝',
    quoteStyle: 'border-l-amber-500'
  }
];

// Curated 1-click popular topics to eliminate blank-page anxiety
const QUICK_TOPICS = [
  {
    category: 'Product & Tech',
    difficulty: 'Intermediate',
    duration: 8,
    topic: 'Should tech companies mandate AI oversight committees for autonomous decision algorithms?',
    tag: 'Trending AI',
    color: 'from-blue-500/10 to-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80'
  },
  {
    category: 'Future of Work',
    difficulty: 'Beginner',
    duration: 4,
    topic: 'Should companies transition to a permanent 4-day work week without salary reduction?',
    tag: 'Popular',
    color: 'from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80'
  },
  {
    category: 'Strategy',
    difficulty: 'Intermediate',
    duration: 8,
    topic: 'Should startups focus relentlessly on user growth before seeking unit-economic profitability?',
    tag: 'Business Case',
    color: 'from-amber-500/10 to-orange-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80'
  },
  {
    category: 'Public Policy',
    difficulty: 'Advanced',
    duration: 12,
    topic: 'Should metropolitan cities make all public transit free to reduce carbon emissions?',
    tag: 'Civic Debate',
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
  }
];

// Helpful starter phrases for discussion rounds
const DISCUSSION_STARTERS = [
  "Building upon Analytical's data...",
  "I'd like to challenge the assumption that...",
  "The fundamental trade-off we must weigh is...",
  "Looking at this from practical implementation...",
  "To synthesize both sides of this argument..."
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [user, setUser] = useState<any>(null);
  const [setup, setSetup] = useState({ category: 'General', difficulty: 'Intermediate', duration: 8, custom: '' });
  const [session, setSession] = useState<any>(null);
  const [liveStartedAt, setLiveStartedAt] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState('');
  const [myTurn, setMyTurn] = useState(false);
  const [draft, setDraft] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [error, setError] = useState('');
  const [readingPopup, setReadingPopup] = useState<Message | null>(null);

  // Check stored user on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('gd_user');
      if (stored) {
        setUser(JSON.parse(stored));
        setScreen('home');
      } else {
        setScreen('home'); // Default to home for approachable first impression
      }
    } catch {
      // Storage unavailable fallback
    }
  }, []);

  const authenticate = async (mode: 'login' | 'signup', payload: { name: string; email: string; password: string }) => {
    setError('');
    try {
      const r = await fetch(`${API}/api/auth/${mode === 'signup' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.detail || (mode === 'signup' ? 'Could not create the account.' : 'No account found with that email and password.'));
      setUser(data.user);
      window.localStorage.setItem('gd_user', JSON.stringify(data.user));
      setScreen('home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach GD Arena. Start the FastAPI backend and try again.');
    }
  };

  const logout = async () => {
    await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
    window.localStorage.removeItem('gd_user');
    setScreen('home');
  };

  const startWithConfig = async (config = setup) => {
    setError('');
    try {
      const r = await fetch(`${API}/api/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: config.category,
          difficulty: config.difficulty,
          duration: config.duration,
          topic_mode: config.custom ? 'custom' : 'generated',
          custom_topic: config.custom || null
        })
      });
      if (!r.ok) throw new Error(`Backend returned ${r.status}`);
      const d = await r.json();
      setSession(d);
      setMessages([]);
      setEvaluation(null);
      setScreen('briefing');
    } catch {
      setError('Could not reach GD Arena. Start the FastAPI backend on http://localhost:8000, then try again.');
    }
  };

  const launchQuickTopic = (item: typeof QUICK_TOPICS[0]) => {
    const config = {
      category: item.category,
      difficulty: item.difficulty,
      duration: item.duration,
      custom: item.topic
    };
    setSetup(config);
    startWithConfig(config);
  };

  const enterDiscussion = () => {
    if (!session) return;
    const startedAt = new Date().toISOString();
    setLiveStartedAt(startedAt);
    setReadingPopup(null);
    setScreen('discussion');
    openSocket(session.id);
  };

  const openSocket = (id: string) => {
    const ws = new WebSocket(`${API.replace('http', 'ws')}/ws/discussions/${id}`);
    (window as any).__gdSocket = ws;
    ws.onerror = () => setError('The live discussion connection could not be opened. Check that the backend is running.');
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === 'thinking') setThinking(d.speaker);
      if (d.type === 'message') {
        setThinking('');
        setMessages((x) => [...x, d.message]);
        // Trigger automatic 60s reading pop-up for AI participant contributions
        if (d.message && d.message.speaker !== 'You' && d.message.role !== 'user') {
          setReadingPopup(d.message);
        }
      }
      if (d.type === 'user_turn') {
        setThinking('');
        setMyTurn(true);
      }
      if (d.type === 'completed') {
        setMyTurn(false);
        setReadingPopup(null);
        setEvaluation(d.evaluation);
        setScreen('results');
      }
    };
  };

  const dismissReadingPopup = () => {
    setReadingPopup(null);
    const w = (window as any).__gdSocket as WebSocket | undefined;
    if (w?.readyState === 1) {
      w.send(JSON.stringify({ action: 'reading_done' }));
    }
  };

  const submit = (overrideContent?: string) => {
    const textToSend = (typeof overrideContent === 'string' ? overrideContent : draft).trim();
    if (!textToSend) return;
    const w = (window as any).__gdSocket as WebSocket | undefined;
    if (w?.readyState === 1) w.send(JSON.stringify({ content: textToSend }));
    setDraft('');
    setMyTurn(false);
  };

  const exitDiscussion = () => {
    const w = (window as any).__gdSocket as WebSocket | undefined;
    if (w) {
      try {
        w.close();
      } catch {}
      (window as any).__gdSocket = null;
    }
    setMyTurn(false);
    setThinking('');
    setDraft('');
    setMessages([]);
    setReadingPopup(null);
    setScreen('home');
  };

  if (screen === 'auth')
    return <AuthScreen error={error} onSubmit={authenticate} onHome={() => setScreen('home')} />;
  if (screen === 'setup')
    return (
      <SetupScreen
        user={user}
        setup={setup}
        setSetup={setSetup}
        error={error}
        onStart={() => startWithConfig(setup)}
        onHome={() => setScreen('home')}
        onLogout={logout}
        onAuth={() => setScreen('auth')}
      />
    );
  if (screen === 'briefing' && session)
    return (
      <Briefing
        user={user}
        session={session}
        onBack={() => setScreen('setup')}
        onStart={enterDiscussion}
        onHome={() => setScreen('home')}
        onLogout={logout}
        onAuth={() => setScreen('auth')}
      />
    );
  if (screen === 'discussion' && session)
    return (
      <Discussion
        user={user}
        session={session}
        liveStartedAt={liveStartedAt}
        messages={messages}
        thinking={thinking}
        myTurn={myTurn}
        draft={draft}
        setDraft={setDraft}
        submit={submit}
        readingPopup={readingPopup}
        onDismissReadingPopup={dismissReadingPopup}
        onExit={exitDiscussion}
        onHome={exitDiscussion}
        onLogout={logout}
        onAuth={() => setScreen('auth')}
      />
    );
  if (screen === 'results' && evaluation)
    return <Results evaluation={evaluation} messages={messages} again={() => setScreen('setup')} />;

  return (
    <main className="min-h-screen grid-bg relative overflow-hidden text-slate-900 dark:text-slate-100 pb-20">
      <Nav
        user={user}
        onHome={() => setScreen('home')}
        onLogout={logout}
        onAuth={() => setScreen('auth')}
      />
      
      {/* Hero Banner */}
      <section className="mx-auto max-w-6xl px-6 pt-12 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Friendly Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800/80 bg-white/90 dark:bg-slate-900/90 px-4 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-sm backdrop-blur-md">
              <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Friendly AI Discussion Coach</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Zero Pressure Practice</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.08]">
              Speak up with confidence.<br />
              <span className="gradient-text-primary">Think faster on your feet.</span>
            </h1>

            <p className="soft mt-6 max-w-xl text-base md:text-lg leading-relaxed font-medium">
              Join a simulated round table with 4 adaptive AI personas. Test your ideas, handle polite pushback, and get an encouraging AI executive score report.
            </p>

            {/* Main Action Group */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary text-sm md:text-base px-7 py-3.5 shadow-lg shadow-indigo-500/25"
                onClick={() => setScreen('setup')}
              >
                <Sparkles size={18} /> Configure Custom Room <ChevronRight size={18} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-ghost text-sm md:text-base px-6 py-3.5 shadow-xs"
                onClick={() => launchQuickTopic(QUICK_TOPICS[0])}
              >
                <Play size={16} className="text-indigo-600 dark:text-indigo-400" /> Instant Quick Match (8m)
              </motion.button>
            </div>

            {/* Quick trust metrics */}
            <div className="mt-10 flex items-center gap-8 border-t border-slate-200/80 dark:border-slate-800 pt-6">
              <div>
                <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100">4 Peers</p>
                <p className="text-xs soft font-medium">Distinct Thinking Styles</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100">9 Criteria</p>
                <p className="text-xs soft font-medium">Holistic Debrief Scores</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div>
                <p className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400">Voice & Text</p>
                <p className="text-xs soft font-medium">Live Speech Input</p>
              </div>
            </div>
          </motion.div>

          {/* Right Hero: Active Stage Preview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="glass rounded-3xl p-6 md:p-7 relative border border-slate-200/90 dark:border-slate-800 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 text-xs font-bold">
                  🎯
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Your Discussion Cohort</p>
                  <p className="text-[10px] soft">Adaptive AI peers ready to converse</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shadow-xs">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" /> Live Room Ready
              </span>
            </div>

            {/* Persona list preview */}
            <div className="mt-4 space-y-2.5">
              {people.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between rounded-2xl bg-white dark:bg-slate-900/90 p-3 border border-slate-200/70 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      style={{ background: p.color }}
                      className="grid h-9 w-9 place-items-center rounded-xl text-white text-sm font-black shadow-xs"
                    >
                      {p.avatarEmoji}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">· {p.roleTitle}</span>
                      </div>
                      <p className="text-[11px] soft font-medium line-clamp-1">{p.tag}</p>
                    </div>
                  </div>
                  <span className="text-slate-300 dark:text-slate-600">
                    <ChevronRight size={14} />
                  </span>
                </div>
              ))}
            </div>

            {/* Coach prompt card */}
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/80 dark:border-emerald-800/80 p-3.5 flex items-center gap-3">
              <span className="text-xl">⚖️</span>
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Judge AI Moderator</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Monitors room dynamics and provides 9-signal feedback at the end.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 1-Click Popular Practice Topics Section */}
        <div className="mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Jump Right In</p>
              <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                Curated Practice Topics
              </h2>
              <p className="soft mt-1 text-sm font-medium">Pick a question to immediately enter the coaching room.</p>
            </div>
            <button
              onClick={() => setScreen('setup')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              Custom topic & time settings <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_TOPICS.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                onClick={() => launchQuickTopic(item)}
                className="glass-card rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-white dark:bg-slate-900 ${item.color}`}>
                      {item.tag}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{item.duration}m · {item.difficulty}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                    "{item.topic}"
                  </h3>
                </div>

                <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>Start Discussion</span>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-50 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ChevronRight size={14} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 3 Step Simple Roadmap */}
        <div className="mt-20 glass rounded-3xl p-8 border border-slate-200/90 dark:border-slate-800 shadow-md">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">How It Works</span>
            <h2 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Simple, Stress-Free Practice
            </h2>
            <p className="soft mt-1.5 text-sm font-medium">Everything is designed to make speaking in group settings second nature.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs relative">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-sm mb-4 border border-blue-200 dark:border-blue-800">
                01
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Choose Your Arena</h3>
              <p className="soft mt-2 text-xs md:text-sm leading-relaxed font-medium">
                Pick a business dilemma, tech debate, or societal question. Set your preferred timer from 4 to 16 minutes.
              </p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs relative">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold text-sm mb-4 border border-purple-200 dark:border-purple-800">
                02
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Converse & Lead</h3>
              <p className="soft mt-2 text-xs md:text-sm leading-relaxed font-medium">
                Listen to peer points, then use voice or text to respond with evidence. Built-in starter prompts help if you ever feel stuck!
              </p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs relative">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm mb-4 border border-emerald-200 dark:border-emerald-800">
                03
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Get Concrete Coaching</h3>
              <p className="soft mt-2 text-xs md:text-sm leading-relaxed font-medium">
                Receive an objective 9-dimension score breakdown, notable quotes, key strengths, and an actionable playbook for next time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SetupScreen({
  user,
  setup,
  setSetup,
  error,
  onStart,
  onHome,
  onLogout,
  onAuth
}: {
  user?: any;
  setup: any;
  setSetup: (s: any) => void;
  error: string;
  onStart: () => void;
  onHome: () => void;
  onLogout: () => void;
  onAuth: () => void;
}) {
  const categories = [
    { name: 'General', emoji: '🌐' },
    { name: 'Product & Tech', emoji: '💻' },
    { name: 'Strategy', emoji: '📈' },
    { name: 'Consulting', emoji: '🏛️' },
    { name: 'MBA Case', emoji: '🎓' },
    { name: 'Marketing & Sales', emoji: '📣' },
    { name: 'Current Affairs', emoji: '🌍' },
    { name: 'Abstract & Ethics', emoji: '💭' }
  ];
  const difficulties = [
    { level: 'Beginner', desc: 'Supportive peers & relaxed pacing' },
    { level: 'Intermediate', desc: 'Balanced counterpoints & trade-offs' },
    { level: 'Advanced', desc: 'High-pressure rigorous pressure testing' }
  ];
  const durations = [
    { mins: 4, label: 'Sprint (4m)' },
    { mins: 8, label: 'Standard (8m)' },
    { mins: 12, label: 'Deep Dive (12m)' },
    { mins: 16, label: 'Mastery (16m)' }
  ];

  const handleRandomizeTopic = () => {
    const randomTopic = QUICK_TOPICS[Math.floor(Math.random() * QUICK_TOPICS.length)];
    setSetup({
      ...setup,
      category: randomTopic.category,
      custom: randomTopic.topic
    });
  };

  return (
    <main className="min-h-screen grid-bg pb-20 text-slate-900 dark:text-slate-100">
      <Nav user={user} onHome={onHome} onLogout={onLogout} onAuth={onAuth} />
      <section className="mx-auto max-w-4xl px-6 pt-10">
        {/* Step Progress Pill */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 px-3.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            Step 1 of 3: Configure Room
          </span>
        </div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Personalize Your Practice Session
          </h1>
          <p className="soft mt-2 text-sm md:text-base font-medium max-w-lg mx-auto">
            Choose your domain, difficulty, and duration. The 4 AI participants adapt dynamically.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 md:p-8 border border-slate-200/90 dark:border-slate-800 shadow-lg space-y-8"
        >
          {/* Category Selection */}
          <div>
            <label className="block mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Choose Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {categories.map((cat) => {
                const isSelected = setup.category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSetup({ ...setup, category: cat.name })}
                    className={`rounded-2xl p-3 text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Challenge Level
            </label>
            <div className="grid sm:grid-cols-3 gap-3">
              {difficulties.map((diff) => {
                const isSelected = setup.difficulty === diff.level;
                return (
                  <button
                    key={diff.level}
                    type="button"
                    onClick={() => setSetup({ ...setup, difficulty: diff.level })}
                    className={`rounded-2xl p-4 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-2 border-indigo-600 dark:border-indigo-500 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-100'}`}>
                        {diff.level}
                      </p>
                      {isSelected && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="mt-1 text-xs soft font-medium leading-relaxed">{diff.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Session Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {durations.map((dur) => {
                const isSelected = setup.duration === dur.mins;
                return (
                  <button
                    key={dur.mins}
                    type="button"
                    onClick={() => setSetup({ ...setup, duration: dur.mins })}
                    className={`rounded-2xl py-3 px-2 text-xs font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {dur.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Topic Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                4. Topic (Optional or Shuffle)
              </label>
              <button
                type="button"
                onClick={handleRandomizeTopic}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Shuffle size={12} /> Suggest an exciting topic
              </button>
            </div>
            <textarea
              value={setup.custom}
              onChange={(e) => setSetup({ ...setup, custom: e.target.value })}
              placeholder="Leave blank to let the AI Moderator assign a topic, or enter your own custom question..."
              maxLength={250}
              className="w-full glass-input rounded-2xl p-4 text-xs md:text-sm placeholder:text-slate-400 min-h-[85px] resize-none"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={onHome}
              className="btn btn-ghost text-xs md:text-sm font-bold shadow-xs"
            >
              <ArrowLeft size={16} /> Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary px-8 py-3.5 text-sm md:text-base font-bold shadow-lg shadow-indigo-500/25"
              onClick={onStart}
            >
              Continue to Coach Briefing <ChevronRight size={18} />
            </motion.button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

function Briefing({
  user,
  session,
  onBack,
  onStart,
  onHome,
  onLogout,
  onAuth
}: {
  user?: any;
  session: any;
  onBack: () => void;
  onStart: () => void;
  onHome: () => void;
  onLogout: () => void;
  onAuth: () => void;
}) {
  return (
    <main className="min-h-screen grid-bg pb-20 text-slate-900 dark:text-slate-100">
      <Nav user={user} onHome={onHome} onLogout={onLogout} onAuth={onAuth} />
      <section className="mx-auto max-w-4xl px-6 pt-10">
        {/* Step Progress Pill */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            Step 2 of 3: Judge Coach Briefing
          </span>
        </div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-3 shadow-xs">
            <ShieldCheck size={14} /> Room Strategy & Objective
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Your Discussion Game Plan
          </h1>
          <p className="soft mt-2 text-sm md:text-base font-medium max-w-lg mx-auto">
            Take 30 seconds to review the assigned topic and structured turn flow before entering.
          </p>
        </motion.div>

        {/* Main Topic Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 border border-slate-200/90 dark:border-slate-800 shadow-md relative overflow-hidden group mb-6 text-center"
        >
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-200/30 to-violet-200/30 dark:from-indigo-600/10 dark:to-violet-600/10 blur-3xl pointer-events-none" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full">
            {session.category} · {session.difficulty} · {session.duration} Minutes
          </span>
          <h2 className="mt-4 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug max-w-2xl mx-auto">
            "{session.topic}"
          </h2>
        </motion.div>

        {/* 4-Step Round Flow Visualizer (Very approachable!) */}
        <div className="glass rounded-3xl p-6 md:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm mb-8">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Compass size={18} className="text-indigo-600 dark:text-indigo-400" /> How the Discussion Will Flow
          </h3>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Phase 1</span>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">Analytical & Challenger</p>
              <p className="text-[11px] soft mt-1 leading-snug">Set baseline data and pressure-test the problem.</p>
            </div>

            <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 p-3.5 border-2 border-indigo-300 dark:border-indigo-700 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Your Turn 1</span>
              <p className="font-bold text-xs text-indigo-900 dark:text-indigo-200 mt-1">State Your Claim</p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 leading-snug">Deliver your initial stance and logic.</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Phase 2</span>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">Creative & Balanced</p>
              <p className="text-[11px] soft mt-1 leading-snug">Introduce fresh angles and synthesize points.</p>
            </div>

            <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 p-3.5 border-2 border-indigo-300 dark:border-indigo-700 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Your Turn 2</span>
              <p className="font-bold text-xs text-indigo-900 dark:text-indigo-200 mt-1">Lead to Consensus</p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 leading-snug">Unify the room and steer conclusion.</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={onBack} className="btn btn-ghost text-xs md:text-sm font-bold shadow-xs">
            <ArrowLeft size={16} /> Back to Setup
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="btn btn-primary text-base px-8 py-3.5 font-bold shadow-lg shadow-indigo-500/25"
          >
            Enter Live Arena Now <ChevronRight size={18} />
          </motion.button>
        </div>
      </section>
    </main>
  );
}

function AgentCard({
  persona,
  messages,
  thinking,
  onOpenHistory
}: {
  persona: any;
  messages: Message[];
  thinking: string;
  onOpenHistory: () => void;
}) {
  const isPersonaThinking = thinking === persona.name;
  const personaMessages = messages.filter((m) => m.speaker === persona.name);
  const latestMessage = personaMessages[personaMessages.length - 1];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onOpenHistory}
      style={{
        borderColor: isPersonaThinking ? persona.color : undefined,
        boxShadow: isPersonaThinking ? `0 8px 30px ${persona.glow}` : undefined
      }}
      className={`relative rounded-3xl p-5 border transition-all cursor-pointer min-h-[160px] md:min-h-[175px] flex flex-col justify-between shadow-md ${
        isPersonaThinking
          ? 'bg-white dark:bg-slate-900 border-2'
          : 'bg-white/95 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 border-slate-200/90 dark:border-slate-800'
      }`}
    >
      {/* Header info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div
            style={{ background: persona.color, boxShadow: `0 4px 12px ${persona.glow}` }}
            className="h-8 w-8 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0"
          >
            {persona.avatarEmoji}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none truncate">{persona.name}</p>
            <p className="text-[10px] soft mt-0.5 truncate">{persona.roleTitle}</p>
          </div>
        </div>

        {latestMessage && (
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
            Round {latestMessage.round}
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="flex-1 overflow-hidden py-1">
        {isPersonaThinking ? (
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold italic py-2">
            <div className="flex items-center gap-1 h-3">
              <div className="soundwave-bar" />
              <div className="soundwave-bar" />
              <div className="soundwave-bar" />
            </div>
            <span>Formulating point...</span>
          </div>
        ) : latestMessage ? (
          <p className={`text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed font-medium pl-2 border-l-2 ${persona.quoteStyle}`}>
            "{latestMessage.content}"
          </p>
        ) : (
          <p className="text-[11px] italic text-slate-400 dark:text-slate-500 py-2">Standing by for discussion cue...</p>
        )}
      </div>

      {/* Bottom indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500">
        <span className="font-medium text-slate-500 dark:text-slate-400">{personaMessages.length} contributions</span>
        <span className="hover:underline flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold">
          History <ChevronRight size={10} />
        </span>
      </div>
    </motion.div>
  );
}

function JudgeCard({
  thinking,
  myTurn,
  session,
  onOpenRubric
}: {
  thinking: string;
  myTurn: boolean;
  messagesCount: number;
  session: any;
  onOpenRubric: () => void;
}) {
  const isJudgeActive = thinking === 'Judge' || thinking === 'Evaluator';

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onClick={onOpenRubric}
      className="relative rounded-3xl p-5 border-2 border-emerald-300 dark:border-emerald-700/80 bg-gradient-to-b from-emerald-50/90 via-white/95 to-teal-50/90 dark:from-emerald-950/40 dark:via-slate-900/95 dark:to-teal-950/40 shadow-xl shadow-emerald-500/10 flex flex-col items-center justify-center text-center min-h-[160px] md:min-h-[175px] cursor-pointer"
    >
      {/* Glow Aura */}
      <div className="absolute -inset-1 rounded-3xl bg-emerald-400/10 blur-md -z-10" />

      {/* Judge Icon */}
      <div className="relative mb-2">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black flex items-center justify-center shadow-md shadow-emerald-500/25">
          <ShieldCheck size={26} />
        </div>
      </div>

      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-wider uppercase">
        JUDGE AI
      </h3>

      <div className="mt-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-xs">
        {isJudgeActive ? (
          <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">Evaluating Discussion...</span>
        ) : thinking ? (
          <span className="text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full">Observing {thinking}...</span>
        ) : myTurn ? (
          <span className="text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 px-2.5 py-0.5 rounded-full">Your Turn to Speak!</span>
        ) : (
          <span className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">Observing Arena</span>
        )}
      </div>

      <p className="mt-2 text-[10px] soft font-semibold">
        {session.category} · {session.difficulty}
      </p>
    </motion.div>
  );
}

function Discussion({
  user,
  session,
  liveStartedAt,
  messages,
  thinking,
  myTurn,
  draft,
  setDraft,
  submit,
  readingPopup,
  onDismissReadingPopup,
  onExit,
  onHome,
  onLogout,
  onAuth
}: any) {
  const totalSeconds = Math.max(1, Number(session.duration || 8) * 60);
  const [remaining, setRemaining] = useState(totalSeconds);
  const isTimerPaused = Boolean(readingPopup);
  const [popupSeconds, setPopupSeconds] = useState(60);
  const [viewMode, setViewMode] = useState<'diamond' | 'feed'>('diamond');
  const [userFlash, setUserFlash] = useState<{ content: string; round: number } | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  // Main timer: ticks down every second, strictly freezes whenever isTimerPaused is true
  useEffect(() => {
    if (isTimerPaused) return;
    const interval = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isTimerPaused]);

  // Automatic 60-second reading countdown on AI participant popup
  useEffect(() => {
    if (!readingPopup) return;
    setPopupSeconds(60);
    const timer = window.setInterval(() => {
      setPopupSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          onDismissReadingPopup();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [readingPopup, onDismissReadingPopup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    if (userFlash) {
      const t = setTimeout(() => {
        setUserFlash(null);
      }, 4500);
      return () => clearTimeout(t);
    }
  }, [userFlash]);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const isListeningRef = useRef(false);
  const draftRef = useRef(draft);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const cleanupListening = () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupListening();
    };
  }, []);

  const handleSend = (overrideText?: string) => {
    const content = (typeof overrideText === 'string' ? overrideText : draft).trim();
    if (!content || !myTurn || remaining === 0) return;
    if (isListeningRef.current) {
      cleanupListening();
    }
    const currentRound = messages.length > 0 ? Math.max(...messages.map((m: Message) => m.round || 1)) : 1;
    setUserFlash({ content, round: currentRound });
    submit(content);
  };

  const stopListeningAndProcess = async () => {
    if (!isListeningRef.current) return;
    isListeningRef.current = false;
    setIsListening(false);

    // Stop web speech recognition if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    // Stop MediaRecorder and wait for the final recorded chunks to flush
    await new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = () => {
          resolve();
        };
        try {
          recorder.stop();
        } catch {
          resolve();
        }
      } else {
        resolve();
      }
    });

    // Stop microphone tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
    }

    // 1. If Web Speech API already captured text during the speech, check if usable
    const liveText = draftRef.current.trim();
    if (liveText.length >= 8) {
      handleSend(liveText);
      return;
    }

    // 2. Otherwise transcribe audio chunks via Gemini backend
    if (audioChunksRef.current.length > 0) {
      setIsTranscribing(true);
      try {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size > 500) {
          const formData = new FormData();
          formData.append('file', audioBlob, 'speech.webm');

          const res = await fetch(`${API}/api/speech/transcribe`, {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            const transcribed = (data.text || '').trim();
            if (transcribed && transcribed.length > 1) {
              setDraft(transcribed);
              // Send the user response automatically as requested
              handleSend(transcribed);
              setIsTranscribing(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Transcription service error:', err);
      } finally {
        setIsTranscribing(false);
      }
    }

    // If no speech could be detected
    if (!draftRef.current.trim()) {
      setSpeechError('No speech detected. Please speak closer to your mic and click Stop when done.');
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

  const toggleListening = async () => {
    setSpeechError(null);

    // If already listening, clicking STOP triggers processing & auto-send!
    if (isListening) {
      await stopListeningAndProcess();
      return;
    }

    if (!myTurn || remaining === 0) {
      setSpeechError('Please wait for your turn to speak.');
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setSpeechError('Microphone audio is not supported in this browser. Please use Chrome or Edge.');
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      isListeningRef.current = true;
      setIsListening(true);
      audioChunksRef.current = [];

      // 1. Setup MediaRecorder for recording speech from Speak click to Stop click
      let recorder: MediaRecorder | null = null;
      try {
        const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

        recorder = preferredMime ? new MediaRecorder(stream, { mimeType: preferredMime }) : new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(200);
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn('MediaRecorder error:', recErr);
      }

      // 2. Setup live Web Speech API as live visual preview (if supported)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

          recognition.onresult = (event: any) => {
            let liveText = '';
            for (let i = 0; i < event.results.length; i++) {
              liveText += event.results[i][0].transcript + ' ';
            }
            const trimmed = liveText.trim();
            if (trimmed) {
              setDraft(trimmed.slice(0, 500));
            }
          };

          recognition.onerror = (event: any) => {
            // Silently absorb status; audio is recorded in MediaRecorder until user clicks Stop!
            console.log('Web Speech status info:', event.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (speechErr) {
          console.warn('Web Speech fallback active:', speechErr);
        }
      }
    } catch (micErr: any) {
      console.error('Microphone error:', micErr);
      setIsListening(false);
      isListeningRef.current = false;
      setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
      setTimeout(() => setSpeechError(null), 5000);
    }
  };

  const handleInsertStarter = (starterText: string) => {
    const newText = draft.trim() ? `${draft.trim()} ${starterText}` : starterText;
    setDraft(newText);
    textareaRef.current?.focus();
  };

  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');
  const timeUp = remaining === 0;

  // Approximate discussion round progress
  const currentRound = messages.length > 0 ? Math.max(...messages.map((m: Message) => m.round || 1)) : 1;
  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;

  return (
    <main className="min-h-screen grid-bg pb-12 flex flex-col text-slate-900 dark:text-slate-100">
      <Nav user={user} onHome={() => setShowExitConfirm(true)} onLogout={onLogout} onAuth={onAuth} hideThemeToggle={true} />
      <section className="mx-auto max-w-6xl px-6 pt-4 flex-1 flex flex-col w-full">
        {/* Header Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 glass rounded-3xl p-5 border border-slate-200/90 shadow-md">
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2">
              <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-xs">
                {session.category}
              </span>
              <span className="text-xs soft font-semibold">
                Round {currentRound} of 2
              </span>
            </div>
            <h1 className="mt-1 font-extrabold text-base md:text-lg text-slate-900 dark:text-slate-100 truncate max-w-2xl">{session.topic}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/90 dark:border-slate-700">
              <button
                onClick={() => setViewMode('diamond')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'diamond'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Grid size={14} /> Diamond Stage
              </button>
              <button
                onClick={() => setViewMode('feed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'feed'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <ListFilter size={14} /> Timeline Feed
              </button>
            </div>

            <span
              className={`glass-card rounded-2xl px-4 py-2 text-xs font-bold flex items-center gap-2 transition-all ${
                timeUp
                  ? 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60'
                  : isTimerPaused
                  ? 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/50 shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900'
              }`}
            >
              <Clock3
                size={15}
                className={isTimerPaused ? 'text-amber-500 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'}
              />
              <span>{minutes}:{seconds}</span>
              {isTimerPaused && (
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  Paused
                </span>
              )}
            </span>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Exit Arena Button */}
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="rounded-2xl px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/80 hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer shadow-xs group"
              title="Exit Arena"
            >
              <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* AI Participant Thought Pop-Up with 60s Reading Timer */}
        <AnimatePresence>
          {readingPopup && (() => {
            const persona = people.find((p) => p.name === readingPopup.speaker) || {
              name: readingPopup.speaker,
              roleTitle: 'Panelist',
              tag: 'Discussion Participant',
              color: '#2563eb',
              gradient: 'from-blue-600 to-cyan-500',
              bgLight: 'bg-blue-50/90 dark:bg-blue-950/40',
              borderLight: 'border-blue-200 dark:border-blue-800/60',
              textLight: 'text-blue-700 dark:text-blue-300',
              badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
              glow: 'rgba(37, 99, 235, 0.18)',
              avatarEmoji: '📊',
              quoteStyle: 'border-l-blue-500'
            };

            const timerProgress = Math.max(0, Math.min(100, (popupSeconds / 60) * 100));
            const isUrgent = popupSeconds <= 10;
            const isWarning = popupSeconds <= 20;

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/75 dark:bg-black/80 backdrop-blur-md"
                onClick={onDismissReadingPopup}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 16 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    boxShadow: `0 25px 60px -15px ${persona.glow}, 0 0 0 1px ${persona.color}40`
                  }}
                  className="bg-white dark:bg-[#0c121e] rounded-3xl md:rounded-[32px] p-6 md:p-8 border-2 border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col gap-5"
                >
                  {/* 60s Progress Bar along top border */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{
                        width: `${timerProgress}%`,
                        backgroundColor: isUrgent ? '#e11d48' : isWarning ? '#d97706' : persona.color
                      }}
                      transition={{ ease: 'linear', duration: 1 }}
                    />
                  </div>

                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/90 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        style={{
                          background: persona.color,
                          boxShadow: `0 8px 24px ${persona.glow}`
                        }}
                        className="h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-md shrink-0"
                      >
                        {persona.avatarEmoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                            {persona.name}
                          </h2>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${persona.badge}`}>
                            Round {readingPopup.round}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          {persona.roleTitle}
                        </p>
                      </div>
                    </div>

                    {/* 60s Countdown Timer Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <div
                        className={`px-3.5 py-1.5 rounded-2xl border flex items-center gap-2 text-xs md:text-sm font-black transition-all ${
                          isUrgent
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse'
                            : isWarning
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <Clock3 size={16} className={isUrgent ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'} />
                        <span>{String(Math.floor(popupSeconds / 60)).padStart(2, '0')}:{String(popupSeconds % 60).padStart(2, '0')}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                        Main timer paused
                      </span>
                    </div>
                  </div>

                  {/* Participant's Full Answer Content */}
                  <div className="relative py-1">
                    <div
                      className={`pl-4 md:pl-5 border-l-4 ${persona.quoteStyle} rounded-xs`}
                    >
                      <p className="text-xs uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 mb-2">
                        Participant Thought
                      </p>
                      <div className="max-h-[42vh] overflow-y-auto pr-2">
                        <p className="text-base md:text-lg text-slate-800 dark:text-slate-100 font-medium leading-relaxed italic">
                          "{readingPopup.content}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle / Strategy Note */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-base">{persona.avatarEmoji}</span>
                    <span className="truncate"><strong>Strategy:</strong> {persona.tag}</span>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
                      Auto-advancing in <span className="font-bold text-slate-700 dark:text-slate-300">{popupSeconds}s</span>
                    </p>

                    <button
                      type="button"
                      onClick={onDismissReadingPopup}
                      style={{
                        background: `linear-gradient(135deg, ${persona.color}, #4f46e5)`
                      }}
                      className="w-full sm:w-auto ml-auto px-6 py-3 rounded-2xl text-xs md:text-sm font-extrabold text-white shadow-lg hover:shadow-xl hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue Discussion ({popupSeconds}s)</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Exit Confirmation Modal */}
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowExitConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl relative overflow-hidden"
              >
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-xs">
                    <LogOut size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Exit Discussion?</h3>
                    <p className="text-xs soft">Leave the live arena session</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
                  Are you sure you want to leave? Your current session and turns will be discarded. You can start a fresh topic anytime.
                </p>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowExitConfirm(false)}
                    className="px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    Stay in Arena
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      cleanupListening();
                      setShowExitConfirm(false);
                      if (onExit) onExit();
                      else onHome();
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-2 shadow-md shadow-rose-600/25 cursor-pointer"
                  >
                    <LogOut size={15} /> Yes, Exit Arena
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Flash Dialog Overlay */}
        <AnimatePresence>
          {userFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
            >
              <div className="relative w-full max-w-2xl text-center space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-5 py-2 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/10">
                  <Sparkles size={16} /> YOUR POINT IS NOW BROADCAST ACROSS ARENA
                </div>

                <div className="bg-white/95 dark:bg-slate-900/95 border-2 border-indigo-500/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-indigo-500/15 text-left">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                        YOU
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Your Contribution</p>
                        <p className="text-[10px] soft">Round {userFlash.round} Participant Turn</p>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                      <Zap size={14} /> AI Panelists Listening
                    </span>
                  </div>

                  <p className="text-slate-800 dark:text-slate-200 text-base md:text-lg font-semibold leading-relaxed max-h-52 overflow-y-auto pr-2">
                    "{userFlash.content}"
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold soft pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <Zap size={14} /> Received by Analytical, Challenger, Creative & Balanced
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <ShieldCheck size={14} /> Judge AI Scoring Active
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setUserFlash(null)}
                  className="btn btn-ghost text-xs py-2.5 px-6 rounded-full font-bold shadow-sm"
                >
                  Dismiss Flash Overlay
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Agent History Modal */}
        <AnimatePresence>
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setSelectedAgent(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[80vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ background: people.find(p => p.name === selectedAgent)?.color || '#2563eb' }}
                      className="h-8 w-8 rounded-xl font-black text-white text-xs flex items-center justify-center shadow-xs"
                    >
                      {people.find(p => p.name === selectedAgent)?.avatarEmoji || '👤'}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{selectedAgent} History</h3>
                      <p className="text-xs soft font-medium">All points made by this persona in this session</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAgent(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 py-2">
                  {messages.filter((m: Message) => m.speaker === selectedAgent).length === 0 ? (
                    <p className="text-xs italic soft text-center py-8">No contributions from {selectedAgent} yet.</p>
                  ) : (
                    messages
                      .filter((m: Message) => m.speaker === selectedAgent)
                      .map((m: Message, i: number) => (
                        <div key={i} className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5 shadow-xs">
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">Round {m.round}</span>
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{m.content}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rubric Details Modal */}
        <AnimatePresence>
          {showRubricModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowRubricModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Judge AI Evaluation Rubric</h3>
                      <p className="text-xs soft font-medium">9 core dimensions evaluated in real-time</p>
                    </div>
                  </div>
                  <button onClick={() => setShowRubricModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {[
                    ['Content & Depth', 'Relevance, accuracy, and depth of factual examples.', 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'],
                    ['Reasoning & Logic', 'Clarity of cause-and-effect and trade-off analysis.', 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'],
                    ['Communication Delivery', 'Pacing, clarity of diction, and conciseness.', 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800'],
                    ['Participation Frequency', 'Timing and balance of speech without hogging.', 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'],
                    ['Leadership & Steering', 'Summarizing themes and moving the room toward clarity.', 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'],
                    ['Critical Thinking', 'Respectfully dismantling assumptions and groupthink.', 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'],
                    ['Topic Relevance', 'Remaining tightly anchored to the core question.', 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800'],
                    ['Conciseness & Impact', 'Maximum impact per word delivered.', 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800'],
                    ['Synthesis & Unification', 'Connecting peer points to form a unified conclusion.', 'text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-950/60 border-fuchsia-200 dark:border-fuchsia-800']
                  ].map(([title, desc, colorClass]) => (
                    <div key={title} className="rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 mt-0.5 ${colorClass}`}>
                        {title}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Discussion Layout */}
        <div className="flex-1 flex flex-col w-full gap-5">
          {viewMode === 'diamond' ? (
            /* Diamond 4-Agent Stage */
            <div className="glass flex-1 rounded-3xl p-4 md:p-8 border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden min-h-[520px]">
              <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-4 md:gap-6 flex-1 items-center max-w-5xl mx-auto w-full">
                {/* Top: Analytical (Row 1, Col 2) */}
                <div className="md:col-start-2 md:row-start-1">
                  <AgentCard
                    persona={people[0]}
                    messages={messages}
                    thinking={thinking}
                    onOpenHistory={() => setSelectedAgent(people[0].name)}
                  />
                </div>

                {/* Left: Challenger (Row 2, Col 1) */}
                <div className="md:col-start-1 md:row-start-2">
                  <AgentCard
                    persona={people[1]}
                    messages={messages}
                    thinking={thinking}
                    onOpenHistory={() => setSelectedAgent(people[1].name)}
                  />
                </div>

                {/* Center: JUDGE AI (Row 2, Col 2) */}
                <div className="md:col-start-2 md:row-start-2">
                  <JudgeCard
                    thinking={thinking}
                    myTurn={myTurn}
                    messagesCount={messages.length}
                    session={session}
                    onOpenRubric={() => setShowRubricModal(true)}
                  />
                </div>

                {/* Right: Creative (Row 2, Col 3) */}
                <div className="md:col-start-3 md:row-start-2">
                  <AgentCard
                    persona={people[2]}
                    messages={messages}
                    thinking={thinking}
                    onOpenHistory={() => setSelectedAgent(people[2].name)}
                  />
                </div>

                {/* Bottom: Balanced (Row 3, Col 2) */}
                <div className="md:col-start-2 md:row-start-3">
                  <AgentCard
                    persona={people[3]}
                    messages={messages}
                    thinking={thinking}
                    onOpenHistory={() => setSelectedAgent(people[3].name)}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Feed View (Timeline) */
            <div className="glass flex flex-col rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md min-h-[520px]">
              <div className="flex-1 space-y-4 overflow-y-auto p-6 max-h-[500px]">
                {messages.length === 0 && (
                  <div className="grid h-full place-items-center text-center py-16">
                    <div>
                      <MessageSquareText className="mx-auto mb-3 text-indigo-600 dark:text-indigo-400" size={40} />
                      <p className="font-bold text-lg text-slate-900 dark:text-slate-100">The Moderator is initializing the room...</p>
                      <p className="soft mt-1.5 text-xs md:text-sm font-medium">Listen closely to peer perspectives. Your turn will prompt shortly.</p>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {messages.map((m: Message, i: number) => {
                    const isUser = m.speaker === 'You';
                    const personaObj = people.find((p) => p.name === m.speaker);
                    const personaColor = personaObj?.color || '#4f46e5';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-3 ${isUser ? 'flex-row-reverse text-right' : ''}`}
                      >
                        <div
                          className="mt-1 h-9 w-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm"
                          style={{ background: isUser ? '#4f46e5' : personaColor }}
                        >
                          {isUser ? 'YOU' : personaObj?.avatarEmoji || m.speaker[0]}
                        </div>
                        <div className="max-w-[78%]">
                          <div className={`mb-1 flex items-center gap-2 text-xs font-bold ${isUser ? 'justify-end text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                            <span>{m.speaker}</span>
                            <span className="soft text-[10px] font-normal">· Round {m.round}</span>
                          </div>
                          <div
                            className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-xs font-medium ${
                              isUser
                                ? 'bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/60 dark:to-violet-950/60 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100'
                                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {thinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-fit shadow-xs">
                    <div className="flex items-center gap-1 h-3">
                      <div className="soundwave-bar" />
                      <div className="soundwave-bar" />
                      <div className="soundwave-bar" />
                    </div>
                    <span className="text-xs italic text-indigo-700 dark:text-indigo-300 font-semibold"><strong className="text-slate-900 dark:text-slate-100">{thinking}</strong> is formulating a point...</span>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* User Input, Starter Chips & Audio Controls */}
          <div className="glass rounded-3xl p-5 border border-slate-200/90 shadow-md">
            {/* Contextual Turn Status Banner */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              {isTranscribing ? (
                <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
                  <Sparkles size={14} className="text-indigo-600 animate-spin" /> Transcribing speech to text... Auto-sending response!
                </span>
              ) : isListening ? (
                <span className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
                  <Mic size={14} className="text-rose-600" /> Recording in progress... Speak freely, then click Stop when you are done!
                </span>
              ) : speechError ? (
                <span className="text-rose-600 font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} /> {speechError}
                </span>
              ) : myTurn ? (
                <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
                  <Sparkles size={14} className="text-indigo-600" /> It's your turn to speak! Lead the discussion forward.
                </span>
              ) : (
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Clock3 size={14} /> Listening to discussion panel... Next turn coming up.
                </span>
              )}

              <div className="flex items-center gap-3 text-xs soft">
                {wordCount > 0 && (
                  <span className={`font-semibold ${wordCount >= 40 && wordCount <= 120 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {wordCount} words {wordCount >= 40 && wordCount <= 120 ? '· (Great length 👍)' : ''}
                  </span>
                )}
                <span>{draft.length} / 500 chars</span>
              </div>
            </div>

            {/* Clickable Discussion Starters (Solves Blank-Mind Syndrome!) */}
            {myTurn && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 flex flex-wrap items-center gap-2"
              >
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                  <Lightbulb size={12} className="text-amber-500" /> Need inspiration? Click to start:
                </span>
                {DISCUSSION_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => handleInsertStarter(starter)}
                    className="chip-prompt"
                  >
                    <span>+</span> {starter}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Input Box & Action Buttons */}
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                disabled={!myTurn || timeUp || isTranscribing}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                maxLength={500}
                placeholder={
                  timeUp
                    ? 'Discussion completed. Generating final score report...'
                    : myTurn
                    ? isTranscribing
                      ? 'Transcribing your speech with AI and auto-sending to arena...'
                      : isListening
                      ? 'Recording in progress... Speak your thoughts, then click Stop when done to send!'
                      : 'State your argument or click the microphone to speak... (Ctrl + Enter to send)'
                    : 'Listening to discussion panel... Prepare your thoughts.'
                }
                className={`min-h-[64px] flex-1 resize-none glass-input rounded-2xl p-4 text-xs md:text-sm placeholder:text-slate-400 transition-all font-medium ${
                  isListening ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20' : ''
                }`}
              />
              <div className="flex gap-2 self-end">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!myTurn || timeUp || isTranscribing}
                  onClick={toggleListening}
                  title={isListening ? 'Click Stop to finish speaking and send' : 'Click Speak to record your answer'}
                  className={`btn flex items-center justify-center gap-2 py-3.5 px-4 font-bold text-xs md:text-sm rounded-2xl transition-all ${
                    isTranscribing
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-300'
                      : isListening
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-300'
                      : 'bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 shadow-sm'
                  } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                >
                  {isTranscribing ? (
                    <>
                      <Sparkles size={16} className="text-indigo-600 animate-spin" />
                      <span className="hidden sm:inline">Transcribing...</span>
                    </>
                  ) : isListening ? (
                    <>
                      <Square size={13} className="fill-white" />
                      <span className="hidden sm:inline">Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic size={16} className="text-indigo-600" />
                      <span className="hidden sm:inline">Speak</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!myTurn || timeUp || !draft.trim() || isTranscribing}
                  onClick={() => handleSend()}
                  className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40 text-xs md:text-sm py-3.5 px-6 font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  <Send size={16} /> Send Point
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthScreen({
  error,
  onSubmit,
  onHome
}: {
  error: string;
  onSubmit: (mode: 'login' | 'signup', payload: { name: string; email: string; password: string }) => void;
  onHome: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return;
    onSubmit(mode, { name, email, password });
  };

  return (
    <main className="min-h-screen grid-bg relative overflow-hidden flex items-center justify-center px-6 py-12 text-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={onHome} className="flex items-center gap-3 group">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 font-black text-white text-base shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              GD
            </span>
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-slate-100">
              GD <span className="gradient-text-primary">ARENA</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={onHome} className="btn btn-ghost text-xs md:text-sm font-bold shadow-xs">
              <ArrowLeft size={16} /> Skip to Overview
            </button>
          </div>
        </div>

        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          {/* Left Column: Brand Hero */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/90 dark:bg-indigo-950/60 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300 mb-6 shadow-xs">
              <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" /> Group Discussion Intelligence
            </div>
            <h1 className="max-w-xl text-6xl font-black leading-[1.0] tracking-tight text-slate-900 dark:text-slate-100">
              Build the voice people <span className="gradient-text-primary">remember.</span>
            </h1>
            <p className="soft mt-6 max-w-md text-lg leading-relaxed font-medium">
              Step into realistic AI group discussions. Sharpen your arguments, command the room, and get actionable score debriefs.
            </p>

            <div className="mt-10 flex gap-6">
              <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 min-w-[110px] shadow-sm">
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">4</p>
                <p className="soft mt-1 text-xs font-semibold">AI Peer Personas</p>
              </div>
              <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 min-w-[110px] shadow-sm">
                <p className="text-3xl font-black text-purple-600 dark:text-purple-400">9</p>
                <p className="soft mt-1 text-xs font-semibold">Scored Signals</p>
              </div>
              <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 min-w-[110px] shadow-sm">
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">100%</p>
                <p className="soft mt-1 text-xs font-semibold">Actionable Insights</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Glass Card Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass mx-auto w-full max-w-md rounded-3xl p-8 md:p-10 border border-slate-200/90 dark:border-slate-800 shadow-xl relative"
          >
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Welcome to GD Arena</span>
              <h2 className="mt-1.5 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {mode === 'login' ? 'Sign in to Arena' : 'Create Your Account'}
              </h2>
              <p className="soft mt-2 text-sm font-medium">
                {mode === 'login'
                  ? 'Access your practice sessions, saved transcripts, and growth trajectory.'
                  : 'Get personalized feedback from the Judge AI and track discussion readiness.'}
              </p>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <AuthField icon={<UserRound size={17} />} label="Full Name">
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    autoComplete="name"
                  />
                </AuthField>
              )}

              <AuthField icon={<Mail size={17} />} label="Email Address">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </AuthField>

              <AuthField icon={<LockKeyhole size={17} />} label="Password">
                <div className="relative">
                  <input
                    required
                    minLength={8}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </AuthField>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 font-medium"
                >
                  <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary w-full py-3.5 text-sm font-bold shadow-md shadow-indigo-500/25 mt-2"
                type="submit"
              >
                {mode === 'login' ? 'Enter Arena' : 'Create My Account'} <ChevronRight size={17} />
              </motion.button>
            </form>

            <p className="mt-6 text-center text-[11px] leading-relaxed soft font-medium">
              By joining, you agree to practice respectful and structured discussions.
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function AuthField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
      <div className="relative [&_input]:w-full [&_input]:rounded-2xl [&_input]:border [&_input]:border-slate-300 dark:[&_input]:border-slate-700 [&_input]:bg-white dark:[&_input]:bg-slate-900/90 [&_input]:p-3.5 [&_input]:pl-11 [&_input]:pr-10 [&_input]:text-sm [&_input]:text-slate-900 dark:[&_input]:text-slate-100 [&_input]:outline-none [&_input]:placeholder:text-slate-400 dark:[&_input]:placeholder:text-slate-500 [&_input]:focus:border-indigo-600 [&_input]:focus:ring-4 [&_input]:focus:ring-indigo-500/10 [&_input]:shadow-xs">
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function Nav({
  user,
  onHome,
  onLogout,
  onAuth,
  hideThemeToggle = false
}: {
  user?: any;
  onHome: () => void;
  onLogout: () => void;
  onAuth?: () => void;
  hideThemeToggle?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profile = user || (typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('gd_user') || 'null') : null);
  const isAuthenticated = Boolean(profile && profile.email);
  const name = profile?.name || 'User';
  const initials = name
    .split(' ')
    .map((x: string) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <nav className="w-full flex items-center justify-between px-6 md:px-10 py-4 border-b border-slate-200/80 dark:border-slate-800">
      <button onClick={onHome} className="flex items-center gap-3 group text-left cursor-pointer">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 font-black text-white text-base shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
          GD
        </span>
        <span className="font-black text-xl tracking-tight text-slate-900 dark:text-slate-100">
          GD <span className="gradient-text-primary">ARENA</span>
        </span>
      </button>

      <div className="flex items-center gap-3">
        {!hideThemeToggle && <ThemeToggle />}
        {isAuthenticated ? (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-xs group cursor-pointer"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-xs font-black text-white shadow-xs">
                {initials}
              </span>
              <span className="max-w-[130px] truncate font-medium text-slate-800 dark:text-slate-200">{name}</span>
              <ChevronDown
                size={14}
                className={`text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                  open ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  className="glass absolute right-0 top-12 z-50 w-64 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 shadow-xl bg-white/95 dark:bg-slate-900/95"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 px-3 pb-3 pt-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{name}</p>
                    <p className="mt-0.5 truncate text-xs soft">{profile?.email}</p>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors font-medium cursor-pointer"
                    >
                      <UserRound size={16} className="text-indigo-600 dark:text-indigo-400" /> Profile Settings
                    </button>
                    <button
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors font-medium cursor-pointer"
                    >
                      <Settings size={16} className="text-slate-400" /> Room Preferences
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setOpen(false);
                      onLogout();
                    }}
                    className="mt-1 flex w-full items-center gap-3 border-t border-slate-100 dark:border-slate-800 px-3 pt-3 text-xs md:text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors font-semibold cursor-pointer"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onAuth}
              className="btn btn-ghost text-xs md:text-sm py-2 px-4 font-bold shadow-xs"
            >
              Sign In
            </button>
            <button
              onClick={onAuth}
              className="btn btn-primary text-xs md:text-sm py-2 px-4"
            >
              Join Arena
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
