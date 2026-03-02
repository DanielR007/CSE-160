class ObjModel {
  constructor(filename) {
    this.type = 'obj';
    this.color = [0.2, 0.6, 0.9, 1.0]; // Cool blue car color!
    this.matrix = new Matrix4();
    this.normalMatrix = new Matrix4();
    this.textureNum = -2; 

    this.loaded = false;
    this.vertexCount = 0;

    // GPU Buffers
    this._vertexBuffer = null;
    this._normalBuffer = null;
    this._uvBuffer = null;

    // Start loading the file asynchronously
    this.loadObj(filename);
  }

  async loadObj(filename) {
    const response = await fetch(filename);
    const text = await response.text();

    const lines = text.split('\n');
    const tempVerts = [];
    const tempNormals = [];

    const outVerts = [];
    const outNormals = [];
    const outUVs = []; // Dummy UVs so the shader doesn't crash

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('v ')) {
         const parts = line.split(/\s+/);
         tempVerts.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      } else if (line.startsWith('vn ')) {
         const parts = line.split(/\s+/);
         tempNormals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      } else if (line.startsWith('f ')) {
         const parts = line.split(/\s+/).slice(1);
         // Build the triangle
         for(let i=0; i<3; i++) {
            if (!parts[i]) continue;
            const faceIndices = parts[i].split('/');
            const vIdx = parseInt(faceIndices[0]) - 1;
            
            outVerts.push(tempVerts[vIdx][0], tempVerts[vIdx][1], tempVerts[vIdx][2]);
            outUVs.push(0, 0); // Filler UV

            // If the normal index exists
            if (faceIndices.length > 2 && faceIndices[2] !== '') {
               const nIdx = parseInt(faceIndices[2]) - 1;
               outNormals.push(tempNormals[nIdx][0], tempNormals[nIdx][1], tempNormals[nIdx][2]);
            } else {
               outNormals.push(0, 1, 0); // Fallback normal
            }
         }
      }
    }

    this.vertices = new Float32Array(outVerts);
    this.normals = new Float32Array(outNormals);
    this.uvs = new Float32Array(outUVs);
    this.vertexCount = outVerts.length / 3;
    
    this.loaded = true;
    console.log("Finished loading OBJ with " + this.vertexCount + " vertices.");
  }

  render() {
    // Don't try to draw if the file is still downloading!
    if (!this.loaded) return;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

    // 1. Vertex Buffer
    if (!this._vertexBuffer) {
       this._vertexBuffer = gl.createBuffer();
       gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
       gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // 2. Normal Buffer
    if (!this._normalBuffer) {
       this._normalBuffer = gl.createBuffer();
       gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
       gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    // 3. Dummy UV Buffer
    if (!this._uvBuffer) {
       this._uvBuffer = gl.createBuffer();
       gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
       gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    // Fast GPU Draw
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
  }
}