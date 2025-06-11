class SurfApp {
    constructor() {
        this.surfData = null;
        this.notificationsEnabled = false;
        this.API_URL = 'https://c0cgocok00o40c48c40k8g04.mttwhlly.cc/surfability';
        this.waveAnimation = null;
        
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

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
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

        // Handle online/offline events
        window.addEventListener('online', () => this.fetchSurfData());
        window.addEventListener('offline', () => this.showOfflineMessage());

        // Handle visibility change for background updates
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.fetchSurfData();
            }
        });

        // Handle window resize for canvas
        window.addEventListener('resize', () => {
            if (this.surfData && this.waveAnimation) {
                setTimeout(() => this.waveAnimation.resize(), 100);
            }
        });
    }

    async fetchSurfData() {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const surfDataEl = document.getElementById('surfData');

        this.showLoading(true);
        this.hideError();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
            this.checkForGoodConditions();

        } catch (error) {
            console.error('Error fetching surf data:', error);
            this.showError(this.getErrorMessage(error));
        } finally {
            this.showLoading(false);
        }
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

        // Update header
        this.updateElement('location', this.surfData.location);
        this.updateElement('timestamp', this.formatTimestamp(this.surfData.timestamp));

        // Update status card
        this.updateRating();
        this.updateElement('score', this.surfData.score);
        this.updateElement('duration', this.surfData.goodSurfDuration);

        // Update details with direction arrows
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

    // Convert degrees to compass direction
    getCompassDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    // Create direction arrow using Degular font character
    createDirectionArrow(degrees, isSwellDirection = false) {
        const arrow = document.createElement('span');
        arrow.textContent = '→';
        arrow.style.fontFamily = 'DegularDisplay, sans-serif';
        arrow.style.fontSize = '1em';
        arrow.style.display = 'inline-block';
        arrow.style.marginLeft = '6px';
        arrow.style.color = '#000';
        arrow.style.transition = 'all 0.3s ease';
        
        // For swell direction: arrow points where swell is COMING FROM
        // For wind direction: arrow points where wind is COMING FROM
        // Both show source direction, so we need to rotate 180° from the given direction
        const rotationDegrees = degrees + 90;
        arrow.style.transform = `rotate(${rotationDegrees}deg)`;
        arrow.style.transformOrigin = 'center';
        
        return arrow;
    }

    updateDetails() {
        const details = this.surfData.details;
        
        // Wave Height (no direction needed)
        this.updateElement('waveHeight', `${details.wave_height_ft} ft`);
        
        // Wave Period with swell direction arrow
        const wavePeriodEl = document.getElementById('wavePeriod');
        if (wavePeriodEl) {
            wavePeriodEl.innerHTML = `${details.wave_period_sec} sec`;
            // Swell direction: show where the swell is coming FROM
            // 90° swell = traveling east, coming from west, so arrow points left
            const swellArrow = this.createDirectionArrow(details.swell_direction_deg, true);
            const sourceDirection = (details.swell_direction_deg + 180) % 360;
            swellArrow.title = `Swell from ${this.getCompassDirection(sourceDirection)} (${details.swell_direction_deg}° swell direction)`;
            wavePeriodEl.appendChild(swellArrow);
        }
        
        // Wind Speed with wind direction arrow  
        const windSpeedEl = document.getElementById('windSpeed');
        if (windSpeedEl) {
            const windSpeedKts = Math.round(details.wind_speed_kts);
            windSpeedEl.innerHTML = `${windSpeedKts} kts`;
            // Wind direction: show where the wind is coming FROM
            const windArrow = this.createDirectionArrow(details.wind_direction_deg);
            const sourceDirection = (details.wind_direction_deg + 180) % 360;
            windArrow.title = `Wind from ${this.getCompassDirection(sourceDirection)} (${details.wind_direction_deg}° wind direction)`;
            windSpeedEl.appendChild(windArrow);
        }
        
        // Tide State (no direction needed)
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
                console.log('Checkbox updated:', enabled ? 'checked ☑' : 'unchecked ☐'); // Debug log
            } else {
                console.error('Checkbox icon not found');
            }
        } else {
            console.error('Notification checkbox element not found');
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

        // Don't spam notifications - only send once per hour
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

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        const error = document.getElementById('error');
        if (error) {
            error.textContent = message;
            error.style.display = 'block';
        }
    }

    hideError() {
        const error = document.getElementById('error');
        if (error) {
            error.style.display = 'none';
        }
    }

    showMessage(message) {
        // Create a temporary toast message
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
                    font-family: 'DegularDisplay';
                    letter-spacing: 1px;
                    text-transform: uppercase;
                ">Update</button>
            </div>
        `;
        document.body.appendChild(updateMessage);
    }

    startAutoRefresh() {
        // Refresh every 5 minutes
        setInterval(() => {
            if (!document.hidden && navigator.onLine) {
                this.fetchSurfData();
            }
        }, 5 * 60 * 1000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SurfApp();
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