import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Zap,
  KeyRound,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { ControlSettings, DoorColor } from '../types/game';
import { COLOR_DEFINITIONS } from '../data/mathQuestions';

interface TouchControlsProps {
  settings: ControlSettings;
  isNearDoor: boolean;
  nearDoorColorName?: string;
  collectedPaints?: DoorColor[];
  activeColor?: DoorColor | null;
  onSelectColor?: (color: DoorColor) => void;
  onMove: (forward: number, turn: number) => void;
  onSprintChange: (isSprinting: boolean) => void;
  onOpenDoor: () => void;
  onRotateCamera: (amount: number) => void;
  isMuted?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  settings,
  isNearDoor,
  nearDoorColorName,
  collectedPaints = [],
  activeColor = null,
  onSelectColor,
  onMove,
  onSprintChange,
  onOpenDoor,
  onRotateCamera,
}) => {
  const [isSprintLocked, setIsSprintLocked] = useState(false);
  const [isHoldingSprint, setIsHoldingSprint] = useState(false);
  const [dpadActive, setDpadActive] = useState({ up: false, down: false, left: false, right: false });

  // Joystick state
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);

  const isLarge = settings.buttonScale === 'large';

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if (settings.hapticFeedback && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // ignore
      }
    }
  }, [settings.hapticFeedback]);

  // Update movement from D-pad
  const updateDpadMovement = useCallback(
    (nextState: { up: boolean; down: boolean; left: boolean; right: boolean }) => {
      let forward = 0;
      let turn = 0;
      if (nextState.up) forward += 1;
      if (nextState.down) forward -= 1;
      if (nextState.left) turn += 1;
      if (nextState.right) turn -= 1;
      onMove(forward, turn);
    },
    [onMove]
  );

  // Handle D-pad button touch
  const handleDpadPress = (dir: 'up' | 'down' | 'left' | 'right', isPressed: boolean) => {
    triggerHaptic();
    setDpadActive((prev) => {
      const next = { ...prev, [dir]: isPressed };
      updateDpadMovement(next);
      return next;
    });
  };

  // Joystick touch handlers
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.changedTouches.length === 0 || !joystickBaseRef.current) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    setIsJoystickActive(true);
    triggerHaptic();

    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxRadius = rect.width / 2;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const normX = (Math.cos(angle) * clampedDist) / maxRadius;
    const normY = (Math.sin(angle) * clampedDist) / maxRadius;

    setJoystickPos({ x: normX * 36, y: normY * 36 });
    // Y negative is forward (up) in screen coordinates
    onMove(-normY, -normX);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current === null || !joystickBaseRef.current) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const rect = joystickBaseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const maxRadius = rect.width / 2;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);

        const normX = (Math.cos(angle) * clampedDist) / maxRadius;
        const normY = (Math.sin(angle) * clampedDist) / maxRadius;

        setJoystickPos({ x: normX * 38, y: normY * 38 });
        onMove(-normY, -normX);
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setIsJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  // Sprint handling (Toggle vs Hold)
  const toggleSprint = () => {
    triggerHaptic();
    if (settings.sprintToggle) {
      const next = !isSprintLocked;
      setIsSprintLocked(next);
      onSprintChange(next);
    } else {
      setIsHoldingSprint(true);
      onSprintChange(true);
    }
  };

  const releaseSprint = () => {
    if (!settings.sprintToggle) {
      setIsHoldingSprint(false);
      onSprintChange(false);
    }
  };

  // Keep sprint active if sprintToggle
  useEffect(() => {
    if (settings.sprintToggle) {
      onSprintChange(isSprintLocked);
    } else {
      onSprintChange(isHoldingSprint);
    }
  }, [settings.sprintToggle, isSprintLocked, isHoldingSprint, onSprintChange]);

  const sprintActive = settings.sprintToggle ? isSprintLocked : isHoldingSprint;

  return (
    <div className="fixed inset-x-0 bottom-0 pointer-events-none z-30 select-none pb-3 px-3 sm:px-6">
      {/* Quick Mobile / iPad Color Switcher Bar */}
      {collectedPaints.length > 0 && onSelectColor && (
        <div className="w-full flex justify-center mb-3 pointer-events-auto">
          <div className="flex items-center gap-1.5 p-1.5 bg-neutral-950/90 backdrop-blur-md rounded-2xl border border-neutral-700/80 shadow-2xl overflow-x-auto max-w-[95vw]">
            <span className="text-[10px] font-bold text-neutral-400 pl-1.5 pr-0.5 hidden sm:inline uppercase">
              Tukar Cat:
            </span>
            {collectedPaints.map((col) => {
              const def = COLOR_DEFINITIONS[col];
              const isActive = activeColor === col;
              return (
                <button
                  key={col}
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    triggerHaptic();
                    onSelectColor(col);
                  }}
                  onClick={() => {
                    triggerHaptic();
                    onSelectColor(col);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition active:scale-90 ${
                    isActive
                      ? 'bg-neutral-800 text-white border-white ring-2 ring-white/60 shadow-lg scale-105'
                      : 'bg-neutral-900/90 text-neutral-300 border-neutral-750 hover:border-neutral-500'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                    style={{ backgroundColor: def.hex }}
                  />
                  <span className="text-[10px] font-bold whitespace-nowrap">
                    {def.nameMalay}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="w-full flex items-end justify-between max-w-5xl mx-auto">
        {/* ================= LEFT CONTROLS: MOVEMENT ================= */}
        <div className="pointer-events-auto flex flex-col items-center">
          {settings.touchStyle === 'joystick' ? (
            /* ANALOG VIRTUAL JOYSTICK */
            <div
              ref={joystickBaseRef}
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
              onTouchCancel={handleJoystickEnd}
              className={`relative rounded-full flex items-center justify-center border-2 touch-none shadow-2xl backdrop-blur-md transition-all ${
                isLarge ? 'w-36 h-36' : 'w-28 h-28 sm:w-32 sm:h-32'
              } ${
                isJoystickActive
                  ? 'bg-emerald-950/70 border-emerald-400 shadow-emerald-500/20'
                  : 'bg-neutral-900/65 border-neutral-700/80'
              }`}
            >
              {/* Center Cross / Cardinal Guides */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <ArrowUp className="absolute top-2 w-3.5 h-3.5 text-neutral-300" />
                <ArrowDown className="absolute bottom-2 w-3.5 h-3.5 text-neutral-300" />
                <ArrowLeft className="absolute left-2 w-3.5 h-3.5 text-neutral-300" />
                <ArrowRight className="absolute right-2 w-3.5 h-3.5 text-neutral-300" />
              </div>

              {/* Movable Thumb Nub */}
              <div
                className={`rounded-full border-2 flex items-center justify-center shadow-lg transition-transform duration-75 pointer-events-none ${
                  isLarge ? 'w-14 h-14' : 'w-11 h-11 sm:w-12 sm:h-12'
                } ${
                  isJoystickActive
                    ? 'bg-emerald-500 border-white text-neutral-950 scale-105'
                    : 'bg-neutral-800/90 border-neutral-500 text-neutral-300'
                }`}
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                }}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    isJoystickActive ? 'bg-white shadow' : 'bg-neutral-400'
                  }`}
                />
              </div>

              <span className="absolute -bottom-5 text-[9px] font-black uppercase tracking-wider text-neutral-400">
                Gerak / Pusing
              </span>
            </div>
          ) : (
            /* 4-WAY ERGONOMIC D-PAD */
            <div className="relative p-1 bg-neutral-950/80 backdrop-blur-md rounded-3xl border border-neutral-700/80 shadow-2xl">
              <div
                className={`grid grid-cols-3 grid-rows-3 gap-1.5 ${
                  isLarge ? 'w-44 h-44' : 'w-36 h-36 sm:w-40 sm:h-40'
                }`}
              >
                {/* Top Row: Empty, Up, Empty */}
                <div />
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleDpadPress('up', true);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleDpadPress('up', false);
                  }}
                  onMouseDown={() => handleDpadPress('up', true)}
                  onMouseUp={() => handleDpadPress('up', false)}
                  className={`rounded-2xl flex items-center justify-center border font-black transition active:scale-95 ${
                    dpadActive.up
                      ? 'bg-emerald-500 text-neutral-950 border-white shadow-lg'
                      : 'bg-neutral-800/90 text-neutral-200 border-neutral-600 hover:bg-neutral-700'
                  }`}
                >
                  <ArrowUp className={isLarge ? 'w-7 h-7' : 'w-5 h-5'} />
                </button>
                <div />

                {/* Middle Row: Left, Center, Right */}
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleDpadPress('left', true);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleDpadPress('left', false);
                  }}
                  onMouseDown={() => handleDpadPress('left', true)}
                  onMouseUp={() => handleDpadPress('left', false)}
                  className={`rounded-2xl flex items-center justify-center border font-black transition active:scale-95 ${
                    dpadActive.left
                      ? 'bg-emerald-500 text-neutral-950 border-white shadow-lg'
                      : 'bg-neutral-800/90 text-neutral-200 border-neutral-600 hover:bg-neutral-700'
                  }`}
                >
                  <ArrowLeft className={isLarge ? 'w-7 h-7' : 'w-5 h-5'} />
                </button>

                <div className="rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-neutral-600" />
                </div>

                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleDpadPress('right', true);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleDpadPress('right', false);
                  }}
                  onMouseDown={() => handleDpadPress('right', true)}
                  onMouseUp={() => handleDpadPress('right', false)}
                  className={`rounded-2xl flex items-center justify-center border font-black transition active:scale-95 ${
                    dpadActive.right
                      ? 'bg-emerald-500 text-neutral-950 border-white shadow-lg'
                      : 'bg-neutral-800/90 text-neutral-200 border-neutral-600 hover:bg-neutral-700'
                  }`}
                >
                  <ArrowRight className={isLarge ? 'w-7 h-7' : 'w-5 h-5'} />
                </button>

                {/* Bottom Row: Empty, Down, Empty */}
                <div />
                <button
                  type="button"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleDpadPress('down', true);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleDpadPress('down', false);
                  }}
                  onMouseDown={() => handleDpadPress('down', true)}
                  onMouseUp={() => handleDpadPress('down', false)}
                  className={`rounded-2xl flex items-center justify-center border font-black transition active:scale-95 ${
                    dpadActive.down
                      ? 'bg-emerald-500 text-neutral-950 border-white shadow-lg'
                      : 'bg-neutral-800/90 text-neutral-200 border-neutral-600 hover:bg-neutral-700'
                  }`}
                >
                  <ArrowDown className={isLarge ? 'w-7 h-7' : 'w-5 h-5'} />
                </button>
                <div />
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT CONTROLS: ACTION & ROTATION ================= */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5">
          {/* Top of right stack: Quick Camera Turn Buttons */}
          <div className="flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-800 shadow-xl">
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                triggerHaptic();
                onRotateCamera(Math.PI / 4);
              }}
              onClick={() => onRotateCamera(Math.PI / 4)}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200 flex items-center gap-1 text-[11px] font-bold active:scale-90 transition"
              title="Pusing Pandangan Kiri 45°"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>↶ Pusing Kiri</span>
            </button>
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                triggerHaptic();
                onRotateCamera(-Math.PI / 4);
              }}
              onClick={() => onRotateCamera(-Math.PI / 4)}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200 flex items-center gap-1 text-[11px] font-bold active:scale-90 transition"
              title="Pusing Pandangan Kanan 45°"
            >
              <span>Pusing Kanan ↷</span>
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Action Row: Sprint + Big Unlock Door Button */}
          <div className="flex items-center gap-3">
            {/* Sprint Button */}
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                toggleSprint();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                releaseSprint();
              }}
              onMouseDown={toggleSprint}
              onMouseUp={releaseSprint}
              className={`rounded-2xl flex flex-col items-center justify-center border-2 font-black shadow-xl active:scale-90 transition-all ${
                isLarge ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-14 h-14 sm:w-16 sm:h-16'
              } ${
                sprintActive
                  ? 'bg-amber-500 text-neutral-950 border-white shadow-amber-500/30 scale-105'
                  : 'bg-neutral-900/85 text-neutral-200 border-neutral-700/80 hover:bg-neutral-800'
              }`}
            >
              <Zap
                className={`${isLarge ? 'w-6 h-6' : 'w-5 h-5'} ${
                  sprintActive ? 'fill-neutral-950' : 'text-amber-400'
                }`}
              />
              <span className="text-[10px] uppercase font-bold leading-none mt-1">
                {sprintActive ? 'Lari [ON]' : 'Lari'}
              </span>
            </button>

            {/* Main Action / Unlock Door Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onOpenDoor();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                triggerHaptic();
                onOpenDoor();
              }}
              className={`rounded-3xl flex flex-col items-center justify-center border-2 font-black shadow-2xl transition-all active:scale-90 ${
                isLarge ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20 sm:w-24 sm:h-24'
              } ${
                isNearDoor
                  ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-neutral-950 border-white shadow-amber-500/50 scale-105 animate-pulse'
                  : 'bg-neutral-900/85 text-neutral-400 border-neutral-700/80 hover:text-white'
              }`}
            >
              <KeyRound
                className={`${isLarge ? 'w-8 h-8' : 'w-6 h-6'} ${
                  isNearDoor ? 'animate-bounce text-neutral-950' : 'text-neutral-400'
                }`}
              />
              <span className="text-[10px] sm:text-xs uppercase font-black text-center mt-1 px-1 leading-tight">
                {isNearDoor ? (
                  <>
                    Buka Pintu
                    {nearDoorColorName && (
                      <span className="block text-[8px] font-bold opacity-80">
                        {nearDoorColorName}
                      </span>
                    )}
                  </>
                ) : (
                  'Aksi [E]'
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
