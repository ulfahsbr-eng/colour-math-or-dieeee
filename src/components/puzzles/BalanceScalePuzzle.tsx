import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, Scale, Plus, Minus, Send, Check, AlertCircle } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface BalanceScalePuzzleProps {
  onSolved: () => void;
}

export const BalanceScalePuzzle: React.FC<BalanceScalePuzzleProps> = ({ onSolved }) => {
  // Target: Dania got 18 out of 25 = 18/25 = 72%
  const targetPercent = 72;
  const [currentWeight, setCurrentWeight] = useState<number>(50); // Starts tilted
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; msg: string } | null>(null);

  // Tilt angle: positive means left is heavier, negative means right is heavier
  const leftRatio = 18 / 25; // 0.72
  const rightRatio = currentWeight / 100;
  const diff = leftRatio - rightRatio;
  const tiltDeg = Math.max(-25, Math.min(25, diff * 120));

  const adjustWeight = (delta: number) => {
    if (isUnlocked) return;
    const next = Math.max(0, Math.min(100, currentWeight + delta));
    setCurrentWeight(next);
    setFeedback(null);
    soundManager.playFootstep();
  };

  const handleSubmit = () => {
    if (isUnlocked) {
      onSolved();
      return;
    }

    if (currentWeight === targetPercent) {
      setIsUnlocked(true);
      setFeedback({
        type: 'correct',
        msg: 'TAHNIAH! Neraca berada pada keseimbangan 0° sempurna! 18 / 25 = 72 / 100 = 72%. Kunci Pintu Kuning dibuka!',
      });
      soundManager.playCorrectAnswer();
    } else {
      soundManager.playWrongAnswer();
      if (currentWeight < targetPercent) {
        setFeedback({
          type: 'wrong',
          msg: `Neraca masih senget ke kiri (${currentWeight}%). Piring kanan terlalu ringan! Tambah peratus sehingga mencapai 18/25.`,
        });
      } else {
        setFeedback({
          type: 'wrong',
          msg: `Neraca senget ke kanan (${currentWeight}%). Piring kanan terlalu berat! Kurangkan sedikit peratusan.`,
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Mission Prompt */}
      <div className="p-3 bg-yellow-950/60 border border-yellow-500/50 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Misi Puzzle Neraca Kadaran Seimbang</span>
        </div>
        <p className="text-sm text-neutral-200">
          Dania mendapat <strong>18 daripada 25 markah penuh</strong>. Seimbangkan neraca kadaran ini dengan melaras berat peratusan pada piring kanan, kemudian tekan butang <strong>Hantar & Kunci Neraca</strong>!
        </p>
      </div>

      {/* Interactive 2D Visual Balance Scale */}
      <div className="relative bg-neutral-950 p-6 rounded-2xl border border-neutral-800 flex flex-col items-center">
        {/* Fulcrum & Tilting Beam */}
        <div className="relative w-64 h-36 flex flex-col items-center justify-center">
          {/* Pivoting Beam */}
          <div
            className="w-56 h-3.5 rounded-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 shadow-lg relative flex items-center justify-between px-2 transition-transform duration-200"
            style={{ transform: `rotate(${-tiltDeg}deg)` }}
          >
            {/* Center Pivot Pin */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-900 border-2 border-yellow-300 shadow" />

            {/* Left Pan (18/25) */}
            <div className="absolute -left-3 top-3 flex flex-col items-center">
              <div className="w-0.5 h-10 bg-neutral-400" />
              <div className="px-3 py-1.5 bg-neutral-900 border-2 border-yellow-500 rounded-xl text-center shadow-md">
                <span className="text-[10px] text-neutral-400 block font-bold">Markah</span>
                <span className="text-xs font-black font-mono text-yellow-400">18 / 25</span>
              </div>
            </div>

            {/* Right Pan (p / 100) */}
            <div className="absolute -right-3 top-3 flex flex-col items-center">
              <div className="w-0.5 h-10 bg-neutral-400" />
              <div
                className={`px-3 py-1.5 bg-neutral-900 border-2 rounded-xl text-center shadow-md transition ${
                  currentWeight === targetPercent
                    ? 'border-emerald-400 bg-emerald-950/60'
                    : 'border-yellow-500'
                }`}
              >
                <span className="text-[10px] text-neutral-400 block font-bold">Kadaran %</span>
                <span
                  className={`text-xs font-black font-mono ${
                    currentWeight === targetPercent ? 'text-emerald-400' : 'text-yellow-400'
                  }`}
                >
                  {currentWeight} / 100
                </span>
              </div>
            </div>
          </div>

          {/* Stand / Pillar */}
          <div className="w-4 h-16 bg-neutral-800 rounded-b-lg border-x border-neutral-700 mt-2" />
          <div className="w-24 h-3 bg-neutral-800 rounded-full border border-neutral-700 shadow" />
        </div>

        {/* Equilibrium Indicator */}
        <div className="mt-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-mono font-bold text-neutral-300">
            Status Neraca:{' '}
            {currentWeight === targetPercent ? (
              <span className="text-emerald-400 font-black">SEIMBANG SEMPURNA (0°)</span>
            ) : currentWeight < targetPercent ? (
              <span className="text-amber-400">Piring Kanan Ringan (Tambah Peratus)</span>
            ) : (
              <span className="text-rose-400">Piring Kanan Berat (Kurangkan Peratus)</span>
            )}
          </span>
        </div>
      </div>

      {/* Tactile Controls: Sliders and +/- Buttons */}
      <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-400">Nilai Peratusan (p):</span>
          <span className="text-lg font-black text-yellow-400 font-mono">{currentWeight}%</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={currentWeight}
          disabled={isUnlocked}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            setCurrentWeight(v);
            setFeedback(null);
          }}
          className="w-full accent-yellow-400 cursor-pointer h-2 bg-neutral-800 rounded-lg"
        />

        {/* Increment / Decrement Buttons */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={isUnlocked}
            onClick={() => adjustWeight(-5)}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-mono font-bold text-neutral-200 rounded-lg border border-neutral-700 transition cursor-pointer"
          >
            -5%
          </button>
          <button
            type="button"
            disabled={isUnlocked}
            onClick={() => adjustWeight(-1)}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={isUnlocked}
            onClick={() => adjustWeight(1)}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={isUnlocked}
            onClick={() => adjustWeight(5)}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-mono font-bold text-neutral-200 rounded-lg border border-neutral-700 transition cursor-pointer"
          >
            +5%
          </button>
        </div>
      </div>

      {/* Real-time Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
            feedback.type === 'correct'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          {feedback.type === 'correct' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-bold block">
              {feedback.type === 'correct' ? 'NERACA SEIMBANG!' : 'KEDUDUKAN BELUM SEIMBANG'}
            </span>
            <p className="mt-0.5 text-neutral-200 leading-relaxed">{feedback.msg}</p>
          </div>
        </div>
      )}

      {/* Hint toggle */}
      {showHint && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-300">
          <strong className="text-yellow-400">Petunjuk Kadaran:</strong> Gunakan formula kadaran:
          <br />
          <code>18 / 25 = p / 100</code>
          <br />
          Darabkan silang: p = (18 × 100) ÷ 25 = 18 × 4 = <strong>72%</strong>!
        </div>
      )}

      {/* Main Submit Button & Hint */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition active:scale-98 cursor-pointer ${
            isUnlocked
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
              : 'bg-yellow-500 hover:bg-yellow-400 text-neutral-950 shadow-yellow-900/50'
          }`}
        >
          {isUnlocked ? (
            <>
              <Check className="w-5 h-5" />
              <span>Buka Pintu Kuning & Masuk ➜</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Hantar & Kunci Neraca ({currentWeight}%)</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-yellow-400" />
            <span>{showHint ? 'Sembunyikan Petunjuk' : 'Lihat Bantuan Formula'}</span>
          </button>
          <span className="text-[11px] text-neutral-500 font-mono">
            Kadaran: 18 / 25
          </span>
        </div>
      </div>
    </div>
  );
};
