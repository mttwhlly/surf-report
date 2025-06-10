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
        const notificationBtn = document.getElementById('notificationBtn');

        refreshBtn?.addEventListener('click', () => this.fetchSurfData());
        notificationBtn?.addEventListener('click', () => this.toggleNotifications());

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
                setTimeout(() => {
                    this.waveAnimation.resize();
                    this.waveAnimation.setupCanvas();
                }, 100);
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
                },
                mode: 'cors'
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
            
            // Check if it's a CORS or network error
            if (error.message.includes('CORS') || 
                error.message.includes('Failed to fetch') || 
                error.name === 'TypeError') {
                this.handleCORSError();
            } else {
                this.showError(this.getErrorMessage(error));
            }
        } finally {
            this.showLoading(false);
        }
    }

    handleCORSError() {
        console.log('API blocked by CORS, loading demo data...');
        this.loadDemoData();
        this.showMessage('Using demo data - API has CORS restrictions');
    }

    loadDemoData() {
        this.surfData = {
            location: "St. Augustine, FL",
            timestamp: new Date().toISOString(),
            surfable: true,
            rating: "Marginal",
            score: 45,
            goodSurfDuration: "Demo mode - API temporarily unavailable",
            details: {
                wave_height_ft: 1.5,
                wave_period_sec: 6,
                swell_direction_deg: 90,
                wind_direction_deg: 117,
                wind_speed_kts: 22.9,
                tide_state: "High",
                data_source: "Demo data"
            }
        };
        
        this.updateUI();
        this.startWaveAnimation();
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
        if (surfDataEl) {
            surfDataEl.style.display = 'block';
        }

        // Update header
        this.updateElement('location', this.surfData.location);
        this.updateElement('timestamp', this.formatTimestamp(this.surfData.timestamp));

        // Update status card
        this.updateRating();
        this.updateElement('score', this.surfData.score);
        this.updateElement('duration', this.surfData.goodSurfDuration);

        // Update details
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
        if (rating && this.surfData) {
            rating.textContent = this.surfData.rating;
            rating.className = `rating ${this.surfData.rating.toLowerCase()}`;
        }
    }

    updateDetails() {
        if (!this.surfData || !this.surfData.details) return;
        
        const details = this.surfData.details;
        this.updateElement('waveHeight', `${details.wave_height_ft || 0} ft`);
        this.updateElement('wavePeriod', `${details.wave_period_sec || 0} sec`);
        this.updateElement('windSpeed', `${Math.round(details.wind_speed_kts || 0)} kts`);
        this.updateElement('tideState', details.tide_state || 'Unknown');
    }

    formatTimestamp(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Unknown time';
        }
    }

    startWaveAnimation() {
        const canvas = document.getElementById('waveCanvas');
        if (!canvas) {
            console.warn('Wave canvas not found');
            return;
        }

        try {
            if (this.waveAnimation) {
                this.waveAnimation.destroy();
            }

            const waveData = this.surfData?.details || {
                wave_height_ft: 2,
                wave_period_sec: 8,
                swell_direction_deg: 180,
                wind_speed_kts: 15
            };

            this.waveAnimation = new WaveAnimation(canvas, waveData);
            this.waveAnimation.start();
        } catch (error) {
            console.error('Error starting wave animation:', error);
        }
    }

    async toggleNotifications() {
        const btn = document.getElementById('notificationBtn');
        
        if (!('Notification' in window)) {
            this.showMessage('This browser does not support notifications');
            return;
        }

        if (!this.notificationsEnabled) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    this.notificationsEnabled = true;
                    this.updateNotificationButton(true);
                    this.saveNotificationPreference();
                    this.showMessage('Notifications enabled! You\'ll be alerted when conditions are good.');
                } else {
                    this.showMessage('Notifications permission denied');
                }
            } catch (error) {
                console.error('Error requesting notification permission:', error);
                this.showMessage('Error enabling notifications');
            }
        } else {
            this.notificationsEnabled = false;
            this.updateNotificationButton(false);
            this.saveNotificationPreference();
            this.showMessage('Notifications disabled');
        }
    }

    updateNotificationButton(enabled) {
        const btn = document.getElementById('notificationBtn');
        if (btn) {
            btn.textContent = enabled ? 'Notifications Enabled ✓' : 'Enable Notifications';
            // btn.style.background = enabled ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 255, 255, 0.2)';
        }
    }

    loadNotificationPreference() {
        try {
            const enabled = localStorage.getItem('surf-notifications-enabled') === 'true';
            if (enabled && 'Notification' in window && Notification.permission === 'granted') {
                this.notificationsEnabled = true;
                this.updateNotificationButton(true);
            }
        } catch (error) {
            console.warn('localStorage not available:', error);
        }
    }

    saveNotificationPreference() {
        try {
            localStorage.setItem('surf-notifications-enabled', this.notificationsEnabled.toString());
        } catch (error) {
            console.warn('Cannot save to localStorage:', error);
        }
    }

    checkForGoodConditions() {
        if (!this.notificationsEnabled || !this.surfData) return;

        const isGoodConditions = this.surfData.score >= 70 || 
                               this.surfData.rating.toLowerCase() === 'good';
        
        if (isGoodConditions) {
            this.sendNotification();
        }
    }

    sendNotification() {
        if (!this.notificationsEnabled || 
            !('Notification' in window) || 
            Notification.permission !== 'granted') return;

        try {
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
        } catch (error) {
            console.error('Error sending notification:', error);
        }
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
            if (toast.parentNode) {
                toast.remove();
            }
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
                background: rgba(34, 197, 94, 0.9);
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
                    color: #059669;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
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
    try {
        new SurfApp();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
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