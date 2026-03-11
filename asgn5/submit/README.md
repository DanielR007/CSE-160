# Assignment 5: Exploring a High-Level Graphics Library

Name: Daniel Rothman
Email: dmrothma@ucsc.edu
Notes to Grader
This project is a 3D exhibit and playable mini-game created using Three.js, fulfilling all the requirements outlined in Assignment 5.

## Rubric Fulfillment Breakdown

### Basic scene is working (2 pts)
The scene successfully initializes a perspective camera, directional lighting, and an extensive array of primary geometric shapes. Animation is heavily utilized throughout: the floating artifacts orbit and spin constantly, and the custom-built Nopon characters have complex hierarchical idle and running animations applied to their limbs, ears, and accessories using `Math.sin(time)`. 

### At least one primary shape is textured (1 pt)
Textures are used heavily. The scene features a ground floor mapped with a repeating rocky terrain texture, outer walls mapped with metal and brick textures, and several banners mapped with wood textures. There is also a variety of 2D artwork mapped onto flat plane geometries throughout the museum.

### Custom textured 3D model (glb/gltf/obj) (1 pt)
The scene dynamically loads four different custom 3D models using `GLTFLoader` and `OBJLoader`:
1. Mazda RX-7 (`.glb`)
2. Mclaren Senna (`.glb`)
3. Duck (`.glb` imported directly from the KhronosGroup master repository)
4. Base Triangle Structure (`.obj`)

### Move the camera with controls (1 pt)
The project utilizes two completely distinct control schemes depending on the state of the application:
1. **Orbit Mode:** Uses the built-in Three.js `OrbitControls` to drag, pan, and zoom around the museum interactively.
2. **Game Mode:** Features a fully custom First-Person/Pointer-Lock control scheme allowing W/A/S/D movement, mouse look, and sprinting, complete with custom collision detection against the walls and pillars in the scene.

### At least 3 different light sources (1 pt)
The lighting is managed via a GUI and includes:
1. **DirectionalLight:** Acts as the primary sun/stage key light.
2. **HemisphereLight:** Provides ambient sky and ground illumination.
3. **SpotLight:** Used as a dynamic, moving "Showcase" light that orbits the exhibits, and converts into a high-intensity tracking "helicopter beam" when chasing the Nopon in Game Mode.

### Have a skybox (1 pt)
A full 360-degree skybox is implemented via `CubeTextureLoader` using 6 separate `.jpg` images mapped to `scene.background` and `scene.environment`. 

### At least 20 primary shapes (1 pt)
The scene goes far beyond 20 primary shapes. There are 20 stone pillars alone (cylinders and spheres), multiple bounding walls (boxes), banners (cylinders and planes), floating artifacts (toruses, icosahedrons, spheres, cylinders), glowing exhibit pedestals (cylinders, toruses, circles), and a giant transparent boundary cylinder. The custom Nopon characters are also built entirely from scratch using dozens of grouped primary shapes (capsules, cones, spheres, boxes).

### Wow Point / Extra Feature (1.5 pts)
**Custom Mini-Game Mode with Music & AI ("Nopon Sacred Hunt")**
Instead of just a static viewing gallery, the scene features a fully playable first-person catch game. By clicking the canvas to enter "Game Mode", the user takes First-Person control (complete with collision detection). A smaller "Prey Nopon" spawns in the map and utilizes an AI script to actively calculate its distance from the player, flee backwards (while maintaining eye contact in panic), and smoothly slide along the outer cylindrical boundary walls to avoid getting stuck. Catching the Nopon triggers a custom particle physics explosion.

Additionally, the project features a fully functional GUI utilizing `lil-gui` to toggle different lighting "Presets" (like Cyberpunk or Stage Lights), cinematic auto-tours, and dynamic audio swapping based on the active mode.