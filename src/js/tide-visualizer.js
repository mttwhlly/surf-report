class EnhancedTideChart {
    constructor(container, tideData) {
        this.container = container;
        this.tideData = tideData || {};
        this.svg = null;
        this.width = 360;
        this.height = 120;
        
        this.init();
    }

    init() {
        this.createSVG();
        this.drawChart();
    }

    createSVG() {
        // Remove existing content
        this.container.innerHTML = '';
        
        // Create SVG element with proper viewBox for tide data
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 1440 ${this.height * 9}`); // Scale to match tide data
        this.svg.setAttribute('class', 'tide-chart-svg');
        this.svg.setAttribute('preserveAspectRatio', 'none');
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .tide-chart-svg {
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.05);
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
                r: 4;
                stroke: rgba(255, 255, 255, 0.9);
                stroke-width: 2;
                cursor: pointer;
                transition: all 0.2s ease;
                vector-effect: non-scaling-stroke;
            }
            .tide-marker:hover {
                r: 6;
                stroke-width: 3;
            }
            .high-tide { fill: #10b981; }
            .low-tide { fill: #f59e0b; }
            .current-marker { fill: #dc2626; }
            .time-label {
                font-size: 24px;
                font-weight: 600;
                text-anchor: middle;
                fill: rgba(255, 255, 255, 0.8);
                font-family: 'Bricolage Grotesque', sans-serif;
            }
            .tide-label {
                font-size: 20px;
                font-weight: 500;
                text-anchor: middle;
                fill: rgba(255, 255, 255, 0.9);
                font-family: 'Bricolage Grotesque', sans-serif;
            }
            .grid-line {
                stroke: rgba(255, 255, 255, 0.1);
                stroke-width: 1;
                vector-effect: non-scaling-stroke;
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
        
        // Use your real tide calculation
        const pathData = this.generateRealTidePath();
        
        if (pathData) {
            // Draw filled area
            const svgHeight = this.height * 9; // Scale factor
            const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            fillPath.setAttribute('class', 'tide-fill');
            fillPath.setAttribute('d', pathData + ` L1440,${svgHeight} L0,${svgHeight} Z`);
            this.svg.appendChild(fillPath);
            
            // Draw tide curve
            const curvePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            curvePath.setAttribute('class', 'tide-curve');
            curvePath.setAttribute('d', pathData);
            this.svg.appendChild(curvePath);
        }
        
        // Add current time indicator (noon line)
        this.drawCurrentTimeIndicator();
        
        // Add next tide predictions with labels
        this.drawNextTideLabels();
    }

    generateRealTidePath() {
        // Use your exact tide calculation logic
        if (!this.tideData.tides || !this.tideData.tides.previous_low) {
            return this.generateFallbackPath();
        }

        const svgWidth = 1440;      // 1440 minutes = 24h
        const svgHeight = this.height * 9; // Scale factor
        const verticalCenter = svgHeight / 2;
        const tideRangeFt = this.tideData.tides.cycle_info?.range_ft || 6;
        const maxVisualAmplitude = svgHeight * 0.35; // 35% of height
        const normalizedRange = Math.min(tideRangeFt, 10);
        const amplitude = (normalizedRange / 10) * maxVisualAmplitude;
        const tideCycleMin = (this.tideData.tides.cycle_info?.cycle_duration_hours || 12.4) * 60;
        
        // Parse the previous low time
        const firstLow = new Date(this.tideData.tides.previous_low.timestamp + " GMT-0000");
        const lowTideOffset = firstLow.getHours() * 60 + firstLow.getMinutes();
        const phaseShift = -2 * Math.PI * lowTideOffset / tideCycleMin;
        
        const now = new Date();
        const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
        const windowStartMin = minutesSinceMidnight - 720; // 12 hours before now
        
        let path = `M 0 ${verticalCenter}`;
        
        for (let x = 0; x <= svgWidth; x++) {
            const minute = windowStartMin + x;
            const radians = (2 * Math.PI * minute / tideCycleMin) + phaseShift;
            const y = verticalCenter + amplitude * Math.sin(radians);
            path += ` L ${x} ${y.toFixed(2)}`;
        }
        
        return path;
    }

    generateFallbackPath() {
        // Fallback sine wave if no real data
        const svgWidth = 1440;
        const svgHeight = this.height * 9;
        const verticalCenter = svgHeight / 2;
        const amplitude = svgHeight * 0.25;
        
        let path = `M 0 ${verticalCenter}`;
        
        for (let x = 0; x <= svgWidth; x++) {
            const tidePhase = (x / svgWidth) * Math.PI * 2; // One full cycle
            const y = verticalCenter + amplitude * Math.sin(tidePhase - Math.PI/2);
            path += ` L ${x} ${y.toFixed(2)}`;
        }
        
        return path;
    }

    drawCurrentTimeIndicator() {
        const svgHeight = this.height * 9;
        
        // Current time line at center (noon in 24h view)
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'current-time-line');
        line.setAttribute('x1', 720); // Center of 1440px
        line.setAttribute('y1', 0);
        line.setAttribute('x2', 720);
        line.setAttribute('y2', svgHeight);
        this.svg.appendChild(line);
        
        // Add "NOW" label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'time-label');
        label.setAttribute('x', 720);
        label.setAttribute('y', 30);
        label.setAttribute('fill', '#dc2626');
        label.textContent = 'NOW';
        this.svg.appendChild(label);
    }

    drawNextTideLabels() {
        const svgHeight = this.height * 9;
        
        // Calculate next high and low tide positions and times
        const nextTides = this.calculateNextTides();
        
        if (nextTides.length > 0) {
            // First upcoming tide
            const firstTide = nextTides[0];
            const firstLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            firstLabel.setAttribute('class', 'tide-label');
            firstLabel.setAttribute('x', firstTide.x);
            firstLabel.setAttribute('y', firstTide.isHigh ? 50 : svgHeight - 20);
            firstLabel.setAttribute('fill', firstTide.isHigh ? '#10b981' : '#f59e0b');
            firstLabel.textContent = `${firstTide.isHigh ? 'High' : 'Low'} ${firstTide.time}`;
            this.svg.appendChild(firstLabel);
            
            // Add tide marker
            const firstMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            firstMarker.setAttribute('class', `tide-marker ${firstTide.isHigh ? 'high-tide' : 'low-tide'}`);
            firstMarker.setAttribute('cx', firstTide.x);
            firstMarker.setAttribute('cy', firstTide.y);
            firstMarker.setAttribute('r', 4);
            this.svg.appendChild(firstMarker);
        }
        
        if (nextTides.length > 1) {
            // Second upcoming tide
            const secondTide = nextTides[1];
            const secondLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            secondLabel.setAttribute('class', 'tide-label');
            secondLabel.setAttribute('x', secondTide.x);
            secondLabel.setAttribute('y', secondTide.isHigh ? 50 : svgHeight - 20);
            secondLabel.setAttribute('fill', secondTide.isHigh ? '#10b981' : '#f59e0b');
            secondLabel.textContent = `${secondTide.isHigh ? 'High' : 'Low'} ${secondTide.time}`;
            this.svg.appendChild(secondLabel);
            
            // Add tide marker
            const secondMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            secondMarker.setAttribute('class', `tide-marker ${secondTide.isHigh ? 'high-tide' : 'low-tide'}`);
            secondMarker.setAttribute('cx', secondTide.x);
            secondMarker.setAttribute('cy', secondTide.y);
            secondMarker.setAttribute('r', 4);
            this.svg.appendChild(secondMarker);
        }
    }

    calculateNextTides() {
        const tides = [];
        
        if (!this.tideData.tides || !this.tideData.tides.previous_low) {
            // Fallback positions
            return [
                { x: 900, y: this.height * 2, time: "4:04PM", isHigh: true },
                { x: 1200, y: this.height * 7, time: "10:20PM", isHigh: false }
            ];
        }
        
        const tideCycleMin = (this.tideData.tides.cycle_info?.cycle_duration_hours || 12.4) * 60;
        const halfCycle = tideCycleMin / 2; // Time between high and low
        
        // Parse previous low
        const firstLow = new Date(this.tideData.tides.previous_low.timestamp + " GMT-0000");
        const lowTideOffset = firstLow.getHours() * 60 + firstLow.getMinutes();
        
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Calculate next tide times
        let nextLowMin = lowTideOffset;
        let nextHighMin = lowTideOffset + halfCycle;
        
        // Advance to future tides
        while (nextLowMin < currentMinutes) {
            nextLowMin += tideCycleMin;
        }
        while (nextHighMin < currentMinutes) {
            nextHighMin += tideCycleMin;
        }
        
        // Determine which comes first
        const firstIsLow = nextLowMin < nextHighMin;
        
        if (firstIsLow) {
            // Next low tide first
            const lowX = 720 + (nextLowMin - currentMinutes); // Position relative to NOW line
            const highX = 720 + (nextHighMin - currentMinutes);
            
            if (lowX >= 0 && lowX <= 1440) {
                tides.push({
                    x: lowX,
                    y: this.height * 7, // Bottom of chart
                    time: this.formatTime(nextLowMin),
                    isHigh: false
                });
            }
            
            if (highX >= 0 && highX <= 1440) {
                tides.push({
                    x: highX,
                    y: this.height * 2, // Top of chart
                    time: this.formatTime(nextHighMin),
                    isHigh: true
                });
            }
        } else {
            // Next high tide first
            const highX = 720 + (nextHighMin - currentMinutes);
            const lowX = 720 + (nextLowMin - currentMinutes);
            
            if (highX >= 0 && highX <= 1440) {
                tides.push({
                    x: highX,
                    y: this.height * 2,
                    time: this.formatTime(nextHighMin),
                    isHigh: true
                });
            }
            
            if (lowX >= 0 && lowX <= 1440) {
                tides.push({
                    x: lowX,
                    y: this.height * 7,
                    time: this.formatTime(nextLowMin),
                    isHigh: false
                });
            }
        }
        
        return tides;
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60) % 24;
        const mins = Math.floor(minutes % 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${mins.toString().padStart(2, '0')}${ampm}`;
    }

    // Update method for real data
    updateWithData(newTideData) {
        this.tideData = { ...this.tideData, ...newTideData };
        this.drawChart();
    }

    // Resize method
    resize() {
        const rect = this.container.getBoundingClientRect();
        this.svg.style.width = rect.width + 'px';
        this.svg.style.height = rect.height + 'px';
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}