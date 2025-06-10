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
        this.baseY = this.height * 0.6; // Position waves in lower 40% of screen
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
                color: 'white',//'rgb(100, 249, 229, 0.4)',
                strokeColor: 'black'
            },
            {
                amplitude: this.amplitude * 0.7,
                frequency: this.frequency * 1.3,
                speed: this.speed * 1.5,
                phase: Math.PI / 3,
                color: 'white',//'rgba(59, 130, 246, 0.4)',
                strokeColor: 'black'//rgba(147, 197, 253, 0.6)'
            },
            {
                amplitude: this.amplitude * 0.4,
                frequency: this.frequency * 2.1,
                speed: this.speed * 2.2,
                phase: Math.PI / 2,
                color: 'white',//'rgb(100, 249, 229, 0.4)',
                strokeColor: 'black'//'rgb(100, 249, 229, 0.6)'
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
        
        // Draw background gradient (full screen)
        // this.drawBackground();
        
        // Draw wave layers (back to front)
        for (let i = this.waves.length - 1; i >= 0; i--) {
            this.drawWave(this.waves[i]);
        }
        
        // Add foam/whitecaps for higher waves
        if (this.waveData.wave_height_ft > 3) {
            this.drawFoam();
        }

        this.time += 1;
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawBackground() {
        // Create a more subtle gradient that works as background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, 'rgba(0, 51, 102, 0.1)');
        gradient.addColorStop(0.4, 'rgba(0, 119, 204, 0.1)');
        gradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.15)');
        gradient.addColorStop(1, 'rgba(29, 78, 216, 0.2)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
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
        waveGradient.addColorStop(0.7, wave.color.replace(/[\d\.]+\)$/g, '0.05)'));
        waveGradient.addColorStop(1, wave.color.replace(/[\d\.]+\)$/g, '0.01)'));
        
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

    drawFoam() {
        const foamParticles = Math.floor(this.width / 50); // Scale particles with screen width
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        
        for (let i = 0; i < foamParticles; i++) {
            const x = (this.time * 2 + i * 80) % (this.width + 100) - 50;
            const y = this.baseY + 
                this.amplitude * 0.8 * Math.sin(this.frequency * x + this.time * this.speed) +
                Math.sin(this.time * 0.05 + i) * 8;
            
            const size = 2 + Math.sin(this.time * 0.1 + i) * 3;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}