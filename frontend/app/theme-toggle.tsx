'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const handleCustomChange = (e: any) => {
      const next = e.detail === 'dark' ? 'dark' : 'light';
      setTheme(next);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'gd_theme') {
        const next = e.newValue === 'dark' ? 'dark' : 'light';
        setTheme(next);
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        window.dispatchEvent(new CustomEvent('gd_theme_change', { detail: next }));
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('gd_theme_change', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('gd_theme_change', handleCustomChange);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('gd_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('gd_theme_change', { detail: next }));
  };

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-2xl border border-slate-200 dark:border-slate-800 ${className}`} />
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
      aria-label="Toggle light/dark theme"
      className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-2xl border transition-all shadow-xs cursor-pointer ${
        theme === 'dark'
          ? 'bg-slate-800/90 border-slate-700 text-amber-400 hover:bg-slate-700 hover:border-amber-400/50 shadow-slate-950/40'
          : 'bg-white border-slate-200 hover:bg-slate-50 text-indigo-600 hover:border-indigo-300 shadow-slate-100'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun size={17} className="transition-transform group-hover:rotate-45" />
      ) : (
        <Moon size={17} className="transition-transform group-hover:-rotate-12 text-slate-700" />
      )}
    </motion.button>
  );
}
