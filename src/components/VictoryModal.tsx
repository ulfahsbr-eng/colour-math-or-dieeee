import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, RotateCcw, Home, Award, Sparkles, CheckCircle2, ShieldCheck, Flame, BookOpen, Volume2 } from 'lucide-react';
import { COLOR_DEFINITIONS } from '../data/mathQuestions';
import { DoorColor } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface VictoryModalProps {
  score: number;
  timeTakenSec: number;
  onRestart: () => void;
  onGoHome: () => void;
  onOpenNotes?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  score,
  timeTakenSec,
  onRestart,
  onGoHome,
  onOpenNotes,
}) => {
  useEffect(() => {
    // Sound fanfare
    soundManager.playVictory();

    // Epic celebratory firework explosions
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: number = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left and right cannons
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ffd700', '#22c55e', '#3b82f6', '#ec4899', '#f97316', '#a855f7'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ffd700', '#22c55e', '#3b82f6', '#ec4899', '#f97316', '#a855f7'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handlePlayFanfare = () => {
    soundManager.playVictory();
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
    });
  };

  const doorsList: { id: DoorColor; name: string; topic: string }[] = [
    { id: 'red', name: 'Merah', topic: 'Nisbah & Peratusan' },
    { id: 'orange', name: 'Jingga', topic: 'Pecahan & Perpuluhan' },
    { id: 'yellow', name: 'Kuning', topic: 'Konsep Kadaran' },
    { id: 'green', name: 'Hijau', topic: 'Perkaitan Kadar' },
    { id: 'blue', name: 'Biru', topic: 'Nisbah 3 Kuantiti' },
    { id: 'purple', name: 'Ungu', topic: 'Aplikasi Masalah' },
    { id: 'white', name: 'Putih', topic: 'Pelepasan Mutlak' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl overflow-y-auto select-none font-['Fredoka',sans-serif]">
      {/* Animated Background Rays and Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-emerald-950/40 to-neutral-950 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-400/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />

      {/* Main Epic Card */}
      <div className="relative w-full max-w-2xl bg-neutral-900/95 border-2 border-amber-400/80 rounded-3xl p-5 sm:p-8 text-center text-white shadow-[0_0_60px_rgba(245,158,11,0.35)] my-auto z-10">
        {/* Glow Header Top Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border border-amber-400/60 text-amber-300 text-xs sm:text-sm font-black uppercase tracking-wider mb-3 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Pengiktirafan Tertinggi • KSSM Matematik Tingkatan 1</span>
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
        </div>

        {/* Grand Golden Trophy Badge with Animated Halo */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3">
          {/* Pulsing ring aura */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 opacity-60 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-yellow-200 flex items-center justify-center text-neutral-950 shadow-2xl shadow-amber-500/50 transform hover:scale-105 transition-transform duration-300">
            <Trophy className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md text-amber-950" />
            <div className="absolute -top-2 -right-2 bg-emerald-500 border-2 border-white rounded-full p-1 text-white shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 5-Star Rating */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          ))}
        </div>

        {/* Epic Main Heading */}
        <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400 tracking-tight uppercase mb-1 drop-shadow-md">
          TAHNIAH! ANDA LOLOS!
        </h2>
        <p className="text-sm sm:text-base font-bold text-emerald-400 mb-2">
          🌟 Gelaran: PENAKLUK LEGENDA LABIRIN MATEMATIK (Gred A+ Cemerlang) 🌟
        </p>

        <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto mb-5 leading-relaxed">
          Semua 7 pintu gerbang berjaya dirungkai dengan tepat! Anda telah membuktikan penguasaan sempurna dalam menghubungkaitkan nisbah, kadar, kadaran dengan peratusan, pecahan dan perpuluhan (Bab 4.5).
        </p>

        {/* Stats Highlight Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="bg-neutral-950/90 p-3 rounded-2xl border border-amber-500/30 shadow-inner">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">Jumlah Markah</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{score} PTS</span>
          </div>

          <div className="bg-neutral-950/90 p-3 rounded-2xl border border-emerald-500/30 shadow-inner">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">Masa Teroka</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{formatTime(timeTakenSec)}</span>
          </div>

          <div className="bg-neutral-950/90 p-3 rounded-2xl border border-cyan-500/30 shadow-inner">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">Pintu Dibuka</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">7 / 7 (100%)</span>
          </div>

          <div className="bg-neutral-950/90 p-3 rounded-2xl border border-purple-500/30 shadow-inner">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">Raksasa Bayang</span>
            <span className="text-xs sm:text-sm font-black text-purple-300 flex items-center justify-center gap-1 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tewas & Elak
            </span>
          </div>
        </div>

        {/* 7 Colors Mastered Badge Shelf */}
        <div className="bg-neutral-950/80 p-3 sm:p-4 rounded-2xl border border-neutral-800 mb-5 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Meterai 7 Pintu Warna Yang Dikuasai:
            </span>
            <span className="text-[11px] font-bold text-emerald-400">7/7 Selesai</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {doorsList.map((d) => {
              const def = COLOR_DEFINITIONS[d.id];
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700/70"
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/60"
                    style={{ backgroundColor: def.hex }}
                  />
                  <div className="overflow-hidden text-left">
                    <span className="block text-xs font-bold text-white truncate">{d.name}</span>
                    <span className="block text-[10px] text-neutral-400 truncate">{d.topic}</span>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-center px-2 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Pakar KSSM
            </div>
          </div>
        </div>

        {/* Audio Fanfare Replay Button */}
        <div className="flex justify-center mb-5">
          <button
            onClick={handlePlayFanfare}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Mainkan Bunyi Fanfare Kemenangan Sekali Lagi 🎺</span>
          </button>
        </div>

        {/* Action Buttons: Play Again, Return to Play Cover Page, Review Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={onRestart}
            className="py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-98 text-sm uppercase tracking-wide"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Semula</span>
          </button>

          <button
            onClick={onGoHome}
            className="py-3.5 px-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-neutral-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all active:scale-98 text-sm uppercase tracking-wide"
          >
            <Home className="w-4 h-4" />
            <span>Halaman Play Page</span>
          </button>

          {onOpenNotes && (
            <button
              onClick={onOpenNotes}
              className="py-3.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-2xl flex items-center justify-center gap-2 border border-neutral-700 transition active:scale-98 text-sm"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Nota Poket</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
