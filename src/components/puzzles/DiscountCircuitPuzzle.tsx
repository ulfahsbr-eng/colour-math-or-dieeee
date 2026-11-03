import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, Zap, ArrowRight, Send, Check, AlertCircle } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface DiscountCircuitPuzzleProps {
  onSolved: () => void;
}

export const DiscountCircuitPuzzle: React.FC<DiscountCircuitPuzzleProps> = ({ onSolved }) => {
  // Original RM80, 25% discount -> Discount = RM20, Selling = RM60, Ratio = 20 : 60 = 1 : 3
  const [selectedDiscount, setSelectedDiscount] = useState<number>(10);
  const [selectedRatio, setSelectedRatio] = useState<string>('1 : 4');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; msg: string } | null>(null);

  const discountAmount = 80 * (selectedDiscount / 100);
  const finalPrice = 80 - discountAmount;

  const handleDiscountChange = (val: number) => {
    if (isUnlocked) return;
    setSelectedDiscount(val);
    setFeedback(null);
    soundManager.playFootstep();
  };

  const handleRatioSelect = (r: string) => {
    if (isUnlocked) return;
    setSelectedRatio(r);
    setFeedback(null);
    soundManager.playFootstep();
  };

  const handleSubmit = () => {
    if (isUnlocked) {
      onSolved();
      return;
    }

    const isDiscountCorrect = selectedDiscount === 25;
    const isRatioCorrect = selectedRatio === '1 : 3';

    if (isDiscountCorrect && isRatioCorrect) {
      setIsUnlocked(true);
      setFeedback({
        type: 'correct',
        msg: 'TAHNIAH! Litar lengkap! Diskaun 25% (RM20) dan harga jualan RM60 memberikan nisbah 20 : 60 = 1 : 3! Kunci Pintu Ungu dibuka!',
      });
      soundManager.playCorrectAnswer();
    } else {
      soundManager.playWrongAnswer();
      if (!isDiscountCorrect && !isRatioCorrect) {
        setFeedback({
          type: 'wrong',
          msg: `Kedua-dua suis diskaun (${selectedDiscount}%) dan nod nisbah (${selectedRatio}) belum tepat. Soalan menyatakan diskaun 25%!`,
        });
      } else if (!isDiscountCorrect) {
        setFeedback({
          type: 'wrong',
          msg: `Suis diskaun (${selectedDiscount}%) belum tepat. Beg menerima potongan 25%. Sila pilih 25%!`,
        });
      } else {
        setFeedback({
          type: 'wrong',
          msg: `Nisbah (${selectedRatio}) belum tepat. Diskaun RM20 berbanding harga jualan RM60 ialah 20 : 60 = 1 : 3!`,
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Mission Prompt */}
      <div className="p-3 bg-purple-950/60 border border-purple-500/50 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Misi Puzzle Litar Diskaun & Nisbah Jualan</span>
        </div>
        <p className="text-sm text-neutral-200">
          Beg galas berharga asal <strong>RM80</strong> menerima <strong>diskaun sebanyak 25%</strong>.
          Sambungkan suis diskaun 25% dan pilih nod nisbah harga diskaun kepada harga jualan (1 : 3), kemudian tekan <strong>Hantar & Aktifkan Litar</strong>!
        </p>
      </div>

      {/* Interactive Circuit Dashboard */}
      <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-4">
        {/* Price Conduit Flow */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
          <div className="flex-1 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block font-bold">Harga Asal</span>
            <span className="text-lg font-black font-mono text-white">RM80</span>
          </div>

          <div className="flex items-center text-purple-400">
            <ArrowRight className="w-5 h-5 hidden sm:block" />
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-purple-950 rounded border border-purple-800">
              -{selectedDiscount}%
            </span>
            <ArrowRight className="w-5 h-5 hidden sm:block" />
          </div>

          <div className="flex-1 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block font-bold">Potongan Diskaun</span>
            <span className="text-lg font-black font-mono text-purple-400">RM{discountAmount}</span>
          </div>

          <div className="flex-1 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block font-bold">Harga Jualan</span>
            <span className="text-lg font-black font-mono text-emerald-400">RM{finalPrice}</span>
          </div>
        </div>

        {/* Step 1: Set Discount Knob */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-neutral-400">Suis Peratusan Diskaun:</span>
            <span className="text-purple-400 font-bold">{selectedDiscount}%</span>
          </div>
          <div className="flex gap-2">
            {[10, 15, 20, 25, 30, 50].map((d) => (
              <button
                key={d}
                type="button"
                disabled={isUnlocked}
                onClick={() => handleDiscountChange(d)}
                className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-xl border transition cursor-pointer ${
                  selectedDiscount === d
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {d}%
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Ratio Node (Diskaun : Harga Jualan) */}
        <div className="space-y-1.5 pt-2">
          <span className="text-xs font-mono text-neutral-400 block">
            Pilih Nisbah Diskaun kepada Harga Jualan:
          </span>
          <div className="grid grid-cols-4 gap-2">
            {['1 : 2', '1 : 3', '1 : 4', '3 : 4'].map((r) => (
              <button
                key={r}
                type="button"
                disabled={isUnlocked}
                onClick={() => handleRatioSelect(r)}
                className={`py-2 text-xs font-mono font-bold rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  selectedRatio === r
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/50'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>{r}</span>
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
              {feedback.type === 'correct' ? 'LITAR BERJAYA DIAKTIFKAN!' : 'LITAR TERPUTUS'}
            </span>
            <p className="mt-0.5 text-neutral-200 leading-relaxed">{feedback.msg}</p>
          </div>
        </div>
      )}

      {/* Hint toggle */}
      {showHint && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-300">
          <strong className="text-purple-400">Petunjuk Diskaun & Nisbah:</strong>
          Diskaun 25% daripada RM80 = RM20.
          Harga Jualan = RM80 - RM20 = RM60.
          Nisbah Diskaun : Jualan = 20 : 60 = <strong>1 : 3</strong>!
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
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/50'
          }`}
        >
          {isUnlocked ? (
            <>
              <Check className="w-5 h-5" />
              <span>Buka Pintu Ungu & Masuk ➜</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Hantar & Aktifkan Litar</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <span>{showHint ? 'Sembunyikan Petunjuk' : 'Lihat Bantuan Formula'}</span>
          </button>
          <span className="text-[11px] text-neutral-500 font-mono">
            Diskaun 25% | RM80
          </span>
        </div>
      </div>
    </div>
  );
};
