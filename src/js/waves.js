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
        this.frequency = (2 * Math.PI) / (wavePeriod * 15);
        this.speed = 0.02 + (windSpeed / 1000);
        this.direction = (swellDirection * Math.PI) / 180;
        
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
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(0.6, 'rgba(29, 78, 216, 0.2)');
        gradient.addColorStop(1, 'rgba(30, 58, 138, 0.1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawWave(wave) {
        const baseY = this.height / 2;
        const points = [];
        
        // Generate wave points
        for (let x = 0; x <= this.width + 20; x += 2) {
            const y = baseY + 
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
        const waveGradient = this.ctx.createLinearGradient(0, baseY - wave.amplitude, 0, this.height);
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
            const y = this.height / 2 + 
                this.amplitude * 0.8 * Math.sin(this.frequency * x + this.time * this.speed) +
                Math.sin(this.time * 0.05 + i) * 5;
            
            const size = 2 + Math.sin(this.time * 0.1 + i) * 2;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}