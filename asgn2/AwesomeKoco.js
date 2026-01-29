class Koco {
  constructor() {
    this.type = 'koco';
    this.position = [0.0, 0.0];
    this.color = [0.8, 0.7, 0.5, 1.0]; 
    this.size = 100.0; 
  }

  render() {
    let [x, y] = this.position;
    let s = this.size / 400.0; 

    // Animation offsets
    let waddle = Math.sin(g_time * 5) * 0.1 * s; 
    let jump = Math.abs(Math.cos(g_time * 5)) * 0.05 * s;
  
    // --- 1. Body ---
    gl.uniform4f(u_FragColor, 0.8, 0.7, 0.5, 1.0);
    this.drawDecagon(x, y + jump, s);

    // --- 2. Arms ---
    // Left Arm (moves with jump + waddle)
    drawTriangle([x - s, y + jump + waddle, x - s * 1.3, y - s * 0.2 + jump + waddle, x - s, y - s * 0.2 + jump]);
    // Right Arm (moves with jump - waddle)
    drawTriangle([x + s, y + jump - waddle, x + s * 1.3, y - s * 0.2 + jump - waddle, x + s, y - s * 0.2 + jump]);

    // --- 3. Legs ---
    // FIXED: Added 'jump' so legs move with body
    drawTriangle([x - s * 0.4, y - s + jump, x - s * 0.6, y - s * 1.3 + jump, x - s * 0.2, y - s * 1.3 + jump]);
    drawTriangle([x + s * 0.4, y - s + jump, x + s * 0.6, y - s * 1.3 + jump, x + s * 0.2, y - s * 1.3 + jump]);

    // --- 4. Pot-Head Top ---
    // FIXED: Added 'jump'
    gl.uniform4f(u_FragColor, 0.7, 0.6, 0.4, 1.0); 
    drawTriangle([x - s, y + s * 0.2 + jump, x - s * 1.1, y + s * 0.6 + jump, x + s * 1.1, y + s * 0.6 + jump]);
    drawTriangle([x - s, y + s * 0.2 + jump, x + s * 1.1, y + s * 0.6 + jump, x + s, y + s * 0.2 + jump]);

    // --- 5. Plant Head & Leaves ---
    gl.uniform4f(u_FragColor, 0.0, 0.8, 0.0, 1.0); 
    
    let stemTopX = x;
    // Uses jump to stay attached
    let stemTopY = y + jump + s * g_kocoStemHeight;

    // Stem
    drawTriangle([x - s * 0.05, y + s * 0.6 + jump, x + s * 0.05, y + s * 0.6 + jump, stemTopX, stemTopY]);

    // Initial 'D' 
    drawTriangle([stemTopX - s*0.1, stemTopY, stemTopX - s*0.2, stemTopY, stemTopX - s*0.15, stemTopY + s*0.4]);
    drawTriangle([stemTopX - s*0.15, stemTopY + s*0.4, stemTopX - s*0.4, stemTopY + s*0.2, stemTopX - s*0.2, stemTopY + s*0.4]);
    drawTriangle([stemTopX - s*0.15, stemTopY, stemTopX - s*0.4, stemTopY + s*0.2, stemTopX - s*0.2, stemTopY]);

    // Initial 'R'
    drawTriangle([stemTopX + s*0.1, stemTopY, stemTopX + s*0.2, stemTopY, stemTopX + s*0.15, stemTopY + s*0.4]);
    drawTriangle([stemTopX + s*0.15, stemTopY + s*0.4, stemTopX + s*0.4, stemTopY + s*0.3, stemTopX + s*0.2, stemTopY + s*0.4]);
    drawTriangle([stemTopX + s*0.4, stemTopY + s*0.3, stemTopX + s*0.15, stemTopY + s*0.2, stemTopX + s*0.2, stemTopY + s*0.2]);
    drawTriangle([stemTopX + s*0.2, stemTopY + s*0.2, stemTopX + s*0.4, stemTopY, stemTopX + s*0.3, stemTopY]);

    // --- 6. Eyes and Mouth ---
    // FIXED: Added 'jump' to all Y coordinates
    gl.uniform4f(u_FragColor, 0.2, 0.1, 0.0, 1.0);
    drawTriangle([x - s * 0.4, y + s * 0.1 + jump, x - s * 0.2, y + s * 0.1 + jump, x - s * 0.3, y + s * 0.3 + jump]); 
    drawTriangle([x + s * 0.4, y + s * 0.1 + jump, x + s * 0.2, y + s * 0.1 + jump, x + s * 0.3, y + s * 0.3 + jump]); 
    drawTriangle([x - s * 0.1, y - s * 0.3 + jump, x + s * 0.1, y - s * 0.3 + jump, x, y - s * 0.5 + jump]); 
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