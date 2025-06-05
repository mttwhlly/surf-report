// icons/generate-favicon.js
const { createCanvas } = require('canvas');
const fs = require('fs');

function generateFavicon() {
    const size = 32;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#0077cc';
    ctx.fillRect(0, 0, size, size);
    
    // Simple wave
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.7);
    
    for (let x = 0; x <= size; x++) {
        const y = size * 0.7 + (size * 0.1) * Math.sin((x / size) * Math.PI * 6);
        ctx.lineTo(x, y);
    }
    
    ctx.lineTo(size, size);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.fill();
    
    // Save as PNG (convert to ICO with online tool)
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('favicon-32.png', buffer);
    console.log('Generated favicon-32.png (convert to .ico)');
}

generateFavicon();