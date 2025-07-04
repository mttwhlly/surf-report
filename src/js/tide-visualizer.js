class EnhancedTideChart {
    constructor(container, tideData) {
        this.container = container;
        this.tideData = tideData || {};
        this.svg = null;
        this.width = 360;
        this.height = 120;
        
        // Safari detection
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        console.log('🌊 TideChart initialized with API data:', this.tideData);
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
    
    // FORCE use of realistic calculator for complete 24h path
    let pathData = null;
    
    // Check if realistic calculator is available and use it
    if (window.tideCalculator && typeof window.tideCalculator.generateTidePathForVisualization === 'function') {
        console.log('🌊 Using realistic calculator for complete 24h tide path');
        const calculatorPath = window.tideCalculator.generateTidePathForVisualization();
        
        if (calculatorPath && calculatorPath.includes('M')) {
            // Scale the calculator path to our SVG dimensions
            pathData = this.scaleCalculatorPath(calculatorPath);
            console.log('🌊 Successfully generated complete tide path with past data');
        }
    }
    
    // Fallback to API data only if calculator failed
    if (!pathData) {
        console.log('🌊 Falling back to API-based path generation');
        pathData = this.generateTidePathFromAPIData();
    }
    
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
        
        console.log('✅ Tide chart drawn with complete 24h cycle');
    } else {
        console.warn('🌊 Invalid path data, using simple fallback');
        this.drawSimpleFallbackChart();
    }
    
    // Add current time indicator
    this.drawCurrentTimeIndicator();
    
    // Add tide event labels
    this.drawTideEventLabels();
}

// NEW: Scale calculator path to SVG dimensions
scaleCalculatorPath(calculatorPath) {
    // Calculator generates 1440x1080, we need to scale to our SVG size
    const svgHeight = this.height * 9;
    const svgWidth = 1440;
    
    // The calculator path is already sized for 1440 width, just need to scale height
    const heightScale = svgHeight / 1080;
    
    // Scale only the Y coordinates
    let scaledPath = calculatorPath.replace(/([ML])\s*(\d+(?:\.\d+)?)\s*(\d+(?:\.\d+)?)/g, (match, command, x, y) => {
        const scaledY = parseFloat(y) * heightScale;
        return command + ' ' + x + ' ' + scaledY.toFixed(1);
    });
    
    return scaledPath;
}

// NEW: Draw enhanced tide event labels with past events
drawTideEventLabels() {
    const svgHeight = this.height * 9;
    const currentHour = new Date().getHours();
    
    // ENHANCED: Show complete 24h tide cycle events including past
    const fullDayEvents = [
        // Past events (shown in muted color)
        { minutes: 80, height: 3.4, type: 'high', time: '1:20 AM', isPast: true },    // Last night's high
        { minutes: 450, height: 0.4, type: 'low', time: '7:30 AM', isPast: currentHour > 7 },    // Morning low
        
        // Current/Future events
        { minutes: 223, height: 3.5, type: 'high', time: '3:43 AM', isPast: currentHour > 3 },   // Next high
        { minutes: 590, height: 0.3, type: 'low', time: '9:50 AM', isPast: currentHour > 9 },    // Next low
        { minutes: 960, height: 3.2, type: 'high', time: '4:00 PM', isPast: currentHour > 16 },  // Afternoon high
        { minutes: 1320, height: 0.5, type: 'low', time: '10:00 PM', isPast: false }             // Evening low
    ];
    
    fullDayEvents.forEach(event => {
        if (event.minutes >= 0 && event.minutes <= 1440) {
            // Create label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('class', 'tide-label');
            label.setAttribute('x', event.minutes);
            
            // Position based on tide type
            if (event.type === 'high') {
                label.setAttribute('y', 60);
                label.setAttribute('fill', event.isPast ? '#059669' : '#10b981'); // Darker if past
            } else {
                label.setAttribute('y', svgHeight - 30);
                label.setAttribute('fill', event.isPast ? '#d97706' : '#f59e0b'); // Darker if past
            }
            
            // Set opacity for past events
            if (event.isPast) {
                label.setAttribute('opacity', '0.6');
            }
            
            label.textContent = (event.type === 'high' ? 'High ' : 'Low ') + event.time;
            this.svg.appendChild(label);
            
            // Create marker
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            marker.setAttribute('class', 'tide-marker ' + event.type + '-tide');
            marker.setAttribute('cx', event.minutes);
            marker.setAttribute('cy', event.type === 'high' ? this.height * 2 : this.height * 7);
            marker.setAttribute('r', 6);
            
            if (event.isPast) {
                marker.setAttribute('opacity', '0.6');
            }
            
            this.svg.appendChild(marker);
        }
    });
}

// NEW: Simple fallback that shows basic sine wave
drawSimpleFallbackChart() {
    const svgHeight = this.height * 9;
    const svgWidth = 1440;
    const verticalCenter = svgHeight / 2;
    const amplitude = svgHeight * 0.25;
    
    // Generate simple complete sine wave
    let path = `M 0 ${verticalCenter}`;
    
    for (let x = 0; x <= svgWidth; x += 5) {
        // Two complete tide cycles per day (semi-diurnal)
        const y = verticalCenter + amplitude * Math.sin((x / svgWidth) * Math.PI * 4 - Math.PI);
        path += ` L ${x} ${y.toFixed(1)}`;
    }
    
    // Create the path
    const curvePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    curvePath.setAttribute('class', 'tide-curve');
    curvePath.setAttribute('d', path);
    this.svg.appendChild(curvePath);
    
    // Fill below the curve
    const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fillPath.setAttribute('class', 'tide-fill');
    fillPath.setAttribute('d', path + ` L${svgWidth},${svgHeight} L0,${svgHeight} Z`);
    this.svg.appendChild(fillPath);
}

// ALSO UPDATE: Make sure the realistic calculator generates a proper path
// Replace your updateTideVisualization method with this:
updateTideVisualization() {
    const container = document.querySelector('.tide-visual-container');
    if (!container) return;

    if (this.tideWaveVisualizer) {
        this.tideWaveVisualizer.destroy();
    }

    // ALWAYS use realistic calculator for complete visualization
    let tideDataForChart = {
        current_height_ft: 1.6,
        state: 'Mid',
        tides: {
            // Force use of realistic calculator
            useRealisticCalculator: true,
            cycle_info: {
                cycle_duration_hours: 12.4,
                range_ft: 4
            }
        }
    };
    
    // Override with API data if available but keep realistic calculator for chart
    if (this.surfData && this.surfData.tides && this.surfData.tides.current_height_ft) {
        tideDataForChart.current_height_ft = this.surfData.tides.current_height_ft;
        tideDataForChart.state = this.surfData.tides.state;
        console.log('🌊 Using API tide state with realistic calculator chart');
    }

    this.tideWaveVisualizer = new EnhancedTideChart(container, tideDataForChart);
}

generateTidePathFromAPIData() {
    const svgWidth = 1440; // 1440 minutes = 24 hours
    const svgHeight = this.height * 9;
    const verticalCenter = svgHeight / 2;
    const amplitude = svgHeight * 0.3;
    
    // FIXED: Check if we have a realistic calculator path generator
    if (this.tideData.tides && this.tideData.tides.generatePath) {
        console.log('🌊 Using realistic calculator for complete tide path');
        const path = this.tideData.tides.generatePath();
        
        // Scale the path to fit our SVG dimensions
        if (path && path.includes('M')) {
            // Parse the path and rescale it to our SVG size
            const scaledPath = this.rescalePathToSVG(path, svgWidth, svgHeight);
            return scaledPath;
        }
    }
    
    // Fallback to API data if available
    if (this.tideData.tides && (this.tideData.tides.next_high || this.tideData.tides.next_low)) {
        return this.generateAPIBasedPath(svgWidth, svgHeight, verticalCenter, amplitude);
    }
    
    // Final fallback
    return this.generateFallbackPath();
}

rescalePathToSVG(originalPath, targetWidth, targetHeight) {
    // The realistic calculator generates a path for 1440x1080
    // We need to scale it to our SVG dimensions
    const originalWidth = 1440;
    const originalHeight = 1080;
    
    const scaleX = targetWidth / originalWidth;
    const scaleY = targetHeight / originalHeight;
    
    // Parse and rescale the path
    let scaledPath = originalPath.replace(/M (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, (match, x, y) => {
        const newX = parseFloat(x) * scaleX;
        const newY = parseFloat(y) * scaleY;
        return 'M ' + newX.toFixed(1) + ' ' + newY.toFixed(1);
    });
    
    scaledPath = scaledPath.replace(/L (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, (match, x, y) => {
        const newX = parseFloat(x) * scaleX;
        const newY = parseFloat(y) * scaleY;
        return ' L ' + newX.toFixed(1) + ' ' + newY.toFixed(1);
    });
    
    return scaledPath;
}

generateAPIBasedPath(svgWidth, svgHeight, verticalCenter, amplitude) {
    // Your existing API-based path generation code
    const tides = this.tideData.tides;
    const tidePoints = [];
    
    // Add API tide points
    if (tides.previous_low) {
        const time = this.parseTimeToMinutes(tides.previous_low.time);
        tidePoints.push({ minutes: time, height: tides.previous_low.height, type: 'low' });
    }
    
    if (tides.previous_high) {
        const time = this.parseTimeToMinutes(tides.previous_high.time);
        tidePoints.push({ minutes: time, height: tides.previous_high.height, type: 'high' });
    }
    
    if (tides.next_low) {
        const time = this.parseTimeToMinutes(tides.next_low.time);
        tidePoints.push({ minutes: time, height: tides.next_low.height, type: 'low' });
    }
    
    if (tides.next_high) {
        let time = this.parseTimeToMinutes(tides.next_high.time);
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (time < currentMinutes) {
            time += 1440; // Add 24 hours for tomorrow
        }
        tidePoints.push({ minutes: time, height: tides.next_high.height, type: 'high' });
    }
    
    // Sort by time
    tidePoints.sort((a, b) => a.minutes - b.minutes);
    
    let path = 'M 0 ' + verticalCenter;
    
    // Generate smooth curve through tide points
    for (let x = 0; x <= svgWidth; x += 5) {
        const minute = x;
        let height = this.tideData.current_height_ft || 2.0;
        
        // Find surrounding tide points
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
        
        // Interpolate between points
        if (beforePoint && afterPoint) {
            const totalDuration = afterPoint.minutes - beforePoint.minutes;
            const elapsed = minute - beforePoint.minutes;
            const progress = elapsed / totalDuration;
            
            // Use cosine interpolation for smooth tide curve
            const heightDiff = afterPoint.height - beforePoint.height;
            height = beforePoint.height + (heightDiff * (1 - Math.cos(progress * Math.PI)) / 2);
        } else if (beforePoint) {
            height = beforePoint.height;
        } else if (afterPoint) {
            height = afterPoint.height;
        }
        
        // Convert height to SVG coordinates
        const heightRange = 4; // 4 foot tide range
        const y = verticalCenter - ((height - 2) / heightRange) * amplitude;
        
        if (!isNaN(y) && isFinite(y)) {
            path += ' L ' + x + ' ' + y.toFixed(1);
        }
    }
    
    return path;
}

    parseTimeToMinutes(timeString) {
        // Convert "3:43 AM" to minutes since midnight
        const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return 0;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
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

    drawAPITideLabels() {
    const svgHeight = this.height * 9;
    
    // Check if we have realistic calculator events
    if (this.tideData.tides && this.tideData.tides.getEvents) {
        const events = this.tideData.tides.getEvents();
        console.log('🌊 Drawing labels with realistic calculator events:', events);
        
        events.forEach(event => {
            if (event.minutes > 0 && event.minutes <= 1440) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('class', 'tide-label');
                label.setAttribute('x', event.minutes);
                label.setAttribute('fill', event.type === 'high' ? '#10b981' : '#f59e0b');
                
                if (event.type === 'high') {
                    label.setAttribute('y', 60);
                    label.textContent = 'High ' + event.time;
                } else {
                    label.setAttribute('y', svgHeight - 30);
                    label.textContent = 'Low ' + event.time;
                }
                
                this.svg.appendChild(label);
                
                // Add marker
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker.setAttribute('class', 'tide-marker ' + event.type + '-tide');
                marker.setAttribute('cx', event.minutes);
                marker.setAttribute('cy', event.type === 'high' ? this.height * 2 : this.height * 7);
                marker.setAttribute('r', 6);
                this.svg.appendChild(marker);
            }
        });
        return;
    }
        if (!this.tideData.tides) return;
        
        const tides = this.tideData.tides;
        
        console.log('🌊 Drawing labels with API tide data:', tides);
        
        // Draw next high tide
        if (tides.next_high) {
            const nextHighMinutes = this.parseTimeToMinutes(tides.next_high.time);
            let displayMinutes = nextHighMinutes;
            
            // If it's tomorrow (early AM), show it as tomorrow
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            if (nextHighMinutes < currentMinutes) {
                displayMinutes = nextHighMinutes + 1440; // Show tomorrow's position
            }
            
            if (displayMinutes > 0 && displayMinutes <= 1440) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('class', 'tide-label');
                label.setAttribute('x', displayMinutes);
                label.setAttribute('y', 60);
                label.setAttribute('fill', '#10b981');
                label.textContent = `High ${tides.next_high.time}`;
                this.svg.appendChild(label);
                
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker.setAttribute('class', 'tide-marker high-tide');
                marker.setAttribute('cx', displayMinutes);
                marker.setAttribute('cy', this.height * 2);
                marker.setAttribute('r', 6);
                this.svg.appendChild(marker);
            }
        }
        
        // Draw next low tide
        if (tides.next_low) {
            const nextLowMinutes = this.parseTimeToMinutes(tides.next_low.time);
            if (nextLowMinutes > 0 && nextLowMinutes <= 1440) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('class', 'tide-label');
                label.setAttribute('x', nextLowMinutes);
                label.setAttribute('y', svgHeight - 30);
                label.setAttribute('fill', '#f59e0b');
                label.textContent = `Low ${tides.next_low.time}`;
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

    generateFallbackPath() {
        // Simple fallback sine wave
        const svgWidth = 1440;
        const svgHeight = this.height * 9;
        const verticalCenter = svgHeight / 2;
        const amplitude = svgHeight * 0.3;
        
        let path = `M 0 ${verticalCenter}`;
        
        for (let x = 0; x <= svgWidth; x += 5) {
            const y = verticalCenter + amplitude * Math.sin((x / svgWidth) * Math.PI * 2);
            path += ` L ${x} ${y.toFixed(1)}`;
        }
        
        return path;
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

    // Get current tide state from API data
    getCurrentTideInfo() {
        return {
            currentHeight: this.tideData.current_height_ft || 0,
            state: this.tideData.state || 'Unknown',
            nextHigh: this.tideData.tides?.next_high || null,
            nextLow: this.tideData.tides?.next_low || null
        };
    }

    updateWithData(newTideData) {
        this.tideData = { ...this.tideData, ...newTideData };
        console.log('🌊 Updating tide chart with new data:', this.tideData);
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

// class RealisticTideCalculator {
//     constructor() {
//         // St. Augustine typical tide pattern (semi-diurnal - 2 highs, 2 lows per day)
//         this.tideInterval = 6.2; // hours between high and low (12.4 hours / 2)
//         this.dailyDelay = 50; // minutes later each day (lunar cycle)
//     }

//     getCurrentTideState(currentTime = new Date()) {
//         const hour = currentTime.getHours();
//         const minute = currentTime.getMinutes();
//         const currentMinutes = hour * 60 + minute;
        
//         console.log('🕐 Current time:', `${hour}:${minute.toString().padStart(2, '0')}`);
        
//         // Calculate today's tide times based on a reference
//         const todaysTides = this.calculateDailyTides(currentTime);
        
//         console.log('🌊 Today\'s calculated tides:', todaysTides);
        
//         // Find current tide state
//         let currentHeight = 2.5; // Default mid-level
//         let state = 'Mid';
//         let nextHigh = null;
//         let nextLow = null;
        
//         // Find where we are in the tide cycle
//         for (let i = 0; i < todaysTides.length - 1; i++) {
//             const currentTide = todaysTides[i];
//             const nextTide = todaysTides[i + 1];
            
//             if (currentMinutes >= currentTide.minutes && currentMinutes < nextTide.minutes) {
//                 // We're between these two tides
//                 const progress = (currentMinutes - currentTide.minutes) / (nextTide.minutes - currentTide.minutes);
                
//                 // Interpolate height using sine wave
//                 const heightDiff = nextTide.height - currentTide.height;
//                 currentHeight = currentTide.height + (heightDiff * Math.sin(progress * Math.PI / 2));
                
//                 // Determine state
//                 if (currentTide.type === 'high') {
//                     state = progress < 0.5 ? 'High Falling' : 'Falling';
//                 } else {
//                     state = progress < 0.5 ? 'Low Rising' : 'Rising';
//                 }
                
//                 // Set next tides
//                 nextHigh = todaysTides.find(t => t.type === 'high' && t.minutes > currentMinutes);
//                 nextLow = todaysTides.find(t => t.type === 'low' && t.minutes > currentMinutes);
                
//                 break;
//             }
//         }
        
//         // If we didn't find a match, we might be at the end of day
//         if (!nextHigh || !nextLow) {
//             const tomorrowTides = this.calculateDailyTides(new Date(currentTime.getTime() + 24 * 60 * 60 * 1000));
//             if (!nextHigh) {
//                 nextHigh = tomorrowTides.find(t => t.type === 'high');
//             }
//             if (!nextLow) {
//                 nextLow = tomorrowTides.find(t => t.type === 'low');
//             }
//         }
        
//         return {
//             currentHeight: Math.round(currentHeight * 10) / 10,
//             state,
//             nextHigh: nextHigh ? {
//                 time: this.formatTime(nextHigh.minutes),
//                 height: Math.round(nextHigh.height * 10) / 10
//             } : null,
//             nextLow: nextLow ? {
//                 time: this.formatTime(nextLow.minutes),
//                 height: Math.round(nextLow.height * 10) / 10
//             } : null,
//             allTides: todaysTides
//         };
//     }
    
//     calculateDailyTides(date) {
//         // Reference: January 1, 2024 had high tide at 6:30 AM
//         const reference = new Date('2024-01-01T06:30:00');
//         const daysDiff = Math.floor((date - reference) / (24 * 60 * 60 * 1000));
        
//         // Each day, tides shift by about 50 minutes later
//         const baseShiftMinutes = (daysDiff * this.dailyDelay) % (12.4 * 60);
        
//         // Base tide times for today (starting with morning high)
//         const baseTimes = [
//             { type: 'high', baseMinutes: 6.5 * 60 }, // 6:30 AM
//             { type: 'low', baseMinutes: 12.7 * 60 }, // 12:42 PM  
//             { type: 'high', baseMinutes: 18.9 * 60 }, // 6:54 PM
//             { type: 'low', baseMinutes: 25.1 * 60 }   // 1:06 AM next day
//         ];
        
//         const tides = baseTimes.map(tide => {
//             let adjustedMinutes = tide.baseMinutes + baseShiftMinutes;
            
//             // Handle day overflow
//             if (adjustedMinutes >= 24 * 60) {
//                 adjustedMinutes -= 24 * 60;
//             }
            
//             return {
//                 type: tide.type,
//                 minutes: Math.round(adjustedMinutes),
//                 height: tide.type === 'high' ? 3.2 + Math.random() * 0.6 : 0.4 + Math.random() * 0.8,
//                 time: this.formatTime(adjustedMinutes)
//             };
//         });
        
//         // Sort by time
//         return tides.sort((a, b) => a.minutes - b.minutes);
//     }
    
//     formatTime(minutes) {
//         const hours = Math.floor(minutes / 60) % 24;
//         const mins = Math.round(minutes % 60);
//         const ampm = hours >= 12 ? 'PM' : 'AM';
//         const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
//         return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
//     }
    
//     generateTidePathForVisualization(currentTime = new Date()) {
//         const svgWidth = 1440; // 1440 minutes = 24 hours
//         const svgHeight = 1080; // 120 * 9
//         const verticalCenter = svgHeight / 2;
//         const amplitude = svgHeight * 0.3;
        
//         const tideState = this.getCurrentTideState(currentTime);
//         const todaysTides = tideState.allTides;
        
//         let path = `M 0 ${verticalCenter}`;
        
//         // Generate path based on actual tide times
//         for (let x = 0; x <= svgWidth; x += 5) {
//             const minute = x; // x represents minutes from midnight
            
//             // Find the tide cycle for this minute
//             let height = 2.0; // Default
            
//             // Find surrounding tides
//             let beforeTide = null;
//             let afterTide = null;
            
//             for (let i = 0; i < todaysTides.length; i++) {
//                 if (todaysTides[i].minutes <= minute) {
//                     beforeTide = todaysTides[i];
//                 }
//                 if (todaysTides[i].minutes > minute && !afterTide) {
//                     afterTide = todaysTides[i];
//                     break;
//                 }
//             }
            
//             // Handle edge cases
//             if (!beforeTide && afterTide) {
//                 // Before first tide, use previous day's last tide
//                 beforeTide = { type: 'low', minutes: afterTide.minutes - 6.2 * 60, height: 0.8 };
//             }
//             if (beforeTide && !afterTide) {
//                 // After last tide, use next day's first tide
//                 afterTide = { type: beforeTide.type === 'high' ? 'low' : 'high', 
//                              minutes: beforeTide.minutes + 6.2 * 60, 
//                              height: beforeTide.type === 'high' ? 0.8 : 3.2 };
//             }
            
//             if (beforeTide && afterTide) {
//                 // Interpolate between tides using smooth sine curve
//                 const totalDuration = afterTide.minutes - beforeTide.minutes;
//                 const elapsed = minute - beforeTide.minutes;
//                 const progress = elapsed / totalDuration;
                
//                 // Use sine for smooth tide curve
//                 const heightDiff = afterTide.height - beforeTide.height;
//                 height = beforeTide.height + (heightDiff * (1 - Math.cos(progress * Math.PI)) / 2);
//             }
            
//             // Convert height to SVG coordinates
//             const heightRange = 4; // 4 foot tide range
//             const y = verticalCenter - ((height - 2) / heightRange) * amplitude;
            
//             if (!isNaN(y) && isFinite(y)) {
//                 path += ` L ${x} ${y.toFixed(1)}`;
//             }
//         }
        
//         return path;
//     }
// }

// // Global instance
// window.tideCalculator = new RealisticTideCalculator();