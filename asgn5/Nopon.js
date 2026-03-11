import * as THREE from 'three';

export class Nopon {
  constructor() {
    this.group = new THREE.Group();
    this.alive = true;
    this.timeOffset = Math.random() * 10;

    const furMat = new THREE.MeshStandardMaterial({ color: 0xe7d1ab, roughness: 0.95 });
    const furDarkMat = new THREE.MeshStandardMaterial({ color: 0x9a7e61, roughness: 0.98 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xf8f1df, roughness: 0.95 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const cheekMat = new THREE.MeshStandardMaterial({ color: 0xe89cab });
    const footMat = new THREE.MeshStandardMaterial({ color: 0x7b664f, roughness: 1.0 });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xb6282c, roughness: 0.9 });
    const hatBandMat = new THREE.MeshStandardMaterial({ color: 0x321012, roughness: 0.95 });
    const packMat = new THREE.MeshStandardMaterial({ color: 0x39753f, roughness: 0.95 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 20), furMat);
    body.scale.y = 1.08;
    body.position.y = 1.55;
    this.group.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 14), bellyMat);
    belly.scale.set(0.95, 0.8, 0.35);
    belly.position.set(0, 1.32, 0.9);
    this.group.add(belly);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), eyeMat);
    const eyeR = eyeL.clone();
    eyeL.position.set(-0.32, 1.95, 0.92);
    eyeR.position.set(0.32, 1.95, 0.92);
    this.group.add(eyeL, eyeR);

    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), pupilMat);
    const pupilR = pupilL.clone();
    pupilL.position.set(-0.32, 1.95, 1.05);
    pupilR.position.set(0.32, 1.95, 1.05);
    this.group.add(pupilL, pupilR);

    const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), cheekMat);
    const cheekR = cheekL.clone();
    cheekL.position.set(-0.55, 1.6, 0.9);
    cheekR.position.set(0.55, 1.6, 0.9);
    this.group.add(cheekL, cheekR);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 10), furDarkMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 1.68, 1.06);
    this.group.add(beak);

    const footL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.42, 14), footMat);
    const footR = footL.clone();
    footL.position.set(-0.34, 0.25, 0.42);
    footR.position.set(0.34, 0.25, 0.42);
    this.group.add(footL, footR);

    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.38), furDarkMat);
    const wingR = wingL.clone();
    wingL.position.set(-1.02, 1.45, 0.05);
    wingR.position.set(1.02, 1.45, 0.05);
    wingL.rotation.z = 0.35;
    wingR.rotation.z = -0.35;
    this.group.add(wingL, wingR);
    this.leftWing = wingL;
    this.rightWing = wingR;

    const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.16, 20), hatBandMat);
    hatBase.position.set(0, 2.42, 0);
    this.group.add(hatBase);

    const hatTop = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 20), hatMat);
    hatTop.position.set(0, 2.88, 0);
    this.group.add(hatTop);

    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.72, 0.36), packMat);
    pack.position.set(0, 1.4, -0.95);
    this.group.add(pack);

    this.group.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  update(timeSeconds) {
    if (!this.alive) return;

    const t = timeSeconds + this.timeOffset;
    this.group.position.y = 0.18 + Math.sin(t * 2.2) * 0.12;
    this.leftWing.rotation.z = 0.35 + Math.sin(t * 3.5) * 0.18;
    this.rightWing.rotation.z = -0.35 - Math.sin(t * 3.5) * 0.18;
    this.group.rotation.y += 0.003;
  }

  catch() {
    this.alive = false;
    this.group.visible = false;
  }

  respawn(x, y, z) {
    this.alive = true;
    this.group.visible = true;
    this.group.position.set(x, y, z);
  }
}