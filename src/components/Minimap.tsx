import React, { useRef, useEffect } from 'react';
import { DoorObject, PaintBucketObject, PlayerState, MonsterState, DoorColor } from '../types/game';
import { GRID_SIZE, CELL_SIZE, MAZE_MAP } from '../game3d/mazeData';
import { COLOR_DEFINITIONS } from '../data/mathQuestions';

interface MinimapProps {
  player: PlayerState;
  monster: MonsterState;
  doors: DoorObject[];
  buckets: PaintBucketObject[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  player,
  monster,
  doors,
  buckets,
  isExpanded,
  onToggleExpand,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = isExpanded ? 240 : 130;
    canvas.width = size;
    canvas.height = size;

    const cellW = size / GRID_SIZE;

    // Background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, size, size);

    // 1. Draw Maze Walls
    for (let r = 0; r < MAZE_MAP.length; r++) {
      const row = MAZE_MAP[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '0') continue;

        if (ch === 'W') {
          ctx.fillStyle = '#2d3345';
        } else {
          const colorCharMap: Record<string, DoorColor> = {
            R: 'red',
            O: 'orange',
            Y: 'yellow',
            G: 'green',
            B: 'blue',
            P: 'purple',
          };
          const colorId = colorCharMap[ch];
          ctx.fillStyle = colorId ? COLOR_DEFINITIONS[colorId].hex : '#4b5563';
        }
        ctx.fillRect(c * cellW, r * cellW, cellW + 0.5, cellW + 0.5);
      }
    }

    // 2. Draw Doors
    doors.forEach((door) => {
      const c = door.x / CELL_SIZE;
      const r = door.z / CELL_SIZE;
      const def = COLOR_DEFINITIONS[door.id];
      ctx.fillStyle = door.isUnlocked ? '#22c55e' : def.hex;
      ctx.beginPath();
      ctx.arc(c * cellW, r * cellW, cellW * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 3. Draw Paint Buckets
    buckets.forEach((bucket) => {
      if (bucket.isCollected) return;
      const c = bucket.x / CELL_SIZE;
      const r = bucket.z / CELL_SIZE;
      const def = COLOR_DEFINITIONS[bucket.id];
      ctx.fillStyle = def.hex;
      ctx.fillRect(c * cellW - cellW * 0.5, r * cellW - cellW * 0.5, cellW, cellW);
    });

    // 4. Draw Shadow Monster blip
    const mC = monster.x / CELL_SIZE;
    const mR = monster.z / CELL_SIZE;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(mC * cellW, mR * cellW, cellW * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fee2e2';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Draw Player blip & direction
    const pC = player.x / CELL_SIZE;
    const pR = player.z / CELL_SIZE;

    // Player halo (matches active color)
    const activeHex = player.activeColor ? COLOR_DEFINITIONS[player.activeColor].hex : '#ffffff';
    ctx.fillStyle = activeHex;
    ctx.beginPath();
    ctx.arc(pC * cellW, pR * cellW, cellW * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Player center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pC * cellW, pR * cellW, cellW * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Direction needle
    const forwardX = Math.sin(player.angle);
    const forwardZ = Math.cos(player.angle);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pC * cellW, pR * cellW);
    ctx.lineTo(pC * cellW + forwardX * cellW * 2, pR * cellW + forwardZ * cellW * 2);
    ctx.stroke();
  }, [player, monster, doors, buckets, isExpanded]);

  return (
    <div
      onClick={onToggleExpand}
      className="relative cursor-pointer rounded-xl overflow-hidden border-2 border-neutral-700 bg-neutral-950/90 shadow-xl transition-all duration-300 hover:border-neutral-500"
    >
      <div className="absolute top-1 left-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest pointer-events-none flex items-center gap-1">
        <span>Radar</span>
        <span className="text-[9px] text-neutral-500">({isExpanded ? 'Kecilkan' : 'Besarkan'})</span>
      </div>
      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: isExpanded ? 240 : 130, height: isExpanded ? 240 : 130 }}
      />
    </div>
  );
};
