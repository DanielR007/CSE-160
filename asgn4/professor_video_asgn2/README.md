CSE 160 Assignment 2: Blocky 3D Animal
Student Name: Daniel Rothman Email: dmrothma@ucsc.edu Date: January 2026

Description
This project is a WebGL-based drawing application that allows users to create points, triangles, circles, and a custom "Koco" character from Sonic Frontiers. The application features interactive sliders for color, size, and segmentation, as well as a fully animated mode.

File Directory
Final Submission
asg1.html / asg1.js: The core assignment submission. This includes:

Canvas drawing logic.

UI interactions (Points, Triangles, Circles).

The static Koco drawing implementation using Koco.js.

Koco.js: The custom class that defines the Koco character using coordinate geometry and hierarchical transformations (Body, Arms, Legs, Leaves).

Something Awesome (Animation)
awesome.html / awesome.js: A modified version of the project that implements a 60 FPS animation loop.

Feature: The Koco character performs a "Waddle and Jump" animation.

Implementation: Uses requestAnimationFrame and a global time variable (g_time) to oscillate the coordinates of the arms, legs, body, and leaves using Math.sin() and Math.cos() functions.

Work in Progress / Milestones
ColoredPoints.html / ColoredPoints.js: The initial development files used to build the foundational point and shape classes (Point.js, Triangle.js, Circle.js).

HelloTriangle.html / HelloTriangle.js: Early testing files for WebGL context setup.

How to Use
Open asg1.html in a WebGL-compatible browser.

Select a Shape: Click buttons for Point, Triangle, Circle, or Koco.

Customize:

Color Sliders: Adjust Red, Green, and Blue values.

Size Slider: Change the scale of the shapes.

Segments: Adjust the smoothness of the Circles.

Leaf Height: Specifically for the Koco, adjust the height of the top stem/leaves.

Animation: Open awesome.html to see the Koco come to life with automatic movement.

Snapshots & Milestones
1. The Concept Art
Reference image used for the Koco design.

2. Early Development (ColoredPoints)
Initial implementation of color sliders and basic shapes.

3. Shape Logic & Bug Fixing
Refining the Circle and Triangle classes.

4. Final Koco Implementation
The complete character rendered with triangles, including the 'D R' initial leaves.

Citations & References
Textbook: WebGL Programming Guide (Matsuda & Lea).

Libraries: cuon-utils.js, webgl-utils.js, webgl-debug.js provided by the course.

Inspiration: Koco character design from Sonic Frontiers.