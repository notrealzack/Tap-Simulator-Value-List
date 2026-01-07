// File type: Client-side JavaScript (for GitHub Pages)
// Path: /particles.js

// Debug warning: Particle system for background effect with floating movement (not falling)

(function() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) {
    console.warn('[DEBUG-WARNING] particles-canvas not found in DOM');
    return;
  }

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationFrameId = null;

  // Particle configuration
  const config = {
    particleCount: 60,
    particleSpeed: 0.3,
    particleSize: 2,
    particleColor: 'rgba(88, 101, 242, 0.3)',
    lineColor: 'rgba(88, 101, 242, 0.1)',
    lineDistance: 150
  };

  // Particle class
  class Particle {
    constructor() {
      this.reset();
      // Start particles at random positions on screen
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      
      // Random velocity in all directions for floating effect
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * config.particleSpeed + 0.2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      
      this.size = Math.random() * config.particleSize + 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges instead of resetting
      if (this.x < 0 || this.x > canvas.width) {
        this.vx *= -1;
        this.x = Math.max(0, Math.min(canvas.width, this.x));
      }
      
      if (this.y < 0 || this.y > canvas.height) {
        this.vy *= -1;
        this.y = Math.max(0, Math.min(canvas.height, this.y));
      }
    }

    draw() {
      ctx.fillStyle = config.particleColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Initialize particles
  function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(new Particle());
    }
  }

  // Draw lines between close particles
  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.lineDistance) {
          const opacity = (1 - distance / config.lineDistance) * 0.15;
          ctx.strokeStyle = `rgba(88, 101, 242, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });

    // Draw connecting lines
    connectParticles();

    // Debug warning: Using requestAnimationFrame for efficient rendering
    animationFrameId = requestAnimationFrame(animate);
  }

  // Resize canvas to match window size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
  });

  // Initialize
  resizeCanvas();
  initParticles();
  animate();

  // Debug warning: Cleanup on page unload to prevent memory leaks
  window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });
})();

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /particles.js
