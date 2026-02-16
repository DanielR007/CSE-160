// Camera.js
// Camera with eye/at/up Vec3s + WASD movement + mouse-look (yaw + pitch)
// No Vector.js was used, incorporated here with the camera.

class Vec3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
  mul(s) { return new Vec3(this.x * s, this.y * s, this.z * s); }
  div(s) { return new Vec3(this.x / s, this.y / s, this.z / s); }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  len()  { return Math.sqrt(this.dot(this)); }
  norm() {
    const L = this.len();
    if (L === 0) return new Vec3(0, 0, 0);
    return this.div(L);
  }
  cross(v) {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
}

function rotateAroundAxis(v, axisUnit, rad) {
  // Rodrigues rotation formula (axis must be unit)
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const term1 = v.mul(cosA);
  const term2 = axisUnit.cross(v).mul(sinA);
  const term3 = axisUnit.mul(axisUnit.dot(v) * (1 - cosA));
  return term1.add(term2).add(term3);
}

class Camera {
  constructor() {
    // Start ABOVE the floor (fixes “camera below floor” feeling)
    this.eye = new Vec3(0, 1.2, 6);
    this.at  = new Vec3(0, 1.2, 0);
    this.up  = new Vec3(0, 1, 0);

    this.moveSpeed = 0.25;  // world units per key press
    this.turnSpeed = 3;     // degrees per key press
    this.minY = 0.15;       // keep camera from going under the floor plane
  }

  // Direction helpers
  _forwardUnit() { return this.at.sub(this.eye).norm(); }
  _rightUnit()   { return this._forwardUnit().cross(this.up).norm(); }

  _translate(delta) {
    this.eye = this.eye.add(delta);
    this.at  = this.at.add(delta);
    this._clampY();
  }

  _clampY() {
    if (this.eye.y < this.minY) {
      const dy = this.minY - this.eye.y;
      this.eye.y += dy;
      this.at.y  += dy;
    }
  }

  // Movement (WASD + vertical)
  forward() { this._translate(this._forwardUnit().mul(this.moveSpeed)); }
  back()    { this._translate(this._forwardUnit().mul(-this.moveSpeed)); }
  left()    { this._translate(this._rightUnit().mul(-this.moveSpeed)); }
  right()   { this._translate(this._rightUnit().mul(this.moveSpeed)); }

  upMove()   { this._translate(new Vec3(0, this.moveSpeed, 0)); }   //  “up”
  downMove() { this._translate(new Vec3(0, -this.moveSpeed, 0)); }  //  “down”

  // Look (yaw around world up, pitch around camera right)
  panLeft(deg = this.turnSpeed)  { this._yaw(+deg); }
  panRight(deg = this.turnSpeed) { this._yaw(-deg); }
  panUp(deg = this.turnSpeed)    { this._pitch(+deg); }
  panDown(deg = this.turnSpeed)  { this._pitch(-deg); }

  look(yawDeg, pitchDeg) {
    // For mouse-look
    if (yawDeg) this._yaw(yawDeg);
    if (pitchDeg) this._pitch(pitchDeg);
  }

  _yaw(deg) {
    const rad = deg * Math.PI / 180.0;
    const f = this.at.sub(this.eye); // keep distance
    // rotate around world Y axis
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const x = f.x * cosA - f.z * sinA;
    const z = f.x * sinA + f.z * cosA;
    this.at = this.eye.add(new Vec3(x, f.y, z));
  }

  _pitch(deg) {
    const rad = deg * Math.PI / 180.0;
    const f = this.at.sub(this.eye);       // keep distance
    const right = this._rightUnit();       // rotation axis
    const f2 = rotateAroundAxis(f, right, rad);

    // Prevent flipping (don’t let forward align too much with up)
    const forwardUnit = f2.norm();
    if (Math.abs(forwardUnit.dot(this.up)) > 0.98) return;

    this.at = this.eye.add(f2);
  }
}

