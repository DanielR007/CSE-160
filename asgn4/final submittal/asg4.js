// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
    v_VertPos = u_ModelMatrix * a_Position; // Pass the vertex position in world space to the fragment shader
    //v_Normal = a_Normal;
    //v_Normal = normalize(vec3(u_GlobalRotateMatrix * u_ModelMatrix * vec4(a_Normal, 0.0)));
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

/*
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  uniform vec3 g_lightPos;
  varying vec4 v_VertPos;
  void main() {
    if (u_whichTexture == -3) {
      gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);  //use color
    } else if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor; //Use UV debug color
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0,1.0); //Use Normal debug color
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler, v_UV); //Use texture0
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV); //Use texture1
    } else { //Error, put Redish purple
      gl_FragColor = vec4(1, .2, .2, 1); // Magenta for error
    }
      
    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    float r=length(lightVector);

    //if (r < 1.0) {
    //  gl_FragColor = vec4(1, 0, 0, 1); // Red for error
    //} else if (r < 2.0) {
    //  gl_FragColor = vec4(0,1,0,1);
    //}

    // Light Falloff Visualization 1/r^2
    //gl_FragColor= vec4(vec3(gl_FragColor)/(r*r),1);

    // N dot L
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N, L), 0.0);
    gl_FragColor = vec4(gl_FragColor.rgb * nDotL, gl_FragColor.a);
    //gl_FragColor = gl.FragColor * nDotL;
    //gl_FragColor.a = 1.0; // Ensure alpha is 1.0
  }`
*/
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos; 
  uniform vec3 u_cameraPos; 
  uniform bool u_lightOn;
  uniform bool u_spotlightOn;  
  uniform vec3 u_spotDir;      
  uniform float u_spotCutOff;  

  void main() {
    vec4 baseColor; 
    
    if (u_whichTexture == -3) {
      baseColor = vec4((v_Normal+1.0)/2.0, 1.0);  
    } else if (u_whichTexture == -2) {
      baseColor = u_FragColor; 
    } else if (u_whichTexture == -1) {
      baseColor = vec4(v_UV, 1.0, 1.0); 
    } else if (u_whichTexture == 0) {
      baseColor = texture2D(u_Sampler, v_UV); 
    } else if (u_whichTexture == 1) {
      baseColor = texture2D(u_Sampler1, v_UV); 
    } else { 
      baseColor = vec4(1, 0.2, 0.2, 1); 
    }
      
    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    float r = length(lightVector);

    // N dot L
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N, L), 0.0);
    
    // Reflection
    vec3 R = reflect(-L, N);

    // Eye
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

    // Specular
    float specular = pow(max(dot(E, R), 0.0), 64.0) * 0.8;

    // --- SPOTLIGHT MATH ---
    float spotFactor = 1.0; // Assume full light by default
    
    if (u_spotlightOn) {
      // Vector pointing FROM the light TO the vertex
      vec3 lightToVert = normalize(vec3(v_VertPos) - u_lightPos);
      vec3 S = normalize(u_spotDir); 
      
      // Calculate the angle between the spotlight beam and the vertex
      float spotCosine = dot(lightToVert, S);
      float cutOffCosine = cos(radians(u_spotCutOff));
      
      if (spotCosine < cutOffCosine) {
        // If the angle is wider than the cutoff, plunge it into darkness!
        spotFactor = 0.0; 
      } else {
        // Optional: Add a smooth fade to the edge of the spotlight
        spotFactor = pow(spotCosine, 10.0); 
      }
    }

    // Apply the spotFactor to your diffuse and specular light!
    vec3 diffuse = vec3(1.0,1.0,1.0) * baseColor.rgb * nDotL * 0.7 * spotFactor; 
    vec3 ambient = baseColor.rgb * 0.2; // Ambient is unaffected by the spotlight
    float finalSpecular = specular * spotFactor;
    
    // Apply the lighting with the master switch
    if (u_lightOn) {
      if (u_whichTexture == 0) {
        gl_FragColor = vec4(vec3(finalSpecular) + diffuse + ambient, 1.0);
      } else {
        gl_FragColor = vec4(diffuse + ambient, 1.0); 
      }
    } else {
      gl_FragColor = vec4(baseColor.rgb, 1.0);
    }
  }`

// Global variables

let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_cameraPos;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler;
let u_whichTexture;
let g_camera;
let u_lightPos;
let u_lightOn;
let u_NormalMatrix;


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

  // Get the storage location of a_Position
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // Get the storage location of u_whitchTexture
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_cameraPos
  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
  }

 /*
  // Change g_lightPos to u_lightPos here!
  u_lightPos = gl.getUniformLocation(gl.program, 'g_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of g_lightPos');
    // return;  <-- Optional: comment this out so it doesn't stop the rest of your setup!
  }
  */
// Look for 'u_lightPos' in quotes, NOT 'g_lightPos'
  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
  }

  // Get the storage location of u_lightOn
  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
  }

  // Get the storage location of u_NormalMatrix
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
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

  u_spotlightOn = gl.getUniformLocation(gl.program, 'u_spotlightOn');
  u_spotDir = gl.getUniformLocation(gl.program, 'u_spotDir');
  u_spotCutOff = gl.getUniformLocation(gl.program, 'u_spotCutOff');

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
let g_normalOn = false;
let g_lightOn = true;
let g_lightPos=[0,1,-2];
let g_spotlightOn = false; // Defaults to Point Light
let g_lightAnimation = true; // Default the light animation to ON
let g_spotDir = [0, -1, 0]; // Defaults to pointing straight down
let g_spotCutOff = 30.0;    // 30 degree cone
let u_spotlightOn, u_spotDir, u_spotCutOff;
let g_myCar = null;
let g_showCar = true;
let g_showNopon = true;
let g_showRobot = true;

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
  document.getElementById('lightAnimOn').onclick = function() { g_lightAnimation = true; };
  document.getElementById('lightAnimOff').onclick = function() { g_lightAnimation = false; };
  
  document.getElementById('lightOn').onclick = function() { g_lightOn = true; renderAllShapes();};
  document.getElementById('lightOff').onclick = function() { g_lightOn = false; renderAllShapes();};
  document.getElementById('normalOn').onclick = function() { g_normalOn = true; renderAllShapes();};
  document.getElementById('normalOff').onclick = function() { g_normalOn = false; renderAllShapes();};
  document.getElementById('magentaSlide').addEventListener('mousemove', function() { g_magentaAngle = this.value; renderAllShapes();});
  document.getElementById('yellowSlide').addEventListener('mousemove', function() { g_yellowAngle = this.value; renderAllShapes();});
  document.getElementById('magentaAnimOn').onclick  = () => { g_magentaAnimation = true;  };
  document.getElementById('magentaAnimOff').onclick = () => { g_magentaAnimation = false; };
  document.getElementById('yellowAnimOn').onclick  = () => { g_yellowAnimation = true;  };
  document.getElementById('yellowAnimOff').onclick = () => { g_yellowAnimation = false; };
  
  document.getElementById('yellowSlide').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) {g_yellowAngle = this.value; renderAllShapes();}});
  document.getElementById('magentaSlide').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_magentaAngle = this.value; renderAllShapes();}});
  // Use 'input' instead of 'mousemove'. This triggers perfectly on any drag or click!
  document.getElementById('lightSlideX').addEventListener('input', function() { g_lightPos[0] = this.value/100; renderAllShapes(); });
  document.getElementById('lightSlideY').addEventListener('input', function() { g_lightPos[1] = this.value/100; renderAllShapes(); });
  document.getElementById('lightSlideZ').addEventListener('input', function() { g_lightPos[2] = this.value/100; renderAllShapes(); });
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev) }};
  // Size Slider Event  
  //document.getElementById('sizeSlide').addEventListener('input', function() { g_selectedSize = this.value; });
  document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes();});
  
  document.getElementById('spotlightOn').onclick = function() { g_spotlightOn = true; renderAllShapes();};
  document.getElementById('spotlightOff').onclick = function() { g_spotlightOn = false; renderAllShapes();};
  document.getElementById('spotDirX').addEventListener('input', function() { g_spotDir[0] = this.value/100; renderAllShapes(); });
  document.getElementById('spotDirY').addEventListener('input', function() { g_spotDir[1] = this.value/100; renderAllShapes(); });
  document.getElementById('spotDirZ').addEventListener('input', function() { g_spotDir[2] = this.value/100; renderAllShapes(); });
  document.getElementById('spotCutOff').addEventListener('input', function() { g_spotCutOff = this.value; renderAllShapes(); });
  // Add these inside addActionsForHtmlUI()
  document.getElementById('carOn').onclick = function() { g_showCar = true; renderAllShapes(); };
  document.getElementById('carOff').onclick = function() { g_showCar = false; renderAllShapes(); };
  
  document.getElementById('noponOn').onclick = function() { g_showNopon = true; renderAllShapes(); };
  document.getElementById('noponOff').onclick = function() { g_showNopon = false; renderAllShapes(); };
  
  document.getElementById('robotOn').onclick = function() { g_showRobot = true; renderAllShapes(); };
  document.getElementById('robotOff').onclick = function() { g_showRobot = false; renderAllShapes(); };
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
  //image.src = 'sky.jpg';
  image.src = 'stone_wall_diff_1k.jpg';
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
  
  g_camera = new Camera();  // added, initialize the camera after connecting GLSL variables so we have u_ViewMatrix ready
  // Start downloading the file when the page loads!
  g_myCar = new ObjModel('Decimate_Outside_BMW_M4_csl.obj');

  initTextures();   // Start loading the texture. This will asynchronously load the image and then call sendImageToTEXTURE0() when ready.


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

  // initialize global rotate to identity once
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
  
  // ADD THIS BLOCK: The Light Animation
  if (g_lightAnimation) {
      g_lightPos[0] = Math.cos(g_seconds) * 2.5; // Sweep the light back and forth
      
      // Bonus: This line physically moves your HTML slider to match the light!
      document.getElementById('lightSlideX').value = g_lightPos[0] * 100; 
  }
}

/* function keydown(ev) {
  if (ev.keyCode == 39) { // right arrow
    g_eye[0] += 0.2;
  } else   
  if (ev.keyCode == 37) { // left arrow
    g_eye[0] -= 0.2;
  }
  renderAllShapes();
  console.log(ev.keyCode);
} */

function keydown(ev) {
  if (ev.keyCode == 39) {
    g_camera.turnright();
  } else 
  if (ev.keyCode == 37) {
    g_camera.turnleft();
  } else 
  if (ev.keyCode == 38) g_camera.forward();
  else if (ev.keyCode == 40) g_camera.back();
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

//var g_eye = [0, 0, 3];
//var g_at = [0, 0, -100];
//var g_up = [0, 1, 0];

var g_map=[
  [1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,1],
];

function drawMap() {
  var body = new Cube();  
  for (i=0;i<2;i++){
    for (x=0;x<32;x++){
    for (y=0;y<32;y++){
        //var body = new Cube();  

        body.color = [0.8,1.0,1.0,1.0];
        body.textureNum=-2
        body.matrix.setTranslate(0, -.75, 0);
        body.matrix.scale(.4, .4, .4);
        body.matrix.translate(x-16, 0, y-16);
        //body.render();
        //body.renderfast();
        body.renderfaster();
      }
    }
  }
}

//Draw every shape that is supposed to be on the canvas
function renderAllShapes() {

  // Check the time at the start of this function
  var startTime = performance.now();

  var projMat = new Matrix4();
  projMat.setPerspective(90, 1*canvas.width/canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  /*
  viewMat.setLookAt(g_eye[0], g_eye[1], g_eye[2],   // eye
                    g_at[0], g_at[1], g_at[2],   // at
                    g_up[0], g_up[1], g_up[2]    // up
                    );
*/

  viewMat.setLookAt(
        g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
        g_camera.at.x, g_camera.at.y, g_camera.at.z,
        g_camera.up.x, g_camera.up.y, g_camera.up.z
    );

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

  //DrawTriangle3D([-1.0, 0.0, 0.0,   -0.5, -1.0, 0.0,   0.0, 0.0, 0.0]);

  //Pass the light position to GLSL
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  gl.uniform3f(u_cameraPos, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);

  gl.uniform1i(u_lightOn, g_lightOn ? 1 : 0);

  gl.uniform1i(u_spotlightOn, g_spotlightOn ? 1 : 0);
  gl.uniform3f(u_spotDir, g_spotDir[0], g_spotDir[1], g_spotDir[2]);
  gl.uniform1f(u_spotCutOff, g_spotCutOff);

  //Draw the light
  var light = new Cube();
  light.color = [2, 2, 0, 1];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.1, -0.1, -0.1);
  light.matrix.translate(-0.5, -0.5, -0.5);
  light.render();

  //Draw a sphere
  var sphere = new Sphere();
  sphere.color = [0,1,1,1];
  if (g_normalOn) sphere.textureNum=-3;  
  //if (g_normalOn) sphere.textureNum=-1;
  sphere.matrix.translate(-1, -1.5, -1.5);
  //sphere.matrix.translate(2, -1.5, 0.0);
  sphere.matrix.rotate(-5, 1, 0,0);
  //sphere.matrix.rotate(-g_yellowAngle, 0, 0,1);
  sphere.render(); 
  
  //Draw a floor
  var floor = new Cube();
  floor.color = [1, 0, 0, 1.0];
  //floor.textureNum=-2;
  floor.textureNum=0;
  floor.matrix.translate(0, -2.49, 0.0);
  floor.matrix.scale(10, 0, 10);
  floor.matrix.translate(-.5, 0, -0.5);
  floor.render();

  //Draw the sky
  var sky = new Cube();
  sky.color = [0.8, 0.8, 0.8, 1.0];
  if (g_normalOn) sky.textureNum=-3;
  sky.matrix.scale(-6, -6, -6);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();

  // ===========================================
  // Draw the BMW
  // ===========================================
  if (g_myCar && g_showCar) {   
    g_myCar.textureNum = g_normalOn ? -3 : -2; 
    g_myCar.matrix.setIdentity();
    
    // Lift it up so the tires sit perfectly on the floor (Adjust the -1.9 if needed!)
    g_myCar.matrix.translate(-1.0, -1.9, .25); 

    // Pitch the car 90 degrees backward so the wheels touch the ground
    g_myCar.matrix.rotate(-90, 1, 0, 0); 
    
    // Aim the car (Because pitched it, now rotate around the Z axis to steer left/right!)
    g_myCar.matrix.rotate(-135, 0, 0, 1); 

    // Scale it
    g_myCar.matrix.scale(1., 1.,1.0)
    
    g_myCar.normalMatrix.setInverseOf(g_myCar.matrix).transpose();
    g_myCar.render();
  }
/*
  // Draw the Nopon!
  if (g_showNopon) {
    var myNopon = new Nopon();
    var noponBase = new Matrix4();
    noponBase.translate(2, -1.8, -0.5); // Move him onto the floor
    //noponBase.rotate(90, 0, 1, 0);
    noponBase.rotate(180, 0, 1, 0);
    //noponBase.scale(0.8, 0.8, 0.8);
    noponBase.scale(1, 1, 1);
    
    // Provide animation data to his rendering function
    var animData = { 
      bodyBob: Math.sin(g_seconds * 3) * 0.05, 
      walkPhase: g_seconds * 3, 
      leftWingBase: Math.sin(g_seconds) * 20, 
      leftWingMid: 0, leftWingTip: 0,
      rightWingBase: -Math.sin(g_seconds) * 20, 
      rightWingMid: 0, rightWingTip: 0,
      swordAngle: g_magentaAngle, // Hook the sword to your pink slider!
      hatOn: true,
      packOn: true,
      pokeAmount: 0 
    };
  } 
  */
  // ===========================================
  // Draw the Nopon
  // ===========================================
  if (g_showNopon) {
    var myNopon = new Nopon();
    var noponBase = new Matrix4();
    noponBase.translate(2.5, -2.4, -1.5); 
    
    // Spin him 180 degrees to face forward!
    noponBase.rotate(180, 0, 1, 0); 
    
    noponBase.scale(1.5, 1.5, 1.5);
    
    var animData = { 
      bodyBob: Math.sin(g_seconds * 3) * 0.05, walkPhase: g_seconds * 3, 
      leftWingBase: Math.sin(g_seconds) * 20, leftWingMid: 0, leftWingTip: 0,
      rightWingBase: -Math.sin(g_seconds) * 20, rightWingMid: 0, rightWingTip: 0,
      swordAngle: g_magentaAngle, hatOn: true, packOn: true, pokeAmount: 0 
    };
    myNopon.render(noponBase, animData);
  }
  
  // ===========================================
  // Draw the Robot Arm
  // ===========================================
  if (g_showRobot) {
    var body = new Cube();
    body.color = [1.0, 0.5, 0.5, 1.0];
    if (g_normalOn) body.textureNum = -3;
    
    // Position the base on the floor
    body.matrix.translate(1.75, -2.4, -.5);
    var bodyCoordinatesMat = new Matrix4(body.matrix); 
    body.matrix.scale(0.5, 0.3, 0.5);
    body.normalMatrix.setInverseOf(body.matrix).transpose();
    body.render();

    var yellow = new Cube();
    yellow.textureNum = -3;
    yellow.color = [1, 1, 0.5, 1];
    yellow.matrix = new Matrix4(bodyCoordinatesMat);
    
    // Move shoulder joint to the top center of the base
    yellow.matrix.translate(0.25, 0.3, 0.25); 
    
    if (g_yellowAnimation) { yellow.matrix.rotate(45 * Math.sin(g_seconds), 0, 0, 1); } 
    else { yellow.matrix.rotate(-g_yellowAngle, 0, 0, 1); }
    var yellowCoordinatesMat = new Matrix4(yellow.matrix);
    
    yellow.matrix.scale(0.25, 0.7, 0.25);
    // Push the geometry so it scales UPWARDS from the joint
    yellow.matrix.translate(-0.5, 0, -0.5);
    yellow.normalMatrix.setInverseOf(yellow.matrix).transpose();
    yellow.render();

    var Magenta = new Cube();
    Magenta.color = [0.5, 0.5, 1, 1];
    if (g_normalOn) Magenta.textureNum = -3;
    Magenta.matrix = new Matrix4(yellowCoordinatesMat);
    
    // Move UP to the elbow (the top of the yellow arm)
    Magenta.matrix.translate(0, 0.7, 0);
    Magenta.matrix.rotate(g_magentaAngle, 0, 0, 1);
    
    Magenta.matrix.scale(0.3, 0.3, 0.3);
    // Center the magenta box on the wrist joint, building UPWARDS
    Magenta.matrix.translate(-0.5, 0, -0.5);
    Magenta.normalMatrix.setInverseOf(Magenta.matrix).transpose(); 
    Magenta.render();
  }
  
/*
  // A bunch of rotating cubes
  var K=1.0;
  for (var i=0; i<K; i++) {
    var c = new Cube();
    c.color = [0.5, 0.5, 1, 1];
    if (g_normalOn) c.textureNum = -3;
    c.matrix.translate(-.8,1.9*i/K-1.0,0);
    c.matrix.rotate(-g_seconds*100,1,1,1);
    c.matrix.scale(.1, 0.5/K, 1.0/K);
    c.render();
  }
*/
  //drawMap();

  // Check the time at the end of this function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + g_shapesList.length + " ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "numdot");
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
