import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export function buildWorld(scene) {
  const loader = new THREE.TextureLoader();

  const stone = loader.load("./assets/stone_wall_diff_1k.jpg");
  stone.wrapS = THREE.RepeatWrapping;
  stone.wrapT = THREE.RepeatWrapping;
  stone.repeat.set(12, 12);

  const asphalt = new THREE.MeshStandardMaterial({
    color: 0x3b3b3b,
    roughness: 0.95,
    metalness: 0.05
  });

  const wallMat = new THREE.MeshStandardMaterial({
    map: stone,
    roughness: 1.0
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x61784b,
    roughness: 1.0
  });

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    grassMat
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const track = new THREE.Mesh(
    new THREE.RingGeometry(8, 16, 64),
    asphalt
  );
  track.rotation.x = -Math.PI / 2;
  track.receiveShadow = true;
  scene.add(track);

  const wallGeo = new THREE.BoxGeometry(1, 2.5, 6);

  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.position.set(Math.cos(angle) * 17, 1.25, Math.sin(angle) * 17);
    wall.lookAt(0, 1.25, 0);
    scene.add(wall);
  }

  return { ground, track };
}