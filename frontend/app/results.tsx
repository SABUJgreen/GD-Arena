'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, CheckCircle2, ChevronRight, Copy, Check, MessageSquare, RotateCcw, TrendingUp, Zap, Sparkles } from 'lucide-react';

export default function Results({ evaluation, messages, again }: { evaluation: any; messages: any[]; again: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Trigger celebratory confetti burst on results load
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a7f65b', '#63a8ff', '#c795ff', '#ffca70']
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
    <main className="min-h-screen grid-bg text-slate-100 pb-20">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-400 font-black text-slate-950 shadow-lg shadow-lime-300/20">
            GD
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            GD <span className="lime">ARENA</span>
          </span>
        </div>
        <button
          onClick={again}
          className="btn btn-ghost text-xs md:text-sm"
        >
          <RotateCcw size={16} /> New Session
        </button>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pt-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-end justify-between gap-5"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-xs font-bold uppercase tracking-widest lime">
              <Sparkles size={13} /> Session Debrief Complete
            </div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
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
            <motion.div variants={itemVariants} className="glass rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-lime-300/10 blur-3xl pointer-events-none group-hover:bg-lime-300/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider soft">Overall Impact Score</span>
                  <Award className="lime" size={24} />
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-8xl font-black tracking-tight gradient-text-lime">
                    {evaluation.overall_score}
                  </span>
                  <span className="text-xl font-bold soft">/ 100</span>
                </div>
                <p className="mt-2 text-sm text-slate-300 font-medium">
                  {evaluation.overall_score >= 80 ? '🌟 Exceptional contribution & clarity' : evaluation.overall_score >= 60 ? '⚡ Strong foundation with room to expand' : '🎯 Solid start — focused effort will level this up'}
                </p>
              </div>

              <div className="mt-8 space-y-5 border-t border-white/10 pt-6">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-400 mb-3">
                    <CheckCircle2 size={16} /> Key Strengths
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.strengths?.map((x: string) => (
                      <li key={x} className="text-xs md:text-sm text-slate-200 flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5">
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-3">
                    <TrendingUp size={16} /> Growth Edge
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.weaknesses?.map((x: string) => (
                      <li key={x} className="text-xs md:text-sm text-slate-300 flex items-start gap-2 bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5">
                        <span className="text-amber-400 font-bold shrink-0">→</span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Chart Card */}
            <motion.div variants={itemVariants} className="glass rounded-3xl p-6 flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white">Dimension Scores</h3>
                  <p className="text-xs soft mt-0.5">Scored across key evaluation criteria</p>
                </div>
                <div className="flex items-center gap-1 text-xs lime bg-lime-300/10 border border-lime-300/20 px-3 py-1 rounded-full font-semibold">
                  <Zap size={14} /> AI Evaluated
                </div>
              </div>

              <div className="flex-1 min-h-[340px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={140}
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        color: '#f8fafc'
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                    />
                    <Bar
                      dataKey="score"
                      fill="#a7f65b"
                      radius={[0, 8, 8, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Actionable Playbook */}
          <motion.div variants={itemVariants} className="glass rounded-3xl p-6 md:p-8">
            <h3 className="font-bold text-xl text-white mb-1 flex items-center gap-2">
              <Zap className="lime" size={20} /> Recommendations Playbook
            </h3>
            <p className="text-sm soft mb-6">Action steps to sharpen your next group discussion contribution</p>

            <div className="grid gap-4 md:grid-cols-3">
              {evaluation.recommendations?.map((rec: string, i: number) => (
                <motion.div
                  key={rec}
                  whileHover={{ y: -3 }}
                  className="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-lime-300/10 font-bold text-sm lime">
                      0{i + 1}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold soft">Action Item</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">{rec}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Transcript Section */}
          <motion.div variants={itemVariants} className="glass rounded-3xl p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                  <MessageSquare size={20} className="lime" /> Session Transcript
                </h3>
                <p className="text-sm soft mt-0.5">{messages.length} total contributions recorded</p>
              </div>
              <button
                onClick={copyTranscript}
                className="btn btn-ghost text-xs py-2 px-3"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Transcript'}</span>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-2 border-t border-white/10 pt-4">
              {messages.map((m: any, i: number) => (
                <div
                  key={i}
                  className={`rounded-2xl p-4 transition-colors ${
                    m.speaker === 'You'
                      ? 'bg-lime-300/5 border border-lime-300/20 text-right ml-auto max-w-[85%]'
                      : 'bg-white/[0.03] border border-white/5 max-w-[85%]'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-1 text-xs font-bold ${m.speaker === 'You' ? 'justify-end lime' : 'text-slate-300'}`}>
                    <span>{m.speaker}</span>
                    <span className="soft text-[10px] font-normal">· Round {m.round}</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{m.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
