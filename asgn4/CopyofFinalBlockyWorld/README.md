# CSE 160 Assignment 3 — Nopon Hunter (Blocky World) Daniel Rothman (dmrothma@ucsc.edu)

A WebGL “blocky world” game where you explore a voxel map, place/break blocks using a crosshair, and hunt a Nopon that triggers an explosion when caught.

## How to Run
1. Put the project folder on a local web server (required for textures).
   - VS Code: install **Live Server**, right-click `World.html` → “Open with Live Server”
2. Confirm these files are in the same folder:
   - `World.html`, `World.js`, `Cube.js`, `Triangle.js`, `Camera.js`, `Nopon.js`
   - Textures (examples used):
     - `rocky_terrain_02_diff_1k.jpg`
     - `stone_wall_diff_1k.jpg`
     - `brick_wall_001_diffuse_1k.jpg`
     - `wood_planks_diff_1k.jpg`
     - `thatch_roof_angled_diff_1k.jpg`
     - `blue_metal_plate_diff_1k.jpg`
3. Open `World.html` in the browser through the server URL.

## Controls
### Pointer Lock / Mouse Look
- **Left click on the canvas** to enable pointer lock (mouse look).
- **ESC** releases pointer lock (so you can click UI / exit capture).

### Movement
- **W A S D**: move
- **Q / E**: turn (pan left/right)
- **G**: respawn to a safe spawn point
- **Fly Mode** (toggle via UI button):
  - **R / F**: up / down
  - Mouse pitch enabled in fly mode

### Block Actions (crosshair-based)
- **Left click**: break block
- **Right click**: place block  
  (Also: any non-left-click path places a block; shift-left can act like place depending on browser.)
- **1–4**: change active block type/material (stone/brick/wood/hay)

## Gameplay / Features
- **Voxel world (32×32×8)** stored as a true 3D array `g_map[x][y][z]`.
- **Crosshair UI**: centered “+” overlay on the canvas to show exactly where add/remove happens.
- **Raycast building/mining**:
  - A forward ray from the camera “hits” blocks up to a short range (~4 units).
  - Break removes the first solid block hit.
  - Place adds a block into the last empty cell just before the hit block.
  - Prevents placing inside the player.
- **Textured blocks**:
  - Ground/terrain, stone, brick, wood, hay/thatch, and metal textures.
- **Special blocks**:
  - **Bedrock** (ground layer) is invincible.
  - **Metal** is **indestructible** (used for perimeter and arches).
  - “Explosion damage” tiles render as dark red.
- **Nopon Hunter loop**:
  - Nopon moves/avoids player when close.
  - If you get within a catch radius, it triggers an explosion, increases score, then respawns elsewhere.
- **Collision system**:
  - Collision can be toggled ON/OFF in the UI.
  - Collision is automatically disabled in Fly Mode for smooth movement.
  - Respawn includes a short safety window to avoid “stuck in wall” freeze.
- **Particles**:
  - Explosion spawns debris particles with gravity and lifetime fade.
- **Performance HUD**:
  - Displays `ms` per frame and smoothed FPS.

## World Layout
The map is generated procedurally in `_initMap()`:
- Flat bedrock ground at `y=0` (terrain texture).
- Random “ruins” scattered around the map (stone/brick/wood).
- Two large metal arches.
- Metal perimeter walls (indestructible boundary).

Internally:
- `g_map[x][y][z]` holds a “texture/material id”:
  - `1` = terrain
  - `2` = stone
  - `3` = brick
  - `4` = wood
  - `5` = hay/thatch
  - `6` = metal (indestructible)
  - `7` = explosion scar (drawn solid dark red)

For rendering speed:
- `_rebuildWallBlockList()` converts the 3D grid into a flat `g_wallBlocks[]` draw list.

## Rubric Checklist (How Each Requirement Is Met)
Below is how this project maps to the usual Assignment 3 rubric items:

### 1) Blocky World / Map Storage
- The world is a voxel grid using a real 3D array: `g_map[x][y][z]`.
- World is at least 32×32 in X/Z with multiple Y layers (32×32×8).

### 2) Camera + Navigation
- First-person camera using `Camera.js`
- Keyboard movement: WASD
- Turn/pan left-right: **Q/E** (rubric requirement)
- Mouse look via pointer lock

### 3) Vertical Motion (if required by your rubric)
- Implemented in **Fly Mode** using **R/F** (up/down).
- If your rubric specifically requires **Space/Shift** for up/down, the mapping is a one-line change in `_updateCamera(dt)`:
  - Add:
    - `if (g_flyMode && (g_keys[' '] )) g_camera.upMove(speed);`
    - `if (g_flyMode && (g_keys['Shift'])) g_camera.downMove(speed);`
  - (Currently Shift is used as a speed modifier.)

### 4) Add / Remove Blocks
- Fully implemented with raycasting from the camera:
  - Break: left click
  - Place: right click
- Uses the crosshair as the user’s “cursor” so placement is predictable.
- Prevents placing blocks inside the player.

### 5) Multiple Block Types / Materials
- 4 selectable block materials via keys **1–4**
- Each material is visibly different (separate textures).

### 6) Texturing
- Multiple image textures loaded into separate texture units (terrain, stone, brick, wood, hay, metal).
- REPEAT wrapping enabled so textures tile cleanly.

### 7) A “Blocky Animal” / Custom Object
- Nopon is rendered via `Nopon.js` and placed in the world.
- Includes animation (bobbing) + orientation (faces player).

### 8) Animation / Interaction / Game Feature (A/A+ polish)
- Catching the Nopon triggers:
  - Score increment
  - Explosion that modifies the voxel world
  - Particle burst
  - Nopon respawn behavior
- This is beyond the base world requirements and is intended as “extra feature” polish.

### 9) Performance / Optimization
- World rendering uses a prebuilt draw list (`g_wallBlocks`) instead of scanning the full 3D grid every frame.
- Uses `renderfast()` for cubes.
- FPS and ms are displayed and smoothed (EMA), targeting ~60fps.

## Notes / Tips for the TA
- Click the canvas to enter pointer lock for mouse look.
- Use the centered crosshair to build/break blocks (short range).
- Toggle Fly Mode to inspect structures from above.
- Metal blocks cannot be broken; bedrock cannot be removed.

## Known Non-Issues
- `favicon.ico` 404 can show up on some servers; it does not affect grading or functionality.
