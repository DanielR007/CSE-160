class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.normalMatrix = new Matrix4();
    this.textureNum = -2;
    this._vb = null;

    this.cubeVerts32 = new Float32Array([
      0,0,0,  1,1,0,  1,0,0,
      0,0,0,  0,1,0,  1,1,0,
      0,1,0,  0,1,1,  1,1,1,
      0,1,0,  1,1,1,  1,1,0,
      0,0,1,  1,1,1,  1,0,1,
      0,0,1,  0,1,1,  1,1,1,
      0,0,0,  0,0,1,  1,0,1,
      0,0,0,  1,0,1,  1,0,0,
      0,0,1,  1,1,1,  1,0,1,
      0,0,1,  0,1,1,  1,1,1
    ]);
  }

  render() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);

    // Pass the color to u_FragColor
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

    drawTriangle3DUVNormal(
      [0,0,0,  1,1,0,  1,0,0], 
      [0,0,  1,1,  1,0],
      [0,0,-1,  0,0,-1,  0,0,-1]);
    // front of cube (uses UV)
    drawTriangle3DUVNormal([0,0,0,  0,1,0,  1,1,0], [0,0,  0,1,  1,1], [0,0,-1,  0,0,-1,  0,0,-1]);

    //gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);

    // top of cube (uses UV)
    drawTriangle3DUVNormal([0,1,0,  0,1,1,  1,1,1], [0,0,  0,1,  1,1], [0,1,0,  0,1,0,  0,1,0]);
    drawTriangle3DUVNormal([0,1,0,  1,1,1,  1,1,0], [0,0,  1,1,  1,0], [0,1,0,  0,1,0,  0,1,0]);

    //gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);

    // Right of cube (uses UV)
    //gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
    drawTriangle3DUVNormal([1,1,0,  1,1,1,  1,0,0], [0,0,  0,1,  1,1], [1,0,0,  1,0,0,  1,0,0]);
    drawTriangle3DUVNormal([1,0,0,  1,1,1,  1,0,1], [0,0,  1,1,  1,0], [1,0,0,  1,0,0,  1,0,0]);

    // Left of cube (uses UV)
    //gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
    drawTriangle3DUVNormal([0,1,0,  0,1,1,  0,0,0], [0,0,  0,1,  1,1], [-1,0,0,  -1,0,0,  -1,0,0]);
    drawTriangle3DUVNormal([0,0,0,  0,1,1,  0,0,1], [0,0,  1,1,  1,0], [-1,0,0,  -1,0,0,  -1,0,0]);
    
    // Bottom of cube (uses UV)
    //gl.uniform4f(u_FragColor, rgba[0]*0.6, rgba[1]*0.6, rgba[2]*0.6, rgba[3]);
    drawTriangle3DUVNormal([0,0,0,  0,0,1,  1,0,1], [0,0,  0,1,  1,1], [0,-1,0,  0,-1,0,  0,-1,0]);
    drawTriangle3DUVNormal([0,0,0,  1,0,1,  1,0,0], [0,0,  1,1,  1,0], [0,-1,0,  0,-1,0,  0,-1,0]);
    
    // Back of cube (uses UV)
    //gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
    drawTriangle3DUVNormal([0,0,1,  1,1,1,  1,0,1], [0,0,  0,1,  1,1], [0,0,1,  0,0,1,  0,0,1]);
    drawTriangle3DUVNormal([0,0,1,  0,1,1,  1,1,1], [0,0,  1,1,  1,0], [0,0,1,  0,0,1,  0,0,1]);
    
    /*
    
    // front of cube (uses UV)
    drawTriangle3DUV([0,0,0,  1,1,0,  1,0,0], [0,0,  1,1,  1,0]);
    drawTriangle3DUV([0,0,0,  0,1,0,  1,1,0], [0,0,  0,1,  1,1]);

    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);

    // top of cube (uses UV)
    drawTriangle3DUV([0,1,0,  0,1,1,  1,1,1], [0,0,  0,1,  1,1]);
    drawTriangle3DUV([0,1,0,  1,1,1,  1,1,0], [0,0,  1,1,  1,0]);

    gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);

    // FRONT face (z = 1)
    drawTriangle3DUV([0,0,1,  1,1,1,  1,0,1], [0,0,  1,1,  1,0]);
    drawTriangle3DUV([0,0,1,  0,1,1,  1,1,1], [0,0,  0,1,  1,1]);

    gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);

    drawTriangle3D([0,0,0,  0,0,1,  1,0,1]);
    drawTriangle3D([0,0,0,  1,0,1,  1,0,0]);

    gl.uniform4f(u_FragColor, rgba[0]*0.6, rgba[1]*0.6, rgba[2]*0.6, rgba[3]);

    drawTriangle3D([0,0,0,  0,1,0,  0,1,1]);
    drawTriangle3D([0,0,0,  0,1,1,  0,0,1]);

    gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);

    drawTriangle3D([1,0,0,  1,1,0,  1,1,1]);
    drawTriangle3D([1,0,0,  1,1,1,  1,0,1]);
*/

  }


  // Simple fast renderer using a single typed array upload per instance
  renderfast() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, -2);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var allverts=[];
    //Front of cube
    allverts=allverts.concat([0,0,0,  1,1,0,  1,0,0]);
    allverts=allverts.concat([0,0,0,  0,1,0,  1,1,0]);
    //Top of cube
    allverts=allverts.concat([0,1,0,  0,1,1,  1,1,1]);
    allverts=allverts.concat([0,1,0,  1,1,1,  1,1,0]);
    //Right of cube
    allverts=allverts.concat([1,1,0,  1,1,1,  1,0,0]);
    allverts=allverts.concat([1,0,0,  1,1,1,  1,0,1]);
    //Left of cube
    allverts=allverts.concat([0,1,0,  0,1,1,  0,0,0]);
    allverts=allverts.concat([0,0,0,  0,1,1,  0,0,1]);
    //Bottom of cube
    allverts=allverts.concat([0,0,0,  0,0,1,  1,0,1]);
    allverts=allverts.concat([0,0,0,  1,0,1,  1,0,0]);
    //Back of cube
    allverts=allverts.concat([0,0,1,  1,1,1,  1,0,1]);
    allverts=allverts.concat([0,0,1,  0,1,1,  1,1,1]);
    
    // Create & upload GPU buffer once per cube instance
    if (!this._vb) {
      this._vb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._vb);
      gl.bufferData(gl.ARRAY_BUFFER, this.cubeVerts32, gl.STATIC_DRAW);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, this._vb);
    }

    // Configure attribute and draw
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    const vertexCount = this.cubeVerts32.length / 3;
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  }

  // compatibility alias used elsewhere
  renderfaster() {
    this.renderfast();
  }
}