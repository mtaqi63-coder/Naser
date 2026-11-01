/**
 * Procedural 3D model creators and texture generators for Three.js
 * Adheres strictly to Three.js quality directives (3-12 part composite models,
 * zero 404 dependencies, PBR materials, SRGBColorSpace).
 */
import * as THREE from 'three';

// ----------------------------------------------------------------------------
// Procedural Canvas Textures
// ----------------------------------------------------------------------------

export function createDirtRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm sandy earth base
  ctx.fillStyle = '#b89063';
  ctx.fillRect(0, 0, 512, 512);

  // Dirt grain & pebble noise
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 2 + 1;
    const alpha = Math.random() * 0.25;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(90, 60, 35, ${alpha})` : `rgba(220, 185, 140, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Worn path wheel ruts / cart tracks
  const gradient = ctx.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0, 'rgba(80, 50, 25, 0.4)');
  gradient.addColorStop(0.18, 'rgba(170, 130, 85, 0.1)');
  gradient.addColorStop(0.35, 'rgba(95, 65, 38, 0.3)');
  gradient.addColorStop(0.5, 'rgba(180, 145, 100, 0.05)');
  gradient.addColorStop(0.65, 'rgba(95, 65, 38, 0.3)');
  gradient.addColorStop(0.82, 'rgba(170, 130, 85, 0.1)');
  gradient.addColorStop(1, 'rgba(80, 50, 25, 0.4)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a662e';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = Math.random() * 7 + 4;
    const angle = (Math.random() - 0.5) * 0.6;
    const greenShade = Math.floor(Math.random() * 80 + 70);
    ctx.strokeStyle = `rgba(${Math.floor(greenShade * 0.6)}, ${greenShade + 20}, ${Math.floor(greenShade * 0.3)}, 0.4)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(angle) * len, y - Math.cos(angle) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 24);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPalmBarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5c4028';
  ctx.fillRect(0, 0, 256, 512);

  // Horizontal fibrous rings
  for (let y = 0; y < 512; y += 18) {
    ctx.fillStyle = 'rgba(40, 25, 12, 0.6)';
    ctx.fillRect(0, y, 256, 6);
    ctx.fillStyle = 'rgba(120, 88, 55, 0.5)';
    ctx.fillRect(0, y + 6, 256, 4);

    // Diamond cut marks
    for (let x = 0; x < 256; x += 32) {
      const offset = (y % 36 === 0) ? 16 : 0;
      ctx.fillStyle = 'rgba(30, 18, 8, 0.4)';
      ctx.beginPath();
      ctx.moveTo(x + offset, y + 2);
      ctx.lineTo(x + offset + 8, y + 10);
      ctx.lineTo(x + offset, y + 18);
      ctx.lineTo(x + offset - 8, y + 10);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

let cachedLoyalSpeechTex: THREE.CanvasTexture | null = null;
let cachedEnemySpeechTex: THREE.CanvasTexture | null = null;

export function createSpeechBubbleTexture(phrase: 'يا زهراء' | 'احرقوهم', isLoyal: boolean): THREE.CanvasTexture {
  if (isLoyal && cachedLoyalSpeechTex) return cachedLoyalSpeechTex;
  if (!isLoyal && cachedEnemySpeechTex) return cachedEnemySpeechTex;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 256);

  // Outer glow and rounded rectangle
  const pad = 20;
  const w = 512 - pad * 2;
  const h = 200;
  const r = 36;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, pad, 0, pad + h);
  if (isLoyal) {
    bgGrad.addColorStop(0, 'rgba(10, 48, 25, 0.94)');
    bgGrad.addColorStop(1, 'rgba(6, 28, 15, 0.96)');
  } else {
    bgGrad.addColorStop(0, 'rgba(60, 10, 10, 0.94)');
    bgGrad.addColorStop(1, 'rgba(30, 5, 5, 0.96)');
  }

  // Draw rounded card
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(pad, pad, w, h, r);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Border with glow
  ctx.lineWidth = 6;
  ctx.strokeStyle = isLoyal ? '#4ade80' : '#ef4444';
  ctx.stroke();

  // Subtle inner accent border
  ctx.lineWidth = 2;
  ctx.strokeStyle = isLoyal ? '#fef08a' : '#f97316';
  ctx.beginPath();
  ctx.roundRect(pad + 8, pad + 8, w - 16, h - 16, r - 8);
  ctx.stroke();

  // Downward pointer triangle
  ctx.beginPath();
  ctx.moveTo(256 - 22, pad + h);
  ctx.lineTo(256, pad + h + 28);
  ctx.lineTo(256 + 22, pad + h);
  ctx.fillStyle = isLoyal ? '#061c0f' : '#1e0505';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = isLoyal ? '#4ade80' : '#ef4444';
  ctx.stroke();

  // Text rendering in Arabic
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Subtitle badge
  ctx.font = 'bold 24px Tajawal, sans-serif';
  ctx.fillStyle = isLoyal ? '#86efac' : '#fca5a5';
  ctx.fillText(isLoyal ? '✨ نداء الولاء ✨' : '🔥 صرخة العداء 🔥', 256, pad + 45);

  // Main Callout text
  ctx.font = '900 68px Tajawal, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = isLoyal ? '#22c55e' : '#dc2626';
  ctx.shadowBlur = 18;
  ctx.fillText(phrase, 256, pad + 118);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  if (isLoyal) {
    cachedLoyalSpeechTex = texture;
  } else {
    cachedEnemySpeechTex = texture;
  }

  return texture;
}

// ----------------------------------------------------------------------------
// Procedural 3D Character Models
// ----------------------------------------------------------------------------

export interface CharacterRig {
  group: THREE.Group;
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  sash?: THREE.Mesh;
  halo?: THREE.Mesh;
  light?: THREE.PointLight;
  speechBillboard?: THREE.Mesh;
  shadowDisc: THREE.Mesh;
  sword?: THREE.Group;
}

/**
 * Creates Nasser hero character with traditional attire and fully articulable limbs
 */
export function createNasserModel(): CharacterRig {
  const group = new THREE.Group();
  group.name = 'Nasser';

  // Soft contact shadow underneath
  const shadowGeo = new THREE.CircleGeometry(0.55, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x0a1005,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  group.add(shadowDisc);

  // Root container pivoted at bottom center
  const root = new THREE.Group();
  root.position.y = 0;
  group.add(root);

  // Shared PBR Materials for Nasser
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd9a579,
    roughness: 0.65,
    metalness: 0.05,
  });
  const robeMat = new THREE.MeshStandardMaterial({
    color: 0x243b28, // Deep heritage emerald green
    roughness: 0.75,
    metalness: 0.1,
  });
  const vestMat = new THREE.MeshStandardMaterial({
    color: 0x8a5b28, // Warm leather/gold trimmed vest
    roughness: 0.5,
    metalness: 0.25,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Golden trim
    roughness: 0.35,
    metalness: 0.8,
  });
  const shemaghMat = new THREE.MeshStandardMaterial({
    color: 0xf3f4f6, // White keffiyeh
    roughness: 0.85,
    metalness: 0.0,
  });
  const agalMat = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Black agal headband
    roughness: 0.4,
    metalness: 0.3,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x3d2814,
    roughness: 0.6,
    metalness: 0.2,
  });

  // Hips / Pelvis
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  root.add(hips);

  // Torso
  const torso = new THREE.Group();
  hips.add(torso);

  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.34), robeMat);
  torsoMesh.position.y = 0.31;
  torsoMesh.castShadow = true;
  torso.add(torsoMesh);

  // Vest overlay
  const vestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.38), vestMat);
  vestMesh.position.y = 0.32;
  vestMesh.castShadow = true;
  torso.add(vestMesh);

  // Vest gold trim border
  const vestTrim = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.08, 0.39), trimMat);
  vestTrim.position.y = 0.54;
  torso.add(vestTrim);

  // Head container
  const head = new THREE.Group();
  head.position.y = 0.68;
  torso.add(head);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 12), skinMat);
  neck.position.y = 0.04;
  head.add(neck);

  // Face head base
  const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.3), skinMat);
  faceMesh.position.y = 0.2;
  faceMesh.castShadow = true;
  head.add(faceMesh);

  // Eyes & brows
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1f2937 });
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.04), eyeMat);
  leftEye.position.set(-0.07, 0.22, 0.155);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.07;
  head.add(leftEye, rightEye);

  // Traditional Keffiyeh / Shemagh
  const shemaghTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.36), shemaghMat);
  shemaghTop.position.y = 0.36;
  head.add(shemaghTop);

  // Flowing back & side cloth of shemagh
  const shemaghBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.14), shemaghMat);
  shemaghBack.position.set(0, 0.16, -0.14);
  head.add(shemaghBack);

  // Black Agal headband (ring)
  const agalRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 24), agalMat);
  agalRing.rotation.x = Math.PI / 2;
  agalRing.position.y = 0.35;
  head.add(agalRing);

  // Shoulders and Arms
  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 0.56, 0);
  torso.add(leftArm);

  const leftShoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), robeMat);
  leftArm.add(leftShoulderMesh);

  const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 10), robeMat);
  leftForearmMesh.position.y = -0.21;
  leftForearmMesh.castShadow = true;
  leftArm.add(leftForearmMesh);

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), skinMat);
  leftHand.position.y = -0.44;
  leftArm.add(leftHand);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 0.56, 0);
  torso.add(rightArm);

  const rightShoulderMesh = leftShoulderMesh.clone();
  rightArm.add(rightShoulderMesh);

  const rightForearmMesh = leftForearmMesh.clone();
  rightArm.add(rightForearmMesh);

  // Right Hand
  const rightHand = leftHand.clone();
  rightHand.name = 'NasserRightHand';
  rightArm.add(rightHand);

  // Combat sword firmly gripped in Nasser's right hand ("ضع السيف في يده اليمنى")
  const sword = createSword();
  sword.name = 'NasserRightHandSword';
  // Positioned directly inside the right hand:
  // In rightHand local coordinates (origin is hand center),
  // offset y=-0.11 centers the sword grip cylinder (y=0.11) right into the right hand palm!
  sword.position.set(0.01, -0.11, 0.03);
  sword.rotation.x = Math.PI / 2.15; // Blade pointing forward, ready for heroic combat
  sword.rotation.y = 0.12;
  sword.rotation.z = -0.14; // Angled slightly outward
  rightHand.add(sword);

  // Legs & Boots
  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0, 0);
  hips.add(leftLeg);

  const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.5, 10), robeMat);
  leftThigh.position.y = -0.25;
  leftThigh.castShadow = true;
  leftLeg.add(leftThigh);

  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.22), bootMat);
  leftBoot.position.set(0, -0.68, 0.04);
  leftBoot.castShadow = true;
  leftLeg.add(leftBoot);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0, 0);
  hips.add(rightLeg);

  const rightThigh = leftThigh.clone();
  rightLeg.add(rightThigh);

  const rightBoot = leftBoot.clone();
  rightLeg.add(rightBoot);

  return {
    group,
    root,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    shadowDisc,
    sword,
  };
}

/**
 * Creates Loyal Ally (شخص موالي) with radiant glowing face, warm robes and overhead "يا زهراء ✨"
 */
export function createLoyalModel(): CharacterRig {
  const group = new THREE.Group();
  group.name = 'LoyalAlly';

  const shadowGeo = new THREE.CircleGeometry(0.5, 20);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x051a08,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  group.add(shadowDisc);

  const root = new THREE.Group();
  group.add(root);

  // Glowing radiant face material (وجهه منير)
  const radiantFaceMat = new THREE.MeshStandardMaterial({
    color: 0xfffaed,
    emissive: 0xffe899,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.1,
  });

  const pureWhiteRobeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.65,
    metalness: 0.05,
  });

  const emeraldSashMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Noble emerald green
    roughness: 0.45,
    metalness: 0.2,
  });

  const goldHaloMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.85,
  });

  // Hips
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  root.add(hips);

  const torso = new THREE.Group();
  hips.add(torso);

  // Long flowing robe body
  const robeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.36, 0.88, 14), pureWhiteRobeMat);
  robeMesh.position.y = 0.36;
  robeMesh.castShadow = true;
  torso.add(robeMesh);

  // Emerald green ceremonial sash
  const sashMesh = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 20), emeraldSashMat);
  sashMesh.rotation.x = 0.4;
  sashMesh.rotation.z = -0.3;
  sashMesh.position.y = 0.42;
  torso.add(sashMesh);

  // Head
  const head = new THREE.Group();
  head.position.y = 0.82;
  torso.add(head);

  // Radiant Glowing Head (Luminous face)
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), radiantFaceMat);
  face.position.y = 0.18;
  head.add(face);

  // White hood / headscarf draped around face
  const cowlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.3, 14), cowlMat);
  cowl.position.set(0, 0.16, -0.04);
  head.add(cowl);

  // Radiant Light Source emitted from face
  const radiantLight = new THREE.PointLight(0xffe277, 2.5, 7);
  radiantLight.position.set(0, 0.25, 0.2);
  head.add(radiantLight);

  // Celestial Halo above head
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 10, 32), goldHaloMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.48;
  head.add(halo);

  // Arms (Open in welcoming greeting)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.32, 0.62, 0);
  leftArm.rotation.z = 0.35;
  leftArm.rotation.x = -0.25;
  torso.add(leftArm);
  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.46, 10), pureWhiteRobeMat);
  leftArmMesh.position.y = -0.23;
  leftArm.add(leftArmMesh);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 0.62, 0);
  rightArm.rotation.z = -0.35;
  rightArm.rotation.x = -0.25;
  torso.add(rightArm);
  const rightArmMesh = leftArmMesh.clone();
  rightArm.add(rightArmMesh);

  // Legs under robe
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.14, 0, 0);
  hips.add(leftLeg);
  const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), pureWhiteRobeMat);
  legMesh.position.y = -0.45;
  leftLeg.add(legMesh);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.14, 0, 0);
  hips.add(rightLeg);
  rightLeg.add(legMesh.clone());

  // 3D Billboard Speech Callout: "يا زهراء ✨"
  const speechTex = createSpeechBubbleTexture('يا زهراء', true);
  const speechMat = new THREE.MeshBasicMaterial({
    map: speechTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const speechBillboard = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), speechMat);
  speechBillboard.position.set(0, 2.3, 0);
  group.add(speechBillboard);

  return {
    group,
    root,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    halo,
    light: radiantLight,
    speechBillboard,
    shadowDisc,
  };
}

/**
 * Creates Hostile Enemy (شخص معادي) with dark shadowy face, fiery eyes, and overhead "احرقوهم 🔥"
 */
export function createEnemyModel(): CharacterRig {
  const group = new THREE.Group();
  group.name = 'HostileEnemy';

  const shadowGeo = new THREE.CircleGeometry(0.55, 20);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x1f0505,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  group.add(shadowDisc);

  const root = new THREE.Group();
  group.add(root);

  // Dark shadowy sinister face & jagged cloak materials (وجهه مظلم)
  const darkFaceMat = new THREE.MeshStandardMaterial({
    color: 0x140a0a,
    roughness: 0.9,
    metalness: 0.1,
  });

  const fieryEyesMat = new THREE.MeshBasicMaterial({
    color: 0xff2200, // Sinister fiery glowing eyes
  });

  const darkCloakMat = new THREE.MeshStandardMaterial({
    color: 0x241212, // Dark jagged crimson & charcoal
    roughness: 0.8,
    metalness: 0.2,
  });

  const armorTrimMat = new THREE.MeshStandardMaterial({
    color: 0x4a1818,
    roughness: 0.4,
    metalness: 0.6,
  });

  // Hips
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  root.add(hips);

  const torso = new THREE.Group();
  hips.add(torso);

  // Heavy jagged torso
  const cloakMesh = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.38), darkCloakMat);
  cloakMesh.position.y = 0.36;
  cloakMesh.castShadow = true;
  torso.add(cloakMesh);

  // Spiked dark shoulder plates
  const leftSpike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), armorTrimMat);
  leftSpike.position.set(-0.35, 0.75, 0);
  leftSpike.rotation.z = 0.4;
  const rightSpike = leftSpike.clone();
  rightSpike.position.x = 0.35;
  rightSpike.rotation.z = -0.4;
  torso.add(leftSpike, rightSpike);

  // Head with dark hood
  const head = new THREE.Group();
  head.position.y = 0.76;
  torso.add(head);

  // Deep shadowy hood
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), darkCloakMat);
  hood.position.set(0, 0.16, -0.05);
  head.add(hood);

  // Dark shadowy face inside hood
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.18), darkFaceMat);
  face.position.set(0, 0.14, 0.05);
  head.add(face);

  // Glowing evil red eyes
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), fieryEyesMat);
  leftEye.position.set(-0.065, 0.17, 0.15);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.065;
  head.add(leftEye, rightEye);

  // Dark menacing red light
  const enemyLight = new THREE.PointLight(0xff1a00, 1.8, 6);
  enemyLight.position.set(0, 0.2, 0.3);
  head.add(enemyLight);

  // Aggressive menacing arms (holding fists or reaching out angrily)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.38, 0.62, 0);
  leftArm.rotation.x = -0.6;
  leftArm.rotation.z = 0.2;
  torso.add(leftArm);
  const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.46, 8), darkCloakMat);
  armMesh.position.y = -0.23;
  leftArm.add(armMesh);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.38, 0.62, 0);
  rightArm.rotation.x = -0.6;
  rightArm.rotation.z = -0.2;
  torso.add(rightArm);
  rightArm.add(armMesh.clone());

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0, 0);
  hips.add(leftLeg);
  const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.22), darkCloakMat);
  legMesh.position.y = -0.45;
  leftLeg.add(legMesh);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0, 0);
  hips.add(rightLeg);
  rightLeg.add(legMesh.clone());

  // 3D Billboard Speech Callout: "احرقوهم 🔥"
  const speechTex = createSpeechBubbleTexture('احرقوهم', false);
  const speechMat = new THREE.MeshBasicMaterial({
    map: speechTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const speechBillboard = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), speechMat);
  speechBillboard.position.set(0, 2.3, 0);
  group.add(speechBillboard);

  return {
    group,
    root,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    light: enemyLight,
    speechBillboard,
    shadowDisc,
  };
}

// ----------------------------------------------------------------------------
// Procedural Palm Tree (3-12 parts: Curved trunk, fronds, dates clusters)
// ----------------------------------------------------------------------------

export function createPalmTree(barkTexture: THREE.CanvasTexture): THREE.Group {
  const palm = new THREE.Group();
  palm.name = 'PalmTree';

  const trunkMat = new THREE.MeshStandardMaterial({
    map: barkTexture,
    color: 0x8a633f,
    roughness: 0.85,
    metalness: 0.05,
  });

  const frondMat = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const datesMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Amber golden dates
    roughness: 0.4,
    metalness: 0.15,
  });

  // Curved segmented trunk (6 height segments bending naturally)
  const trunkGroup = new THREE.Group();
  palm.add(trunkGroup);

  const curveBend = (Math.random() - 0.5) * 0.4;
  const numSegments = 7;
  const segHeight = 0.9;
  let currY = 0;
  let currX = 0;

  for (let i = 0; i < numSegments; i++) {
    const bottomRadius = 0.32 - i * 0.022;
    const topRadius = 0.30 - i * 0.022;
    const segGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, segHeight, 10);
    const segMesh = new THREE.Mesh(segGeo, trunkMat);
    segMesh.castShadow = true;
    segMesh.position.set(currX, currY + segHeight / 2, 0);
    segMesh.rotation.z = curveBend * 0.08 * i;
    trunkGroup.add(segMesh);

    currY += segHeight * 0.96;
    currX += Math.sin(curveBend * 0.08 * i) * segHeight;
  }

  // Crown of 14 Palm Fronds radiating outwards
  const crownGroup = new THREE.Group();
  crownGroup.position.set(currX, currY, 0);
  palm.add(crownGroup);

  const frondsList: THREE.Group[] = [];
  const numFronds = 14;
  for (let i = 0; i < numFronds; i++) {
    const angle = (i / numFronds) * Math.PI * 2;
    const frond = new THREE.Group();
    frond.rotation.y = angle;

    // Curved arched frond spine
    const spineGeo = new THREE.BoxGeometry(0.08, 0.06, 2.6);
    const spine = new THREE.Mesh(spineGeo, frondMat);
    spine.position.set(0, 0, 1.3);
    spine.rotation.x = -0.42 - (i % 3) * 0.08;
    frond.add(spine);

    // Leaves fan along spine
    for (let l = 0; l < 4; l++) {
      const leafGeo = new THREE.PlaneGeometry(0.7 - l * 0.1, 0.45);
      const leaf = new THREE.Mesh(leafGeo, frondMat);
      leaf.position.set(0, 0, 0.8 + l * 0.45);
      leaf.rotation.x = spine.rotation.x;
      leaf.rotation.z = Math.PI / 2;
      leaf.castShadow = true;
      frond.add(leaf);
    }

    crownGroup.add(frond);
    frondsList.push(frond);
  }

  // Dates fruit clusters hanging under crown
  for (let d = 0; d < 3; d++) {
    const dateCluster = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), datesMat);
    const angle = (d / 3) * Math.PI * 2 + 0.3;
    dateCluster.position.set(Math.cos(angle) * 0.35, -0.3, Math.sin(angle) * 0.35);
    dateCluster.castShadow = true;
    crownGroup.add(dateCluster);
  }

  // Base grass tuft
  const grassTuft = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.3, 6), frondMat);
  grassTuft.position.set(0, 0.15, 0);
  palm.add(grassTuft);

  // Rigging for wind & dynamic weather swaying
  palm.userData = {
    trunkGroup,
    crownGroup,
    fronds: frondsList,
    phaseOffset: Math.random() * Math.PI * 2,
    baseRotZ: 0,
    baseCrownX: currX,
    baseCrownY: currY,
  };

  return palm;
}

// ----------------------------------------------------------------------------
// Procedural Agricultural Obstacles
// ----------------------------------------------------------------------------

export type ObstacleType = 'pit' | 'log' | 'rock' | 'hay' | 'fence';

/**
 * Deep Road Pit Obstacle ("الغي الحواجز و ضع مكانها حفر بحيث تنتهي حياة ناصر اذا وقع فيها")
 * Deep, dangerous road crater carved into the road with jagged rim, dark depth void,
 * and broken wooden warning stakes.
 */
export function createPitObstacle(variant: number = 0): THREE.Group {
  const group = new THREE.Group();
  group.name = `RoadPitObstacle_${variant}`;

  // Dark earthen and rock materials
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x452817, // Dark churned dirt & fractured stone rim
    roughness: 0.95,
    metalness: 0.08,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1c120c, // Deep dark pit wall rock
    roughness: 0.9,
    metalness: 0.12,
  });

  const blackVoidMat = new THREE.MeshBasicMaterial({
    color: 0x030202, // Abyss bottom void
  });

  const stakeMat = new THREE.MeshStandardMaterial({
    color: 0x3d2212, // Jagged wooden warning stakes
    roughness: 0.85,
  });

  const dangerRedMat = new THREE.MeshBasicMaterial({
    color: 0xdc2626, // Red danger marking on stake tips
  });

  // 1. Pit Hollow Void (recessed cylinder below road level)
  const pitHoleGeo = new THREE.CylinderGeometry(1.05, 0.85, 1.8, 16, 1, true);
  const pitWall = new THREE.Mesh(pitHoleGeo, wallMat);
  pitWall.position.y = -0.88;
  group.add(pitWall);

  // Bottom Black Abyss Disc
  const bottomDiscGeo = new THREE.CircleGeometry(0.85, 16);
  const bottomDisc = new THREE.Mesh(bottomDiscGeo, blackVoidMat);
  bottomDisc.rotation.x = -Math.PI / 2;
  bottomDisc.position.y = -1.78;
  group.add(bottomDisc);

  // 2. Cracked Earthen / Stone Lip Rim around the pit opening
  const lipTorusGeo = new THREE.TorusGeometry(1.08, 0.14, 8, 18);
  const lipMesh = new THREE.Mesh(lipTorusGeo, rimMat);
  lipMesh.rotation.x = Math.PI / 2;
  lipMesh.position.y = 0.03;
  lipMesh.castShadow = true;
  group.add(lipMesh);

  // Fractured stone chunks around pit edge
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + (variant * 0.4);
    const r = 1.15 + (i % 2 === 0 ? 0.1 : -0.05);
    const rockChunk = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.16 + (i % 3) * 0.05, 0),
      rimMat
    );
    rockChunk.position.set(Math.cos(angle) * r, 0.08, Math.sin(angle) * r);
    rockChunk.rotation.set(angle, angle * 1.5, 0);
    rockChunk.castShadow = true;
    group.add(rockChunk);
  }

  // 3. Broken Wooden Hazard Warning Stakes leaning over pit corners
  const stakeOffsets = [
    [-0.95, -0.9],
    [0.95, -0.9],
    [-0.95, 0.9],
    [0.95, 0.9],
  ];

  stakeOffsets.forEach(([sx, sz], idx) => {
    const stake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.065, 0.75, 6),
      stakeMat
    );
    stake.position.set(sx, 0.32, sz);
    stake.rotation.z = (sx > 0 ? 0.25 : -0.25) + (idx % 2 === 0 ? 0.1 : -0.1);
    stake.rotation.x = sz > 0 ? 0.2 : -0.2;
    stake.castShadow = true;
    group.add(stake);

    // Red cloth / paint marker on stake tip
    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.06),
      dangerRedMat
    );
    flag.position.set(sx, 0.64, sz);
    group.add(flag);
  });

  return group;
}

// All obstacle variants now generate dangerous deep pits
export function createFallenLog(): THREE.Group {
  return createPitObstacle(0);
}

export function createRockObstacle(): THREE.Group {
  return createPitObstacle(1);
}

export function createHayBalesObstacle(): THREE.Group {
  return createPitObstacle(2);
}

export function createFenceObstacle(): THREE.Group {
  return createPitObstacle(3);
}

// ----------------------------------------------------------------------------
// Historical Fortress Gate (بوابة الحصن العظيمة)
// ----------------------------------------------------------------------------

export interface FortressGateAssembly {
  group: THREE.Group;
  doorsGroup: THREE.Group;
  leftDoor: THREE.Mesh;
  rightDoor: THREE.Mesh;
  crossbar: THREE.Mesh;
  innerGlowLight: THREE.PointLight;
  torches: THREE.PointLight[];
}

export function createFortressGate(): FortressGateAssembly {
  const group = new THREE.Group();
  group.name = 'FortressGate';

  // Materials
  const fortressStoneMat = new THREE.MeshStandardMaterial({
    color: 0x857563, // Ancient weathered fortress sandstone
    roughness: 0.85,
    metalness: 0.12,
  });

  const darkTimberMat = new THREE.MeshStandardMaterial({
    color: 0x3d2714, // Solid ancient oak
    roughness: 0.75,
    metalness: 0.05,
  });

  const wroughtIronMat = new THREE.MeshStandardMaterial({
    color: 0x222222, // Heavy wrought iron bands and studs
    roughness: 0.45,
    metalness: 0.85,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.35,
    metalness: 0.75,
  });

  const fireMat = new THREE.MeshBasicMaterial({
    color: 0xff7700,
  });

  // 1. Bastion Towers (Left & Right)
  const towerGeo = new THREE.BoxGeometry(2.6, 7.8, 2.6);
  const leftTower = new THREE.Mesh(towerGeo, fortressStoneMat);
  leftTower.position.set(-3.5, 3.9, 0);
  leftTower.castShadow = true;
  leftTower.receiveShadow = true;

  const rightTower = leftTower.clone();
  rightTower.position.x = 3.5;
  group.add(leftTower, rightTower);

  // Tower crenellations / battlements (شرفات الحصن)
  const addCrenellations = (xCenter: number) => {
    const crenGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const offsets = [
      [-0.9, -0.9],
      [0.9, -0.9],
      [-0.9, 0.9],
      [0.9, 0.9],
    ];
    offsets.forEach(([ox, oz]) => {
      const cren = new THREE.Mesh(crenGeo, fortressStoneMat);
      cren.position.set(xCenter + ox, 8.05, oz);
      cren.castShadow = true;
      group.add(cren);
    });
  };
  addCrenellations(-3.5);
  addCrenellations(3.5);

  // Flanking fortress curtain walls extending out to fields
  const curtainWallGeo = new THREE.BoxGeometry(7.5, 5.5, 1.6);
  const leftWall = new THREE.Mesh(curtainWallGeo, fortressStoneMat);
  leftWall.position.set(-8.2, 2.75, 0);
  leftWall.castShadow = true;

  const rightWall = leftWall.clone();
  rightWall.position.x = 8.2;
  group.add(leftWall, rightWall);

  // Top battlements on curtain walls
  for (let wx = -11.5; wx <= -5.5; wx += 1.4) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 1.4), fortressStoneMat);
    c.position.set(wx, 5.8, 0);
    group.add(c);
  }
  for (let wx = 5.5; wx <= 11.5; wx += 1.4) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 1.4), fortressStoneMat);
    c.position.set(wx, 5.8, 0);
    group.add(c);
  }

  // Central Stone Arch & Lintel Framing
  const archLintel = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.4, 1.8), fortressStoneMat);
  archLintel.position.set(0, 5.5, 0);
  archLintel.castShadow = true;
  group.add(archLintel);

  // Inscribed Calligraphy Keystone / Banner above gate
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 512;
  bannerCanvas.height = 128;
  const bctx = bannerCanvas.getContext('2d')!;
  bctx.fillStyle = '#1c1917';
  bctx.fillRect(0, 0, 512, 128);
  bctx.strokeStyle = '#d97706';
  bctx.lineWidth = 6;
  bctx.strokeRect(6, 6, 500, 116);
  bctx.direction = 'rtl';
  bctx.textAlign = 'center';
  bctx.textBaseline = 'middle';
  bctx.fillStyle = '#fbbf24';
  bctx.font = '900 34px Tajawal, sans-serif';
  bctx.fillText('🏰 بَوَّابَةُ الحِصْنِ العَظِيمِ 🏰', 256, 44);
  bctx.fillStyle = '#e2e8f0';
  bctx.font = '700 20px Tajawal, sans-serif';
  bctx.fillText('« لَا تَنفَتِحُ إِلَّا بِنِدَاءِ: يَا عَلِيّ »', 256, 92);

  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  bannerTex.colorSpace = THREE.SRGBColorSpace;
  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.95),
    new THREE.MeshBasicMaterial({ map: bannerTex })
  );
  bannerMesh.position.set(0, 5.5, 0.92);
  group.add(bannerMesh);

  // Flaming Braziers on the bastions
  const torches: THREE.PointLight[] = [];
  const addBrazier = (x: number, y: number, z: number) => {
    // Brazier bowl
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.18, 0.35, 8), wroughtIronMat);
    bowl.position.set(x, y, z);
    group.add(bowl);

    // Flame mesh
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 6), fireMat);
    flame.position.set(x, y + 0.3, z);
    group.add(flame);

    // Warm flickering point light
    const fireLight = new THREE.PointLight(0xff9900, 2.5, 12);
    fireLight.position.set(x, y + 0.45, z);
    group.add(fireLight);
    torches.push(fireLight);
  };
  addBrazier(-3.5, 8.1, 0.6);
  addBrazier(3.5, 8.1, 0.6);
  addBrazier(-1.8, 4.2, 0.95);
  addBrazier(1.8, 4.2, 0.95);

  // --------------------------------------------------------------------------
  // The Detachable Fortress Gate Assembly ("فتنقلع البوابة و تلقى بعيدا")
  // --------------------------------------------------------------------------
  const doorsGroup = new THREE.Group();
  doorsGroup.name = 'FortressBreakawayDoors';
  doorsGroup.position.set(0, 0, 0);

  // Left Door Leaf
  const doorGeo = new THREE.BoxGeometry(2.06, 4.7, 0.22);
  const leftDoor = new THREE.Mesh(doorGeo, darkTimberMat);
  leftDoor.position.set(-1.03, 2.35, 0);
  leftDoor.castShadow = true;
  doorsGroup.add(leftDoor);

  // Right Door Leaf
  const rightDoor = new THREE.Mesh(doorGeo, darkTimberMat);
  rightDoor.position.set(1.03, 2.35, 0);
  rightDoor.castShadow = true;
  doorsGroup.add(rightDoor);

  // Iron horizontal reinforcing straps & studs across both leaves
  [-1.2, 0, 1.2].forEach((yOffset) => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.14, 0.26), wroughtIronMat);
    strap.position.set(0, 2.35 + yOffset, 0);
    doorsGroup.add(strap);

    // Iron studs
    for (let sx = -1.8; sx <= 1.8; sx += 0.4) {
      if (Math.abs(sx) < 0.15) continue; // gap in middle
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), wroughtIronMat);
      stud.position.set(sx, 2.35 + yOffset, 0.13);
      doorsGroup.add(stud);
    }
  });

  // Massive Iron Crossbar (المزلاج والترباس الضخم المانع للفتح)
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 0.24), wroughtIronMat);
  crossbar.position.set(0, 2.35, 0.16);
  doorsGroup.add(crossbar);

  // Heavy Iron Ring Knockers
  const knockerGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16);
  const leftKnocker = new THREE.Mesh(knockerGeo, wroughtIronMat);
  leftKnocker.position.set(-0.55, 2.45, 0.15);
  const rightKnocker = leftKnocker.clone();
  rightKnocker.position.x = 0.55;
  doorsGroup.add(leftKnocker, rightKnocker);

  // Add doorsGroup to the main fortress group
  group.add(doorsGroup);

  // --------------------------------------------------------------------------
  // Interior Portal & Inner Courtyard (Visible once gate is torn off)
  // --------------------------------------------------------------------------
  // Radiant divine golden light pouring through from inside the opened gateway
  const innerGlowLight = new THREE.PointLight(0xfef08a, 4.5, 25);
  innerGlowLight.position.set(0, 3.0, -2.5);
  group.add(innerGlowLight);

  // Welcoming Royal Crimson Carpet leading through into the courtyard
  const carpetMat = new THREE.MeshStandardMaterial({
    color: 0x881337,
    roughness: 0.8,
  });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 18.0), carpetMat);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.03, 3.0);
  group.add(carpet);

  // Green heraldic banners inside the courtyard
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Islamic green
    roughness: 0.6,
  });
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.06, 6.0, 8);
  const flagGeo = new THREE.PlaneGeometry(1.6, 1.0);

  [-2.2, 2.2].forEach((fx) => {
    const pole = new THREE.Mesh(poleGeo, goldMat);
    pole.position.set(fx, 3.0, -4.0);
    group.add(pole);

    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(fx + 0.8, 5.2, -4.0);
    flag.rotation.y = 0.2;
    group.add(flag);
  });

  return {
    group,
    doorsGroup,
    leftDoor,
    rightDoor,
    crossbar,
    innerGlowLight,
    torches,
  };
}

// Backward compatibility alias
export function createSanctuaryArchway(): THREE.Group {
  return createFortressGate().group;
}

// ----------------------------------------------------------------------------
// Stage 2 Procedural Combat Models
// ----------------------------------------------------------------------------

/**
 * Combat Sword for Nasser ("بيده سيف للقتال")
 * Heritage curved steel scimitar with golden crossguard and hilt
 */
export function createSword(): THREE.Group {
  const sword = new THREE.Group();
  sword.name = 'HeroCombatSword';

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.15,
    metalness: 0.95,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.32,
    metalness: 0.85,
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x3d2410,
    roughness: 0.75,
    metalness: 0.1,
  });

  const glowAuraMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  });

  // Hilt handle / grip
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.22, 10), gripMat);
  grip.position.y = 0.11;
  sword.add(grip);

  // Golden Pommel
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), goldMat);
  pommel.position.y = 0;
  sword.add(pommel);

  // Ornate Crossguard
  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.06), goldMat);
  crossguard.position.y = 0.23;
  sword.add(crossguard);

  const quillonL = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), goldMat);
  quillonL.position.set(-0.12, 0.23, 0);
  const quillonR = quillonL.clone();
  quillonR.position.x = 0.12;
  sword.add(quillonL, quillonR);

  // Curved Scimitar Blade
  const bladeGroup = new THREE.Group();
  bladeGroup.position.y = 0.25;
  sword.add(bladeGroup);

  const numBladeSegs = 7;
  let bY = 0;
  let bX = 0;
  for (let i = 0; i < numBladeSegs; i++) {
    const width = 0.08 - i * 0.007;
    const thickness = 0.016 - i * 0.0018;
    const height = 0.15;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), steelMat);
    seg.position.set(bX, bY + height / 2, 0);
    seg.rotation.z = i * 0.055;
    seg.castShadow = true;
    bladeGroup.add(seg);

    bY += height * 0.94;
    bX += Math.sin(i * 0.055) * height;
  }

  // Pointed blade tip
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 4), steelMat);
  tip.position.set(bX, bY + 0.06, 0);
  tip.rotation.z = numBladeSegs * 0.055;
  tip.castShadow = true;
  bladeGroup.add(tip);

  // Radiant blue energy aura along cutting edge
  const edgeAura = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.05), glowAuraMat);
  edgeAura.position.set(bX * 0.5 + 0.03, 0.76, 0);
  edgeAura.rotation.z = 0.14;
  sword.add(edgeAura);

  return sword;
}

// ----------------------------------------------------------------------------
// Combat Billboard Canvas Texture Generator
// ----------------------------------------------------------------------------

export function createCombatBadgeTexture(
  title: string,
  subtitle: string,
  accentColor: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 160);

  // Background rounded box
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(16, 16, 480, 128, 24);
  ctx.fillStyle = 'rgba(15, 10, 10, 0.92)';
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = accentColor;
  ctx.stroke();

  // Arabic text
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.font = '900 42px Tajawal, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 12;
  ctx.fillText(title, 256, 58);

  // Subtitle
  ctx.font = '700 24px Tajawal, sans-serif';
  ctx.fillStyle = '#fde047';
  ctx.shadowBlur = 4;
  ctx.fillText(subtitle, 256, 108);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ----------------------------------------------------------------------------
// Iron Armored Knight Model ("فارس مدجج بالدرع الحديد على كامل جسده")
// ----------------------------------------------------------------------------

export interface IronKnightRig {
  group: THREE.Group;
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  shield: THREE.Mesh;
  weapon: THREE.Group;
  shadowDisc: THREE.Mesh;
  billboard: THREE.Mesh;
  eyeLight: THREE.PointLight;
}

export function createIronKnightModel(knightNumber: number = 1): IronKnightRig {
  const group = new THREE.Group();
  group.name = `IronArmoredKnight_${knightNumber}`;

  // Ground shadow
  const shadowGeo = new THREE.CircleGeometry(0.7, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x050505,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  group.add(shadowDisc);

  const root = new THREE.Group();
  group.add(root);

  // High quality PBR Iron plate armor materials
  const ironPlateMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Polished iron plate
    roughness: 0.28,
    metalness: 0.94,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Dark chainmail & joints
    roughness: 0.55,
    metalness: 0.85,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Brass/gold rivets
    roughness: 0.35,
    metalness: 0.8,
  });

  const visorGlowMat = new THREE.MeshBasicMaterial({
    color: 0xef4444, // Red glow inside visor
  });

  // Pelvis / Hips
  const hips = new THREE.Group();
  hips.position.y = 1.05;
  root.add(hips);

  const fauldsMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.44, 0.38, 12), ironPlateMat);
  fauldsMesh.position.y = 0;
  fauldsMesh.castShadow = true;
  hips.add(fauldsMesh);

  // Torso / Cuirass (Breastplate)
  const torso = new THREE.Group();
  hips.add(torso);

  const breastplate = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.72, 0.44), ironPlateMat);
  breastplate.position.y = 0.42;
  breastplate.castShadow = true;
  torso.add(breastplate);

  // Chest ridge / crest
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 4), goldTrimMat);
  crest.position.set(0, 0.42, 0.24);
  crest.rotation.x = 0.2;
  torso.add(crest);

  // Heavy Spiked Pauldrons (Shoulder guards)
  const pauldronGeo = new THREE.BoxGeometry(0.28, 0.24, 0.32);
  const leftPauldron = new THREE.Mesh(pauldronGeo, ironPlateMat);
  leftPauldron.position.set(-0.46, 0.72, 0);
  leftPauldron.rotation.z = 0.3;
  leftPauldron.castShadow = true;

  const leftSpike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), goldTrimMat);
  leftSpike.position.set(0, 0.16, 0);
  leftPauldron.add(leftSpike);
  torso.add(leftPauldron);

  const rightPauldron = leftPauldron.clone();
  rightPauldron.position.x = 0.46;
  rightPauldron.rotation.z = -0.3;
  torso.add(rightPauldron);

  // Head: Full Iron Greathelm
  const head = new THREE.Group();
  head.position.y = 0.84;
  torso.add(head);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.14, 10), darkSteelMat);
  neck.position.y = 0.05;
  head.add(neck);

  const helmBase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.38), ironPlateMat);
  helmBase.position.y = 0.26;
  helmBase.castShadow = true;
  head.add(helmBase);

  // Conical top dome of helm
  const helmDome = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.22, 10), ironPlateMat);
  helmDome.position.y = 0.52;
  head.add(helmDome);

  // Dark Visor Slit
  const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.04), visorGlowMat);
  visorSlit.position.set(0, 0.26, 0.2);
  head.add(visorSlit);

  // Menacing red eye light
  const eyeLight = new THREE.PointLight(0xff2200, 2.0, 5);
  eyeLight.position.set(0, 0.26, 0.28);
  head.add(eyeLight);

  // Left Arm (Holding heavy iron shield)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.44, 0.65, 0);
  torso.add(leftArm);

  const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.48, 8), ironPlateMat);
  leftArmMesh.position.y = -0.24;
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);

  // Kite Shield
  const shieldGeo = new THREE.BoxGeometry(0.48, 0.85, 0.08);
  const shield = new THREE.Mesh(shieldGeo, ironPlateMat);
  shield.position.set(-0.15, -0.28, 0.22);
  shield.rotation.y = 0.4;
  shield.castShadow = true;

  // Golden Shield Boss
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), goldTrimMat);
  boss.position.set(0, 0, 0.05);
  shield.add(boss);
  leftArm.add(shield);

  // Right Arm (Holding iron spiked mace / broadsword)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.44, 0.65, 0);
  rightArm.rotation.x = -0.6; // Raised combat strike pose
  torso.add(rightArm);

  const rightArmMesh = leftArmMesh.clone();
  rightArm.add(rightArmMesh);

  // Spiked Iron War Mace
  const weapon = new THREE.Group();
  weapon.position.set(0, -0.48, 0.1);
  weapon.rotation.x = Math.PI / 2;

  const maceHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 8), darkSteelMat);
  weapon.add(maceHandle);

  const maceHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), ironPlateMat);
  maceHead.position.y = 0.38;
  weapon.add(maceHead);

  // Spikes on mace head
  for (let s = 0; s < 6; s++) {
    const angle = (s / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), goldTrimMat);
    spike.position.set(Math.cos(angle) * 0.14, 0.38, Math.sin(angle) * 0.14);
    spike.rotation.z = Math.PI / 2 - angle;
    weapon.add(spike);
  }
  rightArm.add(weapon);

  // Legs with Greaves & Sabatons
  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0, 0);
  hips.add(leftLeg);

  const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.55, 8), ironPlateMat);
  leftThigh.position.y = -0.27;
  leftThigh.castShadow = true;
  leftLeg.add(leftThigh);

  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 0.28), ironPlateMat);
  leftBoot.position.set(0, -0.74, 0.06);
  leftBoot.castShadow = true;
  leftLeg.add(leftBoot);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, 0, 0);
  hips.add(rightLeg);

  const rightThigh = leftThigh.clone();
  rightLeg.add(rightThigh);

  const rightBoot = leftBoot.clone();
  rightLeg.add(rightBoot);

  // Overhead Status Billboard
  const badgeTex = createCombatBadgeTexture(
    `⚔️ الفارس المدرع #${knightNumber}`,
    'اضربه بالسيف عاجلاً!',
    '#ef4444'
  );
  const badgeMat = new THREE.MeshBasicMaterial({
    map: badgeTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const billboard = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.6), badgeMat);
  billboard.position.set(0, 2.45, 0);
  group.add(billboard);

  return {
    group,
    root,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    shield,
    weapon,
    shadowDisc,
    billboard,
    eyeLight,
  };
}

// ----------------------------------------------------------------------------
// Wooden Dome-Covered Siege Tank ("دبابة مغطاة شبيهة بالقبة")
// ----------------------------------------------------------------------------

export interface WoodenTankAssembly {
  group: THREE.Group;
  barrelMesh: THREE.Mesh;
  wheels: THREE.Group[];
  ramHead: THREE.Mesh;
  shadowDisc: THREE.Mesh;
  billboard: THREE.Mesh;
}

export function createWoodenTankModel(tankNumber: number = 1): WoodenTankAssembly {
  const group = new THREE.Group();
  group.name = `WoodenTank_${tankNumber}`;

  // Ground contact shadow
  const shadowGeo = new THREE.PlaneGeometry(3.6, 4.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x080402,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  group.add(shadowDisc);

  // Materials
  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x422915, // Weathered hardened oak timbers
    roughness: 0.82,
    metalness: 0.08,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Heavy wrought iron bands and plates
    roughness: 0.42,
    metalness: 0.88,
  });

  const brassRivetMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.35,
    metalness: 0.8,
  });

  // 1. FULL DOME CARAPACE ("مغطاة شبيهة بالقبة")
  // Curved upper dome canopy enclosing the entire fighting compartment
  const domeGeo = new THREE.SphereGeometry(1.48, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const barrelMesh = new THREE.Mesh(domeGeo, timberMat);
  // Scale so it stretches along length (Z) and width (X) to cover chassis
  barrelMesh.scale.set(1.18, 0.95, 1.45);
  barrelMesh.position.set(0, 0.72, 0);
  barrelMesh.castShadow = true;
  group.add(barrelMesh);

  // Lower wooden skirt rim walls extending down to chassis
  const skirtGeo = new THREE.CylinderGeometry(1.65, 1.72, 0.55, 24);
  const skirtMesh = new THREE.Mesh(skirtGeo, timberMat);
  skirtMesh.scale.set(1.05, 1.0, 1.35);
  skirtMesh.position.set(0, 0.52, 0);
  skirtMesh.castShadow = true;
  group.add(skirtMesh);

  // Lower Iron Armor Skirt Trim
  const skirtTrimGeo = new THREE.CylinderGeometry(1.74, 1.74, 0.12, 24);
  const skirtTrim = new THREE.Mesh(skirtTrimGeo, ironMat);
  skirtTrim.scale.set(1.05, 1.0, 1.35);
  skirtTrim.position.set(0, 0.28, 0);
  group.add(skirtTrim);

  // 2. OBSERVATION CUPOLA / TURRET DOME AT THE CREST (قبة المراقبة العلوية)
  const cupolaGeo = new THREE.SphereGeometry(0.48, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const cupolaMesh = new THREE.Mesh(cupolaGeo, ironMat);
  cupolaMesh.position.set(0, 2.08, 0);
  cupolaMesh.castShadow = true;
  group.add(cupolaMesh);

  // Cupola iron crest spike / finial
  const finialGeo = new THREE.ConeGeometry(0.08, 0.35, 8);
  const finial = new THREE.Mesh(finialGeo, brassRivetMat);
  finial.position.set(0, 2.65, 0);
  group.add(finial);

  // Observation Arrow Slits around cupola
  const slitMat = new THREE.MeshBasicMaterial({ color: 0x0a0505 });
  for (let s = 0; s < 4; s++) {
    const angle = (s / 4) * Math.PI * 2;
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.08), slitMat);
    slit.position.set(Math.cos(angle) * 0.45, 2.18, Math.sin(angle) * 0.45);
    slit.rotation.y = -angle;
    group.add(slit);
  }

  // 3. ARCHED IRON MERIDIAN RIBS RADIATING ACROSS THE DOME
  const ribAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
  ribAngles.forEach((angle) => {
    // Semi-circular iron arch band
    const ribGeo = new THREE.TorusGeometry(1.52, 0.045, 8, 20, Math.PI);
    const rib = new THREE.Mesh(ribGeo, ironMat);
    rib.rotation.y = angle;
    rib.rotation.z = Math.PI;
    rib.scale.set(1.15, 0.95, 1.4);
    rib.position.set(0, 0.72, 0);
    group.add(rib);

    // Brass rivets along each rib
    for (let r = 1; r <= 5; r++) {
      const theta = (r / 6) * Math.PI;
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), brassRivetMat);
      rivet.position.set(
        Math.cos(angle) * Math.sin(theta) * 1.58 * 1.15,
        0.72 + Math.cos(theta) * 1.52 * 0.95,
        Math.sin(angle) * Math.sin(theta) * 1.58 * 1.4
      );
      group.add(rivet);
    }
  });

  // Flat internal chassis floor
  const floorGeo = new THREE.BoxGeometry(2.4, 0.18, 3.4);
  const floorMesh = new THREE.Mesh(floorGeo, timberMat);
  floorMesh.position.set(0, 0.72, 0);
  floorMesh.castShadow = true;
  group.add(floorMesh);

  // Front & Rear Heavy Transverse Iron Axles
  const axleGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.8, 10);
  [-1.0, 1.0].forEach((az) => {
    const axle = new THREE.Mesh(axleGeo, ironMat);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, 0.50, az);
    axle.castShadow = true;
    group.add(axle);
  });

  // 4 Massive Spiked Wooden Wheels with Iron Rims and Wheel Pivots ("الدبابات لها عجلات و تسير نحو ناصر")
  const wheels: THREE.Group[] = [];
  const wheelOffsets = [
    [-1.32, 0.50, -1.0], // Front Left
    [1.32, 0.50, -1.0],  // Front Right
    [-1.32, 0.50, 1.0],  // Rear Left
    [1.32, 0.50, 1.0],   // Rear Right
  ];

  wheelOffsets.forEach(([wx, wy, wz]) => {
    const wheelPivot = new THREE.Group();
    wheelPivot.name = `TankWheelPivot_${wx > 0 ? 'R' : 'L'}_${wz > 0 ? 'Rear' : 'Front'}`;
    wheelPivot.position.set(wx, wy, wz);

    // Main wheel wooden body
    const wheelBodyGeo = new THREE.CylinderGeometry(0.50, 0.50, 0.22, 18);
    const wheelBody = new THREE.Mesh(wheelBodyGeo, timberMat);
    wheelBody.rotation.z = Math.PI / 2;
    wheelBody.castShadow = true;
    wheelPivot.add(wheelBody);

    // Heavy Iron Tire Rim around circumference
    const rimGeo = new THREE.TorusGeometry(0.50, 0.045, 8, 20);
    const rim = new THREE.Mesh(rimGeo, ironMat);
    rim.rotation.x = Math.PI / 2;
    wheelBody.add(rim);

    // Iron Axle Hubcap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 10), ironMat);
    wheelBody.add(cap);

    // 8 Iron Studs / Cleats on wheel tire for clearly visible rolling grip
    for (let c = 0; c < 8; c++) {
      const angle = (c / 8) * Math.PI * 2;
      const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.05), ironMat);
      cleat.position.set(Math.cos(angle) * 0.51, 0, Math.sin(angle) * 0.51);
      cleat.rotation.y = -angle;
      wheelBody.add(cleat);
    }

    // 4 Wooden Cross Spokes across wheel face
    for (let s = 0; s < 2; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.23, 0.94), timberMat);
      spoke.rotation.y = (s * Math.PI) / 2;
      wheelBody.add(spoke);
    }

    group.add(wheelPivot);
    wheels.push(wheelPivot);
  });

  // Forward Battering Ram Snout projecting through the front dome snout ("رأس المدق الحديدي")
  const ramHole = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 8, 16), ironMat);
  ramHole.position.set(0, 0.65, -1.9);
  group.add(ramHole);

  const ramBeam = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 1.2), timberMat);
  ramBeam.position.set(0, 0.65, -2.1);
  ramBeam.castShadow = true;
  group.add(ramBeam);

  const ramHeadGeo = new THREE.ConeGeometry(0.32, 0.65, 6);
  const ramHead = new THREE.Mesh(ramHeadGeo, ironMat);
  ramHead.rotation.x = -Math.PI / 2;
  ramHead.position.set(0, 0.65, -2.75);
  ramHead.castShadow = true;
  group.add(ramHead);

  // Overhead Status Billboard
  const badgeTex = createCombatBadgeTexture(
    `🪵 دبابة القبة المدرعة #${tankNumber}`,
    'تسير نحوك.. حطمها بسيفك!',
    '#f59e0b'
  );
  const badgeMat = new THREE.MeshBasicMaterial({
    map: badgeTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const billboard = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.72), badgeMat);
  billboard.position.set(0, 2.85, 0);
  group.add(billboard);

  return {
    group,
    barrelMesh,
    wheels,
    ramHead,
    shadowDisc,
    billboard,
  };
}

// ----------------------------------------------------------------------------
// Siege Catapult Model ("منجنيق الحصن المنيع")
// ----------------------------------------------------------------------------

export interface CatapultAssembly {
  group: THREE.Group;
  throwingArm: THREE.Group;
  counterweight: THREE.Mesh;
  cradle: THREE.Mesh;
  loadedRock: THREE.Mesh;
  billboard: THREE.Mesh;
}

export function createCatapultModel(): CatapultAssembly {
  const group = new THREE.Group();
  group.name = 'CitadelSiegeCatapult';

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2714,
    roughness: 0.85,
    metalness: 0.05,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.85,
  });

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x52525b, // Dark fortress granite stone
    roughness: 0.94,
    metalness: 0.12,
  });

  // Base Timber Chassis Frame (4.5m x 3.6m)
  const chassis1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 5.2), woodMat);
  chassis1.position.set(-1.6, 0.25, 0);
  chassis1.castShadow = true;
  const chassis2 = chassis1.clone();
  chassis2.position.x = 1.6;
  group.add(chassis1, chassis2);

  // Cross beams
  [-2.2, 0, 2.2].forEach((cz) => {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.35, 0.35), woodMat);
    cross.position.set(0, 0.25, cz);
    cross.castShadow = true;
    group.add(cross);
  });

  // Triangular A-frame side support towers
  const createAFrame = (x: number) => {
    const strut1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 8), woodMat);
    strut1.position.set(x, 2.1, -1.0);
    strut1.rotation.x = 0.45;
    strut1.castShadow = true;

    const strut2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 8), woodMat);
    strut2.position.set(x, 2.1, 1.0);
    strut2.rotation.x = -0.45;
    strut2.castShadow = true;

    group.add(strut1, strut2);
  };
  createAFrame(-1.5);
  createAFrame(1.5);

  // Heavy steel pivot axle
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.6, 12), ironMat);
  axle.rotation.z = Math.PI / 2;
  axle.position.set(0, 3.8, 0);
  group.add(axle);

  // Pivoting Throwing Arm
  const throwingArm = new THREE.Group();
  throwingArm.position.set(0, 3.8, 0);
  group.add(throwingArm);

  // Main arm timber beam (Length = 6.4m)
  const armBeam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 6.4), woodMat);
  armBeam.position.set(0, 0, 1.4); // Offset so pivot is near counterweight
  armBeam.castShadow = true;
  throwingArm.add(armBeam);

  // Heavy Counterweight Box at short end (Z = -1.8)
  const counterweightGeo = new THREE.BoxGeometry(1.6, 1.4, 1.2);
  const counterweight = new THREE.Mesh(counterweightGeo, ironMat);
  counterweight.position.set(0, -0.7, -1.8);
  counterweight.castShadow = true;
  throwingArm.add(counterweight);

  // Stone Cradle / Sling at long end (Z = 4.4)
  const cradleGeo = new THREE.CylinderGeometry(0.55, 0.35, 0.45, 10);
  const cradle = new THREE.Mesh(cradleGeo, ironMat);
  cradle.position.set(0, 0.35, 4.4);
  cradle.castShadow = true;
  throwingArm.add(cradle);

  // Loaded Heavy Granite Boulder ("صخرة المنجنيق الحجرية")
  const loadedRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 1), rockMat);
  loadedRock.position.set(0, 0.65, 4.4);
  throwingArm.add(loadedRock);

  // Overhead Status Billboard
  const badgeTex = createCombatBadgeTexture(
    '🪨 منجنيق الحصن المنيع',
    'تفادَ الصخور الحجرية واقترب لتحطيمه بالسيف!',
    '#f97316'
  );
  const badgeMat = new THREE.MeshBasicMaterial({
    map: badgeTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const billboard = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.0), badgeMat);
  billboard.position.set(0, 6.2, 0);
  group.add(billboard);

  return {
    group,
    throwingArm,
    counterweight,
    cradle,
    loadedRock,
    billboard,
  };
}

// ----------------------------------------------------------------------------
// Catapult Stone Boulder Projectile Assembly ("المنجنيق يلقي حجرا")
// ----------------------------------------------------------------------------

export interface CatapultProjectileAssembly {
  group: THREE.Group;
  boulder: THREE.Mesh;
  fireLight: THREE.PointLight;
  shadowTargetMarker: THREE.Mesh;
}

export function createCatapultProjectile(): CatapultProjectileAssembly {
  const group = new THREE.Group();
  group.name = 'CatapultStoneBoulder';

  // Chiseled heavy granite rock
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x52525b, // Dark granite / basalt stone
    roughness: 0.92,
    metalness: 0.15,
  });

  const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 1), rockMat);
  boulder.castShadow = true;
  group.add(boulder);

  // Smaller jagged rock facets attached for irregular stone boulder silhouette
  for (let f = 0; f < 5; f++) {
    const angle = (f / 5) * Math.PI * 2;
    const subRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), rockMat);
    subRock.position.set(Math.cos(angle) * 0.48, Math.sin(angle * 2) * 0.35, Math.sin(angle) * 0.48);
    boulder.add(subRock);
  }

  // Stone dust / friction spark point light
  const fireLight = new THREE.PointLight(0xf59e0b, 1.8, 8);
  group.add(fireLight);

  // Shadow / Target warning marker projected on road ground
  const ringGeo = new THREE.RingGeometry(0.85, 1.35, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shadowTargetMarker = new THREE.Mesh(ringGeo, ringMat);
  shadowTargetMarker.position.y = 0.04;

  return {
    group,
    boulder,
    fireLight,
    shadowTargetMarker,
  };
}

