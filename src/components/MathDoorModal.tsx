import React from 'react';
import { DoorColor, DoorObject } from '../types/game';
import { COLOR_DEFINITIONS } from '../data/mathQuestions';
import { Lock, Sparkles, X, ShieldAlert, CheckCircle2, Compass, ArrowRight } from 'lucide-react';
import { GridFillPuzzle } from './puzzles/GridFillPuzzle';
import { TriDialPuzzle } from './puzzles/TriDialPuzzle';
import { BalanceScalePuzzle } from './puzzles/BalanceScalePuzzle';
import { FluidMixPuzzle } from './puzzles/FluidMixPuzzle';
import { PiePartitionPuzzle } from './puzzles/PiePartitionPuzzle';
import { DiscountCircuitPuzzle } from './puzzles/DiscountCircuitPuzzle';
import { MasterTerminalPuzzle } from './puzzles/MasterTerminalPuzzle';

interface MathDoorModalProps {
  door: DoorObject;
  unlockedDoors?: DoorColor[];
  onUnlockSuccess: (doorColor: DoorColor) => void;
  onClose: () => void;
  onTimeExpired?: () => void;
}

const REQUIRED_PREREQ_DOORS: DoorColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

export const MathDoorModal: React.FC<MathDoorModalProps> = ({
  door,
  unlockedDoors = [],
  onUnlockSuccess,
  onClose,
}) => {
  const colorDef = COLOR_DEFINITIONS[door.id];

  // For the final White Door, check if all 6 preceding doors/questions have been solved
  const isWhiteDoor = door.id === 'white';
  const solvedPrereqsCount = REQUIRED_PREREQ_DOORS.filter((col) => unlockedDoors.includes(col)).length;
  const isWhiteLockedByPrereqs = isWhiteDoor && solvedPrereqsCount < REQUIRED_PREREQ_DOORS.length;

  const handlePuzzleSolved = () => {
    onUnlockSuccess(door.id);
    onClose();
  };

  const renderPuzzle = () => {
    switch (door.id) {
      case 'red':
        return <GridFillPuzzle onSolved={handlePuzzleSolved} />;
      case 'orange':
        return <TriDialPuzzle onSolved={handlePuzzleSolved} />;
      case 'yellow':
        return <BalanceScalePuzzle onSolved={handlePuzzleSolved} />;
      case 'green':
        return <FluidMixPuzzle onSolved={handlePuzzleSolved} />;
      case 'blue':
        return <PiePartitionPuzzle onSolved={handlePuzzleSolved} />;
      case 'purple':
        return <DiscountCircuitPuzzle onSolved={handlePuzzleSolved} />;
      case 'white':
        return <MasterTerminalPuzzle onSolved={handlePuzzleSolved} />;
      default:
        return <GridFillPuzzle onSolved={handlePuzzleSolved} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-2 rounded-3xl shadow-2xl p-6 text-white"
        style={{ borderColor: isWhiteLockedByPrereqs ? '#f59e0b' : colorDef.hex }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl text-white shadow"
              style={{ backgroundColor: isWhiteLockedByPrereqs ? '#f59e0b' : colorDef.hex }}
            >
              <Lock className="w-5 h-5 text-neutral-950 font-black" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">
                {isWhiteLockedByPrereqs ? 'Sistem Keselamatan Labirin' : 'Mekanisme Kunci Puzzle Matematik'}
              </span>
              <h2
                className="text-lg font-black font-['Fredoka']"
                style={{ color: isWhiteLockedByPrereqs ? '#f59e0b' : colorDef.hex }}
              >
                PINTU {colorDef.nameMalay.toUpperCase()} {isWhiteDoor ? '(PINTU AKHIR PELEPASAN)' : ''}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Untimed Mode Badge or Security Status */}
            {isWhiteLockedByPrereqs ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/60 text-amber-300 text-xs font-bold shadow-sm">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Kebenaran Diperlukan</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 text-xs font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Tanpa Had Masa • Jawab Dengan Tenang</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Tutup & Kembali"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Level & Subtopic Badge */}
        <div className="my-3 px-3 py-1.5 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
          <span className="text-neutral-400">
            Topik: <span className="text-white font-medium">Matematik Tingkatan 1 Bab 4.5</span>
          </span>
          <span
            className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
            style={{ backgroundColor: `${colorDef.hex}25`, color: colorDef.hex }}
          >
            {colorDef.levelTitle}
          </span>
        </div>

        {/* Content: If White door is approached before all 6 doors are unlocked, show Lock Screen */}
        {isWhiteLockedByPrereqs ? (
          <div className="my-4 space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-300 text-sm">
                    Akses Ditolak: Kene Jawab Semua 6 Soalan & Buka Pintu Dahulu!
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    Pintu Putih ini adalah pintu pelepasan terakhir (<span className="text-amber-300 font-bold">Grand Ending</span>). Anda mesti menjawab soalan dan membuka semua 6 pintu warna sebelumnya untuk mengaktifkan terminal induk ini.
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-3 border-t border-amber-500/20">
                <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                  <span className="text-neutral-300">Kemajuan Pintu Warna:</span>
                  <span className="text-amber-400 font-mono">
                    {solvedPrereqsCount} / {REQUIRED_PREREQ_DOORS.length} Selesai ({Math.round((solvedPrereqsCount / REQUIRED_PREREQ_DOORS.length) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden p-0.5 border border-neutral-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${(solvedPrereqsCount / REQUIRED_PREREQ_DOORS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Checklist of 6 Doors */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                Senarai Semak 6 Pintu Puzzle:
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {REQUIRED_PREREQ_DOORS.map((colKey) => {
                  const def = COLOR_DEFINITIONS[colKey];
                  const isDone = unlockedDoors.includes(colKey);
                  return (
                    <div
                      key={colKey}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition ${
                        isDone
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 opacity-80'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-white/50 shrink-0"
                        style={{ backgroundColor: def.hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{def.nameMalay}</div>
                        <div className="text-[10px] font-medium flex items-center gap-1">
                          {isDone ? (
                            <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Selesai
                            </span>
                          ) : (
                            <span className="text-neutral-500 flex items-center gap-0.5">
                              <Lock className="w-3 h-3" /> Terkunci
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategic Advice */}
            <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-sky-400 shrink-0" />
              <span>
                Tip: Terokai labirin dan cari pintu warna yang belum dibuka. Anda juga boleh menukar cat pada bila-bila masa untuk menyamar pada dinding sepadan!
              </span>
            </div>

            {/* Close / Return Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <span>Kembali Meneroka Labirin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Dynamic Puzzle Mount when requirements are satisfied or for other doors */
          <div className="my-3">
            {renderPuzzle()}
          </div>
        )}
      </div>
    </div>
  );
};
