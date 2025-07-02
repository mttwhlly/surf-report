// Visual effects for surf condition detail cards - FIXED VERSION

// Wave Height Visualizer with solid color
function updateWaveHeightVisual(waveHeight) {
    const waveHeightBg = document.getElementById('waveHeightBg');
    if (!waveHeightBg) return;
    
    // Historical range for St. Augustine (approximate)
    const minHeight = 0.5;
    const maxHeight = 12;
    
    // Calculate percentage of historical range
    const percentage = Math.min(Math.max((waveHeight - minHeight) / (maxHeight - minHeight), 0), 1);
    
    // Solid color based on wave height with opacity
    let color, opacity;
    
    if (percentage < 0.25) {
        color = '59, 130, 246'; // Blue for small waves
        opacity = 0.1 + (percentage * 0.4);
    } else if (percentage < 0.5) {
        color = '76, 175, 80'; // Green for medium waves
        opacity = 0.15 + (percentage * 0.4);
    } else if (percentage < 0.75) {
        color = '255, 152, 0'; // Orange for large waves
        opacity = 0.2 + (percentage * 0.4);
    } else {
        color = '244, 67, 54'; // Red for huge waves
        opacity = 0.25 + (percentage * 0.4);
    }
    
    // Solid color that fills from bottom based on wave height
    const fillHeight = Math.max(10, percentage * 100);
    waveHeightBg.style.background = `linear-gradient(to top, 
        rgba(${color}, ${opacity}) 0%, 
        rgba(${color}, ${opacity}) ${fillHeight}%, 
        transparent ${fillHeight}%, 
        transparent 100%)`;
}

// Wind Speed Visualizer with directional animation - FIXED
function updateWindVisual(windSpeed, windDirection) {
    const container = document.getElementById('windLinesContainer');
    if (!container) return;
    
    // Clear existing lines and styles
    container.innerHTML = '';
    
    // Remove any existing dynamic styles for wind
    const existingWindStyles = document.querySelectorAll('style[data-animation^="windFlow_"]');
    existingWindStyles.forEach(style => style.remove());
    
    // Calculate number of lines based on wind speed
    const numLines = Math.min(Math.max(Math.floor(windSpeed / 3), 1), 8);
    
    // Calculate animation speed based on wind speed
    const animationDuration = Math.max(0.8, 4 - (windSpeed / 8));
    
    // Use the SAME direction as the arrow - where wind is coming FROM
    const windFromDirection = (windDirection + 180) % 360;
    
    // Create a single animation that moves within container bounds
    const animationName = `windFlow_${windFromDirection.toFixed(0)}`;
    
    // Create constrained movement - keep lines within container
    const style = document.createElement('style');
    style.setAttribute('data-animation', animationName);
    
    // Calculate movement that stays within bounds
    const containerWidth = 100; // percentage based
    const containerHeight = 100; // percentage based
    
    // Simplified directional movement - horizontal flow based on wind direction
    let startX, endX, startY, endY;
    
    if (windFromDirection >= 315 || windFromDirection < 45) {
        // North wind - left to right
        startX = -20; startY = 20; endX = 120; endY = 80;
    } else if (windFromDirection >= 45 && windFromDirection < 135) {
        // East wind - top to bottom  
        startX = 20; startY = -20; endX = 80; endY = 120;
    } else if (windFromDirection >= 135 && windFromDirection < 225) {
        // South wind - right to left
        startX = 120; startY = 80; endX = -20; endY = 20;
    } else {
        // West wind - bottom to top
        startX = 80; startY = 120; endX = 20; endY = -20;
    }
    
    style.textContent = `
        @keyframes ${animationName} {
            0% { 
                left: ${startX}%;
                top: ${startY}%;
                opacity: 0; 
            }
            10% { opacity: 0.8; }
            90% { opacity: 0.8; }
            100% { 
                left: ${endX}%;
                top: ${endY}%;
                opacity: 0; 
            }
        }
    `;
    document.head.appendChild(style);
    
    for (let i = 0; i < numLines; i++) {
        const line = document.createElement('div');
        line.className = 'wind-line';
        
        // Fixed dimensions for consistency
        const height = 2;
        const width = Math.random() * 30 + 40; // 40-70px width
        const delay = Math.random() * animationDuration;
        
        line.style.cssText = `
            position: absolute;
            width: ${width}px;
            height: ${height}px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 1px;
            animation: ${animationName} ${animationDuration}s linear infinite;
            animation-delay: ${delay}s;
            opacity: ${0.2 + (windSpeed / 30) * 0.3};
        `;
        
        container.appendChild(line);
    }
}

// Wave Period Visualizer with directional waves - FIXED
function updatePeriodVisual(period, swellDirection) {
    const container = document.getElementById('periodVisualContainer');
    if (!container) return;
    
    // Clear existing waves and styles
    container.innerHTML = '';
    
    // Remove any existing dynamic styles for period
    const existingPeriodStyles = document.querySelectorAll('style[data-animation^="periodFlow_"]');
    existingPeriodStyles.forEach(style => style.remove());
    
    // Create period waves that move in swell direction
    const numWaves = Math.min(Math.max(Math.floor(12 / period), 2), 6);
    
    // Use the SAME direction as the arrow - where swell is coming FROM
    const swellFromDirection = (swellDirection + 180) % 360;
    
    const animationName = `periodFlow_${swellFromDirection.toFixed(0)}`;
    
    // Create constrained movement for waves
    const style = document.createElement('style');
    style.setAttribute('data-animation', animationName);
    
    // Calculate wave movement that stays within bounds
    let startX, endX, startY, endY;
    
    if (swellFromDirection >= 315 || swellFromDirection < 45) {
        // North swell - top to bottom
        startX = 20; startY = -10; endX = 80; endY = 110;
    } else if (swellFromDirection >= 45 && swellFromDirection < 135) {
        // East swell - left to right
        startX = -10; startY = 20; endX = 110; endY = 80;
    } else if (swellFromDirection >= 135 && swellFromDirection < 225) {
        // South swell - bottom to top
        startX = 80; startY = 110; endX = 20; endY = -10;
    } else {
        // West swell - right to left
        startX = 110; startY = 80; endX = -10; endY = 20;
    }
    
    style.textContent = `
        @keyframes ${animationName} {
            0% { 
                left: ${startX}%;
                top: ${startY}%;
                opacity: 0.3;
                transform: scaleX(1);
            }
            50% { 
                left: ${(startX + endX) / 2}%;
                top: ${(startY + endY) / 2}%;
                opacity: 0.8;
                transform: scaleX(1.2);
            }
            100% { 
                left: ${endX}%;
                top: ${endY}%;
                opacity: 0.3;
                transform: scaleX(1);
            }
        }
    `;
    document.head.appendChild(style);
    
    for (let i = 0; i < numWaves; i++) {
        const wave = document.createElement('div');
        wave.className = 'period-wave';
        
        // Fixed dimensions
        const width = Math.random() * 40 + 60; // 60-100px width
        const height = 3;
        const delay = i * (period / numWaves);
        
        wave.style.cssText = `
            position: absolute;
            width: ${width}px;
            height: ${height}px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 1px;
            animation: ${animationName} ${period}s ease-in-out infinite;
            animation-delay: ${delay}s;
        `;
        
        container.appendChild(wave);
    }
}