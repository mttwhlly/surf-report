class SurfApp {
    constructor() {
        this.surfData = null;
        this.notificationsEnabled = false;
        this.API_URL = 'https://c0cgocok00o40c48c40k8g04.mttwhlly.cc/surfability';
        this.waveAnimation = null;
        this.tideWaveVisualizer = null;
        this.isDataLoading = false;
        
        this.init();
    }

    async init() {
        // Initialize UI immediately with placeholders
        this.initializeUI();
        
        // Start background systems
        await this.registerServiceWorker();
        this.setupEventListeners();
        this.loadNotificationPreference();
        
        // Start wave animation with default parameters
        // this.startWaveAnimation();
        
        // Fetch real data asynchronously
        this.fetchSurfData();
        this.startAutoRefresh();
    }

    initializeUI() {
        // Show the UI immediately with placeholders
        const surfDataEl = document.getElementById('surfData');
        surfDataEl.classList.remove('hidden');

        // Set initial placeholder values
        this.updateElement('location', 'St. Augustine, FL');
        this.updateElement('timestamp', 'Loading conditions...');
        this.updateElement('rating', 'Loading');
        this.updateElement('duration', 'Checking current conditions...');

        // Initialize placeholders with smooth loading animations
        this.setPlaceholderData();
        
        // Start visualizations with default data
        this.updateVisualizations();
        
        console.log('🎨 UI initialized with placeholders');
    }

    setPlaceholderData() {
        // Create clean placeholder data
        const placeholderData = {
            location: 'St. Augustine, FL',
            timestamp: new Date().toISOString(),
            rating: '...',
            surfable: true,
            score: 50,
            goodSurfDuration: 'Loading forecast...',
            details: {
                wave_height_ft: '-',
                wave_period_sec: '-',
                swell_direction_deg: 90,
                wind_direction_deg: 180,
                wind_speed_kts: '-',
                tide_state: 'Loading',
                tide_height_ft: '-',
                data_source: 'Loading...'
            },
            weather: {
                air_temperature_f: '-',
                water_temperature_f: '-',
                weather_code: null,
                weather_description: 'Loading...'
            },
            tides: {
                current_height_ft: '-',
                state: 'Loading',
                next_high: { time: '--', height: '-' },
                next_low: { time: '--', height: '-' }
            }
        };

        this.surfData = placeholderData;
        this.updatePlaceholderUI();
    }

    updatePlaceholderUI() {
        // Add loading state using Tailwind utility function
        if (window.addLoadingStates) {
            window.addLoadingStates();
        }
        
        // Update all UI elements with placeholder data
        // this.updateRating();
        this.updateWeatherCard();
        this.updateTideCard();
        this.updateDetails();
        // this.updateElement('timestamp', this.formatTimestamp(new Date().toISOString()));
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                console.log('Service Worker registered:', registration.scope);

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateAvailable();
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    setupEventListeners() {
        const notificationBell = document.getElementById('notificationBell');

        notificationBell?.addEventListener('click', () => this.toggleNotifications());

        // Add keyboard support for the bell
        notificationBell?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleNotifications();
            }
        });

        window.addEventListener('online', () => this.fetchSurfData());
        window.addEventListener('offline', () => this.showOfflineMessage());

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.fetchSurfData();
            }
        });

        window.addEventListener('resize', () => {
            if (this.waveAnimation) {
                setTimeout(() => this.waveAnimation.resize(), 100);
            }
            if (this.tideWaveVisualizer) {
                setTimeout(() => {
                    this.tideWaveVisualizer.resize();
                }, 100);
            }
        });
    }

    async toggleNotifications() {
        console.log('🔔 Toggle notifications clicked, current state:', this.notificationsEnabled);
        
        if (!('Notification' in window)) {
            this.showMessage('This browser does not support notifications');
            return;
        }

        if (!this.notificationsEnabled) {
            const permission = await Notification.requestPermission();
            console.log('📱 Permission result:', permission);
            
            if (permission === 'granted') {
                this.notificationsEnabled = true;
                this.updateNotificationBell(true);
                this.saveNotificationPreference();
                this.showMessage('🔔 Notifications enabled! You\'ll be alerted when surf\'s up.');
            } else {
                this.showMessage('Notifications permission denied');
            }
        } else {
            this.notificationsEnabled = false;
            this.updateNotificationBell(false);
            this.saveNotificationPreference();
            this.showMessage('🔕 Notifications disabled');
        }
    }

    updateNotificationBell(enabled) {
        // Use the Tailwind utility function if available
        if (window.updateNotificationBell) {
            window.updateNotificationBell(enabled);
        }
    }

    loadNotificationPreference() {
        const enabled = localStorage.getItem('surf-notifications-enabled') === 'true';
        console.log('📱 Loading notification preference:', enabled);
        
        if (enabled && Notification.permission === 'granted') {
            this.notificationsEnabled = true;
            this.updateNotificationBell(true);
        } else {
            this.notificationsEnabled = false;
            this.updateNotificationBell(false);
        }
    }

    saveNotificationPreference() {
        localStorage.setItem('surf-notifications-enabled', this.notificationsEnabled.toString());
    }

    sendNotification() {
        if (!this.notificationsEnabled || Notification.permission !== 'granted') return;

        const lastNotification = localStorage.getItem('surf-last-notification');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (lastNotification && (now - parseInt(lastNotification)) < oneHour) {
            return;
        }

        new Notification('🏄‍♂️ Great Surf Conditions!', {
            body: `${this.surfData.location}: ${this.surfData.rating} conditions with ${this.surfData.details.wave_height_ft}ft waves!`,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-96.png',
            vibrate: [200, 100, 200, 100, 200],
            tag: 'surf-conditions',
            requireInteraction: false,
            silent: false
        });

        localStorage.setItem('surf-last-notification', now.toString());
    }

    async fetchSurfData() {
        if (this.isDataLoading) {
            console.log('🔄 Data fetch already in progress, skipping...');
            return;
        }

        this.isDataLoading = true;
        this.hideError();

        try {
            console.log('🌊 Fetching surf data...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(this.API_URL, {
                signal: controller.signal,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                cache: 'reload'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const newData = await response.json();
            
            // Smoothly update from placeholder to real data
            this.updateDataSmoothly(newData);
            
        } catch (error) {
            console.error('Error fetching surf data:', error);
            this.showError(this.getErrorMessage(error));
            
            // Keep placeholder data on error instead of hiding everything
            this.markDataAsStale();
        } finally {
            this.isDataLoading = false;
        }
    }

    updateDataSmoothly(newData) {
        console.log('📊 Updating UI with real data');
        
        // Remove loading states using Tailwind utility
        if (window.removeLoadingStates) {
            window.removeLoadingStates();
        }
        
        // Store new data
        this.surfData = newData;
        
        // Update UI elements with smooth transitions
        this.updateUIWithTransitions();
        
        // Update visualizations
        this.updateVisualizations();
        
        // Update wave animation with real data
        // this.startWaveAnimation();
        
        // Check for notifications
        this.checkForGoodConditions();
        
        console.log('✅ UI updated with real data');
    }

    updateUIWithTransitions() {
        // Update main elements with fade effect
        this.updateElementWithTransition('location', this.surfData.location);
        // this.updateElementWithTransition('timestamp', this.formatTimestamp(this.surfData.timestamp));
        this.updateElementWithTransition('duration', this.surfData.goodSurfDuration);

        // Update rating with special handling
        // this.updateRatingWithTransition();
        
        // Update cards
        this.updateWeatherCard();
        this.updateTideCard();
        this.updateDetails();
    }

    updateElementWithTransition(id, content) {
        const element = document.getElementById(id);
        if (!element) return;

        // Add Tailwind transition classes
        element.classList.add('transition-opacity', 'duration-300');
        element.classList.add('opacity-70');
        
        setTimeout(() => {
            element.textContent = content;
            element.classList.remove('opacity-70');
            element.classList.add('opacity-100');
        }, 150);
    }

    // updateRatingWithTransition() {
    //     const rating = document.getElementById('rating');
    //     if (!rating) return;

    //     // Fade out with Tailwind classes
    //     rating.classList.add('transition-all', 'duration-300', 'opacity-70', 'scale-95');
        
    //     setTimeout(() => {
    //         // Update content and class
    //         rating.textContent = this.surfData.rating;
            
    //         // Remove old rating classes and add new ones
    //         rating.className = rating.className.replace(/\b(excellent|good|marginal|poor)\b/g, '');
    //         rating.classList.add(this.surfData.rating.toLowerCase());
            
    //         // Fade back in
    //         rating.classList.remove('opacity-70', 'scale-95');
    //         rating.classList.add('opacity-100', 'scale-100');
    //     }, 150);
    // }

    markDataAsStale() {
        // Add visual indicator that data is stale/offline
        const timestamp = document.getElementById('timestamp');
        if (timestamp) {
            timestamp.textContent = 'Offline - ' + this.formatTimestamp(new Date().toISOString());
            timestamp.classList.add('opacity-70');
        }
        
        // Add stale indicator to rating
        const rating = document.getElementById('rating');
        if (rating) {
            rating.classList.add('opacity-70', 'grayscale');
        }
    }

    updateVisualizations() {
        if (!this.surfData) return;

        // Update tide wave visualization
        this.updateTideVisualization();
        
        // Update wave height background
        if (this.surfData.details?.wave_height_ft) {
            updateWaveHeightVisual(this.surfData.details.wave_height_ft);
        }
        
        // Update wind lines
        if (this.surfData.details?.wind_speed_kts && this.surfData.details?.wind_direction_deg) {
            updateWindVisual(this.surfData.details.wind_speed_kts, this.surfData.details.wind_direction_deg);
        }

        // Update period visualization
        if (this.surfData.details?.wave_period_sec && this.surfData.details?.swell_direction_deg) {
            updatePeriodVisual(this.surfData.details.wave_period_sec, this.surfData.details.swell_direction_deg);
        }
    }

updateTideVisualization() {
    const container = document.querySelector('.tide-visual-container');
    if (!container) return;

    if (this.tideWaveVisualizer) {
        this.tideWaveVisualizer.destroy();
    }

    // Use real API data when available
    let tideDataForChart;
    
    if (this.surfData && this.surfData.tides && this.surfData.tides.current_height_ft !== undefined) {
        // Use real API data - this is the correct path!
        tideDataForChart = {
            current_height_ft: this.surfData.tides.current_height_ft,
            state: this.surfData.tides.state,
            tides: {
                next_high: this.surfData.tides.next_high,
                next_low: this.surfData.tides.next_low,
                previous_high: this.surfData.tides.previous_high,
                previous_low: this.surfData.tides.previous_low,
                cycle_info: this.surfData.tides.cycle_info || {
                    cycle_duration_hours: 12.4,
                    range_ft: 4
                }
            }
        };
        console.log('🌊 Creating corrected tide chart with real API data:', tideDataForChart);
    } else {
        // Fallback data for loading state
        tideDataForChart = {
            current_height_ft: 2.0,
            state: 'Loading',
            tides: {
                cycle_info: {
                    cycle_duration_hours: 12.4,
                    range_ft: 4
                }
            }
        };
        console.log('🌊 Creating corrected tide chart with fallback data');
    }

    // Use the corrected tide chart class
    this.tideWaveVisualizer = new SmoothTideChart(container, tideDataForChart);
}

    getErrorMessage(error) {
        if (error.name === 'AbortError') {
            return 'Request timed out. Showing cached data.';
        } else if (error.message.includes('Failed to fetch')) {
            return 'Connection lost. Showing offline data.';
        } else {
            return `Using cached data: ${error.message}`;
        }
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    // updateRating() {
    //     const rating = document.getElementById('rating');
    //     if (rating) {
    //         rating.textContent = this.surfData.rating;
    //         // Remove existing rating classes and add new one
    //         rating.className = rating.className.replace(/\b(excellent|good|marginal|poor)\b/g, '');
    //         rating.classList.add(this.surfData.rating.toLowerCase());
    //     }
    // }

    updateWeatherCard() {
        if (!this.surfData.weather) return;

        const weatherIcon = document.getElementById('weatherIcon');
        const airTemp = document.getElementById('airTemp');
        const waterTemp = document.getElementById('waterTemp');

        const icon = this.getWeatherIcon(this.surfData.weather.weather_code);
        weatherIcon.textContent = icon;

        // Handle dash placeholders for temperatures
        const airTempText = this.surfData.weather.air_temperature_f === '-' ? '-' : Math.round(this.surfData.weather.air_temperature_f);
        const waterTempText = this.surfData.weather.water_temperature_f === '-' ? '-' : Math.round(this.surfData.weather.water_temperature_f);
        
        airTemp.textContent = airTempText;
        waterTemp.textContent = waterTempText;
    }

    updateTideCard() {
        const tideCard = document.getElementById('tideCard');
        if (!tideCard) return;
        
        // Use actual API tide data when available
        let tideData;
        if (this.surfData && this.surfData.tides && this.surfData.tides.current_height_ft !== undefined) {
            tideData = {
                currentHeight: this.surfData.tides.current_height_ft,
                state: this.surfData.tides.state,
                nextHigh: this.surfData.tides.next_high ? {
                    time: this.surfData.tides.next_high.time,
                    height: this.surfData.tides.next_high.height
                } : null,
                nextLow: this.surfData.tides.next_low ? {
                    time: this.surfData.tides.next_low.time,
                    height: this.surfData.tides.next_low.height
                } : null
            };
            console.log('🌊 Using API tide data:', tideData);
        } else {
            // Fallback to realistic calculator for loading state only
            const realisticTideData = window.tideCalculator ? 
                window.tideCalculator.getCurrentTideState() : 
                this.getFallbackTideData();
            tideData = realisticTideData;
            console.log('🌊 Using fallback tide data (loading state):', tideData);
        }
        
        const tideHeight = document.getElementById('tideHeight');
        const tideStateFull = document.getElementById('tideStateFull');
        const nextHighTime = document.getElementById('nextHighTime');
        const nextHighHeight = document.getElementById('nextHighHeight');
        const nextLowTime = document.getElementById('nextLowTime');
        const nextLowHeight = document.getElementById('nextLowHeight');

        tideCard.classList.remove('hidden');

        // Update current tide height and state
        if (tideHeight) {
            tideHeight.textContent = `${tideData.currentHeight} ft`;
        }
        
        if (tideStateFull) {
            tideStateFull.textContent = tideData.state.toUpperCase();
        }

        // Update next high tide
        if (tideData.nextHigh) {
            if (nextHighTime) nextHighTime.textContent = tideData.nextHigh.time;
            if (nextHighHeight) nextHighHeight.textContent = `${tideData.nextHigh.height} ft`;
        } else {
            if (nextHighTime) nextHighTime.textContent = '--';
            if (nextHighHeight) nextHighHeight.textContent = '-- ft';
        }

        // Update next low tide
        if (tideData.nextLow) {
            if (nextLowTime) nextLowTime.textContent = tideData.nextLow.time;
            if (nextLowHeight) nextLowHeight.textContent = `${tideData.nextLow.height} ft`;
        } else {
            if (nextLowTime) nextLowTime.textContent = '--';
            if (nextLowHeight) nextLowHeight.textContent = '-- ft';
        }
    }

    getFallbackTideData() {
        // Fallback if realistic calculator isn't available
        const now = new Date();
        const hour = now.getHours();
        
        // Simple logic based on current time
        let currentHeight, state, nextHigh, nextLow;
        
        if (hour >= 14 && hour <= 16) {
            // Around 3 PM - should be near low tide
            currentHeight = 0.8;
            state = 'Low';
            nextHigh = { time: '9:30 PM', height: 3.2 };
            nextLow = { time: '3:45 AM', height: 0.6 };
        } else if (hour >= 20 && hour <= 22) {
            // Around 9 PM - should be near high tide
            currentHeight = 3.1;
            state = 'High';
            nextLow = { time: '3:45 AM', height: 0.6 };
            nextHigh = { time: '9:50 AM', height: 3.4 };
        } else {
            // Default mid tide
            currentHeight = 2.0;
            state = 'Mid';
            nextHigh = { time: '6:30 PM', height: 3.0 };
            nextLow = { time: '12:45 AM', height: 0.8 };
        }
        
        return { currentHeight, state, nextHigh, nextLow };
    }

    getWeatherIcon(weatherCode) {
        // Return circle for loading state
        if (weatherCode === null || weatherCode === undefined) {
            return '○';
        }
        
        const iconMap = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
            45: '🌫️', 48: '🌫️',
            51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌨️', 57: '🌨️',
            61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌨️', 67: '🌨️',
            71: '🌨️', 73: '❄️', 75: '❄️', 77: '🌨️',
            80: '🌦️', 81: '🌧️', 82: '⛈️', 85: '🌨️', 86: '❄️',
            95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        return iconMap[weatherCode] || '🌤️';
    }

    getCompassDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    createDirectionArrow(degrees) {
        const arrow = document.createElement('span');
        arrow.textContent = '→';
        arrow.className = 'direction-arrow inline-block ml-1.5 text-black font-semibold';
        
        const rotationDegrees = degrees + 90;
        arrow.style.transform = `rotate(${rotationDegrees}deg)`;
        
        return arrow;
    }

    updateDetails() {
        const details = this.surfData.details;
        
        // Handle dash placeholders for wave height
        const waveHeightText = details.wave_height_ft === '-' ? '-' : `${details.wave_height_ft} ft`;
        this.updateElement('waveHeight', waveHeightText);
        
        const wavePeriodEl = document.getElementById('wavePeriod');
        if (wavePeriodEl) {
            const periodText = details.wave_period_sec === '-' ? '-' : `${details.wave_period_sec} sec`;
            wavePeriodEl.innerHTML = periodText;
            
            // Only add arrow if we have real data (not dashes)
            if (details.wave_period_sec !== '-' && details.swell_direction_deg) {
                const swellArrow = this.createDirectionArrow(details.swell_direction_deg);
                const sourceDirection = (details.swell_direction_deg + 180) % 360;
                swellArrow.title = `Swell from ${this.getCompassDirection(sourceDirection)} (${details.swell_direction_deg}° swell direction)`;
                wavePeriodEl.appendChild(swellArrow);
            }
        }
        
        const windSpeedEl = document.getElementById('windSpeed');
        if (windSpeedEl) {
            if (details.wind_speed_kts === '-') {
                windSpeedEl.innerHTML = '-';
            } else {
                const windSpeedKts = Math.round(details.wind_speed_kts);
                windSpeedEl.innerHTML = `${windSpeedKts} kts`;
                
                // Only add arrow if we have real data
                if (details.wind_direction_deg) {
                    const windArrow = this.createDirectionArrow(details.wind_direction_deg);
                    const sourceDirection = (details.wind_direction_deg + 180) % 360;
                    windArrow.title = `Wind from ${this.getCompassDirection(sourceDirection)} (${details.wind_direction_deg}° wind direction)`;
                    windSpeedEl.appendChild(windArrow);
                }
            }
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // startWaveAnimation() {
    //     const canvas = document.getElementById('waveCanvas');
    //     if (!canvas) return;

    //     if (this.waveAnimation) {
    //         this.waveAnimation.destroy();
    //     }

    //     // Use current surf data or fallback to minimal data for wave animation
    //     const waveData = this.surfData?.details || {
    //         wave_height_ft: 2.0,
    //         wave_period_sec: 8.0,
    //         swell_direction_deg: 90,
    //         wind_speed_kts: 10.0
    //     };

    //     // Don't break wave animation with dashes - use defaults if data is placeholder
    //     const safeWaveData = {
    //         wave_height_ft: waveData.wave_height_ft === '-' ? 2.0 : waveData.wave_height_ft,
    //         wave_period_sec: waveData.wave_period_sec === '-' ? 8.0 : waveData.wave_period_sec,
    //         swell_direction_deg: waveData.swell_direction_deg || 90,
    //         wind_speed_kts: waveData.wind_speed_kts === '-' ? 10.0 : waveData.wind_speed_kts
    //     };

    //     this.waveAnimation = new WaveAnimation(canvas, safeWaveData);
    //     this.waveAnimation.start();
    // }

    checkForGoodConditions() {
        if (!this.notificationsEnabled || !this.surfData) return;

        const isGoodConditions = this.surfData.score >= 70 || this.surfData.rating.toLowerCase() === 'good';
        
        if (isGoodConditions) {
            this.sendNotification();
        }
    }

    hideError() {
        const error = document.getElementById('error');
        if (error) {
            error.classList.add('hidden');
        }
    }

    showError(message) {
        const error = document.getElementById('error');
        if (error) {
            error.textContent = message;
            error.classList.remove('hidden');
        }
    }

    showMessage(message) {
        // Use Tailwind utility function if available
        if (window.showMessage) {
            window.showMessage(message);
        } else {
            // Fallback implementation
            console.log('📱 Message:', message);
        }
    }

    showOfflineMessage() {
        this.showMessage('You are offline. Showing cached data.');
    }

    showUpdateAvailable() {
        const updateMessage = document.createElement('div');
        updateMessage.className = 'fixed top-0 left-0 right-0 bg-black text-white p-4 text-center z-[1000] glass-effect';
        updateMessage.innerHTML = `
            New version available! 
            <button onclick="window.location.reload()" class="ml-3 bg-white text-black border-none px-4 py-2 rounded cursor-pointer font-semibold uppercase tracking-wider">Update</button>
        `;
        document.body.appendChild(updateMessage);
    }

    startAutoRefresh() {
        setInterval(() => {
            if (!document.hidden && navigator.onLine) {
                this.fetchSurfData();
            }
        }, 5 * 60 * 1000);
    }
}

// Make app instance globally accessible
window.app = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SurfApp();
});