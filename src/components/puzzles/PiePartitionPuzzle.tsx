import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, Send, Check, AlertCircle } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface PiePartitionPuzzleProps {
  onSolved: () => void;
}

export const PiePartitionPuzzle: React.FC<PiePartitionPuzzleProps> = ({ onSolved }) => {
  // Ali : Bob : Chan = 2 : 3 : 5 -> Total 10 parts -> Ali: 20%, Bob: 30%, Chan: 50%
  const [chanPercent, setChanPercent] = useState<number>(30); // Starts wrong
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; msg: string } | null>(null);

  // Remaining 100 - chanPercent split in 2:3 ratio
  const remaining = 100 - chanPercent;
  const aliPercent = Math.round(remaining * (2 / 5));
  const bobPercent = remaining - aliPercent;

  const handleSliderChange = (val: number) => {
    if (isUnlocked) return;
    setChanPercent(val);
    setFeedback(null);
    soundManager.playFootstep();
  };

  const handleSubmit = () => {
    if (isUnlocked) {
      onSolved();
      return;
    }

    if (chanPercent === 50) {
      setIsUnlocked(true);
      setFeedback({
        type: 'correct',
        msg: 'TAHNIAH! Sektor tepat! Chan menerima 5 bahagian daripada 10 = 5/10 × 100% = 50%! Kunci Pintu Biru dibuka!',
      });
      soundManager.playCorrectAnswer();
    } else {
      soundManager.playWrongAnswer();
      if (chanPercent < 50) {
        setFeedback({
          type: 'wrong',
          msg: `Bahagian Chan (${chanPercent}%) terlalu kecil! Chan sepatutnya menerima 5 daripada 10 bahagian keseluruhan.`,
        });
      } else {
        setFeedback({
          type: 'wrong',
          msg: `Bahagian Chan (${chanPercent}%) melebihi had! Ingat nisbah Ali : Bob : Chan ialah 2 : 3 : 5.`,
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Mission Prompt */}
      <div className="p-3 bg-blue-950/60 border border-blue-500/50 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Misi Puzzle Pembahagian Nisbah 3 Kuantiti</span>
        </div>
        <p className="text-sm text-neutral-200">
          Wang projek dibahagikan antara Ali, Bob dan Chan mengikut <strong>nisbah 2 : 3 : 5</strong>.
          Laraskan sektor bahagian Chan di bawah supaya sepadan dengan peratusan hakiki Chan (50%), kemudian tekan butang <strong>Hantar & Sahkan</strong>!
        </p>
      </div>

      {/* Visual Pie Slice / Energy Ring */}
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-neutral-950 p-5 rounded-2xl border border-neutral-800">
        {/* SVG Conic Pie Ring */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r="40" fill="#172554" />
            {/* Ali Wedge (20%) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#60a5fa"
              strokeWidth="20"
              strokeDasharray={`${(aliPercent / 100) * 251.2} 251.2`}
              strokeDashoffset="0"
            />
            {/* Bob Wedge (30%) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#38bdf8"
              strokeWidth="20"
              strokeDasharray={`${(bobPercent / 100) * 251.2} 251.2`}
              strokeDashoffset={`-${(aliPercent / 100) * 251.2}`}
            />
            {/* Chan Wedge (50%) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#2563eb"
              strokeWidth="20"
              strokeDasharray={`${(chanPercent / 100) * 251.2} 251.2`}
              strokeDashoffset={`-${((aliPercent + bobPercent) / 100) * 251.2}`}
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-[10px] text-neutral-400 block font-bold">Chan</span>
            <span className="text-lg font-black font-mono text-blue-400">{chanPercent}%</span>
          </div>
        </div>

        {/* Breakdown Breakdown Cards */}
        <div className="flex-1 w-full space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
              <span className="text-sky-300 font-bold block">Ali (2 bahagian)</span>
              <span className="text-sm font-mono font-black text-white">{aliPercent}%</span>
            </div>
            <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
              <span className="text-sky-400 font-bold block">Bob (3 bahagian)</span>
              <span className="text-sm font-mono font-black text-white">{bobPercent}%</span>
            </div>
            <div className="bg-blue-900/60 p-2 rounded-xl border border-blue-500">
              <span className="text-blue-200 font-bold block">Chan (5 bahagian)</span>
              <span className="text-sm font-mono font-black text-blue-300">{chanPercent}%</span>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>0%</span>
              <span className="text-blue-400 font-bold">Laraskan Peratusan Chan</span>
              <span>100%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={chanPercent}
              disabled={isUnlocked}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
            />
          </div>

          {/* Quick Select Buttons */}
          <div className="flex gap-2">
            {[30, 40, 50, 60].map((val) => (
              <button
                key={val}
                type="button"
                disabled={isUnlocked}
                onClick={() => handleSliderChange(val)}
                className={`flex-1 py-1 text-xs font-mono font-bold rounded-lg border transition cursor-pointer ${
                  chanPercent === val
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
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
              {feedback.type === 'correct' ? 'SEKTOR DISAHKAN!' : 'SEKTOR BELUM SEIMBANG'}
            </span>
            <p className="mt-0.5 text-neutral-200 leading-relaxed">{feedback.msg}</p>
          </div>
        </div>
      )}

      {/* Hint toggle */}
      {showHint && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-300">
          <strong className="text-blue-400">Petunjuk 3 Kuantiti:</strong>
          Nisbah = 2 : 3 : 5.
          Jumlah bahagian = 2 + 3 + 5 = 10 bahagian.
          Peratusan Chan = (5 / 10) × 100% = <strong>50%</strong>!
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
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
          }`}
        >
          {isUnlocked ? (
            <>
              <Check className="w-5 h-5" />
              <span>Buka Pintu Biru & Masuk ➜</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Hantar & Sahkan Sektor ({chanPercent}%)</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span>{showHint ? 'Sembunyikan Petunjuk' : 'Lihat Bantuan Formula'}</span>
          </button>
          <span className="text-[11px] text-neutral-500 font-mono">
            Nisbah: 2 : 3 : 5
          </span>
        </div>
      </div>
    </div>
  );
};
