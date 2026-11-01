/**
 * Core Three.js Game Engine for "طريق ناصر: مغامرة النخيل ثلاثية الأبعاد"
 * Implements full procedural environment, Nasser kinematics, NPC encounters,
 * lane navigation, obstacle collisions, win/loss evaluation, and camera modes.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createNasserModel,
  createLoyalModel,
  createEnemyModel,
  createPalmTree,
  createPitObstacle,
  createFallenLog,
  createRockObstacle,
  createHayBalesObstacle,
  createFenceObstacle,
  createSanctuaryArchway,
  createFortressGate,
  FortressGateAssembly,
  createDirtRoadTexture,
  createGrassTexture,
  createPalmBarkTexture,
  createIronKnightModel,
  createWoodenTankModel,
  createCatapultModel,
  createCatapultProjectile,
  IronKnightRig,
  WoodenTankAssembly,
  CatapultAssembly,
  CatapultProjectileAssembly,
  CharacterRig,
  ObstacleType,
} from './proceduralModels';
import { soundManager } from '../audio/soundManager';

export type TimeOfDayPreset = 'auto' | 'morning' | 'noon' | 'sunset' | 'night';
export type StageNumber = 1 | 2;
export type Stage2Phase = 'knights' | 'gate2' | 'tanks' | 'gate3' | 'catapult' | 'victory';

export interface GameState {
  stage: StageNumber;
  stage2Phase: Stage2Phase;
  knightsDefeated: number; // 0 to 5
  tanksDefeated: number; // 0 to 5
  catapultDestroyed: boolean;
  hasSword: boolean;
  health: number; // رصيد ناصر (طاقة وحياة), starts at 100
  score: number; // النقاط
  loyalPassed: number; // الموالون المكتملون (هدف 10)
  enemyPassed: number; // المعادون المكتملون (هدف 10)
  totalEncountersTarget: number; // 20 (10 + 10)
  distance: number; // المسافة المقطوعة
  isGameOver: boolean;
  isVictory: boolean;
  isPaused: boolean;
  isAtFortressGate: boolean; // وقف ناصر أمام بوابة الحصن
  gateTorn: boolean; // انقلعت بوابة الحصن
  weather: {
    preset: TimeOfDayPreset;
    timeOfDayLabel: string;
    isNight: boolean;
    windSpeedLabel: string;
    windGust: number;
  };
  activePrompt: {
    visible: boolean;
    npcType: 'loyal' | 'enemy' | null;
    npcName: string;
    phrase: string;
    distance: number;
  } | null;
  notification: {
    text: string;
    type: 'success' | 'danger' | 'warning' | 'info';
    timestamp: number;
  } | null;
}

export type CameraViewMode = 'chase' | 'firstPerson' | 'shoulder' | 'overhead' | 'free';

interface ActiveNPC {
  id: number;
  type: 'loyal' | 'enemy';
  rig: CharacterRig;
  zPos: number;
  laneX: number;
  targetLaneX: number;
  emergeSide: 'left' | 'right';
  hasSpoken: boolean;
  isResolved: boolean;
  isBanished: boolean;
  banishVelocity: THREE.Vector3;
}

interface ActiveObstacle {
  id: number;
  type: ObstacleType;
  group: THREE.Group;
  zPos: number;
  laneX: number;
  hasHit: boolean;
  boundsRadius: number;
  height: number;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private clock: THREE.Clock;

  // Visual Assets
  private dirtRoadTex: THREE.CanvasTexture;
  private grassTex: THREE.CanvasTexture;
  private palmBarkTex: THREE.CanvasTexture;

  // Environment Meshes
  private roadMesh: THREE.Mesh;
  private leftField: THREE.Mesh;
  private rightField: THREE.Mesh;
  private leftCanal: THREE.Mesh;
  private rightCanal: THREE.Mesh;
  private palmTrees: THREE.Group[] = [];
  private sanctuaryGroup: THREE.Group | null = null;
  private fortressAssembly: FortressGateAssembly | null = null;
  private sanctuarySpawned: boolean = false;
  private sanctuaryZ: number = 0;
  private isAtFortressGate: boolean = false;
  private gateTorn: boolean = false;
  private gateFlying: boolean = false;
  private gateFlyVelocity: THREE.Vector3 = new THREE.Vector3();
  private gateFlyRotVelocity: THREE.Vector3 = new THREE.Vector3();
  private postGateTimer: number = 0;

  // Stage 2 Properties ("يبدأ ناصر مرحلته الثانية و بيده سيف للقتال")
  private stage: StageNumber = 1;
  private stage2Phase: Stage2Phase = 'knights';
  private knightsDefeated: number = 0;
  private tanksDefeated: number = 0;
  private catapultDestroyed: boolean = false;
  private activeKnight: (IronKnightRig & {
    zPos: number;
    laneX: number;
    speed: number;
    isDying: boolean;
    deathTimer: number;
  }) | null = null;
  private activeTank: (WoodenTankAssembly & {
    zPos: number;
    laneX: number;
    speed: number;
    isDying: boolean;
    deathTimer: number;
  }) | null = null;
  private fortressGate2: FortressGateAssembly | null = null;
  private gate2Z: number = 0;
  private isAtGate2: boolean = false;
  private gate2Flying: boolean = false;
  private gate2FlyVelocity: THREE.Vector3 = new THREE.Vector3();
  private gate2FlyRotVelocity: THREE.Vector3 = new THREE.Vector3();
  private fortressGate3: FortressGateAssembly | null = null;
  private gate3Z: number = 0;
  private isAtGate3: boolean = false;
  private gate3Flying: boolean = false;
  private gate3FlyVelocity: THREE.Vector3 = new THREE.Vector3();
  private gate3FlyRotVelocity: THREE.Vector3 = new THREE.Vector3();
  private catapultAssembly: CatapultAssembly | null = null;
  private catapultZ: number = 0;
  private activeProjectiles: (CatapultProjectileAssembly & {
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    currentPos: THREE.Vector3;
    progress: number;
    speed: number;
    arcHeight: number;
  })[] = [];
  private catapultFireTimer: number = 0;
  private catapultShotsFired: number = 0;
  private catapultShotsResolved: number = 0;
  private lastNasserClickTime: number = 0;

  // Hero: Nasser
  private nasserRig: CharacterRig;
  private nasserBaseSpeed: number = 14.5;
  private currentForwardSpeed: number = 14.5;
  private targetLaneX: number = 0; // -1.7 (left), 0 (center), 1.7 (right)
  private currentX: number = 0;
  private nasserZ: number = 0;
  private nasserY: number = 0;
  private isJumping: boolean = false;
  private jumpTime: number = 0;
  private readonly jumpDuration: number = 0.65;
  private readonly jumpHeight: number = 1.6;

  // Nasser Action Animations
  private actionState: 'none' | 'hug' | 'strike' | 'stumble' = 'none';
  private actionTimer: number = 0;

  // Encounters & Spawns (Stage 1: 5 Loyals and 5 Enemies)
  private loyalCountTarget = 5;
  private enemyCountTarget = 5;
  private remainingLoyalToSpawn = 5;
  private remainingEnemyToSpawn = 5;
  private npcs: ActiveNPC[] = [];
  private obstacles: ActiveObstacle[] = [];
  private nextSpawnZ: number = 30;
  private nextNpcId: number = 1;
  private nextObstacleId: number = 1;

  // Particle Effects
  private particleGroup: THREE.Group;
  private activeSparks: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[] = [];

  // Dynamic Weather, Lighting & Wind
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private timeOfDayPreset: TimeOfDayPreset = 'auto';
  private timeOfDayProgress: number = 0.12;
  private windTime: number = 0;
  private windGust: number = 0.5;
  private windParticles: {
    mesh: THREE.Mesh;
    initialY: number;
    speedFactor: number;
    type: 'leaf' | 'dust' | 'firefly';
  }[] = [];
  private windParticleGroup!: THREE.Group;

  // Camera Orbit & Interactive Drag Controls
  private cameraMode: CameraViewMode = 'chase';
  private cameraPos = new THREE.Vector3(0, 3.2, -5.8);
  private cameraLookTarget = new THREE.Vector3(0, 1.5, 14);
  private orbitYaw: number = 0; // Horizontal rotation in radians
  private orbitPitch: number = 0.22; // Vertical elevation angle
  private orbitDistance: number = 6.2; // Camera distance
  private isPointerDown: boolean = false;
  private pointerStartX: number = 0;
  private pointerStartY: number = 0;
  private dragInitialX: number = 0;
  private dragInitialY: number = 0;
  private dragInitialLaneX: number = 0;
  private hasJumpedInCurrentDrag: boolean = false;
  private touchFeedbackRing: THREE.Mesh | null = null;
  private isStarted: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  // Screen Shake & Red Flash
  private shakeIntensity: number = 0;
  private flashOverlayEl: HTMLElement | null = null;

  // Game State & Callback
  private state: GameState;
  private onStateChange: (state: GameState) => void;

  constructor(container: HTMLElement, onStateChange: (state: GameState) => void) {
    this.container = container;
    this.onStateChange = onStateChange;

    this.state = {
      stage: 1,
      stage2Phase: 'knights',
      knightsDefeated: 0,
      tanksDefeated: 0,
      catapultDestroyed: false,
      hasSword: false,
      health: 100,
      score: 0,
      loyalPassed: 0,
      enemyPassed: 0,
      totalEncountersTarget: 10,
      distance: 0,
      isGameOver: false,
      isVictory: false,
      isPaused: false,
      isAtFortressGate: false,
      gateTorn: false,
      weather: {
        preset: 'auto',
        timeOfDayLabel: '🌅 الصباح المشرق',
        isNight: false,
        windSpeedLabel: '🍃 نسيم عليل',
        windGust: 0.5,
      },
      activePrompt: null,
      notification: {
        text: 'مرحباً بك يا ناصر في طريق النخيل! اسحب الشاشة للتوجيه وانقر نقرتين على ظهره للضرب بالسيف',
        type: 'info',
        timestamp: Date.now(),
      },
    };

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Setup Scene, Camera & Renderer with safe dimensions
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf6d396); // Warm golden sunset / desert agricultural sky
    this.scene.fog = new THREE.FogExp2(0xf6d396, 0.0075);

    this.camera = new THREE.PerspectiveCamera(
      55,
      Math.max(0.1, width / (height || 1)),
      0.1,
      250
    );
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraLookTarget);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = this.renderer.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      cancelAnimationFrame(this.animFrameId);
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.tick();
    });

    container.appendChild(this.renderer.domElement);

    // Setup Interactive Drag / Orbit on canvas
    this.setupPointerControls();

    // Flash overlay for impacts
    this.flashOverlayEl = document.createElement('div');
    this.flashOverlayEl.style.position = 'absolute';
    this.flashOverlayEl.style.inset = '0';
    this.flashOverlayEl.style.pointerEvents = 'none';
    this.flashOverlayEl.style.transition = 'opacity 0.25s ease-out';
    this.flashOverlayEl.style.opacity = '0';
    this.flashOverlayEl.style.zIndex = '5';
    container.appendChild(this.flashOverlayEl);

    // 2. Setup Lighting & Procedural Environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Warm Sun Directional Light
    this.sunLight = new THREE.DirectionalLight(0xfff3cc, 2.2);
    this.sunLight.position.set(18, 35, -20);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -16;
    this.sunLight.shadow.camera.right = 16;
    this.sunLight.shadow.camera.top = 22;
    this.sunLight.shadow.camera.bottom = -16;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target); // Ensure sun target is part of scene so world matrix updates

    // Sky & ground fill light
    this.hemiLight = new THREE.HemisphereLight(0xfff1cf, 0x3d4b29, 1.2);
    this.scene.add(this.hemiLight);

    // Dynamic Wind Particles
    this.windParticleGroup = new THREE.Group();
    this.scene.add(this.windParticleGroup);
    this.initWindParticles();

    // 3. Procedural Textures & Road Geometry
    this.dirtRoadTex = createDirtRoadTexture();
    this.grassTex = createGrassTexture();
    this.palmBarkTex = createPalmBarkTexture();

    // Road Plane (Long endless agricultural corridor)
    const roadGeo = new THREE.PlaneGeometry(6.2, 500);
    const roadMat = new THREE.MeshStandardMaterial({
      map: this.dirtRoadTex,
      roughness: 0.9,
      metalness: 0.05,
    });
    this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.roadMesh.rotation.x = -Math.PI / 2;
    this.roadMesh.position.set(0, 0, 150);
    this.roadMesh.receiveShadow = true;
    this.scene.add(this.roadMesh);

    // Left and Right Agricultural Fields
    const fieldGeo = new THREE.PlaneGeometry(120, 500);
    const fieldMat = new THREE.MeshStandardMaterial({
      map: this.grassTex,
      roughness: 0.8,
    });
    this.leftField = new THREE.Mesh(fieldGeo, fieldMat);
    this.leftField.rotation.x = -Math.PI / 2;
    this.leftField.position.set(-63.1, -0.02, 150);
    this.leftField.receiveShadow = true;

    this.rightField = this.leftField.clone();
    this.rightField.position.x = 63.1;
    this.scene.add(this.leftField, this.rightField);

    // Irrigation canals (falaj / قنوات ماء زراعية) along road sides
    const canalGeo = new THREE.PlaneGeometry(0.9, 500);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x228899,
      roughness: 0.15,
      metalness: 0.4,
    });
    this.leftCanal = new THREE.Mesh(canalGeo, waterMat);
    this.leftCanal.rotation.x = -Math.PI / 2;
    this.leftCanal.position.set(-3.6, -0.01, 150);

    this.rightCanal = this.leftCanal.clone();
    this.rightCanal.position.x = 3.6;
    this.scene.add(this.leftCanal, this.rightCanal);

    // 4. Initial Palm Grove along both sides
    this.createPalmGrove();

    // 5. Nasser Hero Model
    this.nasserRig = createNasserModel();
    if (this.nasserRig.sword) {
      this.nasserRig.sword.visible = this.stage === 2;
    }
    this.scene.add(this.nasserRig.group);

    // Tactile touch feedback indicator under Nasser's feet
    const ringGeo = new THREE.RingGeometry(0.45, 0.68, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    this.touchFeedbackRing = new THREE.Mesh(ringGeo, ringMat);
    this.touchFeedbackRing.position.y = 0.03;
    this.touchFeedbackRing.visible = false;
    this.nasserRig.group.add(this.touchFeedbackRing);

    // 6. Particle system for sparks and blessings
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    this.clock = new THREE.Clock();

    // Use ResizeObserver for accurate viewport resizing
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }
    window.addEventListener('resize', this.handleResize);

    // Start loop
    this.tick = this.tick.bind(this);
    this.animFrameId = requestAnimationFrame(this.tick);
  }

  public start() {
    this.isStarted = true;
    soundManager.init();
    this.triggerNotification('انطلقت الرحلة! المس ناصر وجره يميناً ويساراً وللأعلى للقفز', 'info');
  }

  public getIsStarted(): boolean {
    return this.isStarted;
  }

  private setupPointerControls() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isPointerDown = true;
      this.pointerStartX = e.clientX;
      this.pointerStartY = e.clientY;
      this.dragInitialX = e.clientX;
      this.dragInitialY = e.clientY;
      this.dragInitialLaneX = this.targetLaneX;
      this.hasJumpedInCurrentDrag = false;

      soundManager.init();

      if (!this.isStarted) {
        this.start();
      }

      if (this.touchFeedbackRing) {
        this.touchFeedbackRing.visible = true;
      }

      // Check if Nasser is waiting in front of Fortress Gate 1 ("الغي زر ناد: ياعلي")
      // Touching Nasser or tapping triggers the shout «يا علي!» and gate tearing!
      if (this.isAtFortressGate && !this.gateTorn) {
        this.shoutYaAliAndTearGate();
        try {
          el.setPointerCapture(e.pointerId);
        } catch {}
        return;
      }

      // Double tap / double click detection on Nasser ("ينقر اللاعب ظهر ناصر نقرتين متتاليتين ليضرب ناصر اعداءه بسيفه")
      const now = Date.now();
      const dt = now - this.lastNasserClickTime;

      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const py = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(px, py), this.camera);
      const hits = raycaster.intersectObjects(this.nasserRig.group.children, true);
      const isNasserHit = hits.length > 0;

      if ((isNasserHit || dt < 420) && dt > 40 && dt < 480) {
        this.performSwordStrike();
        this.lastNasserClickTime = 0;
      } else {
        this.lastNasserClickTime = now;
      }

      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
    });

    el.addEventListener('dblclick', () => {
      this.performSwordStrike();
    });

    el.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isPointerDown) return;

      const totalDx = e.clientX - this.dragInitialX;
      const totalDy = e.clientY - this.dragInitialY;
      const stepDx = e.clientX - this.pointerStartX;
      const stepDy = e.clientY - this.pointerStartY;

      // In free camera mode or secondary button, allow free camera orbit
      if (this.cameraMode === 'free' || e.button === 2 || e.altKey) {
        const sensitivity = 0.005;
        this.orbitYaw -= stepDx * sensitivity;
        this.orbitPitch += stepDy * sensitivity;
        this.orbitPitch = Math.max(-0.25, Math.min(1.25, this.orbitPitch));
        this.pointerStartX = e.clientX;
        this.pointerStartY = e.clientY;
        return;
      }

      // 1. DRAG UP (فوق) -> Jump over road pits! ("اجعل اللاعب يجر ناصر للأعلى لكي يقفز")
      if (totalDy < -16 && !this.hasJumpedInCurrentDrag) {
        this.jump();
        this.hasJumpedInCurrentDrag = true;
      } else if (totalDy > 10) {
        this.hasJumpedInCurrentDrag = false;
      }

      // 2. DRAG HORIZONTALLY (يمين و يسار) -> Steer Nasser across the road
      const screenW = this.container.clientWidth || window.innerWidth || 800;
      const roadRange = 4.4; // Road bounds from -2.2 to +2.2
      const sensitivity = roadRange / (screenW * 0.40);
      // In Three.js looking towards +Z, screen-right is negative X.
      // Dragging right (totalDx > 0) moves Nasser to screen right.
      const newLaneX = THREE.MathUtils.clamp(
        this.dragInitialLaneX - totalDx * sensitivity,
        -2.1,
        2.1
      );
      this.targetLaneX = newLaneX;
      this.currentX = THREE.MathUtils.damp(this.currentX, newLaneX, 24, 0.016);

      this.pointerStartX = e.clientX;
      this.pointerStartY = e.clientY;
    });

    const onPointerUp = (e: PointerEvent) => {
      this.isPointerDown = false;
      this.hasJumpedInCurrentDrag = false;
      if (this.touchFeedbackRing) {
        this.touchFeedbackRing.visible = false;
      }
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    };

    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    // Mouse wheel zoom
    el.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        this.orbitDistance = Math.max(2.2, Math.min(18.0, this.orbitDistance + e.deltaY * 0.006));
      },
      { passive: false }
    );
  }

  public resetCamera() {
    this.orbitYaw = 0;
    this.orbitPitch = 0.22;
    this.orbitDistance = 6.2;
    this.triggerNotification('تمت إعادة ضبط الكاميرا إلى الزاوية الافتراضية', 'info');
  }

  private readonly palmPoolSpan: number = 280;

  private createPalmGrove() {
    // Generate a fixed reusable pool of palm trees (28 pairs = 56 palms) spanning 280 meters.
    // They are continuously wrapped forward in tick(), preventing memory leaks and WebGL context loss.
    for (let z = -30; z < 250; z += 10) {
      this.spawnSidePalmTrees(z);
    }
  }

  private spawnSidePalmTrees(z: number) {
    // Left palm
    const leftPalm = createPalmTree(this.palmBarkTex);
    const scaleL = 0.9 + Math.random() * 0.35;
    leftPalm.scale.set(scaleL, scaleL, scaleL);
    leftPalm.position.set(-5.5 - Math.random() * 2.5, 0, z + (Math.random() - 0.5) * 3);
    leftPalm.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(leftPalm);
    this.palmTrees.push(leftPalm);

    // Right palm
    const rightPalm = createPalmTree(this.palmBarkTex);
    const scaleR = 0.9 + Math.random() * 0.35;
    rightPalm.scale.set(scaleR, scaleR, scaleR);
    rightPalm.position.set(5.5 + Math.random() * 2.5, 0, z + (Math.random() - 0.5) * 3);
    rightPalm.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(rightPalm);
    this.palmTrees.push(rightPalm);
  }

  // --------------------------------------------------------------------------
  // User Controls: Steering, Jumping, Actions
  // --------------------------------------------------------------------------

  public moveLeft() {
    if (this.state.isGameOver || this.state.isVictory || this.state.isPaused) return;
    // On screen, left corresponds to +X
    if (this.targetLaneX < 1.7) {
      this.targetLaneX = Math.min(1.7, this.targetLaneX + 1.7);
    }
  }

  public moveRight() {
    if (this.state.isGameOver || this.state.isVictory || this.state.isPaused) return;
    // On screen, right corresponds to -X
    if (this.targetLaneX > -1.7) {
      this.targetLaneX = Math.max(-1.7, this.targetLaneX - 1.7);
    }
  }

  public jump() {
    if (this.state.isGameOver || this.state.isVictory || this.state.isPaused) return;
    if (!this.isJumping) {
      this.isJumping = true;
      this.jumpTime = 0;
      soundManager.playJump();
    }
  }

  /**
   * Nasser performs Hug / Embrace (عناق ومحبة)
   */
  public performHug() {
    if (this.state.isGameOver || this.state.isVictory || this.state.isPaused) return;
    if (this.actionState !== 'none') return;

    this.actionState = 'hug';
    this.actionTimer = 0.6; // duration

    // Check if an NPC is in interaction range (distance between 1.0 and 5.5 ahead)
    const targetNpc = this.findNearbyNpc();
    if (targetNpc) {
      this.resolveEncounter(targetNpc, 'hug');
    } else {
      this.spawnAuraParticles(0x4ade80, 8);
    }
  }

  /**
   * Nasser performs Strike / Defense or Sword Slash
   */
  public performStrike() {
    this.performSwordStrike();
  }

  /**
   * Nasser strikes with his combat sword ("ينقر اللاعب ظهر ناصر نقرتين متتاليتين ليضرب ناصر اعداءه بسيفه")
   * "كلما ضرب ناصر شيئا بسيفه يصرخ يا علي"
   */
  public performSwordStrike() {
    if (this.state.isGameOver || this.state.isVictory || this.state.isPaused) return;

    this.actionState = 'strike';
    this.actionTimer = 0.55;

    // 1. Play whoosh sound of sword
    soundManager.playSwordSwing();

    // 2. Nasser shouts "يا علي!" on every sword strike ("كلما ضرب ناصر شيئا بسيفه يصرخ يا علي")
    soundManager.speak('يا علي');

    // 3. Screen shake & slash sparks
    this.triggerShake(0.55);
    this.spawnSwordSlashParticles();

    // ------------------------------------------------------------------------
    // STAGE 1 LOGIC
    // ------------------------------------------------------------------------
    if (this.stage === 1) {
      if (this.isAtFortressGate && !this.gateTorn) {
        this.shoutYaAliAndTearGate();
        return;
      }

      const targetNpc = this.findNearbyNpc();
      if (targetNpc) {
        this.resolveEncounter(targetNpc, 'strike');
      } else {
        this.spawnAuraParticles(0xf97316, 6);
      }
      return;
    }

    // ------------------------------------------------------------------------
    // STAGE 2 COMBAT LOGIC
    // ------------------------------------------------------------------------
    if (this.stage === 2) {
      // 1. Five Iron-Armored Knights ("يظهر لناصر فارس مدجج بالدرع الحديد على كامل جسده و على ناصر ان يقضي عليه عاجلا")
      if (this.stage2Phase === 'knights') {
        if (this.activeKnight && !this.activeKnight.isDying) {
          const distZ = this.activeKnight.zPos - this.nasserZ;
          const distX = Math.abs(this.activeKnight.laneX - this.currentX);
          if (distZ >= 0.1 && distZ <= 6.5 && distX <= 2.2) {
            this.activeKnight.isDying = true;
            this.activeKnight.deathTimer = 0.55;
            soundManager.playIronClash();
            this.spawnAuraParticles(0x94a3b8, 35);
            this.spawnAuraParticles(0xf59e0b, 20);
            this.triggerShake(0.85);
            this.flashScreen('rgba(245, 158, 11, 0.35)');

            this.knightsDefeated++;
            this.state.knightsDefeated = this.knightsDefeated;
            this.state.score += 250;
            this.triggerNotification(
              `⚔️ صرع ناصر الفارس المدرع بسيفه صائحاً «يا علي!» (${this.knightsDefeated} من 5)`,
              'success'
            );

            if (this.knightsDefeated >= 5) {
              setTimeout(() => {
                this.stage2Phase = 'gate2';
                this.state.stage2Phase = 'gate2';
                this.spawnFortressGate2();
                this.onStateChange({ ...this.state });
              }, 500);
            }
          }
        }
      }
      // 2. Fortress Gate 2 ("الى ان يصل ناصر الى بوابة الحصن التالي و يضربها بسيفه")
      else if (this.stage2Phase === 'gate2') {
        if (this.fortressGate2 && !this.gate2Flying) {
          const distZ = Math.abs(this.gate2Z - this.nasserZ);
          if (distZ <= 9.5) {
            this.gate2Flying = true;
            this.gate2FlyVelocity.set((Math.random() - 0.5) * 5, 22.0, -38.0);
            this.gate2FlyRotVelocity.set(4.8, 3.2, 2.0);
            soundManager.playWoodShatter();
            soundManager.playGateTearSound();
            this.triggerShake(1.3);
            this.flashScreen('rgba(251, 191, 36, 0.65)');
            this.spawnAuraParticles(0xfde047, 60);

            this.state.score += 500;
            this.triggerNotification(
              '💥 حطم ناصر بوابة الحصن بسيفه صائحاً «يا علي!».. احذر، الدبابات الخشبية تقترب!',
              'success'
            );

            setTimeout(() => {
              this.stage2Phase = 'tanks';
              this.state.stage2Phase = 'tanks';
              this.isAtGate2 = false;
              this.onStateChange({ ...this.state });
            }, 800);
          }
        }
      }
      // 3. Five Half-Barrel Wooden Siege Tanks ("تظهر لناصر دبابة خشبية على شكل نصف برميل طوليا و عليه ان يحطمها كي لا تدهسه")
      else if (this.stage2Phase === 'tanks') {
        if (this.activeTank && !this.activeTank.isDying) {
          const distZ = this.activeTank.zPos - this.nasserZ;
          const distX = Math.abs(this.activeTank.laneX - this.currentX);
          if (distZ >= 0.2 && distZ <= 6.8 && distX <= 2.4) {
            this.activeTank.isDying = true;
            this.activeTank.deathTimer = 0.5;
            soundManager.playWoodShatter();
            this.spawnAuraParticles(0x92400e, 40);
            this.spawnAuraParticles(0xfde047, 25);
            this.triggerShake(0.95);
            this.flashScreen('rgba(217, 119, 6, 0.35)');

            this.tanksDefeated++;
            this.state.tanksDefeated = this.tanksDefeated;
            this.state.score += 300;
            this.triggerNotification(
              `🪵 حطم ناصر الدبابة الخشبية بسيفه صائحاً «يا علي!» (${this.tanksDefeated} من 5)`,
              'success'
            );

            if (this.tanksDefeated >= 5) {
              setTimeout(() => {
                this.stage2Phase = 'gate3';
                this.state.stage2Phase = 'gate3';
                this.spawnFortressGate3();
                this.onStateChange({ ...this.state });
              }, 500);
            }
          }
        }
      }
      // 4. Fortress Gate 3 ("يصل ناصر الى بوابة الحصن التالي فيحطمهها")
      else if (this.stage2Phase === 'gate3') {
        if (this.fortressGate3 && !this.gate3Flying) {
          const distZ = Math.abs(this.gate3Z - this.nasserZ);
          if (distZ <= 9.5) {
            this.gate3Flying = true;
            this.gate3FlyVelocity.set((Math.random() - 0.5) * 5, 22.0, -38.0);
            this.gate3FlyRotVelocity.set(4.8, 3.2, 2.0);
            soundManager.playWoodShatter();
            soundManager.playGateTearSound();
            this.triggerShake(1.3);
            this.flashScreen('rgba(251, 191, 36, 0.7)');
            this.spawnAuraParticles(0xfde047, 60);

            this.state.score += 600;
            this.triggerNotification(
              '💥 اقتحم ناصر بوابة الحصن الثالثة بنداء «يا علي!».. ساحة المنجنيق أمامك!',
              'success'
            );

            setTimeout(() => {
              this.stage2Phase = 'catapult';
              this.state.stage2Phase = 'catapult';
              this.isAtGate3 = false;
              this.spawnCatapultBoss();
              this.onStateChange({ ...this.state });
            }, 800);
          }
        }
      }
      // 5. Catapult Boss ("يدخل فيرمي عليه المجنيق قذائفه و عليه تجنبها و يتوجه للمنجنيق فيحطمه كي يفوز")
      else if (this.stage2Phase === 'catapult') {
        if (this.catapultAssembly && !this.catapultDestroyed) {
          const distZ = Math.abs(this.catapultZ - this.nasserZ);
          if (distZ <= 8.5 && this.catapultShotsResolved >= 5) {
            this.catapultDestroyed = true;
            this.state.catapultDestroyed = true;
            soundManager.playWoodShatter();
            soundManager.playExplosion();
            this.triggerShake(1.8);
            this.flashScreen('rgba(239, 68, 68, 0.7)');
            this.spawnAuraParticles(0xef4444, 80);
            this.spawnAuraParticles(0xfbbf24, 80);

            this.catapultAssembly.throwingArm.rotation.x = -1.2;
            this.catapultAssembly.throwingArm.position.y = 1.0;

            this.state.score += 2500;
            this.triggerVictory();
          }
        }
      }
    }
  }

  private findNearbyNpc(): ActiveNPC | null {
    // Find un-resolved NPC closest ahead to Nasser within interaction range
    let closest: ActiveNPC | null = null;
    let minDist = 7.0;

    for (const npc of this.npcs) {
      if (npc.isResolved) continue;
      const dz = npc.zPos - this.nasserZ;
      // Allow interaction between 0.5 behind up to 6.2 units ahead
      if (dz >= -0.5 && dz <= minDist) {
        minDist = dz;
        closest = npc;
      }
    }
    return closest;
  }

  // --------------------------------------------------------------------------
  // Encounter Resolution Logic (The core rules of the brief)
  // --------------------------------------------------------------------------

  private resolveEncounter(npc: ActiveNPC, action: 'hug' | 'strike') {
    npc.isResolved = true;

    if (npc.type === 'loyal') {
      if (action === 'hug') {
        // WIN condition for loyal: Nasser hugs the loyal ally!
        // "اذا ناصر حضن الموالي يكسب"
        soundManager.playHugSuccess();
        this.state.health = Math.min(100, this.state.health + 15);
        this.state.score += 100;
        this.state.loyalPassed += 1;
        this.spawnAuraParticles(0x22c55e, 25);
        this.triggerNotification('✨ عانقت الموالي فنلت البركة والنصر! (+100 نقطة، +15 رصيد)', 'success');
        this.flashScreen('rgba(34, 197, 94, 0.25)');
      } else {
        // LOSE condition for loyal: Nasser strikes the loyal ally!
        // "و اذا ضربه يخسر"
        soundManager.playWrongActionPenalty();
        this.state.health -= 20;
        this.state.score = Math.max(0, this.state.score - 100);
        this.state.loyalPassed += 1;
        this.triggerShake(0.35);
        this.triggerNotification('⚠️ خطأ جسيم! ضربت شخصاً موالياً ينادي بالحق! (-20 رصيد)', 'danger');
        this.flashScreen('rgba(239, 68, 68, 0.4)');
      }
    } else {
      // Enemy encounter
      if (action === 'strike') {
        // WIN condition for enemy: Nasser strikes the enemy!
        // "و اذا ضربه يربح"
        soundManager.playStrikeSuccess();
        this.state.score += 100;
        this.state.health = Math.min(100, this.state.health + 5);
        this.state.enemyPassed += 1;
        this.spawnAuraParticles(0xf59e0b, 20);
        this.triggerNotification('⚔️ صددت المعادي ودحرته بحزم وقوة! (+100 نقطة)', 'success');
        this.flashScreen('rgba(245, 158, 11, 0.2)');

        // Banish enemy flying away backwards
        npc.isBanished = true;
        npc.banishVelocity = new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          6,
          8
        );
      } else {
        // LOSE condition for enemy: Nasser hugs the enemy!
        // "اذا ناصر حضن المعادي يخسر"
        soundManager.playWrongActionPenalty();
        this.state.health -= 30;
        this.state.score = Math.max(0, this.state.score - 50);
        this.state.enemyPassed += 1;
        this.triggerShake(0.5);
        this.triggerNotification('🔥 غدر وخيانة! عانقت معادياً يحمل الحقد والحريق! (-30 رصيد)', 'danger');
        this.flashScreen('rgba(220, 38, 38, 0.6)');
      }
    }

    // Check game over
    this.checkGameConditions();
    this.onStateChange({ ...this.state });
  }

  private checkGameConditions() {
    // Loss condition: "تنتهي اللعبة بخسارة ناصر اذا انتهى رصيده"
    if (this.state.health <= 0) {
      this.state.health = 0;
      this.state.isGameOver = true;
      soundManager.playGameOver();
      this.triggerNotification('انتهى رصيدك! حاول مجدداً بحكمة وسرعة بديهة', 'danger');
      return;
    }

    // Win check trigger: 10 loyal and 10 enemy passed!
    // "تنتهي اللعبة بفوز ناصر اذا اكمل الطريق الى نهايته بعد اجتياز عشرة موالين و عشرة معادين"
    if (
      this.state.loyalPassed >= this.loyalCountTarget &&
      this.state.enemyPassed >= this.enemyCountTarget &&
      !this.sanctuarySpawned
    ) {
      this.spawnSanctuaryEnd();
    }
  }

  private spawnSanctuaryEnd() {
    this.sanctuarySpawned = true;
    this.sanctuaryZ = this.nasserZ + 55;
    this.fortressAssembly = createFortressGate();
    this.sanctuaryGroup = this.fortressAssembly.group;
    this.sanctuaryGroup.position.set(0, 0, this.sanctuaryZ);
    this.scene.add(this.sanctuaryGroup);
    this.triggerNotification('🏰 بلغت نهاية الطريق! بوابة الحصن المنيعة تسد المعبر أمامك!', 'info');
  }

  // --------------------------------------------------------------------------
  // Spawner: Interleaving 10 Loyal, 10 Hostile and Road Obstacles
  // --------------------------------------------------------------------------

  private updateSpawning() {
    // If we already spawned all 20 encounters, do not spawn more NPCs
    const totalRemaining = this.remainingLoyalToSpawn + this.remainingEnemyToSpawn;

    // Check if we need to spawn ahead
    if (totalRemaining > 0 && this.nextSpawnZ - this.nasserZ < 120) {
      // Determine what to spawn: NPC or Obstacle
      // Interleave obstacles between NPCs
      const shouldSpawnObstacle = Math.random() > 0.45;

      if (shouldSpawnObstacle) {
        this.spawnRandomObstacle(this.nextSpawnZ);
        this.nextSpawnZ += 18 + Math.random() * 12;
      } else {
        this.spawnRandomNpc(this.nextSpawnZ);
        this.nextSpawnZ += 28 + Math.random() * 14;
      }
    }
  }

  private spawnRandomNpc(zPos: number) {
    if (this.remainingLoyalToSpawn === 0 && this.remainingEnemyToSpawn === 0) return;

    // Pick type based on remaining pool
    let type: 'loyal' | 'enemy';
    if (this.remainingLoyalToSpawn > 0 && this.remainingEnemyToSpawn > 0) {
      type = Math.random() > 0.5 ? 'loyal' : 'enemy';
    } else if (this.remainingLoyalToSpawn > 0) {
      type = 'loyal';
    } else {
      type = 'enemy';
    }

    if (type === 'loyal') {
      this.remainingLoyalToSpawn--;
    } else {
      this.remainingEnemyToSpawn--;
    }

    const emergeSide: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
    // Looking along +Z: screen left is +5.2, screen right is -5.2
    const startX = emergeSide === 'left' ? 5.2 : -5.2;
    // Target lane to intercept Nasser
    const lanes = [-1.7, 0, 1.7];
    const targetLaneX = lanes[Math.floor(Math.random() * lanes.length)];

    const rig = type === 'loyal' ? createLoyalModel() : createEnemyModel();
    rig.group.position.set(startX, 0, zPos);
    rig.group.rotation.y = emergeSide === 'left' ? -Math.PI / 4 : Math.PI / 4;
    this.scene.add(rig.group);

    this.npcs.push({
      id: this.nextNpcId++,
      type,
      rig,
      zPos,
      laneX: startX,
      targetLaneX,
      emergeSide,
      hasSpoken: false,
      isResolved: false,
      isBanished: false,
      banishVelocity: new THREE.Vector3(),
    });
  }

  private spawnRandomObstacle(zPos: number) {
    const lanes = [-1.7, 0, 1.7];
    const laneX = lanes[Math.floor(Math.random() * lanes.length)];
    const variant = Math.floor(Math.random() * 4);

    // Replace agricultural obstacles with deep road pits ("الغي الحواجز و ضع مكانها حفر بحيث تنتهي حياة ناصر اذا وقع فيها")
    const group = createPitObstacle(variant);
    const height = 0.45;
    const boundsRadius = 1.15;

    group.position.set(laneX, 0, zPos);
    this.scene.add(group);

    this.obstacles.push({
      id: this.nextObstacleId++,
      type: 'pit',
      group,
      zPos,
      laneX,
      hasHit: false,
      boundsRadius,
      height,
    });
  }

  // --------------------------------------------------------------------------
  // Main Game Loop (tick)
  // --------------------------------------------------------------------------

  private tick() {
    if (this.state.isPaused) {
      this.animFrameId = requestAnimationFrame(this.tick);
      return;
    }

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    if (this.isStarted && !this.state.isGameOver && !this.state.isVictory) {
      // 1. Move Nasser forward & check Fortress Gate arrival
      if (this.stage === 1) {
        if (this.sanctuarySpawned && !this.isAtFortressGate) {
          const distToGate = this.sanctuaryZ - this.nasserZ;
          if (distToGate <= 8.5) {
            // Nasser halts right in front of the gate!
            this.isAtFortressGate = true;
            this.currentForwardSpeed = 0;
            this.nasserZ = this.sanctuaryZ - 8.5;
            this.targetLaneX = 0; // Align center before the gate
            this.state.isAtFortressGate = true;
            this.triggerNotification('🏰 وقف ناصر أمام بوابة الحصن.. لن تفتح له إلا بنداء: يا علي!', 'warning');
            this.onStateChange({ ...this.state });
          } else if (distToGate < 20) {
            // Smooth deceleration as he approaches the grand fortress
            this.currentForwardSpeed = THREE.MathUtils.lerp(this.currentForwardSpeed, 5.0, delta * 3.5);
            this.nasserZ += this.currentForwardSpeed * delta;
          } else {
            this.nasserZ += this.currentForwardSpeed * delta;
          }
        } else if (this.isAtFortressGate) {
          if (this.gateTorn) {
            // Gate 1 is torn! Nasser marches triumphantly through the shattered gateway into Stage 2!
            // ("تعديل: لا تنتهي اللعبة بعد تحطيم بوابة الحصن الاول بل تستمر حسب الوصف اعلاه")
            this.postGateTimer += delta;
            this.currentForwardSpeed = 5.5;
            this.nasserZ += this.currentForwardSpeed * delta;
            if (this.nasserZ >= this.sanctuaryZ + 2.5 || this.postGateTimer > 2.2) {
              this.startStage2();
            }
          } else {
            this.currentForwardSpeed = 0;
          }
        } else {
          this.nasserZ += this.currentForwardSpeed * delta;
        }
      } else {
        // STAGE 2 KINEMATICS & GATE/CATAPULT ARRIVALS
        if (this.stage2Phase === 'gate2') {
          const dist = this.gate2Z - this.nasserZ;
          if (dist <= 8.5 && !this.gate2Flying) {
            this.isAtGate2 = true;
            this.currentForwardSpeed = 0;
            this.nasserZ = this.gate2Z - 8.5;
            this.targetLaneX = 0;
          } else if (this.gate2Flying) {
            this.currentForwardSpeed = 6.0;
            this.nasserZ += this.currentForwardSpeed * delta;
          } else {
            this.currentForwardSpeed = this.nasserBaseSpeed;
            this.nasserZ += this.currentForwardSpeed * delta;
          }
        } else if (this.stage2Phase === 'gate3') {
          const dist = this.gate3Z - this.nasserZ;
          if (dist <= 8.5 && !this.gate3Flying) {
            this.isAtGate3 = true;
            this.currentForwardSpeed = 0;
            this.nasserZ = this.gate3Z - 8.5;
            this.targetLaneX = 0;
          } else if (this.gate3Flying) {
            this.currentForwardSpeed = 6.0;
            this.nasserZ += this.currentForwardSpeed * delta;
          } else {
            this.currentForwardSpeed = this.nasserBaseSpeed;
            this.nasserZ += this.currentForwardSpeed * delta;
          }
        } else if (this.stage2Phase === 'catapult') {
          const dist = this.catapultZ - this.nasserZ;
          if (this.catapultDestroyed) {
            this.currentForwardSpeed = 0;
          } else if (this.catapultShotsResolved < 5) {
            // "المنجنيق يطلق 5 قذائف قبل ان يصل اليه ناصر"
            // Hold distance at minimum 16.0m while the 5 projectiles are being fired and dodged
            if (dist <= 16.0) {
              this.currentForwardSpeed = 0;
              this.nasserZ = this.catapultZ - 16.0;
            } else {
              this.currentForwardSpeed = 6.5;
              this.nasserZ += this.currentForwardSpeed * delta;
            }
          } else {
            // All 5 projectiles dodged! Nasser now rushes in to close distance and strike it down!
            if (dist <= 7.0) {
              this.currentForwardSpeed = 0;
              this.nasserZ = this.catapultZ - 7.0;
            } else {
              this.currentForwardSpeed = 10.0;
              this.nasserZ += this.currentForwardSpeed * delta;
            }
          }
        } else {
          this.currentForwardSpeed = this.nasserBaseSpeed;
          this.nasserZ += this.currentForwardSpeed * delta;
        }
      }
      this.state.distance = Math.floor(this.nasserZ);

      // Footstep sound cadence
      if (!this.isJumping && this.currentForwardSpeed > 2 && Math.floor(this.nasserZ * 1.5) % 3 === 0) {
        soundManager.playFootstep();
      }

      // Smooth horizontal lane interpolation (A/D/touch target)
      this.currentX = THREE.MathUtils.damp(this.currentX, this.targetLaneX, 12, delta);

      // Handle jumping physics
      if (this.isJumping) {
        this.jumpTime += delta;
        const progress = this.jumpTime / this.jumpDuration;
        if (progress >= 1.0) {
          this.isJumping = false;
          this.nasserY = 0;
          soundManager.playLand();
        } else {
          // Parabolic jump arc
          this.nasserY = Math.sin(progress * Math.PI) * this.jumpHeight;
        }
      } else {
        this.nasserY = 0;
      }

      // Update Nasser Mesh Position & Procedural Limbs
      this.nasserRig.group.position.set(this.currentX, this.nasserY, this.nasserZ);

      if (this.isAtFortressGate && !this.gateTorn && this.actionState === 'none') {
        this.animateStandingBeforeGate(elapsedTime);
      } else {
        this.animateNasserRig(elapsedTime, delta);
      }

      // Gate Flying Physics ("فتنقلع البوابة و تلقى بعيدا")
      if (this.gateFlying && this.fortressAssembly) {
        this.fortressAssembly.doorsGroup.position.addScaledVector(this.gateFlyVelocity, delta);
        this.fortressAssembly.doorsGroup.rotation.x += this.gateFlyRotVelocity.x * delta;
        this.fortressAssembly.doorsGroup.rotation.y += this.gateFlyRotVelocity.y * delta;
        this.fortressAssembly.doorsGroup.rotation.z += this.gateFlyRotVelocity.z * delta;
        this.gateFlyVelocity.y -= 15.0 * delta; // Gravity
        this.gateFlyVelocity.x *= 0.99;
        this.gateFlyVelocity.z *= 0.99;

        // Erupt trailing spark dust as the gate tumbles through the air
        if (Math.random() > 0.4) {
          const sparkGeo = new THREE.SphereGeometry(0.1, 4, 4);
          const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
          const spark = new THREE.Mesh(sparkGeo, sparkMat);
          spark.position.copy(this.fortressAssembly.doorsGroup.position).add(this.sanctuaryGroup!.position);
          spark.position.x += (Math.random() - 0.5) * 1.5;
          spark.position.y += (Math.random() - 0.5) * 1.5;
          this.particleGroup.add(spark);
          this.activeSparks.push({
            mesh: spark,
            vel: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2 + 1, (Math.random() - 0.5) * 2),
            life: 0,
            maxLife: 0.6,
          });
        }
      }

      // 2. Keep Road, Canals, Fields & Palms Infinite under Nasser (Zero Allocation Pooling)
      this.roadMesh.position.z = this.nasserZ + 150;
      this.leftCanal.position.z = this.nasserZ + 150;
      this.rightCanal.position.z = this.nasserZ + 150;
      this.leftField.position.z = this.nasserZ + 150;
      this.rightField.position.z = this.nasserZ + 150;

      // Realistic ground texture flow
      this.dirtRoadTex.offset.y = (this.nasserZ * 0.04) % 1;
      this.grassTex.offset.y = (this.nasserZ * 0.04) % 1;

      // Infinite wrapping of palm trees pool without creating/destroying any meshes
      for (let i = 0; i < this.palmTrees.length; i++) {
        const palm = this.palmTrees[i];
        if (palm.position.z < this.nasserZ - 35) {
          palm.position.z += this.palmPoolSpan;
        }
      }

      // 3. Spawning and entity updates based on stage
      if (this.stage === 1) {
        this.updateSpawning();
        this.updateNpcs(delta, elapsedTime);
        this.updateObstacles(delta);
        this.updateActivePrompt();
      } else {
        this.updateStage2(delta, elapsedTime);
        this.updateStage2ActivePrompt();
      }
    } else {
      // Idle / waiting / game over animations
      this.animateIdle(elapsedTime);
      if (this.isStarted) {
        if (this.stage === 1) {
          this.updateNpcs(delta, elapsedTime);
        } else {
          this.updateStage2(delta, elapsedTime);
        }
      }
    }

    // 5. Update Dynamic Weather, Atmosphere, Wind & Palm Swaying
    this.updateWeatherAndAtmosphere(delta, elapsedTime);

    // 6. Update Sparks & Particles
    this.updateParticles(delta);

    // 7. Camera Position & Damping
    this.updateCamera(delta);

    // 8. Render
    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.tick);
  }

  // --------------------------------------------------------------------------
  // Nasser Animations (Run, Jump, Hug, Strike, Stumble)
  // --------------------------------------------------------------------------

  private animateNasserRig(time: number, delta: number) {
    const runCycle = time * 12.0;

    // Handle Action Timers (Hug / Strike)
    if (this.actionTimer > 0) {
      this.actionTimer -= delta;
      if (this.actionTimer <= 0) {
        this.actionState = 'none';
      }
    }

    if (this.actionState === 'hug') {
      // Warm open embrace: arms spread wide forward with welcoming posture
      this.nasserRig.leftArm.rotation.x = THREE.MathUtils.damp(this.nasserRig.leftArm.rotation.x, -1.4, 16, delta);
      this.nasserRig.leftArm.rotation.z = THREE.MathUtils.damp(this.nasserRig.leftArm.rotation.z, 0.6, 16, delta);
      this.nasserRig.rightArm.rotation.x = THREE.MathUtils.damp(this.nasserRig.rightArm.rotation.x, -1.4, 16, delta);
      this.nasserRig.rightArm.rotation.z = THREE.MathUtils.damp(this.nasserRig.rightArm.rotation.z, -0.6, 16, delta);
      this.nasserRig.torso.rotation.x = THREE.MathUtils.damp(this.nasserRig.torso.rotation.x, 0.15, 12, delta);
      this.nasserRig.head.rotation.x = THREE.MathUtils.damp(this.nasserRig.head.rotation.x, -0.1, 12, delta);
    } else if (this.actionState === 'strike') {
      if (this.stage === 2 || this.nasserRig.sword?.visible) {
        // Heroic sword slash: slicing down and across
        this.nasserRig.leftArm.rotation.x = THREE.MathUtils.damp(this.nasserRig.leftArm.rotation.x, 0.4, 20, delta);
        this.nasserRig.rightArm.rotation.x = THREE.MathUtils.damp(this.nasserRig.rightArm.rotation.x, -2.3, 26, delta);
        this.nasserRig.rightArm.rotation.z = THREE.MathUtils.damp(this.nasserRig.rightArm.rotation.z, 0.45, 24, delta);
        this.nasserRig.rightArm.rotation.y = THREE.MathUtils.damp(this.nasserRig.rightArm.rotation.y, -0.65, 24, delta);
        this.nasserRig.torso.rotation.y = THREE.MathUtils.damp(this.nasserRig.torso.rotation.y, 0.45, 20, delta);
      } else {
        // Swift decisive punch / martial defense
        this.nasserRig.leftArm.rotation.x = THREE.MathUtils.damp(this.nasserRig.leftArm.rotation.x, 0.4, 20, delta);
        this.nasserRig.rightArm.rotation.x = THREE.MathUtils.damp(this.nasserRig.rightArm.rotation.x, -1.75, 24, delta);
        this.nasserRig.rightArm.rotation.z = THREE.MathUtils.damp(this.nasserRig.rightArm.rotation.z, 0.1, 20, delta);
        this.nasserRig.torso.rotation.y = THREE.MathUtils.damp(this.nasserRig.torso.rotation.y, 0.35, 20, delta);
      }
    } else if (this.isJumping) {
      // Airborne pose: arms extended for balance, legs slightly drawn up
      this.nasserRig.leftArm.rotation.x = THREE.MathUtils.damp(this.nasserRig.leftArm.rotation.x, -0.8, 10, delta);
      this.nasserRig.rightArm.rotation.x = THREE.MathUtils.damp(this.nasserRig.rightArm.rotation.x, -0.8, 10, delta);
      this.nasserRig.leftLeg.rotation.x = THREE.MathUtils.damp(this.nasserRig.leftLeg.rotation.x, 0.4, 10, delta);
      this.nasserRig.rightLeg.rotation.x = THREE.MathUtils.damp(this.nasserRig.rightLeg.rotation.x, -0.3, 10, delta);
      this.nasserRig.torso.rotation.x = THREE.MathUtils.damp(this.nasserRig.torso.rotation.x, 0.1, 10, delta);
    } else {
      // Normal running cycle
      const legSwing = Math.sin(runCycle) * 0.75;
      const armSwing = Math.sin(runCycle) * 0.65;
      const bounce = Math.abs(Math.cos(runCycle)) * 0.08;

      this.nasserRig.leftLeg.rotation.x = legSwing;
      this.nasserRig.rightLeg.rotation.x = -legSwing;
      this.nasserRig.leftArm.rotation.x = -armSwing;
      this.nasserRig.rightArm.rotation.x = armSwing;
      this.nasserRig.leftArm.rotation.z = 0.1;
      this.nasserRig.rightArm.rotation.z = -0.1;

      this.nasserRig.torso.position.y = bounce;
      this.nasserRig.torso.rotation.x = 0.08;
      this.nasserRig.torso.rotation.y = Math.sin(runCycle) * 0.08;
      this.nasserRig.head.rotation.x = -0.04;
    }

    // Dynamic tilt when changing lanes
    const steerTilt = (this.targetLaneX - this.currentX) * 0.15;
    this.nasserRig.root.rotation.z = THREE.MathUtils.damp(this.nasserRig.root.rotation.z, steerTilt, 12, delta);
  }

  private animateIdle(time: number) {
    const idleCycle = time * 2.0;
    this.nasserRig.torso.position.y = Math.sin(idleCycle) * 0.03;
    this.nasserRig.leftArm.rotation.x = THREE.MathUtils.damp(this.nasserRig.leftArm.rotation.x, 0, 5, 0.016);
    this.nasserRig.rightArm.rotation.x = THREE.MathUtils.damp(this.nasserRig.rightArm.rotation.x, 0, 5, 0.016);
  }

  private animateStandingBeforeGate(time: number) {
    const breath = Math.sin(time * 2.5) * 0.02;
    this.nasserRig.torso.position.y = breath;
    this.nasserRig.torso.rotation.x = -0.05;
    this.nasserRig.leftLeg.rotation.x = 0;
    this.nasserRig.rightLeg.rotation.x = 0;
    this.nasserRig.leftArm.rotation.x = 0.15;
    this.nasserRig.rightArm.rotation.x = 0.15;
    this.nasserRig.head.rotation.x = -0.25; // Looking up reverently at the tall fortress gate
    this.nasserRig.root.rotation.z = 0;
  }

  // --------------------------------------------------------------------------
  // Update NPCs (Loyal & Enemy emerging from sides)
  // --------------------------------------------------------------------------

  private updateNpcs(delta: number, time: number) {
    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];

      // If banished by strike, fly off screen
      if (npc.isBanished) {
        npc.rig.group.position.addScaledVector(npc.banishVelocity, delta);
        npc.banishVelocity.y -= 18 * delta; // Gravity
        npc.rig.group.rotation.x += 12 * delta;
        npc.rig.group.rotation.y += 8 * delta;

        // Remove when fallen below ground
        if (npc.rig.group.position.y < -5) {
          this.scene.remove(npc.rig.group);
          this.npcs.splice(i, 1);
        }
        continue;
      }

      // Emerging logic: walk from side toward road targetLaneX
      const distToNasserZ = npc.zPos - this.nasserZ;

      // Start walking in when within 45 units ahead of Nasser
      if (distToNasserZ < 45 && !npc.isResolved) {
        npc.laneX = THREE.MathUtils.damp(npc.laneX, npc.targetLaneX, 2.5, delta);
        npc.rig.group.position.x = npc.laneX;

        // Facing direction toward Nasser
        const dx = this.currentX - npc.laneX;
        const dz = this.nasserZ - npc.zPos;
        const targetRotY = Math.atan2(dx, dz);
        npc.rig.group.rotation.y = THREE.MathUtils.damp(npc.rig.group.rotation.y, targetRotY, 6, delta);
      }

      // Make billboard speech bubble always face camera
      if (npc.rig.speechBillboard) {
        npc.rig.speechBillboard.quaternion.copy(this.camera.quaternion);
        // Subtle floating bob
        npc.rig.speechBillboard.position.y = 2.4 + Math.sin(time * 3 + npc.id) * 0.08;
      }

      // Animate halo or glow
      if (npc.rig.halo) {
        npc.rig.halo.rotation.z += 1.5 * delta;
      }

      // Voice Callout Trigger: when NPC is 28 units ahead, call out their signature phrase!
      if (!npc.hasSpoken && distToNasserZ <= 28 && distToNasserZ > 0) {
        npc.hasSpoken = true;
        const phrase = npc.type === 'loyal' ? 'يا زهراء' : 'احرقوهم';
        soundManager.speak(phrase);
      }

      // Physical Collision Check: "اذا اصطدم بالموالي يربح واذا اصطدم بالمعادي يخسر"
      const absDistZ = Math.abs(distToNasserZ);
      const distX = Math.abs(this.currentX - npc.laneX);

      if (!npc.isResolved && !npc.isBanished && absDistZ < 1.35 && distX < 1.25) {
        npc.isResolved = true;

        if (npc.type === 'loyal') {
          // Loyal Collision: Win points & health!
          soundManager.playHugSuccess();
          this.state.health = Math.min(100, this.state.health + 20);
          this.state.score += 150;
          this.state.loyalPassed += 1;
          this.actionState = 'hug';
          this.actionTimer = 0.55;
          this.spawnAuraParticles(0x22c55e, 25);
          this.flashScreen('rgba(34, 197, 94, 0.35)');
          this.triggerNotification('✨ اصطدمت بالموالي المنير ونلت البركة والربح! (+150 نقطة، +20 رصيد)', 'success');
        } else {
          // Enemy Collision: Lose health & points!
          soundManager.playWrongActionPenalty();
          this.state.health -= 35;
          this.state.score = Math.max(0, this.state.score - 50);
          this.state.enemyPassed += 1;
          this.actionState = 'stumble';
          this.actionTimer = 0.5;
          this.triggerShake(0.5);
          this.flashScreen('rgba(239, 68, 68, 0.6)');
          this.spawnAuraParticles(0xef4444, 20);
          this.triggerNotification('🔥 اصطدمت بالمعادي المظلم وخسرت من رصيدك! (-35 رصيد)', 'danger');

          // Banish enemy flying away
          npc.isBanished = true;
          npc.banishVelocity = new THREE.Vector3((Math.random() - 0.5) * 6, 5, 8);
        }

        this.checkGameConditions();
        this.onStateChange({ ...this.state });
      }

      // Avoidance Check: If Nasser safely passes an NPC without colliding
      if (!npc.isResolved && distToNasserZ < -2.2) {
        npc.isResolved = true;
        if (npc.type === 'loyal') {
          // Missed loyal blessing
          this.state.loyalPassed += 1;
          this.triggerNotification('مررت بجانب الموالي دون الاصطدام به ونيل بركته', 'warning');
        } else {
          // Successfully dodged enemy!
          this.state.enemyPassed += 1;
          this.state.score += 50;
          this.triggerNotification('🛡️ راوغت المعادي وتجنبت الاصطدام به بأمان! (+50 نقطة)', 'info');
        }
        this.checkGameConditions();
        this.onStateChange({ ...this.state });
      }

      // Clean up far behind
      if (distToNasserZ < -35) {
        this.scene.remove(npc.rig.group);
        this.npcs.splice(i, 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Update Road Obstacles & Collisions
  // --------------------------------------------------------------------------

  private updateObstacles(_delta: number) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const distZ = obs.zPos - this.nasserZ;

      // Check collision / fall into pit ("الغي الحواجز و ضع مكانها حفر بحيث تنتهي حياة ناصر اذا وقع فيها")
      if (!obs.hasHit && Math.abs(distZ) < 1.15) {
        const laneDist = Math.abs(this.currentX - obs.laneX);

        if (laneDist < obs.boundsRadius) {
          // Check if Nasser successfully jumped over the pit
          if (this.isJumping && this.nasserY > obs.height) {
            // Cleared the deep pit!
            obs.hasHit = true;
            this.state.score += 30;
            this.triggerNotification('✨ قفزة بارعة ورشيقة فوق الحفرة العميقة! (+30 نقطة)', 'info');
          } else {
            // Fallen into the deep pit! Ends Nasser's life immediately!
            obs.hasHit = true;
            this.nasserY = -2.2; // Plunge deep into the dark pit
            soundManager.playPitFall();
            this.state.health = 0; // Life ends immediately!
            this.triggerShake(1.3);
            this.flashScreen('rgba(15, 8, 8, 0.95)');
            this.triggerNotification('💀 سقط ناصر في الحفرة العميقة وانتهت حياته فوراً!', 'danger');

            this.checkGameConditions();
            this.onStateChange({ ...this.state });
          }
        }
      }

      // Clean up far behind
      if (distZ < -30) {
        this.scene.remove(obs.group);
        this.obstacles.splice(i, 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Dynamic Active Interaction Prompt for HUD
  // --------------------------------------------------------------------------

  private updateActivePrompt() {
    const nearbyNpc = this.findNearbyNpc();

    if (nearbyNpc && !nearbyNpc.isResolved) {
      const dist = Math.max(0, nearbyNpc.zPos - this.nasserZ);
      this.state.activePrompt = {
        visible: true,
        npcType: nearbyNpc.type,
        npcName: nearbyNpc.type === 'loyal' ? 'شخص موالي (وجهه منير)' : 'شخص معادي (وجهه مظلم)',
        phrase: nearbyNpc.type === 'loyal' ? 'ينادي: يا زهراء ✨' : 'ينادي: احرقوهم 🔥',
        distance: Math.round(dist * 10) / 10,
      };
    } else {
      this.state.activePrompt = null;
    }

    this.onStateChange({ ...this.state });
  }

  // --------------------------------------------------------------------------
  // Particles & Visual Sparks
  // --------------------------------------------------------------------------

  private spawnAuraParticles(colorHex: number, count: number) {
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        this.currentX + (Math.random() - 0.5) * 1.2,
        this.nasserY + 1.0 + (Math.random() - 0.5) * 1.0,
        this.nasserZ + (Math.random() - 0.5) * 1.2
      );
      this.particleGroup.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 3
      );

      this.activeSparks.push({
        mesh,
        vel,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }

  // --------------------------------------------------------------------------
  // Dynamic Weather, Atmosphere, Wind & Palm Swaying
  // --------------------------------------------------------------------------

  private initWindParticles() {
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.65,
      side: THREE.DoubleSide,
    });
    const dustMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.65,
    });
    const fireflyMat = new THREE.MeshBasicMaterial({
      color: 0x86efac,
      transparent: true,
      opacity: 0.9,
    });

    const leafGeo = new THREE.PlaneGeometry(0.14, 0.24);
    const dustGeo = new THREE.SphereGeometry(0.045, 4, 4);
    const fireflyGeo = new THREE.SphereGeometry(0.06, 6, 6);

    for (let i = 0; i < 48; i++) {
      const type: 'leaf' | 'dust' | 'firefly' = i % 3 === 0 ? 'leaf' : i % 3 === 1 ? 'dust' : 'firefly';
      const geo = type === 'leaf' ? leafGeo : type === 'dust' ? dustGeo : fireflyGeo;
      const mat = type === 'leaf' ? leafMat : type === 'dust' ? dustMat : fireflyMat;
      const mesh = new THREE.Mesh(geo, mat);

      const initialY = 0.4 + Math.random() * 2.8;
      mesh.position.set(
        (Math.random() - 0.5) * 12,
        initialY,
        this.nasserZ + Math.random() * 60 - 5
      );
      this.windParticleGroup.add(mesh);

      this.windParticles.push({
        mesh,
        initialY,
        speedFactor: 0.7 + Math.random() * 0.6,
        type,
      });
    }
  }

  public setTimeOfDayPreset(preset: TimeOfDayPreset) {
    this.timeOfDayPreset = preset;
    const labels: Record<TimeOfDayPreset, string> = {
      auto: 'دورة طقس تلقائية ديناميكية',
      morning: 'شروق وضحى مشرق',
      noon: 'ظهيرة مشمسة',
      sunset: 'أصيل وغروب دافئ',
      night: 'ليل قمري ساحر',
    };
    this.triggerNotification(`تم تغيير الطقس إلى: ${labels[preset]}`, 'info');
    this.onStateChange({ ...this.state });
  }

  public getTimeOfDayPreset(): TimeOfDayPreset {
    return this.timeOfDayPreset;
  }

  private updateWeatherAndAtmosphere(delta: number, elapsedTime: number) {
    this.windTime += delta;

    // Wind gust simulation: smooth combined harmonics
    const gustWave = Math.sin(this.windTime * 0.45) * 0.35 + Math.sin(this.windTime * 1.15) * 0.2;
    this.windGust = Math.max(0.15, Math.min(1.0, 0.5 + gustWave));

    // Time of day calculation
    if (this.timeOfDayPreset === 'auto') {
      // Complete gentle 2-minute cycle, smoothly advancing with time and distance
      const cycleSpeed = 0.008;
      this.timeOfDayProgress = ((elapsedTime * cycleSpeed) + (this.state.distance * 0.0006)) % 1.0;
    } else {
      let targetProgress = 0.12; // morning
      if (this.timeOfDayPreset === 'noon') targetProgress = 0.35;
      else if (this.timeOfDayPreset === 'sunset') targetProgress = 0.65;
      else if (this.timeOfDayPreset === 'night') targetProgress = 0.88;

      this.timeOfDayProgress = THREE.MathUtils.damp(this.timeOfDayProgress, targetProgress, 4.0, delta);
    }

    const p = this.timeOfDayProgress;
    let isNight = false;
    let timeLabel = '';

    // Interpolate Sky, Fog, Sun, and Hemisphere light across the 4 stages
    // 0.0 - 0.25: Morning (شروق وضحى)
    // 0.25 - 0.50: Midday / Noon (ظهيرة مشمسة)
    // 0.50 - 0.75: Sunset / Twilight (أصيل وغروب دافئ)
    // 0.75 - 1.00: Night (ليل قمري ساحر)
    const skyColor = new THREE.Color();
    const fogColor = new THREE.Color();
    const sunColor = new THREE.Color();
    const hemiSky = new THREE.Color();
    const hemiGround = new THREE.Color();
    let sunIntensity = 2.2;
    let hemiIntensity = 1.2;
    let sunAngle = 0;

    if (p < 0.25) {
      // Morning -> Noon
      const t = p / 0.25;
      timeLabel = '🌅 الصباح والضحى المشرق';
      skyColor.lerpColors(new THREE.Color(0xf6d396), new THREE.Color(0x7dd3fc), t);
      fogColor.lerpColors(new THREE.Color(0xf6d396), new THREE.Color(0xbae6fd), t);
      sunColor.lerpColors(new THREE.Color(0xffedd5), new THREE.Color(0xffffff), t);
      hemiSky.lerpColors(new THREE.Color(0xfef08a), new THREE.Color(0xe0f2fe), t);
      hemiGround.lerpColors(new THREE.Color(0x365314), new THREE.Color(0x3f6212), t);
      sunIntensity = THREE.MathUtils.lerp(2.2, 2.6, t);
      hemiIntensity = THREE.MathUtils.lerp(1.2, 1.35, t);
      sunAngle = THREE.MathUtils.lerp(0.3, 0.9, t);
    } else if (p < 0.5) {
      // Noon -> Sunset
      const t = (p - 0.25) / 0.25;
      timeLabel = t < 0.5 ? '☀️ الظهيرة الزراعية المشمسة' : '🌤️ العصر الذهبي';
      skyColor.lerpColors(new THREE.Color(0x7dd3fc), new THREE.Color(0xf97316), t);
      fogColor.lerpColors(new THREE.Color(0xbae6fd), new THREE.Color(0xfb923c), t);
      sunColor.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xfed7aa), t);
      hemiSky.lerpColors(new THREE.Color(0xe0f2fe), new THREE.Color(0xfb923c), t);
      hemiGround.lerpColors(new THREE.Color(0x3f6212), new THREE.Color(0x451a03), t);
      sunIntensity = THREE.MathUtils.lerp(2.6, 2.1, t);
      hemiIntensity = THREE.MathUtils.lerp(1.35, 1.4, t);
      sunAngle = THREE.MathUtils.lerp(0.9, 0.25, t);
    } else if (p < 0.75) {
      // Sunset -> Night (Luminous Moonlit Oasis - Never Pitch Black)
      const t = (p - 0.5) / 0.25;
      timeLabel = t < 0.6 ? '🌇 الأصيل والغروب البديع' : '🌌 الشفق وسحر الليل القمري';
      skyColor.lerpColors(new THREE.Color(0xf97316), new THREE.Color(0x132247), t);
      fogColor.lerpColors(new THREE.Color(0xfb923c), new THREE.Color(0x192a4a), t);
      sunColor.lerpColors(new THREE.Color(0xfed7aa), new THREE.Color(0xc7d2fe), t);
      hemiSky.lerpColors(new THREE.Color(0xfb923c), new THREE.Color(0x38bdf8), t);
      hemiGround.lerpColors(new THREE.Color(0x451a03), new THREE.Color(0x1e3a1e), t);
      sunIntensity = THREE.MathUtils.lerp(2.1, 1.3, t);
      hemiIntensity = THREE.MathUtils.lerp(1.4, 1.1, t);
      sunAngle = THREE.MathUtils.lerp(0.25, 0.8, t);
      if (t > 0.45) isNight = true;
    } else {
      // Night -> Morning
      const t = (p - 0.75) / 0.25;
      timeLabel = t < 0.7 ? '🌙 الليل القمري الساحر' : '🌄 الفجر وتباشير الصباح';
      skyColor.lerpColors(new THREE.Color(0x132247), new THREE.Color(0xf6d396), t);
      fogColor.lerpColors(new THREE.Color(0x192a4a), new THREE.Color(0xf6d396), t);
      sunColor.lerpColors(new THREE.Color(0xc7d2fe), new THREE.Color(0xffedd5), t);
      hemiSky.lerpColors(new THREE.Color(0x38bdf8), new THREE.Color(0xfef08a), t);
      hemiGround.lerpColors(new THREE.Color(0x1e3a1e), new THREE.Color(0x365314), t);
      sunIntensity = THREE.MathUtils.lerp(1.3, 2.2, t);
      hemiIntensity = THREE.MathUtils.lerp(1.1, 1.25, t);
      sunAngle = THREE.MathUtils.lerp(0.8, 0.3, t);
      if (t < 0.6) isNight = true;
    }

    // Apply colors to scene with gentle balanced fog
    this.scene.background = skyColor;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color = fogColor;
      this.scene.fog.density = isNight ? 0.0082 : 0.0072;
    }

    this.sunLight.color.copy(sunColor);
    this.sunLight.intensity = sunIntensity;
    this.sunLight.position.set(
      15 * Math.sin(sunAngle * 3.14),
      35 * Math.sin(Math.max(0.2, sunAngle)),
      this.nasserZ + 20 * Math.cos(sunAngle * 3.14)
    );
    // Keep sun target centered on Nasser so shadows and directional light are always perfectly aligned
    this.sunLight.target.position.set(0, 0, this.nasserZ);
    this.sunLight.target.updateMatrixWorld();

    this.hemiLight.color.copy(hemiSky);
    this.hemiLight.groundColor.copy(hemiGround);
    this.hemiLight.intensity = hemiIntensity;

    // Wind Audio Sync
    soundManager.updateWeatherAudio(isNight, this.windGust);

    // 1. Palm Trees Swaying Animation
    for (let i = 0; i < this.palmTrees.length; i++) {
      const palm = this.palmTrees[i];
      const u = palm.userData;
      if (!u || !u.trunkGroup) continue;

      // Natural wind wave rippling through the palms along Z axis
      const wave = Math.sin(this.windTime * 2.2 + palm.position.z * 0.06 + u.phaseOffset);
      const swayZ = wave * (0.04 + this.windGust * 0.06);

      u.trunkGroup.rotation.z = swayZ;
      u.crownGroup.rotation.z = swayZ * 1.5;
      u.crownGroup.rotation.x = Math.cos(this.windTime * 1.8 + u.phaseOffset) * (0.02 + this.windGust * 0.035);

      // Fronds flutter individually
      if (u.fronds && u.fronds.length > 0) {
        for (let f = 0; f < u.fronds.length; f++) {
          const frond = u.fronds[f];
          frond.rotation.z = Math.sin(this.windTime * 3.4 + f * 0.5 + u.phaseOffset) * (0.03 + this.windGust * 0.05);
        }
      }
    }

    // 2. Wind Particles (Drifting leaves, dust motes, fireflies)
    for (let i = 0; i < this.windParticles.length; i++) {
      const p = this.windParticles[i];
      const speedX = (1.8 + this.windGust * 3.2) * p.speedFactor * delta;
      p.mesh.position.x += speedX;
      p.mesh.position.y = p.initialY + Math.sin(this.windTime * 2.5 + i) * 0.35;
      p.mesh.position.z -= (this.currentForwardSpeed * 0.15) * delta;

      // Rotate drifting leaves
      if (p.type === 'leaf') {
        p.mesh.rotation.x += 2.0 * delta;
        p.mesh.rotation.y += 3.0 * delta;
      }

      // Recycle if blown off road boundary or behind Nasser
      if (p.mesh.position.x > 6.5) {
        p.mesh.position.x = -6.5;
        p.mesh.position.z = this.nasserZ + 5 + Math.random() * 50;
      }
      if (p.mesh.position.z < this.nasserZ - 6) {
        p.mesh.position.z = this.nasserZ + 50 + Math.random() * 10;
        p.mesh.position.x = (Math.random() - 0.5) * 10;
      }

      // Firefly glow at night and twilight
      if (p.type === 'firefly') {
        p.mesh.visible = isNight || this.timeOfDayProgress > 0.65 || this.timeOfDayProgress < 0.15;
        const scale = 0.8 + Math.sin(this.windTime * 5 + i) * 0.4;
        p.mesh.scale.set(scale, scale, scale);
      }
    }

    // Determine wind label
    const windSpeedLabel =
      this.windGust > 0.75
        ? '💨 رياح نشطة'
        : this.windGust > 0.45
        ? '🍃 نسيم عليل'
        : '🌿 هواء هادئ';

    this.state.weather = {
      preset: this.timeOfDayPreset,
      timeOfDayLabel: timeLabel,
      isNight,
      windSpeedLabel,
      windGust: Math.round(this.windGust * 100) / 100,
    };
  }

  private updateParticles(delta: number) {
    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const spark = this.activeSparks[i];
      spark.life += delta;

      spark.mesh.position.addScaledVector(spark.vel, delta);
      spark.vel.y -= 4 * delta; // slight gravity
      const scale = 1 - spark.life / spark.maxLife;
      spark.mesh.scale.set(scale, scale, scale);

      if (spark.life >= spark.maxLife) {
        this.particleGroup.remove(spark.mesh);
        this.activeSparks.splice(i, 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Camera Positioning & Views
  // --------------------------------------------------------------------------

  public setCameraMode(mode: CameraViewMode) {
    this.cameraMode = mode;

    if (this.nasserRig && this.nasserRig.head) {
      // In first-person mode, hide head mesh so it doesn't clip into camera view
      this.nasserRig.head.visible = mode !== 'firstPerson';
    }

    if (mode === 'chase') {
      this.orbitPitch = 0.22;
      this.orbitDistance = 6.2;
      this.triggerNotification('📹 كاميرا المطاردة (المنظور الخلفي)', 'info');
    } else if (mode === 'firstPerson') {
      this.orbitPitch = 0.05;
      this.orbitDistance = 0.5;
      this.triggerNotification('👁️ منظور الشخص الأول (عينا ناصر)', 'info');
    } else if (mode === 'shoulder') {
      this.orbitPitch = 0.15;
      this.orbitDistance = 3.4;
      this.triggerNotification('🎯 منظور الكتف المقرب', 'info');
    } else if (mode === 'overhead') {
      this.orbitPitch = 0.65;
      this.orbitDistance = 11.5;
      this.triggerNotification('🛸 منظور علوي بانورامي كاشف للطريق', 'info');
    } else if (mode === 'free') {
      this.orbitPitch = 0.25;
      this.orbitDistance = 7.0;
      this.triggerNotification('🔄 المنظور الحر: اسحب بالفأرة أو اللمس للدوران 360°', 'info');
    }
  }

  public getCameraMode(): CameraViewMode {
    return this.cameraMode;
  }

  private updateCamera(delta: number) {
    let targetPos = new THREE.Vector3();
    let targetLook = new THREE.Vector3();

    // Camera shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 2.0);
    }

    // Trigonometric components from user's interactive drag / orbit
    const cosP = Math.cos(this.orbitPitch);
    const sinP = Math.sin(this.orbitPitch);
    const sinY = Math.sin(this.orbitYaw);
    const cosY = Math.cos(this.orbitYaw);

    switch (this.cameraMode) {
      case 'firstPerson': {
        // Position directly at Nasser's eye level looking ahead with free look
        targetPos.set(
          this.currentX + shakeX,
          this.nasserY + 1.58 + shakeY,
          this.nasserZ + 0.25
        );
        targetLook.set(
          this.currentX + Math.sin(this.orbitYaw) * 16,
          this.nasserY + 1.58 - Math.sin(this.orbitPitch) * 10,
          this.nasserZ + Math.cos(this.orbitYaw) * 16
        );
        break;
      }

      case 'shoulder': {
        // Tight over-the-shoulder action camera
        const shoulderDist = this.orbitDistance || 3.4;
        targetPos.set(
          this.currentX + 0.85 - sinY * cosP * shoulderDist + shakeX,
          this.nasserY + 1.85 + sinP * shoulderDist + shakeY,
          this.nasserZ - cosY * cosP * shoulderDist
        );
        targetLook.set(
          this.currentX + 0.25 + sinY * 5,
          this.nasserY + 1.5,
          this.nasserZ + 15
        );
        break;
      }

      case 'overhead': {
        // High strategic overview
        const overheadDist = this.orbitDistance || 11.5;
        targetPos.set(
          this.currentX * 0.4 - sinY * 4.0 + shakeX,
          this.nasserY + overheadDist + shakeY,
          this.nasserZ - cosY * 8.5
        );
        targetLook.set(this.currentX * 0.3, this.nasserY + 0.8, this.nasserZ + 12);
        break;
      }

      case 'free': {
        // Pure 360-degree free orbit around Nasser at any angle and distance
        const dist = this.orbitDistance || 7.0;
        targetPos.set(
          this.currentX - sinY * cosP * dist + shakeX,
          this.nasserY + 1.6 + sinP * dist + shakeY,
          this.nasserZ - cosY * cosP * dist
        );
        targetLook.set(this.currentX, this.nasserY + 1.4, this.nasserZ);
        break;
      }

      case 'chase':
      default: {
        // Smooth third-person chase with interactive drag look offset
        const dist = this.orbitDistance || 6.2;
        targetPos.set(
          this.currentX * 0.6 - sinY * cosP * dist + shakeX,
          this.nasserY + 2.4 + sinP * dist + shakeY,
          this.nasserZ - cosY * cosP * dist
        );
        targetLook.set(
          this.currentX * 0.3 + sinY * 6,
          this.nasserY + 1.5,
          this.nasserZ + 14
        );
        break;
      }
    }

    this.cameraPos.lerp(targetPos, 0.14);
    this.cameraLookTarget.lerp(targetLook, 0.16);

    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraLookTarget);
  }

  // --------------------------------------------------------------------------
  // Screen Effects: Red Flash & Shake
  // --------------------------------------------------------------------------

  private triggerShake(intensity: number) {
    this.shakeIntensity = intensity;
  }

  private flashScreen(color: string) {
    if (!this.flashOverlayEl) return;
    this.flashOverlayEl.style.backgroundColor = color;
    this.flashOverlayEl.style.opacity = '1';
    setTimeout(() => {
      if (this.flashOverlayEl) {
        this.flashOverlayEl.style.opacity = '0';
      }
    }, 240);
  }

  private triggerNotification(text: string, type: 'success' | 'danger' | 'warning' | 'info') {
    this.state.notification = {
      text,
      type,
      timestamp: Date.now(),
    };
    this.onStateChange({ ...this.state });
  }

  public shoutYaAliAndTearGate() {
    if (!this.isAtFortressGate || this.gateTorn || !this.fortressAssembly) return;

    // 1. Nasser shouts "يا علي"
    soundManager.speak('يا علي');
    soundManager.playGateTearSound();

    // 2. Nasser raises his arms powerfully in heroic stance
    this.actionState = 'hug';
    this.actionTimer = 1.4;
    this.nasserRig.leftArm.rotation.x = -2.6;
    this.nasserRig.leftArm.rotation.z = 0.6;
    this.nasserRig.rightArm.rotation.x = -2.6;
    this.nasserRig.rightArm.rotation.z = -0.6;
    this.nasserRig.torso.rotation.x = -0.15;
    this.nasserRig.head.rotation.x = -0.35;

    // 3. Screen shake & divine golden flash
    this.triggerShake(1.3);
    this.flashScreen('rgba(251, 191, 36, 0.75)');

    // 4. Eruption of golden aura particles
    this.spawnAuraParticles(0xfde047, 70);

    // 5. Gate breaks off hinges and is hurled far away into the sky ("فتنقلع البوابة و تلقى بعيدا")
    this.gateFlying = true;
    this.gateFlyVelocity.set(
      (Math.random() - 0.5) * 6,
      24.0, // High explosive vertical loft
      -42.0 // Hurled far backward beyond the fortress!
    );
    this.gateFlyRotVelocity.set(5.2, 3.6, 2.4);

    this.gateTorn = true;
    this.state.gateTorn = true;
    this.state.score += 500;
    this.triggerNotification('⚡ صدح ناصر: «يا علي!» فانقلعت بوابة الحصن وطارت بعيداً بنصر مبين!', 'success');
    this.onStateChange({ ...this.state });
  }

  /**
   * Smoothly transitions Nasser from Stage 1 into Stage 2 combat
   * Nasser draws his sword and encounters 5 armored knights
   */
  private startStage2() {
    this.stage = 2;
    this.stage2Phase = 'knights';
    this.state.stage = 2;
    this.state.stage2Phase = 'knights';
    this.state.hasSword = true;
    this.state.isAtFortressGate = false;
    this.isAtFortressGate = false;
    this.postGateTimer = 0;
    this.currentForwardSpeed = this.nasserBaseSpeed;

    // Nasser equips his combat sword ("يبدأ ناصر مرحلته الثانية و بيده سيف للقتال")
    if (this.nasserRig.sword) {
      this.nasserRig.sword.visible = true;
    }

    soundManager.playSwordSwing();
    this.triggerShake(0.7);
    this.spawnAuraParticles(0xfde047, 45);

    this.triggerNotification(
      '⚔️ عبر ناصر البوابة الأولى شاهراً سيفه للقتال! انقر نقرتين على ظهر ناصر للضرب بصياح «يا علي!» واقضِ على الفرسان المدرعين سريعاً!',
      'success'
    );
    this.onStateChange({ ...this.state });
  }

  private triggerVictory() {
    this.state.isVictory = true;
    soundManager.playVictory();
    if (this.stage === 2) {
      this.triggerNotification(
        '🏆 مبارك النصر المبين يا ناصر! حطمت المنجنيق ودحرت الفرسان والدبابات بسيفك بنداء «يا علي!»',
        'success'
      );
    } else {
      this.triggerNotification(
        '🎉 مبارك النصر يا ناصر! انفتحت البوابة بنداء «يا علي» وتكللت الرحلة بالنصر المبين!',
        'success'
      );
    }

    // Confetti burst
    if (typeof window !== 'undefined') {
      import('canvas-confetti').then((confettiModule) => {
        const confetti = confettiModule.default;
        confetti({
          particleCount: 220,
          spread: 110,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#f59e0b', '#ffffff', '#eab308', '#38bdf8', '#ef4444'],
        });
      });
    }

    this.onStateChange({ ...this.state });
  }

  // --------------------------------------------------------------------------
  // Stage 2 Update Loop & Mechanics
  // --------------------------------------------------------------------------

  private updateStage2(delta: number, time: number) {
    // ------------------------------------------------------------------------
    // Phase 1: 5 Iron-Armored Knights ("يظهر لناصر فارس مدجج بالدرع الحديد على كامل جسده")
    // ------------------------------------------------------------------------
    if (this.stage2Phase === 'knights') {
      if (!this.activeKnight && this.knightsDefeated < 5) {
        const knightRig = createIronKnightModel(this.knightsDefeated + 1);
        const zPos = this.nasserZ + 36;
        const laneX = this.targetLaneX; // Intercepts on Nasser's current lane
        knightRig.group.position.set(laneX, 0, zPos);
        this.scene.add(knightRig.group);
        this.activeKnight = {
          ...knightRig,
          zPos,
          laneX,
          speed: 6.8,
          isDying: false,
          deathTimer: 0,
        };
      }

      if (this.activeKnight) {
        if (this.activeKnight.isDying) {
          this.activeKnight.deathTimer -= delta;
          this.activeKnight.group.position.y += 6.0 * delta;
          this.activeKnight.group.rotation.x += 8.0 * delta;
          this.activeKnight.group.rotation.y += 6.0 * delta;
          if (this.activeKnight.deathTimer <= 0) {
            this.scene.remove(this.activeKnight.group);
            this.activeKnight = null;
          }
        } else {
          // Knight marches aggressively towards Nasser
          this.activeKnight.zPos -= this.activeKnight.speed * delta;
          this.activeKnight.group.position.set(this.activeKnight.laneX, 0, this.activeKnight.zPos);

          // Animate knight stride & weapon swing
          const stride = Math.sin(time * 8.0) * 0.45;
          this.activeKnight.leftLeg.rotation.x = stride;
          this.activeKnight.rightLeg.rotation.x = -stride;
          this.activeKnight.rightArm.rotation.x = -0.6 + Math.sin(time * 6.0) * 0.4;

          // Attack Nasser if Nasser did not strike in time
          const distZ = this.activeKnight.zPos - this.nasserZ;
          const distX = Math.abs(this.activeKnight.laneX - this.currentX);
          if (distZ < 1.3 && distX < 1.5) {
            soundManager.playIronClash();
            this.state.health = Math.max(0, this.state.health - 20);
            this.triggerShake(0.7);
            this.flashScreen('rgba(239, 68, 68, 0.45)');
            this.triggerNotification('⚠️ أصابك الفارس المدرع! اضربه بسيفك عاجلاً كي لا يقضي عليك!', 'danger');

            this.activeKnight.isDying = true;
            this.activeKnight.deathTimer = 0.3;
            this.knightsDefeated++;
            this.state.knightsDefeated = this.knightsDefeated;
            if (this.knightsDefeated >= 5) {
              setTimeout(() => {
                this.stage2Phase = 'gate2';
                this.state.stage2Phase = 'gate2';
                this.spawnFortressGate2();
                this.onStateChange({ ...this.state });
              }, 500);
            }
            this.checkGameConditions();
            this.onStateChange({ ...this.state });
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // Gate 2 Flight Physics
    // ------------------------------------------------------------------------
    if (this.gate2Flying && this.fortressGate2) {
      this.fortressGate2.doorsGroup.position.addScaledVector(this.gate2FlyVelocity, delta);
      this.fortressGate2.doorsGroup.rotation.x += this.gate2FlyRotVelocity.x * delta;
      this.fortressGate2.doorsGroup.rotation.y += this.gate2FlyRotVelocity.y * delta;
      this.gate2FlyVelocity.y -= 14.0 * delta;
    }

    // ------------------------------------------------------------------------
    // Phase 2: 5 Half-Barrel Wooden Siege Tanks ("تظهر له 5 دبابات واحدة تلو الاخرى")
    // ------------------------------------------------------------------------
    if (this.stage2Phase === 'tanks') {
      if (!this.activeTank && this.tanksDefeated < 5) {
        const tankAssembly = createWoodenTankModel(this.tanksDefeated + 1);
        const zPos = this.nasserZ + 42;
        tankAssembly.group.position.set(0, 0, zPos);
        this.scene.add(tankAssembly.group);
        this.activeTank = {
          ...tankAssembly,
          zPos,
          laneX: 0,
          speed: 8.5,
          isDying: false,
          deathTimer: 0,
        };
      }

      if (this.activeTank) {
        if (this.activeTank.isDying) {
          this.activeTank.deathTimer -= delta;
          this.activeTank.group.position.y += 4.0 * delta;
          this.activeTank.group.rotation.z += 5.0 * delta;
          if (this.activeTank.deathTimer <= 0) {
            this.scene.remove(this.activeTank.group);
            this.activeTank = null;
          }
        } else {
          // Tank rolls forward and actively steers towards Nasser ("الدبابات لها عجلات و تسير نحو ناصر")
          this.activeTank.zPos -= this.activeTank.speed * delta;
          this.activeTank.laneX = THREE.MathUtils.damp(this.activeTank.laneX, this.currentX, 2.4, delta);
          this.activeTank.group.position.set(this.activeTank.laneX, 0, this.activeTank.zPos);

          // Subtle yaw rotation towards steering lane
          const dx = this.currentX - this.activeTank.laneX;
          this.activeTank.group.rotation.y = THREE.MathUtils.damp(
            this.activeTank.group.rotation.y,
            dx * 0.14,
            5.0,
            delta
          );

          // Wheels spin forward on their axles as the tank rolls
          const rollSpeed = this.activeTank.speed / 0.50;
          this.activeTank.wheels.forEach((w) => {
            w.rotation.x -= rollSpeed * delta;
          });

          // Run-over check on Nasser
          const distZ = this.activeTank.zPos - this.nasserZ;
          const distX = Math.abs(this.activeTank.laneX - this.currentX);
          if (distZ < 1.8 && distX < 1.6) {
            soundManager.playWoodShatter();
            this.state.health = Math.max(0, this.state.health - 25);
            this.triggerShake(0.85);
            this.flashScreen('rgba(239, 68, 68, 0.45)');
            this.triggerNotification('⚠️ صدمتك الدبابة الخشبية! حطمها بسيفك قبل أن تدهسك!', 'danger');

            this.activeTank.isDying = true;
            this.activeTank.deathTimer = 0.3;
            this.tanksDefeated++;
            this.state.tanksDefeated = this.tanksDefeated;
            if (this.tanksDefeated >= 5) {
              setTimeout(() => {
                this.stage2Phase = 'gate3';
                this.state.stage2Phase = 'gate3';
                this.spawnFortressGate3();
                this.onStateChange({ ...this.state });
              }, 500);
            }
            this.checkGameConditions();
            this.onStateChange({ ...this.state });
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // Gate 3 Flight Physics
    // ------------------------------------------------------------------------
    if (this.gate3Flying && this.fortressGate3) {
      this.fortressGate3.doorsGroup.position.addScaledVector(this.gate3FlyVelocity, delta);
      this.fortressGate3.doorsGroup.rotation.x += this.gate3FlyRotVelocity.x * delta;
      this.fortressGate3.doorsGroup.rotation.y += this.gate3FlyRotVelocity.y * delta;
      this.gate3FlyVelocity.y -= 14.0 * delta;
    }

    // ------------------------------------------------------------------------
    // Phase 3: Siege Catapult Boss ("المنجنيق يطلق 5 قذائف قبل ان يصل اليه ناصر")
    // ------------------------------------------------------------------------
    if (this.stage2Phase === 'catapult' && !this.catapultDestroyed) {
      // Catapult systematically fires 5 projectiles before Nasser can reach it
      if (this.catapultShotsFired < 5) {
        this.catapultFireTimer += delta;
        if (this.catapultFireTimer >= 2.1) {
          this.catapultFireTimer = 0;
          this.catapultShotsFired++;
          this.fireCatapultProjectile(this.catapultShotsFired);
        }
      }

      // Update throwing arm recoil animation
      if (this.catapultAssembly) {
        this.catapultAssembly.throwingArm.rotation.x = THREE.MathUtils.damp(
          this.catapultAssembly.throwingArm.rotation.x,
          0,
          3.0,
          delta
        );
      }

      // Update active projectiles flying
      for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
        const proj = this.activeProjectiles[i];
        proj.progress += proj.speed * delta;

        // Parabolic arc interpolation
        const p = proj.progress;
        proj.currentPos.x = THREE.MathUtils.lerp(proj.startPos.x, proj.targetPos.x, p);
        proj.currentPos.z = THREE.MathUtils.lerp(proj.startPos.z, proj.targetPos.z, p);
        proj.currentPos.y =
          THREE.MathUtils.lerp(proj.startPos.y, proj.targetPos.y, p) + Math.sin(p * Math.PI) * proj.arcHeight;

        proj.group.position.copy(proj.currentPos);
        proj.boulder.rotation.x += 5.0 * delta;
        proj.boulder.rotation.y += 4.0 * delta;

        // Shadow ring pulse
        const markerScale = 0.8 + Math.sin(p * Math.PI) * 0.4;
        proj.shadowTargetMarker.scale.set(markerScale, markerScale, markerScale);

        if (p >= 1.0) {
          // Molten boulder impact!
          this.catapultShotsResolved++;
          soundManager.playExplosion();
          this.triggerShake(0.7);
          this.spawnAuraParticles(0xff4400, 30);
          this.spawnAuraParticles(0xfbbf24, 20);

          // Impact radius check on Nasser ("اجعل المنجنيق يلقي حجرا اذا اصابت ناصر تنتهي حياته")
          const distZ = Math.abs(this.nasserZ - proj.targetPos.z);
          const distX = Math.abs(this.currentX - proj.targetPos.x);
          if (distZ < 2.0 && distX < 1.4 && (!this.isJumping || this.nasserY < 0.8)) {
            this.state.health = 0; // Life ends immediately!
            soundManager.playWrongActionPenalty();
            this.triggerShake(1.6);
            this.flashScreen('rgba(239, 68, 68, 0.95)');
            this.triggerNotification('🪨 أصابت صخرة المنجنيق الضخمة ناصر وقضت على حياته فوراً!', 'danger');
            this.checkGameConditions();
            this.onStateChange({ ...this.state });
          } else {
            this.triggerNotification(`💨 راوغت صخرة المنجنيق (${this.catapultShotsResolved}/5) بنجاح!`, 'info');
          }

          if (this.catapultShotsResolved >= 5) {
            this.triggerNotification('⚡ راوغت كافة الصخور الخمس بنجاح! اندفع نحو المنجنيق وحطمه بسيفك!', 'success');
          }

          this.scene.remove(proj.group);
          this.scene.remove(proj.shadowTargetMarker);
          this.activeProjectiles.splice(i, 1);
        }
      }
    }
  }

  private fireCatapultProjectile(shotNumber: number = 1) {
    if (!this.catapultAssembly) return;

    soundManager.playCatapultFire();
    this.catapultAssembly.throwingArm.rotation.x = -0.7;

    const projAssembly = createCatapultProjectile();
    const startPos = new THREE.Vector3(0, 4.2, this.catapultZ + 2.0);
    const lanes = [-1.7, 0, 1.7];
    const targetLane = lanes[Math.floor(Math.random() * lanes.length)];
    const targetZ = this.nasserZ + 11 + Math.random() * 5;
    const targetPos = new THREE.Vector3(targetLane, 0.05, targetZ);

    projAssembly.group.position.copy(startPos);
    projAssembly.shadowTargetMarker.position.set(targetPos.x, 0.04, targetPos.z);

    this.scene.add(projAssembly.group);
    this.scene.add(projAssembly.shadowTargetMarker);

    this.activeProjectiles.push({
      ...projAssembly,
      startPos,
      targetPos,
      currentPos: startPos.clone(),
      progress: 0,
      speed: 0.65,
      arcHeight: 7.5,
    });

    this.triggerNotification(`🪨 أطلق المنجنيق صخرة حجرية ضخمة (${shotNumber}/5).. راوغ موضع سقوطها!`, 'warning');
  }

  private spawnFortressGate2() {
    this.gate2Z = this.nasserZ + 48;
    this.fortressGate2 = createFortressGate();
    this.fortressGate2.group.position.set(0, 0, this.gate2Z);
    this.scene.add(this.fortressGate2.group);
    this.triggerNotification('🏰 بلغت بوابة الحصن الثانية! اضربها بسيفك لتحطيمها واقتحام الطريق!', 'info');
  }

  private spawnFortressGate3() {
    this.gate3Z = this.nasserZ + 48;
    this.fortressGate3 = createFortressGate();
    this.fortressGate3.group.position.set(0, 0, this.gate3Z);
    this.scene.add(this.fortressGate3.group);
    this.triggerNotification('🏰 بلغت بوابة الحصن الثالثة المنيعة! اضربها بسيفك لتقتحم ساحة المنجنيق!', 'info');
  }

  private spawnCatapultBoss() {
    this.catapultZ = this.nasserZ + 75;
    this.catapultAssembly = createCatapultModel();
    this.catapultAssembly.group.position.set(0, 0, this.catapultZ);
    this.scene.add(this.catapultAssembly.group);
    this.catapultShotsFired = 0;
    this.catapultShotsResolved = 0;
    this.catapultFireTimer = 0.8;
    this.triggerNotification('🪨 اقتحمت ساحة المنجنيق! تفادَ صخوره الـ 5 واقترب لتحطيمه بسيفك!', 'warning');
  }

  private spawnSwordSlashParticles() {
    const forwardX = this.currentX;
    const forwardZ = this.nasserZ + 1.2;
    for (let i = 0; i < 16; i++) {
      const geo = new THREE.PlaneGeometry(0.14, 0.04);
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? 0x38bdf8 : 0xfde047,
        side: THREE.DoubleSide,
      });
      const spark = new THREE.Mesh(geo, mat);
      spark.position.set(
        forwardX + (Math.random() - 0.5) * 1.4,
        1.2 + (Math.random() - 0.5) * 0.8,
        forwardZ + (Math.random() - 0.5) * 0.6
      );
      spark.rotation.z = Math.random() * Math.PI;
      this.particleGroup.add(spark);
      this.activeSparks.push({
        mesh: spark,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          Math.random() * 2 + 1,
          (Math.random() - 0.5) * 3
        ),
        life: 0,
        maxLife: 0.35,
      });
    }
  }

  private updateStage2ActivePrompt() {
    if (this.stage2Phase === 'knights' && this.activeKnight && !this.activeKnight.isDying) {
      const dist = Math.max(0, this.activeKnight.zPos - this.nasserZ);
      this.state.activePrompt = {
        visible: true,
        npcType: 'enemy',
        npcName: `فارس مدجج بالحديد #${this.knightsDefeated + 1}`,
        phrase: 'انقر نقرتين على ظهر ناصر لضربه بالسيف وصراخ «يا علي!»',
        distance: Math.round(dist * 10) / 10,
      };
    } else if (this.stage2Phase === 'gate2' && !this.gate2Flying) {
      const dist = Math.max(0, this.gate2Z - this.nasserZ);
      this.state.activePrompt = {
        visible: true,
        npcType: 'enemy',
        npcName: 'بوابة الحصن الثانية',
        phrase: 'انقر نقرتين على ظهر ناصر لضرب البوابة بسيفك وصراخ «يا علي!»',
        distance: Math.round(dist * 10) / 10,
      };
    } else if (this.stage2Phase === 'tanks' && this.activeTank && !this.activeTank.isDying) {
      const dist = Math.max(0, this.activeTank.zPos - this.nasserZ);
      this.state.activePrompt = {
        visible: true,
        npcType: 'enemy',
        npcName: `دبابة خشبية مقببة ذات عجلات #${this.tanksDefeated + 1}`,
        phrase: 'الدبابة المقببة تسير نحوك! انقر نقرتين على ظهر ناصر لتحطيمها بسيفك كي لا تدهسك!',
        distance: Math.round(dist * 10) / 10,
      };
    } else if (this.stage2Phase === 'gate3' && !this.gate3Flying) {
      const dist = Math.max(0, this.gate3Z - this.nasserZ);
      this.state.activePrompt = {
        visible: true,
        npcType: 'enemy',
        npcName: 'بوابة الحصن الثالثة',
        phrase: 'اضرب البوابة بسيفك وصراخ «يا علي!» لاقتحام ساحة المنجنيق!',
        distance: Math.round(dist * 10) / 10,
      };
    } else if (this.stage2Phase === 'catapult' && !this.catapultDestroyed) {
      const dist = Math.max(0, this.catapultZ - this.nasserZ);
      if (this.catapultShotsResolved < 5) {
        this.state.activePrompt = {
          visible: true,
          npcType: 'enemy',
          npcName: `منجنيق الحصن (صخرة ${this.catapultShotsFired} من 5)`,
          phrase: '🪨 تفادَ الصخور الحجرية الـ 5 بالسحب يميناً ويساراً كي لا تقضي على حياتك!',
          distance: Math.round(dist * 10) / 10,
        };
      } else {
        this.state.activePrompt = {
          visible: true,
          npcType: 'enemy',
          npcName: 'منجنيق الحصن المنيع',
          phrase:
            dist <= 8.5
              ? '💥 اقتربت من المنجنيق! انقر نقرتين على ظهر ناصر لتحطيمه بسيفك وصراخ «يا علي!»'
              : '⚡ راوغت كافة الصخور الخمس بنجاح! تقدم الآن لتحطيمه بالسيف!',
          distance: Math.round(dist * 10) / 10,
        };
      }
    } else {
      this.state.activePrompt = null;
    }

    this.onStateChange({ ...this.state });
  }

  public setStage(stage: StageNumber) {
    this.stage = stage;
    this.state.stage = stage;
    this.state.hasSword = stage === 2;
    if (this.nasserRig.sword) {
      this.nasserRig.sword.visible = stage === 2;
    }
    this.restart(false);
    if (stage === 2) {
      this.triggerNotification(
        '⚔️ بدأت المرحلة الثانية! بيدك سيف للقتال.. انقر نقرتين على ظهر ناصر للضرب وصراخ «يا علي!»',
        'info'
      );
    } else {
      this.triggerNotification(
        '🌴 بدأت المرحلة الأولى! اعبر طريق النخيل واجتز الموالين والمعادين!',
        'info'
      );
    }
  }

  public getStage(): StageNumber {
    return this.stage;
  }

  // --------------------------------------------------------------------------
  // Game Controls & Lifecycle
  // --------------------------------------------------------------------------

  /**
   * Restarts the game from the absolute beginning (Stage 1)
   * "بعد الفوز النهائي اعط فرصة للبدء اللعبة من بدايتها و ليس من المرحلة التي كان فيها اللاعب"
   */
  public restartFromBeginning() {
    this.stage = 1;
    this.restart(true);
    this.triggerNotification(
      '🌴 بدأت اللعبة من بدايتها! اعبر طريق النخيل واجتز 5 موالين و5 معادين!',
      'info'
    );
  }

  public restart(forceStage1: boolean = false) {
    if (forceStage1 || this.state.isVictory) {
      this.stage = 1;
    }

    this.state.health = 100;
    this.state.score = 0;
    this.state.loyalPassed = 0;
    this.state.enemyPassed = 0;
    this.state.totalEncountersTarget = this.loyalCountTarget + this.enemyCountTarget;
    this.state.distance = 0;
    this.state.isGameOver = false;
    this.state.isVictory = false;
    this.state.isPaused = false;
    this.state.isAtFortressGate = false;
    this.state.gateTorn = false;
    this.state.stage = this.stage;
    this.state.stage2Phase = 'knights';
    this.state.knightsDefeated = 0;
    this.state.tanksDefeated = 0;
    this.state.catapultDestroyed = false;
    this.state.hasSword = this.stage === 2;
    this.state.activePrompt = null;

    if (this.nasserRig.sword) {
      this.nasserRig.sword.visible = this.stage === 2;
    }

    this.state.notification = {
      text:
        this.stage === 2
          ? '⚔️ انطلقت المرحلة الثانية! انقر نقرتين على ظهر ناصر للضرب بالسيف وصراخ «يا علي!»'
          : 'انطلقت جولة جديدة! ركّز في نداءات العابرين الخمسة الموالين والخمسة المعادين',
      type: 'info',
      timestamp: Date.now(),
    };

    this.remainingLoyalToSpawn = this.loyalCountTarget;
    this.remainingEnemyToSpawn = this.enemyCountTarget;
    this.nasserZ = 0;
    this.currentX = 0;
    this.targetLaneX = 0;
    this.isJumping = false;
    this.nasserY = 0;
    this.nextSpawnZ = 30;
    this.currentForwardSpeed = this.nasserBaseSpeed;
    this.sanctuarySpawned = false;
    this.isAtFortressGate = false;
    this.gateTorn = false;
    this.gateFlying = false;
    this.postGateTimer = 0;

    // Stage 2 resets
    this.stage2Phase = 'knights';
    this.knightsDefeated = 0;
    this.tanksDefeated = 0;
    this.catapultDestroyed = false;
    this.gate2Flying = false;
    this.gate3Flying = false;
    this.isAtGate2 = false;
    this.isAtGate3 = false;
    this.catapultFireTimer = 0;
    this.catapultShotsFired = 0;
    this.catapultShotsResolved = 0;

    if (this.activeKnight) {
      this.scene.remove(this.activeKnight.group);
      this.activeKnight = null;
    }
    if (this.activeTank) {
      this.scene.remove(this.activeTank.group);
      this.activeTank = null;
    }
    if (this.fortressGate2) {
      this.scene.remove(this.fortressGate2.group);
      this.fortressGate2 = null;
    }
    if (this.fortressGate3) {
      this.scene.remove(this.fortressGate3.group);
      this.fortressGate3 = null;
    }
    if (this.catapultAssembly) {
      this.scene.remove(this.catapultAssembly.group);
      this.catapultAssembly = null;
    }
    for (const proj of this.activeProjectiles) {
      this.scene.remove(proj.group);
      this.scene.remove(proj.shadowTargetMarker);
    }
    this.activeProjectiles = [];

    if (this.sanctuaryGroup) {
      this.scene.remove(this.sanctuaryGroup);
      this.sanctuaryGroup = null;
    }
    this.fortressAssembly = null;

    // Clear active NPCs
    for (const npc of this.npcs) {
      this.scene.remove(npc.rig.group);
    }
    this.npcs = [];

    // Clear obstacles
    for (const obs of this.obstacles) {
      this.scene.remove(obs.group);
    }
    this.obstacles = [];

    // Reset road, canals, and agricultural fields
    this.roadMesh.position.z = 150;
    this.leftCanal.position.z = 150;
    this.rightCanal.position.z = 150;
    this.leftField.position.z = 150;
    this.rightField.position.z = 150;

    // Reset palms back to initial pool positions
    for (let i = 0; i < this.palmTrees.length; i++) {
      const pairIndex = Math.floor(i / 2);
      this.palmTrees[i].position.z = -30 + pairIndex * 10;
    }

    this.onStateChange({ ...this.state });
  }

  public setPaused(paused: boolean) {
    this.state.isPaused = paused;
    this.onStateChange({ ...this.state });
  }

  public togglePause(): boolean {
    this.setPaused(!this.state.isPaused);
    return this.state.isPaused;
  }

  private handleResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.handleResize);
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.flashOverlayEl && this.flashOverlayEl.parentNode) {
      this.flashOverlayEl.parentNode.removeChild(this.flashOverlayEl);
    }
  }
}
