// File type: Client-side JavaScript (for GitHub Pages)
// Path: /performancemode.js

// Debug warning: Performance mode controller for disabling heavy visual effects at high zoom levels
// Automatically disables particles, glows, and animations when density > 7

// ===========================
// State Management
// ===========================
let performanceMode = {
  isActive: false,
  currentDensity: 7,
  effectsDisabled: false
};

// ===========================
// Initialize Performance Mode
// ===========================
function initPerformanceMode() {
  console.log('[PerformanceMode] Initialized');
}

// ===========================
// Update Density (called when zoom changes)
// ===========================
function updateDensity(density) {
  performanceMode.currentDensity = density;
  
  // Enable performance mode for +3 and +5 zoom (density 9 and 11)
  const shouldBeActive = density >= 9;
  
  if (shouldBeActive !== performanceMode.isActive) {
    performanceMode.isActive = shouldBeActive;
    
    if (shouldBeActive) {
      enablePerformanceMode();
    } else {
      disablePerformanceMode();
    }
  }
}

// ===========================
// Enable Performance Mode
// ===========================
function enablePerformanceMode() {
  console.log('[PerformanceMode] ENABLED - Disabling visual effects');
  
  const container = document.getElementById('pets-container');
  if (container) {
    container.classList.add('performance-mode');
  }
  
  // Notify SecretEffects to disable
  if (window.SecretEffects && typeof window.SecretEffects.setPerformanceMode === 'function') {
    window.SecretEffects.setPerformanceMode(true);
  }
  
  // Notify TextGlimmer to disable
  if (window.TextGlimmer && typeof window.TextGlimmer.setPerformanceMode === 'function') {
    window.TextGlimmer.setPerformanceMode(true);
  }
  
  performanceMode.effectsDisabled = true;
}

// ===========================
// Disable Performance Mode
// ===========================
function disablePerformanceMode() {
  console.log('[PerformanceMode] DISABLED - Re-enabling visual effects');
  
  const container = document.getElementById('pets-container');
  if (container) {
    container.classList.remove('performance-mode');
  }
  
  // Notify SecretEffects to enable
  if (window.SecretEffects && typeof window.SecretEffects.setPerformanceMode === 'function') {
    window.SecretEffects.setPerformanceMode(false);
  }
  
  // Notify TextGlimmer to enable
  if (window.TextGlimmer && typeof window.TextGlimmer.setPerformanceMode === 'function') {
    window.TextGlimmer.setPerformanceMode(false);
  }
  
  performanceMode.effectsDisabled = false;
}

// ===========================
// Check if Effects Should Run
// ===========================
function shouldDisableEffects() {
  return performanceMode.isActive && performanceMode.effectsDisabled;
}

// ===========================
// Get Performance Stats (for debugging)
// ===========================
function getPerformanceStats() {
  return {
    isActive: performanceMode.isActive,
    density: performanceMode.currentDensity,
    effectsDisabled: performanceMode.effectsDisabled
  };
}

// ===========================
// Export Functions
// ===========================
window.PerformanceMode = {
  init: initPerformanceMode,
  updateDensity: updateDensity,
  shouldDisableEffects: shouldDisableEffects,
  isActive: () => performanceMode.isActive,
  getStats: getPerformanceStats
};

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPerformanceMode);
} else {
  initPerformanceMode();
}

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /performancemode.js
