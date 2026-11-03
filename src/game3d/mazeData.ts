import { DoorColor, DoorObject, PaintBucketObject } from '../types/game';

// Grid size: 27 x 27
// W: white wall, 0: floor walk path
// R, O, Y, G, B, P: colored safe walls where players can blend in
export const GRID_SIZE = 27;
export const CELL_SIZE = 4; // 4 meters per grid cell

// Map layout definition
export const MAZE_MAP: string[] = [
  'WWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'W0000000W000000000W0000000W',
  'W0RRRR00W0YYYYYY00W0BBBB00W',
  'W0R00R00W0Y0000Y00W0B00B00W',
  'W0R00000W0Y0WW0Y00W0B00000W',
  'W0RRRR000000WW000000BBBB00W',
  'W0000W0WWWWWWWWWWWW0W00000W',
  'WWWW0W0W0000000000W0W0WWWWW',
  'W0000W0W0GGGGGG000W0W00000W',
  'W0OOOO0W0G0000G00W0W0PPPP0W',
  'W0O000000G0WW0G000000P00P0W',
  'W0O0000W0G0WW0G00W0W0P00P0W',
  'W0OOOO0W0GGGGGG00W0W0PPPP0W',
  'W0000W0WWWW00WWWWWW0W00000W',
  'WW0WWW00000000000000WWW0WWW',
  'W000000WWWW000WWWWWW000000W',
  'W0RRRR0W00000000000W0BBBB0W',
  'W0000R0W0YYYYYY000W00000B0W',
  'W0000R000Y00000Y00000000B0W',
  'W0RRRR0W0Y0WW00Y00W0BBBB00W',
  'W000000W0YYYYYY000W0000000W',
  'WWWW0WWWWWW000WWWWWWWW0WWWW',
  'W0000000000000000000000000W',
  'W0OOOO00WWWW000WWWW00PPPP0W',
  'W0O00000W000000000W00000P0W',
  'W0OOOO00W000WW0000W00PPPP0W',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWW',
];

// Doors blocking access to different zones
// Doors blocking access to different zones (aligned to corridor centers)
export const DOORS_CONFIG: DoorObject[] = [
  {
    id: 'red',
    x: 6.5 * CELL_SIZE, // centered in corridor between col 5 and col 7
    z: 7.5 * CELL_SIZE,
    rotationY: 0, // spans across X to seal north-south corridor
    isUnlocked: false,
    requiredPaint: 'red',
    rewardPaint: 'orange',
    rewardKeyName: 'Cat Jingga (Orange Paint)',
  },
  {
    id: 'orange',
    x: 13.5 * CELL_SIZE,
    z: 14.5 * CELL_SIZE,
    rotationY: 0,
    isUnlocked: false,
    requiredPaint: 'orange',
    rewardPaint: 'yellow',
    rewardKeyName: 'Cat Kuning (Yellow Paint)',
  },
  {
    id: 'yellow',
    x: 13.5 * CELL_SIZE,
    z: 7.5 * CELL_SIZE,
    rotationY: 0,
    isUnlocked: false,
    requiredPaint: 'yellow',
    rewardPaint: 'green',
    rewardKeyName: 'Cat Hijau (Green Paint)',
  },
  {
    id: 'green',
    x: 20.5 * CELL_SIZE,
    z: 7.5 * CELL_SIZE,
    rotationY: 0,
    isUnlocked: false,
    requiredPaint: 'green',
    rewardPaint: 'blue',
    rewardKeyName: 'Cat Biru (Blue Paint)',
  },
  {
    id: 'blue',
    x: 20.5 * CELL_SIZE,
    z: 14.5 * CELL_SIZE,
    rotationY: 0,
    isUnlocked: false,
    requiredPaint: 'blue',
    rewardPaint: 'purple',
    rewardKeyName: 'Cat Ungu (Purple Paint)',
  },
  {
    id: 'purple',
    x: 13.5 * CELL_SIZE,
    z: 21.5 * CELL_SIZE,
    rotationY: 0,
    isUnlocked: false,
    requiredPaint: 'purple',
    rewardPaint: 'white',
    rewardKeyName: 'Cat Putih (White Paint)',
  },
  {
    id: 'white',
    x: 24.5 * CELL_SIZE,
    z: 22.5 * CELL_SIZE,
    rotationY: Math.PI / 2,
    isUnlocked: false,
    requiredPaint: 'white',
    rewardPaint: 'escaped',
    rewardKeyName: 'Pintu Pelepasan (VICTORY ESCAPE)',
  },
];

// Paint bucket pickup spots in the maze (centered in zones)
export const PAINT_BUCKETS_CONFIG: PaintBucketObject[] = [
  { id: 'red', x: 2.5 * CELL_SIZE, z: 2.5 * CELL_SIZE, isCollected: true }, // Player starts with red paint
  { id: 'orange', x: 6.5 * CELL_SIZE, z: 10.5 * CELL_SIZE, isCollected: false }, // Inside room past red door
  { id: 'yellow', x: 13.5 * CELL_SIZE, z: 3.5 * CELL_SIZE, isCollected: false }, // Yellow zone
  { id: 'green', x: 13.5 * CELL_SIZE, z: 10.5 * CELL_SIZE, isCollected: false }, // Green zone
  { id: 'blue', x: 24.5 * CELL_SIZE, z: 4.5 * CELL_SIZE, isCollected: false }, // Blue zone
  { id: 'purple', x: 24.5 * CELL_SIZE, z: 11.5 * CELL_SIZE, isCollected: false }, // Purple zone
  { id: 'white', x: 13.5 * CELL_SIZE, z: 24.5 * CELL_SIZE, isCollected: false }, // White exit area
];

// Waypoints for the Shadow Monster to patrol (all centered in open corridors)
export const MONSTER_PATROL_POINTS = [
  { x: 13.5 * CELL_SIZE, z: 14.5 * CELL_SIZE }, // Central crossroads (13, 14)
  { x: 18.5 * CELL_SIZE, z: 14.5 * CELL_SIZE }, // East hall (18, 14)
  { x: 18.5 * CELL_SIZE, z: 5.5 * CELL_SIZE },  // North East corridor (18, 5)
  { x: 13.5 * CELL_SIZE, z: 1.5 * CELL_SIZE },  // North central grand hall (13, 1)
  { x: 8.5 * CELL_SIZE, z: 5.5 * CELL_SIZE },   // North West corridor (8, 5)
  { x: 8.5 * CELL_SIZE, z: 14.5 * CELL_SIZE },  // West hallway (8, 14)
  { x: 6.5 * CELL_SIZE, z: 14.5 * CELL_SIZE },  // West cross passage (6, 14)
  { x: 4.5 * CELL_SIZE, z: 22.5 * CELL_SIZE },  // South West cross (4, 22)
  { x: 13.5 * CELL_SIZE, z: 22.5 * CELL_SIZE }, // South central hall (13, 22)
  { x: 22.5 * CELL_SIZE, z: 22.5 * CELL_SIZE }, // South East exit corridor (22, 22)
  { x: 13.5 * CELL_SIZE, z: 7.5 * CELL_SIZE },  // Center northern junction (13, 7)
];

export const PLAYER_SPAWN = {
  x: 4.5 * CELL_SIZE,
  z: 4.0 * CELL_SIZE,
};

export const MONSTER_SPAWN = {
  x: 13.5 * CELL_SIZE,
  z: 14.5 * CELL_SIZE,
};
