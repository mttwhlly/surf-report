class CorrectedTideChart {
    constructor(container, tideData) {
        this.container = container;
        this.tideData = tideData || {};
        this.svg = null;
        this.width = 360;
        this.height = 120;
        
        console.log('🌊 CorrectedTideChart initialized - ACTUALLY FIXED');
        console.log('📊 Received tideData:', JSON.stringify(this.tideData, null, 2));
        this.init();
    }

    init() {
        this.createSVG();
        this.drawChart();
    }

    createSVG() {
        // Remove existing content
        this.container.innerHTML = '';
        
        // Create SVG element - FIXED: Use 24-hour coordinate system
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', `0 0 1440 ${this.height * 9}`); // 1440 = 24 hours * 60 minutes
        this.svg.setAttribute('class', 'tide-chart-svg');
        this.svg.setAttribute('preserveAspectRatio', 'none');
        
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
                stroke-width: 2;
                stroke-linecap: round;
                vector-effect: non-scaling-stroke;
            }
            .tide-fill {
                fill: rgba(255, 255, 255, 0.1);
                stroke: none;
            }
            .current-time-line {
                stroke: #dc2626;
                stroke-width: 3;
                stroke-dasharray: 8,8;
                vector-effect: non-scaling-stroke;
            }
            .tide-marker {
                stroke: rgba(255, 255, 255, 0.9);
                stroke-width: 2;
                cursor: pointer;
                transition: all 0.2s ease;
                vector-effect: non-scaling-stroke;
            }
            .high-tide { fill: #10b981; r: 8; }
            .low-tide { fill: #f59e0b; r: 8; }
            .past-event { opacity: 0.6; }
            .time-label {
                font-size: 32px;
                font-weight: 700;
                text-anchor: middle;
                fill: #dc2626;
                font-family: 'Inter', sans-serif;
            }
            .tide-label {
                font-size: 28px;
                font-weight: 600;
                text-anchor: middle;
                fill: rgba(255, 255, 255, 0.9);
                font-family: 'Inter', sans-serif;
            }
            .past-label {
                opacity: 0.6;
                fill: rgba(255, 255, 255, 0.7);
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
        
        // Get tide events
        const tideEvents = this.collectTideEvents();
        console.log('🌊 Collected tide events:', tideEvents);
        
        // Generate tide path - FIXED: Use consistent coordinate system
        const pathData = this.generateTidePath(tideEvents);
        
        if (pathData && !pathData.includes('NaN')) {
            const svgHeight = this.height * 9;
            
            // FIXED: Use chartMapping width for fill path
            const chartWidth = this.chartMapping ? this.chartMapping.chartWidth : 1440;
            
            // Create filled area
            const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            fillPath.setAttribute('class', 'tide-fill');
            fillPath.setAttribute('d', pathData + ` L${chartWidth},${svgHeight} L0,${svgHeight} Z`);
            this.svg.appendChild(fillPath);
            
            // Create tide curve
            const curvePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            curvePath.setAttribute('class', 'tide-curve');
            curvePath.setAttribute('d', pathData);
            this.svg.appendChild(curvePath);
            
            console.log('✅ Tide chart drawn with fixed coordinates');
        } else {
            console.warn('🌊 Invalid path data, using fallback');
            this.drawFallbackChart();
        }
        
        // Add tide event markers - FIXED coordinates
        this.drawTideEventMarkers(tideEvents);
        
        // Add current time indicator - FIXED coordinates
        this.drawCurrentTimeIndicator();
    }

    collectTideEvents() {
        const tides = this.tideData.tides;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        if (!tides) return [];
        
        const events = [];
        
        // Helper to convert time string to minutes from midnight
        const parseTimeToMinutes = (timeStr, timestampStr) => {
            if (timestampStr) {
                try {
                    const date = new Date(timestampStr);
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    const dayOffset = Math.round((eventDate - todayStart) / (24 * 60 * 60 * 1000));
                    return date.getHours() * 60 + date.getMinutes() + (dayOffset * 1440);
                } catch (error) {
                    console.warn('Error parsing timestamp:', timestampStr);
                }
            }
            
            // Fallback to time string parsing
            const match = timeStr?.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                let hours = parseInt(match[1]);
                const minutes = parseInt(match[2]);
                const ampm = match[3].toUpperCase();
                
                if (ampm === 'PM' && hours !== 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
                
                let totalMinutes = hours * 60 + minutes;
                
                // If this seems like tomorrow's event, add 24 hours
                if (totalMinutes < currentMinutes && totalMinutes < 360) { // Before 6 AM
                    totalMinutes += 1440;
                }
                
                return totalMinutes;
            }
            
            return null;
        };
        
        // Collect all events
        if (tides.previous_high) {
            const minutes = parseTimeToMinutes(tides.previous_high.time, tides.previous_high.timestamp);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.previous_high.height,
                    type: 'high',
                    time: tides.previous_high.time,
                    isPast: minutes < currentMinutes
                });
            }
        }
        
        if (tides.previous_low) {
            const minutes = parseTimeToMinutes(tides.previous_low.time, tides.previous_low.timestamp);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.previous_low.height,
                    type: 'low',
                    time: tides.previous_low.time,
                    isPast: minutes < currentMinutes
                });
            }
        }
        
        if (tides.next_high) {
            const minutes = parseTimeToMinutes(tides.next_high.time, tides.next_high.timestamp);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.next_high.height,
                    type: 'high',
                    time: tides.next_high.time,
                    isPast: minutes < currentMinutes
                });
            }
        }
        
        if (tides.next_low) {
            const minutes = parseTimeToMinutes(tides.next_low.time, tides.next_low.timestamp);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.next_low.height,
                    type: 'low',
                    time: tides.next_low.time,
                    isPast: minutes < currentMinutes
                });
            }
        }
        
        return events.sort((a, b) => a.minutes - b.minutes);
    }

    generateTidePath(events) {
        const svgHeight = this.height * 9;
        const verticalCenter = svgHeight / 2;
        const amplitude = svgHeight * 0.3;
        
        if (events.length === 0) {
            return this.generateFallbackSineWave();
        }
        
        // FIXED: End chart at last tide event to avoid plateau
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Find the range we want to show: from earliest event to latest event
        const startMinute = Math.max(0, Math.min(...events.map(e => e.minutes)) - 60); // 1 hour before first event
        const endMinute = Math.min(1440, Math.max(...events.map(e => e.minutes)) + 60); // 1 hour after last event
        
        // Ensure we always include current time in the range
        const chartStart = Math.min(startMinute, currentMinutes - 180); // At least 3 hours before now
        const chartEnd = Math.max(endMinute, currentMinutes + 360); // At least 6 hours after now
        
        console.log(`🎯 Chart range: ${chartStart} to ${chartEnd} minutes (${((chartEnd - chartStart) / 60).toFixed(1)} hours)`);
        
        // Update SVG viewBox to match our actual range
        const chartWidth = chartEnd - chartStart;
        this.svg.setAttribute('viewBox', `0 0 ${chartWidth} ${svgHeight}`);
        
        // Store mapping for markers and NOW line
        this.chartMapping = {
            startMinute: chartStart,
            endMinute: chartEnd,
            chartWidth: chartWidth,
            mapTimeToX: (minute) => Math.max(0, Math.min(chartWidth, minute - chartStart))
        };
        
        // Generate path only within our smart range
        const startY = this.heightToY(this.interpolateTideHeight(chartStart, events), amplitude, verticalCenter);
        let path = `M 0 ${startY.toFixed(1)}`;
        
        for (let minute = chartStart; minute <= chartEnd; minute += 3) {
            const height = this.interpolateTideHeight(minute, events);
            const y = this.heightToY(height, amplitude, verticalCenter);
            const x = minute - chartStart; // Map to 0-based coordinate
            
            if (!isNaN(y) && isFinite(y)) {
                path += ` L ${x} ${y.toFixed(1)}`;
            }
        }
        
        return path;
    }
    
    interpolateTideHeight(minute, events) {
        if (events.length === 0) {
            return this.tideData.current_height_ft || 2.0;
        }
        
        // Find surrounding events
        let beforeEvent = null;
        let afterEvent = null;
        
        for (let i = 0; i < events.length; i++) {
            if (events[i].minutes <= minute) {
                beforeEvent = events[i];
            }
            if (events[i].minutes > minute && !afterEvent) {
                afterEvent = events[i];
                break;
            }
        }
        
        if (beforeEvent && afterEvent) {
            // Cosine interpolation for smooth tide curves
            const totalDuration = afterEvent.minutes - beforeEvent.minutes;
            const elapsed = minute - beforeEvent.minutes;
            const progress = elapsed / totalDuration;
            
            const heightDiff = afterEvent.height - beforeEvent.height;
            return beforeEvent.height + (heightDiff * (1 - Math.cos(progress * Math.PI)) / 2);
        } else if (beforeEvent) {
            return beforeEvent.height;
        } else if (afterEvent) {
            return afterEvent.height;
        } else {
            return this.tideData.current_height_ft || 2.0;
        }
    }
    
    heightToY(height, amplitude, verticalCenter) {
        const heightRange = this.getTideRange();
        const midHeight = this.getMidTideHeight();
        const normalizedHeight = (height - midHeight) / heightRange;
        
        // Higher tide = lower Y coordinate (top of chart)
        return verticalCenter - (normalizedHeight * amplitude);
    }

    drawTideEventMarkers(events) {
        const svgHeight = this.height * 9;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        if (!this.chartMapping) {
            console.warn('⚠️ No chart mapping available for markers');
            return;
        }
        
        events.forEach((event, index) => {
            // FIXED: Use chart mapping for consistent coordinates
            const xPosition = this.chartMapping.mapTimeToX(event.minutes);
            
            // Skip if outside chart range
            if (xPosition < 0 || xPosition > this.chartMapping.chartWidth) return;
            
            // Calculate Y position on the curve
            const height = event.height;
            const amplitude = svgHeight * 0.3;
            const verticalCenter = svgHeight / 2;
            const yPosition = this.heightToY(height, amplitude, verticalCenter);
            
            // Create marker circle
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            marker.setAttribute('class', `tide-marker ${event.type}-tide ${event.isPast ? 'past-event' : ''}`);
            marker.setAttribute('cx', xPosition);
            marker.setAttribute('cy', yPosition);
            this.svg.appendChild(marker);
            
            // Create label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('class', `tide-label ${event.isPast ? 'past-label' : ''}`);
            label.setAttribute('x', xPosition);
            label.setAttribute('text-anchor', 'middle');
            
            // Position label above/below marker
            const labelY = event.type === 'high' ? 
                Math.max(60, yPosition - 40) : 
                Math.min(svgHeight - 60, yPosition + 60);
            
            label.setAttribute('y', labelY);
            label.setAttribute('fill', event.type === 'high' ? 
                (event.isPast ? '#059669' : '#10b981') : 
                (event.isPast ? '#d97706' : '#f59e0b'));
            
            const labelText = `${event.type === 'high' ? 'High' : 'Low'} ${event.time}`;
            label.textContent = labelText;
            this.svg.appendChild(label);
            
            console.log(`📍 Positioned ${labelText} at x=${xPosition.toFixed(0)} (mapped from ${event.minutes} min)`);
        });
    }

    drawCurrentTimeIndicator() {
        const svgHeight = this.height * 9;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        if (!this.chartMapping) {
            console.warn('⚠️ No chart mapping available for NOW line');
            return;
        }
        
        // FIXED: Use chart mapping for NOW line position
        const nowXPosition = this.chartMapping.mapTimeToX(currentMinutes);
        
        // Only draw if NOW is within chart range
        if (nowXPosition < 0 || nowXPosition > this.chartMapping.chartWidth) {
            console.log(`🕐 NOW line (${currentMinutes} min) is outside chart range, skipping`);
            return;
        }
        
        console.log(`🕐 Drawing NOW line at x=${nowXPosition.toFixed(0)} (${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')})`);
        
        // Create NOW line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'current-time-line');
        line.setAttribute('x1', nowXPosition);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', nowXPosition);
        line.setAttribute('y2', svgHeight);
        this.svg.appendChild(line);
        
        // Create NOW label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'time-label');
        label.setAttribute('x', nowXPosition);
        label.setAttribute('y', svgHeight / 2 - 20);
        label.setAttribute('text-anchor', 'middle');
        label.textContent = 'NOW';
        this.svg.appendChild(label);
        
        // Add time stamp
        const timeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        timeLabel.setAttribute('class', 'time-label');
        timeLabel.setAttribute('x', nowXPosition);
        timeLabel.setAttribute('y', svgHeight / 2 + 20);
        timeLabel.setAttribute('text-anchor', 'middle');
        timeLabel.setAttribute('font-size', '24');
        timeLabel.textContent = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        this.svg.appendChild(timeLabel);
    }

    getTideRange() {
        const tides = this.tideData.tides;
        if (tides?.cycle_info?.range_ft) {
            return tides.cycle_info.range_ft;
        }
        
        // Calculate from available data
        let minHeight = Infinity;
        let maxHeight = -Infinity;
        
        [tides?.previous_high, tides?.previous_low, tides?.next_high, tides?.next_low].forEach(tide => {
            if (tide?.height !== undefined) {
                minHeight = Math.min(minHeight, tide.height);
                maxHeight = Math.max(maxHeight, tide.height);
            }
        });
        
        return minHeight !== Infinity ? maxHeight - minHeight : 4;
    }

    getMidTideHeight() {
        const tides = this.tideData.tides;
        let minHeight = Infinity;
        let maxHeight = -Infinity;
        
        [tides?.previous_high, tides?.previous_low, tides?.next_high, tides?.next_low].forEach(tide => {
            if (tide?.height !== undefined) {
                minHeight = Math.min(minHeight, tide.height);
                maxHeight = Math.max(maxHeight, tide.height);
            }
        });
        
        return minHeight !== Infinity ? (maxHeight + minHeight) / 2 : 2;
    }

    generateFallbackSineWave() {
        const svgHeight = this.height * 9;
        const verticalCenter = svgHeight / 2;
        const amplitude = svgHeight * 0.25;
        
        let path = `M 0 ${verticalCenter}`;
        
        for (let x = 0; x <= 1440; x += 5) {
            // Two tide cycles per day
            const y = verticalCenter + amplitude * Math.sin((x / 1440) * Math.PI * 4);
            path += ` L ${x} ${y.toFixed(1)}`;
        }
        
        return path;
    }

    drawFallbackChart() {
        const path = this.generateFallbackSineWave();
        const svgHeight = this.height * 9;
        
        // Create the curve
        const curvePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        curvePath.setAttribute('class', 'tide-curve');
        curvePath.setAttribute('d', path);
        this.svg.appendChild(curvePath);
        
        // Fill below curve
        const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        fillPath.setAttribute('class', 'tide-fill');
        fillPath.setAttribute('d', path + ` L1440,${svgHeight} L0,${svgHeight} Z`);
        this.svg.appendChild(fillPath);
    }

    updateWithData(newTideData) {
        this.tideData = { ...this.tideData, ...newTideData };
        console.log('🔄 Updating SVG tide chart with new data');
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

console.log('🌊 ACTUALLY FIXED SVG tide chart - simple 1:1 coordinate mapping!');