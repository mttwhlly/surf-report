// Enhanced Sky Background System with Better Integration
class DynamicSkyBackground {
    constructor() {
        this.currentWeatherCode = null;
        this.currentTime = null;
        this.gradientClasses = {
            // Dawn & Sunrise (4:00 AM - 8:00 AM)
            'pre-dawn': {
                timeRange: [4, 6],
                gradient: `
                    radial-gradient(ellipse at 20% 80%, #1a1a2e 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 20%, #2d2d44 0%, transparent 50%),
                    radial-gradient(ellipse at 40% 40%, #3d3d5c 0%, transparent 50%),
                    linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #2d2d44 50%, #1a1a2e 75%, #0f0f23 100%)
                `
            },
            'early-sunrise': {
                timeRange: [6, 7],
                gradient: `
                    radial-gradient(ellipse at 30% 70%, #ff6b6b 0%, transparent 40%),
                    radial-gradient(ellipse at 70% 30%, #ffa500 0%, transparent 40%),
                    radial-gradient(ellipse at 50% 90%, #ff8c82 0%, transparent 60%),
                    linear-gradient(135deg, #87ceeb 0%, #ffb6c1 25%, #ffa500 50%, #ff6b6b 75%, #4682b4 100%)
                `
            },
            'sunrise': {
                timeRange: [7, 8],
                gradient: `
                    radial-gradient(ellipse at 40% 80%, #ff4500 0%, transparent 50%),
                    radial-gradient(ellipse at 60% 20%, #ffa500 0%, transparent 50%),
                    radial-gradient(ellipse at 20% 40%, #ffb6c1 0%, transparent 40%),
                    linear-gradient(135deg, #ff6b6b 0%, #ffa500 25%, #ffb6c1 50%, #87ceeb 75%, #4682b4 100%)
                `
            },
            
            // Morning (8:00 AM - 12:00 PM)
            'early-morning': {
                timeRange: [8, 10],
                gradient: `
                    radial-gradient(ellipse at 60% 30%, #ffd700 0%, transparent 40%),
                    radial-gradient(ellipse at 20% 60%, #87ceeb 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 80%, #b0e0e6 0%, transparent 40%),
                    linear-gradient(135deg, #87ceeb 0%, #b0e0e6 25%, #ffd700 50%, #87ceeb 75%, #4682b4 100%)
                `
            },
            'mid-morning': {
                timeRange: [10, 12],
                gradient: `
                    radial-gradient(ellipse at 40% 60%, #87ceeb 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 30%, #b0e0e6 0%, transparent 40%),
                    radial-gradient(ellipse at 20% 20%, #ffffff 0%, transparent 30%),
                    linear-gradient(135deg, #4682b4 0%, #87ceeb 25%, #b0e0e6 50%, #87ceeb 75%, #4682b4 100%)
                `
            },
            
            // Midday & Afternoon (12:00 PM - 6:00 PM)
            'midday': {
                timeRange: [12, 15],
                gradient: `
                    radial-gradient(ellipse at 50% 20%, #ffffff 0%, transparent 40%),
                    radial-gradient(ellipse at 30% 70%, #87ceeb 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 50%, #4682b4 0%, transparent 40%),
                    linear-gradient(135deg, #4682b4 0%, #87ceeb 25%, #b0e0e6 50%, #87ceeb 75%, #4682b4 100%)
                `
            },
            'afternoon': {
                timeRange: [15, 17],
                gradient: `
                    radial-gradient(ellipse at 60% 40%, #ffa500 0%, transparent 40%),
                    radial-gradient(ellipse at 20% 80%, #87ceeb 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 20%, #ffb6c1 0%, transparent 40%),
                    linear-gradient(135deg, #87ceeb 0%, #ffa500 25%, #ffb6c1 50%, #87ceeb 75%, #4682b4 100%)
                `
            },
            'late-afternoon': {
                timeRange: [17, 18],
                gradient: `
                    radial-gradient(ellipse at 70% 60%, #ff8c00 0%, transparent 50%),
                    radial-gradient(ellipse at 30% 30%, #ffa500 0%, transparent 40%),
                    radial-gradient(ellipse at 50% 80%, #ff6b6b 0%, transparent 40%),
                    linear-gradient(135deg, #ff8c00 0%, #ffa500 25%, #ff6b6b 50%, #ffa500 75%, #ff8c00 100%)
                `
            },
            
            // Evening & Sunset (6:00 PM - 8:00 PM)
            'golden-hour': {
                timeRange: [18, 19],
                gradient: `
                    radial-gradient(ellipse at 20% 70%, #ff4500 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 30%, #ffa500 0%, transparent 40%),
                    radial-gradient(ellipse at 50% 50%, #ff6b6b 0%, transparent 40%),
                    linear-gradient(135deg, #ff4500 0%, #ffa500 25%, #ff6b6b 50%, #ff8c00 75%, #ff4500 100%)
                `
            },
            'sunset': {
                timeRange: [19, 20],
                gradient: `
                    radial-gradient(ellipse at 30% 80%, #dc143c 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 20%, #ff4500 0%, transparent 40%),
                    radial-gradient(ellipse at 50% 40%, #ff69b4 0%, transparent 40%),
                    linear-gradient(135deg, #dc143c 0%, #ff4500 25%, #ff69b4 50%, #8b008b 75%, #4b0082 100%)
                `
            },
            
            // Dusk & Night (8:00 PM - 4:00 AM)
            'dusk': {
                timeRange: [20, 21],
                gradient: `
                    radial-gradient(ellipse at 40% 60%, #8b008b 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 40%, #4b0082 0%, transparent 40%),
                    radial-gradient(ellipse at 20% 20%, #ff69b4 0%, transparent 30%),
                    linear-gradient(135deg, #4b0082 0%, #8b008b 25%, #ff69b4 50%, #8b008b 75%, #191970 100%)
                `
            },
            'twilight': {
                timeRange: [21, 22],
                gradient: `
                    radial-gradient(ellipse at 60% 30%, #191970 0%, transparent 50%),
                    radial-gradient(ellipse at 20% 70%, #4b0082 0%, transparent 40%),
                    radial-gradient(ellipse at 80% 80%, #2f2f4f 0%, transparent 40%),
                    linear-gradient(135deg, #191970 0%, #4b0082 25%, #2f2f4f 50%, #191970 75%, #000080 100%)
                `
            },
            'night': {
                timeRange: [22, 24],
                gradient: `
                    radial-gradient(ellipse at 30% 40%, #191970 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 60%, #000080 0%, transparent 40%),
                    radial-gradient(ellipse at 50% 80%, #2f2f4f 0%, transparent 40%),
                    linear-gradient(135deg, #000080 0%, #191970 25%, #2f2f4f 50%, #000080 75%, #000000 100%)
                `
            },
            'midnight': {
                timeRange: [0, 4],
                gradient: `
                    radial-gradient(ellipse at 50% 50%, #191970 0%, transparent 60%),
                    radial-gradient(ellipse at 20% 80%, #000080 0%, transparent 40%),
                    radial-gradient(ellipse at 80% 20%, #2f2f4f 0%, transparent 30%),
                    linear-gradient(135deg, #000000 0%, #191970 25%, #000080 50%, #191970 75%, #000000 100%)
                `
            }
        };
        
        // Weather-based gradients (override time-based when weather conditions apply)
        this.weatherGradients = {
            // Light clouds
            1: 'light-clouds',
            2: 'light-clouds',
            3: 'overcast',
            
            // Fog
            45: 'fog',
            48: 'fog',
            
            // Drizzle/Light rain
            51: 'light-rain',
            53: 'light-rain',
            55: 'light-rain',
            56: 'light-rain',
            57: 'light-rain',
            80: 'light-rain',
            
            // Rain
            61: 'heavy-rain',
            63: 'heavy-rain',
            65: 'heavy-rain',
            66: 'heavy-rain',
            67: 'heavy-rain',
            81: 'heavy-rain',
            82: 'heavy-rain',
            
            // Snow (use overcast)
            71: 'overcast',
            73: 'heavy-clouds',
            75: 'heavy-clouds',
            77: 'heavy-clouds',
            85: 'overcast',
            86: 'heavy-clouds',
            
            // Thunderstorm
            95: 'thunderstorm',
            96: 'thunderstorm',
            99: 'thunderstorm'
        };
        
        // Weather condition gradients
        this.weatherSpecificGradients = {
            'light-clouds': `
                radial-gradient(ellipse at 40% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 40%),
                radial-gradient(ellipse at 70% 70%, rgba(245, 245, 245, 0.6) 0%, transparent 50%),
                radial-gradient(ellipse at 20% 60%, rgba(230, 230, 250, 0.4) 0%, transparent 40%),
                linear-gradient(135deg, #87ceeb 0%, #b0c4de 25%, #f5f5f5 50%, #87ceeb 75%, #4682b4 100%)
            `,
            'overcast': `
                radial-gradient(ellipse at 30% 40%, rgba(105, 105, 105, 0.8) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 60%, rgba(112, 128, 144, 0.7) 0%, transparent 40%),
                radial-gradient(ellipse at 50% 20%, rgba(169, 169, 169, 0.6) 0%, transparent 40%),
                linear-gradient(135deg, #696969 0%, #708090 25%, #a9a9a9 50%, #696969 75%, #2f4f4f 100%)
            `,
            'heavy-clouds': `
                radial-gradient(ellipse at 60% 50%, rgba(47, 79, 79, 0.9) 0%, transparent 50%),
                radial-gradient(ellipse at 20% 30%, rgba(105, 105, 105, 0.8) 0%, transparent 40%),
                radial-gradient(ellipse at 80% 80%, rgba(112, 128, 144, 0.7) 0%, transparent 40%),
                linear-gradient(135deg, #2f4f4f 0%, #696969 25%, #708090 50%, #2f4f4f 75%, #1c1c1c 100%)
            `,
            'storm-clouds': `
                radial-gradient(ellipse at 40% 60%, rgba(47, 47, 47, 0.9) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 20%, rgba(74, 74, 74, 0.8) 0%, transparent 40%),
                radial-gradient(ellipse at 20% 80%, rgba(54, 54, 54, 0.7) 0%, transparent 40%),
                linear-gradient(135deg, #2f2f2f 0%, #4a4a4a 25%, #363636 50%, #2f2f2f 75%, #1a1a1a 100%)
            `,
            'thunderstorm': `
                radial-gradient(ellipse at 50% 40%, rgba(26, 26, 26, 0.95) 0%, transparent 50%),
                radial-gradient(ellipse at 30% 70%, rgba(47, 47, 47, 0.9) 0%, transparent 40%),
                radial-gradient(ellipse at 80% 30%, rgba(74, 74, 74, 0.8) 0%, transparent 30%),
                linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #2f2f2f 50%, #1a1a1a 75%, #000000 100%)
            `,
            'light-rain': `
                radial-gradient(ellipse at 40% 40%, rgba(176, 196, 222, 0.7) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 70%, rgba(135, 206, 235, 0.6) 0%, transparent 40%),
                radial-gradient(ellipse at 20% 20%, rgba(211, 211, 211, 0.5) 0%, transparent 40%),
                linear-gradient(135deg, #708090 0%, #b0c4de 25%, #87ceeb 50%, #708090 75%, #2f4f4f 100%)
            `,
            'heavy-rain': `
                radial-gradient(ellipse at 60% 30%, rgba(47, 79, 79, 0.9) 0%, transparent 50%),
                radial-gradient(ellipse at 30% 80%, rgba(70, 130, 180, 0.8) 0%, transparent 40%),
                radial-gradient(ellipse at 80% 50%, rgba(112, 128, 144, 0.7) 0%, transparent 40%),
                linear-gradient(135deg, #2f4f4f 0%, #4682b4 25%, #708090 50%, #2f4f4f 75%, #1c1c1c 100%)
            `,
            'fog': `
                radial-gradient(ellipse at 50% 60%, rgba(245, 245, 245, 0.9) 0%, transparent 60%),
                radial-gradient(ellipse at 30% 30%, rgba(230, 230, 250, 0.8) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(211, 211, 211, 0.7) 0%, transparent 40%),
                linear-gradient(135deg, #f5f5f5 0%, #e6e6fa 25%, #d3d3d3 50%, #f5f5f5 75%, #dcdcdc 100%)
            `
        };
        
        this.isInitialized = false;
        console.log('🌅 DynamicSkyBackground class instantiated');
    }
    
    init() {
        if (this.isInitialized) {
            console.log('🌅 Sky background already initialized');
            return;
        }
        
        console.log('🌅 Initializing sky background system...');
        this.addStyles();
        this.updateBackground();
        this.startPeriodicUpdates();
        this.isInitialized = true;
        console.log('🌅 Sky background system initialized successfully');
    }
    
    addStyles() {
        if (document.getElementById('sky-background-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'sky-background-styles';
        style.textContent = `
            /* Enhanced body styles for sky gradients */
            body {
                min-height: 100vh;
                transition: background 3s ease-in-out;
                background-attachment: fixed;
                background-size: 400% 400%;
            }
            
            /* Ensure content is readable over gradients */
            .container, .top-controls {
                position: relative;
                z-index: 10;
            }
            
            /* Enhanced glass morphism effects over gradients */
            .status-card, .detail-item, .weather-card, .tide-card, .top-controls {
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                background: rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }
            
            /* Adjust for dark gradients */
            body.dark-gradient .status-card,
            body.dark-gradient .detail-item,
            body.dark-gradient .weather-card,
            body.dark-gradient .tide-card {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }
            
            body.dark-gradient .location,
            body.dark-gradient .rating,
            body.dark-gradient .detail-value,
            body.dark-gradient .timestamp {
                color: #ffffff;
            }
            
            /* Adjust for light gradients */
            body.light-gradient .status-card,
            body.light-gradient .detail-item,
            body.light-gradient .weather-card,
            body.light-gradient .tide-card {
                background: rgba(255, 255, 255, 0.25);
                color: #000000;
            }
            
            body.light-gradient .location,
            body.light-gradient .rating,
            body.light-gradient .detail-value,
            body.light-gradient .timestamp {
                color: #000000;
            }
            
            /* Wave canvas adjustments */
            .wave-container {
                opacity: 0.4;
                mix-blend-mode: overlay;
            }
            
            /* Text contrast adjustments */
            .rating, .location, .detail-value {
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            /* Top controls adjustments */
            body.dark-gradient .top-controls .btn {
                background: rgba(255, 255, 255, 0.2);
                color: #ffffff;
                border-color: rgba(255, 255, 255, 0.3);
            }
            
            body.light-gradient .top-controls .btn {
                background: rgba(255, 255, 255, 0.8);
                color: #000000;
                border-color: rgba(0, 0, 0, 0.2);
            }
            
            /* Subtle animation */
            body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: inherit;
                background-size: 400% 400%;
                animation: skyShift 60s ease-in-out infinite;
                opacity: 0.1;
                pointer-events: none;
                z-index: -1;
            }
            
            @keyframes skyShift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            
            @media (prefers-reduced-motion: reduce) {
                body::before {
                    animation: none;
                }
                body {
                    transition: none;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('🎨 Sky background styles added');
    }
    
    startPeriodicUpdates() {
        // Update every 5 minutes
        this.updateInterval = setInterval(() => {
            console.log('🔄 Periodic sky background update');
            this.updateBackground();
        }, 5 * 60 * 1000);
    }
    
    updateBackground(weatherData = null, forceTime = null) {
        const now = forceTime || new Date();
        const hour = now.getHours();
        
        let selectedGradient;
        let gradientKey;
        
        console.log(`🕐 Updating background for hour: ${hour}, weather:`, weatherData?.weather_code);
        
        // Check if we have weather data and if it should override time-based gradient
        if (weatherData && weatherData.weather_code) {
            const weatherKey = this.weatherGradients[weatherData.weather_code];
            if (weatherKey && this.weatherSpecificGradients[weatherKey]) {
                selectedGradient = this.weatherSpecificGradients[weatherKey];
                gradientKey = weatherKey;
                console.log(`🌤️ Using weather-based gradient: ${weatherKey} (code: ${weatherData.weather_code})`);
            }
        }
        
        // If no weather override, use time-based gradient
        if (!selectedGradient) {
            for (const [key, config] of Object.entries(this.gradientClasses)) {
                const [startHour, endHour] = config.timeRange;
                
                // Handle overnight ranges (e.g., midnight: 0-4)
                if (startHour > endHour) {
                    if (hour >= startHour || hour < endHour) {
                        selectedGradient = config.gradient;
                        gradientKey = key;
                        break;
                    }
                } else {
                    if (hour >= startHour && hour < endHour) {
                        selectedGradient = config.gradient;
                        gradientKey = key;
                        break;
                    }
                }
            }
        }
        
        // Fallback to midday if nothing matches
        if (!selectedGradient) {
            selectedGradient = this.gradientClasses.midday.gradient;
            gradientKey = 'midday';
        }
        
        this.applyGradient(selectedGradient, gradientKey);
    }
    
    applyGradient(gradient, key) {
        const body = document.body;
        
        // Remove existing gradient classes
        const existingClasses = Array.from(body.classList).filter(cls => 
            cls.includes('gradient') || 
            Object.keys(this.gradientClasses).includes(cls) ||
            Object.keys(this.weatherSpecificGradients).includes(cls)
        );
        existingClasses.forEach(cls => body.classList.remove(cls));
        
        // Add new gradient class
        body.classList.add(key);
        
        // Add helper classes for styling
        const lightGradients = ['midday', 'early-morning', 'mid-morning', 'light-clouds', 'fog'];
        const darkGradients = ['midnight', 'night', 'pre-dawn', 'thunderstorm', 'storm-clouds', 'heavy-clouds'];
        
        if (lightGradients.includes(key)) {
            body.classList.add('light-gradient');
            body.classList.remove('dark-gradient');
        } else if (darkGradients.includes(key)) {
            body.classList.add('dark-gradient');
            body.classList.remove('light-gradient');
        } else {
            body.classList.remove('light-gradient', 'dark-gradient');
        }
        
        // Apply the gradient
        body.style.background = gradient;
        body.style.backgroundAttachment = 'fixed';
        body.style.backgroundSize = '400% 400%';
        
        // Store current state
        this.currentGradient = key;
        
        console.log(`🎨 Applied sky gradient: ${key}`);
    }
    
    // Manual override for testing
    setManualGradient(timeKey, weatherCode = null) {
        console.log(`🎮 Manual gradient override: ${timeKey}, weather: ${weatherCode}`);
        
        if (weatherCode && this.weatherGradients[weatherCode]) {
            const weatherKey = this.weatherGradients[weatherCode];
            if (this.weatherSpecificGradients[weatherKey]) {
                this.applyGradient(this.weatherSpecificGradients[weatherKey], weatherKey);
                return;
            }
        }
        
        if (this.gradientClasses[timeKey]) {
            this.applyGradient(this.gradientClasses[timeKey].gradient, timeKey);
        } else {
            console.error(`❌ Unknown gradient key: ${timeKey}`);
        }
    }
    
    // Get current gradient info
    getCurrentGradient() {
        return {
            key: this.currentGradient,
            time: new Date().toLocaleTimeString(),
            weatherOverride: this.currentWeatherCode !== null,
            isInitialized: this.isInitialized
        };
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Remove styles
        const styles = document.getElementById('sky-background-styles');
        if (styles) styles.remove();
        
        // Reset body
        document.body.style.background = '';
        document.body.classList.remove('light-gradient', 'dark-gradient');
        
        this.isInitialized = false;
        console.log('🌅 Sky background system destroyed');
    }
}

// Enhanced Integration Function
function initializeSkyBackground() {
    console.log('🚀 Starting sky background initialization...');
    
    // Create and store the sky background instance
    if (!window.skyBackground) {
        window.skyBackground = new DynamicSkyBackground();
        console.log('✅ Sky background instance created');
    }
    
    // Initialize the system
    window.skyBackground.init();
    
    // Integration with existing surf app
    if (window.app) {
        console.log('🔗 Integrating with existing surf app...');
        integrateWithSurfApp();
    } else {
        console.log('⏳ Waiting for surf app to load...');
        // Wait for app to be available
        const checkApp = setInterval(() => {
            if (window.app) {
                console.log('🔗 Surf app found, integrating...');
                integrateWithSurfApp();
                clearInterval(checkApp);
            }
        }, 100);
        
        // Stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkApp);
            console.log('⚠️ Surf app not found within 10 seconds, sky background running independently');
        }, 10000);
    }
}

function integrateWithSurfApp() {
    if (!window.app || !window.skyBackground) {
        console.log('❌ Cannot integrate - missing app or skyBackground');
        return;
    }
    
    // Store original fetchSurfData method
    const originalFetchSurfData = window.app.fetchSurfData;
    
    if (typeof originalFetchSurfData === 'function') {
        // Override fetchSurfData to update background
        window.app.fetchSurfData = async function() {
            console.log('🌊 Surf data fetch triggered, will update sky background');
            
            // Call the original function
            const result = await originalFetchSurfData.call(this);
            
            // Update background with weather data after a short delay
            setTimeout(() => {
                if (this.surfData && this.surfData.weather) {
                    console.log('🌤️ Updating sky background with weather data:', this.surfData.weather);
                    window.skyBackground.updateBackground(this.surfData.weather);
                } else {
                    console.log('🌤️ No weather data, using time-based gradient');
                    window.skyBackground.updateBackground();
                }
            }, 500);
            
            return result;
        };
        
        console.log('✅ Successfully integrated with surf app fetchSurfData');
    } else {
        console.log('⚠️ Could not find fetchSurfData method, sky background will run independently');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSkyBackground);
} else {
    // DOM already loaded, initialize immediately
    initializeSkyBackground();
}

// Debug functions for console
window.skyBackgroundDebug = {
    testGradient: (name) => {
        if (window.skyBackground) {
            window.skyBackground.setManualGradient(name);
        } else {
            console.error('Sky background not initialized');
        }
    },
    testWeather: (code) => {
        if (window.skyBackground) {
            window.skyBackground.updateBackground({ weather_code: code });
        } else {
            console.error('Sky background not initialized');
        }
    },
    getStatus: () => {
        if (window.skyBackground) {
            return window.skyBackground.getCurrentGradient();
        } else {
            return { error: 'Sky background not initialized' };
        }
    },
    listGradients: () => {
        const gradients = [
            'pre-dawn', 'early-sunrise', 'sunrise', 'early-morning', 'mid-morning',
            'midday', 'afternoon', 'late-afternoon', 'golden-hour', 'sunset', 
            'dusk', 'twilight', 'night', 'midnight'
        ];
        const weather = [
            'light-clouds', 'overcast', 'heavy-clouds', 'storm-clouds', 
            'thunderstorm', 'light-rain', 'heavy-rain', 'fog'
        ];
        console.log('🎨 Available time gradients:', gradients);
        console.log('🌤️ Available weather gradients:', weather);
        return { time: gradients, weather };
    },
    reinitialize: () => {
        if (window.skyBackground) {
            window.skyBackground.destroy();
        }
        delete window.skyBackground;
        initializeSkyBackground();
    }
};

console.log('🌅 Sky background system loaded. Try these commands:');
console.log('window.skyBackground.setManualGradient("sunrise")');
console.log('window.skyBackground.getCurrentGradient()');
console.log('window.skyBackgroundDebug.listGradients()');
console.log('window.skyBackgroundDebug.testWeather(95) // thunderstorm');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        DynamicSkyBackground, 
        initializeSkyBackground,
        integrateWithSurfApp 
    };
}