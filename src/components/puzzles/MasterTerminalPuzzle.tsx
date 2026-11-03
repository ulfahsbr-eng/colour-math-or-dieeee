import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, Send, Check, AlertCircle } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface MasterTerminalPuzzleProps {
  onSolved: () => void;
}

export const MasterTerminalPuzzle: React.FC<MasterTerminalPuzzleProps> = ({ onSolved }) => {
  // Target: 48% (24 lelaki + 24 perempuan daripada 100 pekerja)
  const [maleBusRate] = useState<number>(40); // 40% of 60 = 24
  const [femaleBusRate] = useState<number>(60); // 60% of 40 = 24
  const [inputTotal, setInputTotal] = useState<number>(50); // Starts at 50%
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; msg: string } | null>(null);

  // Calculation simulation
  const maleCount = Math.round(60 * (maleBusRate / 100)); // 24
  const femaleCount = Math.round(40 * (femaleBusRate / 100)); // 24

  const handleTotalChange = (val: number) => {
    if (isUnlocked) return;
    setInputTotal(val);
    setFeedback(null);
    soundManager.playFootstep();
  };

  const handleSubmit = () => {
    if (isUnlocked) {
      onSolved();
      return;
    }

    if (inputTotal === 48) {
      setIsUnlocked(true);
      setFeedback({
        type: 'correct',
        msg: 'TAHNIAH! KOD PELEPASAN DISAHKAN! 24 lelaki + 24 perempuan = 48 orang daripada 100 orang = 48%! Pintu Putih Pelepasan dibuka!',
      });
      soundManager.playCorrectAnswer();
    } else {
      soundManager.playWrongAnswer();
      setFeedback({
        type: 'wrong',
        msg: `Kod frekuensi (${inputTotal}%) tidak sah! Kira jumlah orang: 24 orang lelaki + 24 orang perempuan = berapa orang daripada 100?`,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Mission Prompt */}
      <div className="p-3 bg-neutral-900 border-2 border-white/70 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Misi Masteri KBAT: Kunci Pelepasan Labyrinth (Pintu Putih)</span>
        </div>
        <p className="text-sm text-neutral-200">
          Nisbah pekerja lelaki kepada perempuan ialah <strong>3 : 2</strong> (60 lelaki & 40 perempuan daripada 100 orang).
          Jika <strong>40% lelaki</strong> dan <strong>60% perempuan</strong> menaiki bas, laraskan frekuensi terminal kepada <strong>peratusan KESELURUHAN pekerja yang menaiki bas (48%)</strong>, kemudian tekan butang <strong>Hantar & Sahkan</strong>!
        </p>
      </div>

      {/* Cyber Keypad Simulation Console */}
      <div className="bg-neutral-950 p-5 rounded-2xl border-2 border-neutral-700 space-y-4">
        {/* Breakdown Modules */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-sky-400 block font-bold">Lelaki (Nisbah 3 Bahagian)</span>
            <span className="text-xs text-neutral-400">40% daripada 60 orang =</span>
            <span className="text-lg font-black font-mono text-white block mt-0.5">
              {maleCount} orang
            </span>
          </div>

          <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-pink-400 block font-bold">Perempuan (Nisbah 2 Bahagian)</span>
            <span className="text-xs text-neutral-400">60% daripada 40 orang =</span>
            <span className="text-lg font-black font-mono text-white block mt-0.5">
              {femaleCount} orang
            </span>
          </div>
        </div>

        {/* Master Output Meter */}
        <div className="p-4 bg-neutral-900 rounded-2xl border-2 border-white/40 text-center shadow-inner">
          <span className="text-xs text-neutral-400 uppercase tracking-widest font-bold block">
            Frekuensi Kod Pelepasan Labyrinth
          </span>
          <div className="text-4xl font-black font-mono text-white my-1">
            {inputTotal}%
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {inputTotal === 48 ? 'KOD KESELURUHAN DISAHKAN!' : 'Menunggu penentukuran 48%'}
          </span>
        </div>

        {/* Interactive Slider & Quick Keys */}
        <div className="space-y-2">
          <input
            type="range"
            min="30"
            max="65"
            value={inputTotal}
            disabled={isUnlocked}
            onChange={(e) => handleTotalChange(parseInt(e.target.value))}
            className="w-full accent-white cursor-pointer h-2.5 bg-neutral-800 rounded-lg"
          />

          <div className="flex gap-2">
            {[45, 48, 50, 52, 60].map((val) => (
              <button
                key={val}
                type="button"
                disabled={isUnlocked}
                onClick={() => handleTotalChange(val)}
                className={`flex-1 py-2 text-xs font-mono font-black rounded-xl border transition cursor-pointer ${
                  inputTotal === val
                    ? 'bg-white text-neutral-950 border-white shadow-lg'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
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
              {feedback.type === 'correct' ? 'KOD UTAMA DISAHKAN!' : 'KOD KESELURUHAN TIDAK SEPADAN'}
            </span>
            <p className="mt-0.5 text-neutral-200 leading-relaxed">{feedback.msg}</p>
          </div>
        </div>
      )}

      {/* Hint toggle */}
      {showHint && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-300">
          <strong className="text-white">Petunjuk KBAT Masteri:</strong>
          Katakan ada 100 orang pekerja:
          <br />• Lelaki = 60 orang ➔ 40% × 60 = 24 orang naik bas.
          <br />• Perempuan = 40 orang ➔ 60% × 40 = 24 orang naik bas.
          <br />• Jumlah naik bas = 24 + 24 = <strong>48 orang daripada 100</strong>, iaitu <strong>48%</strong>!
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
              : 'bg-white hover:bg-neutral-200 text-neutral-950 shadow-white/20'
          }`}
        >
          {isUnlocked ? (
            <>
              <Check className="w-5 h-5" />
              <span>Loloskan Diri (Victory Escape) ➜</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Hantar & Nyahkunci Terminal</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-white" />
            <span>{showHint ? 'Sembunyikan Petunjuk' : 'Lihat Bantuan Formula'}</span>
          </button>
          <span className="text-[11px] text-neutral-500 font-mono">
            KBAT Bab 4.5
          </span>
        </div>
      </div>
    </div>
  );
};
