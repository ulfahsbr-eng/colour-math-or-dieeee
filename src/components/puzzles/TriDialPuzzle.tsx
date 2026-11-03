import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, ChevronUp, ChevronDown, Send, Check, AlertCircle } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface TriDialPuzzleProps {
  onSolved: () => void;
}

export const TriDialPuzzle: React.FC<TriDialPuzzleProps> = ({ onSolved }) => {
  // Target: 0.65
  // Correct trio: Pecahan: 13/20 (idx 4), Peratus: 65% (idx 4), Nisbah: 13 : 20 (idx 4)
  const fractions = ['1/4', '2/5', '1/2', '3/5', '13/20', '3/4', '7/8'];
  const percentages = ['25%', '40%', '50%', '60%', '65%', '75%', '87.5%'];
  const ratios = ['1 : 4', '2 : 5', '1 : 2', '3 : 5', '13 : 20', '3 : 4', '7 : 8'];

  const [fracIdx, setFracIdx] = useState(1); // 2/5
  const [percIdx, setPercIdx] = useState(2); // 50%
  const [ratioIdx, setRatioIdx] = useState(0); // 1 : 4

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; msg: string } | null>(null);

  const stepFrac = (delta: number) => {
    if (isUnlocked) return;
    const next = (fracIdx + delta + fractions.length) % fractions.length;
    setFracIdx(next);
    setFeedback(null);
    soundManager.playFootstep();
  };

  const stepPerc = (delta: number) => {
    if (isUnlocked) return;
    const next = (percIdx + delta + percentages.length) % percentages.length;
    setPercIdx(next);
    setFeedback(null);
    soundManager.playFootstep();
  };

  const stepRatio = (delta: number) => {
    if (isUnlocked) return;
    const next = (ratioIdx + delta + ratios.length) % ratios.length;
    setRatioIdx(next);
    setFeedback(null);
    soundManager.playFootstep();
  };

  const handleSubmit = () => {
    if (isUnlocked) {
      onSolved();
      return;
    }

    const isFracCorrect = fracIdx === 4; // 13/20
    const isPercCorrect = percIdx === 4; // 65%
    const isRatioCorrect = ratioIdx === 4; // 13 : 20

    if (isFracCorrect && isPercCorrect && isRatioCorrect) {
      setIsUnlocked(true);
      setFeedback({
        type: 'correct',
        msg: 'TAHNIAH! Ketiga-tiga roda kombinasi selaras pada nilai setara 0.65 = 13/20 = 65% = 13 : 20!',
      });
      soundManager.playCorrectAnswer();
    } else {
      soundManager.playWrongAnswer();
      const wrongParts: string[] = [];
      if (!isFracCorrect) wrongParts.push(`Pecahan (${fractions[fracIdx]})`);
      if (!isPercCorrect) wrongParts.push(`Peratus (${percentages[percIdx]})`);
      if (!isRatioCorrect) wrongParts.push(`Nisbah (${ratios[ratioIdx]})`);

      setFeedback({
        type: 'wrong',
        msg: `Kombinasi belum tepat! Bahagian yang perlu diselaraskan: ${wrongParts.join(', ')}. (Sasaran: 0.65 = 65/100)`,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Mission Prompt */}
      <div className="p-3 bg-orange-950/60 border border-orange-500/50 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Misi Puzzle Peti Besi Tiga Serangkai</span>
        </div>
        <p className="text-sm text-neutral-200">
          Nilai perpuluhan sasaran pada peti keselamatan ialah <strong>0.65</strong>.
          Pusingkan 3 roda kombinasi di bawah supaya sepadan, kemudian tekan butang <strong>Hantar & Sahkan</strong>!
        </p>
      </div>

      {/* Target Monitor */}
      <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 text-center">
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">
          Peti Keselamatan Kod Jingga
        </span>
        <div className="text-3xl font-black font-mono text-orange-400 my-1">
          SASARAN: 0.65
        </div>
        <span className="text-[11px] text-neutral-400">
          Laras ketiga-tiga roda pada nilai yang setara
        </span>
      </div>

      {/* 3 Tumbler Dials */}
      <div className="grid grid-cols-3 gap-3">
        {/* Dial 1: Pecahan */}
        <div className="flex flex-col items-center bg-neutral-950 p-3 rounded-2xl border border-neutral-800 shadow-md">
          <span className="text-[11px] font-bold text-orange-300 uppercase mb-2">Pecahan</span>
          <button
            type="button"
            disabled={isUnlocked}
            onClick={() => stepFrac(1)}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition active:scale-95 border border-neutral-700 cursor-pointer"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <div className="my-3 w-full py-3 bg-neutral-900 rounded-xl border-2 border-orange-500/60 text-center text-lg font-black font-mono text-orange-400 shadow-inner">
            {fractions[fracIdx]}
          </div>
          <button
            type="button"
            disabled={isUnlocked}
            onClick={() => stepFrac(-1)}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition active:scale-95 border border-neutral-700 cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Dial 2: Peratusan */}
        <div className="flex flex-col items-center bg-neutral-950 p-3 rounded-2xl border border-neutral-800 shadow-md">
          <span className="text-[11px] font-bold text-orange-300 uppercase mb-2">Peratusan</span>
          <button
            type="button"
            disabled={isUnlocked}
            onClick={() => stepPerc(1)}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition active:scale-95 border border-neutral-700 cursor-pointer"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <div className="my-3 w-full py-3 bg-neutral-900 rounded-xl border-2 border-orange-500/60 text-center text-lg font-black font-mono text-orange-400 shadow-inner">
            {percentages[percIdx]}
          </div>
          <button
            type="button"
            disabled={isUnlocked}
            onClick={() => stepPerc(-1)}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition active:scale-95 border border-neutral-700 cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Dial 3: Nisbah */}
        <div className="flex flex-col items-center bg-neutral-950 p-3 rounded-2xl border border-neutral-800 shadow-md">
          <span className="text-[11px] font-bold text-orange-300 uppercase mb-2">Nisbah</span>
          <button
            type="button"
            disabled={isUnlocked}
            onClick={() => stepRatio(1)}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition active:scale-95 border border-neutral-700 cursor-pointer"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <div className="my-3 w-full py-3 bg-neutral-900 rounded-xl border-2 border-orange-500/60 text-center text-lg font-black font-mono text-orange-400 shadow-inner">
            {ratios[ratioIdx]}
          </div>
          <button
            type="button"
            disabled={isUnlocked}
            onClick={() => stepRatio(-1)}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition active:scale-95 border border-neutral-700 cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
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
              {feedback.type === 'correct' ? 'PETI BERJAYA DIBUKA!' : 'KOMBINASI BELUM TEPAT'}
            </span>
            <p className="mt-0.5 text-neutral-200 leading-relaxed">{feedback.msg}</p>
          </div>
        </div>
      )}

      {/* Hint toggle */}
      {showHint && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-300">
          <strong className="text-orange-400">Petunjuk Matematik:</strong>
          0.65 = 65/100. Bahagikan pengangka dan penyebut dengan 5 ➔ (65 ÷ 5) / (100 ÷ 5) = <strong>13/20</strong>.
          Dalam peratusan ialah <strong>65%</strong>, dan dalam nisbah ialah <strong>13 : 20</strong>!
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
              : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/50'
          }`}
        >
          {isUnlocked ? (
            <>
              <Check className="w-5 h-5" />
              <span>Buka Pintu Jingga & Masuk ➜</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Hantar & Sahkan Kod Peti</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-orange-400" />
            <span>{showHint ? 'Sembunyikan Petunjuk' : 'Lihat Bantuan Formula'}</span>
          </button>
          <span className="text-[11px] text-neutral-500 font-mono">
            Sasaran: 0.65
          </span>
        </div>
      </div>
    </div>
  );
};
