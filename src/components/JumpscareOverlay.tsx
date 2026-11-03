import React from 'react';

interface JumpscareOverlayProps {
  progress: number; // 0 to 1
}

export const JumpscareOverlay: React.FC<JumpscareOverlayProps> = ({ progress }) => {
  return (
    <div className="fixed inset-0 z-40 pointer-events-none select-none overflow-hidden animate-pulse">
      {/* 1. Blood-Red Shockwave Vignette */}
      <div
        className="absolute inset-0 transition-opacity duration-75"
        style={{
          background: `radial-gradient(circle at center, transparent 25%, rgba(180, 0, 0, ${
            0.55 + Math.sin(progress * 25) * 0.25
          }) 65%, rgba(40, 0, 0, 0.98) 100%)`,
        }}
      />

      {/* 2. Screen Glitch / Static Scanlines */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-color-dodge"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255, 0, 0, 0.15) 0px, rgba(255, 0, 0, 0.15) 2px, transparent 2px, transparent 4px)',
          transform: `translate(${(Math.random() - 0.5) * 8}px, ${(Math.random() - 0.5) * 8}px)`,
        }}
      />

      {/* 3. Violent Claws Scratching Screen Border */}
      <svg
        className="absolute inset-0 w-full h-full opacity-70 filter drop-shadow-[0_0_12px_rgba(255,0,0,0.8)]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Left Claw Scratches */}
        <path
          d="M 2,12 Q 15,35 18,55 M 0,25 Q 12,45 14,70 M 5,4 Q 22,25 24,42"
          stroke="#ff0033"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="2, 1"
        />
        {/* Right Claw Scratches */}
        <path
          d="M 98,15 Q 85,38 82,58 M 100,28 Q 88,48 86,72 M 95,6 Q 78,28 76,45"
          stroke="#ff0033"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="2, 1"
        />
      </svg>

      {/* 4. Shock Impact Text */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <h2
          className="text-3xl sm:text-5xl font-black font-['Fredoka'] tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-rose-200 via-rose-500 to-red-800 drop-shadow-[0_0_25px_rgba(255,0,50,0.9)]"
          style={{
            transform: `scale(${1 + Math.sin(progress * 30) * 0.08}) rotate(${
              (Math.random() - 0.5) * 3
            }deg)`,
          }}
        >
          TERTANGKAP!
        </h2>
        <p className="text-xs sm:text-sm font-bold text-red-300 tracking-wider mt-1 drop-shadow-md">
          Raksasa bayang telah menyerang anda!
        </p>
      </div>

      {/* 5. Flashing Blood Spatter Edges */}
      <div className="absolute inset-0 border-[12px] sm:border-[20px] border-red-700/60 pointer-events-none" />
    </div>
  );
};
