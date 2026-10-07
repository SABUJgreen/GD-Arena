'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Brain,
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
  Scale
} from 'lucide-react';
import dynamic from 'next/dynamic';

const Results = dynamic(() => import('./results'), { ssr: false });

type Screen = 'auth' | 'home' | 'setup' | 'briefing' | 'discussion' | 'results';
type Message = { speaker: string; role: string; content: string; round: number; timestamp?: string };

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const people = [
  { name: 'Analytical', tag: 'Evidence-led & precise', color: '#63a8ff', glow: 'rgba(99, 168, 255, 0.3)' },
  { name: 'Challenger', tag: 'Pressure tests ideas', color: '#ff7a8a', glow: 'rgba(255, 122, 138, 0.3)' },
  { name: 'Creative', tag: 'Unlocks fresh angles', color: '#c795ff', glow: 'rgba(199, 149, 255, 0.3)' },
  { name: 'Balanced', tag: 'Synthesizes & unifies', color: '#ffca70', glow: 'rgba(255, 202, 112, 0.3)' }
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

  // Check stored user on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('gd_user');
      if (stored) {
        setUser(JSON.parse(stored));
        setScreen('home');
      } else {
        setScreen('auth');
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
    setScreen('auth');
  };

  const start = async () => {
    setError('');
    try {
      const r = await fetch(`${API}/api/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: setup.category,
          difficulty: setup.difficulty,
          duration: setup.duration,
          topic_mode: setup.custom ? 'custom' : 'generated',
          custom_topic: setup.custom || null
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

  const enterDiscussion = () => {
    if (!session) return;
    const startedAt = new Date().toISOString();
    setLiveStartedAt(startedAt);
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
      }
      if (d.type === 'user_turn') {
        setThinking('');
        setMyTurn(true);
      }
      if (d.type === 'completed') {
        setMyTurn(false);
        setEvaluation(d.evaluation);
        setScreen('results');
      }
    };
  };

  const submit = () => {
    if (!draft.trim()) return;
    const w = (window as any).__gdSocket as WebSocket | undefined;
    if (w?.readyState === 1) w.send(JSON.stringify({ content: draft }));
    setDraft('');
    setMyTurn(false);
  };

  const begin = () => setScreen('setup');

  if (screen === 'auth')
    return <AuthScreen error={error} onSubmit={authenticate} onHome={() => setScreen('home')} />;
  if (screen === 'setup')
    return (
      <SetupScreen
        user={user}
        setup={setup}
        setSetup={setSetup}
        error={error}
        onStart={start}
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
        onHome={() => setScreen('home')}
        onLogout={logout}
        onAuth={() => setScreen('auth')}
      />
    );
  if (screen === 'results' && evaluation)
    return <Results evaluation={evaluation} messages={messages} again={() => setScreen('setup')} />;

  return (
    <main className="min-h-screen grid-bg relative overflow-hidden">
      <Nav
        user={user}
        onHome={() => setScreen('home')}
        onLogout={logout}
        onAuth={() => setScreen('auth')}
      />
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="grid items-center gap-12 md:grid-cols-[1.15fr_.85fr]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-300/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest lime backdrop-blur-md shadow-lg shadow-lime-300/10">
              <Sparkles size={14} /> Next-Gen AI Practice Arena
            </div>
            <h1 className="text-5xl font-black leading-[1.02] tracking-tight md:text-7xl lg:text-8xl">
              Think clearly.<br />
              <span className="gradient-text-lime">Speak bodily.</span>
            </h1>
            <p className="soft mt-7 max-w-lg text-lg leading-relaxed font-medium">
              Master structured thinking, active listening, and high-impact contribution with an intelligent AI discussion panel.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary text-base px-6 py-3.5"
                onClick={begin}
              >
                Start New GD <ChevronRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-ghost text-base px-6 py-3.5"
                onClick={() => setScreen('setup')}
              >
                <Play size={16} className="lime" /> Try Demo Setup
              </motion.button>
              {!user && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-ghost text-base px-6 py-3.5"
                  onClick={() => setScreen('auth')}
                >
                  <UserRound size={16} /> Sign In
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Right Panel: Simulated Room Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="glass rounded-3xl p-6 relative group overflow-hidden border border-white/10"
          >
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-lime-300/10 blur-3xl pointer-events-none group-hover:bg-lime-300/20 transition-all duration-700" />
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-extrabold soft">Live Simulation Room</p>
                <p className="mt-1 font-bold text-white text-base">The Future of AI & Human Collaboration</p>
              </div>
              <span className="rounded-full bg-lime-300/10 border border-lime-300/20 px-3 py-1 text-xs font-bold lime flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-lime-400 animate-ping" /> Ready
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {people.map((p, i) => (
                <motion.div
                  key={p.name}
                  whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.06)' }}
                  className="flex items-center gap-3.5 rounded-2xl bg-white/[0.03] border border-white/5 p-3.5 transition-all"
                >
                  <div
                    style={{ background: p.color, boxShadow: `0 0 16px ${p.glow}` }}
                    className="h-10 w-10 shrink-0 rounded-xl text-center flex items-center justify-center text-xs font-black text-slate-950"
                  >
                    0{i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    <p className="text-xs soft">{p.tag}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] font-semibold soft">Active</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-28 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Brain className="lime" size={24} />}
            title="Build Your Thinking"
            text="Practice framing complex problems, articulating trade-offs, and countering weak arguments under real-time pressure."
            delay={0.1}
          />
          <FeatureCard
            icon={<Users className="lime" size={24} />}
            title="4 Distinct Personas"
            text="Engage with specialized AI peer personas: Analytical, Challenger, Creative, and Balanced — each testing different skills."
            delay={0.2}
          />
          <FeatureCard
            icon={<BarChart3 className="lime" size={24} />}
            title="Instant Scored Debrief"
            text="Receive detailed score cards across 9 dimensions, content insights, leadership signals, and an actionable playbook."
            delay={0.3}
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, text, delay }: { icon: React.ReactNode; title: string; text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="glass-card rounded-3xl p-7 border border-white/10 relative overflow-hidden group"
    >
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-lime-300/10 border border-lime-300/20 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-bold text-xl text-white">{title}</h3>
      <p className="soft mt-2.5 text-sm leading-relaxed">{text}</p>
    </motion.div>
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
    <main className="min-h-screen grid-bg relative overflow-hidden flex items-center justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={onHome} className="flex items-center gap-3 group">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300 font-black text-slate-950 text-lg shadow-md shadow-lime-300/20 group-hover:scale-105 transition-transform">
              GD
            </span>
            <span className="font-black text-xl tracking-tight text-white">
              GD <span className="lime">ARENA</span>
            </span>
          </button>
          <button onClick={onHome} className="btn btn-ghost text-xs md:text-sm">
            <ArrowLeft size={16} /> Skip to Overview
          </button>
        </div>

        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          {/* Left Column: Brand Hero */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-300/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest lime mb-6">
              <Sparkles size={13} /> Group Discussion Intelligence
            </div>
            <h1 className="max-w-xl text-6xl font-black leading-[0.96] tracking-tight">
              Build the voice people <span className="gradient-text-lime">remember.</span>
            </h1>
            <p className="soft mt-6 max-w-md text-lg leading-relaxed">
              Step into realistic AI group discussions. Sharpen your arguments, command the room, and get actionable score debriefs.
            </p>

            <div className="mt-10 flex gap-8">
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 min-w-[110px]">
                <p className="text-3xl font-black text-white">4</p>
                <p className="soft mt-1 text-xs font-medium">AI Peer Personas</p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 min-w-[110px]">
                <p className="text-3xl font-black text-white">9</p>
                <p className="soft mt-1 text-xs font-medium">Scored Signals</p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 min-w-[110px]">
                <p className="text-3xl font-black lime">100%</p>
                <p className="soft mt-1 text-xs font-medium">Actionable Insights</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Glass Card Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass mx-auto w-full max-w-md rounded-3xl p-8 md:p-10 border border-white/10 relative"
          >
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider lime">Welcome to GD Arena</span>
              <h2 className="mt-1.5 text-3xl font-bold text-white">
                {mode === 'login' ? 'Sign in to Arena' : 'Create Your Account'}
              </h2>
              <p className="soft mt-1.5 text-xs md:text-sm">
                {mode === 'login' ? 'Continue your structured practice room session.' : 'Start practicing with an intelligent 5-person room.'}
              </p>
            </div>

            {/* Mode Toggle Pills */}
            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-900/80 p-1.5 border border-white/5 relative">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`relative z-10 rounded-xl py-2 text-xs font-bold transition-colors ${
                  mode === 'login' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`relative z-10 rounded-xl py-2 text-xs font-bold transition-colors ${
                  mode === 'signup' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>

              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-y-1.5 rounded-xl bg-lime-300"
                style={{
                  left: mode === 'login' ? '6px' : 'calc(50% + 3px)',
                  width: 'calc(50% - 9px)'
                }}
              />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <AuthField icon={<UserRound size={17} />} label="Full Name">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs soft hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </AuthField>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200 flex items-start gap-2.5"
                >
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary w-full py-3.5 text-sm font-bold"
                type="submit"
              >
                {mode === 'login' ? 'Enter Arena' : 'Create My Account'} <ChevronRight size={17} />
              </motion.button>
            </form>

            <p className="mt-6 text-center text-[11px] leading-relaxed soft">
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
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider soft">{label}</span>
      <div className="relative [&_input]:w-full [&_input]:rounded-2xl [&_input]:border [&_input]:border-white/10 [&_input]:bg-white/[0.04] [&_input]:p-3.5 [&_input]:pl-11 [&_input]:pr-10 [&_input]:text-sm [&_input]:text-white [&_input]:outline-none [&_input]:placeholder:text-slate-500 [&_input]:focus:border-lime-300/60 [&_input]:focus:bg-white/[0.07]">
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 soft">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function Nav({
  user,
  onHome,
  onLogout,
  onAuth
}: {
  user?: any;
  onHome: () => void;
  onLogout: () => void;
  onAuth?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const profile = user || (typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('gd_user') || 'null') : null);
  const isAuthenticated = Boolean(profile && profile.email);
  const name = profile?.name || 'User';
  const initials = name
    .split(' ')
    .map((x: string) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 border-b border-white/5">
      <button onClick={onHome} className="flex items-center gap-3 group text-left">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300 font-black text-slate-950 text-lg shadow-md shadow-lime-300/20 group-hover:scale-105 transition-transform">
          GD
        </span>
        <span className="font-black text-xl tracking-tight text-white">
          GD <span className="lime">ARENA</span>
        </span>
      </button>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs md:text-sm font-semibold text-white hover:border-white/20 transition-all"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-lime-300 text-xs font-extrabold text-slate-950">
                {initials}
              </span>
              <span className="max-w-[120px] truncate">{name}</span>
              <span className="soft text-xs">⌄</span>
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  className="glass absolute right-0 top-12 z-50 w-64 rounded-2xl p-3 border border-white/15 shadow-2xl"
                >
                  <div className="border-b border-white/10 px-3 pb-3 pt-1">
                    <p className="font-bold text-sm text-white">{name}</p>
                    <p className="mt-0.5 truncate text-xs soft">{profile?.email}</p>
                  </div>

                  <div className="py-2 space-y-1">
                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-200 hover:bg-white/10 transition-colors">
                      <UserRound size={16} className="lime" /> Profile Settings
                    </button>
                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-200 hover:bg-white/10 transition-colors">
                      <Settings size={16} className="soft" /> Room Preferences
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setOpen(false);
                      onLogout();
                    }}
                    className="mt-1 flex w-full items-center gap-3 border-t border-white/10 px-3 pt-3 text-xs md:text-sm text-red-300 hover:text-red-200 transition-colors font-semibold"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAuth || onLogout}
            className="btn btn-primary text-xs md:text-sm py-2 px-4 font-bold"
          >
            <UserRound size={16} /> Sign In / Register
          </motion.button>
        )}
      </div>
    </nav>
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
  const categories = ['General', 'Sales', 'Product Management', 'Marketing', 'GTM', 'Consulting', 'MBA', 'Technology', 'Current Affairs', 'Abstract'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  const durations = [4, 8, 12, 16];

  return (
    <main className="min-h-screen grid-bg pb-20">
      <Nav user={user} onHome={onHome} onLogout={onLogout} onAuth={onAuth} />
      <section className="mx-auto max-w-5xl px-6 pt-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="lime text-xs font-bold uppercase tracking-widest">Arena Configuration</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl text-white">
            Set Your Practice Room
          </h1>
          <p className="soft mt-3 max-w-xl text-base md:text-lg">
            Choose your category, duration, and challenge level. Your 4 AI peer personas will adapt to your choices.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 border border-white/10 space-y-8"
        >
          {/* Category Selection */}
          <div>
            <label className="block mb-3 text-sm font-bold text-slate-200">Discussion Category</label>
            <div className="flex flex-wrap gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSetup({ ...setup, category: cat })}
                  className={`rounded-2xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all ${
                    setup.category === cat
                      ? 'bg-lime-300 text-slate-950 font-bold shadow-md shadow-lime-300/20'
                      : 'bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty & Duration Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block mb-3 text-sm font-bold text-slate-200">Challenge Level</label>
              <div className="grid grid-cols-3 gap-2.5">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSetup({ ...setup, difficulty: diff })}
                    className={`rounded-2xl py-3 text-xs md:text-sm font-semibold transition-all text-center ${
                      setup.difficulty === diff
                        ? 'bg-lime-300 text-slate-950 font-bold shadow-md shadow-lime-300/20'
                        : 'bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-3 text-sm font-bold text-slate-200">Room Duration</label>
              <div className="grid grid-cols-4 gap-2.5">
                {durations.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSetup({ ...setup, duration: dur })}
                    className={`rounded-2xl py-3 text-xs md:text-sm font-semibold transition-all text-center ${
                      setup.duration === dur
                        ? 'bg-lime-300 text-slate-950 font-bold shadow-md shadow-lime-300/20'
                        : 'bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    {dur} min
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Topic */}
          <div>
            <label className="block mb-2 text-sm font-bold text-slate-200">Custom Topic Prompt (Optional)</label>
            <input
              placeholder="e.g. Should AI models be open-source by mandate? (Leave blank to generate topic)"
              value={setup.custom}
              onChange={(e) => setSetup({ ...setup, custom: e.target.value })}
              className="glass-input w-full rounded-2xl p-4 text-sm font-medium placeholder:text-slate-500"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs md:text-sm text-red-200 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary w-full py-4 text-base font-bold"
            onClick={onStart}
          >
            Enter the Arena <ChevronRight size={18} />
          </motion.button>
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
  const rules = [
    'Stay directly relevant to the topic and actively build upon prior points.',
    'Keep each contribution concise and structured: target 50–100 words.',
    'Disagree with points respectfully, grounding counterpoints in logic or examples.',
    'You will have 2 active speaking turns before the Judge completes evaluation.'
  ];

  const criteria = [
    ['Content & Context', 'Relevance of facts, examples, and contextual depth.'],
    ['Reasoning & Logic', 'Clarity of cause-and-effect, trade-off analysis, and counterpoints.'],
    ['Structure & Tone', 'Pacing, clarity, conciseness, and delivery.'],
    ['Room Dynamics', 'Active listening, synthesizing views, and steering the room forward.']
  ];

  return (
    <main className="min-h-screen grid-bg pb-20">
      <Nav user={user} onHome={onHome} onLogout={onLogout} onAuth={onAuth} />
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/30 bg-lime-300/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest lime">
              <ShieldCheck size={14} /> Judge Briefing · {session.category}
            </div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl text-white">
              Room Briefing & Objective
            </h1>
          </div>
          <div className="glass rounded-2xl px-5 py-3 text-xs md:text-sm font-semibold border border-white/10">
            <span className="soft">Format:</span> <span className="text-white ml-2">{session.duration} min · {session.difficulty}</span>
          </div>
        </motion.div>

        {/* Main Topic Box */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 md:p-8 border border-white/10"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-300/10 border border-lime-300/20 px-3 py-1 text-xs font-bold uppercase tracking-wider lime mb-3">
                <Sparkles size={13} /> Active Discussion Topic
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug max-w-4xl">
                {session.topic}
              </h2>
            </div>
            <span className="rounded-full bg-white/[0.04] border border-white/10 px-3.5 py-1.5 text-xs font-semibold soft">
              {session.category}
            </span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider soft mb-2">Context & Guidelines</p>
              <p className="soft text-sm md:text-base leading-relaxed">
                This discussion tests your ability to take a structured stance on complex issues. Acknowledge opposing perspectives, highlight trade-offs, and make a practical contribution.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-widest font-extrabold soft">Core Goal</p>
                  <p className="mt-1.5 text-sm font-semibold text-white">Elevate the room clarity with every turn.</p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-widest font-extrabold soft">Turn Strategy</p>
                  <p className="mt-1.5 text-sm font-semibold text-white">Listen → Claim → Evidence → Connect.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-lime-300/30 bg-lime-300/[0.04] p-6">
              <p className="font-bold text-sm lime mb-3 flex items-center gap-2">
                <Zap size={16} /> High Impact Formula
              </p>
              <div className="space-y-3 text-xs md:text-sm text-slate-200">
                <p><span className="lime font-bold">01</span> State your thesis or response directly.</p>
                <p><span className="lime font-bold">02</span> Back it up with a practical example or logic.</p>
                <p><span className="lime font-bold">03</span> Address a trade-off or counter-point.</p>
                <p><span className="lime font-bold">04</span> Conclude with a question or transition.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rules & Criteria */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass rounded-3xl p-6 border border-white/10">
            <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="lime" size={18} /> Room Rules
            </h3>
            <div className="space-y-3">
              {rules.map((r, i) => (
                <div key={r} className="flex gap-3 text-xs md:text-sm text-slate-300 leading-relaxed">
                  <span className="lime font-bold">0{i + 1}</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass rounded-3xl p-6 border border-white/10">
            <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
              <BarChart3 className="lime" size={18} /> Judge Scored Criteria
            </h3>
            <div className="space-y-3">
              {criteria.map(([t, d]) => (
                <div key={t}>
                  <p className="text-xs md:text-sm font-bold text-white">{t}</p>
                  <p className="text-xs soft mt-0.5">{d}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5">
          <div>
            <p className="font-bold text-sm text-white">Discussion Room Panel</p>
            <p className="text-xs soft mt-0.5">Analytical · Challenger · Creative · Balanced · You</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-ghost text-xs md:text-sm" onClick={onBack}>
              Adjust Setup
            </button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="btn btn-primary text-xs md:text-sm font-bold" onClick={onStart}>
              Start Discussion <ChevronRight size={17} />
            </motion.button>
          </div>
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
  persona: { name: string; tag: string; color: string; glow: string };
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
      transition={{ duration: 0.2 }}
      onClick={onOpenHistory}
      style={{
        borderColor: isPersonaThinking ? persona.color : 'rgba(255, 255, 255, 0.12)',
        boxShadow: isPersonaThinking ? `0 0 24px ${persona.glow}` : '0 10px 30px rgba(0,0,0,0.3)'
      }}
      className={`relative rounded-3xl p-4 md:p-5 border transition-all cursor-pointer min-h-[150px] md:min-h-[170px] flex flex-col justify-between ${
        isPersonaThinking ? 'bg-slate-900/90 border-2' : 'bg-slate-900/75 hover:bg-slate-900/90'
      }`}
    >
      {/* Header info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div
            style={{ background: persona.color, boxShadow: `0 0 12px ${persona.glow}` }}
            className="h-8 w-8 rounded-xl flex items-center justify-center font-black text-slate-950 text-xs shrink-0"
          >
            {persona.name[0]}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white leading-none truncate">{persona.name}</p>
            <p className="text-[10px] soft mt-0.5 truncate">{persona.tag}</p>
          </div>
        </div>

        {latestMessage && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0">
            Round {latestMessage.round}
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="flex-1 overflow-hidden py-1">
        {isPersonaThinking ? (
          <div className="flex items-center gap-2 text-xs lime italic py-2">
            <div className="flex items-center gap-1 h-3">
              <div className="soundwave-bar" />
              <div className="soundwave-bar" />
              <div className="soundwave-bar" />
            </div>
            <span>Formulating response...</span>
          </div>
        ) : latestMessage ? (
          <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
            "{latestMessage.content}"
          </p>
        ) : (
          <p className="text-[11px] italic soft py-2">Standing by for discussion prompt...</p>
        )}
      </div>

      {/* Bottom indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] soft">
        <span>{personaMessages.length} contributions</span>
        <span className="hover:underline flex items-center gap-1 text-slate-400">
          History <ChevronRight size={10} />
        </span>
      </div>
    </motion.div>
  );
}

function JudgeCard({
  thinking,
  myTurn,
  messagesCount,
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
      className="relative rounded-3xl p-5 border-2 border-lime-400/40 bg-gradient-to-b from-slate-900/95 via-slate-900/85 to-slate-950/95 shadow-2xl shadow-lime-400/15 flex flex-col items-center justify-center text-center min-h-[150px] md:min-h-[170px] cursor-pointer"
    >
      {/* Glow Aura */}
      <div className="absolute -inset-1 rounded-3xl bg-lime-400/10 blur-md -z-10 pulse-aura" />

      {/* Judge Icon */}
      <div className="relative mb-2">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-lime-400 to-emerald-300 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-lime-400/20">
          <ShieldCheck size={26} />
        </div>
        {isJudgeActive && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500" />
          </span>
        )}
      </div>

      <h3 className="font-extrabold text-sm text-white tracking-wide uppercase">
        JUDGE AI
      </h3>

      <div className="mt-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-semibold text-slate-300">
        {isJudgeActive ? (
          <span className="lime font-bold animate-pulse">Evaluating Discussion...</span>
        ) : thinking ? (
          <span className="text-cyan-300">Observing {thinking}...</span>
        ) : myTurn ? (
          <span className="lime font-bold">Waiting for You...</span>
        ) : (
          <span>Monitoring Arena</span>
        )}
      </div>

      <p className="mt-2 text-[10px] soft font-medium">
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
  onHome,
  onLogout,
  onAuth
}: any) {
  const totalSeconds = Math.max(1, Number(session.duration || 8) * 60);
  const [remaining, setRemaining] = useState(totalSeconds);
  const [viewMode, setViewMode] = useState<'diamond' | 'feed'>('diamond');
  const [userFlash, setUserFlash] = useState<{ content: string; round: number } | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showRubricModal, setShowRubricModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startedAt = new Date(liveStartedAt || Date.now()).getTime();
    const update = () => setRemaining(Math.max(0, totalSeconds - Math.floor((Date.now() - startedAt) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [liveStartedAt, totalSeconds]);

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

  const handleSend = () => {
    if (!draft.trim() || !myTurn || remaining === 0) return;
    const currentRound = messages.length > 0 ? Math.max(...messages.map((m: Message) => m.round || 1)) : 1;
    setUserFlash({ content: draft.trim(), round: currentRound });
    submit();
  };

  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');
  const timeUp = remaining === 0;

  return (
    <main className="min-h-screen grid-bg pb-12 flex flex-col">
      <Nav user={user} onHome={onHome} onLogout={onLogout} onAuth={onAuth} />
      <section className="mx-auto max-w-6xl px-6 pt-6 flex-1 flex flex-col w-full">
        {/* Header Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 glass rounded-3xl p-5 border border-white/10">
          <div>
            <span className="lime text-[11px] font-bold uppercase tracking-wider">Live Arena · {session.category}</span>
            <h1 className="mt-1 font-bold text-lg md:text-xl text-white truncate max-w-2xl">{session.topic}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center rounded-2xl bg-white/[0.04] p-1 border border-white/10">
              <button
                onClick={() => setViewMode('diamond')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'diamond'
                    ? 'bg-lime-300 text-slate-950 shadow-md shadow-lime-300/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid size={14} /> Diamond Stage
              </button>
              <button
                onClick={() => setViewMode('feed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'feed'
                    ? 'bg-lime-300 text-slate-950 shadow-md shadow-lime-300/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListFilter size={14} /> Timeline Feed
              </button>
            </div>

            <span className={`glass-card rounded-2xl px-4 py-2 text-xs font-bold flex items-center gap-2 ${timeUp ? 'text-red-400 border-red-500/30' : 'lime'}`}>
              <Clock3 size={15} /> {minutes}:{seconds}
            </span>
          </div>
        </div>

        {/* User Flash Dialog Overlay */}
        <AnimatePresence>
          {userFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-lg"
            >
              <div className="relative w-full max-w-2xl text-center space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-lime-300/20 border border-lime-300/60 px-5 py-2 lime font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-lime-300/20 animate-pulse">
                  <Sparkles size={16} /> YOUR ANSWER FLASHED ACROSS ARENA
                </div>

                <div className="bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border-2 border-lime-300/60 rounded-3xl p-6 md:p-8 shadow-2xl shadow-lime-300/20 text-left">
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-8 w-8 rounded-xl bg-lime-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                        YOU
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">Your Submission</p>
                        <p className="text-[10px] soft">Round {userFlash.round} Participant Turn</p>
                      </div>
                    </div>
                    <span className="text-xs lime font-bold flex items-center gap-1">
                      <Zap size={14} /> Live Broadcast Active
                    </span>
                  </div>

                  <p className="text-white text-base md:text-lg font-semibold leading-relaxed max-h-52 overflow-y-auto pr-2">
                    "{userFlash.content}"
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold soft pt-4 border-t border-white/10">
                    <span className="flex items-center gap-1.5 lime">
                      <Zap size={14} /> Received by Analytical, Challenger, Creative & Balanced
                    </span>
                    <span className="flex items-center gap-1 text-cyan-300">
                      <ShieldCheck size={14} /> Judge AI Scoring Active
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setUserFlash(null)}
                  className="btn btn-ghost text-xs py-2.5 px-6 rounded-full text-slate-300 border-white/20 hover:bg-white/10"
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
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
            >
              <div className="glass rounded-3xl p-6 w-full max-w-xl border border-white/10 space-y-4 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ background: people.find(p => p.name === selectedAgent)?.color || '#a7f65b' }}
                      className="h-8 w-8 rounded-xl font-black text-slate-950 text-xs flex items-center justify-center"
                    >
                      {selectedAgent[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{selectedAgent} History</h3>
                      <p className="text-xs soft">All contributions in this arena session</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAgent(null)} className="text-slate-400 hover:text-white p-1">
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
                        <div key={i} className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 text-xs space-y-1.5">
                          <span className="soft text-[10px] font-bold">Round {m.round}</span>
                          <p className="text-slate-200 leading-relaxed">{m.content}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Discussion Layout */}
        <div className="flex-1 flex flex-col w-full gap-6">
          {viewMode === 'diamond' ? (
            /* Diamond 4-Agent Stage matching Image 2 */
            <div className="glass flex-1 rounded-3xl p-4 md:p-8 border border-white/10 flex flex-col justify-between relative overflow-hidden min-h-[540px]">
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
            /* Feed View (Image 1 Style Fallback) */
            <div className="glass flex flex-col rounded-3xl border border-white/10 min-h-[540px]">
              <div className="flex-1 space-y-4 overflow-y-auto p-6 max-h-[520px]">
                {messages.length === 0 && (
                  <div className="grid h-full place-items-center text-center py-16">
                    <div>
                      <MessageSquareText className="mx-auto mb-3 lime animate-bounce" size={40} />
                      <p className="font-bold text-lg text-white">The Moderator is initializing the room...</p>
                      <p className="soft mt-1.5 text-xs md:text-sm">Listen closely to peer perspectives. Your turn will prompt shortly.</p>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {messages.map((m: Message, i: number) => {
                    const isUser = m.speaker === 'You';
                    const personaColor = people.find((p) => p.name === m.speaker)?.color || '#a7f65b';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-3 ${isUser ? 'flex-row-reverse text-right' : ''}`}
                      >
                        <div
                          className="mt-1 h-9 w-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs text-slate-950 shadow-md"
                          style={{ background: isUser ? '#a7f65b' : personaColor }}
                        >
                          {isUser ? 'YOU' : m.speaker[0]}
                        </div>
                        <div className="max-w-[78%]">
                          <div className={`mb-1 flex items-center gap-2 text-xs ${isUser ? 'justify-end lime font-bold' : 'text-slate-300 font-semibold'}`}>
                            <span>{m.speaker}</span>
                            <span className="soft text-[10px] font-normal">· Round {m.round}</span>
                          </div>
                          <div
                            className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                              isUser
                                ? 'bg-lime-300/10 border border-lime-300/30 text-slate-100'
                                : 'bg-white/[0.04] border border-white/10 text-slate-200'
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 w-fit">
                    <div className="flex items-center gap-1 h-3">
                      <div className="soundwave-bar" />
                      <div className="soundwave-bar" />
                      <div className="soundwave-bar" />
                    </div>
                    <span className="text-xs italic soft"><strong className="text-slate-200">{thinking}</strong> is formulating a point...</span>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input Footer matching Image 2 */}
          <div className="glass rounded-3xl border border-white/10 p-5">
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span className={myTurn ? 'lime font-bold flex items-center gap-1.5' : 'soft font-medium'}>
                {timeUp ? (
                  'Discussion time expired'
                ) : myTurn ? (
                  <>
                    <Sparkles size={14} /> Your turn — deliver your key argument!
                  </>
                ) : (
                  'Waiting for active speaker...'
                )}
              </span>
              <span className="soft">{draft.length} / 500</span>
            </div>

            <div className="flex gap-3">
              <textarea
                disabled={!myTurn || timeUp}
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
                    ? 'Discussion ended. Waiting for final evaluation...'
                    : myTurn
                    ? 'State your argument, back it up, and connect forward... (Cmd/Ctrl + Enter to send)'
                    : 'Listening to discussion panel...'
                }
                className="min-h-[60px] flex-1 resize-none glass-input rounded-2xl p-4 text-xs md:text-sm placeholder:text-slate-500"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={!myTurn || timeUp || !draft.trim()}
                onClick={handleSend}
                className="btn btn-primary self-end disabled:cursor-not-allowed disabled:opacity-40 text-xs md:text-sm py-3.5 px-6 font-bold"
              >
                <Send size={16} /> Send
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
