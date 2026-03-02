// Cube.js
// Fast cube rendering for Blocky World.
// - Keeps the original per-face render() (useful for small counts / debugging)
// - Adds renderfast() that draws the whole cube in ONE draw call using static VBOs
//   (this is what is needed for drawing a 64x64 map).

//  assumes globals exist
//   gl, a_Position, a_UV, u_FragColor, u_ModelMatrix, u_whichTexture
// and Matrix4 is available.

let g_cubePosBuffer = null;
let g_cubeUVBuffer = null;
let g_cubeVertexCount = 0;

function initCubeBuffers() {
  if (g_cubePosBuffer && g_cubeUVBuffer) return;

  // 12 triangles * 3 verts = 36 vertices
  // Cube in [0,1] in each axis (same as your existing cube faces)
  const V = [
    // Front (z=1)
    0,0,1,  1,1,1,  1,0,1,
    0,0,1,  0,1,1,  1,1,1,
    // Back (z=0)
    0,0,0,  1,0,0,  1,1,0,
    0,0,0,  1,1,0,  0,1,0,
    // Left (x=0)
    0,0,0,  0,1,1,  0,0,1,
    0,0,0,  0,1,0,  0,1,1,
    // Right (x=1)
    1,0,0,  1,0,1,  1,1,1,
    1,0,0,  1,1,1,  1,1,0,
    // Top (y=1)
    0,1,0,  1,1,1,  1,1,0,
    0,1,0,  0,1,1,  1,1,1,
    // Bottom (y=0)
    0,0,0,  1,0,1,  1,0,0,
    0,0,0,  0,0,1,  1,0,1,
  ];

  // UVs for each face (standard 0..1 quad, two triangles)
  const U = [
    // Front
    0,0,  1,1,  1,0,
    0,0,  0,1,  1,1,
    // Back
    0,0,  1,0,  1,1,
    0,0,  1,1,  0,1,
    // Left
    0,0,  1,1,  1,0,
    0,0,  0,1,  1,1,
    // Right
    0,0,  1,0,  1,1,
    0,0,  1,1,  0,1,
    // Top
    0,0,  1,1,  1,0,
    0,0,  0,1,  1,1,
    // Bottom
    0,0,  1,1,  1,0,
    0,0,  0,1,  1,1,
  ];

  const verts = new Float32Array(V);
  const uvs = new Float32Array(U);
  g_cubeVertexCount = verts.length / 3;

  g_cubePosBuffer = gl.createBuffer();
  g_cubeUVBuffer = gl.createBuffer();
  if (!g_cubePosBuffer || !g_cubeUVBuffer) {
    console.log('Failed to create cube buffers');
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubePosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

  // Unbind
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();

    // Texture selection (matches professor videos)
    //  -2: use solid color
    //  -1: debug UV
    //   0+: sample from texture unit N
    this.textureNum = -2;
  }

  // Original per-face approach (slow if you draw thousands of cubes)
  render() {
    const rgba = this.color;

    if (typeof u_whichTexture !== 'undefined' && u_whichTexture) {
      gl.uniform1i(u_whichTexture, this.textureNum);
    }

    if (typeof u_FragColor !== 'undefined' && u_FragColor) {
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    }

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Back face (z = 0)
    drawTriangle3DUV([0,0,0,  1,1,0,  1,0,0], [0,0,  1,1,  1,0]);
    drawTriangle3DUV([0,0,0,  0,1,0,  1,1,0], [0,0,  0,1,  1,1]);

    // Front face (z = 1)
    drawTriangle3DUV([0,0,1,  1,1,1,  1,0,1], [0,0,  1,1,  1,0]);
    drawTriangle3DUV([0,0,1,  0,1,1,  1,1,1], [0,0,  0,1,  1,1]);

    // Top face (y = 1)
    drawTriangle3DUV([0,1,0,  1,1,1,  1,1,0], [0,0,  1,1,  1,0]);
    drawTriangle3DUV([0,1,0,  0,1,1,  1,1,1], [0,0,  0,1,  1,1]);

    // Bottom face (y = 0)
    drawTriangle3DUV([0,0,0,  1,0,1,  1,0,0], [0,0,  1,1,  1,0]);
    drawTriangle3DUV([0,0,0,  0,0,1,  1,0,1], [0,0,  0,1,  1,1]);

    // Left face (x = 0)
    drawTriangle3DUV([0,0,0,  0,1,1,  0,0,1], [0,0,  1,1,  1,0]);
    drawTriangle3DUV([0,0,0,  0,1,0,  0,1,1], [0,0,  0,1,  1,1]);

    // Right face (x = 1)
    drawTriangle3DUV([1,0,0,  1,0,1,  1,1,1], [0,0,  1,0,  1,1]);
    drawTriangle3DUV([1,0,0,  1,1,1,  1,1,0], [0,0,  1,1,  0,1]);
  }

  // Fast path (ONE draw call for the whole cube)
  renderfast() {
    initCubeBuffers();

    const rgba = this.color;

    if (typeof u_whichTexture !== 'undefined' && u_whichTexture) {
      gl.uniform1i(u_whichTexture, this.textureNum);
    }

    if (typeof u_FragColor !== 'undefined' && u_FragColor) {
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    }

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Position
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubePosBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // UV
    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeUVBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, g_cubeVertexCount);

    // Unbind
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  // Convenience alias (some code uses renderFast naming)
  renderFast() {
    this.renderfast();
  }
}
