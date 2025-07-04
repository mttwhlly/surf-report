// Enhanced Blob Background with Fixed Z-Index Layering
class DynamicBlobBackground {
    constructor() {
        this.currentWeatherCode = null;
        this.currentTime = null;
        this.blobContainer = null;
        this.blobs = [];
        this.animationId = null;
        
        // Color palettes for different times and weather - now with multi-color gradients
        this.colorPalettes = {
            // Dawn & Sunrise
            'pre-dawn': [
                ['#1a1a2e', '#2d2d44'], 
                ['#2d2d44', '#3d3d5c'], 
                ['#3d3d5c', '#16213e'],
                ['#0f0f23', '#1a1a2e']
            ],
            'early-sunrise': [
                ['#ff6b6b', '#ffa500'], 
                ['#ffa500', '#ff8c82'], 
                ['#ff8c82', '#ffb6c1'],
                ['#ffb6c1', '#87ceeb']
            ],
            'sunrise': [
                ['#ff4500', '#ffa500'], 
                ['#ffa500', '#ffb6c1'], 
                ['#ffb6c1', '#ff6b6b'],
                ['#ff6b6b', '#ff4500']
            ],
            
            // Morning
            'early-morning': [
                ['#ffd700', '#87ceeb'], 
                ['#87ceeb', '#b0e0e6'], 
                ['#b0e0e6', '#4682b4'],
                ['#4682b4', '#ffd700']
            ],
            'mid-morning': [
                ['#87ceeb', '#b0e0e6'], 
                ['#b0e0e6', '#ffffff'], 
                ['#ffffff', '#4682b4'],
                ['#4682b4', '#87ceeb']
            ],
            
            // Midday & Afternoon
            'midday': [
                ['#ffffff', '#87ceeb'], 
                ['#87ceeb', '#b0e0e6'], 
                ['#b0e0e6', '#4682b4'],
                ['#4682b4', '#ffffff']
            ],
            'afternoon': [
                ['#ffa500', '#87ceeb'], 
                ['#87ceeb', '#ffb6c1'], 
                ['#ffb6c1', '#4682b4'],
                ['#4682b4', '#ffa500']
            ],
            'late-afternoon': [
                ['#ff8c00', '#ffa500'], 
                ['#ffa500', '#ff6b6b'], 
                ['#ff6b6b', '#ff4500'],
                ['#ff4500', '#ff8c00']
            ],
            
            // Evening & Sunset
            'golden-hour': [
                ['#ff4500', '#ffa500'], 
                ['#ffa500', '#ff6b6b'], 
                ['#ff6b6b', '#ff8c00'],
                ['#ff8c00', '#ff4500']
            ],
            'sunset': [
                ['#dc143c', '#ff4500'], 
                ['#ff4500', '#ff69b4'], 
                ['#ff69b4', '#8b008b'],
                ['#8b008b', '#4b0082']
            ],
            
            // Dusk & Night
            'dusk': [
                ['#8b008b', '#4b0082'], 
                ['#4b0082', '#ff69b4'], 
                ['#ff69b4', '#191970'],
                ['#191970', '#8b008b']
            ],
            'twilight': [
                ['#191970', '#4b0082'], 
                ['#4b0082', '#2f2f4f'], 
                ['#2f2f4f', '#000080'],
                ['#000080', '#191970']
            ],
            'night': [
                ['#191970', '#000080'], 
                ['#000080', '#2f2f4f'], 
                ['#2f2f4f', '#000000'],
                ['#000000', '#191970']
            ],
            'midnight': [
                ['#191970', '#000080'], 
                ['#000080', '#2f2f4f'], 
                ['#2f2f4f', '#000000'],
                ['#000000', '#191970']
            ],
            
            // Weather conditions
            'light-clouds': [
                ['#ffffff', '#f5f5f5'], 
                ['#f5f5f5', '#e6e6fa'], 
                ['#e6e6fa', '#b0c4de'],
                ['#b0c4de', '#87ceeb']
            ],
            'overcast': [
                ['#696969', '#708090'], 
                ['#708090', '#a9a9a9'], 
                ['#a9a9a9', '#2f4f4f'],
                ['#2f4f4f', '#696969']
            ],
            'heavy-clouds': [
                ['#2f4f4f', '#696969'], 
                ['#696969', '#708090'], 
                ['#708090', '#1c1c1c'],
                ['#1c1c1c', '#2f4f4f']
            ],
            'thunderstorm': [
                ['#1a1a1a', '#2f2f2f'], 
                ['#2f2f2f', '#4a4a4a'], 
                ['#4a4a4a', '#000000'],
                ['#000000', '#1a1a1a']
            ],
            'light-rain': [
                ['#b0c4de', '#87ceeb'], 
                ['#87ceeb', '#d3d3d3'], 
                ['#d3d3d3', '#708090'],
                ['#708090', '#b0c4de']
            ],
            'heavy-rain': [
                ['#2f4f4f', '#4682b4'], 
                ['#4682b4', '#708090'], 
                ['#708090', '#1c1c1c'],
                ['#1c1c1c', '#2f4f4f']
            ],
            'fog': [
                ['#f5f5f5', '#e6e6fa'], 
                ['#e6e6fa', '#d3d3d3'], 
                ['#d3d3d3', '#ffffff'],
                ['#ffffff', '#f0f0f0']
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
        console.log('🌊 DynamicBlobBackground class instantiated');
    }
    
    init() {
        if (this.isInitialized) {
            console.log('🌊 Blob background already initialized');
            return;
        }
        
        console.log('🌊 Initializing blob background system...');
        this.createBlobContainer();
        this.addStyles();
        this.updateBackground();
        this.startAnimation();
        this.startPeriodicUpdates();
        this.isInitialized = true;
        console.log('🌊 Blob background system initialized successfully');
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
        console.log('🌊 Blob container created behind everything (z-index: -100)');
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
            
            /* Blob-specific styles */
            .gradient-blob {
                position: absolute;
                border-radius: 50%;
                filter: blur(80px);
                pointer-events: none;
                mix-blend-mode: multiply;
                transition: all 3s ease-in-out;
                will-change: transform, opacity;
            }
            
            .gradient-blob.animate {
                animation: blobFloat 25s ease-in-out infinite;
            }
            
            @keyframes blobFloat {
                0%, 100% { 
                    transform: translate(0, 0) scale(1) rotate(0deg);
                }
                25% { 
                    transform: translate(-30px, -40px) scale(1.05) rotate(90deg);
                }
                50% { 
                    transform: translate(40px, -30px) scale(0.95) rotate(180deg);
                }
                75% { 
                    transform: translate(-20px, 35px) scale(1.02) rotate(270deg);
                }
            }
            
            /* Wave container positioning */
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
            
            /* Main content positioning */
            .container {
                position: relative !important;
                z-index: 10 !important;
                isolation: isolate;
            }
            
            .top-controls {
                position: fixed !important;
                z-index: 20 !important;
                isolation: isolate;
            }
            
            /* Enhanced glass morphism for blob backgrounds on white */
            .status-card, .detail-item, .weather-card, .tide-card {
                position: relative;
                z-index: 1;
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                background: rgba(255, 255, 255, 0.6);
                border: none;
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.8);
                color: #000000;
                isolation: isolate;
            }
            
            .top-controls {
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                background: rgba(255, 255, 255, 0.85);
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                isolation: isolate;
            }
            
            /* Text is always dark on white background */
            .location, .rating, .detail-value, .timestamp {
                color: #000000 !important;
                text-shadow: none !important;
                position: relative;
                z-index: 1;
            }
            
            /* Top controls adjustments for white background */
            .top-controls .btn {
                background: rgba(255, 255, 255, 0.9);
                color: #000000;
                border-color: rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 1;
            }
            
            .top-controls .btn:hover {
                background: rgba(255, 255, 255, 1);
                border-color: rgba(0, 0, 0, 0.2);
            }
            
            /* Force proper stacking order */
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
                .gradient-blob.animate {
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
        console.log('🎨 Fixed blob background styles added');
    }
    
    generateBlobs(gradients) {
        // Clear existing blobs
        this.blobs = [];
        this.blobContainer.innerHTML = '';
        
        // Set background to always be white
        document.body.style.background = '#ffffff';
        document.body.style.transition = 'background-color 3s ease-in-out';
        
        // Generate single large blob
        const blob = this.createCenteredBlob(gradients);
        this.blobs.push(blob);
        this.blobContainer.appendChild(blob.element);
        
        console.log(`🌊 Generated 1 large centered multi-color blob on white background`);
    }
    
    createCenteredBlob(gradients) {
        const blob = document.createElement('div');
        blob.className = 'gradient-blob animate';
        
        // Large size between 600px and 900px
        const size = 1200 + Math.random() * 300;
        
        // Center horizontally with slight random offset (±15% of screen width)
        const centerX = window.innerWidth / 2;
        const offsetX = (Math.random() - 0.5) * (window.innerWidth * 0.3); // ±15% offset
        const x = Math.max(0, Math.min(window.innerWidth - size, centerX - size/2 + offsetX));
        
        // Vertical position - random but ensure it's visible
        const maxY = window.innerHeight - size;
        const y = Math.random() * Math.max(100, maxY);
        
        // Pick random gradient from the palette
        const gradientIndex = Math.floor(Math.random() * gradients.length);
        const [color1, color2] = gradients[gradientIndex];
        
        // Random gradient shape for more variety
        const shapes = [
            'circle',
            'ellipse 120% 100%',
            'ellipse 100% 120%',
            'ellipse 130% 90%',
            'ellipse 90% 130%'
        ];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        // Higher opacity for single blob (0.4 to 0.8)
        const opacity = 0.2;
        
        // Random animation delay
        const delay = Math.random() * 5;
        
        // Create multi-color radial gradient with softer falloff
        const gradient = `radial-gradient(${shape}, ${color1} 0%, ${color2} 30%, ${color1} 60%, transparent 80%)`;
        
        blob.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: ${gradient};
            opacity: ${opacity};
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
            mix-blend-mode: multiply;
            animation-delay: ${delay}s;
            transition: all 3s ease-in-out;
            z-index: 1;
        `;
        
        return {
            element: blob,
            size,
            x,
            y,
            gradient,
            opacity
        };
    }
    
    updateBackground(weatherData = null, forceTime = null) {
        const now = forceTime || new Date();
        const hour = now.getHours();
        
        let paletteKey;
        
        console.log(`🕐 Updating blob background for hour: ${hour}, weather:`, weatherData?.weather_code);
        
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
        const gradients = this.colorPalettes[paletteKey];
        if (!gradients) return;
        
        // Update body classes for styling
        this.updateBodyClasses(paletteKey);
        
        // Generate new blobs with multi-color gradients
        this.generateBlobs(gradients);
        
        // Store current state
        this.currentPalette = paletteKey;
        
        console.log(`🎨 Applied multi-color blob palette: ${paletteKey}`);
    }
    
    updateBodyClasses(paletteKey) {
        const body = document.body;
        
        // Remove existing classes
        const existingClasses = Array.from(body.classList).filter(cls => 
            cls.includes('gradient') || Object.keys(this.colorPalettes).includes(cls)
        );
        existingClasses.forEach(cls => body.classList.remove(cls));
        
        // Add new classes
        body.classList.add(paletteKey);
        
        // Add helper classes
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
        console.log('🌊 Blob animations started via CSS');
    }
    
    startPeriodicUpdates() {
        // Update every 5 minutes
        this.updateInterval = setInterval(() => {
            console.log('🔄 Periodic blob background update');
            this.updateBackground();
        }, 5 * 60 * 1000);
    }
    
    // Manual override for testing
    setManualPalette(paletteKey, weatherCode = null) {
        console.log(`🎮 Manual palette override: ${paletteKey}, weather: ${weatherCode}`);
        
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
        console.log('🐛 Debug mode enabled - check element borders');
    }
    
    disableDebugMode() {
        document.body.classList.remove('debug-z-index');
        console.log('🐛 Debug mode disabled');
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
    
    getCurrentPalette() {
        return {
            key: this.currentPalette,
            time: new Date().toLocaleTimeString(),
            blobCount: 1, // Always 1 now
            isInitialized: this.isInitialized,
            containerZIndex: this.blobContainer?.style.zIndex || 'unknown'
        };
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
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
        console.log('🌊 Blob background system destroyed');
    }
}

// Integration functions
function initializeBlobBackground() {
    console.log('🚀 Starting blob background initialization...');
    
    if (!window.blobBackground) {
        window.blobBackground = new DynamicBlobBackground();
        console.log('✅ Blob background instance created');
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
        console.log('🔗 Integrating blob background with existing surf app...');
        integrateWithSurfApp();
    } else {
        console.log('⏳ Waiting for surf app to load...');
        const checkApp = setInterval(() => {
            if (window.app) {
                console.log('🔗 Surf app found, integrating blob background...');
                integrateWithSurfApp();
                clearInterval(checkApp);
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkApp);
            console.log('⚠️ Surf app not found, blob background running independently');
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
            console.log('🌊 Surf data fetch triggered, will update blob background');
            
            const result = await originalFetchSurfData.call(this);
            
            setTimeout(() => {
                if (this.surfData && this.surfData.weather) {
                    console.log('🌤️ Updating blob background with weather data:', this.surfData.weather);
                    window.blobBackground.updateBackground(this.surfData.weather);
                } else {
                    console.log('🌤️ No weather data, using time-based blob palette');
                    window.blobBackground.updateBackground();
                }
            }, 500);
            
            return result;
        };
        
        console.log('✅ Successfully integrated blob background with surf app');
    } else {
        console.log('⚠️ Could not find fetchSurfData method, blob background will run independently');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBlobBackground);
} else {
    initializeBlobBackground();
}

// Enhanced debug functions
window.blobBackgroundDebug = {
    testPalette: (name) => {
        if (window.blobBackground) {
            window.blobBackground.setManualPalette(name);
        } else {
            console.error('Blob background not initialized');
        }
    },
    testWeather: (code) => {
        if (window.blobBackground) {
            window.blobBackground.updateBackground({ weather_code: code });
        } else {
            console.error('Blob background not initialized');
        }
    },
    getStatus: () => {
        if (window.blobBackground) {
            return window.blobBackground.getCurrentPalette();
        } else {
            return { error: 'Blob background not initialized' };
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
        console.log(`🌊 Generated 1 large centered blob with multi-color gradient`);
        return { time, weather };
    },
    regenerateBlobs: () => {
        if (window.blobBackground && window.blobBackground.currentPalette) {
            const gradients = window.blobBackground.colorPalettes[window.blobBackground.currentPalette];
            window.blobBackground.generateBlobs(gradients);
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
        
        console.log('🔍 Z-Index Check:');
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

console.log('🌊 Fixed blob background system loaded. Try these commands:');
console.log('window.blobBackground.setManualPalette("sunrise")');
console.log('window.blobBackground.getCurrentPalette()');
console.log('window.blobBackgroundDebug.enableDebug() // shows borders');
console.log('window.blobBackgroundDebug.checkZIndex() // z-index diagnostic');
console.log('window.blobBackgroundDebug.testWeather(95) // thunderstorm');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        DynamicBlobBackground, 
        initializeBlobBackground,
        integrateWithSurfApp 
    };
}