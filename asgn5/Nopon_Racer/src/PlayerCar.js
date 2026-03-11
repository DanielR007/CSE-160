import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export class PlayerCar {
  constructor(scene, input) {
    this.scene = scene;
    this.input = input;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.speed = 0;
    this.maxSpeed = 12;
    this.accel = 18;
    this.reverseAccel = 10;
    this.drag = 8;
    this.turnSpeed = 1.8;

    this.model = null;

    // Temporary placeholder box until model loads
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.8, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x2255cc })
    );
    body.position.y = 0.6;
    body.castShadow = true;
    this.group.add(body);

    this.placeholder = body;

    this.group.position.set(0, 0, 8);
  }

  setModel(obj) {
    if (this.model) this.group.remove(this.model);
    if (this.placeholder) this.group.remove(this.placeholder);

    this.model = obj;
    this.model.position.y = 0.5;
    this.group.add(this.model);
  }

  update(dt) {
    const forwardKey = this.input.isDown("w") || this.input.isDown("arrowup");
    const backKey = this.input.isDown("s") || this.input.isDown("arrowdown");
    const leftKey = this.input.isDown("a") || this.input.isDown("arrowleft");
    const rightKey = this.input.isDown("d") || this.input.isDown("arrowright");

    if (forwardKey) this.speed += this.accel * dt;
    if (backKey) this.speed -= this.reverseAccel * dt;

    if (!forwardKey && !backKey) {
      const sign = Math.sign(this.speed);
      const amount = Math.min(Math.abs(this.speed), this.drag * dt);
      this.speed -= sign * amount;
    }

    this.speed = Math.max(-5, Math.min(this.maxSpeed, this.speed));

    if (Math.abs(this.speed) > 0.2) {
      const turnDir = (leftKey ? 1 : 0) - (rightKey ? 1 : 0);
      this.group.rotation.y += turnDir * this.turnSpeed * dt * (this.speed / this.maxSpeed);
    }

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
    this.group.position.addScaledVector(forward, this.speed * dt);

    if (this.input.isDown("r")) {
      this.group.position.set(0, 0, 8);
      this.group.rotation.set(0, 0, 0);
      this.speed = 0;
    }
  }
}