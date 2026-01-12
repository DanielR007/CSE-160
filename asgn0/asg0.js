// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Draw a blue rectangle
  //ctx.fillStyle = 'rgba(0, 0, 255, 1.0)'; // Set color to blue
  //ctx.fillRect(120, 10, 150, 150);        // Fill a rectangle with the color

    // Draw a black rectangle
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to black
  ctx.fillRect(0, 0, canvas.width, canvas.height);        // Fill a rectangle with the color
  
  // Instantiate v1 as (2.25, 2.25, 0)
  var v1 = new Vector3([2.25, 2.25, 0]);

  // Call drawVector function to draw v1 in red
  drawVector(v1, "red");
}

function drawVector(v, color) {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.strokeStyle = color;

  // The origin of the vector is he center of the canvas (200, 200)
  // The coordinates are scaled by 20 for better visualization
  let cx = canvas.width / 2;
  let cy = canvas.height / 2;

  ctx.beginPath();
  ctx.moveTo(cx, cy); // Start at center
  
  // Calculate end point: center + (coordinate * 20)
  // We subtract Y because the canvas Y-axis points down
  ctx.lineTo(cx + v.elements[0] * 20, cy - v.elements[1] * 20);
  ctx.stroke();
}

function handleDrawEvent() {
    // Get the canvas and context
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d');

    // Clear the canvas (fill with black)
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Read the values from the text boxes
    var v1x = parseFloat(document.getElementById('v1X').value) || 0;
    var v1y = parseFloat(document.getElementById('v1Y').value) || 0;

    // Create v1 and draw it
    var v1 = new Vector3([v1x, v1y, 0]);
    drawVector(v1, "red");

     //Read and create v2 and draw it
    var v2x = parseFloat(document.getElementById('v2X').value) || 0;
    var v2y = parseFloat(document.getElementById('v2Y').value) || 0;
    var v2 = new Vector3([v2x, v2y, 0]);
    drawVector(v2, "blue");
}