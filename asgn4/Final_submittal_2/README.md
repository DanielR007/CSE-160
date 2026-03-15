Assignment 4: Lighting and 3D Objects
Name: Daniel Rothman
Email: dmrothma@ucsc.edu
Notes to Grader: I have implemented all standard requirements, including an imported `.obj` file and an advanced Spotlight implementation. 

---

How to Use the Interface
The UI has been divided into a two-column layout for ease of use. 
* Left Column: Controls the Camera angle and provides quick toggles to hide/show complex geometry (BMW, Nopon, Robot Arm) to observe lighting on individual items.
* Right Column: Contains all Master Lighting controls, Spotlight targeting, and hierarchical animation controls. 

---

Rubric Checklist & Implementations

1. Normals Implemented on All Objects
* All custom shapes have been upgraded to send normal vectors to the GPU.
* `Cube.js` implements flat face normals for sharp, blocky shading.
* `Sphere.js` calculates smooth surface normals (`Math.cos` / `Math.sin` derivations) for perfect, continuous gradient lighting.
* `Nopon.js` feet (Cylinders) have been upgraded to calculate face and cap normals. 

2. Full Lighting Pipeline (Ambient, Diffuse, Specular)
* The Fragment Shader utilizes the Blinn-Phong reflection model.
* **Ambient:** Calculates baseline world light.
* **Diffuse (N dot L):** Uses the dot product of the surface normal and the light vector to create directional shading.
* **Specular:** Calculates the reflection vector against the eye (camera) vector to generate shiny highlights (`pow(max(dot(E, R), 0.0), 64.0)`).

3. Real-Time Lighting UI & Controls
* **Light X/Y/Z Sliders:** Dynamically move the light source vector in 3D space in real-time.
* **Light ON/OFF Toggle:** A master uniform switch that safely disables all lighting math and falls back to base colors/textures.

4. Normal Visualization (Rainbow Rendering)
* By clicking the **Normals ON** button, the `textureNum` uniform is set to `-3`. 
* The fragment shader intercepts this and maps the object's normal vectors directly to RGB color output (`vec4((v_Normal+1.0)/2.0, 1.0)`). 
* This proves that the normal matrices are actively calculating and rotating alongside the geometry.

5. Spotlight Feature (Advanced Implementation)
* Implemented a directional spotlight with a dynamic Cutoff Cone.
* Uses the dot product between the light-to-vertex vector and a user-defined Spot Direction vector. 
* Includes 3 UI sliders to aim the flashlight (Spot Dir X, Y, Z) and a slider to widen or narrow the cone of light (Spot Angle). 
* *Note: As per standard WebGL Blinn-Phong limitations, this spotlight does not cast depth-mapped shadows.*

6. Imported 3D Model Loading (.OBJ)
* Created a custom `ObjModel.js` parser that asynchronously fetches and reads Wavefront `.obj` text files.
* Successfully parses `v` (vertices), `vn` (vertex normals), and `f` (faces) into a massive Float32Array.
* Bypasses standard drawing loops and utilizes High-Performance WebGL Buffers (`gl.drawArrays`) to render a ~12,500 vertex BMW M4 CSL model at 60 FPS without crashing the animation loop.

7. Hierarchical Animation Integration
* Successfully merged Assignment 2 (Nopon) and Assignment 3 (World) into a fully lit scene.
* Built an upright industrial Robot Arm utilizing strict "Skeleton and Meat" matrix mathematics. 
* The normal matrices are calculated independently *after* scaling to ensure lighting behaves correctly as joints rotate and swing.

---

Resources Used
* Matsuda & Lea, *WebGL Programming Guide* (Base math and standard lighting structure).
* Custom Wavefront `.obj` parser logic adapted for asynchronous JS fetching.
* BMW M4 CSL Model: Decimated and exported via Blender to optimize face counts for browser memory limits.