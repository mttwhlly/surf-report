class SurfApp {
    constructor() {
        this.surfData = null;
        this.notificationsEnabled = false;
        this.API_URL = 'https://c0cgocok00o40c48c40k8g04.mttwhlly.cc/surfability';
        this.waveAnimation = null;
        this.tideWaveVisualizer = null;
        
        this.init();
    }

    async init() {
        await this.registerServiceWorker();
        this.setupEventListeners();
        this.loadNotificationPreference();
        await this.fetchSurfData();
        this.startAutoRefresh();
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
            if (this.surfData && this.waveAnimation) {
                setTimeout(() => this.waveAnimation.resize(), 100);
            }
            if (this.tideWaveVisualizer) {
                setTimeout(() => {
                    // Use the new resize method for EnhancedTideChart
                    this.tideWaveVisualizer.resize();
                }, 100);
            }
        });
    }

    async fetchSurfData() {
        this.hideError();

        try {
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

            this.surfData = await response.json();
            this.updateUI();
            this.startWaveAnimation();
            this.updateVisualizations();
            this.checkForGoodConditions();

        } catch (error) {
            console.error('Error fetching surf data:', error);
            this.showError(this.getErrorMessage(error));
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

        // Use real tide data if available, otherwise use simplified tide state
        const tideData = this.surfData.tides || {
            current_height_ft: parseFloat(this.surfData.details?.tide_height) || 3,
            state: this.surfData.details?.tide_state || 'Unknown'
        };

        // Replace TideWaveVisualizer with EnhancedTideChart
        this.tideWaveVisualizer = new EnhancedTideChart(container, tideData);
        this.updateTideMarkers();
    }

    updateTideMarkers() {
        const markersContainer = document.getElementById('tideMarkers');
        if (!markersContainer) return;

        markersContainer.innerHTML = '';

        // Add markers based on available data
        if (this.surfData.tides) {
            // Full tide data available
            if (this.surfData.tides.next_high) {
                const highMarker = document.createElement('div');
                highMarker.className = 'tide-marker';
                highMarker.textContent = this.surfData.tides.next_high.time;
                highMarker.style.left = '75%';
                highMarker.style.top = '10px';
                markersContainer.appendChild(highMarker);
            }

            if (this.surfData.tides.next_low) {
                const lowMarker = document.createElement('div');
                lowMarker.className = 'tide-marker';
                lowMarker.textContent = this.surfData.tides.next_low.time;
                lowMarker.style.left = '25%';
                lowMarker.style.bottom = '10px';
                markersContainer.appendChild(lowMarker);
            }
        } else {
            // Simplified markers for basic tide state
            const highMarker = document.createElement('div');
            highMarker.className = 'tide-marker';
            highMarker.textContent = 'High';
            highMarker.style.left = '75%';
            highMarker.style.top = '10px';
            markersContainer.appendChild(highMarker);

            const lowMarker = document.createElement('div');
            lowMarker.className = 'tide-marker';
            lowMarker.textContent = 'Low';
            lowMarker.style.left = '25%';
            lowMarker.style.bottom = '10px';
            markersContainer.appendChild(lowMarker);
        }

        // Current time marker
        const currentMarker = document.createElement('div');
        currentMarker.className = 'tide-marker';
        currentMarker.textContent = 'NOW';
        currentMarker.style.left = '50%';
        currentMarker.style.top = '50%';
        currentMarker.style.transform = 'translate(-50%, -50%)';
        currentMarker.style.background = 'rgba(211, 47, 47, 0.9)';
        markersContainer.appendChild(currentMarker);
    }

    getErrorMessage(error) {
        if (error.name === 'AbortError') {
            return 'Request timed out. Please check your connection.';
        } else if (error.message.includes('Failed to fetch')) {
            return 'Unable to connect. Check your internet connection.';
        } else {
            return `Failed to load surf conditions: ${error.message}`;
        }
    }

    updateUI() {
        if (!this.surfData) return;

        const surfDataEl = document.getElementById('surfData');
        surfDataEl.style.display = 'block';

        this.updateElement('location', this.surfData.location);
        this.updateElement('timestamp', this.formatTimestamp(this.surfData.timestamp));

        this.updateRating();
        this.updateElement('duration', this.surfData.goodSurfDuration);

        this.updateWeatherCard();
        this.updateTideCard();
        this.updateDetails();
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

        const weatherCard = document.getElementById('weatherCard');
        const weatherIcon = document.getElementById('weatherIcon');
        const weatherDescription = document.getElementById('weatherDescription');
        const airTemp = document.getElementById('airTemp');
        const waterTemp = document.getElementById('waterTemp');

        weatherCard.style.display = 'block';

        const icon = this.getWeatherIcon(this.surfData.weather.weather_code);
        weatherIcon.textContent = icon;

        weatherDescription.textContent = this.surfData.weather.weather_description;

        airTemp.textContent = Math.round(this.surfData.weather.air_temperature_f);
        waterTemp.textContent = Math.round(this.surfData.weather.water_temperature_f);
    }

    updateTideCard() {
        // Only show tide card if we have detailed tide data
        if (!this.surfData.tides) return;

        const tideCard = document.getElementById('tideCard');
        const tideHeight = document.getElementById('tideHeight');
        const tideStateFull = document.getElementById('tideStateFull');
        const nextHighTime = document.getElementById('nextHighTime');
        const nextHighHeight = document.getElementById('nextHighHeight');
        const nextLowTime = document.getElementById('nextLowTime');
        const nextLowHeight = document.getElementById('nextLowHeight');

        tideCard.style.display = 'block';

        const currentHeight = parseFloat(this.surfData.tides.current_height_ft);
        const displayHeight = !isNaN(currentHeight) ? currentHeight.toFixed(1) : '--';
        
        tideHeight.textContent = `${displayHeight} ft`;
        tideStateFull.textContent = this.surfData.tides.state || 'Unknown';

        if (this.surfData.tides.next_high) {
            nextHighTime.textContent = this.surfData.tides.next_high.time || '--';
            const highHeight = parseFloat(this.surfData.tides.next_high.height);
            const displayHighHeight = !isNaN(highHeight) ? highHeight.toFixed(1) : '--';
            nextHighHeight.textContent = `${displayHighHeight} ft`;
        } else {
            nextHighTime.textContent = '--';
            nextHighHeight.textContent = '-- ft';
        }

        if (this.surfData.tides.next_low) {
            nextLowTime.textContent = this.surfData.tides.next_low.time || '--';
            const lowHeight = parseFloat(this.surfData.tides.next_low.height);
            const displayLowHeight = !isNaN(lowHeight) ? lowHeight.toFixed(1) : '--';
            nextLowHeight.textContent = `${displayLowHeight} ft`;
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
        
        this.updateElement('waveHeight', `${details.wave_height_ft} ft`);
        
        const wavePeriodEl = document.getElementById('wavePeriod');
        if (wavePeriodEl) {
            wavePeriodEl.innerHTML = `${details.wave_period_sec} sec`;
            const swellArrow = this.createDirectionArrow(details.swell_direction_deg);
            const sourceDirection = (details.swell_direction_deg + 180) % 360;
            swellArrow.title = `Swell from ${this.getCompassDirection(sourceDirection)} (${details.swell_direction_deg}° swell direction)`;
            wavePeriodEl.appendChild(swellArrow);
        }
        
        const windSpeedEl = document.getElementById('windSpeed');
        if (windSpeedEl) {
            const windSpeedKts = Math.round(details.wind_speed_kts);
            windSpeedEl.innerHTML = `${windSpeedKts} kts`;
            const windArrow = this.createDirectionArrow(details.wind_direction_deg);
            const sourceDirection = (details.wind_direction_deg + 180) % 360;
            windArrow.title = `Wind from ${this.getCompassDirection(sourceDirection)} (${details.wind_direction_deg}° wind direction)`;
            windSpeedEl.appendChild(windArrow);
        }
        
        this.updateElement('tideState', details.tide_state);
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
        if (!this.surfData) return;

        const canvas = document.getElementById('waveCanvas');
        if (!canvas) return;

        if (this.waveAnimation) {
            this.waveAnimation.destroy();
        }

        this.waveAnimation = new WaveAnimation(canvas, this.surfData.details);
        this.waveAnimation.start();
    }

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

// Make app instance globally accessible for the tide chart
window.app = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SurfApp();
});

// Add CSS for toast animation
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
`;
document.head.appendChild(style);