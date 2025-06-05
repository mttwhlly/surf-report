class WaveAnimation {
    constructor(canvas, waveData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.waveData = waveData;
        this.animationId = null;
        this.time = 0;
        this.isRunning = false;
        
        this.setupCanvas();
        this.calculateWaveProperties();
    }

    setupCanvas() {
        this.resize();
        
        // Set canvas DPI scaling
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
    }

    resize() {
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
        }
    }

    calculateWaveProperties() {
        // Extract wave properties
        const waveHeight = this.waveData.wave_height_ft || 2;
        const wavePeriod = this.waveData.wave_period_sec || 8;
        const swellDirection = this.waveData.swell_direction_deg || 180;
        const windSpeed = this.waveData.wind_speed_kts || 10;
        
        // Calculate animation parameters
        this.amplitude = Math.max(10, Math.min(60, (waveHeight / 8) * 40));
        
        // Calculate frequency: more wavelengths for shorter periods
        // Use a base wavelength that looks good on screen
        const baseWavelength = 120; // pixels
        this.frequency = (2 * Math.PI) / baseWavelength;
        
        // Calculate speed to match real wave period
        // Speed should make one complete wave cycle (peak to peak) take wavePeriod seconds
        // In sine wave: one complete cycle = 2π radians
        // At ~60fps, we need: 2π radians in (wavePeriod * 60) frames
        this.speed = (2 * Math.PI) / (wavePeriod * 60);
        this.direction = (swellDirection * Math.PI) / 180;
        
        // Store original values for reference
        this.waveHeightFt = waveHeight;
        this.wavePeriodSec = wavePeriod;
        
        // Calculate reference lines and period indicators
        this.baseY = this.height / 2;
        this.maxWaveY = this.baseY - this.amplitude;
        this.minWaveY = this.baseY + this.amplitude;
        
        // Calculate wavelength in pixels (one complete wave cycle)
        this.wavelengthPx = (2 * Math.PI) / this.frequency;
        
        // Add timing verification (for development)
        console.log(`Wave period: ${wavePeriod}s, Wavelength: ${this.wavelengthPx.toFixed(1)}px, Speed: ${this.speed.toFixed(6)}`);
        console.log(`Expected frames for complete cycle: ${(2 * Math.PI / this.speed).toFixed(1)} frames (${((2 * Math.PI / this.speed) / 60).toFixed(1)}s)`);
        
        // Wave layers for depth
        this.waves = [
            {
                amplitude: this.amplitude,
                frequency: this.frequency,
                speed: this.speed,
                phase: 0,
                color: 'rgba(59, 130, 246, 0.8)',
                strokeColor: 'rgba(147, 197, 253, 0.9)'
            },
            {
                amplitude: this.amplitude * 0.6,
                frequency: this.frequency * 1.3,
                speed: this.speed * 1.5,
                phase: Math.PI / 3,
                color: 'rgba(29, 78, 216, 0.6)',
                strokeColor: 'rgba(147, 197, 253, 0.6)'
            },
            {
                amplitude: this.amplitude * 0.3,
                frequency: this.frequency * 2.1,
                speed: this.speed * 2.2,
                phase: Math.PI / 2,
                color: 'rgba(30, 58, 138, 0.4)',
                strokeColor: 'rgba(147, 197, 253, 0.3)'
            }
        ];
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stop();
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    animate() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw background gradient
        this.drawBackground();
        
        // Draw height reference lines (behind waves)
        this.drawHeightLines();
        
        // Draw period indicators (behind waves)
        this.drawPeriodIndicators();
        
        // Draw wave layers (back to front)
        for (let i = this.waves.length - 1; i >= 0; i--) {
            this.drawWave(this.waves[i]);
        }
        
        // Draw center reference line (on top of waves)
        this.drawCenterLine();
        
        // Add foam/whitecaps for higher waves
        if (this.waveData.wave_height_ft > 3) {
            this.drawFoam();
        }

        this.time += 1;
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(0.6, 'rgba(29, 78, 216, 0.2)');
        gradient.addColorStop(1, 'rgba(30, 58, 138, 0.1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawHeightLines() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        // Sea level (center line)
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.baseY);
        this.ctx.lineTo(this.width, this.baseY);
        this.ctx.stroke();
        
        // Max wave height line
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.maxWaveY);
        this.ctx.lineTo(this.width, this.maxWaveY);
        this.ctx.stroke();
        
        // Min wave height line (trough)
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.minWaveY);
        this.ctx.lineTo(this.width, this.minWaveY);
        this.ctx.stroke();
        
        // Reset line dash
        this.ctx.setLineDash([]);
        
        // Add height labels
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        this.ctx.textAlign = 'left';
        
        // Wave height label
        const halfHeight = this.waveHeightFt / 2;
        this.ctx.fillText(`+${halfHeight.toFixed(1)}ft`, 5, this.maxWaveY - 5);
        this.ctx.fillText(`0ft`, 5, this.baseY - 5);
        this.ctx.fillText(`-${halfHeight.toFixed(1)}ft`, 5, this.minWaveY + 15);
    }

    drawPeriodIndicators() {
        // Calculate how many complete wavelengths fit in the canvas
        const numWavelengths = Math.ceil(this.width / this.wavelengthPx) + 1;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        // Draw vertical lines at wavelength intervals to show period
        // Offset by the current wave phase to show moving reference
        const phaseOffset = (this.time * this.speed) % (2 * Math.PI);
        const pixelOffset = (phaseOffset / (2 * Math.PI)) * this.wavelengthPx;
        
        for (let i = 0; i <= numWavelengths; i++) {
            const x = (i * this.wavelengthPx - pixelOffset) % (this.width + this.wavelengthPx);
            if (x >= -10 && x <= this.width + 10) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 10);
                this.ctx.lineTo(x, this.height - 10);
                this.ctx.stroke();
            }
        }
        
        // Reset line dash
        this.ctx.setLineDash([]);
        
        // Add period label with more detail
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Period: ${this.wavePeriodSec}s`, this.width - 5, 20);
        this.ctx.fillText(`Wavelength: ${this.wavelengthPx.toFixed(0)}px`, this.width - 5, 35);
        
        // Add a timing indicator at center
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.wavePeriodSec}s per wave`, this.width / 2, this.height - 35);
    }

    drawCenterLine() {
        // Draw a more prominent center reference line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        
        const centerX = this.width / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 30);
        this.ctx.lineTo(centerX, this.height - 30);
        this.ctx.stroke();
        
        // Add center indicator
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CENTER', centerX, this.height - 15);
    }

    drawWave(wave) {
        const points = [];
        
        // Generate wave points
        for (let x = 0; x <= this.width + 20; x += 2) {
            const y = this.baseY + 
                wave.amplitude * Math.sin(wave.frequency * x + this.time * wave.speed + wave.phase) +
                (wave.amplitude * 0.2) * Math.sin(wave.frequency * 2.5 * x + this.time * wave.speed * 1.3);
            
            points.push({ x, y });
        }
        
        // Draw filled wave
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        // Complete the shape for filling
        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.closePath();
        
        // Create wave gradient
        const waveGradient = this.ctx.createLinearGradient(0, this.baseY - wave.amplitude, 0, this.height);
        waveGradient.addColorStop(0, wave.color);
        waveGradient.addColorStop(1, wave.color.replace(/[\d\.]+\)$/g, '0.1)'));
        
        this.ctx.fillStyle = waveGradient;
        this.ctx.fill();
        
        // Draw wave outline
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        this.ctx.strokeStyle = wave.strokeColor;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
    }

    drawFoam() {
        const foamParticles = 8;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        for (let i = 0; i < foamParticles; i++) {
            const x = (this.time * 2 + i * 50) % (this.width + 100) - 50;
            const y = this.baseY + 
                this.amplitude * 0.8 * Math.sin(this.frequency * x + this.time * this.speed) +
                Math.sin(this.time * 0.05 + i) * 5;
            
            const size = 2 + Math.sin(this.time * 0.1 + i) * 2;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}