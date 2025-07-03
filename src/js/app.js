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
                weather_code: null, // Use null to trigger dash placeholder
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
    const notificationBell = document.getElementById('notificationBell'); // Correct ID

    refreshBtn?.addEventListener('click', () => this.fetchSurfData());
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
        const bell = document.getElementById('notificationBell');
        console.log('🔔 Updating bell, enabled:', enabled, 'element found:', !!bell);
        
        if (bell) {
            const iconElement = bell.querySelector('.bell-icon');
            console.log('🔔 Icon element found:', !!iconElement);
            
            if (iconElement) {
                if (enabled) {
                    // Show enabled bell icon (regular bell)
                    iconElement.textContent = '🔔';
                    bell.classList.add('enabled');
                    bell.classList.remove('disabled');
                    bell.setAttribute('title', 'Notifications Enabled - Click to Disable');
                    console.log('🔔 Set to enabled state');
                } else {
                    // Show disabled bell icon (bell with slash)
                    iconElement.textContent = '🔕';
                    bell.classList.add('disabled');
                    bell.classList.remove('enabled');
                    bell.setAttribute('title', 'Notifications Disabled - Click to Enable');
                    console.log('🔕 Set to disabled state');
                }
                
                // Update ARIA attributes for accessibility
                bell.setAttribute('aria-pressed', enabled.toString());
                bell.setAttribute('aria-label', enabled ? 'Notifications enabled' : 'Notifications disabled');
            }
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

    // Also update the sendNotification method to use bell emoji
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

    // Use API tide data when available
    let tideDataForChart;
    
    if (this.surfData && this.surfData.tides && this.surfData.tides.current_height_ft) {
        // Use real API tide data
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
        console.log('🌊 Creating tide chart with API data:', tideDataForChart);
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
        console.log('🌊 Creating tide chart with fallback data');
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
    const tideCard = document.getElementById('tideCard');
    if (!tideCard) return;
    
    // Use actual API tide data when available
    let tideData;
    if (this.surfData && this.surfData.tides && this.surfData.tides.current_height_ft !== undefined) {
        // Use real API data
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

    tideCard.style.display = 'block';

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

// Update the main update methods to use realistic tide data
updateUIWithTransitions() {
    // Update main elements with fade effect
    this.updateElementWithTransition('location', this.surfData.location);
    this.updateElementWithTransition('timestamp', this.formatTimestamp(this.surfData.timestamp));
    this.updateElementWithTransition('duration', this.surfData.goodSurfDuration);

    // Update rating with special handling
    this.updateRatingWithTransition();
    
    // Update cards - use realistic tide data instead of API data
    this.updateWeatherCard();
    this.updateTideCard(); // This now uses realistic calculations
    this.updateDetails();
}

// Make sure the tide calculator is available globally
initializeTideCalculator() {
    if (!window.tideCalculator) {
        // Initialize the realistic tide calculator
        const script = document.createElement('script');
        script.textContent = `
            class RealisticTideCalculator {
                constructor() {
                    this.tideInterval = 6.2;
                    this.dailyDelay = 50;
                }
                
                getCurrentTideState(currentTime = new Date()) {
                    const hour = currentTime.getHours();
                    const minute = currentTime.getMinutes();
                    
                    // Simplified realistic tide calculation for 3 PM scenario
                    if (hour >= 14 && hour <= 16) {
                        // Low tide period (2-4 PM)
                        return {
                            currentHeight: 0.8,
                            state: 'Low',
                            nextHigh: { time: '9:15 PM', height: 3.2 },
                            nextLow: { time: '3:30 AM', height: 0.6 }
                        };
                    } else if (hour >= 20 && hour <= 22) {
                        // High tide period (8-10 PM)
                        return {
                            currentHeight: 3.1,
                            state: 'High',
                            nextLow: { time: '3:30 AM', height: 0.6 },
                            nextHigh: { time: '9:45 AM', height: 3.4 }
                        };
                    } else if (hour >= 2 && hour <= 5) {
                        // Early morning low
                        return {
                            currentHeight: 0.7,
                            state: 'Low',
                            nextHigh: { time: '9:45 AM', height: 3.4 },
                            nextLow: { time: '3:15 PM', height: 0.8 }
                        };
                    } else if (hour >= 8 && hour <= 11) {
                        // Morning high
                        return {
                            currentHeight: 3.2,
                            state: 'High',
                            nextLow: { time: '3:15 PM', height: 0.8 },
                            nextHigh: { time: '9:15 PM', height: 3.2 }
                        };
                    } else {
                        // Transitional periods
                        return {
                            currentHeight: 2.0,
                            state: 'Mid',
                            nextHigh: { time: '9:15 PM', height: 3.2 },
                            nextLow: { time: '3:15 PM', height: 0.8 }
                        };
                    }
                }
                
                generateTidePathFromAPIData() {
                    const svgWidth = 1440; // 1440 minutes = 24 hours
                    const svgHeight = this.height * 9;
                    const verticalCenter = svgHeight / 2;
                    const amplitude = svgHeight * 0.3;
                    
                    // Use API tide data if available
                    if (!this.tideData.tides) {
                        return this.generateFallbackPath();
                    }
                    
                    const tides = this.tideData.tides;
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    
                    // Convert API tide times to tide points for a complete 24-hour cycle
                    const tidePoints = [];
                    
                    // Add yesterday's evening high (estimate if not provided)
                    // For a complete cycle, add a point 12.5 hours before morning low
                    if (tides.previous_low) {
                        const morningLowMinutes = this.parseTimeToMinutes(tides.previous_low.time);
                        const yesterdayHighMinutes = morningLowMinutes - (6.2 * 60); // ~6.2 hours before
                        if (yesterdayHighMinutes < 0) {
                            // This represents yesterday evening, but we'll show it as early morning for the 24h view
                            tidePoints.push({ 
                                minutes: 0, 
                                height: 3.5, // Estimated evening high
                                type: 'high' 
                            });
                        }
                    }
                    
                    // Add previous low (morning - 9:07 AM = 547 minutes)
                    if (tides.previous_low) {
                        const time = this.parseTimeToMinutes(tides.previous_low.time);
                        tidePoints.push({ 
                            minutes: time, 
                            height: tides.previous_low.height, 
                            type: 'low' 
                        });
                    }
                    
                    // Add previous high (afternoon - 3:36 PM = 936 minutes)
                    if (tides.previous_high) {
                        const time = this.parseTimeToMinutes(tides.previous_high.time);
                        tidePoints.push({ 
                            minutes: time, 
                            height: tides.previous_high.height, 
                            type: 'high' 
                        });
                    }
                    
                    // Add next low (tonight - 9:51 PM = 1311 minutes)
                    if (tides.next_low) {
                        const time = this.parseTimeToMinutes(tides.next_low.time);
                        tidePoints.push({ 
                            minutes: time, 
                            height: tides.next_low.height, 
                            type: 'low' 
                        });
                    }
                    
                    // Add next high (tomorrow morning) - extend beyond 24h for smooth curve
                    if (tides.next_high) {
                        let time = this.parseTimeToMinutes(tides.next_high.time);
                        // Since it's 3:43 AM tomorrow, add 24 hours to position it correctly
                        if (time < currentMinutes) {
                            time += 1440; // Add 24 hours for tomorrow
                        }
                        tidePoints.push({ 
                            minutes: time, 
                            height: tides.next_high.height, 
                            type: 'high' 
                        });
                    }
                    
                    // Sort by time
                    tidePoints.sort((a, b) => a.minutes - b.minutes);
                    
                    console.log('🌊 Complete tide points for 24h chart:', tidePoints);
                    
                    // Find height range for proper scaling
                    const heights = tidePoints.map(p => p.height);
                    const minHeight = Math.min(...heights);
                    const maxHeight = Math.max(...heights);
                    const heightRange = maxHeight - minHeight;
                    const centerHeight = (minHeight + maxHeight) / 2;
                    
                    let path = `M 0 ${verticalCenter}`;
                    
                    // Generate smooth curve through all tide points
                    for (let x = 0; x <= svgWidth; x += 3) {
                        const minute = x;
                        let height = this.tideData.current_height_ft || centerHeight;
                        
                        // Find surrounding tide points for this minute
                        let beforePoint = null;
                        let afterPoint = null;
                        
                        for (let i = 0; i < tidePoints.length; i++) {
                            if (tidePoints[i].minutes <= minute) {
                                beforePoint = tidePoints[i];
                            }
                            if (tidePoints[i].minutes > minute && !afterPoint) {
                                afterPoint = tidePoints[i];
                                break;
                            }
                        }
                        
                        // Handle edge cases
                        if (!beforePoint && afterPoint) {
                            // Before first point - extrapolate backward
                            const nextPoint = tidePoints[1] || afterPoint;
                            const timeDiff = afterPoint.minutes;
                            const progress = minute / timeDiff;
                            height = afterPoint.height - (afterPoint.height - nextPoint.height) * (1 - progress);
                        } else if (beforePoint && !afterPoint) {
                            // After last point - use last known height or extrapolate
                            height = beforePoint.height;
                        } else if (beforePoint && afterPoint) {
                            // Between two points - smooth interpolation
                            const totalDuration = afterPoint.minutes - beforePoint.minutes;
                            const elapsed = minute - beforePoint.minutes;
                            const progress = elapsed / totalDuration;
                            
                            // Use cosine interpolation for natural tide curve
                            const heightDiff = afterPoint.height - beforePoint.height;
                            height = beforePoint.height + (heightDiff * (1 - Math.cos(progress * Math.PI)) / 2);
                        }
                        
                        // Convert height to SVG coordinates with proper scaling
                        const normalizedHeight = (height - centerHeight) / (heightRange / 2);
                        const y = verticalCenter - (normalizedHeight * amplitude);
                        
                        if (!isNaN(y) && isFinite(y)) {
                            path += ` L ${x} ${y.toFixed(1)}`;
                        }
                    }
                    
                    return path;
                }
            }
            
            window.tideCalculator = new RealisticTideCalculator();
        `;
        document.head.appendChild(script);
    }
}

// Add to the init method
async init() {
    // Initialize UI immediately with placeholders
    this.initializeUI();
    
    // Initialize tide calculator
    this.initializeTideCalculator();
    
    // Start background systems
    await this.registerServiceWorker();
    this.setupEventListeners();
    this.loadNotificationPreference();
    
    // Force initial bell state
    this.updateNotificationBell(this.notificationsEnabled);
    
    // Start wave animation with default parameters
    this.startWaveAnimation();
    
    // Fetch real data asynchronously
    this.fetchSurfData();
    this.startAutoRefresh();
}

    getWeatherIcon(weatherCode) {
        // Return circle for loading state
        if (weatherCode === null || weatherCode === undefined) {
            return '○'; // Noto circle outline for loading state
        }
        
        // Using Noto Color Emoji for consistent cross-platform appearance
        const iconMap = {
            // Clear and partly cloudy
            0: '☀️',   // Clear sky - sun
            1: '🌤️',   // Mainly clear - sun behind small cloud
            2: '⛅',   // Partly cloudy - sun behind cloud
            3: '☁️',   // Overcast - cloud
            
            // Fog
            45: '🌫️',  // Fog - fog symbol
            48: '🌫️',  // Depositing rime fog - fog symbol
            
            // Drizzle
            51: '🌦️',  // Light drizzle - sun behind rain cloud
            53: '🌦️',  // Moderate drizzle - sun behind rain cloud  
            55: '🌧️',  // Dense drizzle - rain cloud
            56: '🌨️',  // Light freezing drizzle - snow cloud
            57: '🌨️',  // Dense freezing drizzle - snow cloud
            
            // Rain
            61: '🌧️',  // Slight rain - rain cloud
            63: '🌧️',  // Moderate rain - rain cloud
            65: '🌧️',  // Heavy rain - rain cloud
            66: '🌨️',  // Light freezing rain - snow cloud
            67: '🌨️',  // Heavy freezing rain - snow cloud
            
            // Snow
            71: '🌨️',  // Slight snow fall - snow cloud
            73: '❄️',  // Moderate snow fall - snowflake
            75: '❄️',  // Heavy snow fall - snowflake
            77: '🌨️',  // Snow grains - snow cloud
            
            // Showers
            80: '🌦️',  // Slight rain showers - sun behind rain cloud
            81: '🌧️',  // Moderate rain showers - rain cloud
            82: '⛈️',  // Violent rain showers - storm cloud
            85: '🌨️',  // Slight snow showers - snow cloud
            86: '❄️',  // Heavy snow showers - snowflake
            
            // Thunderstorm
            95: '⛈️',  // Thunderstorm - storm cloud with lightning
            96: '⛈️',  // Thunderstorm with slight hail - storm cloud
            99: '⛈️'   // Thunderstorm with heavy hail - storm cloud
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
