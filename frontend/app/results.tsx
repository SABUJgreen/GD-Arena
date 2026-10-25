'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, CheckCircle2, ChevronRight, Copy, Check, MessageSquare, RotateCcw, TrendingUp, Zap, Sparkles } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export default function Results({ evaluation, messages, again }: { evaluation: any; messages: any[]; again: () => void }) {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const handleTheme = (e: any) => {
      setIsDark(e.detail === 'dark');
    };
    window.addEventListener('gd_theme_change', handleTheme);
    return () => window.removeEventListener('gd_theme_change', handleTheme);
  }, []);

  useEffect(() => {
    // Trigger celebratory multi-colored confetti burst on results load
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
      });
    } catch {
      // Ignore if web environment restricts confetti
    }
  }, []);

  const data = Object.entries(evaluation.scores || {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score: Number(value) || 0
  }));

  const copyTranscript = () => {
    const text = messages.map(m => `[${m.speaker}]: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };

  return (
    <main className="min-h-screen grid-bg text-slate-900 dark:text-slate-100 pb-20">
      <nav className="w-full flex items-center justify-between px-6 md:px-10 py-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 font-black text-white text-base shadow-md shadow-indigo-500/25">
            GD
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100">
            GD <span className="gradient-text-primary">ARENA</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={again}
            className="btn btn-ghost text-xs md:text-sm font-bold shadow-sm"
          >
            <RotateCcw size={16} className="text-indigo-600 dark:text-indigo-400" /> New Session
          </button>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pt-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-end justify-between gap-5"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/90 dark:bg-indigo-950/50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300 shadow-sm">
              <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" /> Session Debrief Complete
            </div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl text-slate-900 dark:text-slate-100">
              Your Performance Breakdown
            </h1>
            <p className="soft mt-2 text-base md:text-lg">
              Here is how your contributions scored across key discussion dimensions.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary"
            onClick={again}
          >
            Practice Again <ChevronRight size={18} />
          </motion.button>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Top Row: Score + Chart */}
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            {/* Score Card */}
            <motion.div variants={itemVariants} className="glass rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group border border-slate-200/90 dark:border-slate-800 shadow-md">
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-200/40 to-fuchsia-200/40 dark:from-indigo-600/20 dark:to-fuchsia-600/20 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Overall Impact Score</span>
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 shadow-sm">
                    <Award size={22} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-8xl font-black tracking-tight gradient-text-primary">
                    {evaluation.overall_score}
                  </span>
                  <span className="text-2xl font-bold text-slate-400 dark:text-slate-500">/ 100</span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 font-semibold">
                  {evaluation.overall_score >= 80 ? '🌟 Exceptional contribution & clarity' : evaluation.overall_score >= 60 ? '⚡ Strong foundation with room to expand' : '🎯 Solid start — focused effort will level this up'}
                </p>
              </div>

              <div className="mt-8 space-y-5 border-t border-slate-100 dark:border-slate-800/80 pt-6">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3">
                    <CheckCircle2 size={16} /> Key Strengths
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.strengths?.map((x: string) => (
                      <li key={x} className="text-xs md:text-sm text-slate-700 dark:text-slate-200 flex items-start gap-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-2xl p-3 shadow-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0">✓</span>
                        <span className="font-medium leading-relaxed">{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400 mb-3">
                    <TrendingUp size={16} /> Growth Edge
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.weaknesses?.map((x: string) => (
                      <li key={x} className="text-xs md:text-sm text-slate-700 dark:text-slate-200 flex items-start gap-2.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 rounded-2xl p-3 shadow-xs">
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold shrink-0">→</span>
                        <span className="font-medium leading-relaxed">{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Chart Card */}
            <motion.div variants={itemVariants} className="glass rounded-3xl p-6 md:p-8 flex flex-col border border-slate-200/90 dark:border-slate-800 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Dimension Scores</h3>
                  <p className="text-xs soft mt-0.5">Scored across key evaluation criteria</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 px-3.5 py-1 rounded-full font-bold shadow-xs">
                  <Zap size={14} className="text-indigo-600 dark:text-indigo-400" /> AI Evaluated
                </div>
              </div>

              <div className="flex-1 min-h-[340px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid stroke={isDark ? '#1e293b' : '#f1f5f9'} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={140}
                      tick={{ fill: isDark ? '#94a3b8' : '#475569', fontSize: 12, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#0f172a' : '#ffffff',
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        fontWeight: 600
                      }}
                      cursor={{ fill: isDark ? 'rgba(129, 140, 248, 0.12)' : 'rgba(99, 102, 241, 0.06)' }}
                    />
                    <Bar
                      dataKey="score"
                      fill={isDark ? '#818cf8' : '#6366f1'}
                      radius={[0, 8, 8, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Actionable Playbook */}
          <motion.div variants={itemVariants} className="glass rounded-3xl p-6 md:p-8 border border-slate-200/90 dark:border-slate-800 shadow-md">
            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <Zap className="text-indigo-600 dark:text-indigo-400" size={20} /> Recommendations Playbook
            </h3>
            <p className="text-sm soft mb-6">Action steps to sharpen your next group discussion contribution</p>

            <div className="grid gap-4 md:grid-cols-3">
              {evaluation.recommendations?.map((rec: string, i: number) => {
                const badgeColors = isDark
                  ? [
                      'bg-blue-950/70 text-blue-300 border-blue-800/80',
                      'bg-purple-950/70 text-purple-300 border-purple-800/80',
                      'bg-rose-950/70 text-rose-300 border-rose-800/80'
                    ]
                  : [
                      'bg-blue-100 text-blue-700 border-blue-200',
                      'bg-purple-100 text-purple-700 border-purple-200',
                      'bg-rose-100 text-rose-700 border-rose-200'
                    ];
                const badgeColor = badgeColors[i % badgeColors.length];
                return (
                  <motion.div
                    key={rec}
                    whileHover={{ y: -3 }}
                    className="glass-card rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/90 shadow-xs relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`grid h-8 w-8 place-items-center rounded-xl font-bold text-xs border ${badgeColor}`}>
                        0{i + 1}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">Action Item</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">{rec}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Transcript Section */}
          <motion.div variants={itemVariants} className="glass rounded-3xl p-6 md:p-8 border border-slate-200/90 dark:border-slate-800 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MessageSquare size={20} className="text-indigo-600 dark:text-indigo-400" /> Session Transcript
                </h3>
                <p className="text-sm soft mt-0.5">{messages.length} total contributions recorded</p>
              </div>
              <button
                onClick={copyTranscript}
                className="btn btn-ghost text-xs py-2 px-3.5 font-bold shadow-xs"
              >
                {copied ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} className="text-indigo-600 dark:text-indigo-400" />}
                <span>{copied ? 'Copied!' : 'Copy Transcript'}</span>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3.5 pr-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              {messages.map((m: any, i: number) => {
                const isUser = m.speaker === 'You';
                return (
                  <div
                    key={i}
                    className={`rounded-2xl p-4 transition-colors ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-50/90 to-violet-50/90 dark:from-indigo-950/50 dark:to-violet-950/50 border border-indigo-200/90 dark:border-indigo-800/80 text-right ml-auto max-w-[85%] shadow-xs'
                        : 'bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 max-w-[85%] shadow-xs'
                    }`}
                  >
                    <div className={`flex items-center gap-2 mb-1.5 text-xs font-bold ${isUser ? 'justify-end text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      <span>{m.speaker}</span>
                      <span className="soft text-[10px] font-normal">· Round {m.round}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{m.content}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
