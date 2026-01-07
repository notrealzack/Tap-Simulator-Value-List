// File type: Client-side JavaScript (for GitHub Pages)
// Path: /tradecalculator.js

// Debug warning: Trade calculator logic - no API calls, uses allPets from main.js

// =======================
// Configuration
// =======================
const TRADE_CACHE_KEY = "rpv_trade_state_v1";
let currentSearchSide = null; // Track which side is being searched (you/them)

// Trade state object
let tradeState = {
  you: {
    pets: [],
    tokens: 0
  },
  them: {
    pets: [],
    tokens: 0
  }
};

// =======================
// Initialization
// =======================
function initTradeCalculator() {
  console.log('[Trade Calculator] Initializing...');
  loadTradeFromCache();
  attachTradeEventListeners();
}

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
    tradeState = { you: { pets: [], tokens: 0 }, them: { pets: [], tokens: 0 } };
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
// Modal Management
// =======================
function openTradeCalculator() {
  const modal = document.getElementById('trade-calculator-modal');
  if (!modal) {
    console.warn('[DEBUG-WARNING] Trade calculator modal not found');
    return;
  }
  
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  renderTradePanel();
  console.log('[Trade Calculator] Modal opened');
}

function closeTradeCalculator() {
  const modal = document.getElementById('trade-calculator-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
  
  // Close search dropdown if open
  closeSearchDropdown();
  console.log('[Trade Calculator] Modal closed');
}

// =======================
// Pet Management
// =======================
function addPetToSide(pet, side) {
  if (!pet || !side) {
    console.warn('[DEBUG-WARNING] Invalid pet or side');
    return;
  }
  
  // Check if pet already exists on this side
  const exists = tradeState[side].pets.some(p => p.id === pet.id);
  if (exists) {
    console.warn('[DEBUG-WARNING] Pet already added to this side');
    return;
  }
  
  // Add pet to side
  tradeState[side].pets.push({
    id: pet.id,
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

function removePetFromSide(petId, side) {
  if (!side || petId === undefined) {
    console.warn('[DEBUG-WARNING] Invalid pet ID or side');
    return;
  }
  
  // Filter out the pet
  tradeState[side].pets = tradeState[side].pets.filter(p => p.id !== petId);
  
  saveTradeToCache();
  renderTradePanel();
  console.log('[Trade Calculator] Pet removed:', petId, 'from', side);
}

// =======================
// Token Management
// =======================
function updateTokenValue(value, side) {
  if (!side) {
    console.warn('[DEBUG-WARNING] Invalid side for token update');
    return;
  }
  
  // Parse and validate
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
    return { status: 'win', text: 'You Win (They offer nothing)', class: 'win' };
  }
  
  const difference = youTotal - themTotal;
  const percentageDiff = Math.abs((difference / themTotal) * 100);
  
  // Fair trade: within 5% difference
  if (percentageDiff <= 5) {
    return { status: 'fair', text: 'Fair Trade', class: 'fair' };
  }
  
  // You're giving more (losing)
  if (difference > 0) {
    return { 
      status: 'lose', 
      text: `You Lose (-${formatNumber(Math.abs(difference))})`, 
      class: 'lose' 
    };
  }
  
  // You're giving less (winning)
  return { 
    status: 'win', 
    text: `You Win (+${formatNumber(Math.abs(difference))})`, 
    class: 'win' 
  };
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
  const dropdown = document.getElementById('pet-search-dropdown');
  const searchInput = document.getElementById('pet-search-input');
  
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
  const dropdown = document.getElementById('pet-search-dropdown');
  if (dropdown) {
    dropdown.classList.add('hidden');
  }
  currentSearchSide = null;
}

function searchPets(query) {
  if (!window.allPets) return [];
  
  // If empty query, return all pets
  if (!query || query.trim() === '') {
    return window.allPets;
  }
  
  // Filter by name (case-insensitive)
  const lowerQuery = query.toLowerCase();
  return window.allPets.filter(pet => 
    pet.name && pet.name.toLowerCase().includes(lowerQuery)
  );
}

function renderSearchResults(pets) {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;
  
  if (!pets || pets.length === 0) {
    resultsContainer.innerHTML = '<div class="no-results">No pets found</div>';
    return;
  }
  
  // Limit to first 50 results for performance
  const limitedPets = pets.slice(0, 50);
  
  const html = limitedPets.map(pet => `
    <div class="search-result-item" data-pet-id="${pet.id}">
      ${pet.image_url ? 
        `<img src="${pet.image_url}" alt="${escapeHtml(pet.name)}" class="result-pet-icon">` :
        `<div class="result-pet-icon-placeholder">?</div>`
      }
      <div class="result-pet-info">
        <span class="result-pet-name">${escapeHtml(pet.name)}</span>
        <span class="result-pet-value">${formatNumber(pet.value_normal || 0)}</span>
      </div>
    </div>
  `).join('');
  
  resultsContainer.innerHTML = html;
}

// =======================
// Rendering Functions
// =======================
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
    <button class="add-pet-btn" data-side="${side}">
      <span class="add-icon">+</span>
    </button>
  `;
  
  // Add selected pets
  pets.forEach(pet => {
    html += `
      <div class="trade-pet-item" data-pet-id="${pet.id}">
        ${pet.image_url ? 
          `<img src="${pet.image_url}" alt="${escapeHtml(pet.name)}" class="trade-pet-icon">` :
          `<div class="trade-pet-icon-placeholder">?</div>`
        }
        <div class="trade-pet-info">
          <span class="trade-pet-name">${escapeHtml(pet.name)}</span>
          <span class="trade-pet-value">${formatNumber(pet.value_normal || 0)}</span>
        </div>
        <button class="remove-pet-btn" data-pet-id="${pet.id}" data-side="${side}" title="Remove">×</button>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function updateTotalDisplay() {
  // Update "You" total
  const youTotal = calculateTotalValue('you');
  const youTotalElement = document.getElementById('you-total');
  if (youTotalElement) {
    youTotalElement.textContent = formatNumber(youTotal);
  }
  
  // Update "Them" total
  const themTotal = calculateTotalValue('them');
  const themTotalElement = document.getElementById('them-total');
  if (themTotalElement) {
    themTotalElement.textContent = formatNumber(themTotal);
  }
}

function updateTradeResult() {
  const result = compareTrades();
  const resultElement = document.getElementById('trade-result');
  const resultText = document.getElementById('result-text');
  
  if (!resultElement || !resultText) return;
  
  // Update text and class
  resultText.textContent = result.text;
  resultElement.className = `trade-result ${result.class}`;
}

// =======================
// Event Listeners
// =======================
function attachTradeEventListeners() {
  // Close button
  const closeBtn = document.getElementById('trade-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeTradeCalculator);
  }
  
  // Modal backdrop close
  const modal = document.getElementById('trade-calculator-modal');
  if (modal) {
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeTradeCalculator);
    }
  }
  
  // Reset button
  const resetBtn = document.getElementById('trade-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset trade calculator? This will clear all pets and tokens.')) {
        tradeState = { you: { pets: [], tokens: 0 }, them: { pets: [], tokens: 0 } };
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
  
  // Search input
  const searchInput = document.getElementById('pet-search-input');
  if (searchInput) {
    // Live search on input
    searchInput.addEventListener('input', (e) => {
      const results = searchPets(e.target.value);
      renderSearchResults(results);
    });
    
    // Close search on Escape key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSearchDropdown();
      }
    });
  }
  
  // Event delegation for dynamic buttons
  document.addEventListener('click', (e) => {
    // Add pet button (+)
    const addBtn = e.target.closest('.add-pet-btn');
    if (addBtn) {
      const side = addBtn.dataset.side;
      openSearchDropdown(side);
      return;
    }
    
    // Remove pet button (×)
    const removeBtn = e.target.closest('.remove-pet-btn');
    if (removeBtn) {
      const petId = parseInt(removeBtn.dataset.petId);
      const side = removeBtn.dataset.side;
      removePetFromSide(petId, side);
      return;
    }
    
    // Search result item click
    const resultItem = e.target.closest('.search-result-item');
    if (resultItem && currentSearchSide) {
      const petId = parseInt(resultItem.dataset.petId);
      const pet = window.allPets.find(p => p.id === petId);
      if (pet) {
        addPetToSide(pet, currentSearchSide);
      }
      return;
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

// Make globally accessible
window.openTradeCalculator = openTradeCalculator;
window.closeTradeCalculator = closeTradeCalculator;
window.initTradeCalculator = initTradeCalculator;

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /tradecalculator.js
