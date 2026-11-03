import React from 'react';
import { Skull, RotateCcw, BookOpen } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  unlockedCount: number;
  totalDoors: number;
  reason: 'time' | 'monster';
  onRestart: () => void;
  onOpenNotes: () => void;
  onGoHome?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  unlockedCount,
  totalDoors,
  reason,
  onRestart,
  onOpenNotes,
  onGoHome,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-neutral-900 border-2 border-rose-600 rounded-3xl p-6 text-center text-white shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-950/80 border border-rose-600 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-950/50">
          <Skull className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-black font-['Fredoka'] text-rose-500 tracking-wide uppercase">
          Anda Terperangkap!
        </h2>

        <p className="text-sm text-neutral-300 mt-2 mb-6">
          {reason === 'time'
            ? 'Masa telah tamat sebelum anda sempat membuka kesemua pintu warna matematik!'
            : 'Raksasa bayang telah menangkap anda kerana tidak bersembunyi di dinding warna!'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 block">Pintu Berjaya Dibuka</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {unlockedCount} / {totalDoors}
            </span>
          </div>
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 block">Jumlah Markah</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{score}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 transition active:scale-98"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Cuba Semula Sekarang</span>
          </button>

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold rounded-2xl flex items-center justify-center gap-2 border border-neutral-700 transition"
            >
              <span>🏠 Kembali ke Halaman Mula (Play Page)</span>
            </button>
          )}

          <button
            onClick={onOpenNotes}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 border border-neutral-800 transition"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Ulang Kaji Nota Poket Bab 4.5</span>
          </button>
        </div>
      </div>
    </div>
  );
};
