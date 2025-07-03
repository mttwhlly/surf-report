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
        this.startWaveAnimation();
        
        // Fetch real data asynchronously
        this.fetchSurfData();
        this.startAutoRefresh();
    }

    initializeUI() {
        // Show the UI immediately with placeholders
        const surfDataEl = document.getElementById('surfData');
        surfDataEl.style.display = 'block';

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
        // Create clean placeholder data with dashes for numerical values
        const placeholderData = {
            location: 'St. Augustine, FL',
            timestamp: new Date().toISOString(),
            rating: '...',
            surfable: true,
            score: 50, // Keep for internal calculations
            goodSurfDuration: 'Loading forecast...',
            details: {
                wave_height_ft: '-',
                wave_period_sec: '-',
                swell_direction_deg: 90, // Keep for arrow positioning
                wind_direction_deg: 180, // Keep for arrow positioning
                wind_speed_kts: '-',
                tide_state: 'Loading',
                tide_height_ft: '-',
                data_source: 'Loading...'
            },
            weather: {
                air_temperature_f: '-',
                water_temperature_f: '-',
                weather_code: 0,
                weather_description: 'Loading...'
            },
            tides: {
                current_height_ft: '-',
                state: 'Loading',
                next_high: { time: '--', height: '-' },
                next_low: { time: '--', height: '-' }
            }
        };

        // Store as temporary data
        this.surfData = placeholderData;
        
        // Update UI with smooth loading state
        this.updatePlaceholderUI();
    }

    updatePlaceholderUI() {
        // Add loading state styling
        this.addLoadingStates();
        
        // Update all UI elements with placeholder data
        this.updateRating();
        this.updateWeatherCard();
        this.updateTideCard();
        this.updateDetails();
        this.updateElement('timestamp', this.formatTimestamp(new Date().toISOString()));
    }

    addLoadingStates() {
        // Add subtle loading animations to data elements
        const loadingElements = [
            'rating', 'waveHeight', 'wavePeriod', 'windSpeed', 
            'airTemp', 'waterTemp', 'tideHeight', 'nextHighTime', 'nextLowTime'
        ];

        loadingElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.classList.add('loading-shimmer');
            }
        });

        // Add shimmer animation styles if not already present
        this.addShimmerStyles();
    }

    removeLoadingStates() {
        // Remove loading animations when real data arrives
        const loadingElements = document.querySelectorAll('.loading-shimmer');
        loadingElements.forEach(element => {
            element.classList.remove('loading-shimmer');
        });
    }

    addShimmerStyles() {
        if (document.getElementById('shimmer-styles')) return;

        const style = document.createElement('style');
        style.id = 'shimmer-styles';
        style.textContent = `
            .loading-shimmer {
                position: relative;
                overflow: hidden;
            }
            
            .loading-shimmer::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.4) 50%,
                    transparent 100%
                );
                animation: shimmer 2s ease-in-out infinite;
                pointer-events: none;
            }
            
            @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }
            
            @media (prefers-reduced-motion: reduce) {
                .loading-shimmer::after {
                    animation: none;
                }
            }
        `;
        document.head.appendChild(style);
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
        const refreshBtn = document.getElementById('refreshBtn');
        const notificationCheckbox = document.getElementById('notificationCheckbox');

        refreshBtn?.addEventListener('click', () => this.fetchSurfData());
        notificationCheckbox?.addEventListener('click', () => this.toggleNotifications());

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
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json',
                }
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
        
        // Remove loading states
        this.removeLoadingStates();
        
        // Store new data
        this.surfData = newData;
        
        // Update UI elements with smooth transitions
        this.updateUIWithTransitions();
        
        // Update visualizations
        this.updateVisualizations();
        
        // Update wave animation with real data
        this.startWaveAnimation();
        
        // Check for notifications
        this.checkForGoodConditions();
        
        console.log('✅ UI updated with real data');
    }

    updateUIWithTransitions() {
        // Update main elements with fade effect
        this.updateElementWithTransition('location', this.surfData.location);
        this.updateElementWithTransition('timestamp', this.formatTimestamp(this.surfData.timestamp));
        this.updateElementWithTransition('duration', this.surfData.goodSurfDuration);

        // Update rating with special handling
        this.updateRatingWithTransition();
        
        // Update cards
        this.updateWeatherCard();
        this.updateTideCard();
        this.updateDetails();
    }

    updateElementWithTransition(id, content) {
        const element = document.getElementById(id);
        if (!element) return;

        // Add transition class
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0.7';
        
        setTimeout(() => {
            element.textContent = content;
            element.style.opacity = '1';
        }, 150);
    }

    updateRatingWithTransition() {
        const rating = document.getElementById('rating');
        if (!rating) return;

        // Fade out
        rating.style.transition = 'all 0.3s ease';
        rating.style.opacity = '0.7';
        rating.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            // Update content and class
            rating.textContent = this.surfData.rating;
            rating.className = `rating ${this.surfData.rating.toLowerCase()}`;
            
            // Fade back in
            rating.style.opacity = '1';
            rating.style.transform = 'scale(1)';
        }, 150);
    }

    markDataAsStale() {
        // Add visual indicator that data is stale/offline
        const timestamp = document.getElementById('timestamp');
        if (timestamp) {
            timestamp.textContent = 'Offline - ' + this.formatTimestamp(new Date().toISOString());
            timestamp.style.opacity = '0.7';
        }
        
        // Add stale indicator to rating
        const rating = document.getElementById('rating');
        if (rating) {
            rating.classList.add('stale-data');
        }
        
        // Add stale data styling if not present
        this.addStaleDataStyles();
    }

    addStaleDataStyles() {
        if (document.getElementById('stale-data-styles')) return;

        const style = document.createElement('style');
        style.id = 'stale-data-styles';
        style.textContent = `
            .stale-data {
                opacity: 0.7 !important;
                filter: grayscale(0.3);
            }
        `;
        document.head.appendChild(style);
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

        // Prepare tide data
        let tideDataForChart;
        
        if (this.surfData.tides && this.surfData.tides.previous_low) {
            tideDataForChart = {
                tides: this.surfData.tides,
                current_height_ft: this.surfData.tides.current_height_ft || 3,
                state: this.surfData.tides.state || 'Unknown'
            };
        } else {
            tideDataForChart = {
                current_height_ft: parseFloat(this.surfData.details?.tide_height_ft) || 3,
                state: this.surfData.details?.tide_state || 'Unknown',
                tides: {
                    previous_low: {
                        time: "4:16 AM",
                        timestamp: new Date().toISOString().slice(0, 10) + " 04:16"
                    },
                    cycle_info: {
                        cycle_duration_hours: 12.4,
                        range_ft: 6
                    }
                }
            };
        }

        this.tideWaveVisualizer = new EnhancedTideChart(container, tideDataForChart);
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

    updateRating() {
        const rating = document.getElementById('rating');
        if (rating) {
            rating.textContent = this.surfData.rating;
            rating.className = `rating ${this.surfData.rating.toLowerCase()}`;
        }
    }

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
        if (!this.surfData.tides) return;

        const tideCard = document.getElementById('tideCard');
        const tideHeight = document.getElementById('tideHeight');
        const tideStateFull = document.getElementById('tideStateFull');
        const nextHighTime = document.getElementById('nextHighTime');
        const nextHighHeight = document.getElementById('nextHighHeight');
        const nextLowTime = document.getElementById('nextLowTime');
        const nextLowHeight = document.getElementById('nextLowHeight');

        tideCard.style.display = 'block';

        // Handle dash placeholders for tide height
        if (this.surfData.tides.current_height_ft === '-') {
            tideHeight.textContent = '- ft';
        } else {
            const currentHeight = parseFloat(this.surfData.tides.current_height_ft);
            const displayHeight = !isNaN(currentHeight) ? currentHeight.toFixed(1) : '--';
            tideHeight.textContent = `${displayHeight} ft`;
        }
        
        tideStateFull.textContent = this.surfData.tides.state || 'Unknown';

        // Handle next high tide
        if (this.surfData.tides.next_high) {
            nextHighTime.textContent = this.surfData.tides.next_high.time || '--';
            
            if (this.surfData.tides.next_high.height === '-') {
                nextHighHeight.textContent = '- ft';
            } else {
                const highHeight = parseFloat(this.surfData.tides.next_high.height);
                const displayHighHeight = !isNaN(highHeight) ? highHeight.toFixed(1) : '--';
                nextHighHeight.textContent = `${displayHighHeight} ft`;
            }
        } else {
            nextHighTime.textContent = '--';
            nextHighHeight.textContent = '-- ft';
        }

        // Handle next low tide
        if (this.surfData.tides.next_low) {
            nextLowTime.textContent = this.surfData.tides.next_low.time || '--';
            
            if (this.surfData.tides.next_low.height === '-') {
                nextLowHeight.textContent = '- ft';
            } else {
                const lowHeight = parseFloat(this.surfData.tides.next_low.height);
                const displayLowHeight = !isNaN(lowHeight) ? lowHeight.toFixed(1) : '--';
                nextLowHeight.textContent = `${displayLowHeight} ft`;
            }
        } else {
            nextLowTime.textContent = '--';
            nextLowHeight.textContent = '-- ft';
        }
    }

    getWeatherIcon(weatherCode) {
        const iconMap = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
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
        arrow.style.fontFamily = 'Bricolage Grotesque, sans-serif';
        arrow.style.fontSize = '1em';
        arrow.style.display = 'inline-block';
        arrow.style.marginLeft = '6px';
        arrow.style.color = '#000';
        arrow.style.transition = 'all 0.3s ease';
        arrow.style.fontWeight = '600';
        
        const rotationDegrees = degrees + 90;
        arrow.style.transform = `rotate(${rotationDegrees}deg)`;
        arrow.style.transformOrigin = 'center';
        
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

    startWaveAnimation() {
        const canvas = document.getElementById('waveCanvas');
        if (!canvas) return;

        if (this.waveAnimation) {
            this.waveAnimation.destroy();
        }

        // Use current surf data or fallback to minimal data for wave animation
        const waveData = this.surfData?.details || {
            wave_height_ft: 2.0,
            wave_period_sec: 8.0,
            swell_direction_deg: 90,
            wind_speed_kts: 10.0
        };

        // Don't break wave animation with dashes - use defaults if data is placeholder
        const safeWaveData = {
            wave_height_ft: waveData.wave_height_ft === '-' ? 2.0 : waveData.wave_height_ft,
            wave_period_sec: waveData.wave_period_sec === '-' ? 8.0 : waveData.wave_period_sec,
            swell_direction_deg: waveData.swell_direction_deg || 90,
            wind_speed_kts: waveData.wind_speed_kts === '-' ? 10.0 : waveData.wind_speed_kts
        };

        this.waveAnimation = new WaveAnimation(canvas, safeWaveData);
        this.waveAnimation.start();
    }

    // Notification methods remain the same...
    async toggleNotifications() {
        if (!('Notification' in window)) {
            this.showMessage('This browser does not support notifications');
            return;
        }

        if (!this.notificationsEnabled) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.notificationsEnabled = true;
                this.updateNotificationCheckbox(true);
                this.saveNotificationPreference();
                this.showMessage('Notifications enabled! You\'ll be alerted when conditions are good.');
            } else {
                this.showMessage('Notifications permission denied');
            }
        } else {
            this.notificationsEnabled = false;
            this.updateNotificationCheckbox(false);
            this.saveNotificationPreference();
            this.showMessage('Notifications disabled');
        }
    }

    updateNotificationCheckbox(enabled) {
        const checkbox = document.getElementById('notificationCheckbox');
        if (checkbox) {
            const icon = checkbox.querySelector('.checkbox-icon');
            
            if (icon) {
                icon.textContent = enabled ? '☑' : '☐';
                checkbox.setAttribute('aria-checked', enabled.toString());
            }
        }
    }

    loadNotificationPreference() {
        const enabled = localStorage.getItem('surf-notifications-enabled') === 'true';
        if (enabled && Notification.permission === 'granted') {
            this.notificationsEnabled = true;
            this.updateNotificationCheckbox(true);
        }
    }

    saveNotificationPreference() {
        localStorage.setItem('surf-notifications-enabled', this.notificationsEnabled.toString());
    }

    checkForGoodConditions() {
        if (!this.notificationsEnabled || !this.surfData) return;

        const isGoodConditions = this.surfData.score >= 70 || this.surfData.rating.toLowerCase() === 'good';
        
        if (isGoodConditions) {
            this.sendNotification();
        }
    }

    sendNotification() {
        if (!this.notificationsEnabled || Notification.permission !== 'granted') return;

        const lastNotification = localStorage.getItem('surf-last-notification');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (lastNotification && (now - parseInt(lastNotification)) < oneHour) {
            return;
        }

        new Notification('Great Surf Conditions! 🏄‍♂️', {
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

    hideError() {
        const error = document.getElementById('error');
        if (error) {
            error.style.display = 'none';
        }
    }

    showError(message) {
        const error = document.getElementById('error');
        if (error) {
            error.textContent = message;
            error.style.display = 'block';
        }
    }

    showMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease;
            font-family: 'Bricolage Grotesque', sans-serif;
            font-weight: 500;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showOfflineMessage() {
        this.showMessage('You are offline. Showing cached data.');
    }

    showUpdateAvailable() {
        const updateMessage = document.createElement('div');
        updateMessage.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: black;
                color: white;
                padding: 15px;
                text-align: center;
                z-index: 1000;
                backdrop-filter: blur(10px);
                font-family: 'Bricolage Grotesque', sans-serif;
            ">
                New version available! 
                <button onclick="window.location.reload()" style="
                    margin-left: 10px;
                    background: white;
                    color: #000;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: 'Bricolage Grotesque';
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                ">Update</button>
            </div>
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

// Add CSS for shimmer animation and transitions
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    /* Smooth transitions for data updates */
    .rating, .detail-value, .temp-value, .tide-height {
        transition: all 0.3s ease;
    }
    
    /* Loading state for placeholder cards */
    .status-card, .detail-item, .weather-card, .tide-card {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
`;
document.head.appendChild(style);