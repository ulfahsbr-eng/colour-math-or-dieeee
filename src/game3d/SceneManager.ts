import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DoorColor, DoorObject, PaintBucketObject, PlayerState, MonsterState } from '../types/game';
import {
  GRID_SIZE,
  CELL_SIZE,
  MAZE_MAP,
  DOORS_CONFIG,
  PAINT_BUCKETS_CONFIG,
  MONSTER_PATROL_POINTS,
  PLAYER_SPAWN,
  MONSTER_SPAWN,
} from './mazeData';
import { COLOR_DEFINITIONS } from '../data/mathQuestions';
import { soundManager } from '../audio/soundManager';

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;

  // Visual assets & meshes
  private wallMeshes: THREE.Mesh[] = [];
  private doorGroups: Map<DoorColor, THREE.Group> = new Map();
  private bucketGroups: Map<DoorColor, THREE.Group> = new Map();
  private playerGroup: THREE.Group;
  private monsterGroup: THREE.Group;
  private playerShadow: THREE.Mesh;
  private monsterShadow: THREE.Mesh;

  // Collision map: bounds [minX, minZ, maxX, maxZ]
  private collisionBoxes: { minX: number; minZ: number; maxX: number; maxZ: number; type: string; color?: DoorColor }[] = [];

  // Game state
  public doors: DoorObject[] = JSON.parse(JSON.stringify(DOORS_CONFIG));
  public buckets: PaintBucketObject[] = JSON.parse(JSON.stringify(PAINT_BUCKETS_CONFIG));
  public player: PlayerState = {
    x: PLAYER_SPAWN.x,
    z: PLAYER_SPAWN.z,
    angle: 0,
    activeColor: 'red', // Player begins with Red paint from spawn
    isCamouflaged: false,
    unlockedDoors: [],
    collectedPaints: ['red'],
    score: 0,
    lives: 3,
    isTrapped: false,
    hasWon: false,
  };

  public monster: MonsterState = {
    x: MONSTER_SPAWN.x,
    z: MONSTER_SPAWN.z,
    targetX: MONSTER_PATROL_POINTS[0].x,
    targetZ: MONSTER_PATROL_POINTS[0].z,
    speed: 3.8,
    isChasing: false,
    distanceToPlayer: 999,
    alertLevel: 0,
  };

  private currentPatrolIndex: number = 0;
  private lastSeenPlayerPos: { x: number; z: number } | null = null;
  private monsterPath: { c: number; r: number }[] = [];
  private lastPathRecalcTime: number = 0;
  private monsterStuckTimer: number = 0;
  private prevMonsterPos = { x: MONSTER_SPAWN.x, z: MONSTER_SPAWN.z };
  private directLoSDisabledUntil: number = 0;

  // Input states
  public keys: Record<string, boolean> = {
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ShiftLeft: false,
    ShiftRight: false,
  };
  public mobileMove = { x: 0, y: 0 };
  public cameraRotationY: number = -Math.PI / 2; // Face East along open corridor
  public cameraPitch: number = 0.25;
  public cameraSensitivity: number = 1.0;
  public autoWalk: boolean = false;
  public isPaused: boolean = false;

  // Jumpscare system
  public isJumpscareActive: boolean = false;
  private jumpscareTimer: number = 0;
  public onJumpscare: ((active: boolean, progress: number) => void) | null = null;

  // Events / Callbacks
  public onNearDoor: ((door: DoorObject | null) => void) | null = null;
  public onNearBucket: ((bucket: PaintBucketObject | null) => void) | null = null;
  public onPlayerCaught: (() => void) | null = null;
  public onStateUpdate: (() => void) | null = null;

  // Math vector cache for zero GC
  private _tempVec = new THREE.Vector3();
  private _targetCameraPos = new THREE.Vector3();
  private _monsterDir = new THREE.Vector3();

  // Animation states
  private walkCycle: number = 0;
  private monsterAnimTime: number = 0;
  private playerArms: { left: THREE.Mesh; right: THREE.Mesh } | null = null;
  private playerLegs: { left: THREE.Mesh; right: THREE.Mesh } | null = null;
  private monsterArms: { left: THREE.Mesh; right: THREE.Mesh } | null = null;
  private monsterHead: THREE.Mesh | null = null;
  private monsterJaw: THREE.Group | null = null;
  private monsterEyes: THREE.Mesh[] = [];
  private monsterTendrils: THREE.Mesh[] = [];
  private monsterEyeLight: THREE.PointLight | null = null;
  private paintCanMesh: THREE.Mesh | null = null;
  private _cleanupCallbacks: (() => void)[] = [];

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.025);

    // 2. Camera setup (Third-person shoulder view)
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 150);

    // 3. Renderer setup r160+ standards
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);
    this.clock = new THREE.Clock();

    // 4. Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting rig
    this.setupLighting();

    // 6. Build Maze, Walls, Doors, Pickups
    this.buildMaze();
    this.buildDoors();
    this.buildPaintBuckets();

    // 7. Build Characters
    this.playerGroup = this.createPlayerModel();
    this.scene.add(this.playerGroup);

    this.monsterGroup = this.createMonsterModel();
    this.scene.add(this.monsterGroup);

    // 8. Contact Shadows
    this.playerShadow = this.createContactShadow(1.2);
    this.scene.add(this.playerShadow);

    this.monsterShadow = this.createContactShadow(1.8);
    this.scene.add(this.monsterShadow);

    // 9. Input and resize listeners
    this.bindEvents();

    // 10. Start game loop
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private setupLighting() {
    // Warm key light with shadows
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
    keyLight.position.set(40, 60, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 150;
    const d = 50;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Cool fill light
    const fillLight = new THREE.DirectionalLight(0xa5c4f5, 0.7);
    fillLight.position.set(-30, 40, -40);
    this.scene.add(fillLight);

    // Hemisphere light: Sky to Ground tone
    const hemiLight = new THREE.HemisphereLight(0xdde8ff, 0x111116, 0.7);
    this.scene.add(hemiLight);
  }

  // Generate procedural canvas texture for floor grid
  private createFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Clean stark Roblox style off-white/grey floor with grid
    ctx.fillStyle = '#1e212b';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#2d3345';
    ctx.lineWidth = 4;
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(GRID_SIZE * 0.5, GRID_SIZE * 0.5);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  // Generate sketchy border texture for maze walls (Roblox Colour or Die style)
  private createWallTexture(baseColorHex: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColorHex;
    ctx.fillRect(0, 0, 256, 256);

    // Black pencil / marker border lines like Colour or Die paper maze
    ctx.strokeStyle = '#0f1117';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 248);

    // Subtle hatch lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 2;
    for (let i = 20; i < 256; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return texture;
  }

  private buildMaze() {
    // 1. Floor
    const floorGeo = new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.createFloorTexture(),
      roughness: 0.65,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((GRID_SIZE * CELL_SIZE) / 2, 0, (GRID_SIZE * CELL_SIZE) / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Ceiling with subtle darkness
    const ceilingGeo = new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    const ceilingMat = new THREE.MeshBasicMaterial({ color: 0x050608 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set((GRID_SIZE * CELL_SIZE) / 2, 6, (GRID_SIZE * CELL_SIZE) / 2);
    this.scene.add(ceiling);

    // 3. Walls
    const wallHeight = 5.5;
    const wallGeo = new THREE.BoxGeometry(CELL_SIZE, wallHeight, CELL_SIZE);

    // Materials map for quick reuse
    const whiteWallMat = new THREE.MeshStandardMaterial({
      map: this.createWallTexture('#f3f4f6'),
      roughness: 0.8,
      metalness: 0.05,
    });

    const colorWallMats: Record<string, THREE.MeshStandardMaterial> = {
      R: new THREE.MeshStandardMaterial({
        map: this.createWallTexture('#ef4444'),
        roughness: 0.4,
        metalness: 0.15,
        emissive: new THREE.Color(0x7f1d1d),
        emissiveIntensity: 0.35,
      }),
      O: new THREE.MeshStandardMaterial({
        map: this.createWallTexture('#f97316'),
        roughness: 0.4,
        metalness: 0.15,
        emissive: new THREE.Color(0x9a3412),
        emissiveIntensity: 0.35,
      }),
      Y: new THREE.MeshStandardMaterial({
        map: this.createWallTexture('#eab308'),
        roughness: 0.4,
        metalness: 0.15,
        emissive: new THREE.Color(0x854d0e),
        emissiveIntensity: 0.35,
      }),
      G: new THREE.MeshStandardMaterial({
        map: this.createWallTexture('#22c55e'),
        roughness: 0.4,
        metalness: 0.15,
        emissive: new THREE.Color(0x166534),
        emissiveIntensity: 0.35,
      }),
      B: new THREE.MeshStandardMaterial({
        map: this.createWallTexture('#3b82f6'),
        roughness: 0.4,
        metalness: 0.15,
        emissive: new THREE.Color(0x1e40af),
        emissiveIntensity: 0.35,
      }),
      P: new THREE.MeshStandardMaterial({
        map: this.createWallTexture('#a855f7'),
        roughness: 0.4,
        metalness: 0.15,
        emissive: new THREE.Color(0x6b21a8),
        emissiveIntensity: 0.35,
      }),
    };

    const colorCharToType: Record<string, DoorColor> = {
      R: 'red',
      O: 'orange',
      Y: 'yellow',
      G: 'green',
      B: 'blue',
      P: 'purple',
    };

    for (let r = 0; r < MAZE_MAP.length; r++) {
      const row = MAZE_MAP[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch !== '0') {
          const posX = c * CELL_SIZE + CELL_SIZE / 2;
          const posZ = r * CELL_SIZE + CELL_SIZE / 2;

          let mat = whiteWallMat;
          let colorType: DoorColor | undefined = undefined;
          if (colorWallMats[ch]) {
            mat = colorWallMats[ch];
            colorType = colorCharToType[ch];
          }

          const wallMesh = new THREE.Mesh(wallGeo, mat);
          wallMesh.position.set(posX, wallHeight / 2, posZ);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          this.scene.add(wallMesh);
          this.wallMeshes.push(wallMesh);

          // Add to collision
          this.collisionBoxes.push({
            minX: posX - CELL_SIZE / 2,
            minZ: posZ - CELL_SIZE / 2,
            maxX: posX + CELL_SIZE / 2,
            maxZ: posZ + CELL_SIZE / 2,
            type: ch === 'W' ? 'white_wall' : 'color_wall',
            color: colorType,
          });
        }
      }
    }
  }

  // Composite 3-part Door Model with Frame, Glowing Panel, and Math Padlock
  private buildDoors() {
    this.doors.forEach((door) => {
      const group = new THREE.Group();
      group.position.set(door.x, 0, door.z);
      group.rotation.y = door.rotationY;

      const def = COLOR_DEFINITIONS[door.id];
      const doorColor = new THREE.Color(def.hex);
      const emissiveColor = new THREE.Color(def.emissiveHex);

      // 1. Frame Pillars (Left, Right, Top)
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x1f2430,
        roughness: 0.3,
        metalness: 0.8,
      });
      const pillarGeo = new THREE.BoxGeometry(0.5, 4.8, 0.6);
      const leftPillar = new THREE.Mesh(pillarGeo, frameMat);
      leftPillar.position.set(-1.8, 2.4, 0);
      leftPillar.castShadow = true;
      group.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, frameMat);
      rightPillar.position.set(1.8, 2.4, 0);
      rightPillar.castShadow = true;
      group.add(rightPillar);

      const topPillar = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.5, 0.6), frameMat);
      topPillar.position.set(0, 4.6, 0);
      topPillar.castShadow = true;
      group.add(topPillar);

      // 2. Door Slab (Glowing neon slab that slides/fades when opened)
      const slabGeo = new THREE.BoxGeometry(3.2, 4.4, 0.25);
      const slabMat = new THREE.MeshPhysicalMaterial({
        color: doorColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.3,
        clearcoat: 1.0,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, 2.2, 0);
      slab.castShadow = true;
      slab.name = 'door_slab';
      group.add(slab);

      // 3. Math Terminal Lock Symbol / Keyhole Screen
      const lockGeo = new THREE.BoxGeometry(0.8, 1.0, 0.35);
      const lockMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.2,
        metalness: 0.9,
      });
      const lock = new THREE.Mesh(lockGeo, lockMat);
      lock.position.set(0, 2.2, 0.08);
      lock.name = 'door_lock';
      group.add(lock);

      // Screen glow
      const screenGeo = new THREE.PlaneGeometry(0.5, 0.5);
      const screenMat = new THREE.MeshBasicMaterial({
        color: def.id === 'white' ? 0xffffff : doorColor,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 2.2, 0.27);
      group.add(screen);

      // Ambient door glow light
      const doorLight = new THREE.PointLight(doorColor, 2, 7);
      doorLight.position.set(0, 2.5, 0.8);
      group.add(doorLight);

      this.scene.add(group);
      this.doorGroups.set(door.id, group);

      // Add to collision boxes when locked (thin slab matching orientation)
      const isZAxisDoor = Math.abs(door.rotationY) > 0.1;
      this.collisionBoxes.push({
        minX: isZAxisDoor ? door.x - 0.35 : door.x - 1.8,
        maxX: isZAxisDoor ? door.x + 0.35 : door.x + 1.8,
        minZ: isZAxisDoor ? door.z - 1.8 : door.z - 0.35,
        maxZ: isZAxisDoor ? door.z + 1.8 : door.z + 0.35,
        type: 'door',
        color: door.id,
      });
    });
  }

  // Paint Bucket items in the maze to pick up colors
  private buildPaintBuckets() {
    this.buckets.forEach((bucket) => {
      const group = new THREE.Group();
      group.position.set(bucket.x, 0.8, bucket.z);

      const def = COLOR_DEFINITIONS[bucket.id];
      const paintColor = new THREE.Color(def.hex);

      // 1. Bucket Body
      const bucketGeo = new THREE.CylinderGeometry(0.4, 0.35, 0.6, 16);
      const bucketMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.25,
      });
      const bucketMesh = new THREE.Mesh(bucketGeo, bucketMat);
      bucketMesh.castShadow = true;
      group.add(bucketMesh);

      // 2. Liquid Paint Top
      const paintGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 16);
      const paintMat = new THREE.MeshPhysicalMaterial({
        color: paintColor,
        emissive: paintColor,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.1,
        clearcoat: 1.0,
      });
      const paintMesh = new THREE.Mesh(paintGeo, paintMat);
      paintMesh.position.set(0, 0.28, 0);
      group.add(paintMesh);

      // 3. Floating rotating Paint Gem / Rune above bucket
      const gemGeo = new THREE.OctahedronGeometry(0.25);
      const gemMesh = new THREE.Mesh(gemGeo, paintMat);
      gemMesh.position.set(0, 0.85, 0);
      gemMesh.name = 'floating_gem';
      group.add(gemMesh);

      // Glowing light
      const pLight = new THREE.PointLight(paintColor, 2.5, 6);
      pLight.position.set(0, 0.8, 0);
      group.add(pLight);

      this.scene.add(group);
      this.bucketGroups.set(bucket.id, group);
    });
  }

  // Roblox Blocky Player Avatar with Paint Tool
  private createPlayerModel(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(this.player.x, 0, this.player.z);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 }); // Classic Roblox yellow skin
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 }); // Classic blue shirt
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 }); // Classic green pants

    // Head
    const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 2.35, 0);
    head.castShadow = true;
    group.add(head);

    // Roblox Cute Face on Front (-Z)
    const faceMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.04), faceMat);
    leftEye.position.set(-0.16, 2.4, -0.36);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.04), faceMat);
    rightEye.position.set(0.16, 2.4, -0.36);
    group.add(rightEye);

    const smile = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.04), faceMat);
    smile.position.set(0, 2.22, -0.36);
    group.add(smile);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(1.0, 1.1, 0.5);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.set(0, 1.45, 0);
    torso.castShadow = true;
    group.add(torso);

    // Left Arm & Right Arm
    const armGeo = new THREE.BoxGeometry(0.4, 1.0, 0.4);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.75, 1.45, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.75, 1.45, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    this.playerArms = { left: leftArm, right: rightArm };

    // Left Leg & Right Leg
    const legGeo = new THREE.BoxGeometry(0.45, 1.0, 0.45);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.25, 0.5, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.25, 0.5, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    this.playerLegs = { left: leftLeg, right: rightLeg };

    // Paint Roller in right hand (held forward in -Z)
    const toolGroup = new THREE.Group();
    toolGroup.position.set(0.85, 1.1, -0.2);
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    handle.rotation.x = -Math.PI / 4;
    toolGroup.add(handle);

    const paintRollerMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.5,
    });
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4), paintRollerMat);
    roller.rotation.z = Math.PI / 2;
    roller.position.set(0, 0.35, -0.25);
    toolGroup.add(roller);
    this.paintCanMesh = roller;
    group.add(toolGroup);

    return group;
  }

  // Shadow Lurker Monster (Terrifying nightmare beast with gaping needle-teeth jaw, horns & tendrils)
  private createMonsterModel(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(this.monster.x, 0, this.monster.z);

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x030306,
      roughness: 0.85,
      metalness: 0.35,
    });

    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xeae6d8,
      roughness: 0.35,
      metalness: 0.1,
    });

    const voidMouthMat = new THREE.MeshBasicMaterial({ color: 0x220005 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const clawMat = new THREE.MeshStandardMaterial({ color: 0x08080c, roughness: 0.3, metalness: 0.7 });

    // 1. Tall Menacing Torso with demonic ribcage
    const bodyGeo = new THREE.BoxGeometry(1.3, 2.5, 0.9);
    const body = new THREE.Mesh(bodyGeo, darkMat);
    body.position.set(0, 2.25, 0);
    body.castShadow = true;
    group.add(body);

    // Glowing skeletal chest ribs
    for (let r = 0; r < 3; r++) {
      const ribGeo = new THREE.BoxGeometry(0.9, 0.08, 0.12);
      const ribMat = new THREE.MeshBasicMaterial({ color: 0xaa0015 });
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.position.set(0, 2.7 - r * 0.32, 0.46);
      group.add(rib);
    }

    // 2. Spine Tendrils / Writhing Shadow Spikes (Arching from back)
    this.monsterTendrils = [];
    const tendrilGeo = new THREE.ConeGeometry(0.08, 1.5, 5);
    const tendrilPositions = [
      { x: -0.45, y: 3.1, z: -0.48, rx: -0.6, rz: -0.5 },
      { x: 0.45, y: 3.1, z: -0.48, rx: -0.6, rz: 0.5 },
      { x: -0.35, y: 2.3, z: -0.48, rx: -0.4, rz: -0.4 },
      { x: 0.35, y: 2.3, z: -0.48, rx: -0.4, rz: 0.4 },
    ];
    tendrilPositions.forEach((tp) => {
      const tendril = new THREE.Mesh(tendrilGeo, darkMat);
      tendril.position.set(tp.x, tp.y, tp.z);
      tendril.rotation.set(tp.rx, 0, tp.rz);
      tendril.castShadow = true;
      group.add(tendril);
      this.monsterTendrils.push(tendril);
    });

    // 3. Creepy Skull (Upper Head)
    const skullGroup = new THREE.Group();
    skullGroup.position.set(0, 4.0, 0);

    const skullGeo = new THREE.BoxGeometry(1.05, 0.75, 1.0);
    const skull = new THREE.Mesh(skullGeo, darkMat);
    skull.castShadow = true;
    skullGroup.add(skull);
    this.monsterHead = skull;

    // Dark Curved Demon Horns
    const hornGeo = new THREE.ConeGeometry(0.12, 0.85, 5);
    const leftHorn = new THREE.Mesh(hornGeo, darkMat);
    leftHorn.position.set(-0.38, 0.55, -0.2);
    leftHorn.rotation.set(-0.5, 0, -0.4);
    skullGroup.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, darkMat);
    rightHorn.position.set(0.38, 0.55, -0.2);
    rightHorn.rotation.set(-0.5, 0, 0.4);
    skullGroup.add(rightHorn);

    // Mouth Void Interior
    const mouthVoidGeo = new THREE.BoxGeometry(0.85, 0.4, 0.35);
    const mouthVoid = new THREE.Mesh(mouthVoidGeo, voidMouthMat);
    mouthVoid.position.set(0, -0.25, 0.36);
    skullGroup.add(mouthVoid);

    // Upper Razor Teeth (Needle Cones pointing down)
    const toothGeo = new THREE.ConeGeometry(0.045, 0.22, 4);
    for (let t = -3; t <= 3; t++) {
      if (t === 0) continue;
      const tooth = new THREE.Mesh(toothGeo, boneMat);
      tooth.position.set(t * 0.11, -0.32, 0.49);
      tooth.rotation.x = Math.PI; // point down
      skullGroup.add(tooth);
    }

    // 4 Glowing Menacing Red Eyes
    const eyeGeo = new THREE.BoxGeometry(0.18, 0.08, 0.1);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 0.08, 0.49);
    skullGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 0.08, 0.49);
    skullGroup.add(rightEye);

    // Secondary smaller demonic eye dots
    const miniEyeGeo = new THREE.BoxGeometry(0.08, 0.06, 0.1);
    const leftMiniEye = new THREE.Mesh(miniEyeGeo, eyeMat);
    leftMiniEye.position.set(-0.16, 0.22, 0.48);
    skullGroup.add(leftMiniEye);

    const rightMiniEye = new THREE.Mesh(miniEyeGeo, eyeMat);
    rightMiniEye.position.set(0.16, 0.22, 0.48);
    skullGroup.add(rightMiniEye);

    this.monsterEyes = [leftEye, rightEye, leftMiniEye, rightMiniEye];

    // Intense Red Face Point Light (Illuminates face during jumpscare)
    const eyeLight = new THREE.PointLight(0xff0022, 3.2, 7);
    eyeLight.position.set(0, 0.1, 0.65);
    skullGroup.add(eyeLight);
    this.monsterEyeLight = eyeLight;

    group.add(skullGroup);

    // 4. Hinged Lower Jaw (Can unhinge and snap open during jumpscare)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, 3.65, 0.15); // hinge pivot

    const jawBoneGeo = new THREE.BoxGeometry(0.98, 0.42, 0.9);
    const jawBone = new THREE.Mesh(jawBoneGeo, darkMat);
    jawBone.position.set(0, -0.15, 0);
    jawBone.castShadow = true;
    jawGroup.add(jawBone);

    // Lower Razor Teeth pointing up
    for (let t = -3; t <= 3; t++) {
      if (t === 0) continue;
      const tooth = new THREE.Mesh(toothGeo, boneMat);
      tooth.position.set(t * 0.11, 0.12, 0.38);
      jawGroup.add(tooth);
    }
    group.add(jawGroup);
    this.monsterJaw = jawGroup;

    // 5. Long Spindly Arms with Razor Dagger Claws
    const mArmGeo = new THREE.BoxGeometry(0.32, 2.3, 0.32);
    const clawGeo = new THREE.ConeGeometry(0.045, 0.45, 4);

    // Left Arm + Claws
    const mLeftArm = new THREE.Mesh(mArmGeo, darkMat);
    mLeftArm.position.set(-0.95, 1.85, 0);
    mLeftArm.castShadow = true;
    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(c * 0.08, -1.25, 0.12);
      claw.rotation.x = Math.PI / 2.8;
      mLeftArm.add(claw);
    }
    group.add(mLeftArm);

    // Right Arm + Claws
    const mRightArm = new THREE.Mesh(mArmGeo, darkMat);
    mRightArm.position.set(0.95, 1.85, 0);
    mRightArm.castShadow = true;
    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(c * 0.08, -1.25, 0.12);
      claw.rotation.x = Math.PI / 2.8;
      mRightArm.add(claw);
    }
    group.add(mRightArm);
    this.monsterArms = { left: mLeftArm, right: mRightArm };

    // 6. Digitigrade Shadow Legs
    const mLegGeo = new THREE.BoxGeometry(0.42, 1.65, 0.45);
    const mLeftLeg = new THREE.Mesh(mLegGeo, darkMat);
    mLeftLeg.position.set(-0.38, 0.82, 0);
    mLeftLeg.castShadow = true;
    group.add(mLeftLeg);

    const mRightLeg = new THREE.Mesh(mLegGeo, darkMat);
    mRightLeg.position.set(0.38, 0.82, 0);
    mRightLeg.castShadow = true;
    group.add(mRightLeg);

    // Menacing ambient red aura light
    const monsterLight = new THREE.PointLight(0xff0022, 2.8, 10);
    monsterLight.position.set(0, 3.2, 0.6);
    group.add(monsterLight);

    return group;
  }

  // Soft contact shadow circle beneath actors
  private createContactShadow(radius: number): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
    // Radial shadow texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;
    return mesh;
  }

  private bindEvents() {
    const addWinListener = <K extends keyof WindowEventMap>(
      type: K,
      listener: (this: Window, ev: WindowEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ) => {
      window.addEventListener(type, listener, options);
      this._cleanupCallbacks.push(() => window.removeEventListener(type, listener, options));
    };

    const addDocListener = <K extends keyof DocumentEventMap>(
      type: K,
      listener: (this: Document, ev: DocumentEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ) => {
      document.addEventListener(type, listener, options);
      this._cleanupCallbacks.push(() => document.removeEventListener(type, listener, options));
    };

    const addContainerListener = <K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ) => {
      if (this.container) {
        this.container.addEventListener(type, listener, options);
        this._cleanupCallbacks.push(() => this.container?.removeEventListener(type, listener, options));
      }
    };

    // Ensure window has focus on click
    addContainerListener('click', () => {
      window.focus();
    });

    const handleKey = (code: string, key: string, isDown: boolean) => {
      const k = key ? key.toLowerCase() : '';
      if (code === 'KeyW' || k === 'w' || code === 'ArrowUp' || key === 'ArrowUp') this.keys.KeyW = isDown;
      if (code === 'KeyS' || k === 's' || code === 'ArrowDown' || key === 'ArrowDown') this.keys.KeyS = isDown;
      if (code === 'KeyA' || k === 'a' || code === 'ArrowLeft' || key === 'ArrowLeft') this.keys.KeyA = isDown;
      if (code === 'KeyD' || k === 'd' || code === 'ArrowRight' || key === 'ArrowRight') this.keys.KeyD = isDown;
      if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'Shift') this.keys.ShiftLeft = isDown;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key) ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
      ) {
        e.preventDefault();
      }
      handleKey(e.code, e.key, true);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key) ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
      ) {
        e.preventDefault();
      }
      handleKey(e.code, e.key, false);
    };

    addWinListener('keydown', onKeyDown, { capture: true });
    addWinListener('keyup', onKeyUp, { capture: true });
    addDocListener('keydown', onKeyDown, { capture: true });
    addDocListener('keyup', onKeyUp, { capture: true });
    addWinListener('click', () => window.focus());

    // Pointer drag looking (mouse or touch)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const startDrag = (clientX: number, clientY: number) => {
      isDragging = true;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const moveDrag = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      this.cameraRotationY -= deltaX * 0.005 * this.cameraSensitivity;
      this.cameraPitch = Math.max(0.05, Math.min(1.1, this.cameraPitch + deltaY * 0.004 * this.cameraSensitivity));
    };

    const stopDrag = () => {
      isDragging = false;
    };

    addContainerListener('mousedown', ((e: MouseEvent) => {
      if (e.button === 0) startDrag(e.clientX, e.clientY);
    }) as any);
    addWinListener('mousemove', ((e: MouseEvent) => moveDrag(e.clientX, e.clientY)) as any);
    addWinListener('mouseup', stopDrag);

    // Touch look on container
    addContainerListener('touchstart', ((e: TouchEvent) => {
      if (e.touches.length > 0) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }) as any, { passive: true });
    addWinListener('touchmove', ((e: TouchEvent) => {
      if (e.touches.length > 0) {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }) as any, { passive: true });
    addWinListener('touchend', stopDrag);

    // Window resize
    addWinListener('resize', () => {
      if (!this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight || 1;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  public rotateCamera(amount: number) {
    this.cameraRotationY += amount * this.cameraSensitivity;
  }

  // Update Paint Can color when player collects or equips paint
  public updatePlayerColorVisual() {
    if (this.paintCanMesh && this.player.activeColor) {
      const def = COLOR_DEFINITIONS[this.player.activeColor];
      const col = new THREE.Color(def.hex);
      (this.paintCanMesh.material as THREE.MeshStandardMaterial).color.copy(col);
      (this.paintCanMesh.material as THREE.MeshStandardMaterial).emissive.copy(new THREE.Color(def.emissiveHex));
    }
  }

  // Check collision against walls & locked doors with smooth sliding push-out
  private checkCollision(newX: number, newZ: number, radius: number): { x: number; z: number } {
    let finalX = newX;
    let finalZ = newZ;

    for (const box of this.collisionBoxes) {
      // Check if it's a door and whether it is already unlocked
      if (box.type === 'door' && box.color) {
        const doorObj = this.doors.find((d) => d.id === box.color);
        if (doorObj && doorObj.isUnlocked) {
          continue; // Player can pass freely through unlocked door!
        }
      }

      // Clamp circle center to box bounds
      const clampedX = Math.max(box.minX, Math.min(finalX, box.maxX));
      const clampedZ = Math.max(box.minZ, Math.min(finalZ, box.maxZ));

      const dx = finalX - clampedX;
      const dz = finalZ - clampedZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = radius - dist;
          finalX += (dx / dist) * overlap;
          finalZ += (dz / dist) * overlap;
        } else {
          // If center is completely inside box, push out towards nearest edge
          const distLeft = Math.abs(finalX - box.minX);
          const distRight = Math.abs(finalX - box.maxX);
          const distTop = Math.abs(finalZ - box.minZ);
          const distBottom = Math.abs(finalZ - box.maxZ);
          const minDist = Math.min(distLeft, distRight, distTop, distBottom);

          if (minDist === distLeft) finalX = box.minX - radius;
          else if (minDist === distRight) finalX = box.maxX + radius;
          else if (minDist === distTop) finalZ = box.minZ - radius;
          else finalZ = box.maxZ + radius;
        }
      }
    }

    return { x: finalX, z: finalZ };
  }

  // Check direct line of sight between two positions (verifies no walls or locked doors block the view)
  public hasLineOfSight(x1: number, z1: number, x2: number, z2: number): boolean {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.1) return true;

    for (const box of this.collisionBoxes) {
      if (box.type === 'door' && box.color) {
        const doorObj = this.doors.find((d) => d.id === box.color);
        if (doorObj && doorObj.isUnlocked) continue; // Unlocked doors can be seen through
      }

      // Quick bounding box rejection
      if (
        Math.min(x1, x2) > box.maxX ||
        Math.max(x1, x2) < box.minX ||
        Math.min(z1, z2) > box.maxZ ||
        Math.max(z1, z2) < box.minZ
      ) {
        continue;
      }

      // Liang-Barsky parametric line segment clipping
      let t0 = 0.0;
      let t1 = 1.0;
      const p = [-dx, dx, -dz, dz];
      const q = [x1 - box.minX, box.maxX - x1, z1 - box.minZ, box.maxZ - z1];

      let intersects = true;
      for (let i = 0; i < 4; i++) {
        if (p[i] === 0) {
          if (q[i] < 0) {
            intersects = false;
            break;
          }
        } else {
          const t = q[i] / p[i];
          if (p[i] < 0) {
            if (t > t1) { intersects = false; break; }
            if (t > t0) t0 = t;
          } else {
            if (t < t0) { intersects = false; break; }
            if (t < t1) t1 = t;
          }
        }
      }

      if (intersects && t0 <= t1 && t0 < 0.99 && t1 > 0.01) {
        // Line segment intersects this wall
        return false;
      }
    }

    return true;
  }

  // Helper: check if a grid cell (c, r) is walkable (not a wall or locked door)
  public isCellWalkable(c: number, r: number, ignoreLockedDoors: boolean = false): boolean {
    if (r < 0 || r >= MAZE_MAP.length) return false;
    const row = MAZE_MAP[r];
    if (c < 0 || c >= row.length) return false;
    if (row[c] !== '0') return false;

    if (!ignoreLockedDoors) {
      for (const door of this.doors) {
        if (!door.isUnlocked) {
          const doorC = Math.floor(door.x / CELL_SIZE);
          const doorR = Math.floor(door.z / CELL_SIZE);
          if (doorC === c && doorR === r) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // BFS Pathfinding on the 27x27 grid to navigate maze corridors without ever hitting walls
  public findGridPath(startC: number, startR: number, goalC: number, goalR: number): { c: number; r: number }[] | null {
    const sC = Math.max(0, Math.min(GRID_SIZE - 1, startC));
    const sR = Math.max(0, Math.min(GRID_SIZE - 1, startR));
    let gC = Math.max(0, Math.min(GRID_SIZE - 1, goalC));
    let gR = Math.max(0, Math.min(GRID_SIZE - 1, goalR));

    // If goal cell is not walkable (e.g. wall or locked door), find the closest walkable neighboring cell
    if (!this.isCellWalkable(gC, gR)) {
      let nearestDist = Infinity;
      let bestNeighbor: { c: number; r: number } | null = null;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dc === 0 && dr === 0) continue;
          const nc = gC + dc;
          const nr = gR + dr;
          if (this.isCellWalkable(nc, nr)) {
            const d = dc * dc + dr * dr;
            if (d < nearestDist) {
              nearestDist = d;
              bestNeighbor = { c: nc, r: nr };
            }
          }
        }
      }
      if (bestNeighbor) {
        gC = bestNeighbor.c;
        gR = bestNeighbor.r;
      } else {
        return null;
      }
    }

    // If start cell is somehow stuck in a wall, find nearest open neighbor
    let actualSC = sC;
    let actualSR = sR;
    if (!this.isCellWalkable(actualSC, actualSR)) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nc = sC + dc;
          const nr = sR + dr;
          if (this.isCellWalkable(nc, nr)) {
            actualSC = nc;
            actualSR = nr;
            break;
          }
        }
        if (actualSC !== sC || actualSR !== sR) break;
      }
    }

    if (actualSC === gC && actualSR === gR) {
      return [{ c: actualSC, r: actualSR }];
    }

    const queue: { c: number; r: number }[] = [{ c: actualSC, r: actualSR }];
    const visited = new Uint8Array(GRID_SIZE * GRID_SIZE);
    const parent = new Int16Array(GRID_SIZE * GRID_SIZE).fill(-1);

    visited[actualSR * GRID_SIZE + actualSC] = 1;

    const dirs = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 },
    ];

    let found = false;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.c === gC && curr.r === gR) {
        found = true;
        break;
      }

      for (const d of dirs) {
        const nc = curr.c + d.dc;
        const nr = curr.r + d.dr;

        if (this.isCellWalkable(nc, nr)) {
          const idx = nr * GRID_SIZE + nc;
          if (!visited[idx]) {
            visited[idx] = 1;
            parent[idx] = curr.r * GRID_SIZE + curr.c;
            queue.push({ c: nc, r: nr });
          }
        }
      }
    }

    if (!found) return null;

    // Reconstruct path
    const path: { c: number; r: number }[] = [];
    let curIdx = gR * GRID_SIZE + gC;
    const startIdx = actualSR * GRID_SIZE + actualSC;

    while (curIdx !== -1) {
      const r = Math.floor(curIdx / GRID_SIZE);
      const c = curIdx % GRID_SIZE;
      path.push({ c, r });
      if (curIdx === startIdx) break;
      curIdx = parent[curIdx];
    }

    path.reverse();
    return path;
  }

  // Check if player is camouflaged against their color wall
  private updateCamouflage() {
    if (!this.player.activeColor) {
      this.player.isCamouflaged = false;
      return;
    }

    let touchingColorWall = false;
    const playerRadius = 1.6; // Proximity threshold to blend in

    for (const box of this.collisionBoxes) {
      if (box.type === 'color_wall' && box.color === this.player.activeColor) {
        const dx = Math.max(box.minX - this.player.x, 0, this.player.x - box.maxX);
        const dz = Math.max(box.minZ - this.player.z, 0, this.player.z - box.maxZ);
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < playerRadius) {
          touchingColorWall = true;
          break;
        }
      }
    }

    this.player.isCamouflaged = touchingColorWall;

    // Visual effect: When camouflaged, player avatar slightly blends in (semi-transparent)
    this.playerGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = touchingColorWall ? 0.35 : 1.0;
      }
    });
  }

  // Check proximity to Doors and Paint Buckets
  private checkInteractions() {
    // 1. Proximity to Doors
    let nearestDoor: DoorObject | null = null;
    let minDoorDist = 4.2;

    for (const door of this.doors) {
      const dist = Math.hypot(door.x - this.player.x, door.z - this.player.z);
      if (dist < minDoorDist && !door.isUnlocked) {
        nearestDoor = door;
        break;
      }
    }
    if (this.onNearDoor) {
      this.onNearDoor(nearestDoor);
    }

    // 2. Proximity to Paint Buckets
    let nearestBucket: PaintBucketObject | null = null;
    let minBucketDist = 3.0;

    for (const bucket of this.buckets) {
      if (bucket.isCollected) continue;
      const dist = Math.hypot(bucket.x - this.player.x, bucket.z - this.player.z);
      if (dist < minBucketDist) {
        nearestBucket = bucket;
        // Auto pick up or ready to pick up!
        this.collectPaint(bucket.id);
        break;
      }
    }
    if (this.onNearBucket) {
      this.onNearBucket(nearestBucket);
    }
  }

  // Unlock door animation & state
  public unlockDoor(doorColor: DoorColor) {
    const door = this.doors.find((d) => d.id === doorColor);
    if (!door) return;

    // The White door requires all 6 prerequisite questions/doors to be solved
    if (doorColor === 'white') {
      const REQUIRED_PREREQS: DoorColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
      const hasAllPrereqs = REQUIRED_PREREQS.every((c) => this.player.unlockedDoors.includes(c));
      if (!hasAllPrereqs) {
        return; // Guard against premature unlocking
      }
    }

    door.isUnlocked = true;
    if (!this.player.unlockedDoors.includes(doorColor)) {
      this.player.unlockedDoors.push(doorColor);
    }

    soundManager.playDoorUnlocked();

    // 1. Immediately remove door collision box so player can walk freely through the doorway!
    this.collisionBoxes = this.collisionBoxes.filter(
      (box) => !(box.type === 'door' && box.color === doorColor)
    );

    // 2. Automatically grant reward paint color!
    if (door.rewardPaint && door.rewardPaint !== 'escaped') {
      this.collectPaint(door.rewardPaint as DoorColor);
    }

    // 3. Visual door opening: Door slab slides way up into ceiling and lock vanishes
    const group = this.doorGroups.get(doorColor);
    if (group) {
      const slab = group.getObjectByName('door_slab');
      const lock = group.getObjectByName('door_lock');
      if (slab) {
        const startY = slab.position.y;
        const targetY = startY + 6.0;
        let p = 0;
        const interval = setInterval(() => {
          p += 0.08;
          slab.position.y = THREE.MathUtils.lerp(startY, targetY, p);
          if (lock) lock.position.y = slab.position.y;
          if (p >= 1) {
            clearInterval(interval);
            slab.visible = false;
            if (lock) lock.visible = false;
          }
        }, 16);
      }
    }

    // If this is the White door, the player has won!
    if (doorColor === 'white') {
      this.player.hasWon = true;
      soundManager.playVictory();
    }
  }

  // Collect paint bucket
  public collectPaint(color: DoorColor) {
    const bucket = this.buckets.find((b) => b.id === color);
    if (!bucket || bucket.isCollected) return;

    bucket.isCollected = true;
    if (!this.player.collectedPaints.includes(color)) {
      this.player.collectedPaints.push(color);
    }
    this.player.activeColor = color;
    this.updatePlayerColorVisual();
    soundManager.playPaintPickup();

    // Hide or scale down bucket mesh
    const group = this.bucketGroups.get(color);
    if (group) {
      group.visible = false;
    }
  }

  // Update Shadow Monster AI with smart corridor pathfinding, strict wall collision & horror audio
  private updateMonster(delta: number) {
    const distToPlayer = Math.hypot(this.player.x - this.monster.x, this.player.z - this.monster.z);
    this.monster.distanceToPlayer = distToPlayer;

    // Monster sense player:
    // 1. Player MUST NOT be camouflaged against their color wall.
    // 2. Monster must have direct line of sight (no solid walls or locked doors in between) or be extremely close (hearing distance < 3.2m).
    const hasSightToPlayer = this.hasLineOfSight(this.monster.x, this.monster.z, this.player.x, this.player.z);
    const canSeePlayer = !this.player.isCamouflaged && (
      (hasSightToPlayer && distToPlayer < 18) ||
      distToPlayer < 3.2
    );

    let finalTargetX = this.monster.targetX;
    let finalTargetZ = this.monster.targetZ;

    if (canSeePlayer) {
      if (!this.monster.isChasing) {
        soundManager.playMonsterScreech();
      }
      this.monster.isChasing = true;
      finalTargetX = this.player.x;
      finalTargetZ = this.player.z;
      this.lastSeenPlayerPos = { x: this.player.x, z: this.player.z };
      this.monster.speed = 4.8; // Terrifying pursuit speed
    } else {
      // If monster lost sight (e.g. player turned corner or successfully camouflaged), chase last seen point first
      if (this.monster.isChasing && this.lastSeenPlayerPos) {
        finalTargetX = this.lastSeenPlayerPos.x;
        finalTargetZ = this.lastSeenPlayerPos.z;
        this.monster.speed = 4.2;

        const distToLastSeen = Math.hypot(this.lastSeenPlayerPos.x - this.monster.x, this.lastSeenPlayerPos.z - this.monster.z);
        if (distToLastSeen < 1.8) {
          // Reached corner, lost player
          this.lastSeenPlayerPos = null;
          this.monster.isChasing = false;
        }
      } else {
        this.monster.isChasing = false;
        this.monster.speed = 3.3;

        // Patrol along corridor waypoints
        const currentPatrol = MONSTER_PATROL_POINTS[this.currentPatrolIndex];
        const distToPatrol = Math.hypot(currentPatrol.x - this.monster.x, currentPatrol.z - this.monster.z);
        if (distToPatrol < 2.5) {
          this.currentPatrolIndex = (this.currentPatrolIndex + 1) % MONSTER_PATROL_POINTS.length;
        }
        finalTargetX = MONSTER_PATROL_POINTS[this.currentPatrolIndex].x;
        finalTargetZ = MONSTER_PATROL_POINTS[this.currentPatrolIndex].z;
      }
    }

    this.monster.targetX = finalTargetX;
    this.monster.targetZ = finalTargetZ;

    const now = performance.now();

    // Check direct line of sight to final target (only if not recently blocked by a wall)
    const directLoS =
      now > this.directLoSDisabledUntil &&
      this.hasLineOfSight(this.monster.x, this.monster.z, finalTargetX, finalTargetZ);
    const distToTarget = Math.hypot(finalTargetX - this.monster.x, finalTargetZ - this.monster.z);

    let nextWpX = finalTargetX;
    let nextWpZ = finalTargetZ;

    // If direct line of sight is clear and not too far, sprint directly towards target
    if (directLoS && distToTarget < 14) {
      nextWpX = finalTargetX;
      nextWpZ = finalTargetZ;
      this.monsterPath = [];
    } else {
      // Navigate via BFS grid corridor waypoints around corners
      const needsNewPath = this.monsterPath.length === 0 || now - this.lastPathRecalcTime > 300;

      if (needsNewPath) {
        this.lastPathRecalcTime = now;
        const curC = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(this.monster.x / CELL_SIZE)));
        const curR = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(this.monster.z / CELL_SIZE)));
        const goalC = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(finalTargetX / CELL_SIZE)));
        const goalR = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(finalTargetZ / CELL_SIZE)));

        const path = this.findGridPath(curC, curR, goalC, goalR);
        if (path && path.length > 0) {
          this.monsterPath = path;
        }
      }

      if (this.monsterPath.length > 0) {
        // Pop cells we have already reached or passed
        const curC = Math.floor(this.monster.x / CELL_SIZE);
        const curR = Math.floor(this.monster.z / CELL_SIZE);
        while (this.monsterPath.length > 1 && this.monsterPath[0].c === curC && this.monsterPath[0].r === curR) {
          this.monsterPath.shift();
        }

        const targetNode = this.monsterPath[0];
        const nodeCenterX = targetNode.c * CELL_SIZE + CELL_SIZE / 2;
        const nodeCenterZ = targetNode.r * CELL_SIZE + CELL_SIZE / 2;
        const distToNode = Math.hypot(this.monster.x - nodeCenterX, this.monster.z - nodeCenterZ);

        if (distToNode < 1.2 && this.monsterPath.length > 1) {
          this.monsterPath.shift();
          const nextNode = this.monsterPath[0];
          nextWpX = nextNode.c * CELL_SIZE + CELL_SIZE / 2;
          nextWpZ = nextNode.r * CELL_SIZE + CELL_SIZE / 2;
        } else {
          nextWpX = nodeCenterX;
          nextWpZ = nodeCenterZ;
        }
      }
    }

    // Direction vector towards current waypoint
    const targetDx = nextWpX - this.monster.x;
    const targetDz = nextWpZ - this.monster.z;
    if (Math.hypot(targetDx, targetDz) > 0.05) {
      this._monsterDir.set(targetDx, 0, targetDz).normalize();
    }

    // STRICT WALL COLLISION RESOLUTION FOR MONSTER (Radius 0.70m)
    // Monster will NEVER clip or pass through walls!
    const stepDist = this.monster.speed * delta;
    const moveX = this._monsterDir.x * stepDist;
    const moveZ = this._monsterDir.z * stepDist;
    const targetNextX = this.monster.x + moveX;
    const targetNextZ = this.monster.z + moveZ;

    let resolved = this.checkCollision(targetNextX, targetNextZ, 0.70);

    // If impeded by a wall corner, slide along open axis
    if (Math.hypot(resolved.x - targetNextX, resolved.z - targetNextZ) > 0.005) {
      const resX = this.checkCollision(targetNextX, this.monster.z, 0.70);
      const resZ = this.checkCollision(this.monster.x, targetNextZ, 0.70);

      const distMovedX = Math.abs(resX.x - this.monster.x);
      const distMovedZ = Math.abs(resZ.z - this.monster.z);

      if (distMovedX > distMovedZ && distMovedX > 0.005) {
        resolved = resX;
      } else if (distMovedZ > 0.005) {
        resolved = resZ;
      }
    }

    // Measure actual distance moved this frame
    const distMoved = Math.hypot(resolved.x - this.monster.x, resolved.z - this.monster.z);
    const hitWall = distMoved < stepDist * 0.4;

    if (hitWall) {
      this.monsterStuckTimer += delta;

      // PUSING! (Instantly turn away from wall into an open corridor)
      this.directLoSDisabledUntil = now + 2500; // Force BFS pathfinding around corner

      const curC = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(this.monster.x / CELL_SIZE)));
      const curR = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(this.monster.z / CELL_SIZE)));
      const cellCenterX = curC * CELL_SIZE + CELL_SIZE / 2;
      const cellCenterZ = curR * CELL_SIZE + CELL_SIZE / 2;

      // Gently nudge towards center of current corridor cell to untangle from wall edge
      const toCenterX = cellCenterX - this.monster.x;
      const toCenterZ = cellCenterZ - this.monster.z;
      const centerDist = Math.hypot(toCenterX, toCenterZ);
      if (centerDist > 0.05) {
        const pull = Math.min(centerDist, stepDist * 2);
        const nudgeRes = this.checkCollision(
          this.monster.x + (toCenterX / centerDist) * pull,
          this.monster.z + (toCenterZ / centerDist) * pull,
          0.68
        );
        resolved.x = nudgeRes.x;
        resolved.z = nudgeRes.z;
      }

      // Check all 4 cardinal directions from current cell
      const cardinalDirs = [
        { dc: 0, dr: -1, x: 0, z: -1 }, // North
        { dc: 0, dr: 1, x: 0, z: 1 },   // South
        { dc: 1, dr: 0, x: 1, z: 0 },   // East
        { dc: -1, dr: 0, x: -1, z: 0 }, // West
      ];

      const openDirs = cardinalDirs.filter((d) => this.isCellWalkable(curC + d.dc, curR + d.dr));

      if (openDirs.length > 0) {
        // Exclude the direction that points directly into the blocked wall
        const nonBlockedDirs = openDirs.filter((d) => {
          const dot = d.x * this._monsterDir.x + d.z * this._monsterDir.z;
          return dot < 0.6; // Not the blocked direction
        });

        const choices = nonBlockedDirs.length > 0 ? nonBlockedDirs : openDirs;

        let chosenDir = choices[0];
        if (this.monster.isChasing) {
          // Choose open corridor leading closest to player
          let bestDist = Infinity;
          for (const d of choices) {
            const nextCenterX = (curC + d.dc) * CELL_SIZE + CELL_SIZE / 2;
            const nextCenterZ = (curR + d.dr) * CELL_SIZE + CELL_SIZE / 2;
            const dToP = Math.hypot(this.player.x - nextCenterX, this.player.z - nextCenterZ);
            if (dToP < bestDist) {
              bestDist = dToP;
              chosenDir = d;
            }
          }
        } else {
          // If patrolling, pick an open branch and advance patrol point
          chosenDir = choices[Math.floor(Math.random() * choices.length)];
          this.currentPatrolIndex = (this.currentPatrolIndex + 1) % MONSTER_PATROL_POINTS.length;
        }

        // PUSING: Instantly turn monster direction to face into the open corridor!
        this._monsterDir.set(chosenDir.x, 0, chosenDir.z).normalize();
        const turnAngle = Math.atan2(chosenDir.x, chosenDir.z);
        this.monsterGroup.rotation.y = turnAngle;

        // Invalidate old path so BFS immediately maps the route down this open corridor
        this.monsterPath = [];
        this.lastPathRecalcTime = 0;
      }

      // If still blocked after 0.35s, center in cell and switch target
      if (this.monsterStuckTimer > 0.35) {
        resolved.x = cellCenterX;
        resolved.z = cellCenterZ;
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % MONSTER_PATROL_POINTS.length;
        this.monsterPath = [];
        this.lastPathRecalcTime = 0;
        this.monsterStuckTimer = 0;
        if (this.monster.isChasing && distToPlayer > 8) {
          this.monster.isChasing = false; // Player safely slipped away
        }
      }
    } else {
      this.monsterStuckTimer = Math.max(0, this.monsterStuckTimer - delta * 3);
    }

    this.prevMonsterPos.x = resolved.x;
    this.prevMonsterPos.z = resolved.z;

    // Apply strict non-clipping collision coordinates
    this.monster.x = resolved.x;
    this.monster.z = resolved.z;

    // Smoothly rotate monster towards current movement direction
    if (this._monsterDir.lengthSq() > 0.001) {
      const angle = Math.atan2(this._monsterDir.x, this._monsterDir.z);
      this.monsterGroup.rotation.y = THREE.MathUtils.damp(this.monsterGroup.rotation.y, angle, 12, delta);
    }
    this.monsterGroup.position.set(this.monster.x, 0, this.monster.z);
    this.monsterShadow.position.set(this.monster.x, 0.02, this.monster.z);

    // Monster animation
    this.monsterAnimTime += delta * (this.monster.isChasing ? 9.5 : 5.5);

    // Spine tendrils writhing unnaturally in the dark fog
    this.monsterTendrils.forEach((tendril, idx) => {
      tendril.rotation.z = (idx % 2 === 0 ? -0.5 : 0.5) + Math.sin(this.monsterAnimTime * 3.5 + idx) * 0.25;
      tendril.rotation.x = -0.5 + Math.cos(this.monsterAnimTime * 2.8 + idx) * 0.2;
    });

    // Jaw drops slightly open when chasing
    if (this.monsterJaw && !this.isJumpscareActive) {
      this.monsterJaw.rotation.x = this.monster.isChasing ? 0.28 + Math.sin(this.monsterAnimTime * 8) * 0.1 : 0.04;
    }

    // Arms reaching out with razor claws when chasing
    if (this.monsterArms && !this.isJumpscareActive) {
      if (this.monster.isChasing) {
        this.monsterArms.left.rotation.x = -1.25 + Math.sin(this.monsterAnimTime) * 0.35;
        this.monsterArms.right.rotation.x = -1.25 - Math.sin(this.monsterAnimTime) * 0.35;
      } else {
        this.monsterArms.left.rotation.x = Math.sin(this.monsterAnimTime) * 0.55;
        this.monsterArms.right.rotation.x = -Math.sin(this.monsterAnimTime) * 0.55;
      }
    }

    // Creepy head twitch / tilt
    if (this.monsterHead && !this.isJumpscareActive) {
      this.monsterHead.rotation.y = Math.sin(this.monsterAnimTime * 0.7) * 0.25;
      this.monsterHead.rotation.z = Math.sin(this.monsterAnimTime * 2.2) * 0.08;
    }

    // Glowing menacing eyes intensify when chasing or close
    if (this.monsterEyes.length > 0) {
      for (const eye of this.monsterEyes) {
        (eye.material as THREE.MeshBasicMaterial).color.setHex(
          this.monster.isChasing ? 0xff0022 : 0xee1133
        );
      }
    }

    // Real-time dynamic horror audio system:
    // Dread drone, panic racing heartbeat, demonic growls
    soundManager.updateMonsterProximity(distToPlayer, this.monster.isChasing);

    // Player caught condition -> TRIGGER JUMPSCARE!
    if (!this.player.isCamouflaged && distToPlayer < 1.9 && !this.player.isTrapped && !this.isJumpscareActive) {
      this.triggerJumpscare();
    }
  }

  // Trigger heart-stopping horror jumpscare where monster lunges straight into the player's face
  private triggerJumpscare() {
    this.isJumpscareActive = true;
    this.jumpscareTimer = 0;
    this.monster.isChasing = false;

    // Explosive sub-bass and screech audio
    soundManager.playJumpscare();

    // Haptic feedback rumble for phone and tablet
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 40, 200, 50, 400]);
      } catch {
        // ignore
      }
    }

    if (this.onJumpscare) {
      this.onJumpscare(true, 0);
    }
  }

  private handlePlayerCaught() {
    this.player.lives -= 1;

    if (this.player.lives <= 0) {
      this.player.isTrapped = true;
    } else {
      // Respawn at safe start zone
      this.player.x = PLAYER_SPAWN.x;
      this.player.z = PLAYER_SPAWN.z;
      this.monster.x = MONSTER_SPAWN.x;
      this.monster.z = MONSTER_SPAWN.z;
      this.monster.isChasing = false;
      this.monsterPath = [];
      this.monsterStuckTimer = 0;
      this.lastSeenPlayerPos = null;

      // Reset camera
      this.cameraRotationY = -Math.PI / 2;
      this.cameraPitch = 0.25;

      // Close jaw
      if (this.monsterJaw) {
        this.monsterJaw.rotation.x = 0;
      }
    }

    if (this.onPlayerCaught) {
      this.onPlayerCaught();
    }
  }

  // Main Render Loop
  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.player.isTrapped || this.player.hasWon || this.isPaused) {
      soundManager.stopHorrorAmbiance();
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // ========================================================
    // CINEMATIC JUMPSCARE LUNGE (MONSTER FACE RIGHT AT SCREEN!)
    // ========================================================
    if (this.isJumpscareActive) {
      this.jumpscareTimer += delta;
      const duration = 1.45; // 1.45 seconds intense jumpscare
      const progress = Math.min(1, this.jumpscareTimer / duration);

      // 1. Face monster directly towards camera
      const toCamX = this.camera.position.x - this.monster.x;
      const toCamZ = this.camera.position.z - this.monster.z;
      const faceAngle = Math.atan2(toCamX, toCamZ);
      this.monsterGroup.rotation.y = faceAngle;

      // 2. Unhinge jaw wide open exposing sharp needle teeth!
      if (this.monsterJaw) {
        this.monsterJaw.rotation.x = Math.min(0.85, progress * 1.8);
      }

      // 3. Claws lunging aggressively towards the edges of the screen
      if (this.monsterArms) {
        this.monsterArms.left.rotation.x = -1.48;
        this.monsterArms.left.rotation.y = 0.42;
        this.monsterArms.right.rotation.x = -1.48;
        this.monsterArms.right.rotation.y = -0.42;
      }

      // 4. Frantic writhing of back spines & tendrils
      this.monsterTendrils.forEach((tendril, idx) => {
        tendril.rotation.z = Math.sin(this.jumpscareTimer * 30 + idx) * 0.45;
        tendril.rotation.x = Math.cos(this.jumpscareTimer * 25 + idx) * 0.35;
      });

      // 5. Monster head violent shake & glitch twitch
      if (this.monsterHead) {
        this.monsterHead.rotation.z = Math.sin(this.jumpscareTimer * 55) * 0.18;
        this.monsterHead.rotation.x = Math.cos(this.jumpscareTimer * 45) * 0.14;
      }

      // 6. Blinding crimson eye flare
      if (this.monsterEyeLight) {
        this.monsterEyeLight.intensity = 5.0 + Math.sin(this.jumpscareTimer * 45) * 2.5;
      }

      // 7. CAMERA ZOOM DIRECTLY INTO THE MONSTER'S FACE!
      // Face is at height y = 3.9. Distance snaps from 1.1m down to 0.40m right against screen lens!
      const faceY = 3.9;
      const targetDist = THREE.MathUtils.lerp(1.1, 0.4, Math.min(1, progress * 1.8));

      // Violent camera earthquake shake
      const shakeAmt = 0.09 * (1.1 - progress * 0.35);
      const shakeX = (Math.random() - 0.5) * shakeAmt;
      const shakeY = (Math.random() - 0.5) * shakeAmt;
      const shakeZ = (Math.random() - 0.5) * shakeAmt;

      this.camera.position.set(
        this.monster.x + Math.sin(faceAngle) * targetDist + shakeX,
        faceY + shakeY,
        this.monster.z + Math.cos(faceAngle) * targetDist + shakeZ
      );

      // Stare straight into the monster's gaping jaw and glowing eyes!
      this._tempVec.set(this.monster.x, faceY, this.monster.z);
      this.camera.lookAt(this._tempVec);

      if (this.onJumpscare) {
        this.onJumpscare(true, progress);
      }

      if (progress >= 1) {
        this.isJumpscareActive = false;
        if (this.onJumpscare) {
          this.onJumpscare(false, 1);
        }
        this.handlePlayerCaught();
      }

      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 1. Player movement & steering controls
    let moveForward = 0;
    let turnSteer = 0;

    if (this.keys.KeyW || this.keys.ArrowUp || this.autoWalk) moveForward += 1;
    if (this.keys.KeyS || this.keys.ArrowDown) moveForward -= 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) turnSteer += 1; // Left key turns camera left
    if (this.keys.KeyD || this.keys.ArrowRight) turnSteer -= 1; // Right key turns camera right

    // Mobile / touch input integration if present
    if (Math.abs(this.mobileMove.y) > 0.05) moveForward += this.mobileMove.y;
    if (Math.abs(this.mobileMove.x) > 0.05) turnSteer -= this.mobileMove.x;

    // Smooth camera steering when pressing Left / Right arrows or A / D
    if (turnSteer !== 0) {
      const turnRate = 2.6; // radians / second
      this.cameraRotationY += turnSteer * turnRate * delta;
    }

    const isSprint = this.keys.ShiftLeft || this.keys.ShiftRight;
    const baseSpeed = isSprint ? 7.5 : 5.2;

    const isMoving = Math.abs(moveForward) > 0.05;

    if (isMoving) {
      soundManager.playFootstep();

      // Forward vector derived from camera angle
      const fX = -Math.sin(this.cameraRotationY);
      const fZ = -Math.cos(this.cameraRotationY);

      const targetVx = fX * moveForward * baseSpeed;
      const targetVz = fZ * moveForward * baseSpeed;

      const nextX = this.player.x + targetVx * delta;
      const nextZ = this.player.z + targetVz * delta;

      // Collision check with smooth wall sliding
      const resolved = this.checkCollision(nextX, nextZ, 0.42);
      this.player.x = resolved.x;
      this.player.z = resolved.z;

      // Player faces movement direction without camera feedback loop
      const targetAngle = moveForward >= 0 ? this.cameraRotationY : this.cameraRotationY + Math.PI;
      this.player.angle = THREE.MathUtils.damp(this.player.angle, targetAngle, 18, delta);

      // Walk cycle animation
      this.walkCycle += delta * (isSprint ? 12 : 8);
      if (this.playerLegs) {
        this.playerLegs.left.rotation.x = Math.sin(this.walkCycle) * 0.6;
        this.playerLegs.right.rotation.x = -Math.sin(this.walkCycle) * 0.6;
      }
      if (this.playerArms) {
        this.playerArms.left.rotation.x = -Math.sin(this.walkCycle) * 0.5;
        this.playerArms.right.rotation.x = Math.sin(this.walkCycle) * 0.5;
      }
    } else if (turnSteer !== 0) {
      // Turning in place with Left / Right
      this.player.angle = THREE.MathUtils.damp(this.player.angle, this.cameraRotationY, 18, delta);
      this.walkCycle += delta * 5;
      if (this.playerLegs) {
        this.playerLegs.left.rotation.x = Math.sin(this.walkCycle) * 0.3;
        this.playerLegs.right.rotation.x = -Math.sin(this.walkCycle) * 0.3;
      }
    } else {
      // Idle reset
      if (this.playerLegs) {
        this.playerLegs.left.rotation.x = THREE.MathUtils.damp(this.playerLegs.left.rotation.x, 0, 10, delta);
        this.playerLegs.right.rotation.x = THREE.MathUtils.damp(this.playerLegs.right.rotation.x, 0, 10, delta);
      }
      if (this.playerArms) {
        this.playerArms.left.rotation.x = THREE.MathUtils.damp(this.playerArms.left.rotation.x, 0, 10, delta);
        this.playerArms.right.rotation.x = THREE.MathUtils.damp(this.playerArms.right.rotation.x, 0, 10, delta);
      }
    }

    // 2. Update Player mesh position and shadow
    this.playerGroup.position.set(this.player.x, 0, this.player.z);
    this.playerGroup.rotation.y = this.player.angle;
    this.playerShadow.position.set(this.player.x, 0.02, this.player.z);

    // 3. Smooth Camera Follow (Silky exponential damping)
    const camDist = 5.2;
    const camHeight = 3.0 + this.cameraPitch * 2.2;
    const targetCamX = this.player.x + Math.sin(this.cameraRotationY) * camDist;
    const targetCamZ = this.player.z + Math.cos(this.cameraRotationY) * camDist;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 14, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, camHeight, 14, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 14, delta);

    // Look slightly above player's head
    this._tempVec.set(this.player.x, 1.8, this.player.z);
    this.camera.lookAt(this._tempVec);

    // 4. Update floating gems on paint buckets
    this.bucketGroups.forEach((group) => {
      const gem = group.getObjectByName('floating_gem');
      if (gem) {
        gem.rotation.y += delta * 2.5;
        gem.position.y = 0.85 + Math.sin(this.clock.elapsedTime * 3) * 0.1;
      }
    });

    // 5. Camouflage, Interactions, and Monster AI
    this.updateCamouflage();
    this.checkInteractions();
    this.updateMonster(delta);

    // 6. Callback update to React UI HUD
    if (this.onStateUpdate) {
      this.onStateUpdate();
    }

    // 7. Render frame
    this.renderer.render(this.scene, this.camera);
  }

  // Cleanup resources
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    soundManager.stopHorrorAmbiance();

    // Remove all registered event listeners
    for (const cleanup of this._cleanupCallbacks) {
      try {
        cleanup();
      } catch {
        // ignore errors during cleanup
      }
    }
    this._cleanupCallbacks = [];

    try {
      this.renderer.dispose();
    } catch {
      // ignore
    }

    // Safely remove dom element from whatever parent it currently belongs to
    if (this.renderer?.domElement) {
      const parent = this.renderer.domElement.parentElement;
      if (parent) {
        try {
          parent.removeChild(this.renderer.domElement);
        } catch {
          // ignore if already detached
        }
      }
    }
  }
}
