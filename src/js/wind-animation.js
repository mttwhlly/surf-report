// Wind Animation Web Component for SURF LAB (Line-based like swell)
class WindAnimation extends HTMLElement {
  constructor() {
    super();
    this.canvas = null;
    this.ctx = null;
    this.lines = [];
    this.angleRad = 0;
    this.speed = 1;
    this.spacing = 3000;
    this.timeSinceLastLine = 0;
    this.animationId = null;
    this.isAnimating = false;

    // Bind methods to preserve 'this' context
    this.animate = this.animate.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  static get observedAttributes() {
    return ["direction", "speed", "intensity"];
  }

  connectedCallback() {
    this.createCanvas();
    this.updateFromAttributes();
    this.startAnimation();
    window.addEventListener("resize", this.handleResize);
  }

  disconnectedCallback() {
    this.stopAnimation();
    window.removeEventListener("resize", this.handleResize);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.updateFromAttributes();
    }
  }

  createCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.style.display = "block";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.borderRadius = "15px";
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.pointerEvents = "none";
    this.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.resizeCanvas();
  }

  updateFromAttributes() {
    const direction = parseFloat(this.getAttribute("direction")) || 0;
    const speed = parseFloat(this.getAttribute("speed")) || 5;
    const intensity = parseFloat(this.getAttribute("intensity")) || 0.3;

    // Convert wind direction to radians to match the arrow direction
    // Arrow shows wind direction, so lines should move perpendicular to that
    this.angleRad = ((direction + 90) * Math.PI) / 180;

    // Calculate speed based on canvas size and wind speed
    const maxDimension = Math.max(
      this.canvas?.width || 200,
      this.canvas?.height || 100
    );
    
    // Adjust speed calculation - faster animation for stronger winds
    this.speed = (maxDimension / 20) * (speed / 10) * 0.8;

    // Set spacing between lines based on wind speed (closer spacing for stronger winds)
    this.spacing = Math.max(3000 - (speed * 80), 1000);

    // Store intensity for rendering
    this.intensity = Math.min(Math.max(intensity, 0.1), 0.8);

    // Reset lines to apply new settings
    this.lines = [];
    this.timeSinceLastLine = 0;
    this.createLineAtOffset(0);
  }

  resizeCanvas() {
    if (!this.canvas) return;

    const rect = this.getBoundingClientRect();
    const width = rect.width || 200;
    const height = rect.height || 100;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.scale(dpr, dpr);

    // Update internal dimensions
    this.canvasWidth = width;
    this.canvasHeight = height;

    // Update speed calculation when canvas size changes
    this.updateFromAttributes();
  }

  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.resizeCanvas();
    }, 100);
  }

  createLineAtOffset(offsetMultiplier = 1) {
    if (!this.canvas) return;

    const margin = Math.max(this.canvasWidth || 200, this.canvasHeight || 100);
    const centerX = (this.canvasWidth || 200) / 2;
    const centerY = (this.canvasHeight || 100) / 2;

    const offsetX = Math.cos(this.angleRad + Math.PI) * margin * offsetMultiplier;
    const offsetY = Math.sin(this.angleRad + Math.PI) * margin * offsetMultiplier;

    this.lines.push({
      x: centerX + offsetX,
      y: centerY + offsetY,
      opacity: this.intensity
    });
  }

  animate(timestamp) {
    if (!this.isAnimating || !this.ctx) return;

    const width = this.canvasWidth || 200;
    const height = this.canvasHeight || 100;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw and update lines
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      // Calculate line length based on container size
      const lineLength = Math.min(width, height) * 1.2;
      const dx = Math.cos(this.angleRad + Math.PI / 2) * lineLength;
      const dy = Math.sin(this.angleRad + Math.PI / 2) * lineLength;

      // Set line style with varying opacity based on position
      const fadeDistance = Math.max(width, height) * 0.6;
      const distanceFromCenter = Math.sqrt(
        Math.pow(line.x - width / 2, 2) + Math.pow(line.y - height / 2, 2)
      );
      const fadeFactor = Math.max(0, 1 - (distanceFromCenter / fadeDistance));
      const opacity = line.opacity * fadeFactor;

      this.ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.lineCap = "round";

      this.ctx.beginPath();
      this.ctx.moveTo(line.x - dx, line.y - dy);
      this.ctx.lineTo(line.x + dx, line.y + dy);
      this.ctx.stroke();

      // Move line forward
      line.x += Math.cos(this.angleRad) * this.speed;
      line.y += Math.sin(this.angleRad) * this.speed;
    }

    // Clean up offscreen lines
    const margin = Math.max(width, height);
    this.lines = this.lines.filter(
      (line) =>
        line.x >= -margin &&
        line.x <= width + margin &&
        line.y >= -margin &&
        line.y <= height + margin
    );

    // Add new lines based on timing
    if (!this.animate.lastTime) this.animate.lastTime = timestamp;
    const delta = timestamp - this.animate.lastTime;
    this.timeSinceLastLine += delta;

    while (this.timeSinceLastLine >= this.spacing && this.lines.length < 8) {
      this.createLineAtOffset(1);
      this.timeSinceLastLine -= this.spacing;
    }

    this.animate.lastTime = timestamp;
    this.animationId = requestAnimationFrame(this.animate);
  }

  startAnimation() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animationId = requestAnimationFrame(this.animate);
    }
  }

  stopAnimation() {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // Method to update wind parameters (called from main app)
  updateWind(direction, speed, intensity = 0.3) {
    this.setAttribute("direction", direction);
    this.setAttribute("speed", speed);
    this.setAttribute("intensity", intensity);
  }
}

// Register the custom element
customElements.define("wind-animation", WindAnimation);