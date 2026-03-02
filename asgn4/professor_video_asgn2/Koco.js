class Koco {
  constructor() {
    this.type = 'koco';
    this.position = [0.0, 0.0];
    this.color = [0.8, 0.7, 0.5, 1.0]; 
    this.size = 100.0; // Occupies 1/4 of the 400px canvas
  }

  render() {
    let [x, y] = this.position;
    let s = this.size / 400.0; 

    // --- 1. Body (20 triangles) ---
    gl.uniform4f(u_FragColor, 0.8, 0.7, 0.5, 1.0);
    this.drawDecagon(x, y, s);

    // --- 2. Arms (4 triangles) ---
    // Left Arm
    drawTriangle([x - s, y, x - s * 1.3, y - s * 0.2, x - s, y - s * 0.2]);
    // Right Arm
    drawTriangle([x + s, y, x + s * 1.3, y - s * 0.2, x + s, y - s * 0.2]);

    // --- 3. Legs (4 triangles) ---
    // Left Leg
    drawTriangle([x - s * 0.4, y - s, x - s * 0.6, y - s * 1.3, x - s * 0.2, y - s * 1.3]);
    // Right Leg
    drawTriangle([x + s * 0.4, y - s, x + s * 0.6, y - s * 1.3, x + s * 0.2, y - s * 1.3]);

    // --- 4. Pot-Head Top (4 triangles) ---
    gl.uniform4f(u_FragColor, 0.7, 0.6, 0.4, 1.0); 
    drawTriangle([x - s, y + s * 0.2, x - s * 1.1, y + s * 0.6, x + s * 1.1, y + s * 0.6]);
    drawTriangle([x - s, y + s * 0.2, x + s * 1.1, y + s * 0.6, x + s, y + s * 0.2]);

    // --- 5. Plant Head & 'D R' Initial Leaves (7 triangles) ---
    gl.uniform4f(u_FragColor, 0.0, 0.8, 0.0, 1.0); // Leaf Green
    
    let stemTopX = x;
    let stemTopY = y + s * g_kocoStemHeight;

    // Stem (1 triangle)
    drawTriangle([x - s * 0.05, y + s * 0.6, x + s * 0.05, y + s * 0.6, stemTopX, stemTopY]);

    // Initial 'D' (Left side - 3 triangles)
    // Vertical bar of D
    drawTriangle([stemTopX - s*0.1, stemTopY, stemTopX - s*0.2, stemTopY, stemTopX - s*0.15, stemTopY + s*0.4]);
    // Top/Bottom curve of D
    drawTriangle([stemTopX - s*0.15, stemTopY + s*0.4, stemTopX - s*0.4, stemTopY + s*0.2, stemTopX - s*0.2, stemTopY + s*0.4]);
    drawTriangle([stemTopX - s*0.15, stemTopY, stemTopX - s*0.4, stemTopY + s*0.2, stemTopX - s*0.2, stemTopY]);

    // Initial 'R' (Right side - 4 triangles)
    // Vertical bar of R
    drawTriangle([stemTopX + s*0.1, stemTopY, stemTopX + s*0.2, stemTopY, stemTopX + s*0.15, stemTopY + s*0.4]);
    // Top loop of R
    drawTriangle([stemTopX + s*0.15, stemTopY + s*0.4, stemTopX + s*0.4, stemTopY + s*0.3, stemTopX + s*0.2, stemTopY + s*0.4]);
    drawTriangle([stemTopX + s*0.4, stemTopY + s*0.3, stemTopX + s*0.15, stemTopY + s*0.2, stemTopX + s*0.2, stemTopY + s*0.2]);
    // Diagonal leg of R
    drawTriangle([stemTopX + s*0.2, stemTopY + s*0.2, stemTopX + s*0.4, stemTopY, stemTopX + s*0.3, stemTopY]);

    // --- 6. Eyes and Mouth (2 triangles each) ---
    gl.uniform4f(u_FragColor, 0.2, 0.1, 0.0, 1.0);
    drawTriangle([x - s * 0.4, y + s * 0.1, x - s * 0.2, y + s * 0.1, x - s * 0.3, y + s * 0.3]); // Left Eye
    drawTriangle([x + s * 0.4, y + s * 0.1, x + s * 0.2, y + s * 0.1, x + s * 0.3, y + s * 0.3]); // Right Eye
    drawTriangle([x - s * 0.1, y - s * 0.3, x + s * 0.1, y - s * 0.3, x, y - s * 0.5]); // Mouth
  }

  drawDecagon(x, y, r) {
    let segments = 10;
    let angleStep = 360 / segments;
    for (let i = 0; i < 360; i += angleStep) {
      let a1 = i * Math.PI / 180;
      let a2 = (i + angleStep) * Math.PI / 180;
      drawTriangle([x, y, x + Math.cos(a1) * r, y + Math.sin(a1) * r, x + Math.cos(a2) * r, y + Math.sin(a2) * r]);
    }
  }
}