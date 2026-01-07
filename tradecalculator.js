// File type: Client-side JavaScript (for GitHub Pages)
// Path: /tradecalculator.js

// Debug warning: Trade calculator logic - displays inline in content area, no modal popup
// Debug warning: Allows multiple of same pet type, uses grid layout with square cards

// =======================
// Configuration
// =======================
const TRADE_CACHE_KEY = "rpv_trade_state_v2";

// Track which side is being searched (you/them)
let currentSearchSide = null;

// Trade state object - stores pets with quantities
let tradeState = {
  you: { pets: [], tokens: 0 },
  them: { pets: [], tokens: 0 }
};

// =======================
// Cache Management
// =======================
function saveTradeToCache() {
  try {
    localStorage.setItem(TRADE_CACHE_KEY, JSON.stringify(tradeState));
    console.log('[Trade Calculator] State saved to cache');
  } catch (err) {
    console.warn('[DEBUG-WARNING] Failed to save trade state:', err);
  }
}

function loadTradeFromCache() {
  try {
    const cached = localStorage.getItem(TRADE_CACHE_KEY);
    if (cached) {
      tradeState = JSON.parse(cached);
      console.log('[Trade Calculator] State loaded from cache');
    }
  } catch (err) {
    console.warn('[DEBUG-WARNING] Failed to load trade state:', err);
    // Reset to default if cache corrupted
    tradeState = {
      you: { pets: [], tokens: 0 },
      them: { pets: [], tokens: 0 }
    };
  }
}

function clearTradeCache() {
  try {
    localStorage.removeItem(TRADE_CACHE_KEY);
    console.log('[Trade Calculator] Cache cleared');
  } catch (err) {
    console.warn('[DEBUG-WARNING] Failed to clear trade cache:', err);
  }
}

// =======================
// Trade Calculator Display
// =======================
function openTradeCalculator() {
  console.log('[Trade Calculator] Opening inline display...');
  
  // Hide pets grid and welcome
  const petsContainer = document.getElementById('pets-container');
  const welcomeDiv = document.querySelector('.welcome');
  if (petsContainer) petsContainer.style.display = 'none';
  if (welcomeDiv) welcomeDiv.style.display = 'none';
  
  // Show trade calculator in content area
  renderTradeCalculatorInline();
}

function closeTradeCalculator() {
  console.log('[Trade Calculator] Closing inline display...');
  
  // Hide trade calculator
  const contentArea = document.getElementById('content');
  if (contentArea) {
    const tradeCalc = contentArea.querySelector('.trade-calculator-inline');
    if (tradeCalc) tradeCalc.remove();
  }
  
  // Show pets grid and welcome
  const petsContainer = document.getElementById('pets-container');
  const welcomeDiv = document.querySelector('.welcome');
  if (petsContainer) petsContainer.style.display = 'grid';
  if (welcomeDiv) welcomeDiv.style.display = 'block';
  
  // Re-render pets
  if (typeof window.renderPets === 'function') {
    window.renderPets();
  }
}

// =======================
// Pet Management (Allows Duplicates)
// =======================
function addPetToSide(pet, side) {
  if (!pet || !side) {
    console.warn('[DEBUG-WARNING] Invalid pet or side');
    return;
  }
  
  // Add pet to side (allows duplicates by adding new entry each time)
  tradeState[side].pets.push({
    id: pet.id,
    uniqueId: Date.now() + Math.random(), // Unique identifier for this instance
    name: pet.name,
    value_normal: pet.value_normal || 0,
    image_url: pet.image_url,
    rarity: pet.rarity
  });
  
  saveTradeToCache();
  renderTradePanel();
  closeSearchDropdown();
  console.log('[Trade Calculator] Pet added:', pet.name, 'to', side);
}

function removePetFromSide(uniqueId, side) {
  if (!side || uniqueId === undefined) {
    console.warn('[DEBUG-WARNING] Invalid unique ID or side');
    return;
  }
  
  // Filter out the specific pet instance
  tradeState[side].pets = tradeState[side].pets.filter(p => p.uniqueId !== uniqueId);
  
  saveTradeToCache();
  renderTradePanel();
  console.log('[Trade Calculator] Pet removed:', uniqueId, 'from', side);
}

// =======================
// Token Management
// =======================
function updateTokenValue(value, side) {
  if (!side) {
    console.warn('[DEBUG-WARNING] Invalid side for token update');
    return;
  }
  
  const tokenValue = parseInt(value) || 0;
  tradeState[side].tokens = Math.max(0, tokenValue); // Prevent negative
  
  saveTradeToCache();
  updateTotalDisplay();
  updateTradeResult();
  console.log('[Trade Calculator] Tokens updated:', side, tokenValue);
}

// =======================
// Value Calculations
// =======================
function calculateTotalValue(side) {
  if (!side) return 0;
  
  // Sum pet values
  const petsTotal = tradeState[side].pets.reduce((sum, pet) => {
    return sum + (pet.value_normal || 0);
  }, 0);
  
  // Add tokens
  const total = petsTotal + tradeState[side].tokens;
  return total;
}

function compareTrades() {
  const youTotal = calculateTotalValue('you');
  const themTotal = calculateTotalValue('them');
  
  // Avoid division by zero
  if (themTotal === 0 && youTotal === 0) {
    return { status: 'neutral', text: 'Add pets to compare', class: 'neutral' };
  }
  
  if (themTotal === 0) {
    return { status: 'win', text: 'You Win! (They offer nothing)', class: 'win' };
  }
  
  const difference = youTotal - themTotal;
  const percentageDiff = (Math.abs(difference) / themTotal) * 100;
  
  // Fair trade (within 5% difference)
  if (percentageDiff <= 5) {
    return { status: 'fair', text: 'Fair Trade ✓', class: 'fair' };
  }
  
  // You're giving more (losing)
  if (difference > 0) {
    return { status: 'lose', text: `You Lose (-${formatNumber(Math.abs(difference))})`, class: 'lose' };
  }
  
  // You're giving less (winning)
  return { status: 'win', text: `You Win! (+${formatNumber(Math.abs(difference))})`, class: 'win' };
}

// =======================
// Pet Search
// =======================
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
  
  // Clear previous search
  searchInput.value = '';
  
  // Show dropdown
  dropdown.classList.remove('hidden');
  searchInput.focus();
  
  // Render all pets initially
  renderSearchResults(window.allPets);
  
  console.log('[Trade Calculator] Search opened for side:', side);
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
  
  // If empty query, return all pets
  if (!query || !query.trim()) {
    return window.allPets;
  }
  
  // Filter by name (case-insensitive)
  const lowerQuery = query.toLowerCase();
  return window.allPets.filter(pet => 
    pet.name && pet.name.toLowerCase().includes(lowerQuery)
  );
}

function renderSearchResults(pets) {
  const resultsContainer = document.getElementById('trade-search-results');
  if (!resultsContainer) return;
  
  if (!pets || pets.length === 0) {
    resultsContainer.innerHTML = '<div class="trade-no-results">No pets found</div>';
    return;
  }
  
  // Limit to first 50 results for performance
  const limitedPets = pets.slice(0, 50);
  
  const html = limitedPets.map(pet => `
    <div class="trade-search-result-item" data-pet-id="${pet.id}">
      ${pet.image_url ? 
        `<img src="${pet.image_url}" alt="${escapeHtml(pet.name)}" class="trade-result-pet-icon">` :
        `<div class="trade-result-pet-icon-placeholder">?</div>`
      }
      <div class="trade-result-pet-info">
        <span class="trade-result-pet-name">${escapeHtml(pet.name)}</span>
        <span class="trade-result-pet-value">${formatNumber(pet.value_normal || 0)}</span>
      </div>
    </div>
  `).join('');
  
  resultsContainer.innerHTML = html;
}

// =======================
// Rendering Functions
// =======================
function renderTradeCalculatorInline() {
  const contentArea = document.getElementById('content');
  if (!contentArea) return;
  
  // Remove existing trade calculator if present
  const existing = contentArea.querySelector('.trade-calculator-inline');
  if (existing) existing.remove();
  
  const html = `
    <div class="trade-calculator-inline">
      <!-- Header -->
      <div class="trade-calc-header">
        <h2>Trade Calculator</h2>
        <button id="trade-calc-close-btn" class="trade-calc-close-btn">×</button>
      </div>
      
      <!-- Trade Sides Container -->
      <div class="trade-sides-container">
        <!-- YOUR OFFER -->
        <div class="trade-side-section" data-side="you">
          <h3 class="trade-side-title you-title">YOU</h3>
          <div class="trade-pets-grid" id="you-pets"></div>
          <div class="trade-token-section">
            <label>Tokens</label>
            <input type="number" id="you-tokens" placeholder="0" min="0" value="${tradeState.you.tokens}">
          </div>
          <div class="trade-total">Total: <span id="you-total">0</span></div>
        </div>
        
        <!-- THEIR OFFER -->
        <div class="trade-side-section" data-side="them">
          <h3 class="trade-side-title them-title">THEM</h3>
          <div class="trade-pets-grid" id="them-pets"></div>
          <div class="trade-token-section">
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
        <button id="trade-calc-reset-btn" class="trade-calc-reset-btn">Reset</button>
      </div>
      
      <!-- Pet Search Dropdown -->
      <div id="trade-pet-search-dropdown" class="trade-pet-search-dropdown hidden">
        <input type="text" id="trade-pet-search-input" placeholder="Search pet name..." autocomplete="off">
        <div id="trade-search-results" class="trade-search-results"></div>
      </div>
    </div>
  `;
  
  contentArea.innerHTML = html;
  
  // Render initial state
  renderTradePanel();
  attachTradeEventListeners();
}

function renderTradePanel() {
  renderSidePets('you');
  renderSidePets('them');
  updateTotalDisplay();
  updateTradeResult();
}

function renderSidePets(side) {
  const container = document.getElementById(`${side}-pets`);
  if (!container) return;
  
  const pets = tradeState[side].pets;
  
  // Always show the add button
  let html = `
    <div class="trade-add-card" data-side="${side}">
      <div class="trade-add-icon">+</div>
      <div class="trade-add-text">Add Pet</div>
    </div>
  `;
  
  // Add selected pets as square cards
  pets.forEach(pet => {
    html += `
      <div class="trade-pet-card" data-unique-id="${pet.uniqueId}">
        ${pet.image_url ? 
          `<img src="${pet.image_url}" alt="${escapeHtml(pet.name)}" class="trade-pet-card-img">` :
          `<div class="trade-pet-card-placeholder">?</div>`
        }
        <div class="trade-pet-card-name">${escapeHtml(pet.name)}</div>
        <div class="trade-pet-card-value">${formatNumber(pet.value_normal || 0)}</div>
        <button class="trade-remove-btn" data-unique-id="${pet.uniqueId}" data-side="${side}">×</button>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function updateTotalDisplay() {
  // Update You total
  const youTotal = calculateTotalValue('you');
  const youTotalElement = document.getElementById('you-total');
  if (youTotalElement) {
    youTotalElement.textContent = formatNumber(youTotal);
  }
  
  // Update Them total
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
  
  // Update text and class
  resultText.textContent = result.text;
  resultElement.className = `trade-calc-result ${result.class}`;
}

// =======================
// Event Listeners
// =======================
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
        
        // Clear token inputs
        const youTokens = document.getElementById('you-tokens');
        const themTokens = document.getElementById('them-tokens');
        if (youTokens) youTokens.value = '';
        if (themTokens) themTokens.value = '';
        
        console.log('[Trade Calculator] Reset complete');
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
  
  // Search input - live search
  const searchInput = document.getElementById('trade-pet-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const results = searchPets(e.target.value);
      renderSearchResults(results);
    });
  }
  
  // Event delegation for dynamic elements
  document.addEventListener('click', (e) => {
    // Add pet button
    const addCard = e.target.closest('.trade-add-card');
    if (addCard) {
      const side = addCard.dataset.side;
      openSearchDropdown(side);
      return;
    }
    
    // Remove pet button
    const removeBtn = e.target.closest('.trade-remove-btn');
    if (removeBtn) {
      const uniqueId = parseFloat(removeBtn.dataset.uniqueId);
      const side = removeBtn.dataset.side;
      removePetFromSide(uniqueId, side);
      return;
    }
    
    // Search result item
    const searchResultItem = e.target.closest('.trade-search-result-item');
    if (searchResultItem && currentSearchSide) {
      const petId = parseInt(searchResultItem.dataset.petId);
      const pet = window.allPets.find(p => p.id === petId);
      if (pet) {
        addPetToSide(pet, currentSearchSide);
      }
      return;
    }
    
    // Close search dropdown when clicking outside
    const dropdown = document.getElementById('trade-pet-search-dropdown');
    if (dropdown && !dropdown.classList.contains('hidden')) {
      if (!dropdown.contains(e.target) && !e.target.closest('.trade-add-card')) {
        closeSearchDropdown();
      }
    }
  });
}

// =======================
// Helper Functions
// =======================
function formatNumber(num) {
  if (num == null) return '0';
  return Number(num).toLocaleString();
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =======================
// Initialization
// =======================
function initTradeCalculator() {
  console.log('[Trade Calculator] Initializing...');
  loadTradeFromCache();
}

// Make globally accessible
window.openTradeCalculator = openTradeCalculator;
window.closeTradeCalculator = closeTradeCalculator;
window.initTradeCalculator = initTradeCalculator;

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /tradecalculator.js
