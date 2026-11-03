import React, { useState } from 'react';
import { Sparkles, HelpCircle, CheckCircle2, AlertCircle, Send, Check } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface GridFillPuzzleProps {
  onSolved: () => void;
}

export const GridFillPuzzle: React.FC<GridFillPuzzleProps> = ({ onSolved }) => {
  // Target: Ratio 3 : 5 = 3/5 = 60%
  const targetPercent = 60;
  const [filledCount, setFilledCount] = useState<number>(30); // Starts at 30%
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; msg: string } | null>(null);

  const handleCellClick = (index: number) => {
    if (isUnlocked) return;
    const newCount = index + 1;
    setFilledCount(newCount);
    setFeedback(null);
  };

  const handleSliderChange = (val: number) => {
    if (isUnlocked) return;
    setFilledCount(val);
    setFeedback(null);
  };

  // Explicit SUBMIT button handler
  const handleSubmit = () => {
    if (isUnlocked) {
      onSolved();
      return;
    }

    if (filledCount === targetPercent) {
      setIsUnlocked(true);
      setFeedback({
        type: 'correct',
        msg: 'TAHNIAH! Jawapan Tepat! 3 : 5 bersamaan 3/5 × 100% = 60%. Kunci Pintu Merah dibuka!',
      });
      soundManager.playCorrectAnswer();
    } else {
      soundManager.playWrongAnswer();
      if (filledCount < targetPercent) {
        setFeedback({
          type: 'wrong',
          msg: `Jawapan belum tepat (${filledCount}%). Nilai ini terlalu rendah! Petak perlu ditambah lagi. (Petunjuk: Tukar 3/5 ke peratus)`,
        });
      } else {
        setFeedback({
          type: 'wrong',
          msg: `Jawapan belum tepat (${filledCount}%). Nilai ini terlalu tinggi! Petak perlu dikurangkan. (Petunjuk: 3 daripada 5 = ?)`,
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Puzzle Mission Prompt */}
      <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Misi Puzzle Petak 100: Nisbah ➔ Peratusan</span>
        </div>
        <p className="text-sm text-neutral-200">
          Nisbah epal merah kepada jumlah epal ialah <strong>3 : 5</strong>.
          Laraskan atau klik pada <strong>Petak 100</strong> di bawah untuk memadankan nilai peratusannya, kemudian tekan butang <strong>Hantar & Sahkan</strong>!
        </p>
      </div>

      {/* Grid and Sliders Container */}
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
        {/* 10x10 Interactive Hundred Grid */}
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-10 gap-1 p-2 bg-neutral-900 rounded-xl border border-neutral-800 shadow-inner">
            {Array.from({ length: 100 }).map((_, i) => {
              const isFilled = i < filledCount;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleCellClick(i)}
                  className={`w-5 h-5 rounded-sm transition-all duration-100 ${
                    isFilled
                      ? 'bg-red-500 shadow-sm shadow-red-500/50 scale-105'
                      : 'bg-neutral-800/80 hover:bg-neutral-700/80'
                  }`}
                  title={`Petak ${i + 1}`}
                />
              );
            })}
          </div>
          <span className="text-[11px] text-neutral-400 mt-2 font-mono">
            Klik petak atau gunakan pelaras di sebelah
          </span>
        </div>

        {/* Right Gauge & Slider controls */}
        <div className="flex-1 w-full flex flex-col justify-between space-y-4">
          {/* Digital Readout */}
          <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
            <span className="text-[11px] text-neutral-400 block uppercase font-bold">
              Tahap Pengisian Semasa
            </span>
            <div className="text-3xl font-black font-mono text-red-400 mt-0.5">
              {filledCount}%
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              ({filledCount} daripada 100 petak)
            </span>
          </div>

          {/* Range Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>0%</span>
              <span className="text-red-400 font-bold">Pelaras Pantas</span>
              <span>100%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={filledCount}
              disabled={isUnlocked}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="w-full accent-red-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
            />
          </div>

          {/* Quick Step Buttons */}
          <div className="flex gap-2">
            {[20, 40, 50, 60, 75, 80].map((val) => (
              <button
                key={val}
                type="button"
                disabled={isUnlocked}
                onClick={() => handleSliderChange(val)}
                className={`flex-1 py-1 text-xs font-mono font-bold rounded-lg border transition ${
                  filledCount === val
                    ? 'bg-red-600 border-red-400 text-white'
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
              {feedback.type === 'correct' ? 'KUNCI DIBUKA!' : 'PERCUBAAN BELUM TEPAT'}
            </span>
            <p className="mt-0.5 text-neutral-200 leading-relaxed">{feedback.msg}</p>
          </div>
        </div>
      )}

      {/* Hint toggle */}
      {showHint && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-300">
          <strong className="text-red-400">Petunjuk Matematik:</strong> Nisbah 3 : 5 bermakna 3 daripada 5 bahagian.
          Tulis sebagai pecahan 3/5. Tukar penyebut kepada 100: (3 × 20) / (5 × 20) = 60/100, iaitu <strong>60%</strong>!
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
              : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50'
          }`}
        >
          {isUnlocked ? (
            <>
              <Check className="w-5 h-5" />
              <span>Buka Pintu Merah & Masuk ➜</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Hantar & Sahkan Jawapan ({filledCount}%)</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-red-400" />
            <span>{showHint ? 'Sembunyikan Petunjuk' : 'Lihat Bantuan Formula'}</span>
          </button>
          <span className="text-[11px] text-neutral-500 font-mono">
            Sasaran: Nisbah 3 : 5
          </span>
        </div>
      </div>
    </div>
  );
};
