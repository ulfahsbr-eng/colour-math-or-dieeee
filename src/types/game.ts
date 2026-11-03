export type DoorColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'white';

export interface ColorDef {
  id: DoorColor;
  nameMalay: string;
  hex: string;
  emissiveHex: string;
  order: number;
  levelTitle: string;
  conceptDescription: string;
}

export interface MathQuestion {
  id: string;
  doorColor: DoorColor;
  question: string;
  context?: string; // Situasi harian / KSSM context
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  difficulty: 'Mudah' | 'Sederhana' | 'Sukar' | 'Masteri';
}

export interface DoorObject {
  id: DoorColor;
  x: number;
  z: number;
  rotationY: number; // in radians
  isUnlocked: boolean;
  requiredPaint: DoorColor;
  rewardPaint: DoorColor | 'escaped';
  rewardKeyName: string;
}

export interface PaintBucketObject {
  id: DoorColor;
  x: number;
  z: number;
  isCollected: boolean;
}

export interface PlayerState {
  x: number;
  z: number;
  angle: number;
  activeColor: DoorColor | null;
  isCamouflaged: boolean;
  unlockedDoors: DoorColor[];
  collectedPaints: DoorColor[];
  score: number;
  lives: number;
  isTrapped: boolean;
  hasWon: boolean;
}

export interface MonsterState {
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  isChasing: boolean;
  distanceToPlayer: number;
  alertLevel: number; // 0 to 1
}

export type DevicePreset = 'auto' | 'laptop' | 'tablet' | 'phone';
export type TouchControlStyle = 'joystick' | 'dpad';
export type TouchVisibility = 'auto' | 'always' | 'hidden';

export interface ControlSettings {
  devicePreset: DevicePreset;
  touchVisibility: TouchVisibility;
  touchStyle: TouchControlStyle;
  sprintToggle: boolean;
  cameraSensitivity: number; // 0.6 to 2.0
  buttonScale: 'normal' | 'large';
  hapticFeedback: boolean;
}
