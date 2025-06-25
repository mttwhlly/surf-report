// Visual effects for surf condition detail cards

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

// Wind Speed Visualizer with directional animation
function updateWindVisual(windSpeed, windDirection) {
    const container = document.getElementById('windLinesContainer');
    if (!container) return;
    
    // Clear existing lines
    container.innerHTML = '';
    
    // Calculate number of lines based on wind speed
    const numLines = Math.min(Math.max(Math.floor(windSpeed / 3), 1), 8);
    
    // Calculate animation speed based on wind speed
    const animationDuration = Math.max(0.8, 4 - (windSpeed / 8));
    
    // Use the SAME direction as the arrow - where wind is coming FROM
    const windFromDirection = (windDirection + 180) % 360;
    
    // Calculate movement vector based on direction
    const radians = (windFromDirection - 90) * (Math.PI / 180);
    const distance = 300; // Movement distance
    const deltaX = Math.cos(radians) * distance;
    const deltaY = Math.sin(radians) * distance;
    
    for (let i = 0; i < numLines; i++) {
        const line = document.createElement('div');
        line.className = 'wind-line';
        
        // Lines span full card with rotation
        const height = 2; // Fixed height
        const width = 200; // Full span width
        const startTop = Math.random() * 120 - 10; // Start outside container
        const startLeft = Math.random() * 120 - 10; // Start outside container
        const delay = Math.random() * animationDuration;
        
        // Create keyframe animation for this specific direction
        const animationName = `windFlow_${windFromDirection.toFixed(0)}`;
        
        // Check if this animation already exists, if not create it
        if (!document.querySelector(`style[data-animation="${animationName}"]`)) {
            const style = document.createElement('style');
            style.setAttribute('data-animation', animationName);
            style.textContent = `
                @keyframes ${animationName} {
                    0% { 
                        transform: rotate(${windFromDirection}deg) translate(0px, 0px);
                        opacity: 0; 
                    }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { 
                        transform: rotate(${windFromDirection}deg) translate(${deltaX}px, ${deltaY}px);
                        opacity: 0; 
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        line.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            top: ${startTop}%;
            left: ${startLeft}%;
            transform-origin: center;
            animation: ${animationName} ${animationDuration}s linear infinite;
            animation-delay: ${delay}s;
            opacity: ${0.2 + (windSpeed / 30) * 0.3};
        `;
        
        container.appendChild(line);
    }
}

// Wave Period Visualizer with directional waves
function updatePeriodVisual(period, swellDirection) {
    const container = document.getElementById('periodVisualContainer');
    if (!container) return;
    
    // Clear existing waves
    container.innerHTML = '';
    
    // Create period waves that move in swell direction
    const numWaves = Math.min(Math.max(Math.floor(12 / period), 2), 6);
    
    // Use the SAME direction as the arrow - where swell is coming FROM
    const swellFromDirection = (swellDirection + 180) % 360;
    
    // Calculate movement vector based on direction
    const radians = (swellFromDirection - 90) * (Math.PI / 180);
    const distance = 200; // Movement distance
    const deltaX = Math.cos(radians) * distance;
    const deltaY = Math.sin(radians) * distance;
    
    for (let i = 0; i < numWaves; i++) {
        const wave = document.createElement('div');
        wave.className = 'period-wave';
        
        // Waves span full card with rotation
        const width = 180; // Full span width
        const height = 3; // Slightly thicker for waves
        const startTop = Math.random() * 120 - 10; // Start outside container
        const startLeft = Math.random() * 120 - 10; // Start outside container
        const delay = i * (period / numWaves);
        
        // Create keyframe animation for this specific direction
        const animationName = `periodFlow_${swellFromDirection.toFixed(0)}`;
        
        // Check if this animation already exists, if not create it
        if (!document.querySelector(`style[data-animation="${animationName}"]`)) {
            const style = document.createElement('style');
            style.setAttribute('data-animation', animationName);
            style.textContent = `
                @keyframes ${animationName} {
                    0% { 
                        transform: rotate(${swellFromDirection}deg) translate(0px, 0px) scaleX(1);
                        opacity: 0.3; 
                    }
                    50% { 
                        transform: rotate(${swellFromDirection}deg) translate(${deltaX * 0.5}px, ${deltaY * 0.5}px) scaleX(1.2);
                        opacity: 0.8; 
                    }
                    100% { 
                        transform: rotate(${swellFromDirection}deg) translate(${deltaX}px, ${deltaY}px) scaleX(1);
                        opacity: 0.3; 
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        wave.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            top: ${startTop}%;
            left: ${startLeft}%;
            transform-origin: center;
            animation: ${animationName} ${period}s ease-in-out infinite;
            animation-delay: ${delay}s;
        `;
        
        container.appendChild(wave);
    }
}