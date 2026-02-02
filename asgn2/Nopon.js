// Nopon.js
// A blocky Nopon built from cubes + (non-cube) cylinders for feet.
// Globals (joint angles, animation states, etc.) live in asg2.js.

class Cylinder {
  constructor(segments = 10) {
    this.type = 'cylinder';
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
    this.segments = Math.max(3, segments | 0);
  }

  render() {
    const rgba = this.color;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const n = this.segments;
    const cx = 0.5, cz = 0.5;
    const r = 0.5;

    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;

      const x0 = cx + Math.cos(a0) * r;
      const z0 = cz + Math.sin(a0) * r;
      const x1 = cx + Math.cos(a1) * r;
      const z1 = cz + Math.sin(a1) * r;

      // Side (2 triangles)
      drawTriangle3D([x0, 0, z0,   x1, 0, z1,   x1, 1, z1]);
      drawTriangle3D([x0, 0, z0,   x1, 1, z1,   x0, 1, z0]);

      // Bottom cap
      drawTriangle3D([cx, 0, cz,   x1, 0, z1,   x0, 0, z0]);

      // Top cap
      drawTriangle3D([cx, 1, cz,   x0, 1, z0,   x1, 1, z1]);
    }
  }
}

class Nopon {
  constructor() {
    // Reuse these objects to reduce allocations during render.
    this._cube = new Cube();
    this._cyl = new Cylinder(10);

    // Simple palette (tuned for readability against dark background)
    this.fur = [0.92, 0.82, 0.66, 1.0];
    this.furDark = [0.78, 0.66, 0.50, 1.0];
    this.belly = [0.98, 0.95, 0.86, 1.0];
    this.cheek = [0.95, 0.60, 0.65, 1.0];

    this.eyeWhite = [0.98, 0.98, 0.98, 1.0];
    this.eyeIris = [0.25, 0.55, 0.75, 1.0];
    this.eyePupil = [0.08, 0.08, 0.08, 1.0];
    this.eyeHighlight = [1.0, 1.0, 1.0, 1.0];

    this.nose = [0.92, 0.40, 0.55, 1.0];
    this.mouth = [0.20, 0.10, 0.10, 1.0];

    // Belt / pants
    this.belt = [0.20, 0.18, 0.22, 1.0];
    this.pants = [0.22, 0.24, 0.30, 1.0];
    this.buckle = [0.90, 0.75, 0.20, 1.0];

     // Hair feathers
    this.hair = [0.55, 0.38, 0.18, 1.0];
    
    // Accessories
    this.hatRed = [0.78, 0.18, 0.20, 1.0];
    this.hatDark = [0.35, 0.08, 0.10, 1.0];
    this.packGreen = [0.20, 0.55, 0.30, 1.0];
    this.packDark = [0.12, 0.32, 0.18, 1.0];
    this.packStripe = [0.90, 0.75, 0.20, 1.0]; // gold-ish strap
    this.packAccent = [0.95, 0.30, 0.35, 1.0]; // pink/red emblem


    this.swordBlade = [0.85, 0.85, 0.90, 1.0];
    this.swordEdge = [0.55, 0.55, 0.60, 1.0];
    this.swordGuard = [0.25, 0.20, 0.15, 1.0];
    this.swordGrip = [0.10, 0.10, 0.10, 1.0];
    this.swordGold = [0.90, 0.75, 0.20, 1.0];
  }

  // Convenience: draw a cube with a given matrix & color (keeps cube instance reused)
  _drawCube(m, color) {
    this._cube.matrix = m;
    this._cube.color = color;
    this._cube.render();
  }

  _drawCylinder(m, color) {
    this._cyl.matrix = m;
    this._cyl.color = color;
    this._cyl.render();
  }

  // Draw the egg body using stacked "slices" (cubes scaled differently)
  _drawEgg(baseMat, bob) {
    const slices = [
      // [sx, sy, sz, y]
      [0.72, 0.14, 0.72, 0.00],
      [0.86, 0.18, 0.86, 0.12],
      [1.00, 0.24, 1.00, 0.28],
      [0.90, 0.22, 0.90, 0.50],
      [0.76, 0.18, 0.76, 0.68],
    ];

    for (let i = 0; i < slices.length; i++) {
      const [sx, sy, sz, y] = slices[i];
      const m = new Matrix4(baseMat);
      m.translate((1 - sx) / 2, y + bob, (1 - sz) / 2);
      m.scale(sx, sy, sz);
      const sliceColor = (i <= 1) ? this.pants : this.fur;
      this._drawCube(m, sliceColor);
    }

     // Pants / lower wrap (darker band near the bottom)
    {
      const m = new Matrix4(baseMat);
      m.translate(0.16, 0.02 + bob, 0.16);
      m.scale(0.68, 0.20, 0.68);
      this._drawCube(m, this.pants);
    }

    // Belt (thin ring-ish band) + buckle
    {
      const m = new Matrix4(baseMat);
      const sx = 0.92, sy = 0.05, sz = 0.92;
      m.translate((1 - sx) / 2, 0.22 + bob, (1 - sz) / 2);
      m.scale(sx, sy, sz);
      this._drawCube(m, this.belt);

      // Buckle (front)
      const b = new Matrix4(baseMat);
      b.translate(0.44, 0.215 + bob, -0.02);
      b.scale(0.10, 0.07, 0.04);
      this._drawCube(b, this.buckle);
    }
    
    // Belly patch (thin overlay)
    {
      const m = new Matrix4(baseMat);
      const sx = 0.55, sy = 0.28, sz = 0.02;
      m.translate((1 - sx) / 2, 0.30 + bob, -0.015);
      m.scale(sx, sy, sz);
      this._drawCube(m, this.belly);
    }

    // Cheeks (small rounded feel)
    {
      const cheekS = [0.10, 0.08, 0.04];
      const y = 0.58 + bob;
      // Left cheek
      let m = new Matrix4(baseMat);
      m.translate(0.28, y, -0.02);
      m.scale(cheekS[0], cheekS[1], cheekS[2]);
      this._drawCube(m, this.cheek);

      // Right cheek
      m = new Matrix4(baseMat);
      m.translate(0.62, y, -0.02);
      m.scale(cheekS[0], cheekS[1], cheekS[2]);
      this._drawCube(m, this.cheek);
    }
  }

  _drawFace(baseMat, bob, anim) {
    // Big eyes (each: sclera + iris + pupil + highlight + brow)
    const eyeZ = -0.03;

    const drawOneEye = (x) => {
      // Sclera
      let m = new Matrix4(baseMat);
      m.translate(x, 0.66 + bob, eyeZ);
      m.scale(0.16, 0.12, 0.04);
      this._drawCube(m, this.eyeWhite);

      // Iris
      m = new Matrix4(baseMat);
      const dx = (anim && anim.eyeDx) ? anim.eyeDx : 0;
      const dy = (anim && anim.eyeDy) ? anim.eyeDy : 0;
      m.translate(x + 0.04 + dx, 0.675 + bob + dy, eyeZ - 0.005);
      m.scale(0.09, 0.07, 0.03);
      this._drawCube(m, this.eyeIris);

      // Pupil
      m = new Matrix4(baseMat);
      m.translate(x + 0.065 + dx * 1.2, 0.69 + bob + dy * 1.2, eyeZ - 0.008);
      m.scale(0.035, 0.04, 0.02);
      this._drawCube(m, this.eyePupil);

      // Highlight
      m = new Matrix4(baseMat);
      m.translate(x + 0.08 + dx * 1.4, 0.715 + bob + dy * 1.4, eyeZ - 0.010);
      m.scale(0.018, 0.018, 0.015);
      this._drawCube(m, this.eyeHighlight);

      // Brow
      m = new Matrix4(baseMat);
      m.translate(x - 0.01, 0.78 + bob, eyeZ);
      m.scale(0.18, 0.03, 0.04);
      this._drawCube(m, this.furDark);
    };

    drawOneEye(0.26);
    drawOneEye(0.58);

    // Nose
    {
      const m = new Matrix4(baseMat);
      m.translate(0.46, 0.60 + bob, -0.04);
      m.scale(0.08, 0.06, 0.05);
      this._drawCube(m, this.nose);
    }

    // Mouth
    {
      const m = new Matrix4(baseMat);
      m.translate(0.40, 0.52 + bob, -0.03);
      m.scale(0.20, 0.03, 0.03);
      this._drawCube(m, this.mouth);
    }
    
    // Mouth open during poke 
    if (anim && anim.pokeAmount && anim.pokeAmount > 0) {
      const open = anim.pokeAmount; // 0..1
      const m = new Matrix4(baseMat);
      m.translate(0.44, 0.49 + bob - 0.01 * open, -0.040);
      m.scale(0.12, 0.02 + 0.09 * open, 0.03);
      this._drawCube(m, this.mouth);
    }
  }
 _drawHeadFeathers(baseMat, bob, hatOn) {
    // Three long feather hairs on top. When hat is on,
    const len = hatOn ? 0.02 : 0.28;
    const yBase = 0.82 + bob;
    const z = 0.34;

    const xs = [0.44, 0.50, 0.56];
    const angles = [-35, 0, 35]; // fan outward

    for (let i = 0; i < 3; i++) {
      const m = new Matrix4(baseMat);
      m.translate(xs[i], yBase, z);

      // Fan out
      m.translate(0.02, 0.0, 0.02);
      m.rotate(angles[i], 0, 0, 1);
      m.translate(-0.02, 0.0, -0.02);
      this._drawHeadFeathers(baseMat, bob, anim.hatOn);

      // Thin feather-like block
      m.scale(0.04, len, 0.04);
      this._drawCube(m, this.hair);
      
    }
  }

  _drawHat(baseMat, bob) {
    // 2 cubes: brim + cap
    // Brim 
    let m = new Matrix4(baseMat);
    m.translate(0.28, 0.84 + bob, 0.20);
    m.scale(0.44, 0.04, 0.44);
    this._drawCube(m, this.hatDark);

    // Cap (taller)
    m = new Matrix4(baseMat);
    m.translate(0.32, 0.86 + bob, 0.24);
    m.scale(0.36, 0.3, 0.36);
    this._drawCube(m, this.hatRed);
  }

  _drawBackpack(baseMat, bob) {
  // Main pack
  let m = new Matrix4(baseMat);
  m.translate(0.30, 0.38 + bob, 0.90);
  m.scale(0.40, 0.32, 0.22);
  this._drawCube(m, this.packGreen);


  const faceZ = 1.135; // Front face Z of backpack

  // Pocket 
  m = new Matrix4(baseMat);
  m.translate(0.34, 0.42 + bob, faceZ);
  m.scale(0.32, 0.18, 0.06);
  this._drawCube(m, this.packDark);

  // Straps: 
  m = new Matrix4(baseMat);
  m.translate(0.36, 0.40 + bob, faceZ);
  m.scale(0.04, 0.30, 0.03);
  this._drawCube(m, this.packStripe);

  m = new Matrix4(baseMat);
  m.translate(0.58, 0.40 + bob, faceZ);
  m.scale(0.04, 0.30, 0.03);
  this._drawCube(m, this.packStripe);

  // Emblem:
  m = new Matrix4(baseMat);
  m.translate(0.47, 0.52 + bob, faceZ);
  m.scale(0.08, 0.08, 0.04);
  this._drawCube(m, this.packAccent);
}
  
  _drawFeet(baseMat, walkPhase) {
    // Two cylinder feet. "Walking" - forward/back rock.
    const stepL = Math.sin(walkPhase);
    const stepR = Math.sin(walkPhase + Math.PI);

    const drawFoot = (x, step) => {
      const m = new Matrix4(baseMat);
      // A bit in front so the character looks stable
      m.translate(x, -.04 + Math.max(0, step) * 0.02, 0.56);
      // Rock forward/back
      m.translate(0.5, 0, 0.5);
      m.rotate(step * 18, 1, 0, 0);
      m.translate(-0.5, 0, -0.5);

      m.scale(0.18, 0.4, 0.18);
      this._drawCylinder(m, this.furDark);
    };

    drawFoot(0.28, stepL);
    drawFoot(0.54, stepR);
  }

  // Wing-ear as an arm: base -> mid -> tip, plus feather-fingers, plus optional sword.
  // Returns the coordinate matrix at the tip (so sword can attach cleanly).
  _drawWing(baseMat, isRight, baseAngle, midAngle, tipAngle, bob) {
    const side = isRight ? 1 : -1;

    // Shoulder pivot: upper back / side
    let wingBase = new Matrix4(baseMat);
    wingBase.translate(isRight ? 0.90 : -0.10, 0.62 + bob, 0.78);

    // Swing around X to move from back toward front ("wing ear arm")
    wingBase.rotate(baseAngle, 1, 0, 0);

    // Base panel (thin, long, wing-like)
    {
      const m = new Matrix4(wingBase);
      // extend forward
      m.translate(isRight ? -0.10 : 0.00, -0.04, -0.42);
      m.scale(0.22, 0.14, 0.46);
      this._drawCube(m, this.fur);
    }

    // Move to hinge for mid segment
    let wingMid = new Matrix4(wingBase);
    wingMid.translate(isRight ? 0.06 : 0.16, 0.00, -0.42);
    wingMid.rotate(midAngle, 1, 0, 0);

    {
      const m = new Matrix4(wingMid);
      m.translate(isRight ? -0.12 : -0.02, -0.03, -0.36);
      m.scale(0.20, 0.12, 0.40);
      this._drawCube(m, this.fur);
    }

    // Move to hinge for tip segment
    let wingTip = new Matrix4(wingMid);
    wingTip.translate(isRight ? 0.04 : 0.14, 0.00, -0.38);
    wingTip.rotate(tipAngle, 1, 0, 0);

    {
      const m = new Matrix4(wingTip);
      m.translate(isRight ? -0.10 : -0.00, -0.02, -0.26);
      m.scale(0.18, 0.10, 0.28);
      this._drawCube(m, this.fur);
    }

    // Feather-like "fingers" (5 thin panels) attached to the tip
  for (let i = -2; i <= 2; i++) {
    const m = new Matrix4(wingTip);

  // Move to the tip where fingers start
    m.translate(isRight ? 0.02 : 0.12, 0.00, -0.30);

  // Rotate the whole finger fan so it faces the front of the wing
    m.rotate(isRight ? -90 : 90, 0, 1, 0);

  // Spread fingers: rotate around Z (like a hand opening/closing)
    m.rotate(i * 10, 0, 0, 1);

  // Offset each finger slightly
    m.translate(0.00, i * 0.012, 0.00);

  // Long thin panels
    m.scale(0.05, 0.018, 0.26);
    this._drawCube(m, this.furDark);
}


    // Return a matrix near the "grip" point (center finger) for sword attachment
    const gripMat = new Matrix4(wingTip);
    gripMat.translate(isRight ? 0.02 : 0.12, 0.00, -0.30);

    // match the finger fan's base alignment
    gripMat.rotate(isRight ? -90 : 90, 0, 1, 0);

  return gripMat;

  }

  _drawSword(gripMat, swordAngle) {
    // Oversized sword: grip (cylinder), guard, blade.
    // Attach at gripMat coordinate frame.

    // Grip cylinder
    {
      const m = new Matrix4(gripMat);
      m.translate(-0.02, -0.06, -0.02);
      m.rotate(90, 0, 0, 1);
      m.scale(0.08, 0.10, 0.08);
      this._drawCylinder(m, this.swordGrip);
    }

    // Rotate sword assembly (swing)
    let swordMat = new Matrix4(gripMat);
    swordMat.translate(0.02, -0.02, -0.02);
    swordMat.rotate(swordAngle, 0, 0, 1);

    // Guard
    {
      const m = new Matrix4(swordMat);
      m.translate(-0.10, -0.03, -0.05);
      m.scale(0.24, 0.06, 0.10);
      this._drawCube(m, this.swordGold);
    }

    // Blade two-tone 
    {
      const m = new Matrix4(swordMat);
      m.translate(-0.03, 0.03, -0.03);
      m.scale(0.12, 0.70, 0.06);
      this._drawCube(m, this.swordBlade);

      const edge = new Matrix4(swordMat);
      edge.translate(-0.01, 0.05, -0.028);
      edge.scale(0.08, 0.66, 0.03);
      this._drawCube(edge, this.swordEdge);
    }

    // Pommel
    {
      const m = new Matrix4(swordMat);
      m.translate(-0.04, -0.08, -0.04);
      m.scale(0.08, 0.05, 0.08);
      this._drawCube(m, this.swordGuard);
    }
  }

  render(baseMat, anim) {
    // baseMat: positions/scales the whole Nopon
    // anim: animation

    const bob = anim.bodyBob;
    const walkPhase = anim.walkPhase;

    // Egg body
    this._drawEgg(baseMat, bob);

    // Face
    this._drawFace(baseMat, bob, anim);

    // Accessories (hat + backpack)
    if (anim.hatOn) this._drawHat(baseMat, bob);
    if (anim.packOn) this._drawBackpack(baseMat, bob);
    
    // Feet (non-cube shape)
    this._drawFeet(baseMat, walkPhase);

    // Wings (ears-as-arms)
    const leftGrip = this._drawWing(
      baseMat,
      false,
      anim.leftWingBase,
      anim.leftWingMid,
      anim.leftWingTip,
      bob
    );

    const rightGrip = this._drawWing(
      baseMat,
      true,
      anim.rightWingBase,
      anim.rightWingMid,
      anim.rightWingTip,
      bob
    );

    // Sword on right wing
    this._drawSword(rightGrip, anim.swordAngle);

    // Small tail/pom (cube) on back
    {
      const m = new Matrix4(baseMat);
      m.translate(0.46, 0.30 + bob, 1.00);
      m.scale(0.10, 0.10, 0.10);
      this._drawCube(m, this.furDark);
    }
  }
}
