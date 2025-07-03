// Wave Height Visualizer with solid color
function updateWaveHeightVisual(waveHeight) {
    const waveHeightBg = document.getElementById('waveHeightBg');
    // console.log('Updating wave height visual with height:', waveHeightBg, waveHeight);
    if (!waveHeightBg) return;
    
    // Historical range for St. Augustine (approximate)
    const minHeight = 0.5;
    const maxHeight = 12;
    
    // Calculate percentage of historical range
    const percentage = Math.min(Math.max((waveHeight - minHeight) / (maxHeight - minHeight), 0), 1);
    
    // Solid color based on wave height with opacity
    const color = '0, 0, 0'; // Black for all wave heights
    const opacity = 0.1 + (percentage * 0.4); // Scale opacity from 0.1 to 0.5
    
    // Solid color that fills from bottom based on wave height
    const fillHeight = Math.max(10, percentage);
    waveHeightBg.style.background = `
        linear-gradient(to bottom, 
            white 0%, 
            white calc(${100 - fillHeight}% - 0.5px), 
            black calc(${100 - fillHeight}% - 0.5px), 
            black calc(${100 - fillHeight}% + 0.5px), 
            white calc(${100 - fillHeight}% + 0.5px), 
            white 100%)
    `;
}

// Wind Speed Visualizer using Wind Animation Web Component
function updateWindVisual(windSpeed, windDirection) {
    const container = document.getElementById('windLinesContainer');
    if (!container) return;
    
    // Clear existing content and old styles
    container.innerHTML = '';
    
    // Remove any existing dynamic styles for wind
    const existingWindStyles = document.querySelectorAll('style[data-animation^="windFlow_"]');
    existingWindStyles.forEach(style => style.remove());
    
    // Create wind animation element
    const windElement = document.createElement('wind-animation');
    
    // Calculate intensity based on wind speed
    const normalizedSpeed = Math.min(Math.max(windSpeed, 0), 40); // Clamp between 0-40 knots
    const intensity = 0.2 + (normalizedSpeed / 40) * 0.6; // Scale intensity from 0.2 to 0.8
    
    // Choose animation style based on wind speed
    const animationStyle = windSpeed > 15 ? "streamlines" : "particles";
    
    // Set attributes for the wind animation
    windElement.setAttribute('direction', windDirection);
    windElement.setAttribute('speed', windSpeed);
    windElement.setAttribute('intensity', intensity.toFixed(2));
    windElement.setAttribute('style', animationStyle);
    
    // Style the element to fill the container
    windElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    `;
    
    // Add to container
    container.appendChild(windElement);
    
    // Store reference for potential cleanup
    container._windAnimation = windElement;
}

// Wave Period Visualizer using Swell Animation Web Component
function updatePeriodVisual(period, swellDirection) {
    const container = document.getElementById('periodVisualContainer');
    if (!container) return;
    
    // Clear existing content and old styles
    container.innerHTML = '';
    
    // Remove any existing dynamic styles for period
    const existingPeriodStyles = document.querySelectorAll('style[data-animation^="periodFlow_"]');
    existingPeriodStyles.forEach(style => style.remove());
    
    // Create swell animation element
    const swellElement = document.createElement('swell-animation');
    
    // Calculate intensity based on period (longer periods = more organized swell = higher intensity)
    const normalizedPeriod = Math.min(Math.max(period, 3), 20); // Clamp between 3-20 seconds
    const intensity = 0.15 + ((normalizedPeriod - 3) / 17) * 0.25; // Scale intensity from 0.15 to 0.4
    
    // Set attributes for the swell animation
    swellElement.setAttribute('direction', swellDirection);
    swellElement.setAttribute('period', period);
    swellElement.setAttribute('speed', '1');
    swellElement.setAttribute('intensity', intensity.toFixed(2));
    
    // Style the element to fill the container
    swellElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    `;
    
    // Add to container
    container.appendChild(swellElement);
    
    // Store reference for potential cleanup
    container._swellAnimation = swellElement;
}

// Cleanup function for wind visual (if needed)
function cleanupWindVisual() {
    const container = document.getElementById('windLinesContainer');
    if (container && container._windAnimation) {
        container._windAnimation.disconnectedCallback();
        container._windAnimation = null;
    }
}

// Cleanup function for period visual (if needed)
function cleanupPeriodVisual() {
    const container = document.getElementById('periodVisualContainer');
    if (container && container._swellAnimation) {
        container._swellAnimation.disconnectedCallback();
        container._swellAnimation = null;
    }
}