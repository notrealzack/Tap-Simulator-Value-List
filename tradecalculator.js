// File type: Client-side JavaScript (for GitHub Pages)
// Path: /tradecalculator.js - COMPLETE REPLACEMENT

/* Debug warning: Trade calculator logic - displays inline in content area without destroying pets-container */
/* Debug warning: Allows multiple of same pet type, proper DOM handling */
/* NEW: Supports Normal/Golden/Rainbow variant selection per pet */

// Configuration
const TRADE_CACHE_KEY = 'rpv_trade_state_v3'; // Updated version for variant support

// Track which side is being searched (you/them)
let currentSearchSide = null;

// Track if trade calculator is open
let isTradeCalculatorOpen = false;

// Trade state object - stores pets with quantities AND variants
let tradeState = {
  you: { pets: [], tokens: 0 },
  them: { pets: [], tokens: 0 }
};

/* ============================================
   HELPER FUNCTIONS (MOVED TO TOP)
   ============================================ */

/* Debug warning: Use global value translator for accurate value comparisons */
function getNumericValue(textValue) {
  // Use the global parseValueToNumber function from main.js
  if (typeof window.parseValueToNumber === 'function') {
    return window.parseValueToNumber(textValue);
  }
  // Fallback if function not available
  return parseFloat(textValue) || 0;
}

function formatNumber(num) {
  if (num === null) return '0';
  return Number(num).toLocaleString();
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================
   CACHE MANAGEMENT
   ============================================ */

function saveTradeToCache() {
  try {
    localStorage.setItem(TRADE_CACHE_KEY, JSON.stringify(tradeState));
  } catch (err) {
    console.warn('[DEBUG-WARNING] Failed to save trade state:', err);
  }
}

function loadTradeFromCache() {
  try {
    const cached = localStorage.getItem(TRADE_CACHE_KEY);
    if (cached) {
      tradeState = JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[DEBUG-WARNING] Failed to load trade state:', err);
    tradeState = {
      you: { pets: [], tokens: 0 },
      them: { pets: [], tokens: 0 }
    };
  }
}

function clearTradeCache() {
  try {
    localStorage.removeItem(TRADE_CACHE_KEY);
  } catch (err) {
    console.warn('[DEBUG-WARNING] Failed to clear trade cache:', err);
  }
}

/* ============================================
   PET MANAGEMENT (WITH VARIANTS)
   ============================================ */

function addPetToSide(pet, variant, side) {
  if (!pet || !side || !variant) {
    console.warn('[DEBUG-WARNING] Invalid pet, variant, or side');
    return;
  }

  // Get the value based on variant
  let value;
  switch(variant) {
    case 'golden':
      value = pet.value_golden || '0';
      break;
    case 'rainbow':
      value = pet.value_rainbow || '0';
      break;
    default: // 'normal'
      value = pet.value_normal || '0';
  }

  tradeState[side].pets.push({
    id: pet.id,
    uniqueId: Date.now() + Math.random(),
    name: pet.name,
    variant: variant, // 'normal', 'golden', 'rainbow'
    value: value,
    image_url: pet.image_url,
    rarity: pet.rarity
  });

  saveTradeToCache();
  renderTradePanel();
  closeSearchDropdown();
}

function removePetFromSide(uniqueId, side) {
  if (!side || uniqueId === undefined) {
    console.warn('[DEBUG-WARNING] Invalid unique ID or side');
    return;
  }

  tradeState[side].pets = tradeState[side].pets.filter(p => p.uniqueId !== uniqueId);
  saveTradeToCache();
  renderTradePanel();
}

/* ============================================
   TOKEN MANAGEMENT
   ============================================ */

function updateTokenValue(value, side) {
  if (!side) {
    console.warn('[DEBUG-WARNING] Invalid side for token update');
    return;
  }

  const tokenValue = parseInt(value) || 0;
  tradeState[side].tokens = Math.max(0, tokenValue);

  saveTradeToCache();
  updateTotalDisplay();
  updateTradeResult();
}

/* ============================================
   VALUE CALCULATIONS
   ============================================ */

/* Debug warning: Converts text values to numbers for accurate calculations */
function calculateTotalValue(side) {
  if (!side) return 0;

  const petsTotal = tradeState[side].pets.reduce((sum, pet) => {
    return sum + getNumericValue(pet.value);
  }, 0);

  const total = petsTotal + tradeState[side].tokens;
  return total;
}

function compareTrades() {
  const youTotal = calculateTotalValue('you');
  const themTotal = calculateTotalValue('them');

  if (themTotal === 0 && youTotal === 0) {
    return { status: 'neutral', text: 'Add pets to compare', class: 'neutral' };
  }

  if (themTotal === 0) {
    return { status: 'win', text: 'You Win! They offer nothing', class: 'win' };
  }

  const difference = youTotal - themTotal;
  const percentageDiff = (Math.abs(difference) / themTotal) * 100;

  if (percentageDiff < 5) {
    return { status: 'fair', text: 'Fair Trade ✓', class: 'fair' };
  }

  if (difference > 0) {
    return { status: 'lose', text: `You Lose -${formatNumber(Math.abs(difference))}`, class: 'lose' };
  }

  return { status: 'win', text: `You Win! +${formatNumber(Math.abs(difference))}`, class: 'win' };
}

/* ============================================
   RENDERING FUNCTIONS
   ============================================ */

function renderTradePanel() {
  renderSidePets('you');
  renderSidePets('them');
  updateTotalDisplay();
  updateTradeResult();
}

/* Debug warning: Display keeps text format (15K, 1.5M) in pet cards */
function renderSidePets(side) {
  const container = document.getElementById(`${side}-pets`);
  if (!container) return;

  const pets = tradeState[side].pets;
  let html = `<div class="trade-add-card" data-side="${side}">
    <div class="trade-add-icon">+</div>
    <div class="trade-add-text">Add Pet</div>
  </div>`;

  pets.forEach(pet => {
    // Variant badge color
    let variantClass = '';
    let variantLabel = '';
    if (pet.variant === 'golden') {
      variantClass = 'golden';
      variantLabel = 'G';
    } else if (pet.variant === 'rainbow') {
      variantClass = 'rainbow';
      variantLabel = 'R';
    } else {
      variantClass = 'normal';
      variantLabel = 'N';
    }

    html += `<div class="trade-pet-card" data-unique-id="${pet.uniqueId}">
      <button class="trade-remove-btn" data-unique-id="${pet.uniqueId}" data-side="${side}">×</button>
      <span class="trade-variant-badge ${variantClass}">${variantLabel}</span>
      ${pet.image_url ? 
        `<img src="${pet.image_url}" alt="${escapeHtml(pet.name)}" class="trade-pet-img">` : 
        `<div class="trade-pet-placeholder">?</div>`
      }
      <div class="trade-pet-name">${escapeHtml(pet.name)}</div>
      <div class="trade-pet-value">${pet.value || '0'}</div>
    </div>`;
  });

  container.innerHTML = html;
}

function updateTotalDisplay() {
  const youTotal = calculateTotalValue('you');
  const youTotalElement = document.getElementById('you-total');
  if (youTotalElement) {
    youTotalElement.textContent = formatNumber(youTotal);
  }

  const themTotal = calculateTotalValue('them');
  const themTotalElement = document.getElementById('them-total');
  if (themTotalElement) {
    themTotalElement.textContent = formatNumber(themTotal);
  }
}

function updateTradeResult() {
  const result = compareTrades();
  const resultElement = document.getElementById('trade-calc-result');
  const resultText = document.getElementById('trade-result-text');

  if (!resultElement || !resultText) return;

  resultText.textContent = result.text;
  resultElement.className = `trade-calc-result ${result.class}`;
}

/* ============================================
   PET SEARCH FUNCTIONS
   ============================================ */

function openSearchDropdown(side) {
  if (!window.allPets || !Array.isArray(window.allPets)) {
    console.warn('[DEBUG-WARNING] allPets array not available');
    alert('Pet data not loaded yet. Please wait.');
    return;
  }

  currentSearchSide = side;
  const dropdown = document.getElementById('trade-pet-search-dropdown');
  const searchInput = document.getElementById('trade-pet-search-input');

  if (!dropdown || !searchInput) {
    console.warn('[DEBUG-WARNING] Search dropdown elements not found');
    return;
  }

  searchInput.value = '';
  dropdown.classList.remove('hidden');
  searchInput.focus();

  renderSearchResults(window.allPets);
}

function closeSearchDropdown() {
  const dropdown = document.getElementById('trade-pet-search-dropdown');
  if (dropdown) {
    dropdown.classList.add('hidden');
  }
  currentSearchSide = null;
}

function searchPets(query) {
  if (!window.allPets) return [];
  
  if (!query || !query.trim()) {
    return window.allPets;
  }

  const lowerQuery = query.toLowerCase();
  return window.allPets.filter(pet => pet.name && pet.name.toLowerCase().includes(lowerQuery));
}

/* Debug warning: NEW - Shows variant buttons (Normal/Golden/Rainbow) for each pet */
function renderSearchResults(pets) {
  const resultsContainer = document.getElementById('trade-search-results');
  if (!resultsContainer) return;

  if (!pets || pets.length === 0) {
    resultsContainer.innerHTML = `<div class="trade-no-results">No pets found</div>`;
    return;
  }

  const limitedPets = pets.slice(0, 50);
  const html = limitedPets.map(pet => {
    return `<div class="trade-search-result-item" data-pet-id="${pet.id}">
      ${pet.image_url ? 
        `<img src="${pet.image_url}" alt="${escapeHtml(pet.name)}" class="trade-result-pet-icon">` : 
        `<div class="trade-result-pet-icon-placeholder">?</div>`
      }
      <div class="trade-result-pet-info">
        <span class="trade-result-pet-name">${escapeHtml(pet.name)}</span>
      </div>
      <div class="trade-variant-buttons">
        <button class="trade-variant-btn normal" data-pet-id="${pet.id}" data-variant="normal" title="Normal: ${pet.value_normal || '0'}">
          <span class="variant-label">N</span>
          <span class="variant-value">${pet.value_normal || '0'}</span>
        </button>
        <button class="trade-variant-btn golden" data-pet-id="${pet.id}" data-variant="golden" title="Golden: ${pet.value_golden || '0'}">
          <span class="variant-label">G</span>
          <span class="variant-value">${pet.value_golden || '0'}</span>
        </button>
        <button class="trade-variant-btn rainbow" data-pet-id="${pet.id}" data-variant="rainbow" title="Rainbow: ${pet.value_rainbow || '0'}">
          <span class="variant-label">R</span>
          <span class="variant-value">${pet.value_rainbow || '0'}</span>
        </button>
      </div>
    </div>`;
  }).join('');

  resultsContainer.innerHTML = html;
}

/* ============================================
   TRADE CALCULATOR DISPLAY
   ============================================ */

/* FIXED - Preserves DOM */
function openTradeCalculator() {
  console.log('Trade Calculator Opening...');
  
  if (isTradeCalculatorOpen) {
    console.log('Trade Calculator: Already open');
    return;
  }

  isTradeCalculatorOpen = true;

  // Hide pets grid and welcome (don't remove them!)
  const petsContainer = document.getElementById('pets-container');
  const welcomeDiv = document.querySelector('.welcome');

  if (petsContainer) petsContainer.style.display = 'none';
  if (welcomeDiv) welcomeDiv.style.display = 'none';

  // Show trade calculator in content area
  renderTradeCalculatorInline();
}

function closeTradeCalculator() {
  console.log('Trade Calculator Closing...');
  
  if (!isTradeCalculatorOpen) {
    console.log('Trade Calculator: Already closed');
    return;
  }

  isTradeCalculatorOpen = false;

  // Remove trade calculator
  const contentArea = document.getElementById('content');
  if (contentArea) {
    const tradeCalc = contentArea.querySelector('.trade-calculator-inline');
    if (tradeCalc) {
      tradeCalc.remove();
    }
  }

  // Show pets grid and welcome (they were just hidden, not removed)
  const petsContainer = document.getElementById('pets-container');
  const welcomeDiv = document.querySelector('.welcome');

  if (petsContainer) petsContainer.style.display = 'grid';
  if (welcomeDiv) welcomeDiv.style.display = 'block';

  // Expose flag globally
  window.isTradeCalculatorOpen = false;
}

/* Rendering Functions - FIXED - Creates alongside existing elements */
function renderTradeCalculatorInline() {
  const contentArea = document.getElementById('content');
  if (!contentArea) return;

  // Remove existing trade calculator if present
  const existing = contentArea.querySelector('.trade-calculator-inline');
  if (existing) existing.remove();

  // Create trade calculator element
  const tradeCalcDiv = document.createElement('div');
  tradeCalcDiv.className = 'trade-calculator-inline';
  tradeCalcDiv.innerHTML = `
    <!-- Header -->
    <div class="trade-calc-header">
      <h2>⚖️ Trade Calculator</h2>
      <button id="trade-calc-close-btn" class="trade-calc-close-btn" title="Close">×</button>
    </div>

    <!-- Trade Sides Container -->
    <div class="trade-sides-container">
      <!-- YOUR OFFER -->
      <div class="trade-side-section" data-side="you">
        <h3 class="trade-side-title you-title">YOUR OFFER</h3>
        <div class="trade-pets-grid" id="you-pets"></div>
        <div class="trade-input-group">
          <label>Tokens</label>
          <input type="number" id="you-tokens" placeholder="0" min="0" value="${tradeState.you.tokens}">
        </div>
        <div class="trade-total">Total: <span id="you-total">0</span></div>
      </div>

      <!-- THEIR OFFER -->
      <div class="trade-side-section" data-side="them">
        <h3 class="trade-side-title them-title">THEIR OFFER</h3>
        <div class="trade-pets-grid" id="them-pets"></div>
        <div class="trade-input-group">
          <label>Tokens</label>
          <input type="number" id="them-tokens" placeholder="0" min="0" value="${tradeState.them.tokens}">
        </div>
        <div class="trade-total">Total: <span id="them-total">0</span></div>
      </div>
    </div>

    <!-- Trade Result -->
    <div id="trade-calc-result" class="trade-calc-result neutral">
      <span id="trade-result-text">Add pets to compare</span>
    </div>

    <!-- Actions -->
    <div class="trade-calc-actions">
      <button id="trade-calc-reset-btn" class="trade-calc-btn">Reset</button>
    </div>
  `;

  // Insert at the beginning of content area (before welcome and pets-container)
  contentArea.insertBefore(tradeCalcDiv, contentArea.firstChild);

  // Render initial state
  renderTradePanel();
  attachTradeEventListeners();
}

/* ============================================
   EVENT LISTENERS
   ============================================ */

function attachTradeEventListeners() {
  // Close button
  const closeBtn = document.getElementById('trade-calc-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeTradeCalculator);
  }

  // Reset button
  const resetBtn = document.getElementById('trade-calc-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset trade calculator? This will clear all pets and tokens.')) {
        tradeState = {
          you: { pets: [], tokens: 0 },
          them: { pets: [], tokens: 0 }
        };
        clearTradeCache();
        renderTradePanel();

        // Reset token inputs
        const youTokens = document.getElementById('you-tokens');
        const themTokens = document.getElementById('them-tokens');
        if (youTokens) youTokens.value = '';
        if (themTokens) themTokens.value = '';
      }
    });
  }

  // Token inputs
  const youTokensInput = document.getElementById('you-tokens');
  const themTokensInput = document.getElementById('them-tokens');

  if (youTokensInput) {
    youTokensInput.addEventListener('input', (e) => {
      updateTokenValue(e.target.value, 'you');
    });
  }

  if (themTokensInput) {
    themTokensInput.addEventListener('input', (e) => {
      updateTokenValue(e.target.value, 'them');
    });
  }

  // Search input
  const searchInput = document.getElementById('trade-pet-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const results = searchPets(e.target.value);
      renderSearchResults(results);
    });
  }

  // Global click handler for add cards, remove buttons, and variant buttons
  document.addEventListener('click', (e) => {
    // Add pet card clicked
    const addCard = e.target.closest('.trade-add-card');
    if (addCard) {
      const side = addCard.dataset.side;
      openSearchDropdown(side);
      return;
    }

    // Remove button clicked
    const removeBtn = e.target.closest('.trade-remove-btn');
    if (removeBtn) {
      const uniqueId = parseFloat(removeBtn.dataset.uniqueId);
      const side = removeBtn.dataset.side;
      removePetFromSide(uniqueId, side);
      return;
    }

    // Variant button clicked (Normal/Golden/Rainbow)
    const variantBtn = e.target.closest('.trade-variant-btn');
    if (variantBtn && currentSearchSide) {
      const petId = parseInt(variantBtn.dataset.petId);
      const variant = variantBtn.dataset.variant;
      const pet = window.allPets.find(p => p.id === petId);
      
      if (pet) {
        addPetToSide(pet, variant, currentSearchSide);
      }
      return;
    }

    // Close dropdown if clicked outside
    const dropdown = document.getElementById('trade-pet-search-dropdown');
    if (dropdown && !dropdown.classList.contains('hidden')) {
      if (!dropdown.contains(e.target) && !e.target.closest('.trade-add-card')) {
        closeSearchDropdown();
      }
    }
  });
}

/* ============================================
   INITIALIZATION
   ============================================ */

function initTradeCalculator() {
  loadTradeFromCache();
}

// Make globally accessible
window.openTradeCalculator = openTradeCalculator;
window.closeTradeCalculator = closeTradeCalculator;
window.initTradeCalculator = initTradeCalculator;

// Expose flag globally
Object.defineProperty(window, 'isTradeCalculatorOpen', {
  get: function() { return isTradeCalculatorOpen; },
  set: function(value) { isTradeCalculatorOpen = value; }
});

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /tradecalculator.js - COMPLETE REPLACEMENT
