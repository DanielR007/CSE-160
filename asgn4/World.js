// World.js — Nopon Hunter (Asgn 3.5)
// Updated: No Collision in Fly Mode, Metal Indestructible, Safe Respawn

var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  
  // Texture Units
  uniform sampler2D u_Sampler0; 
  uniform sampler2D u_Sampler1; 
  uniform sampler2D u_Sampler2; 
  uniform sampler2D u_Sampler3; 
  uniform sampler2D u_Sampler4; 
  uniform sampler2D u_Sampler5; 
  uniform sampler2D u_Sampler6; 
  
  uniform int u_whichTexture;

  void main() {
    if (u_whichTexture == -2) {       // Solid Color
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) { // UV Debug
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {  
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {  
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {  
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {  
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else if (u_whichTexture == 4) {  
      gl_FragColor = texture2D(u_Sampler4, v_UV);
    } else if (u_whichTexture == 5) {  
      gl_FragColor = texture2D(u_Sampler5, v_UV);
    } else if (u_whichTexture == 6) {  
      gl_FragColor = texture2D(u_Sampler6, v_UV);
    } else {
      gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); 
    }
  }
`;

// Global GL variables
let canvas, gl;
let a_Position, a_UV;
let u_FragColor, u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;
let u_whichTexture;
let u_Samplers = []; 

// World State
let g_camera = null;
let g_keys = {}; 
let g_collision = true;
let g_flyMode = false; // Start in GAME MODE
let g_recentRespawnTimer = 0; // Safety timer to prevent freeze on spawn

// 3D Voxel Game State
const WORLD_SIZE = 32; 
const WORLD_HEIGHT = 8;
const HALF = WORLD_SIZE / 2;
let g_map = []; 
let g_wallBlocks = []; 

// Particles
let g_particles = [];

// Nopon Hunter State
let g_nopon = {
  pos: { x: 18, y: 1, z: 18 },
  timer: 0,
  state: 'alive', 
  deathTimer: 0,
  startY: 0
};
let g_score = 0;

// Building State
let g_selectedBlockType = 2; 

// Performance
let g_prevT = performance.now();
let g_fpsEMA = 60;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) return console.log('Failed to get WebGL context');
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) return;

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');

  for(let i=0; i<=6; i++){
    u_Samplers[i] = gl.getUniformLocation(gl.program, `u_Sampler${i}`);
  }

  let id = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, id.elements);
}

function loadTexture(src, unit, sampler) {
  const img = new Image();
  img.onload = () => {
    const tex = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(sampler, unit);
  };
  img.onerror = () => { console.log(`Failed to load ${src}`); };
  img.src = src;
}

function initTextures() {
  loadTexture('rocky_terrain_02_diff_1k.jpg', 1, u_Samplers[1]); 
  loadTexture('stone_wall_diff_1k.jpg', 2, u_Samplers[2]);       
  loadTexture('brick_wall_001_diffuse_1k.jpg', 3, u_Samplers[3]); 
  loadTexture('wood_planks_diff_1k.jpg', 4, u_Samplers[4]);       
  loadTexture('thatch_roof_angled_diff_1k.jpg', 5, u_Samplers[5]); 
  loadTexture('blue_metal_plate_diff_1k.jpg', 6, u_Samplers[6]); 
}

// ---------------- INPUT HANDLERS ----------------
function _installKeyHandlers() {
  window.addEventListener('keydown', (e) => {
    g_keys[e.key] = true;
    if (e.key === '1') setBlockType(2, "Stone [1]");
    if (e.key === '2') setBlockType(3, "Brick [2]"); 
    if (e.key === '3') setBlockType(4, "Wood [3]");   
    if (e.key === '4') setBlockType(5, "Hay [4]"); 
    if(e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => g_keys[e.key] = false);
}

function setBlockType(texNum, name) {
  g_selectedBlockType = texNum;
  let el = document.getElementById('blockBox');
  if(el) el.innerText = "Active: " + name;
}

window.toggleCollision = function() {
  g_collision = !g_collision;
  document.getElementById('collisionBtn').innerText = 
    "Collision: " + (g_collision ? "ON" : "OFF");
};

window.toggleMode = function() {
  g_flyMode = !g_flyMode;
  let disp = document.getElementById('modeDisplay');
  let btn = document.getElementById('modeBtn');
  let flyTxt = document.getElementById('flyInfo');
  
  if(g_flyMode) {
    disp.innerText = "FLY MODE";
    disp.style.background = "#2a2";
    btn.innerText = "SWITCH TO GAME MODE";
    if(flyTxt) flyTxt.style.display = "inline";
  } else {
    disp.innerText = "GAME MODE";
    disp.style.background = "#444";
    btn.innerText = "SWITCH TO FLY MODE";
    if(flyTxt) flyTxt.style.display = "none";
    
    resetPlayerToSpawn();
  }
};

function resetPlayerToSpawn() {
    // Hard reset camera vectors to ensure no NaN/Invalid state
    g_camera.eye = new Vec3(0, 2.5, 0);
    g_camera.at = new Vec3(0, 2.5, 4); // Look +Z
    g_camera.up = new Vec3(0, 1, 0);
    
    g_keys = {}; // Clear keys
    g_recentRespawnTimer = 500; // Disable collision for 500ms to prevent sticky freeze
}

function _installMouseHandlers() {
  canvas.onclick = () => canvas.requestPointerLock();
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener("mousemove", _onMouseMoveLock, false);
      document.addEventListener("mousedown", _onMouseClickLock, false);
    } else {
      document.removeEventListener("mousemove", _onMouseMoveLock, false);
      document.removeEventListener("mousedown", _onMouseClickLock, false);
    }
  });
}

function _onMouseMoveLock(e) {
  const sens = 0.1; 
  g_camera.panRight(-e.movementX * sens);
  if (g_flyMode) {
    g_camera.panUp(e.movementY * sens);
  }
}

function _onMouseClickLock(e) {
  if (e.button === 0 && !e.shiftKey) {
    modifyWorld(false); 
  } else {
    modifyWorld(true);  
  }
}

// ---------------- GAME LOGIC ----------------

function modifyWorld(isAdd) {
  let p = new Vec3(g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);
  let f = g_camera.at.sub(g_camera.eye).norm();
  
  if (_raycast(p, f, isAdd)) return; 

  if (!g_flyMode) {
    let downF = new Vec3(f.x, -0.7, f.z).norm(); 
    _raycast(p, downF, isAdd);
  }
}

function _raycast(origin, dir, isAdd) {
  let step = 0.1;
  let prevX = -1, prevY = -1, prevZ = -1;

  for (let t = 0; t < 4.0; t += step) {
    let curr = origin.add(dir.mul(t));
    let x = Math.round(curr.x) + HALF;
    let y = Math.round(curr.y);
    let z = Math.round(curr.z) + HALF;

    // Check Player Position (Don't build on self)
    let px = Math.round(g_camera.eye.x) + HALF;
    let pz = Math.round(g_camera.eye.z) + HALF;

    if (x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_HEIGHT && z >= 0 && z < WORLD_SIZE) {
      if (g_map[x][y][z] > 0) { 
        if (isAdd) {
          if (prevX >= 0 && prevY >= 0 && prevZ >= 0 && prevY < WORLD_HEIGHT && g_map[prevX][prevY][prevZ] === 0) {
            if (prevX === px && prevZ === pz && Math.abs(prevY - g_camera.eye.y) < 1.5) {
               showMsg("Blocked by player!");
               return true;
            }
            if (prevY > 0) {
              g_map[prevX][prevY][prevZ] = g_selectedBlockType;
              showMsg("Block Placed!");
              _rebuildWallBlockList();
              return true;
            }
          }
        } else {
          // Break Logic
          let val = g_map[x][y][z];
          
          if (val === 6) { // METAL (6) IS INDESTRUCTIBLE
             showMsg("Metal is Indestructible!");
             return true;
          }
          if (val === 7) { // Red Damage
             showMsg("Already destroyed!");
             return true;
          }

          if(y > 0) {
             g_map[x][y][z] = 0;
             showMsg("Block Removed!");
             _rebuildWallBlockList();
             return true;
          } else {
             showMsg("Bedrock is invincible!");
             return true; 
          }
        }
        return true; 
      }
      prevX = x; prevY = y; prevZ = z;
    }
  }
  return false;
}

function showMsg(text) {
  let el = document.getElementById('message');
  if(el) {
    el.innerText = text;
    el.style.opacity = 1;
    setTimeout(() => el.style.opacity = 0, 1000);
  }
}

// ---------------- PARTICLES ----------------
class Particle {
  constructor(x, y, z) {
    this.x = x; this.y = y; this.z = z;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random()) * 0.3 + 0.1; 
    this.vz = (Math.random() - 0.5) * 0.3;
    this.life = 1.0; 
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.vy -= 0.015; 
    this.life -= 0.02; 
    if (this.y < 1) { 
      this.y = 1; this.vy *= -0.5; this.vx *= 0.8; this.vz *= 0.8;
    }
  }
}

function spawnExplosion(cx, cy, cz) {
  for(let i=0; i<40; i++) g_particles.push(new Particle(cx, cy, cz));
}

// ---------------- NOPON LOGIC ----------------
function _explode(cx, cy, cz) {
  spawnExplosion(cx, cy, cz); 

  for(let x = cx - 2; x <= cx + 2; x++) {
    for(let z = cz - 2; z <= cz + 2; z++) {
      if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
         if (x >= 0 && x < WORLD_SIZE && z >= 0 && z < WORLD_SIZE) {
            g_map[x][0][z] = 7; 
         }
      }
      for(let y = cy - 2; y <= cy + 2; y++) {
        if(x >= 0 && x < WORLD_SIZE && z >= 0 && z < WORLD_SIZE && y > 0 && y < WORLD_HEIGHT) {
          if (g_map[x][y][z] > 0) {
             if(x===0 || x===WORLD_SIZE-1 || z===0 || z===WORLD_SIZE-1) {
                g_map[x][y][z] = 7; 
                if (y > 1 && Math.random() < 0.5) g_map[x][y][z] = 0;
             } else {
                // Don't destroy Metal (6) or already Red (7)
                if (g_map[x][y][z] !== 6 && g_map[x][y][z] !== 7) {
                   if(Math.random() < 0.9) g_map[x][y][z] = 0; 
                }
             }
          }
        }
      }
    }
  }
  _rebuildWallBlockList();
}

function _updateNopon(dt) {
  // Exploded State
  if (g_nopon.state === 'exploded') {
    g_nopon.cooldown += dt;
    // Wait 1 second
    if (g_nopon.cooldown > 1000) { 
        g_nopon.state = 'alive';
        g_nopon.cooldown = 0;
        
        // 1. Reset Player
        //resetPlayerToSpawn();
        
        // 2. Reset Nopon
        let found = false;
        for(let i=0; i<50; i++) {
          let rx = Math.floor(Math.random() * (WORLD_SIZE-6)) + 3;
          let rz = Math.floor(Math.random() * (WORLD_SIZE-6)) + 3;
          if (Math.abs(rx-16) > 5 || Math.abs(rz-16) > 5) {
             if (g_map[rx]) {
                // Find a cleared ground-level y: empty cell with solid block underneath
                let spawnY = 1;
                for (let y = WORLD_HEIGHT - 1; y >= 1; y--) {
                  if (g_map[rx][y] && g_map[rx][y][rz] === 0 && g_map[rx][y-1] && g_map[rx][y-1][rz] > 0) {
                    spawnY = y;
                    break;
                  }
                }
                // Only accept spawn if the chosen top cell is empty
                if (g_map[rx][spawnY] && g_map[rx][spawnY][rz] === 0) {
                  g_nopon.pos.x = rx;
                  g_nopon.pos.z = rz;
                  g_nopon.pos.y = spawnY;
                  found = true;
                  break;
                }
             }
          }
        }
        if (!found) { g_nopon.pos.x = 28; g_nopon.pos.z = 28; g_nopon.pos.y = 1; }
    }
    return; 
  }

  // Alive State
  g_nopon.timer += dt;
  let dx = g_camera.eye.x - (g_nopon.pos.x - HALF);
  let dz = g_camera.eye.z - (g_nopon.pos.z - HALF);
  let dy = g_camera.eye.y - (g_nopon.pos.y - 0.5);
  let dist = Math.sqrt(dx*dx + dz*dz + dy*dy);

  if (dist < 3.0) {
    g_score++;
    document.getElementById('scoreBox').innerText = "Caught: " + g_score;
    showMsg("EXPLOSION!");
    
    // Boom
    _explode(Math.round(g_nopon.pos.x), Math.round(g_nopon.pos.y), Math.round(g_nopon.pos.z));
    
    // Set State
    g_nopon.state = 'exploded';
    g_nopon.cooldown = 0;
  }

  // AI Movement
   if (g_nopon.timer > 200) { 
   g_nopon.timer = 0;
   if (dist < 8.0) { 
    let moveX = (dx > 0) ? -1 : 1;
    let moveZ = (dz > 0) ? -1 : 1;
    let nx = Math.round(g_nopon.pos.x) + moveX;
    let nz = Math.round(g_nopon.pos.z) + moveZ;

    if(nx > 1 && nx < WORLD_SIZE-2 && nz > 1 && nz < WORLD_SIZE-2) {
      let ny = Math.floor(g_nopon.pos.y);
      if (ny < 0) ny = 0;
      if (ny >= WORLD_HEIGHT) ny = WORLD_HEIGHT - 1;

      if (g_map[nx] && g_map[nx][ny] && g_map[nx][ny][nz] === 0) {
        g_nopon.pos.x = nx;
        g_nopon.pos.z = nz;
      } else if (ny < WORLD_HEIGHT-1 && g_map[nx] && g_map[nx][ny+1] && g_map[nx][ny+1][nz] === 0) {
        g_nopon.pos.x = nx;
        g_nopon.pos.z = nz;
        g_nopon.pos.y = ny + 1;
      }
    }
   }

   // Gravity / support checks — use integer, checked indices
   let px = Math.round(g_nopon.pos.x);
   let py = Math.floor(g_nopon.pos.y);
   let pz = Math.round(g_nopon.pos.z);
   if (py > 0 && g_map[px] && g_map[px][py-1] && g_map[px][py-1][pz] === 0) {
     g_nopon.pos.y--;
   } else if (g_map[px] && g_map[px][py] && g_map[px][py][pz] > 0) {
     g_nopon.pos.y++;
   }
  }
}

// ---------------- MAP GENERATION ----------------
function _initMap() {
  g_map = new Array(WORLD_SIZE);
  for (let x = 0; x < WORLD_SIZE; x++) {
    g_map[x] = new Array(WORLD_HEIGHT);
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      g_map[x][y] = new Array(WORLD_SIZE).fill(0);
    }
  }

  for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
      g_map[x][0][z] = 1; 
    }
  }

  for(let i=0; i<30; i++) {
     let rx = Math.floor(Math.random() * (WORLD_SIZE-6)) + 3;
     let rz = Math.floor(Math.random() * (WORLD_SIZE-6)) + 3;
     if (Math.abs(rx - 16) > 5 || Math.abs(rz - 16) > 5) {
        _buildRuin(rx, rz);
     }
  }

  _buildArch(8, 8, 14, 8, 6);
  _buildArch(20, 24, 26, 24, 6);
  
  for(let i=0; i<WORLD_SIZE; i++) {
    for(let y=1; y<=3; y++) {
      g_map[i][y][0] = 6;
      g_map[i][y][WORLD_SIZE-1] = 6;
      g_map[0][y][i] = 6;
      g_map[WORLD_SIZE-1][y][i] = 6;
    }
  }
  
  _rebuildWallBlockList();
}

function _buildRuin(cx, cz) {
   let type = Math.floor(Math.random() * 3);
   for(let x=cx; x<cx+3; x++) {
     for(let z=cz; z<cz+3; z++) {
       if(Math.random()>0.5) g_map[x][1][z] = type + 2; 
       if(Math.random()>0.7) g_map[x][2][z] = type + 2;
     }
   }
}

function _buildArch(x1, z1, x2, z2, height) {
  for(let y=1; y<height; y++) {
    g_map[x1][y][z1] = 6;
    g_map[x2][y][z2] = 6;
  }
  if(x1 === x2) { 
     for(let z=Math.min(z1,z2); z<=Math.max(z1,z2); z++) g_map[x1][height][z] = 6;
  } else { 
     for(let x=Math.min(x1,x2); x<=Math.max(x1,x2); x++) g_map[x][height][z1] = 6;
  }
}

function _rebuildWallBlockList() {
  g_wallBlocks = [];
  for (let x = 0; x < WORLD_SIZE; x++) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        let tex = g_map[x][y][z];
        if (tex > 0) {
          g_wallBlocks.push({ 
            x: x - HALF, 
            y: y, 
            z: z - HALF, 
            tex: tex 
          });
        }
      }
    }
  }
}

// ---------------- CAMERA & RENDER ----------------
function _initCamera() {
  g_camera = new Camera();
  g_camera.eye = new Vec3(0, 2.5, 0); 
  g_camera.at = new Vec3(0, 2.5, 4); 
}

function checkCollision(pos) {
  let x = Math.round(pos.x) + HALF;
  let y = Math.floor(pos.y); 
  let z = Math.round(pos.z) + HALF;

  if (x >= 0 && x < WORLD_SIZE && z >= 0 && z < WORLD_SIZE) {
    if (y >= 0 && y < WORLD_HEIGHT && g_map[x][y][z] > 0) return true;
    let footY = Math.floor(pos.y - 0.5);
    if (footY >= 0 && footY < WORLD_HEIGHT && g_map[x][footY][z] > 0) return true;
  } else {
    return true; 
  }
  return false;
}

function _updateCamera(dt) {
  // Safety timer: Decrease it. If > 0, we disable collision this frame
  if (g_recentRespawnTimer > 0) g_recentRespawnTimer -= dt;

  let speed = (g_keys['Shift'] && !g_keys['mousedown']) ? 0.4 : 0.15;
  let oldEye = new Vec3(g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);
  let oldAt  = new Vec3(g_camera.at.x, g_camera.at.y, g_camera.at.z);

  if(g_keys['w'] || g_keys['W']) g_camera.forward(speed);
  if(g_keys['s'] || g_keys['S']) g_camera.back(speed);
  if(g_keys['a'] || g_keys['A']) g_camera.left(speed);
  if(g_keys['d'] || g_keys['D']) g_camera.right(speed);
  
  if (g_flyMode) {
    if(g_keys['r'] || g_keys['R']) g_camera.upMove(speed);
    if(g_keys['f'] || g_keys['F']) g_camera.downMove(speed);
  } else {
    g_camera.eye.y = 2.5; 
    let f = g_camera.at.sub(g_camera.eye);
    f.y = 0; 
    g_camera.at = g_camera.eye.add(f.norm());
  }

  // COLLISION (If enabled AND we are not in the safety respawn window)
  // Disable Collision totally in FLY MODE
  if (g_collision && !g_flyMode && g_recentRespawnTimer <= 0) {
    if (checkCollision(g_camera.eye)) {
      g_camera.eye = oldEye;
      g_camera.at  = oldAt;
      if (checkCollision(g_camera.eye)) {
         g_camera.eye.y += 1.0; 
         g_camera.at.y += 1.0;
      }
    }
  }
  
  if(g_keys['q'] || g_keys['Q']) g_camera.panRight(3);  
  if(g_keys['e'] || g_keys['E']) g_camera.panLeft(3);  
  
  if(g_keys['g'] || g_keys['G']) resetPlayerToSpawn();
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let proj = new Matrix4();
  proj.setPerspective(60, canvas.width/canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, proj.elements);

  let view = new Matrix4();
  view.setLookAt(
    g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
    g_camera.at.x, g_camera.at.y, g_camera.at.z,
    g_camera.up.x, g_camera.up.y, g_camera.up.z
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);

  let sky = new Cube();
  sky.color = [0.5, 0.75, 1.0, 1.0]; 
  sky.textureNum = -2; 
  sky.matrix.translate(g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);
  sky.matrix.scale(80, 80, 80);
  sky.matrix.translate(-0.5, -0.5, -0.5); 
  gl.depthMask(false);
  sky.renderfast();
  gl.depthMask(true);

  let wallCube = new Cube();
  for(let b of g_wallBlocks) {
    if (b.tex === 7) { 
      wallCube.color = [0.5, 0.0, 0.0, 1.0]; // Dark Red
      wallCube.textureNum = -2; 
    } else {
      wallCube.textureNum = b.tex;
    }
    
    wallCube.matrix.setIdentity();
    wallCube.matrix.translate(b.x, b.y, b.z); 
    wallCube.matrix.translate(-0.5, 0, -0.5); 
    wallCube.renderfast();
  }

  // Particles (Dark Red)
  let particleCube = new Cube();
  particleCube.color = [0.6, 0.0, 0.0, 1.0]; 
  particleCube.textureNum = -2; 
  for (let p of g_particles) {
    if (p.life > 0) {
      particleCube.matrix.setIdentity();
      particleCube.matrix.translate(p.x - HALF, p.y, p.z - HALF);
      particleCube.matrix.scale(0.15, 0.15, 0.15); 
      particleCube.renderfast();
    }
  }

  // Render Nopon (Only if alive)
  if(typeof g_nopon !== 'undefined' && g_wallBlocks && g_nopon.state !== 'exploded') {
    let m = new Matrix4();
    m.translate(g_nopon.pos.x - HALF, g_nopon.pos.y - 0.2, g_nopon.pos.z - HALF); 
    m.scale(1.5, 1.5, 1.5); 
    
    let bob = Math.sin(performance.now() / 150) * 0.2; 
    m.translate(0, bob, 0);
    let dx = g_camera.eye.x - (g_nopon.pos.x - HALF);
    let dz = g_camera.eye.z - (g_nopon.pos.z - HALF);
    let angle = Math.atan2(dx, dz) * (180/Math.PI);
    m.rotate(angle, 0, 1, 0);
    
    if (window.g_noponInstance) window.g_noponInstance.render(m);
  }
}

function tick() {
  let now = performance.now();
  let dt = now - g_prevT;
  g_prevT = now;
  
  _updateCamera(dt);
  _updateNopon(dt);
  
  for (let p of g_particles) p.update();
  g_particles = g_particles.filter(p => p.life > 0);

  renderScene();
  
  let fps = 1000/dt;
  g_fpsEMA = g_fpsEMA * 0.9 + fps * 0.1;
  document.getElementById('numdot').innerText = `ms: ${dt.toFixed(1)} | FPS: ${g_fpsEMA.toFixed(0)}`;
  requestAnimationFrame(tick);
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initTextures();
  _initCamera();
  _installKeyHandlers();
  _installMouseHandlers();
  _initMap(); 
  window.g_noponInstance = new Nopon();
  requestAnimationFrame(tick);
}