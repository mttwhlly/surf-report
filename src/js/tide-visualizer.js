class CorrectedTideChart {
    constructor(container, tideData) {
        this.container = container;
        this.tideData = tideData || {};
        this.svg = null;
        this.width = 360;
        this.height = 120;
        
        // Safari detection
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        console.log('🌊 CorrectedTideChart initialized');
        console.log('📊 Received tideData:', JSON.stringify(this.tideData, null, 2));
        console.log('📊 tideData.tides:', this.tideData.tides);
        console.log('🕐 Current time for debugging:', new Date().toLocaleString());
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
        this.svg.setAttribute('viewBox', `0 0 1440 ${this.height * 9}`);
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
                stroke-width: 2;
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
        
        // Generate tide path using real API data
        const pathData = this.generateTidePathFromAPIData();
        
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
            
            console.log('✅ Tide chart drawn with real API data');
        } else {
            console.warn('🌊 Invalid path data, using simple fallback');
            this.drawSimpleFallbackChart();
        }
        
        // Add tide event markers using real API data
        this.drawTideEventMarkers();
        
        // Add current time indicator
        this.drawCurrentTimeIndicator();
    }

    generateTidePathFromAPIData() {
        const svgWidth = 1440; // 1440 minutes = 24 hours
        const svgHeight = this.height * 9;
        const verticalCenter = svgHeight / 2;
        const amplitude = svgHeight * 0.3;
        
        // Collect all tide events from API data
        const tideEvents = this.collectTideEvents();
        console.log('🌊 Tide events for curve generation:', tideEvents);
        
        if (tideEvents.length === 0) {
            console.warn('⚠️ No tide events found, using fallback sine wave');
            return this.generateFallbackSineWave();
        }
        
        let path = `M 0 ${verticalCenter}`;
        
        // Generate smooth curve through tide points
        for (let x = 0; x <= svgWidth; x += 3) {
            const minute = x; // x represents minutes from midnight
            let height = this.tideData.current_height_ft || 2.0;
            
            // Find surrounding tide events
            let beforeEvent = null;
            let afterEvent = null;
            
            for (let i = 0; i < tideEvents.length; i++) {
                if (tideEvents[i].minutes <= minute) {
                    beforeEvent = tideEvents[i];
                }
                if (tideEvents[i].minutes > minute && !afterEvent) {
                    afterEvent = tideEvents[i];
                    break;
                }
            }
            
            // Interpolate between events
            if (beforeEvent && afterEvent) {
                const totalDuration = afterEvent.minutes - beforeEvent.minutes;
                const elapsed = minute - beforeEvent.minutes;
                const progress = elapsed / totalDuration;
                
                // Use cosine interpolation for smooth tide curve
                const heightDiff = afterEvent.height - beforeEvent.height;
                height = beforeEvent.height + (heightDiff * (1 - Math.cos(progress * Math.PI)) / 2);
            } else if (beforeEvent) {
                height = beforeEvent.height;
            } else if (afterEvent) {
                height = afterEvent.height;
            }
            
            // Convert height to SVG coordinates
            const heightRange = Math.max(4, this.getTideRange()); // Use actual tide range
            const normalizedHeight = (height - this.getMidTideHeight()) / heightRange;
            const y = verticalCenter - (normalizedHeight * amplitude);
            
            if (!isNaN(y) && isFinite(y)) {
                path += ` L ${x} ${y.toFixed(1)}`;
            }
        }
        
        return path;
    }

    collectTideEvents() {
        const events = [];
        const tides = this.tideData.tides;
        
        if (!tides) return events;
        
        // Helper function to convert timestamp to minutes since midnight
        const timestampToMinutes = (timestamp) => {
            if (!timestamp) return null;
            
            try {
                const date = new Date(timestamp);
                const now = new Date();
                
                // Get the start of today for accurate day calculation
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                
                // Calculate day offset more accurately
                const dayOffset = Math.round((eventDate - todayStart) / (24 * 60 * 60 * 1000));
                const minutes = date.getHours() * 60 + date.getMinutes() + (dayOffset * 1440);
                
                console.log(`🕐 Converting ${timestamp} to ${minutes} minutes (day offset: ${dayOffset})`);
                return minutes;
            } catch (error) {
                console.error('❌ Error parsing timestamp:', timestamp, error);
                return null;
            }
        };
        
        // Add previous events (for smooth curve start)
        if (tides.previous_high && tides.previous_high.timestamp) {
            const minutes = timestampToMinutes(tides.previous_high.timestamp);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.previous_high.height,
                    type: 'high',
                    time: tides.previous_high.time,
                    isPast: true
                });
            }
        }
        
        if (tides.previous_low && tides.previous_low.timestamp) {
            const minutes = timestampToMinutes(tides.previous_low.timestamp);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.previous_low.height,
                    type: 'low',
                    time: tides.previous_low.time,
                    isPast: true
                });
            }
        }
        
        // Add future events
        if (tides.next_high && tides.next_high.timestamp) {
            const minutes = timestampToMinutes(tides.next_high.timestamp);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.next_high.height,
                    type: 'high',
                    time: tides.next_high.time,
                    isPast: false
                });
            }
        }
        
        if (tides.next_low && tides.next_low.timestamp) {
            const minutes = timestampToMinutes(tides.next_low.timestamp);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.next_low.height,
                    type: 'low',
                    time: tides.next_low.time,
                    isPast: false
                });
            }
        }
        
        // Sort by time
        events.sort((a, b) => a.minutes - b.minutes);
        
        // Extend the curve with extrapolated events if needed
        if (events.length >= 2) {
            const firstEvent = events[0];
            const secondEvent = events[1];
            
            // Add event before the first to smooth curve start
            if (firstEvent.minutes > 0) {
                const timeDiff = secondEvent.minutes - firstEvent.minutes;
                events.unshift({
                    minutes: firstEvent.minutes - timeDiff,
                    height: firstEvent.type === 'high' ? 
                        Math.min(firstEvent.height - 2, 0.5) : 
                        Math.max(firstEvent.height + 2, 4.0),
                    type: firstEvent.type === 'high' ? 'low' : 'high',
                    time: 'extrapolated',
                    isPast: true
                });
            }
            
            // Add event after the last to smooth curve end
            const lastEvent = events[events.length - 1];
            const secondLastEvent = events[events.length - 2];
            
            if (lastEvent.minutes < 1440) {
                const timeDiff = lastEvent.minutes - secondLastEvent.minutes;
                events.push({
                    minutes: lastEvent.minutes + timeDiff,
                    height: lastEvent.type === 'high' ? 
                        Math.min(lastEvent.height - 2, 0.5) : 
                        Math.max(lastEvent.height + 2, 4.0),
                    type: lastEvent.type === 'high' ? 'low' : 'high',
                    time: 'extrapolated',
                    isPast: false
                });
            }
        }
        
        return events;
    }

    drawTideEventMarkers() {
        console.log('🌊 drawTideEventMarkers called with tideData:', this.tideData);
        
        const svgHeight = this.height * 9;
        const tides = this.tideData.tides;
        
        if (!tides) {
            console.warn('⚠️ No tides data available for markers');
            return;
        }
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        console.log('🕐 Current time:', `${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
        
        const events = [];
        
        // Add previous high if available
        if (tides.previous_high && tides.previous_high.time && tides.previous_high.height) {
            const minutes = this.parseTimeToMinutes(tides.previous_high.time);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.previous_high.height,
                    type: 'high',
                    time: tides.previous_high.time,
                    isPast: true
                });
                console.log('✅ Added previous_high:', tides.previous_high.time);
            }
        }
        
        // Add previous low if available
        if (tides.previous_low && tides.previous_low.time && tides.previous_low.height) {
            const minutes = this.parseTimeToMinutes(tides.previous_low.time);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.previous_low.height,
                    type: 'low',
                    time: tides.previous_low.time,
                    isPast: true
                });
                console.log('✅ Added previous_low:', tides.previous_low.time);
            }
        }
        
        // Add next high if available
        if (tides.next_high && tides.next_high.time && tides.next_high.height) {
            const minutes = this.parseTimeToMinutes(tides.next_high.time);
            if (minutes !== null) {
                events.push({
                    minutes,
                    height: tides.next_high.height,
                    type: 'high',
                    time: tides.next_high.time,
                    isPast: false
                });
                console.log('✅ Added next_high:', tides.next_high.time);
            }
        }
        
        // Add next low if available
        if (tides.next_low && tides.next_low.time && tides.next_low.height) {
            let minutes = this.parseTimeToMinutes(tides.next_low.time);
            if (minutes !== null) {
                // Check if this is tomorrow's low tide (early AM hours)
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                if (minutes < currentMinutes && minutes < 360) { // Before 6 AM and before current time
                    minutes += 1440; // Add 24 hours for tomorrow
                    console.log(`🔄 Adjusted next_low to tomorrow: ${minutes} minutes`);
                }
                
                events.push({
                    minutes,
                    height: tides.next_low.height,
                    type: 'low',
                    time: tides.next_low.time,
                    isPast: false
                });
                console.log('✅ Added next_low:', tides.next_low.time);
            }
        }
        
        console.log('📊 Total events collected:', events.length);
        
        if (events.length === 0) {
            console.log('⚠️ No valid tide events found - using fallback');
            return;
        }
        
        // Sort events by time
        events.sort((a, b) => a.minutes - b.minutes);
        console.log('🌊 All events sorted by actual time:', events);
        
        // Filter events to show only reasonable ones (within display range)
        const displayEvents = events.filter(event => event.minutes >= -60 && event.minutes <= 1500);
        
        // Separate past and future events for styling - use actual current time
        const currentMinutes = currentHour * 60 + currentMinute;
        const pastEvents = displayEvents.filter(e => e.minutes < currentMinutes);
        const futureEvents = displayEvents.filter(e => e.minutes >= currentMinutes);
        
        console.log('🔍 Past events:', pastEvents.map(e => `${e.type === 'high' ? 'High' : 'Low'} ${e.time} (${e.minutes} min)`));
        console.log('🔍 Future events:', futureEvents.map(e => `${e.type === 'high' ? 'High' : 'Low'} ${e.time} (${e.minutes} min)`));
        console.log('🕐 Current time for comparison:', currentMinutes, 'minutes');
        
        // Only show the most relevant events to avoid clutter
        const eventsToShow = displayEvents.filter(event => {
            // Always show future events
            if (event.minutes >= currentMinutes) return true;
            // Show past events only if they're within the last 12 hours
            return event.minutes >= currentMinutes - 720;
        });
        
        console.log('✅ Final events to display:', eventsToShow);
        
        // Store event positions for positioning NOW line intelligently
        this.eventPositions = eventsToShow.map(event => ({
            ...event,
            xPosition: Math.max(0, Math.min(1440, event.minutes))
        }));
        
        // Draw the events with smart label positioning
        eventsToShow.forEach((event, index) => {
            const xPosition = Math.max(0, Math.min(1440, event.minutes));
            
            console.log(`🏷️ Drawing event ${index + 1}: ${event.type} ${event.time} at x=${xPosition}`);
            
            // Create marker circle
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            marker.setAttribute('class', `tide-marker ${event.type}-tide ${event.isPast ? 'past-event' : ''}`);
            marker.setAttribute('cx', xPosition);
            marker.setAttribute('cy', event.type === 'high' ? this.height * 2 : this.height * 7);
            this.svg.appendChild(marker);
            
            // Create label with smart positioning to avoid overlaps
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('class', `tide-label ${event.isPast ? 'past-label' : ''}`);
            label.setAttribute('x', xPosition);
            label.setAttribute('text-anchor', 'middle');
            
            // Position labels with more spacing to avoid collisions
            let labelY;
            if (event.type === 'high') {
                // High tide labels at top, but vary the height to avoid overlaps
                labelY = 60 + (index % 2) * 40; // Alternate between y=60 and y=100
                label.setAttribute('fill', event.isPast ? '#059669' : '#10b981');
            } else {
                // Low tide labels at bottom, vary height to avoid overlaps  
                labelY = svgHeight - 30 - (index % 2) * 40; // Alternate between y=-30 and y=-70 from bottom
                label.setAttribute('fill', event.isPast ? '#d97706' : '#f59e0b');
            }
            
            label.setAttribute('y', labelY);
            
            const labelText = `${event.type === 'high' ? 'High' : 'Low'} ${event.time}`;
            label.textContent = labelText;
            this.svg.appendChild(label);
            
            console.log(`📍 Label "${labelText}" positioned at (${xPosition}, ${labelY})`);
        });
        
        // Calculate intelligent NOW line position
        const nowRatio = currentMinutes / 1440;
        console.log('🕐 NOW ratio calculation:', nowRatio.toFixed(3), `(${(nowRatio * 100).toFixed(1)}%)`);
        
        // Position NOW line at actual current time - accuracy is more important than avoiding overlap
        let nowXPosition = currentMinutes;
        
        console.log('📍 Tide event positions:');
        this.eventPositions.forEach(event => {
            const relativeToNow = event.xPosition - currentMinutes;
            const status = relativeToNow > 0 ? `+${relativeToNow} min (future)` : `${relativeToNow} min (past)`;
            console.log(`   ${event.type} ${event.time}: ${event.xPosition} min ${status}`);
        });
        
        // Only adjust if we're VERY close to an event (within 30 minutes) and it would cause real overlap
        if (this.eventPositions.length > 0) {
            const veryCloseEvent = this.eventPositions.find(event => 
                Math.abs(event.xPosition - currentMinutes) < 30 // Only adjust for very close events
            );
            
            if (veryCloseEvent) {
                // Make a minimal adjustment (15 minutes max) to avoid label collision
                const minimalOffset = veryCloseEvent.xPosition > currentMinutes ? -15 : 15;
                nowXPosition = Math.max(0, Math.min(1440, currentMinutes + minimalOffset));
                console.log(`🎯 NOW minimally adjusted: ${currentMinutes} → ${nowXPosition} (${minimalOffset > 0 ? '+' : ''}${minimalOffset} min)`);
            } else {
                console.log(`🎯 NOW positioned at exact current time: ${nowXPosition}`);
            }
        }
        
        // Store for use in drawCurrentTimeIndicator
        this.calculatedNowPosition = nowXPosition;
        
        console.log('📍 Stored', this.eventPositions.length, 'event positions for curve generation');
    }

    drawCurrentTimeIndicator() {
        const svgHeight = this.height * 9;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Use calculated position if available, otherwise use actual current time
        const nowXPosition = this.calculatedNowPosition || currentMinutes;
        
        // Create NOW line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'current-time-line');
        line.setAttribute('x1', nowXPosition);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', nowXPosition);
        line.setAttribute('y2', svgHeight);
        this.svg.appendChild(line);
        
        // Create time string
        const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Create NOW label with time info
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'time-label');
        label.setAttribute('x', nowXPosition);
        label.setAttribute('y', svgHeight / 2 - 20); // Position above middle
        label.setAttribute('text-anchor', 'middle');
        label.textContent = 'NOW';
        this.svg.appendChild(label);
        
        // Add time stamp below NOW
        const timeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        timeLabel.setAttribute('class', 'time-label');
        timeLabel.setAttribute('x', nowXPosition);
        timeLabel.setAttribute('y', svgHeight / 2 + 20); // Position below middle
        timeLabel.setAttribute('text-anchor', 'middle');
        timeLabel.setAttribute('font-size', '24'); // Smaller font
        timeLabel.textContent = timeString;
        this.svg.appendChild(timeLabel);
        
        const actualMinutes = now.getHours() * 60 + now.getMinutes();
        const adjustmentMinutes = nowXPosition - actualMinutes;
        
        if (Math.abs(adjustmentMinutes) > 5) {
            console.log(`🕐 NOW line positioned at ${nowXPosition} (${(nowXPosition/1440*100).toFixed(1)}%) - adjusted by ${adjustmentMinutes} minutes from actual time (${actualMinutes}): ${timeString}`);
        } else {
            console.log(`🕐 NOW line positioned at ${nowXPosition} (${(nowXPosition/1440*100).toFixed(1)}%) - accurate time: ${timeString}`);
        }
    }

    parseTimeToMinutes(timeString) {
        if (!timeString || typeof timeString !== 'string') return null;
        
        // Handle "6:47 PM" format
        const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) {
            console.warn('⚠️ Unable to parse time string:', timeString);
            return null;
        }
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
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
        const svgWidth = 1440;
        const svgHeight = this.height * 9;
        const verticalCenter = svgHeight / 2;
        const amplitude = svgHeight * 0.25;
        
        let path = `M 0 ${verticalCenter}`;
        
        for (let x = 0; x <= svgWidth; x += 5) {
            // Two complete tide cycles per day (semi-diurnal)
            const y = verticalCenter + amplitude * Math.sin((x / svgWidth) * Math.PI * 4 - Math.PI);
            path += ` L ${x} ${y.toFixed(1)}`;
        }
        
        return path;
    }

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

    updateWithData(newTideData) {
        this.tideData = { ...this.tideData, ...newTideData };
        console.log('🌊 Updating corrected tide chart with new data:', this.tideData);
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

console.log('🌊 Corrected tide chart loaded - NOW line will be positioned correctly!');