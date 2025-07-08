class SmoothTideChart {
    constructor(container, tideData) {
        this.container = container;
        this.tideData = tideData || {};
        this.svg = null;
        this.width = 360;
        this.height = 120;
        
        // Safari detection
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        console.log('🌊 SmoothTideChart initialized');
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
                stroke-width: 1;
                stroke-linecap: round;
                vector-effect: non-scaling-stroke;
            }
            .tide-fill {
                fill: rgba(255, 255, 255, 0.1);
                stroke: none;
            }
            .current-time-line {
                stroke: #000000;
                stroke-width: 1;
                stroke-dasharray: 12,8;
                vector-effect: non-scaling-stroke;
            }
            .tide-marker {
                stroke: rgba(255, 255, 255, 0.9);
                stroke-width: 1;
                cursor: pointer;
                transition: all 0.2s ease;
                vector-effect: non-scaling-stroke;
            }
            .high-tide { fill: #10b981; r: 10; }
            .low-tide { fill: #f59e0b; r: 10; }
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
        
        // Generate smooth tide curve
        const pathData = this.generateSmoothTideCurve();
        
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
            
            console.log('✅ Smooth tide chart drawn successfully');
        } else {
            console.warn('🌊 Using fallback chart');
            this.drawFallbackChart();
        }
        
        // Add tide event markers
        this.drawTideEventMarkers();
        
        // Add current time indicator
        this.drawCurrentTimeIndicator();
    }

    generateSmoothTideCurve() {
        const svgWidth = 1440; // 24 hours in minutes
        const svgHeight = this.height * 9;
        const verticalCenter = svgHeight / 2;
        
        // Get tide parameters for smooth curve
        const tideParams = this.calculateTideParameters();
        
        let path = '';
        
        // Generate smooth sinusoidal curve
        for (let x = 0; x <= svgWidth; x += 2) {
            const timeInHours = x / 60; // Convert minutes to hours
            const height = this.calculateTideHeight(timeInHours, tideParams);
            
            // Convert tide height to SVG coordinates
            const y = this.heightToSVG(height, verticalCenter, tideParams);
            
            if (x === 0) {
                path = `M ${x} ${y.toFixed(1)}`;
            } else {
                path += ` L ${x} ${y.toFixed(1)}`;
            }
        }
        
        return path;
    }

    calculateTideParameters() {
        const now = new Date();
        const currentHour = now.getHours() + now.getMinutes() / 60;
        const currentHeight = this.tideData.current_height_ft || 2.0;
        
        // Get tide range and mid-point
        let highHeight = 4.0;
        let lowHeight = 0.5;
        
        const tides = this.tideData.tides;
        if (tides) {
            if (tides.next_high?.height) highHeight = tides.next_high.height;
            if (tides.next_low?.height) lowHeight = tides.next_low.height;
            
            // Also check previous tides for better range estimation
            if (tides.previous_high?.height) {
                highHeight = Math.max(highHeight, tides.previous_high.height);
            }
            if (tides.previous_low?.height) {
                lowHeight = Math.min(lowHeight, tides.previous_low.height);
            }
        }
        
        const amplitude = (highHeight - lowHeight) / 2;
        const midHeight = (highHeight + lowHeight) / 2;
        
        // Calculate phase shift to match current conditions
        let phaseShift = 0;
        
        // Try to match the current height and tide state
        if (this.tideData.state) {
            const state = this.tideData.state.toLowerCase();
            
            if (state.includes('high')) {
                // At or near high tide
                phaseShift = Math.PI / 2; // Peak of sine wave
            } else if (state.includes('low')) {
                // At or near low tide
                phaseShift = -Math.PI / 2; // Trough of sine wave
            } else if (state.includes('rising') || state.includes('flood')) {
                // Rising tide - on upward slope
                // Calculate where we are in the cycle based on current height
                const normalizedHeight = (currentHeight - midHeight) / amplitude;
                phaseShift = Math.asin(Math.max(-1, Math.min(1, normalizedHeight)));
            } else if (state.includes('falling') || state.includes('ebb')) {
                // Falling tide - on downward slope
                const normalizedHeight = (currentHeight - midHeight) / amplitude;
                phaseShift = Math.PI - Math.asin(Math.max(-1, Math.min(1, normalizedHeight)));
            } else {
                // Mid tide - calculate based on height
                const normalizedHeight = (currentHeight - midHeight) / amplitude;
                phaseShift = Math.asin(Math.max(-1, Math.min(1, normalizedHeight)));
            }
        }
        
        // Adjust phase to make current time match current height
        const currentPhase = (currentHour * Math.PI) / 6.2; // ~12.4 hour cycle
        phaseShift = phaseShift - currentPhase;
        
        return {
            amplitude,
            midHeight,
            phaseShift,
            period: 12.4, // Semi-diurnal tide (12.4 hours per cycle)
            currentHeight,
            highHeight,
            lowHeight
        };
    }

    calculateTideHeight(timeInHours, params) {
        // Standard semi-diurnal tide formula
        const phase = (timeInHours * 2 * Math.PI) / params.period + params.phaseShift;
        return params.midHeight + params.amplitude * Math.sin(phase);
    }

    heightToSVG(tideHeight, verticalCenter, params) {
        // Convert tide height to SVG Y coordinate
        const svgHeight = this.height * 9;
        const maxAmplitude = svgHeight * 0.35; // Use more of the available space
        
        const normalizedHeight = (tideHeight - params.midHeight) / params.amplitude;
        return verticalCenter - (normalizedHeight * maxAmplitude);
    }

    drawTideEventMarkers() {
        const svgHeight = this.height * 9;
        const tides = this.tideData.tides;
        
        if (!tides) return;
        
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const events = [];
        
        // Helper to parse time strings
        const parseTimeToMinutes = (timeString) => {
            if (!timeString || typeof timeString !== 'string') return null;
            
            const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return null;
            
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const ampm = match[3].toUpperCase();
            
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            return hours * 60 + minutes;
        };
        
        // Add all tide events
        if (tides.previous_high?.time) {
            const minutes = parseTimeToMinutes(tides.previous_high.time);
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
        
        if (tides.previous_low?.time) {
            const minutes = parseTimeToMinutes(tides.previous_low.time);
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
        
        if (tides.next_high?.time) {
            const minutes = parseTimeToMinutes(tides.next_high.time);
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
        
        if (tides.next_low?.time) {
            let minutes = parseTimeToMinutes(tides.next_low.time);
            if (minutes !== null) {
                // Handle tomorrow's low tide
                if (minutes < currentMinutes && minutes < 360) {
                    minutes += 1440;
                }
                
                events.push({
                    minutes,
                    height: tides.next_low.height,
                    type: 'low',
                    time: tides.next_low.time,
                    isPast: false
                });
            }
        }
        
        // Draw markers with better spacing
        // events.forEach((event, index) => {
        //     // const xPosition = Math.max(0, Math.min(1440, event.minutes));
            
        //     // Create marker circle
        //     // const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        //     // marker.setAttribute('class', `tide-marker ${event.type}-tide ${event.isPast ? 'past-event' : ''}`);
        //     // marker.setAttribute('cx', xPosition);
        //     // marker.setAttribute('cy', event.type === 'high' ? this.height * 1.5 : this.height * 7.5);
        //     // this.svg.appendChild(marker);
            
        //     // Create label with smart positioning
        //     // const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        //     // label.setAttribute('class', `tide-label ${event.isPast ? 'past-label' : ''}`);
        //     // label.setAttribute('x', xPosition);
        //     // label.setAttribute('text-anchor', 'middle');
            
        //     // let labelY;
        //     // if (event.type === 'high') {
        //     //     labelY = 80 + (index % 2) * 50;
        //     //     label.setAttribute('fill', event.isPast ? '#059669' : '#10b981');
        //     // } else {
        //     //     labelY = svgHeight - 50 - (index % 2) * 50;
        //     //     label.setAttribute('fill', event.isPast ? '#d97706' : '#f59e0b');
        //     // }
            
        //     // label.setAttribute('y', labelY);
        //     // label.textContent = `${event.type === 'high' ? 'High' : 'Low'} ${event.time}`;
        //     // this.svg.appendChild(label);
        // });
    }

    drawCurrentTimeIndicator() {
        const svgHeight = this.height * 9;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Create NOW line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'current-time-line');
        line.setAttribute('x1', currentMinutes);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', currentMinutes);
        line.setAttribute('y2', svgHeight);
        this.svg.appendChild(line);
        
        // Create time label
        // const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        // label.setAttribute('class', 'time-label');
        // label.setAttribute('x', currentMinutes);
        // label.setAttribute('y', svgHeight / 2 - 30);
        // label.setAttribute('text-anchor', 'middle');
        // label.textContent = 'NOW';
        // this.svg.appendChild(label);
        
        // const timeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        // timeLabel.setAttribute('class', 'time-label');
        // timeLabel.setAttribute('x', currentMinutes);
        // timeLabel.setAttribute('y', svgHeight / 2 + 10);
        // timeLabel.setAttribute('text-anchor', 'middle');
        // timeLabel.setAttribute('font-size', '24');
        // timeLabel.textContent = timeString;
        // this.svg.appendChild(timeLabel);
        
        // console.log(`🕐 NOW line positioned at ${currentMinutes}: ${timeString}`);
        // console.log(`🌊 Tide state: ${this.tideData.state} - Smooth curve generated`);
    }

    drawFallbackChart() {
        const svgHeight = this.height * 9;
        const svgWidth = 1440;
        const verticalCenter = svgHeight / 2;
        const amplitude = svgHeight * 0.3;
        
        let path = `M 0 ${verticalCenter}`;
        
        for (let x = 0; x <= svgWidth; x += 3) {
            // Two complete tide cycles per day
            const y = verticalCenter + amplitude * Math.sin((x / svgWidth) * Math.PI * 4 - Math.PI);
            path += ` L ${x} ${y.toFixed(1)}`;
        }
        
        const curvePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        curvePath.setAttribute('class', 'tide-curve');
        curvePath.setAttribute('d', path);
        this.svg.appendChild(curvePath);
        
        const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        fillPath.setAttribute('class', 'tide-fill');
        fillPath.setAttribute('d', path + ` L${svgWidth},${svgHeight} L0,${svgHeight} Z`);
        this.svg.appendChild(fillPath);
    }

    updateWithData(newTideData) {
        this.tideData = { ...this.tideData, ...newTideData };
        console.log('🌊 Updating smooth tide chart with new data');
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

console.log('🌊 Smooth tide chart loaded - Natural sinusoidal curves!');