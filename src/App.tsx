import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from './game3d/SceneManager';
import { GameHUD } from './components/GameHUD';
import { MathDoorModal } from './components/MathDoorModal';
import { RevisionNotesModal } from './components/RevisionNotesModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { StartScreen } from './components/StartScreen';
import { DoorColor, DoorObject, PaintBucketObject, ControlSettings } from './types/game';
import { COLOR_DEFINITIONS } from './data/mathQuestions';
import { soundManager } from './audio/soundManager';
import { bgmManager } from './audio/bgmManager';
import { TouchControls } from './components/TouchControls';
import { ControlSettingsModal } from './components/ControlSettingsModal';
import { JumpscareOverlay } from './components/JumpscareOverlay';

const DEFAULT_CONTROL_SETTINGS: ControlSettings = {
  devicePreset: 'auto',
  touchVisibility: 'auto',
  touchStyle: 'joystick',
  sprintToggle: true,
  cameraSensitivity: 1.0,
  buttonScale: 'normal',
  hapticFeedback: true,
};

// Mod Santai: Tiada Had Masa (Pemain boleh selesaikan soalan mengikut rentak sendiri)

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // Game state: 'menu' (cover page with big PLAY button) | 'playing' (inside 3D maze)
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');

  // Reactive UI state mirrored from scene manager
  const [playerState, setPlayerState] = useState({
    x: 0,
    z: 0,
    angle: 0,
    activeColor: 'red' as DoorColor | null,
    isCamouflaged: false,
    unlockedDoors: [] as DoorColor[],
    collectedPaints: ['red'] as DoorColor[],
    score: 0,
    lives: 3,
    isTrapped: false,
    hasWon: false,
  });

  const [monsterState, setMonsterState] = useState({
    x: 0,
    z: 0,
    targetX: 0,
    targetZ: 0,
    speed: 3.8,
    isChasing: false,
    distanceToPlayer: 999,
    alertLevel: 0,
  });

  const [doors, setDoors] = useState<DoorObject[]>([]);
  const [buckets, setBuckets] = useState<PaintBucketObject[]>([]);
  const [nearestDoor, setNearestDoor] = useState<DoorObject | null>(null);
  const [nearestBucket, setNearestBucket] = useState<PaintBucketObject | null>(null);

  // Modals & Timers (Stopwatch Santai - Tiada Had Masa)
  const [elapsedTimeSec, setElapsedTimeSec] = useState<number>(0);
  const [isDoorModalOpen, setIsDoorModalOpen] = useState<boolean>(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);
  const [isControlSettingsOpen, setIsControlSettingsOpen] = useState<boolean>(false);
  const [jumpscareState, setJumpscareState] = useState<{ active: boolean; progress: number }>({
    active: false,
    progress: 0,
  });
  const [trapReason, setTrapReason] = useState<'time' | 'monster'>('monster');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() => bgmManager.getIsMuted());
  const [musicVolume, setMusicVolume] = useState<number>(() => bgmManager.getVolume());
  const [unlockToast, setUnlockToast] = useState<{ title: string; desc: string; hex: string } | null>(null);
  const [colorToast, setColorToast] = useState<{ name: string; hex: string } | null>(null);

  // Cross-device control settings
  const [controlSettings, setControlSettings] = useState<ControlSettings>(() => {
    try {
      const saved = localStorage.getItem('colour_or_die_controls');
      if (saved) return { ...DEFAULT_CONTROL_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_CONTROL_SETTINGS;
  });

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));

  const shouldShowTouch =
    controlSettings.touchVisibility === 'always' ||
    (controlSettings.touchVisibility === 'auto' &&
      (isTouchDevice || (typeof window !== 'undefined' && window.innerWidth < 1024)));

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Initialize Three.js scene
  const initGame = useCallback(() => {
    if (!canvasMountRef.current) return;

    if (sceneManagerRef.current) {
      sceneManagerRef.current.dispose();
      sceneManagerRef.current = null;
    }

    const sm = new SceneManager(canvasMountRef.current);
    sm.isPaused = gameStateRef.current === 'menu';
    sm.cameraSensitivity = controlSettings.cameraSensitivity;
    sceneManagerRef.current = sm;

    setDoors([...sm.doors]);
    setBuckets([...sm.buckets]);
    setElapsedTimeSec(0);

    // Callbacks
    sm.onNearDoor = (door) => setNearestDoor(door);
    sm.onNearBucket = (bucket) => setNearestBucket(bucket);

    sm.onJumpscare = (active, progress) => {
      setJumpscareState({ active, progress });
    };

    sm.onPlayerCaught = () => {
      setPlayerState({ ...sm.player });
      if (sm.player.lives <= 0) {
        setTrapReason('monster');
      }
    };

    sm.onStateUpdate = () => {
      setPlayerState({ ...sm.player });
      setMonsterState({ ...sm.monster });
    };
  }, [controlSettings.cameraSensitivity]);

  // Touch controls callbacks
  const handleTouchMove = useCallback((forward: number, turn: number) => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    sm.mobileMove.y = forward;
    sm.mobileMove.x = turn;
  }, []);

  const handleTouchSprint = useCallback((isSprinting: boolean) => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    sm.keys.ShiftLeft = isSprinting;
  }, []);

  const handleRotateCamera = useCallback((amount: number) => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    sm.rotateCamera(amount);
  }, []);

  const handleUpdateControlSettings = useCallback((newSettings: ControlSettings) => {
    setControlSettings(newSettings);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.cameraSensitivity = newSettings.cameraSensitivity;
    }
    try {
      localStorage.setItem('colour_or_die_controls', JSON.stringify(newSettings));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    initGame();
    // Ensure keyboard focus on launch
    window.focus();
    if (containerRef.current) {
      containerRef.current.focus();
    }
    return () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
      }
    };
  }, [initGame]);

  // Pause 3D game loop while in menu or answering puzzle or viewing notes or setting controls
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.isPaused =
        gameState === 'menu' || isDoorModalOpen || isNotesModalOpen || isControlSettingsOpen;
    }
  }, [gameState, isDoorModalOpen, isNotesModalOpen, isControlSettingsOpen]);

  // Overall Maze exploration timer (Stopwatch - Tiada Had Masa / Tanpa Tekanan)
  useEffect(() => {
    if (gameState !== 'playing' || playerState.isTrapped || playerState.hasWon || isDoorModalOpen || isNotesModalOpen) return;

    const timer = setInterval(() => {
      setElapsedTimeSec((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, playerState.isTrapped, playerState.hasWon, isDoorModalOpen, isNotesModalOpen]);

  // Direct keyboard listener with browser scroll prevention for Arrow keys
  useEffect(() => {
    const handleKey = (code: string, key: string, isDown: boolean) => {
      const sm = sceneManagerRef.current;
      if (!sm) return;
      const k = key ? key.toLowerCase() : '';
      if (code === 'ArrowUp' || key === 'ArrowUp' || code === 'KeyW' || k === 'w') sm.keys.KeyW = isDown;
      if (code === 'ArrowDown' || key === 'ArrowDown' || code === 'KeyS' || k === 's') sm.keys.KeyS = isDown;
      if (code === 'ArrowLeft' || key === 'ArrowLeft' || code === 'KeyA' || k === 'a') sm.keys.KeyA = isDown;
      if (code === 'ArrowRight' || key === 'ArrowRight' || code === 'KeyD' || k === 'd') sm.keys.KeyD = isDown;
      if (code.startsWith('Shift') || key === 'Shift') sm.keys.ShiftLeft = isDown;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore gameplay keys while in StartScreen menu or modal is open
      if (gameState !== 'playing') return;

      if (isDoorModalOpen || isNotesModalOpen || isControlSettingsOpen) return;

      // Prevent laptop browser window scroll on arrow keys
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)
      ) {
        e.preventDefault();
      }
      handleKey(e.code, e.key, true);

      // Number key 1-7 color switching
      const COLOR_BY_NUMBER: Record<string, DoorColor> = {
        '1': 'red',
        '2': 'orange',
        '3': 'yellow',
        '4': 'green',
        '5': 'blue',
        '6': 'purple',
        '7': 'white',
      };
      if (COLOR_BY_NUMBER[e.key]) {
        handleSelectColor(COLOR_BY_NUMBER[e.key]);
      }

      // Quick Color Cycle: Q (previous), R or C (next)
      if (e.code === 'KeyQ' || e.code === 'KeyR' || e.code === 'KeyC') {
        const paints = sceneManagerRef.current?.player.collectedPaints || [];
        if (paints.length > 1) {
          const currentActive = sceneManagerRef.current?.player.activeColor || paints[0];
          const currIdx = paints.indexOf(currentActive);
          let nextIdx = 0;
          if (e.code === 'KeyQ') {
            nextIdx = (currIdx - 1 + paints.length) % paints.length;
          } else {
            nextIdx = (currIdx + 1) % paints.length;
          }
          handleSelectColor(paints[nextIdx]);
        }
      }

      // Open door with E or Space or Enter
      if (
        (e.code === 'KeyE' || e.key.toLowerCase() === 'e' || e.code === 'Space' || e.code === 'Enter') &&
        nearestDoor &&
        !nearestDoor.isUnlocked &&
        !isDoorModalOpen
      ) {
        setIsDoorModalOpen(true);
      }
      if (e.code === 'KeyH' || e.key.toLowerCase() === 'h') {
        setIsNotesModalOpen((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)
      ) {
        e.preventDefault();
      }
      handleKey(e.code, e.key, false);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [nearestDoor, isDoorModalOpen, isNotesModalOpen, isControlSettingsOpen, gameState]);

  // Handle Math Door Unlock
  const handleUnlockDoor = (doorColor: DoorColor) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.unlockDoor(doorColor);
      sceneManagerRef.current.player.score += 150;
      setDoors([...sceneManagerRef.current.doors]);
      setBuckets([...sceneManagerRef.current.buckets]);
      setPlayerState({ ...sceneManagerRef.current.player });

      const doorObj = sceneManagerRef.current.doors.find((d) => d.id === doorColor);
      const colorDef = COLOR_DEFINITIONS[doorColor];
      if (doorObj) {
        setUnlockToast({
          title: `PINTU ${colorDef.nameMalay.toUpperCase()} BERJAYA DIBUKA!`,
          desc: `Tahniah! Anda memperolehi ${doorObj.rewardKeyName}. Pintu kini terbuka luas — sila tekan ⬆️ untuk melangkah masuk melepasi pintu ke zon seterusnya!`,
          hex: colorDef.hex,
        });
        setTimeout(() => setUnlockToast(null), 5500);
      }
    }
  };

  // Color selection from HUD / Touch / Keyboard
  const handleSelectColor = (color: DoorColor) => {
    if (sceneManagerRef.current && sceneManagerRef.current.player.collectedPaints.includes(color)) {
      sceneManagerRef.current.player.activeColor = color;
      sceneManagerRef.current.updatePlayerColorVisual();
      setPlayerState({ ...sceneManagerRef.current.player });
      soundManager.playColorSwitch();

      const def = COLOR_DEFINITIONS[color];
      setColorToast({ name: def.nameMalay, hex: def.hex });
      setTimeout(() => setColorToast(null), 2000);
    }
  };

  // Sound toggle (Kesan Bunyi SFX)
  const handleToggleSound = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  }, [isMuted]);

  // Music toggle (Muzik Latar BGM)
  const handleToggleMusic = useCallback(() => {
    const next = bgmManager.toggleMute();
    setIsMusicMuted(next);
  }, []);

  const handleSetMusicVolume = useCallback((vol: number) => {
    bgmManager.setVolume(vol);
    setMusicVolume(vol);
  }, []);

  // Ensure AudioContext is awakened on first user gesture
  useEffect(() => {
    const onFirstUserGesture = () => {
      bgmManager.start();
      window.removeEventListener('pointerdown', onFirstUserGesture);
      window.removeEventListener('keydown', onFirstUserGesture);
    };
    window.addEventListener('pointerdown', onFirstUserGesture);
    window.addEventListener('keydown', onFirstUserGesture);
    return () => {
      window.removeEventListener('pointerdown', onFirstUserGesture);
      window.removeEventListener('keydown', onFirstUserGesture);
    };
  }, []);

  // Synchronize adaptive background music with game state and monster chase
  useEffect(() => {
    if (gameState === 'menu') {
      bgmManager.setTrackMode('menu');
    } else if (gameState === 'playing') {
      if (playerState.hasWon) {
        bgmManager.setTrackMode('victory');
      } else if (playerState.isTrapped) {
        bgmManager.setTrackMode('gameover');
      } else if (isDoorModalOpen) {
        bgmManager.setTrackMode('puzzle');
      } else if (monsterState.isChasing || (monsterState.distanceToPlayer < 9.0 && !playerState.isCamouflaged)) {
        bgmManager.setTrackMode('chase');
      } else {
        bgmManager.setTrackMode('exploration');
      }
    }
  }, [
    gameState,
    isDoorModalOpen,
    monsterState.isChasing,
    monsterState.distanceToPlayer,
    playerState.isCamouflaged,
    playerState.hasWon,
    playerState.isTrapped,
  ]);

  // Start game from main menu / play cover page
  const handleStartGame = () => {
    bgmManager.start();
    bgmManager.setTrackMode('exploration');
    setGameState('playing');
    if (!sceneManagerRef.current) {
      initGame();
    }
    if (sceneManagerRef.current) {
      sceneManagerRef.current.isPaused = false;
    }
    window.focus();
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  // Return to cover page / menu
  const handleGoHome = () => {
    setGameState('menu');
    bgmManager.setTrackMode('menu');
    if (sceneManagerRef.current) {
      sceneManagerRef.current.isPaused = true;
    }
  };

  // Restart game immediately in play mode
  const handleRestart = () => {
    setGameState('playing');
    bgmManager.setTrackMode('exploration');
    initGame();
    if (sceneManagerRef.current) {
      sceneManagerRef.current.isPaused = false;
    }
    window.focus();
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onClick={() => {
        window.focus();
        if (containerRef.current) containerRef.current.focus();
      }}
      className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-['Fredoka',sans-serif] select-none outline-none"
    >
      {/* Isolated Three.js Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Crosshair / Center guide during gameplay */}
      {gameState === 'playing' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/30 pointer-events-none z-10" />
      )}

      {/* Game HUD (Only in Playing Mode) */}
      {gameState === 'playing' && (
        <GameHUD
          player={playerState}
          monster={monsterState}
          doors={doors}
          buckets={buckets}
          elapsedTimeSec={elapsedTimeSec}
          nearestDoor={nearestDoor}
          nearestBucket={nearestBucket}
          onOpenDoorModal={() => setIsDoorModalOpen(true)}
          onSelectColor={handleSelectColor}
          onOpenNotes={() => setIsNotesModalOpen(true)}
          onToggleSound={handleToggleSound}
          isMuted={isMuted}
          isMusicMuted={isMusicMuted}
          onToggleMusic={handleToggleMusic}
          onGoHome={handleGoHome}
          onOpenControlSettings={() => setIsControlSettingsOpen(true)}
        />
      )}

      {/* Adaptive Device & Controls Info Banner */}
      {gameState === 'playing' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-neutral-900/90 border border-neutral-700/80 px-3.5 py-1.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs text-neutral-200 z-10 pointer-events-auto backdrop-blur-sm max-w-[94vw] text-center">
          {shouldShowTouch ? (
            <>
              <span className="font-bold text-amber-400">📱 Kawalan iPad & Telefon:</span>
              <span className="text-[11px] text-neutral-300">
                Ibu Jari Gerak | Palet Bawah: <strong>Tukar Cat</strong> | Kanan: <strong>[E]</strong> Buka & <strong>⚡ Lari</strong>
              </span>
            </>
          ) : (
            <>
              <span className="font-bold text-amber-400">⌨️ Kawalan Laptop / PC:</span>
              <span className="text-[11px] text-neutral-300">
                <strong>W,A,S,D / Panah</strong> Gerak | <strong>1-7 / Q,R</strong> Tukar Cat | <strong>Shift</strong> Lari | <strong>[E]</strong> Buka Pintu
              </span>
            </>
          )}
          <button
            onClick={() => setIsControlSettingsOpen(true)}
            className="ml-1 px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[10px] font-black text-amber-300 border border-amber-500/40 transition shrink-0"
          >
            ⚙️ Tukar
          </button>
        </div>
      )}

      {/* High-Fidelity On-Screen Touch Controls (Telefon, iPad & Skrin Sentuh) */}
      {gameState === 'playing' &&
        shouldShowTouch &&
        !isDoorModalOpen &&
        !isNotesModalOpen &&
        !isControlSettingsOpen &&
        !jumpscareState.active &&
        !playerState.isTrapped &&
        !playerState.hasWon && (
          <TouchControls
            settings={controlSettings}
            isNearDoor={Boolean(nearestDoor && !nearestDoor.isUnlocked)}
            nearDoorColorName={nearestDoor ? COLOR_DEFINITIONS[nearestDoor.id].nameMalay : undefined}
            collectedPaints={playerState.collectedPaints}
            activeColor={playerState.activeColor}
            onSelectColor={handleSelectColor}
            onMove={handleTouchMove}
            onSprintChange={handleTouchSprint}
            onOpenDoor={() => {
              if (nearestDoor && !nearestDoor.isUnlocked) {
                setIsDoorModalOpen(true);
              }
            }}
            onRotateCamera={handleRotateCamera}
            isMuted={isMuted}
          />
        )}

      {/* Cinematic Horror Jumpscare Overlay (Muka Raksasa Terkam Dekat Skrin) */}
      {jumpscareState.active && (
        <JumpscareOverlay progress={jumpscareState.progress} />
      )}

      {/* Active Color Swap Feedback Toast */}
      {colorToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300">
          <div
            className="px-4 py-1.5 rounded-full bg-neutral-900/95 border-2 shadow-xl flex items-center gap-2 backdrop-blur-md animate-bounce"
            style={{ borderColor: colorToast.hex }}
          >
            <div
              className="w-3.5 h-3.5 rounded-full shadow"
              style={{ backgroundColor: colorToast.hex }}
            />
            <span className="text-xs font-black tracking-wide text-white">
              Cat Aktif: <span style={{ color: colorToast.hex }}>{colorToast.name}</span>
            </span>
            <span className="text-[10px] text-neutral-300 hidden sm:inline">
              (Cari dinding {colorToast.name} untuk halimunan)
            </span>
          </div>
        </div>
      )}

      {/* Unlock Success Alert Toast */}
      {unlockToast && (
        <div
          className="absolute top-32 left-1/2 -translate-x-1/2 max-w-md w-[90%] bg-neutral-900/95 border-2 rounded-2xl p-4 shadow-2xl z-20 pointer-events-auto backdrop-blur-md animate-bounce"
          style={{ borderColor: unlockToast.hex }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-4 h-4 rounded-full mt-1 shrink-0 animate-ping"
              style={{ backgroundColor: unlockToast.hex }}
            />
            <div>
              <h3 className="font-black text-sm tracking-wide" style={{ color: unlockToast.hex }}>
                {unlockToast.title}
              </h3>
              <p className="text-xs text-neutral-200 mt-1 leading-relaxed">
                {unlockToast.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Math Door Puzzle Terminal Modal (Tanpa Had Masa) */}
      {isDoorModalOpen && nearestDoor && (
        <MathDoorModal
          door={nearestDoor}
          unlockedDoors={playerState.unlockedDoors}
          onUnlockSuccess={handleUnlockDoor}
          onClose={() => setIsDoorModalOpen(false)}
        />
      )}

      {/* Revision Notes Modal (Tingkatan 1 Bab 4.5) */}
      <RevisionNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
      />

      {/* Dedicated Start / Main Menu Cover Page with Big PLAY Button */}
      {gameState === 'menu' && (
        <StartScreen
          onStartGame={handleStartGame}
          onOpenNotes={() => setIsNotesModalOpen(true)}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          isMusicMuted={isMusicMuted}
          onToggleMusic={handleToggleMusic}
          onOpenControlSettings={() => setIsControlSettingsOpen(true)}
        />
      )}

      {/* Cross-device Control Settings Modal (Laptop, iPad & Telefon) */}
      <ControlSettingsModal
        isOpen={isControlSettingsOpen}
        onClose={() => setIsControlSettingsOpen(false)}
        settings={controlSettings}
        onUpdateSettings={handleUpdateControlSettings}
        isMusicMuted={isMusicMuted}
        onToggleMusic={handleToggleMusic}
        musicVolume={musicVolume}
        onSetMusicVolume={handleSetMusicVolume}
        isSfxMuted={isMuted}
        onToggleSfx={handleToggleSound}
      />

      {/* Game Over Screen */}
      {playerState.isTrapped && (
        <GameOverModal
          score={playerState.score}
          unlockedCount={playerState.unlockedDoors.length}
          totalDoors={doors.length}
          reason={trapReason}
          onRestart={handleRestart}
          onOpenNotes={() => setIsNotesModalOpen(true)}
          onGoHome={handleGoHome}
        />
      )}

      {/* Victory Screen (Gempak & Memukau) */}
      {playerState.hasWon && (
        <VictoryModal
          score={playerState.score}
          timeTakenSec={elapsedTimeSec}
          onRestart={handleRestart}
          onGoHome={handleGoHome}
          onOpenNotes={() => setIsNotesModalOpen(true)}
        />
      )}
    </div>
  );
}
