// This script can be run with Node.js to generate icons
// npm install canvas
const { createCanvas } = require('canvas');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#0077cc');
    gradient.addColorStop(1, '#003366');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Wave shape
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    
    const waveHeight = size * 0.15;
    const baseY = size * 0.6;
    
    for (let x = 0; x <= size; x += 2) {
        const y = baseY + waveHeight * Math.sin((x / size) * Math.PI * 4);
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.lineTo(size, size);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.fill();
    
    // Save icon
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icon-${size}.png`, buffer);
    console.log(`Generated icon-${size}.png`);
}

// Generate all icon sizes
sizes.forEach(generateIcon);