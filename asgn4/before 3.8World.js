// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
// var FSHADER_SOURCE = `
//  precision mediump float;
//  varying vec2 v_UV;
//  uniform vec4 u_FragColor; 
//  uniform sampler2D u_Sampler;
//  void main() {
//    gl_FragColor = u_FragColor;
//    gl_FragColor = vec4(v_UV, 1.0, 1.0);
//  }`

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;  //use color
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0); //Use UV debug color
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler, v_UV); //Use texture0
    }
      else { //Error, put Redish purple
      gl_FragColor = vec4(1, .2, .2, 1); // Magenta for error
    }
  }`



// Global variables

let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler;
let u_whichTexture;


/*
//change to true global variables so traingle.js and cube.js can access them
var canvas;
var gl;
var a_Position;
var u_FragColor;
var u_Size;
var u_ModelMatrix;
var u_GlobalRotateMatrix;
var g_selectedSegments = 10; // Default value
var g_kocoStemHeight = 1.1; // Add for my Koco drawing
*/
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

  // Get the storage location of a_UV  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
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
  
  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  // Get the storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  } 

  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) { console.log('Failed to get u_Sampler'); return; }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) { console.log('Failed to get u_whichTexture'); return; }
  gl.uniform1i(u_whichTexture, -2); // default to color


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
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_magentaAnimation=false;
let g_yellowAnimation=false;

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
  document.getElementById('magentaSlide').addEventListener('input', function() { g_magentaAngle = this.value; renderAllShapes();});
  document.getElementById('yellowSlide').addEventListener('input', function() { g_yellowAngle = this.value; renderAllShapes();});
  document.getElementById('magentaAnimOn').onclick  = () => { g_magentaAnimation = true;  };
  document.getElementById('magentaAnimOff').onclick = () => { g_magentaAnimation = false; };
  document.getElementById('yellowAnimOn').onclick  = () => { g_yellowAnimation = true;  };
  document.getElementById('yellowAnimOff').onclick = () => { g_yellowAnimation = false; };
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

function initTextures() {
  var image = new Image();
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  image.onload = function() { sendImageToTEXTURE0(image); };
  image.src = 'sky.jpg';
  //Add more texture loading
  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();
  if (!texture) { console.log('Failed to create texture'); 
    return false; }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler, 0); // sampler uses TEXTURE0

  console.log('Finished loading texture');

  renderAllShapes(); // draw after texture is ready
}

function main() {
 
  // Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();
  initTextures();   // added

    // --- ADD THIS ---
  const viewMat = new Matrix4();
  viewMat.setLookAt(
    0, 0, 3,   // eye
    0, 0, 0,   // at
    0, 1, 0    // up
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  const projMat = new Matrix4();
  projMat.setPerspective(
    60,                         // fov
    canvas.width / canvas.height,
    0.1,                        // near
    100                         // far
  );
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  // Optional: initialize global rotate to identity once
  const globalRot = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRot.elements);


  // Set up actions for HTML UI elements
  addActionsForHtmlUI();

  document.onkeydown = keydown;

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  //canvas.onmousemove = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev) }};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //renderAllShapes();
  //call for animation loop
  requestAnimationFrame(tick);

}

var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

// Animation loop
function tick() {
  //print some debug info, so we can see the frame rate
  g_seconds=performance.now()/1000.0-g_startTime;
  updateAnimationAngles();
  //console.log(performance.now());
  renderAllShapes();
  requestAnimationFrame(tick);
}
 
function updateAnimationAngles() {
  if (g_yellowAnimation) {
      g_yellowAngle = (45*Math.sin(g_seconds));
  }
  if (g_magentaAnimation) {
      g_magentaAngle = (45*Math.sin(3*g_seconds));
  }

}

function keydown(ev) {
  if (ev.keyCode == 39) { // right arrow
    g_eye[0] += 0.2;
  } else   
  if (ev.keyCode == 37) { // left arrow
    g_eye[0] -= 0.2;
  }
  renderAllShapes();
  console.log(ev.keyCode);
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

var g_eye = [0, 0, 3];
var g_at = [0, 0, -100];
var g_up = [0, 1, 0];

//Draw every shape that is supposed to be on the canvas
function renderAllShapes() {

  // Check the time at the start of this function
  var startTime = performance.now();

  var projMat = new Matrix4();
  projMat.setPerspective(
    50,                         // fov
    1*canvas.width / canvas.height,
    1,                        // near
    100                         // far
  );
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  /*viewMat.setLookAt(g_eye[0], g_eye[1], g_eye[2],   // eye
                    g_at[0], g_at[1], g_at[2],   // at
                    g_up[0], g_up[1], g_up[2]    // up
                    );
    */
    viewMat.setLookAt(
        g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
        g_camera.at.x, g_camera.at.y, g_camera.at.z,
        g_camera.up.x, g_camera.up.y, g_camera.up.z);

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

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

  //draw the floor
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.textureNum=0;
  body.matrix.translate(0, -.75, 0.0);
  body.matrix.scale(10, 0, 10);
  body.matrix.translate(-0.5, 0, -0.5);
  body.render();

  //Draw the body cube
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.textureNum=0;
  //body.textureNum=0;
  body.matrix.translate(-.25, -.75, 0.0);
  body.matrix.rotate(-5, 1, 0,0);
  body.matrix.scale(0.5, .3, .5);
  body.render();

  //Draw a left arm
  var yellow = new Cube();
  yellow.color = [1, 1, 0, 1];
  yellow.matrix.setTranslate(0, -.5, 0.0);
  yellow.matrix.rotate(-5, 1, 0,0);

  yellow.matrix.rotate(-g_yellowAngle, 0, 0,1);

  //if (g_yellowAnimation) {
  //  yellow.matrix.rotate(45*Math.sin(g_seconds), 0, 0,1);
  //} else {
  //  yellow.matrix.rotate(-g_yellowAngle, 0, 0,1);
  //}
  var yellowCoordinatesMat = new Matrix4(yellow.matrix);
  yellow.matrix.scale(0.25, .7, .5);
  yellow.matrix.translate(-.5, 0,0);
  yellow.render();
  
  //Test box
  var Magenta = new Cube();
  Magenta.color = [1,0,1,1];
  Magenta.textureNum=0;
  //Magenta.textureNum=0;
  Magenta.matrix = yellowCoordinatesMat;
  Magenta.matrix.translate(0,0.65,0);
  Magenta.matrix.rotate(g_magentaAngle,0,0,1);
  Magenta.matrix.scale(.3, .3, .3);
  Magenta.matrix.translate(-.5,0,-0.001);
  //Magenta.matrix.rotate(-30,1,0,0);
  //Magenta.matrix.scale(.2, .4, .2);
  Magenta.render();
  
  // A bunch of rotating cubes
  var K=1.0;
  for (var i=0; i<K; i++) {
    var c = new Cube();
    c.matrix.translate(-.8,1.9*i/K-1.0,0);
    c.matrix.rotate(-g_seconds*100,1,1,1);
    c.matrix.scale(.1, 0.5/K, 1.0/K);
    c.render();
  }

  // Check the time at the end of this function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + g_shapesList.length + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "numdot");

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
