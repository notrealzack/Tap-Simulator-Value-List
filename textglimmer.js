// File type: Client-side JavaScript (for GitHub Pages)
// Path: /textglimmer.js

// Debug warning: Text shimmer/glimmer effects for pet names and badges
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
  console.log('[TextGlimmer] Performance mode:', enabled ? 'ENABLED (effects disabled)' : 'DISABLED (effects enabled)');
  
  // If disabling effects, remove all existing glimmer spans
  if (enabled) {
    removeAllGlimmers();
  }
}

// ===========================
// Remove All Glimmer Effects
// ===========================
function removeAllGlimmers() {
  // Find all elements that have been glimmer-processed
  const glimmerElements = document.querySelectorAll('[data-glimmer-processed="true"]');
  
  glimmerElements.forEach(el => {
    // Get original text from data attribute or reconstruct from spans
    const originalText = el.getAttribute('data-original-text') || el.textContent;
    
    // Restore plain text
    el.textContent = originalText;
    el.removeAttribute('data-glimmer-processed');
  });
  
  console.log('[TextGlimmer] All glimmers removed');
}

// ===========================
// Initialize Text Glimmer
// ===========================
function initTextGlimmer() {
  // Skip if performance mode is active
  if (performanceModeActive) {
    console.log('[TextGlimmer] Skipped - performance mode active');
    return;
  }
  
  applyGlimmerEffects();
}

// ===========================
// Apply Glimmer to Elements
// ===========================
function applyGlimmerEffects() {
  // Skip if performance mode is active
  if (performanceModeActive) {
    return;
  }
  
  // Find all elements with data-glimmer attribute
  const glimmerElements = document.querySelectorAll('[data-glimmer]:not([data-glimmer-processed="true"])');
  
  glimmerElements.forEach(element => {
    const text = element.textContent;
    
    // Skip if already processed
    if (element.hasAttribute('data-glimmer-processed')) {
      return;
    }
    
    // Store original text
    element.setAttribute('data-original-text', text);
    
    // Split text into characters and wrap each in span
    const chars = text.split('');
    element.innerHTML = '';
    
    chars.forEach((char, index) => {
      const span = document.createElement('span');
      span.className = 'glimmer-char';
      span.textContent = char;
      
      // Add random animation delay for wave effect
      span.style.animationDelay = `${Math.random() * 1}s`;
      
      element.appendChild(span);
    });
    
    // Mark as processed
    element.setAttribute('data-glimmer-processed', 'true');
  });
  
  if (glimmerElements.length > 0) {
    console.log('[TextGlimmer] Applied to', glimmerElements.length, 'elements');
  }
}

// ===========================
// Refresh Glimmer (called after re-render)
// ===========================
function refreshTextGlimmer() {
  // Skip if performance mode is active
  if (performanceModeActive) {
    console.log('[TextGlimmer] Refresh skipped - performance mode active');
    return;
  }
  
  // Apply glimmer to new elements
  applyGlimmerEffects();
}

// ===========================
// Add CSS Animations
// ===========================
function addGlimmerStyles() {
  // Check if styles already exist
  if (document.getElementById('text-glimmer-styles')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'text-glimmer-styles';
  style.textContent = `
    /* Glimmer character animation */
    .glimmer-char {
      display: inline-block;
      animation: glimmer 2s ease-in-out infinite;
    }
    
    @keyframes glimmer {
      0%, 100% {
        opacity: 1;
        color: inherit;
      }
      50% {
        opacity: 0.7;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
      }
    }
    
    /* Disable glimmer in performance mode */
    .performance-mode .glimmer-char {
      animation: none !important;
      text-shadow: none !important;
    }
  `;
  
  document.head.appendChild(style);
}

// ===========================
// Initialize on Load
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  addGlimmerStyles();
  initTextGlimmer();
});

// ===========================
// Export Functions
// ===========================
window.TextGlimmer = {
  init: initTextGlimmer,
  refresh: refreshTextGlimmer,
  setPerformanceMode: setPerformanceMode
};

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /textglimmer.js
