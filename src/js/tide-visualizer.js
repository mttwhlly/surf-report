// Static Tide Wave Visualization Class
class TideWaveVisualizer {
    constructor(canvas, tideData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tideData = tideData || {};
        
        this.setupCanvas();
        this.drawStaticTideWave();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    drawStaticTideWave() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Calculate tide parameters
        const currentHeight = this.tideData.current_height_ft || 3;
        const nextHigh = this.tideData.next_high?.height || 6;
        const nextLow = this.tideData.next_low?.height || 0;
        
        // Draw static sine wave representing tide cycle
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        const amplitude = this.height * 0.3;
        const centerY = this.height / 2;
        
        for (let x = 0; x <= this.width; x += 2) {
            const normalizedX = x / this.width;
            const y = centerY + amplitude * Math.sin(normalizedX * Math.PI * 2);
            
            if (x === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // Draw current position marker (center represents "now")
        const currentX = this.width * 0.5;
        const currentY = centerY; // Simplified to center for static display
        
        this.ctx.fillStyle = '#d32f2f';
        this.ctx.beginPath();
        this.ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // High tide marker (75% position)
        const highX = this.width * 0.75;
        const highY = centerY - amplitude;
        
        this.ctx.fillStyle = '#1976d2';
        this.ctx.beginPath();
        this.ctx.arc(highX, highY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Low tide marker (25% position)
        const lowX = this.width * 0.25;
        const lowY = centerY + amplitude;
        
        this.ctx.fillStyle = '#ff5722';
        this.ctx.beginPath();
        this.ctx.arc(lowX, lowY, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    updateTideData(newData) {
        this.tideData = { ...this.tideData, ...newData };
        this.drawStaticTideWave();
    }

    destroy() {
        // Static visualization doesn't need cleanup
    }
}