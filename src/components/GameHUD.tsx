import React, { useState } from 'react';
import { DoorColor, DoorObject, PaintBucketObject, PlayerState, MonsterState } from '../types/game';
import { COLOR_DEFINITIONS } from '../data/mathQuestions';
import { Minimap } from './Minimap';
import {
  ShieldAlert,
  ShieldCheck,
  Heart,
  Clock,
  BookOpen,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Trophy,
  Home,
  Gamepad2,
  Music,
} from 'lucide-react';

interface GameHUDProps {
  player: PlayerState;
  monster: MonsterState;
  doors: DoorObject[];
  buckets: PaintBucketObject[];
  elapsedTimeSec: number;
  nearestDoor: DoorObject | null;
  nearestBucket: PaintBucketObject | null;
  onOpenDoorModal: () => void;
  onSelectColor: (color: DoorColor) => void;
  onOpenNotes: () => void;
  onToggleSound: () => void;
  isMuted: boolean;
  isMusicMuted?: boolean;
  onToggleMusic?: () => void;
  onGoHome?: () => void;
  onOpenControlSettings?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  monster,
  doors,
  buckets,
  elapsedTimeSec,
  nearestDoor,
  nearestBucket,
  onOpenDoorModal,
  onSelectColor,
  onOpenNotes,
  onToggleSound,
  isMuted,
  isMusicMuted = false,
  onToggleMusic,
  onGoHome,
  onOpenControlSettings,
}) => {
  const [isMinimapExpanded, setIsMinimapExpanded] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const activeDef = player.activeColor ? COLOR_DEFINITIONS[player.activeColor] : null;

  // Format stopwatch timer MM:SS
  const mins = Math.floor(elapsedTimeSec / 60);
  const secs = elapsedTimeSec % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <>
      {/* ================= HORROR VIGNETTE / PROXIMITY SCARE OVERLAY ================= */}
      {monster.distanceToPlayer < 18 && (
        <div
          className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-300"
          style={{
            background: player.isCamouflaged
              ? 'radial-gradient(circle, transparent 65%, rgba(16, 185, 129, 0.22) 100%)'
              : 'radial-gradient(circle, transparent 48%, rgba(220, 20, 60, 0.45) 82%, rgba(139, 0, 0, 0.85) 100%)',
            opacity: player.isCamouflaged
              ? 0.45
              : Math.min(1, Math.max(0.18, (18 - monster.distanceToPlayer) / 18)),
            animation: player.isCamouflaged ? 'none' : 'pulse 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}

      {/* ================= TOP HUD HEADER (Non-occluding) ================= */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none z-20 flex items-start justify-between">
        {/* Left: Camouflage Status & Minimap */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Active Color & Camouflage badge */}
          <div className="flex items-center gap-2.5 bg-neutral-950/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-neutral-800 shadow-xl">
            {activeDef && (
              <div
                className="w-4 h-4 rounded-full border border-white/60 shadow"
                style={{ backgroundColor: activeDef.hex }}
              />
            )}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-neutral-400">
                Warna Aktif: <span className="text-white">{activeDef?.nameMalay || 'Tiada'}</span>
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {player.isCamouflaged ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>SELAMAT (KAMUFLAJ AKTIF!)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>TERDEDAH! (Cari dinding {activeDef?.nameMalay})</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Minimap */}
          <Minimap
            player={player}
            monster={monster}
            doors={doors}
            buckets={buckets}
            isExpanded={isMinimapExpanded}
            onToggleExpand={() => setIsMinimapExpanded(!isMinimapExpanded)}
          />
        </div>

        {/* Center: Untimed Exploration & Playtime */}
        <div className="pointer-events-auto flex flex-col items-center">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-emerald-500/40 bg-neutral-950/85 backdrop-blur-md shadow-2xl text-neutral-100">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-400 font-bold leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Tiada Had Masa (Bebas Selesaikan)</span>
              </div>
              <div className="text-xs font-mono font-bold text-neutral-300 mt-1">
                Masa Meneroka: <span className="text-white font-black">{timeFormatted}</span>
              </div>
            </div>
          </div>

          {/* Near Door Alert Banner */}
          {nearestDoor && !nearestDoor.isUnlocked && (() => {
            const isWhiteDoor = nearestDoor.id === 'white';
            const PREREQS: DoorColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
            const prereqsDone = PREREQS.filter((c) => player.unlockedDoors.includes(c)).length;
            const isWhiteLocked = isWhiteDoor && prereqsDone < PREREQS.length;

            if (isWhiteLocked) {
              return (
                <button
                  onClick={onOpenDoorModal}
                  className="mt-2.5 px-4 py-2 rounded-xl bg-amber-600/95 hover:bg-amber-500 text-amber-50 font-black text-xs uppercase tracking-wider shadow-2xl border-2 border-amber-300 flex items-center gap-2 transition active:scale-95 animate-pulse"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                  <span>🔒 Pintu Putih Terkunci! Kene Jawab Semua Soalan ({prereqsDone}/6 Selesai - Klik Semak)</span>
                </button>
              );
            }

            if (isWhiteDoor && prereqsDone === PREREQS.length) {
              return (
                <button
                  onClick={onOpenDoorModal}
                  className="mt-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-2xl border-2 border-emerald-400 flex items-center gap-2 transition active:scale-95 animate-bounce"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>🎉 SEMUA 6 PINTU SELESAI! Tekan [E] atau Klik Sini untuk Buka Pintu Putih!</span>
                </button>
              );
            }

            return (
              <button
                onClick={onOpenDoorModal}
                className="mt-2.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-xl border-2 border-amber-300 flex items-center gap-2 transition active:scale-95 animate-bounce"
              >
                <span>Tekan [E] atau Klik Sini: Buka Kunci Pintu {COLOR_DEFINITIONS[nearestDoor.id].nameMalay}</span>
              </button>
            );
          })()}

          {/* Near Bucket Alert */}
          {nearestBucket && !nearestBucket.isCollected && (
            <div className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-600/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg border border-emerald-400">
              ✦ Mengambil Cat {COLOR_DEFINITIONS[nearestBucket.id].nameMalay}!
            </div>
          )}
        </div>

        {/* Right: Lives, Score & Utility */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Hearts / Lives */}
          <div className="flex items-center gap-1.5 bg-neutral-950/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-neutral-800 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1">Nyawa:</span>
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${
                  i < player.lives
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-neutral-700 fill-neutral-800'
                }`}
              />
            ))}
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 bg-neutral-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-neutral-800 shadow-xl text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-bold">{player.score} Markah</span>
          </div>

          {/* Home, Control Settings, Sound & Help */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onOpenControlSettings && (
              <button
                onClick={onOpenControlSettings}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/40 flex items-center gap-1.5 transition text-xs font-bold shadow-lg"
                title="Tetapan Kawalan (Laptop / iPad / Telefon)"
              >
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Kawalan</span>
              </button>
            )}
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="p-2 bg-neutral-900/80 hover:bg-neutral-800 rounded-xl border border-neutral-800 text-neutral-300 transition"
                title="Halaman Mula (Play Page)"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowHowToPlay(true)}
              className="p-2 bg-neutral-900/80 hover:bg-neutral-800 rounded-xl border border-neutral-800 text-neutral-300 transition"
              title="Cara Bermain"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {onToggleMusic && (
              <button
                onClick={onToggleMusic}
                className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                  !isMusicMuted
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 shadow-lg shadow-emerald-500/20'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={!isMusicMuted ? 'Muzik Latar: Aktif (Klik untuk Senyapkan)' : 'Muzik Latar: Senyap (Klik untuk Buka)'}
              >
                <Music className={`w-4 h-4 ${!isMusicMuted ? 'text-emerald-400' : 'text-neutral-500'}`} />
                {!isMusicMuted && (
                  <span className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
                    <span className="w-0.5 h-3 bg-emerald-300 animate-pulse delay-75" />
                    <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse delay-150" />
                  </span>
                )}
              </button>
            )}
            <button
              onClick={onToggleSound}
              className="p-2 bg-neutral-900/80 hover:bg-neutral-800 rounded-xl border border-neutral-800 text-neutral-300 transition"
              title={isMuted ? 'Kesan Bunyi: Senyap (Klik untuk Buka)' : 'Kesan Bunyi: Aktif (Klik untuk Senyapkan)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* ================= UNIFIED BOTTOM CONTROL DOCK (Zero Viewport Occlusion) ================= */}
      <div
        className="fixed z-20 transition-all duration-300 pointer-events-none"
        style={{
          bottom: isDockCollapsed ? '-100px' : '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(720px, 94vw)',
        }}
      >
        {/* Collapse / Expand Toggle Button */}
        <div className="flex justify-center -mb-2 pointer-events-auto">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="px-3 py-1 bg-neutral-900/90 border border-neutral-700 rounded-t-xl text-[11px] font-bold text-neutral-300 hover:text-white flex items-center gap-1 shadow-md transition"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Tunjuk Palet Cat ({player.collectedPaints.length} Warna)
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Sembunyi Palet
              </>
            )}
          </button>
        </div>

        {/* Dock Container */}
        <div className="bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2.5 text-white pointer-events-auto">
          {/* Left: Color Inventory Swatches & Quick Select */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden sm:inline">
                Pilih / Tukar Cat:
              </span>
              <span className="text-[10px] text-amber-400/90 font-medium hidden sm:inline">
                (Tekan kekunci 1-7 atau klik)
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'white'] as DoorColor[]).map((col, index) => {
                const def = COLOR_DEFINITIONS[col];
                const isCollected = player.collectedPaints.includes(col);
                const isActive = player.activeColor === col;

                return (
                  <button
                    key={col}
                    disabled={!isCollected}
                    onClick={() => onSelectColor(col)}
                    className={`relative flex flex-col items-center justify-center p-1 rounded-xl border transition group ${
                      isActive
                        ? 'border-white ring-2 ring-white/70 scale-105 shadow-lg bg-neutral-800/80'
                        : isCollected
                        ? 'border-neutral-700 hover:border-neutral-400 opacity-90 hover:scale-102 bg-neutral-900/60'
                        : 'border-neutral-800 opacity-25 cursor-not-allowed bg-neutral-900/30'
                    }`}
                    title={
                      isCollected
                        ? `Tukar ke Cat ${def.nameMalay} (Kekunci ${index + 1})`
                        : `Cat ${def.nameMalay} belum dijumpai dalam labirin`
                    }
                  >
                    {/* Color Swatch Dot */}
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border border-white/20 transition shadow-inner"
                      style={{ backgroundColor: isCollected ? def.hex : '#262626' }}
                    >
                      {isActive && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md animate-pulse" />
                      )}
                    </div>

                    {/* Number Shortcut & Name Label */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className={`text-[9px] font-black px-1 rounded ${
                          isActive
                            ? 'bg-white text-neutral-950'
                            : isCollected
                            ? 'text-neutral-300'
                            : 'text-neutral-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-[9px] font-bold text-neutral-300 hidden md:inline truncate max-w-[42px]">
                        {def.nameMalay}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Revision Notes & Tutorial */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNotes}
              className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-600/80 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-1.5 transition active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Nota Poket Bab 4.5</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= HOW TO PLAY MODAL ================= */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-neutral-900 border-2 border-neutral-700 rounded-3xl p-6 text-white shadow-2xl">
            <h3 className="text-xl font-bold font-['Fredoka'] text-amber-400 mb-3">
              Cara Bermain "Colour or Die - Matematik Tingkatan 1"
            </h3>
            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <strong className="text-white block mb-1">1. Sembunyi Di Dinding Warna Anda (Colour or Die):</strong>
                Raksasa bayang berkeliaran di dalam labirin! Apabila anda memegang cat tertentu (cth: Merah), rapatkan diri ke dinding warna merah untuk bersembunyi. Raksasa tidak dapat melihat anda apabila kamuflaj aktif!
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <strong className="text-white block mb-1">2. Buka Kunci Pintu Warna Matematik:</strong>
                Setiap pintu warna disekat dengan kuiz matematik Bab 4.5 (Nisbah, Kadar, Kadaran, Peratusan, Pecahan & Perpuluhan). Jawab soalan dengan tepat sebelum masa tamat untuk membuka pintu dan mengambil cat warna seterusnya.
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <strong className="text-white block mb-1">3. Kawalan Pergerakan:</strong>
                Gunakan kekunci <strong>W, A, S, D</strong> atau butang arah untuk bergerak. Tahan <strong>Shift</strong> untuk memecut. Klik dan seret tetikus untuk memusingkan pandangan kamera.
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <strong className="text-white block mb-1">4. Menang & Melepaskan Diri:</strong>
                Kumpul kesemua cat warna (Merah ➔ Jingga ➔ Kuning ➔ Hijau ➔ Biru ➔ Ungu ➔ Putih) dan loloskan diri melalui Pintu Pelepasan Putih sebelum pemasa labirin tamat!
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowHowToPlay(false)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition"
              >
                Saya Faham & Mula Bermain!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
