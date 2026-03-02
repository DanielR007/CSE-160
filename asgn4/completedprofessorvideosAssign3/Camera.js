// Camera.js

class Vector {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }
  add(v)      { return new Vector(this.x + v.x, this.y + v.y, this.z + v.z); }
  subtract(v) { return new Vector(this.x - v.x, this.y - v.y, this.z - v.z); }
  multiply(s) { return new Vector(this.x * s, this.y * s, this.z * s); }
  divide(s)   { return new Vector(this.x / s, this.y / s, this.z / s); }
  length()    { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
  cross(v) {
    return new Vector(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
}

class Camera {
  constructor() {
    this.eye = new Vector(0, 0, 3);
    this.at  = new Vector(0, 0, 0);
    this.up  = new Vector(0, 1, 0);
    this.speed = 0.2;
  }

  forward() {
    let f = this.at.subtract(this.eye);
    let len = f.length(); if (len === 0) return;
    f = f.divide(len).multiply(this.speed);
    this.eye = this.eye.add(f);
    this.at  = this.at.add(f);
  }

  back() {
    let f = this.at.subtract(this.eye);
    let len = f.length(); if (len === 0) return;
    f = f.divide(len).multiply(this.speed);
    this.eye = this.eye.subtract(f);
    this.at  = this.at.subtract(f);
  }

  left() {
    let f = this.at.subtract(this.eye);
    let len = f.length(); if (len === 0) return;
    f = f.divide(len);
    let s = f.cross(this.up);
    let slen = s.length(); if (slen === 0) return;
    s = s.divide(slen).multiply(this.speed);
    this.eye = this.eye.subtract(s);
    this.at  = this.at.subtract(s);
  }

  right() {
    let f = this.at.subtract(this.eye);
    let len = f.length(); if (len === 0) return;
    f = f.divide(len);
    let s = f.cross(this.up);
    let slen = s.length(); if (slen === 0) return;
    s = s.divide(slen).multiply(this.speed);
    this.eye = this.eye.add(s);
    this.at  = this.at.add(s);
  }
  
  /*
class Camera{
    constructor(){
        this.eye=new Vector(0,0,3);
        this.at=new Vector(0,0,-100);
        this.up=new Vector(0,1,0);
    }
    forward(){
        var f = this.at.subtract(this.eye);
        f=f.divide(f.length());
        this.at=this.at.add(f);
        this.eye=this.eye.add(f);
    } 
    back(){
        var f = this.at.subtract(this.at);
        f=f.divide(f.length());
        this.at=this.at.add(f);
        this.eye=this.eye.add(f);
    }
    left(){
        var f = this.at.subtract(this.at);
        f=f.divide(f.length());
        var s=f.cross(this.up);
        s=s.divide(s.length());
        this.at=this.at.add(s);
        this.eye=this.eye.add(s);
    }
    right(){
        var f = this.at.subtract(this.eye);
        f=f.divide(f.length());
        var s=f.cross(this.up);
        s=s.divide(s.length());
        this.at=this.at.add(s);
        this.eye=this.eye.add(s);
    }
            */
}
