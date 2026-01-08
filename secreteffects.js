// File type: Client-side JavaScript (for GitHub Pages)
// Path: /secreteffects.js

// Debug warning: Rarity-specific visual effects (particles, glows, borders)
// Now respects performance mode - skips effects when density is high

// ===========================
// Performance Mode State
// ===========================
let performanceModeActive = false;

// ===========================
// Set Performance Mode
// ===========================
function setPerformanceMode(enabled) {
  performanceModeActive = enabled;
  console.log('[SecretEffects] Performance mode:', enabled ? 'ENABLED (effects disabled)' : 'DISABLED (effects enabled)');
  
  // If disabling effects, remove all existing effects
  if (enabled) {
    removeAllEffects();
  }
}

// ===========================
// Remove All Effects
// ===========================
function removeAllEffects() {
  // Remove all particle containers
  const particles = document.querySelectorAll('.secret-particles');
  particles.forEach(el => el.remove());
  
  // Remove all glow effects
  const glows = document.querySelectorAll('.pet-image-glow');
  glows.forEach(el => el.classList.remove('pet-image-glow'));
  
  // Remove animated borders
  const borders = document.querySelectorAll('.animated-border');
  borders.forEach(el => el.classList.remove('animated-border'));
  
  console.log('[SecretEffects] All effects removed');
}

// ===========================
// Initialize Secret Effects
// ===========================
function initSecretEffects() {
  // Skip if performance mode is active
  if (performanceModeActive) {
    console.log('[SecretEffects] Skipped - performance mode active');
    return;
  }
  
  applySecretEffects();
}

// ===========================
// Apply Effects to Cards
// ===========================
function applySecretEffects() {
  // Skip if performance mode is active
  if (performanceModeActive) {
    return;
  }
  
  // Get all pet cards
  const petCards = document.querySelectorAll('.pet-card');
  
  petCards.forEach(card => {
    // Get rarity from card
    const rarityBadge = card.querySelector('.pet-rarity');
    if (!rarityBadge) return;
    
    const rarity = rarityBadge.textContent.trim();
    
    // Apply effects based on rarity
    switch(rarity) {
      case 'Secret II':
        applySecretIIEffects(card);
        break;
      case 'Secret III':
        applySecretIIIEffects(card);
        break;
      case 'Leaderboard':
        applyLeaderboardEffects(card);
        break;
      case 'Exclusive':
        applyExclusiveEffects(card);
        break;
      // Secret I and Mythical get no special effects
      default:
        break;
    }
  });
  
  console.log('[SecretEffects] Applied to', petCards.length, 'cards');
}

// ===========================
// Secret II Effects (Orange particles + glow)
// ===========================
function applySecretIIEffects(card) {
  // Add glow to image
  const image = card.querySelector('.pet-image');
  if (image) {
    image.classList.add('pet-image-glow');
    image.style.setProperty('--glow-color', 'rgba(255, 140, 0, 0.6)');
  }
  
  // Add floating particles
  addParticles(card, 'rgba(255, 140, 0, 0.8)', 8);
}

// ===========================
// Secret III Effects (Purple particles + strong glow)
// ===========================
function applySecretIIIEffects(card) {
  // Add strong glow to image
  const image = card.querySelector('.pet-image');
  if (image) {
    image.classList.add('pet-image-glow', 'glow-strong');
    image.style.setProperty('--glow-color', 'rgba(138, 43, 226, 0.8)');
  }
  
  // Add more particles
  addParticles(card, 'rgba(138, 43, 226, 0.9)', 12);
  
  // Add animated border
  card.classList.add('animated-border');
  card.style.setProperty('--border-color', '#8a2be2');
}

// ===========================
// Leaderboard Effects (Gold particles + gold glow)
// ===========================
function applyLeaderboardEffects(card) {
  // Add gold glow to image
  const image = card.querySelector('.pet-image');
  if (image) {
    image.classList.add('pet-image-glow', 'glow-strong');
    image.style.setProperty('--glow-color', 'rgba(255, 215, 0, 0.8)');
  }
  
  // Add gold particles
  addParticles(card, 'rgba(255, 215, 0, 0.9)', 15);
  
  // Add animated border
  card.classList.add('animated-border');
  card.style.setProperty('--border-color', '#ffd700');
}

// ===========================
// Exclusive Effects (Green particles + green glow)
// ===========================
function applyExclusiveEffects(card) {
  // Add green glow to image
  const image = card.querySelector('.pet-image');
  if (image) {
    image.classList.add('pet-image-glow');
    image.style.setProperty('--glow-color', 'rgba(0, 255, 127, 0.7)');
  }
  
  // Add green particles
  addParticles(card, 'rgba(0, 255, 127, 0.9)', 10);
  
  // Add animated border
  card.classList.add('animated-border');
  card.style.setProperty('--border-color', '#00ff7f');
}

// ===========================
// Add Floating Particles
// ===========================
function addParticles(card, color, count) {
  // Check if particles already exist
  if (card.querySelector('.secret-particles')) {
    return;
  }
  
  // Create particle container
  const particleContainer = document.createElement('div');
  particleContainer.className = 'secret-particles';
  particleContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
    z-index: 1;
  `;
  
  // Create individual particles
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: ${color};
      border-radius: 50%;
      bottom: -10px;
      left: ${Math.random() * 100}%;
      animation: float-up ${2 + Math.random() * 3}s linear infinite;
      animation-delay: ${Math.random() * 2}s;
      opacity: 0;
    `;
    particleContainer.appendChild(particle);
  }
  
  card.style.position = 'relative';
  card.appendChild(particleContainer);
}

// ===========================
// Refresh Effects (called after re-render)
// ===========================
function refreshSecretEffects() {
  // Skip if performance mode is active
  if (performanceModeActive) {
    console.log('[SecretEffects] Refresh skipped - performance mode active');
    return;
  }
  
  // Remove old effects
  removeAllEffects();
  
  // Reapply effects
  applySecretEffects();
}

// ===========================
// Add CSS Animations
// ===========================
function addEffectStyles() {
  // Check if styles already exist
  if (document.getElementById('secret-effects-styles')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'secret-effects-styles';
  style.textContent = `
    /* Floating particle animation */
    @keyframes float-up {
      0% {
        transform: translateY(0) translateX(0);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateY(-300px) translateX(${Math.random() * 40 - 20}px);
        opacity: 0;
      }
    }
    
    /* Image glow effect */
    .pet-image-glow {
      filter: drop-shadow(0 0 10px var(--glow-color, rgba(255, 255, 255, 0.5)));
      animation: pulse-glow 2s ease-in-out infinite;
    }
    
    .pet-image-glow.glow-strong {
      filter: drop-shadow(0 0 20px var(--glow-color, rgba(255, 255, 255, 0.8)));
    }
    
    @keyframes pulse-glow {
      0%, 100% {
        filter: drop-shadow(0 0 10px var(--glow-color, rgba(255, 255, 255, 0.5)));
      }
      50% {
        filter: drop-shadow(0 0 20px var(--glow-color, rgba(255, 255, 255, 0.8)));
      }
    }
    
    /* Animated border */
    .animated-border {
      position: relative;
      border: 2px solid var(--border-color, #fff);
      animation: border-pulse 2s ease-in-out infinite;
    }
    
    @keyframes border-pulse {
      0%, 100% {
        border-color: var(--border-color, #fff);
        box-shadow: 0 0 5px var(--border-color, #fff);
      }
      50% {
        border-color: var(--border-color, #fff);
        box-shadow: 0 0 20px var(--border-color, #fff);
      }
    }
    
    /* Disable all effects in performance mode */
    .performance-mode .secret-particles,
    .performance-mode .pet-image-glow,
    .performance-mode .animated-border {
      display: none !important;
      animation: none !important;
      filter: none !important;
      border: none !important;
      box-shadow: none !important;
    }
  `;
  
  document.head.appendChild(style);
}

// ===========================
// Initialize on Load
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  addEffectStyles();
  initSecretEffects();
});

// ===========================
// Export Functions
// ===========================
window.SecretEffects = {
  init: initSecretEffects,
  refresh: refreshSecretEffects,
  setPerformanceMode: setPerformanceMode
};

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /secreteffects.js
