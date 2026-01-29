// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    //gl_PointSize = 30.0;
    //gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor; 
  void main() {
    gl_FragColor = u_FragColor;
  }`


// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let g_selectedSegments = 10; // Default value
let g_kocoStemHeight = 1.1; // Add for my Koco drawing

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
// Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
 
  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
  
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const KOCO = 3; //My drawing

// Global related UI elements
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedType=POINT;
let g_globalAngle=0;
let g_kocoLeafTilt = 0;

// Set up actions for  the HTML UI elements
function addActionsForHtmlUI() {
  /*
  // Buttons Event (Shape Type)
  document.getElementById('green').onclick = function() { g_selectedColor = [0.0,1.0,0.0,1.0]; };
  document.getElementById('red').onclick   = function() { g_selectedColor = [1.0,0.0,0.0,1.0]; };
  document.getElementById('clearButton').onclick = function() {g_shapesList=[]; renderAllShapes();};

  document.getElementById('pointButton').onclick = function() { g_selectedType = POINT};
  document.getElementById('triButton').onclick  = function() { g_selectedType = TRIANGLE};
  document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE };
  document.getElementById('kocoButton').onclick = function() { g_selectedType = KOCO }; 
  
  // circle segment Slider Events
  document.getElementById('segmentSlide').addEventListener('input', function() { 
    g_selectedSegments = this.value; 
  });
  // Color Slider Events
  // Use 'input' instead of 'mouseup' for real-time updates
  document.getElementById('redSlide').addEventListener('input', function() { g_selectedColor[0] = this.value/100; });
  document.getElementById('greenSlide').addEventListener('input', function() { g_selectedColor[1] = this.value/100; });
  document.getElementById('blueSlide').addEventListener('input', function() { g_selectedColor[2] = this.value/100; });
  */
  document.getElementById('yellowSlide').addEventListener('input', function() { g_yellowAngle = this.value; renderAllShapes();});

  // Size Slider Event  
  //document.getElementById('sizeSlide').addEventListener('input', function() { g_selectedSize = this.value; });
  document.getElementById('angleSlide').addEventListener('input', function() { g_globalAngle = this.value; renderAllShapes();});
/*
  document.getElementById('kocoStemSlide').addEventListener('input', function() { 
    g_kocoStemHeight = this.value / 100; 
    renderAllShapes(); 
  });
  */
}

function main() {
 
  // Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();
  
  // Set up actions for HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  //canvas.onmousemove = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev) }};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  renderAllShapes();

}

 
var g_shapesList = [];

function click(ev) {
  // Extract the x and y coordinates of the mouse click event
  let [x,y] = convertCoordinatesEventToGL(ev);
  
  // 1. Create the correct shape object
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else if (g_selectedType == CIRCLE) {
    point = new Circle(); 
  } else if (g_selectedType == KOCO) {
    point = new Koco(); 
  }
  
  // 2. Assign shared properties
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  
  // 3. Assign the size from the slider
  // This allows the Koco (and everything else) to scale!
  point.size = g_selectedSize; 

  // 4. Store and Draw
  g_shapesList.push(point);
  renderAllShapes();
}

// Extract the event click and return it in webGL coordinates
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);
}


//Draw every shape that is supposed to be on the canvas
function renderAllShapes() {

  // Check the time at the start of this function
  var startTime = performance.now();
  // Pass the matrix to u_GlobalRotateMatrix
  var globalRotMat=new Matrix4().rotate(g_globalAngle,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  // Clear <canvas>
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  //Draw each shape in the list
  //var len = g_shapesList.length;
  //for(var i = 0; i < len; i++) {
  //  g_shapesList[i].render();
  //}

  //drawTriangle3D([-1.0, 0.0, 0.0,   -0.5, -1.0, 0.0,   0.0, 0.0, 0.0]);

  //Draw the body cube
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.matrix.translate(-.25, -.75, 0.0);
  body.matrix.rotate(-5, 1, 0,0);
  body.matrix.scale(0.5, .3, .5);
  body.render();

  //Draw a left arm
  var leftArm = new Cube();
  leftArm.color = [1, 1, 0, 1];
  leftArm.matrix.setTranslate(0, -.5, 0.0);
  leftArm.matrix.rotate(-5, 1, 0,0);
  leftArm.matrix.rotate(g_yellowAngle, 0, 0,1);
  leftArm.matrix.scale(0.25, .7, .5);
  leftArm.matrix.translate(-.5, 0,0);
  leftArm.render();
  
  //Test box
  var body = new Cube();
  body.color = [1,0,1,1];
  body.matrix.translate(-.1,.1,.0,0);
  body.matrix.rotate(-30,1,0,0);
  body.matrix.scale(.2, .4, .2);
  body.render();
  
  // Check the time at the end of this function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "numdot");

}

// Set the text of an HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
