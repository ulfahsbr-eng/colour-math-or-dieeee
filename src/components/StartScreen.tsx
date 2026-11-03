import React, { useState } from 'react';
import {
  Play,
  BookOpen,
  Volume2,
  VolumeX,
  Shield,
  Sparkles,
  HelpCircle,
  KeyRound,
  Award,
  CheckCircle2,
  Gamepad2,
  Music,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { COLOR_DEFINITIONS } from '../data/mathQuestions';
import { soundManager } from '../audio/soundManager';

interface StartScreenProps {
  onStartGame: () => void;
  onOpenNotes: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  isMusicMuted?: boolean;
  onToggleMusic?: () => void;
  onOpenControlSettings?: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  onOpenNotes,
  isMuted,
  onToggleSound,
  isMusicMuted = false,
  onToggleMusic,
  onOpenControlSettings,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handlePlayClick = () => {
    soundManager.playGameStart();
    onStartGame();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/95 backdrop-blur-md overflow-y-auto select-none font-['Fredoka',sans-serif]">
      {/* Ambient background glow & grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[250px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-3xl my-auto text-center text-white z-10 py-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="px-3.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-950/50">
            <Sparkles className="w-3.5 h-3.5" />
            KSSM Tingkatan 1 Matematik
          </span>
          <span className="px-3.5 py-1 rounded-full bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
            Bab 4.5 • Nisbah, Kadar & Kadaran
          </span>
          <span className="px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-neutral-300 text-xs font-semibold">
            ✨ Mod Santai: Tanpa Had Masa
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight uppercase mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 drop-shadow-[0_4px_24px_rgba(16,185,129,0.35)]">
          Labirin Matematik
        </h1>
        <h2 className="text-xl sm:text-2xl font-black text-neutral-200 tracking-wide mb-4">
          Rahsia 7 Pintu Warna & Raksasa Bayang
        </h2>

        <p className="text-sm sm:text-base text-neutral-300 max-w-xl mx-auto mb-8 leading-relaxed">
          Terokai koridor misteri, selesaikan puzzle matematik nisbah, peratusan & perpuluhan di setiap pintu gerbang, dan gunakan cat samaran untuk melepaskan diri!
        </p>

        {/* 7 Doors Color Preview */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'white'] as const).map((colorKey) => {
            const def = COLOR_DEFINITIONS[colorKey];
            return (
              <div
                key={colorKey}
                className="group relative flex flex-col items-center"
              >
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg"
                  style={{
                    backgroundColor: def.hex,
                    borderColor: '#ffffff',
                    color: colorKey === 'white' || colorKey === 'yellow' ? '#000000' : '#ffffff',
                  }}
                >
                  <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] text-neutral-400 font-semibold mt-1 hidden sm:block">
                  {def.nameMalay}
                </span>
              </div>
            );
          })}
        </div>

        {/* Big PLAY Button */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <button
            onClick={handlePlayClick}
            className="group relative px-10 py-5 sm:px-14 sm:py-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black text-2xl sm:text-3xl tracking-wide uppercase shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:shadow-[0_0_60px_rgba(16,185,129,0.9)] transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-4"
          >
            {/* Animated Pulse Ring */}
            <span className="absolute -inset-1 rounded-3xl bg-emerald-400 opacity-40 blur-md group-hover:opacity-75 transition duration-500 animate-pulse" />
            <span className="relative z-10 flex items-center gap-3">
              <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-neutral-950" />
              <span>MULA MAIN (PLAY)</span>
            </span>
          </button>
          <span className="text-xs text-neutral-400 font-medium">
            Tekan butang di atas untuk memulakan penerokaan 3D serta-merta!
          </span>
        </div>

        {/* Secondary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={onOpenNotes}
            className="px-4 py-2.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-500/50 text-neutral-200 hover:text-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-md"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Nota Poket Bab 4.5</span>
          </button>

          <button
            onClick={() => setShowHowToPlay(true)}
            className="px-4 py-2.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/50 text-neutral-200 hover:text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-md"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Cara Bermain & Kawalan</span>
          </button>

          {onOpenControlSettings && (
            <button
              onClick={onOpenControlSettings}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-md"
            >
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              <span>Tetapan Kawalan (Laptop / iPad / Telefon)</span>
            </button>
          )}

          {/* Music Latar (BGM) Toggle Button */}
          {onToggleMusic && (
            <button
              onClick={onToggleMusic}
              className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-md ${
                !isMusicMuted
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-neutral-900/90 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <Music className={`w-4 h-4 ${!isMusicMuted ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'}`} />
              <span>Muzik Latar: {!isMusicMuted ? 'Aktif 🎵' : 'Mute 🔇'}</span>
            </button>
          )}

          <button
            onClick={onToggleSound}
            className="px-4 py-2.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-md"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>Kesan Bunyi: Senyap</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Kesan Bunyi: Aktif</span>
              </>
            )}
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1.5 text-emerald-400 font-bold text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tiada Had Masa</span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed">
              Jawab soalan puzzle matematik dengan tenang mengikut rentak sendiri tanpa jam berdetik.
            </p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-bold text-xs sm:text-sm">
              <Shield className="w-4 h-4" />
              <span>Cat Samaran (Kamuflaj)</span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed">
              Kutip tong cat dan berdiri rapat di dinding berwarna sama untuk halimunan daripada raksasa!
            </p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1.5 text-cyan-400 font-bold text-xs sm:text-sm">
              <Award className="w-4 h-4" />
              <span>Papan Kekunci Laptop</span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed">
              Gunakan anak panah ⬆️ ⬇️ ⬅️ ➡️ untuk berjalan & membelok, tekan [E] untuk membuka pintu.
            </p>
          </div>
        </div>
      </div>

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-neutral-900 border-2 border-emerald-500/80 rounded-3xl p-6 text-white shadow-2xl text-left">
            <h3 className="text-xl font-black text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <HelpCircle className="w-6 h-6" />
              Panduan Bermain
            </h3>

            <div className="space-y-3 text-xs text-neutral-300 mb-6">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  <span className="w-7 h-7 bg-neutral-800 rounded-lg flex items-center justify-center font-bold text-amber-400">
                    <ArrowUp className="w-4 h-4" />
                  </span>
                  <div className="flex gap-1">
                    <span className="w-6 h-6 bg-neutral-800 rounded flex items-center justify-center text-xs">
                      <ArrowLeft className="w-3 h-3" />
                    </span>
                    <span className="w-6 h-6 bg-neutral-800 rounded flex items-center justify-center text-xs">
                      <ArrowDown className="w-3 h-3" />
                    </span>
                    <span className="w-6 h-6 bg-neutral-800 rounded flex items-center justify-center text-xs">
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
                <div>
                  <strong className="text-white block text-sm mb-0.5">Pergerakan Pemain</strong>
                  <span>Tekan anak panah <strong>⬆️ (Atas)</strong> untuk maju terus ke depan mengikut pandangan kamera, <strong>⬇️</strong> untuk undur, dan <strong>⬅️ ➡️</strong> untuk pusing kiri/kanan.</span>
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold shrink-0">
                  E
                </span>
                <div>
                  <strong className="text-white block text-sm mb-0.5">Buka Pintu Rahsia</strong>
                  <span>Hampiri pintu gerbang berwarna dan tekan kekunci <strong>[E]</strong> atau klik butang di skrin untuk memulakan puzzle matematik.</span>
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 font-bold shrink-0">
                  👾
                </span>
                <div>
                  <strong className="text-white block text-sm mb-0.5">Raksasa Bayang</strong>
                  <span>Elakkan daripada bertembung dengan Raksasa Bayang. Sekiranya raksasa dekat, rapatkan diri ke dinding warna cat anda untuk bersembunyi (kamuflaj)!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-black rounded-xl uppercase transition active:scale-98"
            >
              Faham, Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
