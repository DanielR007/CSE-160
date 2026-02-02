# CSE 160 — Assignment 2: Blocky 3D Animal (Nopon)

Daniel Rothman dmrothma@ucsc.edu

This project implements a blocky 3D Nopon (Xenoblade-inspired) using hierarchical modeling in WebGL.
The model is built primarily from cubes, with a non-cube cylinder primitive used for the feet (and sword grip).

## Live Demo
- GitHub Pages URL: <Link>

## Controls
- Mouse drag: rotate the camera (mouse yaw/pitch).
- Shift + click: “poke” animation (special reaction).
- Camera Y Rotation slider: global rotation around Y.

### Joint Sliders (hierarchy)
- Ear Wings Base (old Magenta slider): base joint (closest to body)
- Ear Wings Mid (old Yellow slider): second joint (mid segment)
- Ear Wings Tip (3rd Joint): third joint (tip segment)
- Sword Angle (User): optional user swing angle

### Buttons
- Anim On / Anim Off: toggles the main animation
- Walk Cycle On / Off: toggles leg stepping/walk cycle
- Hat On / Hat Off: toggles hat accessory
- Pack On / Pack Off: toggles backpack accessory

## Rubric Mapping 
- Cube drawing isolated in one place:
  - `Cube.js` renders cubes using a provided model matrix (`u_ModelMatrix`) and color (`u_FragColor`).
  - `Nopon.js` reuses a single Cube instance via `_drawCube(matrix, color)`.

- Vertex shader uses matrices:
  - `gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position`

- Global rotation:
  - Slider-driven camera rotation + mouse drag rotation (yaw/pitch)

- Single render function:
  - `renderScene()` draws the full Nopon and clears color+depth.

- 8+ parts:
  - Egg/body slices, belly patch, cheeks, eyes (white/iris/pupil/highlight), nose, mouth, wings (3 segments), feather-fingers, sword, feet cylinders, plus optional hat/backpack.

- Two joints in a chain (and more):
  - Wing/Ear base + mid + tip joints are implemented and slider-controlled.

- Tick + animation:
  - `tick()` with `requestAnimationFrame`
  - `updateAnimationAngles()` drives natural movement

- Animation toggle:
  - Buttons to enable/disable animation (and walk cycle separately)

- Color:
  - Per-part palette set via `u_FragColor` (fur, belly, cheeks, eyes, sword colors)

- Third-level joint:
  - “Ear Wings Tip (3rd Joint)” slider

- Non-cube primitive:
  - Cylinder primitive implemented in `Nopon.js` and used for feet (and sword grip)

- Poke animation:
  - Shift + click triggers a different animation sequence

- Mouse control:
  - Drag-to-rotate camera

- Performance + FPS indicator:
  - `drawTriangle3D()` uses a single reusable global buffer (no createBuffer per triangle)
  - FPS displayed on the webpage

## Files
- `asg2.html` — UI + script includes
- `asg2.js` — WebGL setup, shaders, UI hooks, animation loop, `renderScene()`
- `Nopon.js` — Nopon model + hierarchy + cylinder primitive
- `Cube.js` — cube renderer
- `Triangle.js` — `drawTriangle3D()` with a reused global buffer
- `lib/` — cuon utils + matrix library

run oldasg2.hmtl to see all the prework that created the screen shots - based on professors youtube video.
