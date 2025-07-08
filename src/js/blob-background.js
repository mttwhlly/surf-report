// Enhanced Blob Background with Noise & Gradient Mesh
class DynamicBlobBackground {
    constructor() {
        this.currentWeatherCode = null;
        this.currentTime = null;
        this.blobContainer = null;
        this.blobs = [];
        this.animationId = null;
        this.svgFilters = null;
        
        // Color palettes for different times and weather
        this.colorPalettes = {
            // Dawn & Sunrise
            'pre-dawn': [
                '#1a1a2e', '#2d2d44', '#3d3d5c', '#16213e', '#0f0f23'
            ],
            'early-sunrise': [
                '#ff6b6b', '#ffa500', '#ff8c82', '#ffb6c1', '#87ceeb'
            ],
            'sunrise': [
                '#ff4500', '#ffa500', '#ffb6c1', '#ff6b6b', '#ff8c00'
            ],
            
            // Morning
            'early-morning': [
                '#ffd700', '#87ceeb', '#b0e0e6', '#4682b4', '#ffffff'
            ],
            'mid-morning': [
                '#87ceeb', '#b0e0e6', '#ffffff', '#4682b4', '#add8e6'
            ],
            
            // Midday & Afternoon
            'midday': [
                '#ffffff', '#87ceeb', '#b0e0e6', '#4682b4', '#f0f8ff'
            ],
            'afternoon': [
                '#ffa500', '#87ceeb', '#ffb6c1', '#4682b4', '#ffd700'
            ],
            'late-afternoon': [
                '#ff8c00', '#ffa500', '#ff6b6b', '#ff4500', '#ffb347'
            ],
            
            // Evening & Sunset
            'golden-hour': [
                '#ff4500', '#ffa500', '#ff6b6b', '#ff8c00', '#ffb347'
            ],
            'sunset': [
                '#dc143c', '#ff4500', '#ff69b4', '#8b008b', '#4b0082'
            ],
            
            // Dusk & Night
            'dusk': [
                '#8b008b', '#4b0082', '#ff69b4', '#191970', '#663399'
            ],
            'twilight': [
                '#191970', '#4b0082', '#2f2f4f', '#000080', '#483d8b'
            ],
            'night': [
                '#191970', '#000080', '#2f2f4f', '#000000', '#1e1e3f'
            ],
            'midnight': [
                '#191970', '#000080', '#2f2f4f', '#000000', '#0d0d1a'
            ],
            
            // Weather conditions
            'light-clouds': [
                '#ffffff', '#f5f5f5', '#e6e6fa', '#b0c4de', '#87ceeb'
            ],
            'overcast': [
                '#696969', '#708090', '#a9a9a9', '#2f4f4f', '#778899'
            ],
            'heavy-clouds': [
                '#2f4f4f', '#696969', '#708090', '#1c1c1c', '#36454f'
            ],
            'thunderstorm': [
                '#1a1a1a', '#2f2f2f', '#4a4a4a', '#000000', '#333333'
            ],
            'light-rain': [
                '#b0c4de', '#87ceeb', '#d3d3d3', '#708090', '#9acd32'
            ],
            'heavy-rain': [
                '#2f4f4f', '#4682b4', '#708090', '#1c1c1c', '#36648b'
            ],
            'fog': [
                '#f5f5f5', '#e6e6fa', '#d3d3d3', '#ffffff', '#f0f0f0'
            ]
        };
        
        // Weather code mappings
        this.weatherGradients = {
            1: 'light-clouds', 2: 'light-clouds', 3: 'overcast',
            45: 'fog', 48: 'fog',
            51: 'light-rain', 53: 'light-rain', 55: 'light-rain', 80: 'light-rain',
            61: 'heavy-rain', 63: 'heavy-rain', 65: 'heavy-rain', 81: 'heavy-rain', 82: 'heavy-rain',
            71: 'overcast', 73: 'heavy-clouds', 75: 'heavy-clouds', 85: 'overcast', 86: 'heavy-clouds',
            95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm'
        };
        
        // Time range mappings
        this.timeRanges = {
            'pre-dawn': [4, 6], 'early-sunrise': [6, 7], 'sunrise': [7, 8],
            'early-morning': [8, 10], 'mid-morning': [10, 12], 'midday': [12, 15],
            'afternoon': [15, 17], 'late-afternoon': [17, 18], 'golden-hour': [18, 19],
            'sunset': [19, 20], 'dusk': [20, 21], 'twilight': [21, 22],
            'night': [22, 24], 'midnight': [0, 4]
        };
        
        this.isInitialized = false;
        console.log('🌊 Enhanced DynamicBlobBackground with noise & mesh gradients instantiated');
    }
    
    init() {
        if (this.isInitialized) {
            console.log('🌊 Blob background already initialized');
            return;
        }
        
        console.log('🌊 Initializing enhanced blob background system...');
        this.createBlobContainer();
        this.createSVGFilters();
        this.addStyles();
        this.updateBackground();
        this.startAnimation();
        this.startPeriodicUpdates();
        this.isInitialized = true;
        console.log('🌊 Enhanced blob background system initialized successfully');
    }
    
    createBlobContainer() {
        // Remove existing container
        const existing = document.getElementById('blob-background-container');
        if (existing) existing.remove();
        
        // Create new container with proper positioning
        this.blobContainer = document.createElement('div');
        this.blobContainer.id = 'blob-background-container';
        this.blobContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: -100;
            overflow: hidden;
            isolation: isolate;
        `;
        
        // Insert as the very first child of body to ensure it's behind everything
        document.body.insertBefore(this.blobContainer, document.body.firstChild);
        console.log('🌊 Enhanced blob container created behind everything (z-index: -100)');
    }
    
    createSVGFilters() {
        // Create SVG element for filters
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = `
            position: absolute;
            width: 0;
            height: 0;
            pointer-events: none;
        `;
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Create noise filter
        const noiseFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        noiseFilter.setAttribute('id', 'blob-noise');
        noiseFilter.setAttribute('x', '0%');
        noiseFilter.setAttribute('y', '0%');
        noiseFilter.setAttribute('width', '100%');
        noiseFilter.setAttribute('height', '100%');
        
        // Turbulence for organic noise
        const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
        turbulence.setAttribute('baseFrequency', '0.9');
        turbulence.setAttribute('numOctaves', '3');
        turbulence.setAttribute('result', 'noise');
        turbulence.setAttribute('seed', Math.floor(Math.random() * 1000));
        
        // Displacement map for organic distortion
        const displacementMap = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
        displacementMap.setAttribute('in', 'SourceGraphic');
        displacementMap.setAttribute('in2', 'noise');
        displacementMap.setAttribute('scale', '15');
        displacementMap.setAttribute('xChannelSelector', 'R');
        displacementMap.setAttribute('yChannelSelector', 'G');
        displacementMap.setAttribute('result', 'displaced');
        
        // Gaussian blur for softness
        const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        blur.setAttribute('in', 'displaced');
        blur.setAttribute('stdDeviation', '2');
        blur.setAttribute('result', 'blurred');
        
        noiseFilter.appendChild(turbulence);
        noiseFilter.appendChild(displacementMap);
        noiseFilter.appendChild(blur);
        
        // Create enhanced noise filter for more dramatic effect
        const enhancedNoiseFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        enhancedNoiseFilter.setAttribute('id', 'blob-enhanced-noise');
        enhancedNoiseFilter.setAttribute('x', '-20%');
        enhancedNoiseFilter.setAttribute('y', '-20%');
        enhancedNoiseFilter.setAttribute('width', '140%');
        enhancedNoiseFilter.setAttribute('height', '140%');
        
        const enhancedTurbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
        enhancedTurbulence.setAttribute('baseFrequency', '0.02 0.1');
        enhancedTurbulence.setAttribute('numOctaves', '4');
        enhancedTurbulence.setAttribute('result', 'noise');
        enhancedTurbulence.setAttribute('seed', Math.floor(Math.random() * 2000));
        
        const enhancedDisplacement = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
        enhancedDisplacement.setAttribute('in', 'SourceGraphic');
        enhancedDisplacement.setAttribute('in2', 'noise');
        enhancedDisplacement.setAttribute('scale', '30');
        enhancedDisplacement.setAttribute('xChannelSelector', 'R');
        enhancedDisplacement.setAttribute('yChannelSelector', 'B');
        
        enhancedNoiseFilter.appendChild(enhancedTurbulence);
        enhancedNoiseFilter.appendChild(enhancedDisplacement);
        
        defs.appendChild(noiseFilter);
        defs.appendChild(enhancedNoiseFilter);
        svg.appendChild(defs);
        
        this.blobContainer.appendChild(svg);
        this.svgFilters = svg;
        
        console.log('🎨 SVG noise filters created');
    }
    
    generateMeshGradient(colors, size) {
        // Create an SVG for the mesh gradient
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
        `;
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const meshGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        const gradientId = `mesh-${Math.random().toString(36).substr(2, 9)}`;
        meshGradient.setAttribute('id', gradientId);
        
        // Create multiple overlapping radial gradients for mesh effect
        const gradients = [];
        const numGradients = Math.min(colors.length, 5);
        
        for (let i = 0; i < numGradients; i++) {
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
            const id = `gradient-${i}-${Math.random().toString(36).substr(2, 6)}`;
            gradient.setAttribute('id', id);
            
            // Random center point for each gradient
            const cx = 20 + Math.random() * 60; // 20% to 80%
            const cy = 20 + Math.random() * 60; // 20% to 80%
            const r = 30 + Math.random() * 40;  // 30% to 70%
            
            gradient.setAttribute('cx', `${cx}%`);
            gradient.setAttribute('cy', `${cy}%`);
            gradient.setAttribute('r', `${r}%`);
            
            // Create color stops
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', colors[i]);
            stop1.setAttribute('stop-opacity', '0.8');
            
            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '40%');
            stop2.setAttribute('stop-color', colors[i]);
            stop2.setAttribute('stop-opacity', '0.4');
            
            const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop3.setAttribute('offset', '100%');
            stop3.setAttribute('stop-color', colors[(i + 1) % colors.length]);
            stop3.setAttribute('stop-opacity', '0.1');
            
            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            gradient.appendChild(stop3);
            
            defs.appendChild(gradient);
            gradients.push(id);
        }
        
        svg.appendChild(defs);
        
        // Create multiple overlapping circles for the mesh effect
        for (let i = 0; i < gradients.length; i++) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', `${20 + Math.random() * 60}%`);
            circle.setAttribute('cy', `${20 + Math.random() * 60}%`);
            circle.setAttribute('r', `${25 + Math.random() * 30}%`);
            circle.setAttribute('fill', `url(#${gradients[i]})`);
            circle.setAttribute('opacity', '0.7');
            svg.appendChild(circle);
        }
        
        return svg;
    }
    
    addStyles() {
        if (document.getElementById('blob-background-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'blob-background-styles';
        style.textContent = `
            /* Root stacking context fix */
            html {
                position: relative;
                z-index: 0;
            }
            
            /* Body positioning for stacking context */
            body {
                position: relative;
                z-index: 1;
                isolation: isolate;
            }
            
            /* Blob container - always at the bottom */
            #blob-background-container {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: -100 !important;
                pointer-events: none !important;
                overflow: hidden !important;
                isolation: isolate;
            }
            
            /* Enhanced blob-specific styles with noise */
            .gradient-blob {
                position: absolute;
                border-radius: 50%;
                filter: blur(60px);
                pointer-events: none;
                mix-blend-mode: multiply;
                transition: all 4s ease-in-out;
                will-change: transform, opacity;
            }
            
            .gradient-blob.animate {
                animation: blobFloat 30s ease-in-out infinite;
            }
            
            /* Enhanced blob with noise filter */
            .gradient-blob.noisy {
                filter: blur(40px) url(#blob-noise);
            }
            
            .gradient-blob.super-noisy {
                filter: blur(30px) url(#blob-enhanced-noise);
            }
            
            /* Mesh gradient specific styles */
            .mesh-blob {
                position: absolute;
                border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
                filter: blur(50px);
                pointer-events: none;
                mix-blend-mode: screen;
                transition: all 5s ease-in-out;
                will-change: transform, opacity;
                animation: meshMorph 25s ease-in-out infinite;
            }
            
            @keyframes blobFloat {
                0%, 100% { 
                    transform: translate(0, 0) scale(1) rotate(0deg);
                }
                25% { 
                    transform: translate(-40px, -50px) scale(1.1) rotate(90deg);
                }
                50% { 
                    transform: translate(50px, -40px) scale(0.9) rotate(180deg);
                }
                75% { 
                    transform: translate(-30px, 40px) scale(1.05) rotate(270deg);
                }
            }
            
            @keyframes meshMorph {
                0%, 100% {
                    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
                    transform: translate(0, 0) scale(1) rotate(0deg);
                }
                20% {
                    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
                    transform: translate(-20px, -30px) scale(1.05) rotate(72deg);
                }
                40% {
                    border-radius: 70% 30% 40% 60% / 40% 50% 60% 50%;
                    transform: translate(30px, -20px) scale(0.95) rotate(144deg);
                }
                60% {
                    border-radius: 40% 70% 60% 30% / 70% 40% 50% 40%;
                    transform: translate(-10px, 30px) scale(1.02) rotate(216deg);
                }
                80% {
                    border-radius: 50% 50% 50% 50% / 60% 40% 60% 40%;
                    transform: translate(20px, -10px) scale(0.98) rotate(288deg);
                }
            }
            
            /* Wave container positioning - keep existing styles */
            .wave-container {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 1 !important;
                opacity: 1;
                mix-blend-mode: overlay;
                pointer-events: none;
                isolation: isolate;
            }
            
            /* Main content positioning - keep existing styles */
            .container {
                position: relative !important;
                z-index: 10 !important;
                isolation: isolate;
            }
            
            /* Only apply text color changes for readability */
            .location, .rating, .detail-value, .timestamp {
                position: relative;
                z-index: 1;
            }
            
            /* Force proper stacking order for visual elements */
            .detail-visual-bg {
                z-index: 0 !important;
            }
            
            .detail-label, .detail-value {
                z-index: 1 !important;
                position: relative;
            }
            
            /* Ensure all animated elements stay in their containers */
            .wind-lines-container,
            .period-visual-container {
                z-index: 0 !important;
                position: absolute;
                overflow: hidden;
            }
            
            /* Tide visual positioning */
            .tide-visual-container {
                position: relative;
                z-index: 0;
                isolation: isolate;
            }
            
            .tide-markers {
                z-index: 2 !important;
                position: absolute;
            }
            
            @media (prefers-reduced-motion: reduce) {
                .gradient-blob.animate,
                .mesh-blob {
                    animation: none;
                }
            }
            
            /* Debug helper (remove in production) */
            .debug-z-index #blob-background-container {
                border: 2px solid red;
            }
            
            .debug-z-index .wave-container {
                border: 2px solid blue;
            }
            
            .debug-z-index .container {
                border: 2px solid green;
            }
        `;
        document.head.appendChild(style);
        console.log('🎨 Enhanced blob background styles with noise & mesh added');
    }
    
    generateBlobs(colors) {
        // Clear existing blobs
        this.blobs = [];
        this.blobContainer.innerHTML = '';
        
        // Re-add SVG filters
        this.createSVGFilters();
        
        // Set background to always be white
        document.body.style.background = '#ffffff';
        document.body.style.transition = 'background-color 3s ease-in-out';
        
        // Generate 2-3 blobs with different techniques
        const numBlobs = 2 + Math.floor(Math.random() * 2); // 2-3 blobs
        
        for (let i = 0; i < numBlobs; i++) {
            const blob = Math.random() > 0.5 ? 
                this.createMeshBlob(colors, i) : 
                this.createNoisyBlob(colors, i);
            
            this.blobs.push(blob);
            this.blobContainer.appendChild(blob.element);
        }
        
        console.log(`🌊 Generated ${numBlobs} enhanced blobs with noise & mesh gradients`);
    }
    
    createMeshBlob(colors, index) {
        const blob = document.createElement('div');
        blob.className = 'mesh-blob animate';
        
        // Large size with variation
        const size = 800 + Math.random() * 600; // 800-1400px
        
        // Position with more spread
        const x = (Math.random() - 0.5) * window.innerWidth * 1.2;
        const y = (Math.random() - 0.5) * window.innerHeight * 1.2;
        
        // Create mesh gradient
        const meshSVG = this.generateMeshGradient(colors, size);
        
        // Random opacity
        const opacity = 0.15 + Math.random() * 0.25; // 0.15-0.4
        
        // Random animation delay
        const delay = Math.random() * 10;
        
        blob.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: calc(50% + ${x}px);
            top: calc(50% + ${y}px);
            transform: translate(-50%, -50%);
            opacity: ${opacity};
            animation-delay: ${delay}s;
            z-index: ${index + 1};
        `;
        
        blob.appendChild(meshSVG);
        
        return {
            element: blob,
            size,
            x,
            y,
            type: 'mesh',
            opacity
        };
    }
    
    createNoisyBlob(colors, index) {
        const blob = document.createElement('div');
        blob.className = `gradient-blob animate ${Math.random() > 0.5 ? 'noisy' : 'super-noisy'}`;
        
        // Large size with variation
        const size = 1000 + Math.random() * 500; // 1000-1500px
        
        // Position with spread
        const x = (Math.random() - 0.5) * window.innerWidth * 1.5;
        const y = (Math.random() - 0.5) * window.innerHeight * 1.5;
        
        // Create complex radial gradient with multiple colors
        const gradientStops = [];
        const numStops = Math.min(colors.length, 4);
        
        for (let i = 0; i < numStops; i++) {
            const position = (i / (numStops - 1)) * 80; // 0% to 80%
            gradientStops.push(`${colors[i]} ${position}%`);
        }
        gradientStops.push(`transparent 100%`);
        
        // Random gradient shape for more variety
        const shapes = [
            'circle',
            'ellipse 120% 80%',
            'ellipse 80% 120%',
            'ellipse 150% 70%',
            'ellipse 70% 150%'
        ];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        const gradient = `radial-gradient(${shape}, ${gradientStops.join(', ')})`;
        
        // Random opacity
        const opacity = 0.2 + Math.random() * 0.3; // 0.2-0.5
        
        // Random animation delay
        const delay = Math.random() * 8;
        
        blob.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: calc(50% + ${x}px);
            top: calc(50% + ${y}px);
            transform: translate(-50%, -50%);
            background: ${gradient};
            opacity: ${opacity};
            animation-delay: ${delay}s;
            z-index: ${index + 1};
        `;
        
        return {
            element: blob,
            size,
            x,
            y,
            type: 'noisy',
            gradient,
            opacity
        };
    }
    
    updateBackground(weatherData = null, forceTime = null) {
        const now = forceTime || new Date();
        const hour = now.getHours();
        
        let paletteKey;
        
        console.log(`🕐 Updating enhanced blob background for hour: ${hour}, weather:`, weatherData?.weather_code);
        
        // Check for weather override
        if (weatherData && weatherData.weather_code) {
            const weatherKey = this.weatherGradients[weatherData.weather_code];
            if (weatherKey && this.colorPalettes[weatherKey]) {
                paletteKey = weatherKey;
                console.log(`🌤️ Using weather-based palette: ${weatherKey} (code: ${weatherData.weather_code})`);
            }
        }
        
        // If no weather override, use time-based palette
        if (!paletteKey) {
            for (const [key, timeRange] of Object.entries(this.timeRanges)) {
                const [startHour, endHour] = timeRange;
                
                if (startHour > endHour) {
                    // Handle overnight ranges
                    if (hour >= startHour || hour < endHour) {
                        paletteKey = key;
                        break;
                    }
                } else {
                    if (hour >= startHour && hour < endHour) {
                        paletteKey = key;
                        break;
                    }
                }
            }
        }
        
        // Fallback to midday
        if (!paletteKey) {
            paletteKey = 'midday';
        }
        
        this.applyPalette(paletteKey);
    }
    
    applyPalette(paletteKey) {
        const colors = this.colorPalettes[paletteKey];
        if (!colors) return;
        
        // Update body classes for styling (minimal changes)
        this.updateBodyClasses(paletteKey);
        
        // Generate new blobs with enhanced effects
        this.generateBlobs(colors);
        
        // Store current state
        this.currentPalette = paletteKey;
        
        console.log(`🎨 Applied enhanced blob palette: ${paletteKey} with noise & mesh gradients`);
    }
    
    updateBodyClasses(paletteKey) {
        const body = document.body;
        
        // Remove existing classes
        const existingClasses = Array.from(body.classList).filter(cls => 
            cls.includes('gradient') || Object.keys(this.colorPalettes).includes(cls)
        );
        existingClasses.forEach(cls => body.classList.remove(cls));
        
        // Add new classes (minimal - only for palette tracking)
        body.classList.add(paletteKey);
        
        // Add helper classes (minimal - only for text readability if needed)
        const lightPalettes = ['midday', 'early-morning', 'mid-morning', 'light-clouds', 'fog'];
        const darkPalettes = ['midnight', 'night', 'pre-dawn', 'thunderstorm', 'heavy-clouds'];
        
        if (lightPalettes.includes(paletteKey)) {
            body.classList.add('light-gradient');
            body.classList.remove('dark-gradient');
        } else if (darkPalettes.includes(paletteKey)) {
            body.classList.add('dark-gradient');
            body.classList.remove('light-gradient');
        } else {
            body.classList.remove('light-gradient', 'dark-gradient');
        }
    }
    
    startAnimation() {
        // Blobs are animated via CSS, no need for manual animation loop
        console.log('🌊 Enhanced blob animations started via CSS');
    }
    
    startPeriodicUpdates() {
        // Update every 5 minutes
        this.updateInterval = setInterval(() => {
            console.log('🔄 Periodic enhanced blob background update');
            this.updateBackground();
        }, 5 * 60 * 1000);
    }
    
    // Manual override for testing
    setManualPalette(paletteKey, weatherCode = null) {
        console.log(`🎮 Manual enhanced palette override: ${paletteKey}, weather: ${weatherCode}`);
        
        if (weatherCode && this.weatherGradients[weatherCode]) {
            const weatherKey = this.weatherGradients[weatherCode];
            if (this.colorPalettes[weatherKey]) {
                this.applyPalette(weatherKey);
                return;
            }
        }
        
        if (this.colorPalettes[paletteKey]) {
            this.applyPalette(paletteKey);
        } else {
            console.error(`❌ Unknown palette key: ${paletteKey}`);
        }
    }
    
    // Debug function to add visual borders
    enableDebugMode() {
        document.body.classList.add('debug-z-index');
        console.log('🐛 Enhanced debug mode enabled - check element borders');
    }
    
    disableDebugMode() {
        document.body.classList.remove('debug-z-index');
        console.log('🐛 Enhanced debug mode disabled');
    }
    
    // Resize handler
    handleResize() {
        if (this.currentPalette) {
            // Regenerate blobs for new screen size
            setTimeout(() => {
                this.generateBlobs(this.colorPalettes[this.currentPalette]);
            }, 100);
        }
    }
    
    // Function to regenerate noise (creates new random patterns)
    regenerateNoise() {
        if (!this.svgFilters) return;
        
        // Update turbulence seeds for new noise patterns
        const turbulenceElements = this.svgFilters.querySelectorAll('feTurbulence');
        turbulenceElements.forEach(turbulence => {
            turbulence.setAttribute('seed', Math.floor(Math.random() * 5000));
        });
        
        console.log('🔄 Noise patterns regenerated');
    }
    
    // Function to adjust noise intensity
    adjustNoiseIntensity(intensity = 'medium') {
        if (!this.svgFilters) return;
        
        const settings = {
            light: { scale: '8', frequency: '0.5', octaves: '2' },
            medium: { scale: '15', frequency: '0.9', octaves: '3' },
            heavy: { scale: '25', frequency: '1.2', octaves: '4' },
            extreme: { scale: '40', frequency: '1.8', octaves: '5' }
        };
        
        const config = settings[intensity] || settings.medium;
        
        const displacementMaps = this.svgFilters.querySelectorAll('feDisplacementMap');
        const turbulenceElements = this.svgFilters.querySelectorAll('feTurbulence');
        
        displacementMaps.forEach(map => {
            map.setAttribute('scale', config.scale);
        });
        
        turbulenceElements.forEach(turbulence => {
            turbulence.setAttribute('baseFrequency', config.frequency);
            turbulence.setAttribute('numOctaves', config.octaves);
        });
        
        console.log(`🎛️ Noise intensity adjusted to: ${intensity}`);
    }
    
    // Function to create animated noise (continuously changing)
    startAnimatedNoise() {
        if (this.noiseAnimationId) return; // Already running
        
        const animateNoise = () => {
            this.regenerateNoise();
            
            // Schedule next update (every 3-8 seconds for organic feel)
            const nextUpdate = 3000 + Math.random() * 5000;
            this.noiseAnimationId = setTimeout(animateNoise, nextUpdate);
        };
        
        animateNoise();
        console.log('🌊 Animated noise started - patterns will continuously evolve');
    }
    
    stopAnimatedNoise() {
        if (this.noiseAnimationId) {
            clearTimeout(this.noiseAnimationId);
            this.noiseAnimationId = null;
            console.log('⏹️ Animated noise stopped');
        }
    }
    
    getCurrentPalette() {
        return {
            key: this.currentPalette,
            time: new Date().toLocaleTimeString(),
            blobCount: this.blobs.length,
            blobTypes: this.blobs.map(b => b.type),
            isInitialized: this.isInitialized,
            containerZIndex: this.blobContainer?.style.zIndex || 'unknown',
            hasNoise: true,
            hasMesh: true
        };
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.noiseAnimationId) {
            clearTimeout(this.noiseAnimationId);
        }
        
        if (this.blobContainer) {
            this.blobContainer.remove();
        }
        
        // Remove styles
        const styles = document.getElementById('blob-background-styles');
        if (styles) styles.remove();
        
        // Reset body
        document.body.style.background = '';
        document.body.classList.remove('light-gradient', 'dark-gradient', 'debug-z-index');
        
        this.isInitialized = false;
        console.log('🌊 Enhanced blob background system destroyed');
    }
}

// Integration functions
function initializeBlobBackground() {
    console.log('🚀 Starting enhanced blob background initialization...');
    
    if (!window.blobBackground) {
        window.blobBackground = new DynamicBlobBackground();
        console.log('✅ Enhanced blob background instance created');
    }
    
    window.blobBackground.init();
    
    // Window resize handler
    window.addEventListener('resize', () => {
        if (window.blobBackground) {
            window.blobBackground.handleResize();
        }
    });
    
    // Integration with surf app
    if (window.app) {
        console.log('🔗 Integrating enhanced blob background with existing surf app...');
        integrateWithSurfApp();
    } else {
        console.log('⏳ Waiting for surf app to load...');
        const checkApp = setInterval(() => {
            if (window.app) {
                console.log('🔗 Surf app found, integrating enhanced blob background...');
                integrateWithSurfApp();
                clearInterval(checkApp);
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkApp);
            console.log('⚠️ Surf app not found, enhanced blob background running independently');
        }, 10000);
    }
}

function integrateWithSurfApp() {
    if (!window.app || !window.blobBackground) {
        console.log('❌ Cannot integrate - missing app or blobBackground');
        return;
    }
    
    const originalFetchSurfData = window.app.fetchSurfData;
    
    if (typeof originalFetchSurfData === 'function') {
        window.app.fetchSurfData = async function() {
            console.log('🌊 Surf data fetch triggered, will update enhanced blob background');
            
            const result = await originalFetchSurfData.call(this);
            
            setTimeout(() => {
                if (this.surfData && this.surfData.weather) {
                    console.log('🌤️ Updating enhanced blob background with weather data:', this.surfData.weather);
                    window.blobBackground.updateBackground(this.surfData.weather);
                } else {
                    console.log('🌤️ No weather data, using time-based enhanced blob palette');
                    window.blobBackground.updateBackground();
                }
            }, 500);
            
            return result;
        };
        
        console.log('✅ Successfully integrated enhanced blob background with surf app');
    } else {
        console.log('⚠️ Could not find fetchSurfData method, enhanced blob background will run independently');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBlobBackground);
} else {
    initializeBlobBackground();
}

// Enhanced debug functions with noise controls
window.blobBackgroundDebug = {
    testPalette: (name) => {
        if (window.blobBackground) {
            window.blobBackground.setManualPalette(name);
        } else {
            console.error('Enhanced blob background not initialized');
        }
    },
    testWeather: (code) => {
        if (window.blobBackground) {
            window.blobBackground.updateBackground({ weather_code: code });
        } else {
            console.error('Enhanced blob background not initialized');
        }
    },
    getStatus: () => {
        if (window.blobBackground) {
            return window.blobBackground.getCurrentPalette();
        } else {
            return { error: 'Enhanced blob background not initialized' };
        }
    },
    listPalettes: () => {
        const time = [
            'pre-dawn', 'early-sunrise', 'sunrise', 'early-morning', 'mid-morning',
            'midday', 'afternoon', 'late-afternoon', 'golden-hour', 'sunset', 
            'dusk', 'twilight', 'night', 'midnight'
        ];
        const weather = [
            'light-clouds', 'overcast', 'heavy-clouds', 'thunderstorm', 
            'light-rain', 'heavy-rain', 'fog'
        ];
        console.log(`🌊 Enhanced blobs with noise & mesh gradients available`);
        return { time, weather };
    },
    regenerateBlobs: () => {
        if (window.blobBackground && window.blobBackground.currentPalette) {
            const colors = window.blobBackground.colorPalettes[window.blobBackground.currentPalette];
            window.blobBackground.generateBlobs(colors);
        }
    },
    // New noise controls
    regenerateNoise: () => {
        if (window.blobBackground) {
            window.blobBackground.regenerateNoise();
        }
    },
    adjustNoise: (intensity) => {
        if (window.blobBackground) {
            window.blobBackground.adjustNoiseIntensity(intensity);
        }
    },
    startAnimatedNoise: () => {
        if (window.blobBackground) {
            window.blobBackground.startAnimatedNoise();
        }
    },
    stopAnimatedNoise: () => {
        if (window.blobBackground) {
            window.blobBackground.stopAnimatedNoise();
        }
    },
    enableDebug: () => {
        if (window.blobBackground) {
            window.blobBackground.enableDebugMode();
        }
    },
    disableDebug: () => {
        if (window.blobBackground) {
            window.blobBackground.disableDebugMode();
        }
    },
    checkZIndex: () => {
        const container = document.getElementById('blob-background-container');
        const wave = document.querySelector('.wave-container');
        const content = document.querySelector('.container');
        
        console.log('🔍 Enhanced Z-Index Check:');
        console.log('Blob container:', container?.style.zIndex, getComputedStyle(container).zIndex);
        console.log('Wave container:', wave?.style.zIndex, getComputedStyle(wave).zIndex);
        console.log('Content container:', content?.style.zIndex, getComputedStyle(content).zIndex);
        
        return {
            blob: { set: container?.style.zIndex, computed: getComputedStyle(container).zIndex },
            wave: { set: wave?.style.zIndex, computed: getComputedStyle(wave).zIndex },
            content: { set: content?.style.zIndex, computed: getComputedStyle(content).zIndex }
        };
    },
    reinitialize: () => {
        if (window.blobBackground) {
            window.blobBackground.destroy();
        }
        delete window.blobBackground;
        initializeBlobBackground();
    }
};

console.log('🌊 Enhanced blob background system loaded with noise & mesh gradients!');
console.log('🎨 New features:');
console.log('  • SVG noise filters for organic textures');
console.log('  • Gradient mesh with random color placement');
console.log('  • Multiple blob types (noisy & mesh)');
console.log('  • Animated noise patterns');
console.log('  • Adjustable noise intensity');
console.log('');
console.log('🧪 Try these enhanced commands:');
console.log('window.blobBackground.setManualPalette("thunderstorm")');
console.log('window.blobBackgroundDebug.adjustNoise("extreme")');
console.log('window.blobBackgroundDebug.regenerateNoise()');
console.log('window.blobBackgroundDebug.startAnimatedNoise()');
console.log('window.blobBackgroundDebug.testWeather(95) // thunderstorm with noise');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        DynamicBlobBackground, 
        initializeBlobBackground,
        integrateWithSurfApp 
    };
}