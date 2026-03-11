import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/OBJLoader.js";

import { InputController } from "./Input.js";
import { PlayerCar } from "./PlayerCar.js";
import { buildWorld } from "./World.js";
import { createNoponStatue } from "./NoponBuilder.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ea3a6);
scene.fog = new THREE.Fog(0x8ea3a6, 12, 55);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 6, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

const ambient = new THREE.AmbientLight(0xffffff, 1.6);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(8, 16, 6);
sun.castShadow = true;
scene.add(sun);

const world = buildWorld(scene);

// Decorative Nopon statue
const statue = createNoponStatue();
statue.position.set(0, 0, -8);
scene.add(statue);

const input = new InputController();
const car = new PlayerCar(scene, input);

const loader = new OBJLoader();
loader.load(
  "./assets/Decimate_Outside_BMW_M4_csl.obj",
  (obj) => {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = new THREE.MeshStandardMaterial({
          color: 0x4e7fe6,
          metalness: 0.5,
          roughness: 0.45
        });
      }
    });

    obj.rotation.x = -Math.PI / 2;
    obj.scale.setScalar(0.8);
    car.setModel(obj);
  },
  undefined,
  (err) => {
    console.error("OBJ failed to load:", err);
  }
);

const clock = new THREE.Clock();

function updateFollowCamera(dt) {
  const targetPos = new THREE.Vector3();
  car.group.getWorldPosition(targetPos);

  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(car.group.quaternion);
  const desired = targetPos.clone()
    .addScaledVector(forward, -6)
    .add(new THREE.Vector3(0, 3.5, 0));

  camera.position.lerp(desired, 4 * dt);
  camera.lookAt(targetPos.clone().add(new THREE.Vector3(0, 1.2, 0)));
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.033);

  car.update(dt);
  updateFollowCamera(dt);

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});