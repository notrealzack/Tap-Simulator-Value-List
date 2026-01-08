// File type: Client-side JavaScript (for GitHub Pages)
// Path: /petcardeffects.js

// Debug warning: Floating ball effects with proper visibility management
// Balls pause when page hidden and resume when visible

// Effect Configuration per Rarity
const rarityEffectConfig = {
  "Mythical": { ballCount: 2, ballColor: "var(--rarity-mythical)", speedMultiplier: 1.0 },
  "Secret I": { ballCount: 4, ballColor: "var(--rarity-secret-i)", speedMultiplier: 1.0 },
  "Secret II": { ballCount: 6, ballColor: "var(--rarity-secret-ii)", speedMultiplier: 1.0 },
  "Secret III": { ballCount: 8, ballColor: "var(--rarity-secret-iii)", speedMultiplier: 1.0 },
  "Leaderboard": { ballCount: 7, ballColor: "var(--rarity-leaderboard)", speedMultiplier: 1.0 },
  "Exclusive": { ballCount: 5, ballColor: "var(--rarity-exclusive)", speedMultiplier: 1.0 }
};

// Intersection Observer for viewport detection
let viewportObserver = null;
const activeCardAnimations = new Map();

// NEW: Page visibility state
let isPageVisible = true;

// Ball Physics System
class Ball {
  constructor(card, container, color, speedMultiplier) {
    this.card = card;
    this.container = container;
    this.color = color;
    this.speedMultiplier = speedMultiplier;
    
    const rect = container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    
    this.radius = 1 + Math.random() * 1; // 1-2px radius
    
    // Random position
    this.x = Math.random() * this.width;
    this.y = Math.random() * this.height;
    
    // Random velocity
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 0.3 + 0.2) * speedMultiplier;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    this.opacity = 0;
    this.targetOpacity = 0.25 + Math.random() * 0.15;
    this.spawning = true;
    this.despawning = false;
    
    this.lifetime = 20000; // 20 seconds
    this.age = 0;
    
    this.createElement();
  }
  
  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'pet-card-ball';
    this.element.style.cssText = `
      position: absolute;
      width: ${this.radius * 2}px;
      height: ${this.radius * 2}px;
      background-color: ${this.color};
      border-radius: 50%;
      opacity: 0;
      pointer-events: none;
      box-shadow: 0 0 ${this.radius * 3}px ${this.color};
      z-index: 0;
      will-change: transform, opacity;
    `;
    this.container.appendChild(this.element);
    this.updatePosition();
  }
  
  updatePosition() {
    this.element.style.left = `${this.x - this.radius}px`;
    this.element.style.top = `${this.y - this.radius}px`;
    this.element.style.opacity = this.opacity;
  }
  
  update(deltaTime) {
    this.age += deltaTime;
    
    // Handle spawning fade in
    if (this.spawning) {
      this.opacity += deltaTime * 0.0008;
      if (this.opacity >= this.targetOpacity) {
        this.opacity = this.targetOpacity;
        this.spawning = false;
      }
    }
    
    // Check if should start despawning
    if (this.age >= this.lifetime - 800 && !this.despawning) {
      this.despawning = true;
    }
    
    // Handle despawning fade out
    if (this.despawning) {
      this.opacity -= deltaTime * 0.0008;
      if (this.opacity <= 0) {
        this.opacity = 0;
        return false; // Signal removal
      }
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off edges
    if (this.x <= 0 || this.x >= this.width) {
      this.vx *= -1;
      this.x = Math.max(0, Math.min(this.width, this.x));
    }
    
    if (this.y <= 0 || this.y >= this.height) {
      this.vy *= -1;
      this.y = Math.max(0, Math.min(this.height, this.y));
    }
    
    this.updatePosition();
    return true; // Continue living
  }
  
  destroy() {
    if (this.element && this.element.parentElement) {
      this.element.remove();
    }
  }
}

// Animation Loop for Card
class CardAnimationLoop {
  constructor(card, config) {
    this.card = card;
    this.config = config;
    this.balls = [];
    this.animationId = null;
    this.lastTime = performance.now();
    this.container = null;
    this.isPaused = false; // NEW: Track pause state
    
    this.setup();
    this.start();
  }
  
  setup() {
    // Create or get container
    this.container = this.card.querySelector('.pet-card-ball-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'pet-card-ball-container';
      this.container.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        border-radius: inherit;
        z-index: 0;
      `;
      this.card.insertBefore(this.container, this.card.firstChild);
    }
    
    // Ensure card content is above balls
    const cardChildren = Array.from(this.card.children);
    cardChildren.forEach(child => {
      if (child !== this.container) {
        if (!child.style.position || child.style.position === 'static') {
          child.style.position = 'relative';
        }
        child.style.zIndex = '1';
      }
    });
    
    // Create initial balls with staggered spawn
    for (let i = 0; i < this.config.ballCount; i++) {
      setTimeout(() => {
        if (this.container.parentElement) {
          const ball = new Ball(
            this.card,
            this.container,
            this.config.ballColor,
            this.config.speedMultiplier
          );
          this.balls.push(ball);
        }
      }, i * 400);
    }
  }
  
  start() {
    this.lastTime = performance.now();
    this.animate();
  }
  
  animate = () => {
    // NEW: Don't update if paused (page hidden)
    if (this.isPaused) {
      this.animationId = requestAnimationFrame(this.animate);
      return;
    }
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update all balls
    this.balls = this.balls.filter(ball => ball.update(deltaTime));
    
    // Respawn balls that were removed
    while (this.balls.length < this.config.ballCount) {
      const ball = new Ball(
        this.card,
        this.container,
        this.config.ballColor,
        this.config.speedMultiplier
      );
      this.balls.push(ball);
    }
    
    // Continue animation
    this.animationId = requestAnimationFrame(this.animate);
  }
  
  // NEW: Pause method
  pause() {
    this.isPaused = true;
  }
  
  // NEW: Resume method
  resume() {
    this.isPaused = false;
    this.lastTime = performance.now(); // Reset time to avoid huge deltaTime jump
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Destroy all balls
    this.balls.forEach(ball => ball.destroy());
    this.balls = [];
    
    // Remove container
    if (this.container && this.container.parentElement) {
      this.container.remove();
    }
  }
}

// Start Card Animations when in viewport
function startCardAnimations(card) {
  if (activeCardAnimations.has(card)) return; // Already running
  
  const rarityBadge = card.querySelector('.pet-rarity');
  if (!rarityBadge) return;
  
  const rarityText = rarityBadge.textContent.trim();
  const config = rarityEffectConfig[rarityText];
  if (!config) return;
  
  // Create animation loop
  const loop = new CardAnimationLoop(card, config);
  activeCardAnimations.set(card, loop);
  
  console.log('[PetCardEffects] Started animations for card:', rarityText);
}

// Stop Card Animations when out of viewport
function stopCardAnimations(card) {
  const loop = activeCardAnimations.get(card);
  if (!loop) return;
  
  loop.stop();
  activeCardAnimations.delete(card);
  
  console.log('[PetCardEffects] Stopped animations for card');
}

// Setup Viewport Observer
function setupViewportObserver() {
  if (viewportObserver) {
    viewportObserver.disconnect();
  }
  
  viewportObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && isPageVisible) {
        startCardAnimations(entry.target);
      } else {
        stopCardAnimations(entry.target);
      }
    });
  }, {
    rootMargin: '100px',
    threshold: 0.1
  });
}

// NEW: Handle Page Visibility Changes
function handleVisibilityChange() {
  isPageVisible = !document.hidden;
  
  if (isPageVisible) {
    console.log('[PetCardEffects] Page visible - resuming animations');
    // Resume all active animations
    activeCardAnimations.forEach(loop => loop.resume());
  } else {
    console.log('[PetCardEffects] Page hidden - pausing animations');
    // Pause all active animations
    activeCardAnimations.forEach(loop => loop.pause());
  }
}

// Apply Effects to All Cards
function applyAllCardEffects() {
  if (!viewportObserver) {
    setupViewportObserver();
  }
  
  const petCards = document.querySelectorAll('.pet-card');
  
  petCards.forEach(card => {
    if (window.getComputedStyle(card).position === 'static') {
      card.style.position = 'relative';
    }
    viewportObserver.observe(card);
  });
  
  console.log('[PetCardEffects] Observing', petCards.length, 'cards for viewport entry');
}

// Remove All Effects
function removeAllCardEffects() {
  if (viewportObserver) {
    viewportObserver.disconnect();
  }
  
  // Stop all animation loops
  activeCardAnimations.forEach(loop => loop.stop());
  activeCardAnimations.clear();
  
  console.log('[PetCardEffects] Removed all card effects');
}

// Update Density - Restart effects for new card sizes
function updateDensity(density) {
  console.log('[PetCardEffects] Density updated, restarting effects...');
  
  setTimeout(() => {
    removeAllCardEffects();
    applyAllCardEffects();
  }, 200);
}

// Update Configuration
function updateRarityConfig(rarity, newConfig) {
  if (!rarityEffectConfig[rarity]) {
    console.warn(`[PetCardEffects] Rarity "${rarity}" not found in config`);
    return false;
  }
  
  rarityEffectConfig[rarity] = { ...rarityEffectConfig[rarity], ...newConfig };
  console.log('[PetCardEffects] Updated config for', rarity, ':', rarityEffectConfig[rarity]);
  
  removeAllCardEffects();
  applyAllCardEffects();
  
  return true;
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  setupViewportObserver();
  applyAllCardEffects();
  
  // NEW: Listen for page visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  console.log('[PetCardEffects] Initialized - matching particles.js style with visibility management');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  removeAllCardEffects();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

// Make Functions Globally Accessible
window.applyAllCardEffects = applyAllCardEffects;
window.removeAllCardEffects = removeAllCardEffects;
window.updateRarityConfig = updateRarityConfig;
window.updatePetCardDensity = updateDensity;
window.rarityEffectConfig = rarityEffectConfig;

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /petcardeffects.js
