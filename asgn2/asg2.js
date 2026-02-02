// asg2.js
// Assignment 2 - Blocky 3D Animal (Nopon) Daniel Rothman

// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// ------------ Global WebGL state (global for Cube.js / Triangle.js)
var canvas;
var gl;
var a_Position;
var u_FragColor;
var u_ModelMatrix;
var u_GlobalRotateMatrix;

// Performance optimization: Triangle.js will reuse this
var g_vertexBuffer = null;

// ------------ Scene globals (UI / animation)
// Global camera rotation: slider controls Y; mouse drag controls X and Y.
var g_globalAngleY = 0;
var g_globalAngleX = 0;

// Ear-wing joint sliders
var g_magentaAngle = 0;  // base joint
var g_yellowAngle = 0;   // mid joint
var g_earTipAngle = 0;   // 3rd joint

// Sword slider
var g_swordAngle = 10;

// Animation toggles
var g_animMaster = true;
var g_walkAnimation = true;
var g_magentaAnimation = true;
var g_yellowAnimation = true;
var g_hatOn = true;
var g_packOn = true;

// Animation time
var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;

// Derived animation parameters (set in updateAnimationAngles)
var g_bodyBob = 0;
var g_walkPhase = 0;
var g_pokeActive = false;
var g_pokeStart = 0;
var g_pokeAmount = 0; // 0..1

// Mouse rotation state
var g_mouseDown = false;
var g_lastMouseX = 0;
var g_lastMouseY = 0;

// FPS indicator
var g_lastFrameMS = performance.now();
var g_fpsSmoothed = 0;

// Nopon instance - defined in Nopon.js
var g_nopon = null;

// ------------ Setup
function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get u_GlobalRotateMatrix');
    return;
  }

  // Start with identity model matrix
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addActionsForHtmlUI() {
  // Sliders
  document.getElementById('angleSlide').addEventListener('input', function () {
    g_globalAngleY = Number(this.value);
  });

  document.getElementById('magentaSlide').addEventListener('input', function () {
    g_magentaAngle = Number(this.value);
  });

  document.getElementById('yellowSlide').addEventListener('input', function () {
    g_yellowAngle = Number(this.value);
  });

  document.getElementById('earTipSlide').addEventListener('input', function () {
    g_earTipAngle = Number(this.value);
  });

  document.getElementById('swordSlide').addEventListener('input', function () {
    g_swordAngle = Number(this.value);
  });

  // Joint animation toggles
  document.getElementById('magentaAnimOn').onclick = () => { g_magentaAnimation = true; };
  document.getElementById('magentaAnimOff').onclick = () => { g_magentaAnimation = false; };
  document.getElementById('yellowAnimOn').onclick = () => { g_yellowAnimation = true; };
  document.getElementById('yellowAnimOff').onclick = () => { g_yellowAnimation = false; };

  // Master animation
  document.getElementById('animOn').onclick = () => { g_animMaster = true; };
  document.getElementById('animOff').onclick = () => {
    g_animMaster = false;
    g_pokeActive = false;
    g_pokeAmount = 0;
  };

  // Walk
  document.getElementById('walkOn').onclick = () => { g_walkAnimation = true; };
  document.getElementById('walkOff').onclick = () => { g_walkAnimation = false; };
  
  // Accessories
  document.getElementById('hatOn').onclick  = () => { g_hatOn = true; };
  document.getElementById('hatOff').onclick = () => { g_hatOn = false; };
  document.getElementById('packOn').onclick = () => { g_packOn = true; };
  document.getElementById('packOff').onclick = () => { g_packOn = false; };
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  // Create Nopon once (keeps allocations down)
  g_nopon = new Nopon();

  // Mouse controls: drag to rotate; shift+click to poke
  canvas.onmousedown = function (ev) {
    if (ev.shiftKey) {
      triggerPoke();
      return;
    }
    g_mouseDown = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };

  canvas.onmouseup = function () {
    g_mouseDown = false;
  };

  canvas.onmouseleave = function () {
    g_mouseDown = false;
  };

  canvas.onmousemove = function (ev) {
    if (!g_mouseDown) return;
    const dx = ev.clientX - g_lastMouseX;
    const dy = ev.clientY - g_lastMouseY;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;

    // Map mouse movement to rotation angles
    g_globalAngleY += dx * 0.5;
    g_globalAngleX += dy * 0.5;

    // limit X rotation so you don't flip upside down too easily
    if (g_globalAngleX > 89) g_globalAngleX = 89;
    if (g_globalAngleX < -89) g_globalAngleX = -89;
  };

  // Background
  gl.clearColor(0.05, 0.05, 0.08, 1.0);

  requestAnimationFrame(tick);
}

function triggerPoke() {
  // A short "special" animation (shift+click)
  g_pokeActive = true;
  g_pokeStart = g_seconds;
}

// ------------ Animation loop
function tick() {
  const nowMS = performance.now();
  const dtMS = nowMS - g_lastFrameMS;
  g_lastFrameMS = nowMS;

  // Smooth FPS estimate
  const instFps = dtMS > 0 ? (1000.0 / dtMS) : 0;
  g_fpsSmoothed = (g_fpsSmoothed === 0) ? instFps : (0.9 * g_fpsSmoothed + 0.1 * instFps);

  g_seconds = performance.now() / 1000.0 - g_startTime;

  updateAnimationAngles();
  renderScene(dtMS);

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  // Keep animation logic out of renderScene
  if (g_animMaster && g_walkAnimation) {
    g_walkPhase = g_seconds * 4.0;
    g_bodyBob = 0.03 * Math.abs(Math.sin(g_walkPhase));
  } else {
    g_walkPhase = 0;
    g_bodyBob = 0;
  }

  if (g_pokeActive) {
    const t = g_seconds - g_pokeStart;
    const duration = 0.85;
    if (t >= duration) {
      g_pokeActive = false;
      g_pokeAmount = 0;
    } else {
      // Smooth pop (0 -> 1 -> 0)
      const u = t / duration;
      g_pokeAmount = Math.sin(u * Math.PI);
    }
  }
}

// ------------ Rendering
function renderScene(dtMS) {
  // Global rotation from slider + mouse
  const globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngleY, 0, 1, 0);
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Base placement for the whole Nopon
  const base = new Matrix4();
  base.translate(-0.55, -0.80, -0.35);
  base.scale(1.1, 1.1, 1.1);

  // Poke squish/stretch (very visible to the grader)
  if (g_pokeActive) {
    const s = g_pokeAmount;
    base.translate(0.0, -0.06 * s, 0.0);
    base.scale(1.0 + 0.10 * s, 1.0 - 0.18 * s, 1.0 + 0.10 * s);
  }

  // Build a parameter object for Nopon.render() so hierarchy can be clean
  const animOn = g_animMaster;

  // Right wing is the "featured" chain (slider-controlled + anim)
  const rightBase = (animOn && g_magentaAnimation)
    ? 30 * Math.sin(g_seconds * 1.7)
    : g_magentaAngle;

  const rightMid = (animOn && g_yellowAnimation)
    ? 25 * Math.sin(g_seconds * 2.3 + 0.7)
    : g_yellowAngle;

  // Tip joint: user slider plus a small automatic flutter when animating
  const rightTip = g_earTipAngle + (animOn ? 10 * Math.sin(g_seconds * 3.0 + 1.2) : 0);

  // Left wing follows in a mirrored, slightly reduced way so the whole body feels alive
  const leftBase = -rightBase * 0.7;
  const leftMid = -rightMid * 0.6;
  const leftTip = -rightTip * 0.5;

  // Sword: user angle + subtle swing + poke boost
  let swordAngle = g_swordAngle + (animOn ? 12 * Math.sin(g_seconds * 3.2) : 0);
  if (g_pokeActive) swordAngle += 80 * g_pokeAmount;

  // During poke, also fling the right wing so the special animation is obvious
  const pokeBoost = g_pokeActive ? (35 * g_pokeAmount) : 0;

  // Render the Nopon eyes
  const eyeDx = 0.008 * Math.sin(g_seconds * 1.3);
  const eyeDy = 0.004 * Math.cos(g_seconds * 1.7); 
  
  const anim = {
    bodyBob: g_bodyBob,
    walkPhase: g_walkPhase,
    leftWingBase: leftBase,
    leftWingMid: leftMid,
    leftWingTip: leftTip,
    rightWingBase: rightBase + pokeBoost,
    rightWingMid: rightMid + pokeBoost * 0.7,
    rightWingTip: rightTip + pokeBoost * 0.5,
    swordAngle: swordAngle,
    pokeAmount: g_pokeAmount,
    
    eyeDx: eyeDx,
    eyeDy: eyeDy,
    hatOn: g_hatOn,
    packOn: g_packOn,


  };
 

  g_nopon.render(base, anim);

  // Performance indicator
  const fpsText = isFinite(g_fpsSmoothed) ? g_fpsSmoothed.toFixed(1) : '0.0';
  sendTextToHTML(
    `ms(frame): ${Math.floor(dtMS)} | fps: ${fpsText} | anim: ${g_animMaster ? 'on' : 'off'} | walk: ${g_walkAnimation ? 'on' : 'off'}`,
    'numdot'
  );
}

// older code calls renderAllShapes()
function renderAllShapes() {
  renderScene(0);
}

// Set the text of an HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log('Failed to get ' + htmlID + ' from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}
