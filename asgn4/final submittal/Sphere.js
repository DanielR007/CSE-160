function sin(x) { return Math.sin(x); }
function cos(x) { return Math.cos(x); }

class Sphere {
  constructor() {
    this.type = 'sphere';
    //this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    //this.size = 5.0;
    //this.segments = 10;
    this.matrix = new Matrix4();
    this.normalMatrix = new Matrix4();
    this.textureNum = -2;
    this.verts32= new Float32Array([]);

  }

  render() {
    //var xy = this.position;
    var rgba = this.color;
    //var size = this.size;

    // Pass the texture number to u_whichTexture
    gl.uniform1i(u_whichTexture, this.textureNum);

    // Pass the color to u_FragColor
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

    var d=Math.PI/10;
    var dd=Math.PI/10;
    //var uv=[0,0, 0,0, 0,0, 0,0, 0,0, 0,0];

    for (var t=0; t<Math.PI; t+=d) {
      for (var r=0; r<(2*Math.PI); r +=d) {
        var p1 = [Math.sin(t)*Math.cos(r),       Math.cos(t),      Math.sin(t)*Math.sin(r)];
        var p2 = [Math.sin(t+dd)*Math.cos(r),    Math.cos(t+dd),   Math.sin(t+dd)*Math.sin(r)];
        var p3 = [Math.sin(t)*Math.cos(r+dd),    Math.cos(t),      Math.sin(t)*Math.sin(r+dd)];
        var p4 = [Math.sin(t+dd)*Math.cos(r+dd), Math.cos(t+dd),   Math.sin(t+dd)*Math.sin(r+dd)];
        
        var uv1 = [t/Math.PI, r/(2*Math.PI)];
        var uv2 = [(t+dd)/Math.PI, r/(2*Math.PI)];
        var uv3 = [t/Math.PI, (r+dd)/(2*Math.PI)];
        var uv4 = [(t+dd)/Math.PI, (r+dd)/(2*Math.PI)];

        var v = [];
        var uv = [];
        v = v.concat(p1); uv = uv.concat(uv1);
        v = v.concat(p2); uv = uv.concat(uv2);
        v = v.concat(p4); uv = uv.concat(uv4);

        gl.uniform4f(u_FragColor, 1,1,1,1);
        drawTriangle3DUVNormal(v,uv,v);

        v=[]; uv=[];
        v = v.concat(p1); uv = uv.concat(uv1);
        v = v.concat(p4); uv = uv.concat(uv4);
        v = v.concat(p3); uv = uv.concat(uv3);
        gl.uniform4f(u_FragColor, 1,0,0,1);
        drawTriangle3DUVNormal(v,uv,v);

      }
    }
  }
}