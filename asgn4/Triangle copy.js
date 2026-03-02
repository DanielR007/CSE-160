// Triangle.js
// Helper draw functions for Asgn3
// Works with shaders that require BOTH a_Position and a_UV.

let g_vertexBuffer = null;
let g_uvBuffer = null;

function initTriangleBuffers() {
  if (!g_vertexBuffer) {
    g_vertexBuffer = gl.createBuffer();
    if (!g_vertexBuffer) {
      console.log("Failed to create vertex buffer");
      return false;
    }
  }
  if (!g_uvBuffer) {
    g_uvBuffer = gl.createBuffer();
    if (!g_uvBuffer) {
      console.log("Failed to create UV buffer");
      return false;
    }
  }
  return true;
}

function drawTriangle3D(vertices) {
  // vertices: [x,y,z, x,y,z, x,y,z]
  if (!initTriangleBuffers()) return;

  // ---- Position ----
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // ---- UV (constant) ----
  // Shader expects a_UV, so give a constant value for non-UV triangles.
  gl.disableVertexAttribArray(a_UV);
  gl.vertexAttrib2f(a_UV, 0.0, 0.0);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function drawTriangle3DUV(vertices, uv) {
  // vertices: [x,y,z, x,y,z, x,y,z]
  // uv:       [u,v, u,v, u,v]
  if (!initTriangleBuffers()) return;

  // ---- Position ----
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // ---- UV ----
  gl.bindBuffer(gl.ARRAY_BUFFER, g_uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
