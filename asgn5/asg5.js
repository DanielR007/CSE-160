import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { Nopon } from './Nopon.js';

/*
scene / renderer / camera
textures
lights
skybox
ground and ruins
Nopon object
imported model
controls/input
animation loop
*/


const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x95a4a6);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  300
);
camera.position.set(0, 2.2, 8);

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.object);

const clock = new THREE.Clock();

const ui = {
  lockBtn: document.getElementById('lockBtn'),
  fogBtn: document.getElementById('fogBtn'),
  modeDisplay: document.getElementById('modeDisplay'),
  scoreBox: document.getElementById('scoreBox'),
  message: document.getElementById('message'),
  fps: document.getElementById('fps'),
};

const game = {
  score: 0,
  fogOn: true,
};

const player = {
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  moveUp: false,
  moveDown: false,
  speed: 10,
  flySpeed: 8,
  spawn: new THREE.Vector3(0, 2.2, 8),
};

const textureLoader = new THREE.TextureLoader();

function loadRepeatTexture(path, rx = 1, ry = 1) {
  const tex = textureLoader.load(path);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const texGround = loadRepeatTexture('./rocky_terrain_02_diff_1k.jpg', 20, 20);
const texStone = loadRepeatTexture('./stone_wall_diff_1k.jpg', 4, 2);
const texWood = loadRepeatTexture('./wood_planks_diff_1k.jpg', 2, 2);
const texRoof = loadRepeatTexture('./thatch_roof_angled_diff_1k.jpg', 2, 2);
const texSky = textureLoader.load('./sky.jpg');
texSky.colorSpace = THREE.SRGBColorSpace;

const fogNear = 16;
const fogFar = 85;
scene.fog = new THREE.Fog(0x95a4a6, fogNear, fogFar);

function setMessage(text) {
  ui.message.textContent = text;
}

function updateScoreUI() {
  ui.scoreBox.textContent = `Caught: ${game.score}`;
}

function setFogEnabled(enabled) {
  game.fogOn = enabled;
  scene.fog = enabled ? new THREE.Fog(0x95a4a6, fogNear, fogFar) : null;
  ui.fogBtn.textContent = enabled ? 'Fog: ON' : 'Fog: OFF';
}

ui.lockBtn.addEventListener('click', () => {
  controls.lock();
});

ui.fogBtn.addEventListener('click', () => {
  setFogEnabled(!game.fogOn);
});

controls.addEventListener('lock', () => {
  ui.modeDisplay.textContent = 'FIRST PERSON MODE';
  setMessage('Pointer locked.');
});

controls.addEventListener('unlock', () => {
  setMessage('Pointer unlocked.');
});

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* =========================
   LIGHTING
========================= */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xbfd8ff, 0x61734a, 0.7);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(18, 30, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;
sun.shadow.camera.bottom = -45;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 100;
scene.add(sun);

const shrineLight = new THREE.PointLight(0xffc86b, 12, 16, 2);
shrineLight.position.set(0, 3.6, 0);
shrineLight.castShadow = true;
scene.add(shrineLight);

/* =========================
   SKY
========================= */
function buildSkybox() {
  const size = 220;
  const materials = [];
  for (let i = 0; i < 6; i++) {
    materials.push(
      new THREE.MeshBasicMaterial({
        map: texSky,
        side: THREE.BackSide,
      })
    );
  }

  const sky = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    materials
  );
  scene.add(sky);
}

/* =========================
   MATERIALS
========================= */
const matGround = new THREE.MeshStandardMaterial({
  map: texGround,
  roughness: 1.0,
  metalness: 0.0,
});

const matStone = new THREE.MeshStandardMaterial({
  map: texStone,
  roughness: 1.0,
  metalness: 0.05,
});

const matWood = new THREE.MeshStandardMaterial({
  map: texWood,
  roughness: 0.95,
  metalness: 0.02,
});

const matRoof = new THREE.MeshStandardMaterial({
  map: texRoof,
  roughness: 1.0,
  metalness: 0.0,
});

const matCrystal = new THREE.MeshStandardMaterial({
  color: 0x69d8ff,
  emissive: 0x114455,
  roughness: 0.2,
  metalness: 0.0,
});

/* =========================
   WORLD
========================= */
const worldGroup = new THREE.Group();
scene.add(worldGroup);

const animatedObjects = [];
const colliders = [];

function addCollider(mesh, yFloor = 0) {
  colliders.push({ mesh, yFloor });
}

function createGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    matGround
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  worldGroup.add(ground);
}

function createWall(x, y, z, sx, sy, sz) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    matStone
  );
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  worldGroup.add(wall);
  addCollider(wall);
  return wall;
}

function createPost(x, y, z) {
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 2.2, 12),
    matWood
  );
  post.position.set(x, y, z);
  post.castShadow = true;
  post.receiveShadow = true;
  worldGroup.add(post);
  addCollider(post);
  return post;
}

function createRoof(x, y, z, ry = 0) {
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.7, 1.15, 4),
    matRoof
  );
  roof.position.set(x, y, z);
  roof.rotation.y = ry;
  roof.castShadow = true;
  roof.receiveShadow = true;
  worldGroup.add(roof);
  return roof;
}

function createCrystal(x, y, z) {
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5),
    matCrystal
  );
  crystal.position.set(x, y, z);
  crystal.castShadow = true;
  crystal.receiveShadow = true;
  worldGroup.add(crystal);
  animatedObjects.push(crystal);
  return crystal;
}

function createTorch(x, y, z) {
  const torchPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.6, 10),
    matWood
  );
  torchPost.position.set(x, y + 0.8, z);
  torchPost.castShadow = true;
  worldGroup.add(torchPost);

  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0xffb34d,
      emissive: 0xff7a00,
      emissiveIntensity: 1.2,
      roughness: 0.4,
    })
  );
  flame.position.set(x, y + 1.7, z);
  worldGroup.add(flame);
  animatedObjects.push(flame);

  const light = new THREE.PointLight(0xffaa55, 5, 10, 2);
  light.position.set(x, y + 1.7, z);
  scene.add(light);
}

function createHut(x, z) {
  createPost(x - 1.1, 1.1, z - 1.1);
  createPost(x + 1.1, 1.1, z - 1.1);
  createPost(x - 1.1, 1.1, z + 1.1);
  createPost(x + 1.1, 1.1, z + 1.1);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.2, 2.8),
    matWood
  );
  floor.position.set(x, 0.1, z);
  floor.castShadow = true;
  floor.receiveShadow = true;
  worldGroup.add(floor);
  addCollider(floor);

  createRoof(x, 2.5, z, Math.PI * 0.25);
}

function buildWorld() {
  createGround();
  buildSkybox();

  // Stone ruin perimeter
  createWall(0, 1.2, -14, 24, 2.4, 1.2);
  createWall(0, 1.2, 14, 24, 2.4, 1.2);
  createWall(-14, 1.2, 0, 1.2, 2.4, 24);
  createWall(14, 1.2, 0, 1.2, 2.4, 24);

  // Inner ruin pieces
  createWall(-6, 1.2, -4, 6, 2.4, 1);
  createWall(5, 1.2, -3, 8, 2.4, 1);
  createWall(-4, 1.2, 5, 1, 2.4, 7);
  createWall(6, 1.2, 6, 1, 2.4, 6);

  // Shrine arch
  createWall(-1.8, 1.9, 0, 1, 3.8, 1);
  createWall(1.8, 1.9, 0, 1, 3.8, 1);
  createWall(0, 3.6, 0, 4.8, 0.8, 1);

  // Huts
  createHut(-9, 9);
  createHut(9, -8);

  // Animated crystals
  createCrystal(0, 1.1, -8);
  createCrystal(7, 1.2, 7);

  // Torches
  createTorch(-2.8, 0, 2.5);
  createTorch(2.8, 0, 2.5);
  createTorch(-9, 0, 9);
  createTorch(9, 0, -8);
}

/* =========================
   NOPON
========================= */
const nopon = new Nopon();
nopon.setPosition(0, 0.18, -10);
scene.add(nopon.group);

/* =========================
   IMPORTED MODEL
========================= */
function addFallbackModel() {
  const relic = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.4, 1.4),
    new THREE.MeshStandardMaterial({
      color: 0x8fa4c8,
      roughness: 0.5,
      metalness: 0.35,
    })
  );
  relic.position.set(10, 0.8, 10);
  relic.castShadow = true;
  relic.receiveShadow = true;
  scene.add(relic);
  animatedObjects.push(relic);
}

function loadOptionalOBJ() {
  const MODEL_PATH = './base.obj';

  const loader = new OBJLoader();
  loader.load(
    MODEL_PATH,
    (obj) => {
      obj.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: texWood,
            roughness: 0.85,
            metalness: 0.08,
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      obj.position.set(10, 0.25, 10);
      obj.scale.set(0.9, 0.9, 0.9);
      scene.add(obj);
      setMessage('Imported model loaded.');
    },
    undefined,
    () => {
      addFallbackModel();
      setMessage('OBJ not found. Using fallback model.');
    }
  );
}

/* =========================
   INPUT
========================= */
const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  if (e.code === 'KeyR') {
    resetPlayer();
  }

  if (e.code === 'KeyF') {
    setFogEnabled(!game.fogOn);
  }

  if (e.code === 'KeyE') {
    tryCatchNopon();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function resetPlayer() {
  controls.object.position.copy(player.spawn);
  player.velocity.set(0, 0, 0);
  setMessage('Player reset.');
}

/* =========================
   GAMEPLAY
========================= */
function tryCatchNopon() {
  if (!nopon.alive) return;

  const playerPos = controls.object.position;
  const dist = playerPos.distanceTo(nopon.group.position);

  if (dist < 3.0) {
    nopon.catch();
    game.score += 1;
    updateScoreUI();
    setMessage('You caught the Nopon!');
    setTimeout(() => {
      const respawnPositions = [
        new THREE.Vector3(-8, 0.18, -8),
        new THREE.Vector3(8, 0.18, 8),
        new THREE.Vector3(0, 0.18, 10),
        new THREE.Vector3(10, 0.18, -10),
      ];
      const p = respawnPositions[Math.floor(Math.random() * respawnPositions.length)];
      nopon.respawn(p.x, p.y, p.z);
      setMessage('A new Nopon appeared...');
    }, 1800);
  } else {
    setMessage('Too far away to catch the Nopon.');
  }
}

/* =========================
   COLLISION
========================= */
const playerRadius = 0.55;

function resolveWallCollisions(oldPosition) {
  const playerPos = controls.object.position;
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(playerPos.x, 1.2, playerPos.z),
    new THREE.Vector3(playerRadius * 2, 2.4, playerRadius * 2)
  );

  for (const item of colliders) {
    const box = new THREE.Box3().setFromObject(item.mesh);
    if (playerBox.intersectsBox(box)) {
      controls.object.position.copy(oldPosition);
      player.velocity.x = 0;
      player.velocity.z = 0;
      break;
    }
  }
}

/* =========================
   ANIMATION LOOP
========================= */
function updatePlayer(delta) {
  player.moveForward = keys['KeyW'];
  player.moveBackward = keys['KeyS'];
  player.moveLeft = keys['KeyA'];
  player.moveRight = keys['KeyD'];
  player.moveUp = keys['Space'];
  player.moveDown = keys['ShiftLeft'] || keys['ShiftRight'];

  const drag = 8.0;
  player.velocity.x -= player.velocity.x * drag * delta;
  player.velocity.z -= player.velocity.z * drag * delta;
  player.velocity.y -= player.velocity.y * drag * delta;

  player.direction.z = Number(player.moveForward) - Number(player.moveBackward);
  player.direction.x = Number(player.moveRight) - Number(player.moveLeft);
  player.direction.y = Number(player.moveUp) - Number(player.moveDown);

  player.direction.normalize();

  if (controls.isLocked) {
    if (player.moveForward || player.moveBackward) {
      player.velocity.z -= player.direction.z * player.speed * delta * 10.0;
    }
    if (player.moveLeft || player.moveRight) {
      player.velocity.x -= player.direction.x * player.speed * delta * 10.0;
    }
    if (player.moveUp || player.moveDown) {
      player.velocity.y += player.direction.y * player.flySpeed * delta * 8.0;
    }

    const oldPosition = controls.object.position.clone();

    controls.moveRight(-player.velocity.x * delta);
    controls.moveForward(-player.velocity.z * delta);
    controls.object.position.y += player.velocity.y * delta;

    if (controls.object.position.y < 1.5) {
      controls.object.position.y = 1.5;
      player.velocity.y = 0;
    }

    resolveWallCollisions(oldPosition);
  }
}

function updateAnimatedObjects(time) {
  animatedObjects.forEach((obj, i) => {
    obj.rotation.y += 0.01 + i * 0.0005;
    obj.position.y += Math.sin(time * 2.2 + i) * 0.0025;
  });

  shrineLight.intensity = 10 + Math.sin(time * 5.0) * 2.0;
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  updatePlayer(delta);
  nopon.update(elapsed);
  updateAnimatedObjects(elapsed);

  renderer.render(scene, camera);

  const fps = 1 / Math.max(delta, 0.0001);
  ui.fps.textContent = `FPS: ${fps.toFixed(0)}`;
}

/* =========================
   STARTUP
========================= */
buildWorld();
loadOptionalOBJ();
resetPlayer();
updateScoreUI();
setFogEnabled(true);
setMessage('Click the button to lock pointer and begin.');
animate();