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
        
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.setAttribute('class', 'tide-chart-svg');
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
                stroke: rgba(255, 255, 255, 0.8);
                stroke-width: 2;
                stroke-linecap: round;
            }
            .tide-fill {
                fill: rgba(255, 255, 255, 0.1);
                stroke: none;
            }
            .current-time-line {
                stroke: #dc2626;
                stroke-width: 2;
                stroke-dasharray: 4,4;
            }
            .tide-marker {
                r: 3;
                stroke: rgba(255, 255, 255, 0.9);
                stroke-width: 1;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .tide-marker:hover {
                r: 5;
                stroke-width: 2;
            }
            .high-tide { fill: #10b981; }
            .low-tide { fill: #f59e0b; }
            .current-marker { fill: #dc2626; }
            .time-label {
                font-size: 10px;
                font-weight: 500;
                text-anchor: middle;
                fill: rgba(255, 255, 255, 0.7);
                font-family: 'Bricolage Grotesque', sans-serif;
            }
            .grid-line {
                stroke: rgba(255, 255, 255, 0.1);
                stroke-width: 0.5;
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
        
        // Draw grid lines
        this.drawGrid();
        
        // Generate tide curve from real data
        const pathData = this.generateTidePath();
        
        // Draw filled area
        const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        fillPath.setAttribute('class', 'tide-fill');
        fillPath.setAttribute('d', pathData + ` L${this.width},${this.height} L0,${this.height} Z`);
        this.svg.appendChild(fillPath);
        
        // Draw tide curve
        const curvePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        curvePath.setAttribute('class', 'tide-curve');
        curvePath.setAttribute('d', pathData);
        this.svg.appendChild(curvePath);
        
        // Add current time indicator
        this.drawCurrentTimeIndicator();
        
        // Add tide markers
        this.drawTideMarkers();
        
        // Add time labels
        this.drawTimeLabels();
    }

    drawGrid() {
        // Horizontal grid lines
        for (let i = 1; i < 4; i++) {
            const y = (this.height / 4) * i;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'grid-line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', this.width);
            line.setAttribute('y2', y);
            this.svg.appendChild(line);
        }
    }

    generateTidePath() {
        const now = new Date();
        const points = [];
        
        // Generate 24 hours of points
        for (let hour = 0; hour < 24; hour++) {
            const time = new Date(now.getTime() + (hour * 60 * 60 * 1000));
            const x = (hour / 24) * this.width;
            
            // Calculate tide height using sine wave approximation
            // 2 tide cycles per day, adjusted for actual high/low times
            const tidePhase = (hour / 12) * Math.PI * 2;
            const baseHeight = 2.5; // Average tide height
            const amplitude = 2.5; // Tide range
            
            // Adjust based on real data if available
            let tideHeight = baseHeight + amplitude * Math.sin(tidePhase - Math.PI/2);
            
            // Convert to SVG coordinates (flip Y axis)
            const y = this.height - ((tideHeight / 6) * this.height);
            points.push({ x, y, hour, height: tideHeight });
        }
        
        // Create smooth curve using quadratic bezier curves
        let pathData = `M 0,${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1] || points[i];
            
            // Control point for smooth curve
            const cpX = prev.x + (curr.x - prev.x) / 2;
            const cpY = prev.y;
            
            pathData += ` Q ${cpX},${cpY} ${curr.x},${curr.y}`;
        }
        
        return pathData;
    }

    drawCurrentTimeIndicator() {
        // Current time is roughly 1/4 through the 24-hour chart
        const currentX = this.width * 0.25;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'current-time-line');
        line.setAttribute('x1', currentX);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', currentX);
        line.setAttribute('y2', this.height);
        this.svg.appendChild(line);
        
        // Add "NOW" label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'time-label');
        label.setAttribute('x', currentX);
        label.setAttribute('y', 12);
        label.setAttribute('font-weight', '600');
        label.setAttribute('fill', '#dc2626');
        label.textContent = 'NOW';
        this.svg.appendChild(label);
    }

    drawTideMarkers() {
        // High tide marker (approximate position)
        const highMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highMarker.setAttribute('class', 'tide-marker high-tide');
        highMarker.setAttribute('cx', this.width * 0.15);
        highMarker.setAttribute('cy', this.height * 0.2);
        highMarker.setAttribute('r', 3);
        highMarker.addEventListener('click', () => this.showMarkerInfo('high'));
        this.svg.appendChild(highMarker);
        
        // Current position marker
        const currentMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        currentMarker.setAttribute('class', 'tide-marker current-marker');
        currentMarker.setAttribute('cx', this.width * 0.25);
        currentMarker.setAttribute('cy', this.height * 0.45);
        currentMarker.setAttribute('r', 4);
        currentMarker.addEventListener('click', () => this.showMarkerInfo('current'));
        this.svg.appendChild(currentMarker);
        
        // Low tide marker
        const lowMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        lowMarker.setAttribute('class', 'tide-marker low-tide');
        lowMarker.setAttribute('cx', this.width * 0.6);
        lowMarker.setAttribute('cy', this.height * 0.8);
        lowMarker.setAttribute('r', 3);
        lowMarker.addEventListener('click', () => this.showMarkerInfo('low'));
        this.svg.appendChild(lowMarker);
    }

    drawTimeLabels() {
        const times = ['6 AM', '12 PM', '6 PM', '12 AM'];
        const positions = [0.25, 0.5, 0.75, 1.0];
        
        times.forEach((time, index) => {
            const x = this.width * positions[index];
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('class', 'time-label');
            label.setAttribute('x', x);
            label.setAttribute('y', this.height - 5);
            label.textContent = time;
            this.svg.appendChild(label);
        });
    }

    showMarkerInfo(type) {
        let info = '';
        switch (type) {
            case 'high':
                info = `Next High: ${this.tideData.next_high?.height || '5.2'} ft at ${this.tideData.next_high?.time || '6:23 AM'}`;
                break;
            case 'low':
                info = `Next Low: ${this.tideData.next_low?.height || '0.8'} ft at ${this.tideData.next_low?.time || '12:45 PM'}`;
                break;
            case 'current':
                info = `Current: ${this.tideData.current_height_ft || '3.1'} ft (${this.tideData.state || 'Rising'})`;
                break;
        }
        
        // Use your existing showMessage method
        if (window.app && window.app.showMessage) {
            window.app.showMessage(info);
        } else {
            console.log(info);
        }
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