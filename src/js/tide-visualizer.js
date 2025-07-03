class EnhancedTideChart {
    constructor(container, tideData) {
        this.container = container;
        this.tideData = tideData || {};
        this.svg = null;
        this.width = 360;
        this.height = 120;
        
        // Safari detection
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        // Initialize realistic tide calculator
        this.tideCalculator = new RealisticTideCalculator();
        
        console.log('🌊 TideChart initialized with realistic calculator');
        this.init();
    }

    init() {
        this.createSVG();
        this.drawChart();
    }

    createSVG() {
        // Remove existing content
        this.container.innerHTML = '';
        
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', `4 0 1440 ${this.height * 9}`);
        this.svg.setAttribute('class', 'tide-chart-svg');
        this.svg.setAttribute('preserveAspectRatio', 'none');
        
        if (this.isSafari) {
            this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            this.svg.setAttribute('version', '1.1');
            this.svg.style.display = 'block';
            this.svg.style.width = '100%';
            this.svg.style.height = '100%';
            this.svg.style.position = 'absolute';
            this.svg.style.top = '0';
            this.svg.style.left = '0';
        }
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .tide-chart-svg {
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.05);
                display: block !important;
                width: 100% !important;
                height: 100% !important;
            }
            .tide-curve {
                fill: none;
                stroke: rgba(0, 0, 0, 1);
                stroke-width: 1;
                stroke-linecap: round;
                vector-effect: non-scaling-stroke;
            }
            .tide-fill {
                fill: rgba(255, 255, 255, 0.1);
                stroke: none;
            }
            .current-time-line {
                stroke: #000;
                stroke-width: 1;
                stroke-dasharray: 8,8;
                vector-effect: non-scaling-stroke;
            }
            .tide-marker {
                r: 6;
                stroke: rgba(255, 255, 255, 0.9);
                stroke-width: 1;
                cursor: pointer;
                transition: all 0.2s ease;
                vector-effect: non-scaling-stroke;
            }
            .high-tide { fill: #10b981; }
            .low-tide { fill: #f59e0b; }
            .time-label {
                font-size: 32px;
                font-weight: 700;
                text-anchor: middle;
                fill: rgba(255, 255, 255, 0.9);
                font-family: 'Bricolage Grotesque', sans-serif;
            }
            .tide-label {
                font-size: 28px;
                font-weight: 600;
                text-anchor: middle;
                fill: rgba(255, 255, 255, 0.9);
                font-family: 'Bricolage Grotesque', sans-serif;
            }
        `;
        
        this.svg.appendChild(style);
        this.container.appendChild(this.svg);
    }

    drawChart() {
        // Clear existing content except style
        const style = this.svg.querySelector('style');
        this.svg.innerHTML = '';
        this.svg.appendChild(style);
        
        // Generate realistic tide path
        const pathData = this.tideCalculator.generateTidePathForVisualization();
        
        if (pathData && !pathData.includes('NaN')) {
            const svgHeight = this.height * 9;
            
            // Create filled area path
            const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            fillPath.setAttribute('class', 'tide-fill');
            fillPath.setAttribute('d', pathData + ` L1440,${svgHeight} L0,${svgHeight} Z`);
            this.svg.appendChild(fillPath);
            
            // Create tide curve path
            const curvePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            curvePath.setAttribute('class', 'tide-curve');
            curvePath.setAttribute('d', pathData);
            this.svg.appendChild(curvePath);
        } else {
            console.warn('🌊 Invalid path data, using fallback');
            this.drawFallbackWave();
        }
        
        // Add current time indicator
        this.drawCurrentTimeIndicator();
        
        // Add realistic tide labels
        this.drawRealisticTideLabels();
    }

    drawCurrentTimeIndicator() {
        const svgHeight = this.height * 9;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Position based on current time
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'current-time-line');
        line.setAttribute('x1', currentMinutes);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', currentMinutes);
        line.setAttribute('y2', svgHeight);
        this.svg.appendChild(line);
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'time-label');
        label.setAttribute('x', currentMinutes);
        label.setAttribute('y', 40);
        label.setAttribute('fill', '#dc2626');
        label.textContent = 'NOW';
        this.svg.appendChild(label);
    }

    drawRealisticTideLabels() {
        const svgHeight = this.height * 9;
        const currentTideState = this.tideCalculator.getCurrentTideState();
        
        console.log('🌊 Drawing labels with tide state:', currentTideState);
        
        // Draw next high tide
        if (currentTideState.nextHigh) {
            const nextHighMinutes = this.timeToMinutes(currentTideState.nextHigh.time);
            if (nextHighMinutes > 0 && nextHighMinutes <= 1440) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('class', 'tide-label');
                label.setAttribute('x', nextHighMinutes);
                label.setAttribute('y', 60);
                label.setAttribute('fill', '#10b981');
                label.textContent = `High ${currentTideState.nextHigh.time}`;
                this.svg.appendChild(label);
                
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker.setAttribute('class', 'tide-marker high-tide');
                marker.setAttribute('cx', nextHighMinutes);
                marker.setAttribute('cy', this.height * 2);
                marker.setAttribute('r', 6);
                this.svg.appendChild(marker);
            }
        }
        
        // Draw next low tide
        if (currentTideState.nextLow) {
            const nextLowMinutes = this.timeToMinutes(currentTideState.nextLow.time);
            if (nextLowMinutes > 0 && nextLowMinutes <= 1440) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('class', 'tide-label');
                label.setAttribute('x', nextLowMinutes);
                label.setAttribute('y', svgHeight - 30);
                label.setAttribute('fill', '#f59e0b');
                label.textContent = `Low ${currentTideState.nextLow.time}`;
                this.svg.appendChild(label);
                
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker.setAttribute('class', 'tide-marker low-tide');
                marker.setAttribute('cx', nextLowMinutes);
                marker.setAttribute('cy', this.height * 7);
                marker.setAttribute('r', 6);
                this.svg.appendChild(marker);
            }
        }
    }

    timeToMinutes(timeString) {
        // Convert "3:43 PM" to minutes since midnight
        const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return 0;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
    }

    drawFallbackWave() {
        // Simple fallback if calculations fail
        const svgHeight = this.height * 9;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 0);
        rect.setAttribute('y', svgHeight / 3);
        rect.setAttribute('width', 1440);
        rect.setAttribute('height', svgHeight / 3);
        rect.setAttribute('fill', 'rgba(255, 255, 255, 0.1)');
        rect.setAttribute('stroke', 'rgba(0, 0, 0, 1)');
        rect.setAttribute('stroke-width', 2);
        this.svg.appendChild(rect);
    }

    // Get current tide state for the main UI
    getCurrentTideInfo() {
        return this.tideCalculator.getCurrentTideState();
    }

    updateWithData(newTideData) {
        this.tideData = { ...this.tideData, ...newTideData };
        console.log('🌊 Updating tide chart');
        this.drawChart();
    }

    resize() {
        if (this.svg) {
            const rect = this.container.getBoundingClientRect();
            this.svg.style.width = rect.width + 'px';
            this.svg.style.height = rect.height + 'px';
        }
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

class RealisticTideCalculator {
    constructor() {
        // St. Augustine typical tide pattern (semi-diurnal - 2 highs, 2 lows per day)
        this.tideInterval = 6.2; // hours between high and low (12.4 hours / 2)
        this.dailyDelay = 50; // minutes later each day (lunar cycle)
    }

    getCurrentTideState(currentTime = new Date()) {
        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();
        const currentMinutes = hour * 60 + minute;
        
        console.log('🕐 Current time:', `${hour}:${minute.toString().padStart(2, '0')}`);
        
        // Calculate today's tide times based on a reference
        const todaysTides = this.calculateDailyTides(currentTime);
        
        console.log('🌊 Today\'s calculated tides:', todaysTides);
        
        // Find current tide state
        let currentHeight = 2.5; // Default mid-level
        let state = 'Mid';
        let nextHigh = null;
        let nextLow = null;
        
        // Find where we are in the tide cycle
        for (let i = 0; i < todaysTides.length - 1; i++) {
            const currentTide = todaysTides[i];
            const nextTide = todaysTides[i + 1];
            
            if (currentMinutes >= currentTide.minutes && currentMinutes < nextTide.minutes) {
                // We're between these two tides
                const progress = (currentMinutes - currentTide.minutes) / (nextTide.minutes - currentTide.minutes);
                
                // Interpolate height using sine wave
                const heightDiff = nextTide.height - currentTide.height;
                currentHeight = currentTide.height + (heightDiff * Math.sin(progress * Math.PI / 2));
                
                // Determine state
                if (currentTide.type === 'high') {
                    state = progress < 0.5 ? 'High Falling' : 'Falling';
                } else {
                    state = progress < 0.5 ? 'Low Rising' : 'Rising';
                }
                
                // Set next tides
                nextHigh = todaysTides.find(t => t.type === 'high' && t.minutes > currentMinutes);
                nextLow = todaysTides.find(t => t.type === 'low' && t.minutes > currentMinutes);
                
                break;
            }
        }
        
        // If we didn't find a match, we might be at the end of day
        if (!nextHigh || !nextLow) {
            const tomorrowTides = this.calculateDailyTides(new Date(currentTime.getTime() + 24 * 60 * 60 * 1000));
            if (!nextHigh) {
                nextHigh = tomorrowTides.find(t => t.type === 'high');
            }
            if (!nextLow) {
                nextLow = tomorrowTides.find(t => t.type === 'low');
            }
        }
        
        return {
            currentHeight: Math.round(currentHeight * 10) / 10,
            state,
            nextHigh: nextHigh ? {
                time: this.formatTime(nextHigh.minutes),
                height: Math.round(nextHigh.height * 10) / 10
            } : null,
            nextLow: nextLow ? {
                time: this.formatTime(nextLow.minutes),
                height: Math.round(nextLow.height * 10) / 10
            } : null,
            allTides: todaysTides
        };
    }
    
    calculateDailyTides(date) {
        // Reference: January 1, 2024 had high tide at 6:30 AM
        const reference = new Date('2024-01-01T06:30:00');
        const daysDiff = Math.floor((date - reference) / (24 * 60 * 60 * 1000));
        
        // Each day, tides shift by about 50 minutes later
        const baseShiftMinutes = (daysDiff * this.dailyDelay) % (12.4 * 60);
        
        // Base tide times for today (starting with morning high)
        const baseTimes = [
            { type: 'high', baseMinutes: 6.5 * 60 }, // 6:30 AM
            { type: 'low', baseMinutes: 12.7 * 60 }, // 12:42 PM  
            { type: 'high', baseMinutes: 18.9 * 60 }, // 6:54 PM
            { type: 'low', baseMinutes: 25.1 * 60 }   // 1:06 AM next day
        ];
        
        const tides = baseTimes.map(tide => {
            let adjustedMinutes = tide.baseMinutes + baseShiftMinutes;
            
            // Handle day overflow
            if (adjustedMinutes >= 24 * 60) {
                adjustedMinutes -= 24 * 60;
            }
            
            return {
                type: tide.type,
                minutes: Math.round(adjustedMinutes),
                height: tide.type === 'high' ? 3.2 + Math.random() * 0.6 : 0.4 + Math.random() * 0.8,
                time: this.formatTime(adjustedMinutes)
            };
        });
        
        // Sort by time
        return tides.sort((a, b) => a.minutes - b.minutes);
    }
    
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60) % 24;
        const mins = Math.round(minutes % 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
    }
    
    generateTidePathForVisualization(currentTime = new Date()) {
        const svgWidth = 1440; // 1440 minutes = 24 hours
        const svgHeight = 1080; // 120 * 9
        const verticalCenter = svgHeight / 2;
        const amplitude = svgHeight * 0.3;
        
        const tideState = this.getCurrentTideState(currentTime);
        const todaysTides = tideState.allTides;
        
        let path = `M 0 ${verticalCenter}`;
        
        // Generate path based on actual tide times
        for (let x = 0; x <= svgWidth; x += 5) {
            const minute = x; // x represents minutes from midnight
            
            // Find the tide cycle for this minute
            let height = 2.0; // Default
            
            // Find surrounding tides
            let beforeTide = null;
            let afterTide = null;
            
            for (let i = 0; i < todaysTides.length; i++) {
                if (todaysTides[i].minutes <= minute) {
                    beforeTide = todaysTides[i];
                }
                if (todaysTides[i].minutes > minute && !afterTide) {
                    afterTide = todaysTides[i];
                    break;
                }
            }
            
            // Handle edge cases
            if (!beforeTide && afterTide) {
                // Before first tide, use previous day's last tide
                beforeTide = { type: 'low', minutes: afterTide.minutes - 6.2 * 60, height: 0.8 };
            }
            if (beforeTide && !afterTide) {
                // After last tide, use next day's first tide
                afterTide = { type: beforeTide.type === 'high' ? 'low' : 'high', 
                             minutes: beforeTide.minutes + 6.2 * 60, 
                             height: beforeTide.type === 'high' ? 0.8 : 3.2 };
            }
            
            if (beforeTide && afterTide) {
                // Interpolate between tides using smooth sine curve
                const totalDuration = afterTide.minutes - beforeTide.minutes;
                const elapsed = minute - beforeTide.minutes;
                const progress = elapsed / totalDuration;
                
                // Use sine for smooth tide curve
                const heightDiff = afterTide.height - beforeTide.height;
                height = beforeTide.height + (heightDiff * (1 - Math.cos(progress * Math.PI)) / 2);
            }
            
            // Convert height to SVG coordinates
            const heightRange = 4; // 4 foot tide range
            const y = verticalCenter - ((height - 2) / heightRange) * amplitude;
            
            if (!isNaN(y) && isFinite(y)) {
                path += ` L ${x} ${y.toFixed(1)}`;
            }
        }
        
        return path;
    }
}

// Global instance
window.tideCalculator = new RealisticTideCalculator();