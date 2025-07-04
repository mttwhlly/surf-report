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
        
        // Set canvas to full viewport size
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Style the canvas to cover full screen
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
    }

    resize() {
        // Handle window resize
        if (this.canvas) {
            const dpr = window.devicePixelRatio || 1;
            
            this.canvas.width = window.innerWidth * dpr;
            this.canvas.height = window.innerHeight * dpr;
            this.ctx.scale(dpr, dpr);
            
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            
            // Recalculate wave properties for new screen size
            this.calculateWaveProperties();
        }
    }

    calculateWaveProperties() {
        // Extract wave properties
        const waveHeight = this.waveData.wave_height_ft || 2;
        const wavePeriod = this.waveData.wave_period_sec || 8;
        const swellDirection = this.waveData.swell_direction_deg || 180;
        const windSpeed = this.waveData.wind_speed_kts || 10;
        
        // Calculate animation parameters based on screen size
        // Scale amplitude based on screen height for better visual effect
        this.amplitude = Math.max(20, Math.min(this.height * 0.15, (waveHeight / 8) * (this.height * 0.1)));
        
        // Calculate frequency: more wavelengths for shorter periods
        // Base wavelength scales with screen width for consistency
        const baseWavelength = Math.max(120, this.width * 0.3);
        this.frequency = (2 * Math.PI) / baseWavelength;
        
        // Calculate speed to match real wave period
        this.speed = (2 * Math.PI) / (wavePeriod * 60);
        this.direction = (swellDirection * Math.PI) / 180;
        
        // Store original values for reference
        this.waveHeightFt = waveHeight;
        this.wavePeriodSec = wavePeriod;
        
        // Calculate reference lines and period indicators
        this.baseY = this.height * 0.95; // Position waves in lower 40% of screen
        this.maxWaveY = this.baseY - this.amplitude;
        this.minWaveY = this.baseY + this.amplitude;
        
        // Calculate wavelength in pixels
        this.wavelengthPx = (2 * Math.PI) / this.frequency;
        
        // Wave layers for depth - adjusted for full screen
        this.waves = [
            {
                amplitude: this.amplitude,
                frequency: this.frequency,
                speed: this.speed,
                phase: 0,
                color: 'white',
                strokeColor: 'black'
            },
            {
                amplitude: this.amplitude * 0.7,
                frequency: this.frequency * 1.3,
                speed: this.speed * 1.5,
                phase: Math.PI / 3,
                color: 'white',
                strokeColor: 'black'
            },
            {
                amplitude: this.amplitude * 0.4,
                frequency: this.frequency * 2.1,
                speed: this.speed * 2.2,
                phase: Math.PI / 2,
                color: 'white',
                strokeColor: 'black'
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
        
        // Draw wave layers (back to front)
        for (let i = this.waves.length - 1; i >= 0; i--) {
            this.drawWave(this.waves[i]);
        }

        this.time += 1;
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawWave(wave) {
        const points = [];
        
        // Generate wave points across full width
        for (let x = 0; x <= this.width + 20; x += 3) {
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
        
        // Complete the shape for filling to bottom of screen
        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.closePath();
        
        // Create wave gradient from wave peak to bottom
        const waveGradient = this.ctx.createLinearGradient(0, this.baseY - wave.amplitude, 0, this.height);
        waveGradient.addColorStop(0, wave.color);
        waveGradient.addColorStop(0.7, wave.color.replace(/[\d\.]+\)$/g, '1)'));
        waveGradient.addColorStop(1, wave.color.replace(/[\d\.]+\)$/g, '1)'));
        
        this.ctx.fillStyle = waveGradient;
        this.ctx.fill();
        
        // Draw wave outline
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        this.ctx.strokeStyle = wave.strokeColor;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
}