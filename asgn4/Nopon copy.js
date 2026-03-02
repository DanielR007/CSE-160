// Nopon.js
// Blocky Nopon character built from Cubes.
// Designed to be called as: g_nopon.render(baseMatrix, anim)
// where baseMatrix is a Matrix4 placing the nopon in world space,
// and anim is an object.

class Nopon {
  constructor() {
    // curde
    this.colors = {
      body:   [0.85, 0.75, 0.55, 1.0],
      belly:  [0.92, 0.86, 0.72, 1.0],
      head:   [0.88, 0.78, 0.58, 1.0],
      ear:    [0.80, 0.70, 0.52, 1.0],
      eye:    [0.05, 0.05, 0.05, 1.0],
      beak:   [0.95, 0.70, 0.20, 1.0],
      hat:    [0.20, 0.25, 0.35, 1.0],
      pack:   [0.35, 0.22, 0.14, 1.0],
      wing:   [0.70, 0.75, 0.85, 1.0],
      sword:  [0.80, 0.80, 0.85, 1.0],
      hilt:   [0.25, 0.15, 0.08, 1.0],
    };
  }

  render(baseMatrix, anim = {}) {
    // defaults
    const bodyBob = anim.bodyBob ?? 0.0;
    const walkPhase = anim.walkPhase ?? 0.0;

    const hatOn = anim.hatOn ?? true;
    const packOn = anim.packOn ?? true;

    const leftWingBase  = anim.leftWingBase  ?? 0;
    const leftWingMid   = anim.leftWingMid   ?? 0;
    const leftWingTip   = anim.leftWingTip   ?? 0;
    const rightWingBase = anim.rightWingBase ?? 0;
    const rightWingMid  = anim.rightWingMid  ?? 0;
    const rightWingTip  = anim.rightWingTip  ?? 0;

    const swordAngle = anim.swordAngle ?? 0;

    // Helper to render one cube part
    const part = (color, m) => {
      const c = new Cube();
      c.color = color;
      c.matrix = m;
      c.render();
    };

    // Root (apply bob)
    const root = new Matrix4(baseMatrix);
    root.translate(0, bodyBob, 0);

    // ---------------- Body ----------------
    const body = new Matrix4(root);
    body.translate(-0.35, 0.00, -0.25);
    body.scale(0.70, 0.60, 0.50);
    part(this.colors.body, body);

    // Belly plate
    const belly = new Matrix4(root);
    belly.translate(-0.22, 0.08, 0.26);
    belly.scale(0.44, 0.35, 0.02);
    part(this.colors.belly, belly);

    // ---------------- Head ----------------
    const headAnchor = new Matrix4(root);
    headAnchor.translate(0, 0.58, 0); // above body center

    const head = new Matrix4(headAnchor);
    head.translate(-0.32, 0.00, -0.28);
    head.scale(0.64, 0.50, 0.56);
    part(this.colors.head, head);

    // Eyes
    const eyeL = new Matrix4(headAnchor);
    eyeL.translate(-0.16, 0.28, 0.29);
    eyeL.scale(0.10, 0.10, 0.02);
    part(this.colors.eye, eyeL);

    const eyeR = new Matrix4(headAnchor);
    eyeR.translate(0.06, 0.28, 0.29);
    eyeR.scale(0.10, 0.10, 0.02);
    part(this.colors.eye, eyeR);

    // Beak (small protrusion)
    const beak = new Matrix4(headAnchor);
    beak.translate(-0.06, 0.16, 0.30);
    beak.scale(0.12, 0.10, 0.10);
    part(this.colors.beak, beak);

    // ---------------- Ears ----------------
    const earL = new Matrix4(headAnchor);
    earL.translate(-0.42, 0.30, -0.10);
    earL.scale(0.14, 0.28, 0.14);
    part(this.colors.ear, earL);

    const earR = new Matrix4(headAnchor);
    earR.translate(0.28, 0.30, -0.10);
    earR.scale(0.14, 0.28, 0.14);
    part(this.colors.ear, earR);

    // ---------------- Arms (simple walk swing) ----------------
    const swing = 20 * Math.sin(walkPhase);

    const armL = new Matrix4(root);
    armL.translate(-0.40, 0.26, 0.00);
    armL.rotate(swing, 1, 0, 0);
    armL.translate(0.00, -0.22, -0.06);
    armL.scale(0.12, 0.36, 0.12);
    part(this.colors.body, armL);

    const armR = new Matrix4(root);
    armR.translate(0.28, 0.26, 0.00);
    armR.rotate(-swing, 1, 0, 0);
    armR.translate(0.00, -0.22, -0.06);
    armR.scale(0.12, 0.36, 0.12);
    part(this.colors.body, armR);

    // ---------------- Legs ----------------
    const legSwing = 25 * Math.sin(walkPhase);

    const legL = new Matrix4(root);
    legL.translate(-0.18, -0.02, -0.05);
    legL.rotate(-legSwing, 1, 0, 0);
    legL.translate(0, -0.28, 0);
    legL.scale(0.16, 0.30, 0.18);
    part(this.colors.ear, legL);

    const legR = new Matrix4(root);
    legR.translate(0.02, -0.02, -0.05);
    legR.rotate(legSwing, 1, 0, 0);
    legR.translate(0, -0.28, 0);
    legR.scale(0.16, 0.30, 0.18);
    part(this.colors.ear, legR);

    // ---------------- Backpack ----------------
    if (packOn) {
      const pack = new Matrix4(root);
      pack.translate(-0.22, 0.15, -0.33);
      pack.scale(0.44, 0.42, 0.18);
      part(this.colors.pack, pack);
    }

    // ---------------- Hat ----------------
    if (hatOn) {
      const brim = new Matrix4(headAnchor);
      brim.translate(-0.34, 0.46, -0.30);
      brim.scale(0.68, 0.05, 0.60);
      part(this.colors.hat, brim);

      const cap = new Matrix4(headAnchor);
      cap.translate(-0.20, 0.48, -0.16);
      cap.scale(0.40, 0.20, 0.32);
      part(this.colors.hat, cap);
    }

    // ---------------- Wings (optional wow) ----------------
    // Left wing (3 segments)
    this._renderWing(root, -0.38, 0.40, -0.20,  1, leftWingBase, leftWingMid, leftWingTip);
    // Right wing (3 segments)
    this._renderWing(root,  0.26, 0.40, -0.20, -1, rightWingBase, rightWingMid, rightWingTip);

    // ---------------- Sword (optional prop) ----------------
    // Keep it small and cute;
    const swordBase = new Matrix4(root);
    swordBase.translate(0.30, 0.15, 0.10);
    swordBase.rotate(swordAngle, 0, 0, 1);

    // blade
    const blade = new Matrix4(swordBase);
    blade.translate(0.02, 0.05, 0.00);
    blade.scale(0.06, 0.55, 0.04);
    part(this.colors.sword, blade);

    // hilt
    const hilt = new Matrix4(swordBase);
    hilt.translate(-0.04, 0.02, -0.01);
    hilt.scale(0.14, 0.05, 0.06);
    part(this.colors.hilt, hilt);
  }

  _renderWing(root, ox, oy, oz, side, a0, a1, a2) {
    const part = (color, m) => {
      const c = new Cube();
      c.color = color;
      c.matrix = m;
      c.render();
    };

    // base anchor
    const w0 = new Matrix4(root);
    w0.translate(ox, oy, oz);
    w0.rotate(a0, 0, 0, 1);

    // segment 1
    const seg1 = new Matrix4(w0);
    seg1.translate(side < 0 ? -0.18 : 0.00, -0.03, -0.02);
    seg1.scale(0.18, 0.06, 0.14);
    part([0.70, 0.75, 0.85, 1.0], seg1);

    // segment 2
    const w1 = new Matrix4(w0);
    w1.translate(side < 0 ? -0.18 : 0.18, 0.00, 0.00);
    w1.rotate(a1, 0, 0, 1);

    const seg2 = new Matrix4(w1);
    seg2.translate(side < 0 ? -0.18 : 0.00, -0.025, -0.02);
    seg2.scale(0.18, 0.05, 0.12);
    part([0.65, 0.70, 0.82, 1.0], seg2);

    // segment 3
    const w2 = new Matrix4(w1);
    w2.translate(side < 0 ? -0.18 : 0.18, 0.00, 0.00);
    w2.rotate(a2, 0, 0, 1);

    const seg3 = new Matrix4(w2);
    seg3.translate(side < 0 ? -0.16 : 0.00, -0.02, -0.02);
    seg3.scale(0.16, 0.04, 0.10);
    part([0.60, 0.66, 0.78, 1.0], seg3);
  }
}
