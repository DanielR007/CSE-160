import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export function createNoponStatue() {
  const root = new THREE.Group();

  const fur = new THREE.MeshStandardMaterial({ color: 0xe5cfaa });
  const dark = new THREE.MeshStandardMaterial({ color: 0x8a7359 });
  const belly = new THREE.MeshStandardMaterial({ color: 0xf5efde });
  const eye = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.3, 20, 16), fur);
  body.scale.y = 1.15;
  body.position.y = 1.5;
  root.add(body);

  const bellyPatch = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.15), belly);
  bellyPatch.position.set(0, 1.3, 1.15);
  root.add(bellyPatch);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.1), eye);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.38, 2.0, 1.18);
  eyeR.position.set(0.38, 2.0, 1.18);
  root.add(eyeL, eyeR);

  const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.05), pupil);
  const pupilR = pupilL.clone();
  pupilL.position.set(-0.34, 1.98, 1.25);
  pupilR.position.set(0.34, 1.98, 1.25);
  root.add(pupilL, pupilR);

  const footL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 12), dark);
  const footR = footL.clone();
  footL.position.set(-0.35, 0.25, 0.45);
  footR.position.set(0.35, 0.25, 0.45);
  root.add(footL, footR);

  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return root;
}