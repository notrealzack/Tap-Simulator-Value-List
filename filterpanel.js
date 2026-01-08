// File type: Client-side JavaScript (for GitHub Pages)
// Path: /filterpanel.js

// Debug warning: Advanced filter panel logic with min/max range filtering and stats type filtering

// =======================
// Filter State
// =======================
let activeFilters = {
  statsType: 'all', // 'all', 'value', 'percentage'
  statsMin: null,
  statsMax: null,
  normalMin: null,
  normalMax: null,
  goldenMin: null,
  goldenMax: null,
  rainbowMin: null,
  rainbowMax: null
};

// =======================
// Parse Value String to Number
// =======================
function parseValueString(str) {
  if (!str || typeof str !== 'string') return null;
  
  // Remove spaces and convert to uppercase
  str = str.trim().replace(/\s/g, '').toUpperCase();
  
  // Handle percentage (strip % and return as decimal)
  if (str.includes('%')) {
    const num = parseFloat(str.replace('%', ''));
    return isNaN(num) ? null : num;
  }
  
  // Handle multipliers (K, M, B, T)
  const multipliers = {
    'K': 1000,
    'M': 1000000,
    'B': 1000000000,
    'T': 1000000000000
  };
  
  let multiplier = 1;
  let numStr = str;
  
  // Check for multiplier suffix
  for (let suffix in multipliers) {
    if (str.endsWith(suffix)) {
      multiplier = multipliers[suffix];
      numStr = str.slice(0, -1);
      break;
    }
  }
  
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num * multiplier;
}

// =======================
// Get Numeric Value from Pet Property
// =======================
function getPetNumericValue(pet, property) {
  const value = pet[property];
  if (value == null) return 0;
  
  // If already a number, return it
  if (typeof value === 'number') return value;
  
  // Parse string value
  return parseValueString(value) || 0;
}

// =======================
// Check if Pet Passes Filters
// =======================
function petPassesFilters(pet) {
  // Stats Type Filter
  if (activeFilters.statsType !== 'all') {
    const petStatsType = pet.stats_type || 'value';
    if (petStatsType !== activeFilters.statsType) {
      return false;
    }
  }
  
  // Stats Range Filter
  if (activeFilters.statsMin !== null) {
    const petStats = getPetNumericValue(pet, 'stats');
    if (petStats < activeFilters.statsMin) return false;
  }
  if (activeFilters.statsMax !== null) {
    const petStats = getPetNumericValue(pet, 'stats');
    if (petStats > activeFilters.statsMax) return false;
  }
  
  // Normal Value Range Filter
  if (activeFilters.normalMin !== null) {
    const petNormal = getPetNumericValue(pet, 'value_normal');
    if (petNormal < activeFilters.normalMin) return false;
  }
  if (activeFilters.normalMax !== null) {
    const petNormal = getPetNumericValue(pet, 'value_normal');
    if (petNormal > activeFilters.normalMax) return false;
  }
  
  // Golden Value Range Filter
  if (activeFilters.goldenMin !== null) {
    const petGolden = getPetNumericValue(pet, 'value_golden');
    if (petGolden < activeFilters.goldenMin) return false;
  }
  if (activeFilters.goldenMax !== null) {
    const petGolden = getPetNumericValue(pet, 'value_golden');
    if (petGolden > activeFilters.goldenMax) return false;
  }
  
  // Rainbow Value Range Filter
  if (activeFilters.rainbowMin !== null) {
    const petRainbow = getPetNumericValue(pet, 'value_rainbow');
    if (petRainbow < activeFilters.rainbowMin) return false;
  }
  if (activeFilters.rainbowMax !== null) {
    const petRainbow = getPetNumericValue(pet, 'value_rainbow');
    if (petRainbow > activeFilters.rainbowMax) return false;
  }
  
  return true;
}

// =======================
// Apply Filters to Pet List
// =======================
function applyAdvancedFilters(pets) {
  // If no filters active, return all pets
  if (isFiltersEmpty()) {
    return pets;
  }
  
  return pets.filter(pet => petPassesFilters(pet));
}

// =======================
// Check if Any Filters Are Active
// =======================
function isFiltersEmpty() {
  return activeFilters.statsType === 'all' &&
         activeFilters.statsMin === null &&
         activeFilters.statsMax === null &&
         activeFilters.normalMin === null &&
         activeFilters.normalMax === null &&
         activeFilters.goldenMin === null &&
         activeFilters.goldenMax === null &&
         activeFilters.rainbowMin === null &&
         activeFilters.rainbowMax === null;
}

// =======================
// Open Filter Panel Modal
// =======================
function openFilterPanel() {
  const modal = document.getElementById('filter-panel-modal');
  if (!modal) return;
  
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  
  // Populate inputs with current filter values
  populateFilterInputs();
}

// =======================
// Close Filter Panel Modal
// =======================
function closeFilterPanel() {
  const modal = document.getElementById('filter-panel-modal');
  if (!modal) return;
  
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

// =======================
// Populate Filter Inputs with Current Values
// =======================
function populateFilterInputs() {
  // Stats Type Buttons
  document.querySelectorAll('.stats-type-btn').forEach(btn => {
    const type = btn.getAttribute('data-stats-type');
    if (type === activeFilters.statsType) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Input fields (leave empty if null)
  document.getElementById('filter-stats-min').value = activeFilters.statsMin !== null ? activeFilters.statsMin : '';
  document.getElementById('filter-stats-max').value = activeFilters.statsMax !== null ? activeFilters.statsMax : '';
  document.getElementById('filter-normal-min').value = activeFilters.normalMin !== null ? activeFilters.normalMin : '';
  document.getElementById('filter-normal-max').value = activeFilters.normalMax !== null ? activeFilters.normalMax : '';
  document.getElementById('filter-golden-min').value = activeFilters.goldenMin !== null ? activeFilters.goldenMin : '';
  document.getElementById('filter-golden-max').value = activeFilters.goldenMax !== null ? activeFilters.goldenMax : '';
  document.getElementById('filter-rainbow-min').value = activeFilters.rainbowMin !== null ? activeFilters.rainbowMin : '';
  document.getElementById('filter-rainbow-max').value = activeFilters.rainbowMax !== null ? activeFilters.rainbowMax : '';
}

// =======================
// Read Filter Inputs and Update State
// =======================
function readFilterInputs() {
  // Stats Type
  const activeStatsTypeBtn = document.querySelector('.stats-type-btn.active');
  activeFilters.statsType = activeStatsTypeBtn ? activeStatsTypeBtn.getAttribute('data-stats-type') : 'all';
  
  // Parse all input values
  activeFilters.statsMin = parseValueString(document.getElementById('filter-stats-min').value);
  activeFilters.statsMax = parseValueString(document.getElementById('filter-stats-max').value);
  activeFilters.normalMin = parseValueString(document.getElementById('filter-normal-min').value);
  activeFilters.normalMax = parseValueString(document.getElementById('filter-normal-max').value);
  activeFilters.goldenMin = parseValueString(document.getElementById('filter-golden-min').value);
  activeFilters.goldenMax = parseValueString(document.getElementById('filter-golden-max').value);
  activeFilters.rainbowMin = parseValueString(document.getElementById('filter-rainbow-min').value);
  activeFilters.rainbowMax = parseValueString(document.getElementById('filter-rainbow-max').value);
}

// =======================
// Reset All Filters
// =======================
function resetFilters() {
  activeFilters = {
    statsType: 'all',
    statsMin: null,
    statsMax: null,
    normalMin: null,
    normalMax: null,
    goldenMin: null,
    goldenMax: null,
    rainbowMin: null,
    rainbowMax: null
  };
  
  // Clear all inputs
  document.getElementById('filter-stats-min').value = '';
  document.getElementById('filter-stats-max').value = '';
  document.getElementById('filter-normal-min').value = '';
  document.getElementById('filter-normal-max').value = '';
  document.getElementById('filter-golden-min').value = '';
  document.getElementById('filter-golden-max').value = '';
  document.getElementById('filter-rainbow-min').value = '';
  document.getElementById('filter-rainbow-max').value = '';
  
  // Reset stats type buttons
  document.querySelectorAll('.stats-type-btn').forEach(btn => {
    if (btn.getAttribute('data-stats-type') === 'all') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// =======================
// Initialize Filter Panel Event Listeners
// =======================
function initFilterPanel() {
  // Close button
  const closeBtn = document.getElementById('filter-panel-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeFilterPanel);
  }
  
  // Close on backdrop click
  const modal = document.getElementById('filter-panel-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeFilterPanel();
      }
    });
  }
  
  // Stats Type Toggle Buttons
  document.querySelectorAll('.stats-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all buttons
      document.querySelectorAll('.stats-type-btn').forEach(b => b.classList.remove('active'));
      // Add active to clicked button
      btn.classList.add('active');
    });
  });
  
  // Reset Button
  const resetBtn = document.getElementById('filter-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetFilters();
    });
  }
  
  // Apply Button
  const applyBtn = document.getElementById('filter-apply-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      // Read filter inputs
      readFilterInputs();
      
      // Close modal
      closeFilterPanel();
      
      // Trigger re-render in main.js
      if (typeof filterAndSortPets === 'function') {
        filterAndSortPets();
      }
    });
  }
  
  console.log('[DEBUG] Filter panel initialized');
}

// =======================
// Initialize on DOM Ready
// =======================
document.addEventListener('DOMContentLoaded', () => {
  initFilterPanel();
});

// Make functions globally accessible for main.js
window.openFilterPanel = openFilterPanel;
window.closeFilterPanel = closeFilterPanel;
window.applyAdvancedFilters = applyAdvancedFilters;
window.isFiltersEmpty = isFiltersEmpty;
window.activeFilters = activeFilters;

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /filterpanel.js
