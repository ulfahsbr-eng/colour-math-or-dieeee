import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, Droplet, Plus, Minus, Send, Check, AlertCircle } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface FluidMixPuzzleProps {
  onSolved: () => void;
}

export const FluidMixPuzzle: React.FC<FluidMixPuzzleProps> = ({ onSolved }) => {
  // Target: Sirap 2 bahagian, Air 8 bahagian -> Total = 10 bahagian -> Sirap = 2/10 = 20%
  const [syrupParts, setSyrupParts] = useState(1);
  const [waterParts, setWaterParts] = useState(4);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; msg: string } | null>(null);

  const totalParts = syrupParts + waterParts;
  const syrupPercentage = totalParts > 0 ? Math.round((syrupParts / totalParts) * 100) : 0;

  const adjustSyrup = (delta: number) => {
    if (isUnlocked) return;
    const next = Math.max(1, Math.min(10, syrupParts + delta));
    setSyrupParts(next);
    setFeedback(null);
    soundManager.playFootstep();
  };

  const adjustWater = (delta: number) => {
    if (isUnlocked) return;
    const next = Math.max(1, Math.min(20, waterParts + delta));
    setWaterParts(next);
    setFeedback(null);
    soundManager.playFootstep();
  };

  const handleSubmit = () => {
    if (isUnlocked) {
      onSolved();
      return;
    }

    const pct = totalParts > 0 ? (syrupParts / totalParts) * 100 : 0;
    // Target is exactly 20% (e.g. 2:8 or 1:4)
    if (Math.abs(pct - 20) < 0.1) {
      setIsUnlocked(true);
      setFeedback({
        type: 'correct',
        msg: `TAHNIAH! Bancuhan stabil tepat pada nisbah ${syrupParts} : ${waterParts} iaitu 20% sirap! Kunci Pintu Hijau dibuka!`,
      });
      soundManager.playCorrectAnswer();
    } else {
      soundManager.playWrongAnswer();
      if (pct > 20) {
        setFeedback({
          type: 'wrong',
          msg: `Bancuhan terlalu pekat (${syrupPercentage}% sirap). Nisbah 2 : 8 memerlukan 20% sirap sahaja. Kurangkan sirap atau tambah air!`,
        });
      } else {
        setFeedback({
          type: 'wrong',
          msg: `Bancuhan terlalu cair (${syrupPercentage}% sirap). Tambah sirap supaya menepati nisbah 2 : 8 (20%).`,
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Mission Prompt */}
      <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Misi Puzzle Bancuhan Cecair & Kadar</span>
        </div>
        <p className="text-sm text-neutral-200">
          Resipi bancuhan memerlukan <strong>sirap kordial dan air dalam nisbah 2 : 8</strong>.
          Pam titisan cecair sehingga sensor kepekatan sirap menepati <strong>20%</strong>, kemudian tekan butang <strong>Hantar & Sahkan</strong>!
        </p>
      </div>

      {/* Lab Beaker Visual */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-neutral-950 p-5 rounded-2xl border border-neutral-800">
        {/* Animated Fluid Flask / Beaker */}
        <div className="relative w-28 h-48 bg-neutral-900/90 rounded-b-3xl border-x-4 border-b-4 border-neutral-600 shadow-2xl flex flex-col justify-end overflow-hidden p-1">
          {/* Beaker Graduations / Marks */}
          <div className="absolute inset-y-2 left-2 flex flex-col justify-between text-[8px] font-mono text-neutral-500 pointer-events-none z-10">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          {/* Liquid Layers */}
          <div
            className="w-full rounded-b-2xl transition-all duration-300 relative flex flex-col justify-end"
            style={{
              height: `${Math.min(100, totalParts * 7 + 10)}%`,
              backgroundColor: isUnlocked ? '#10b981' : '#059669',
            }}
          >
            {/* Liquid Surface Ripple */}
            <div className="w-full h-2 bg-emerald-300/40 rounded-full animate-pulse" />
          </div>

          <div className="absolute bottom-2 right-2 text-[10px] font-mono font-bold text-white z-10">
            {totalParts} Bahagian
          </div>
        </div>

        {/* Chemical Dispensers & Purity Meter */}
        <div className="flex-1 w-full space-y-4">
          {/* Digital Concentration Meter */}
          <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
            <span className="text-[11px] font-bold text-neutral-400 uppercase block">
              Peratusan Sirap Dalam Bancuhan
            </span>
            <div
              className={`text-3xl font-black font-mono my-0.5 ${
                isUnlocked ? 'text-emerald-400' : 'text-yellow-400'
              }`}
            >
              {syrupPercentage}%
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              Nisbah Semasa: {syrupParts} : {waterParts} ({syrupParts}/{totalParts} bahagian)
            </span>
          </div>

          {/* Dispensers */}
          <div className="grid grid-cols-2 gap-3">
            {/* Syrup Dispenser */}
            <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 flex flex-col items-center">
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 mb-1">
                <Droplet className="w-3.5 h-3.5 fill-emerald-400" /> Sirap
              </span>
              <span className="text-lg font-black font-mono text-white mb-1.5">{syrupParts} unit</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={isUnlocked}
                  onClick={() => adjustSyrup(-1)}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white border border-neutral-700 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isUnlocked}
                  onClick={() => adjustSyrup(1)}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white border border-neutral-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Water Dispenser */}
            <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 flex flex-col items-center">
              <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1 mb-1">
                <Droplet className="w-3.5 h-3.5 fill-sky-400" /> Air
              </span>
              <span className="text-lg font-black font-mono text-white mb-1.5">{waterParts} unit</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={isUnlocked}
                  onClick={() => adjustWater(-1)}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white border border-neutral-700 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isUnlocked}
                  onClick={() => adjustWater(1)}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white border border-neutral-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
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
              {feedback.type === 'correct' ? 'BANCUHAN BERJAYA!' : 'KEPEKATAN BELUM TEPAT'}
            </span>
            <p className="mt-0.5 text-neutral-200 leading-relaxed">{feedback.msg}</p>
          </div>
        </div>
      )}

      {/* Hint toggle */}
      {showHint && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-300">
          <strong className="text-emerald-400">Petunjuk Kadar:</strong>
          Nisbah sirap kepada air ialah 2 : 8.
          Jumlah bahagian bancuhan = 2 + 8 = 10 bahagian.
          Peratus sirap = (2 / 10) × 100% = <strong>20%</strong>!
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
              : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-900/50'
          }`}
        >
          {isUnlocked ? (
            <>
              <Check className="w-5 h-5" />
              <span>Buka Pintu Hijau & Masuk ➜</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Hantar & Uji Bancuhan ({syrupPercentage}%)</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>{showHint ? 'Sembunyikan Petunjuk' : 'Lihat Bantuan Formula'}</span>
          </button>
          <span className="text-[11px] text-neutral-500 font-mono">
            Sasaran: 2 : 8 (20%)
          </span>
        </div>
      </div>
    </div>
  );
};
