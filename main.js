// File type: Client-side JavaScript (for GitHub Pages)
// Path: /main.js

// Debug warning: Main application logic with admin authentication, dynamic sidebar generation, and client-side search/filter

// =======================
// Configuration
// =======================
const API_BASE = "https://ts-value-list-proxy.vercel.app";
const CACHE_VERSION = "v3";
const CACHE_KEY = `rpv_pets_cache_${CACHE_VERSION}`;
const ADMIN_KEY = "rpv_admin_session";
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

// Debug warning: jsDelivr CDN configuration for pet images
const JSDELIVR_BASE = "https://cdn.jsdelivr.net/gh/RealGoldAstro/Tap-Simulator-Value-List@main/assets/petImages";

// Debug warning: Supported image formats in order of preference
const IMAGE_FORMATS = ['webp', 'png', 'jpg', 'jpeg', 'gif'];

// Track current rarity filter for dynamic welcome message - Initialize to "all" for first load
let currentRarityFilter = "all";

// Track search and sort state
let currentSearchQuery = "";
let currentSortMode = "default"; // "default", "newest", "oldest", "highest"

// NEW: Track view density state (grid columns)
let currentViewDensity = 7; // 7, 9, or 11 pets per row

// =======================
// Clear old cache versions on load
// =======================
function clearOldCaches() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('rpv_pets_cache_') && key !== CACHE_KEY) {
      localStorage.removeItem(key);
      console.log('[DEBUG] Cleared old cache:', key);
    }
  });
}

// =======================
// Cache utilities
// =======================
function setCache(key, value, ttl) {
  try {
    const item = {
      value,
      expiry: ttl ? Date.now() + ttl : null
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (err) {
    console.warn('[DEBUG-WARNING] Cache set failed:', err);
  }
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    const item = JSON.parse(raw);
    
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.value;
  } catch (err) {
    console.warn('[DEBUG-WARNING] Cache get failed:', err);
    return null;
  }
}

function clearCache(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[DEBUG-WARNING] Cache clear failed:', err);
  }
}

// =======================
// Sidebar generation (Trade button at bottom, no emoji)
// =======================
function generateSidebar() {
  const sidebarContent = document.querySelector('.sidebar-content');
  if (!sidebarContent) return;

  const rarities = [
    { name: 'Mythical', value: 'Mythical' },
    { name: 'Secret I', value: 'Secret I' },
    { name: 'Secret II', value: 'Secret II' },
    { name: 'Secret III', value: 'Secret III' },
    { name: 'Leaderboard', value: 'Leaderboard' },
    { name: 'Exclusive', value: 'Exclusive' }
  ];

  const html = `
    <nav class="nav-section">
      <a href="#" class="nav-link active" data-rarity="all">All Pets</a>
      ${rarities.map(r => `<a href="#" class="nav-link" data-rarity="${r.value}">${r.name}</a>`).join('')}
    </nav>
    <nav id="admin-nav-section" class="nav-section admin-only" style="display:none;">
      <a href="#" class="nav-link" id="nav-add-pet">Add Pet</a>
      <a href="#" class="nav-link" id="nav-clear-cache">Clear Cache</a>
    </nav>
    <div class="nav-spacer"></div>
    <nav class="nav-section nav-bottom">
      <a href="#" class="nav-link nav-link-trade" id="nav-trade-calculator">Trade Calculator</a>
    </nav>
  `;
  
  sidebarContent.innerHTML = html;
}

// =======================
// Admin session management
// =======================
let isAdminLoggedIn = false;
let adminCredentials = null;

function checkAdminSession() {
  const session = getCache(ADMIN_KEY);
  if (session && session.username && session.password) {
    adminCredentials = session;
    isAdminLoggedIn = true;
    console.log('[DEBUG] Admin session restored for', session.username);
    showAdminUI();
    return true;
  }
  return false;
}

async function adminLogin(username, password) {
  try {
    console.log('[DEBUG] Attempting login for username:', username);
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    console.log('[DEBUG] Login response:', data);
    
    if (!res.ok || !data.valid) {
      console.warn('[DEBUG] Login failed:', data.reason || 'Unknown reason');
      return false;
    }
    
    const session = { username, password, loginTime: Date.now() };
    setCache(ADMIN_KEY, session, THIRTY_MINUTES_MS);
    adminCredentials = session;
    isAdminLoggedIn = true;
    console.log('[DEBUG] Login successful, credentials stored');
    showAdminUI();
    closeLoginModal();
    return true;
  } catch (err) {
    console.warn('[DEBUG-WARNING] Login error:', err);
    return false;
  }
}

function adminLogout() {
  clearCache(ADMIN_KEY);
  adminCredentials = null;
  isAdminLoggedIn = false;
  hideAdminUI();
  alert('You have been logged out.');
  location.reload();
}

async function verifyAdminBeforeAction() {
  if (!adminCredentials) {
    console.warn('[DEBUG] No admin credentials found');
    adminLogout();
    return false;
  }
  
  console.log('[DEBUG] Verifying credentials for:', adminCredentials.username);
  
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: adminCredentials.username,
        password: adminCredentials.password
      })
    });
    
    const data = await res.json();
    console.log('[DEBUG] Verification response:', data);
    
    if (!res.ok || !data.valid) {
      console.warn('[DEBUG] Verification failed:', data.reason || 'Unknown');
      adminLogout();
      return false;
    }
    
    return true;
  } catch (err) {
    console.warn('[DEBUG-WARNING] Credential verification failed:', err);
    adminLogout();
    return false;
  }
}

function showAdminUI() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.classList.remove('hidden');
  }
  
  // Show admin section in sidebar
  const adminSection = document.getElementById('admin-nav-section');
  if (adminSection) {
    adminSection.style.display = 'block';
    adminSection.classList.remove('hidden');
    adminSection.classList.add('visible');
  }
  
  window.dispatchEvent(new Event('adminLoggedIn'));
  
  // Show admin action buttons on all pet cards
  const adminActions = document.querySelectorAll('.pet-admin-actions');
  adminActions.forEach(el => el.classList.add('visible'));
}

function hideAdminUI() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.classList.add('hidden');
  }
  
  // Hide admin section in sidebar
  const adminSection = document.getElementById('admin-nav-section');
  if (adminSection) {
    adminSection.style.display = 'none';
    adminSection.classList.add('hidden');
    adminSection.classList.remove('visible');
  }
  
  window.dispatchEvent(new Event('adminLoggedOut'));
  
  // Hide admin action buttons
  const adminActions = document.querySelectorAll('.pet-admin-actions');
  adminActions.forEach(el => el.classList.remove('visible'));
}

// =======================
// Pet data management
// =======================
let allPets = [];

// Make allPets globally accessible for trade calculator
window.allPets = allPets;

async function loadPets(forceRefresh = false) {
  const container = document.getElementById('pets-container');
  if (!container) {
    console.warn('[DEBUG-WARNING] pets-container not found');
    return;
  }
  
  container.innerHTML = '<div class="pets-loading">Loading pets...</div>';
  
  // Try cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCache(CACHE_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      allPets = cached;
      window.allPets = allPets;
      console.log('[DEBUG] Loaded', allPets.length, 'pets from cache');
      // Explicitly set filter to "all" and render immediately
      currentRarityFilter = "all";
      renderPets("all");
      return;
    }
  }
  
  // Fetch from backend with timestamp to prevent caching
  try {
    console.log('[DEBUG] Fetching pets from API...');
    const res = await fetch(`${API_BASE}/api/pets?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    console.log('[DEBUG] API returned data:', data);
    
    allPets = Array.isArray(data) ? data : [];
    window.allPets = allPets;
    
    setCache(CACHE_KEY, allPets, THIRTY_MINUTES_MS);
    console.log('[DEBUG] Loaded', allPets.length, 'pets from API');
    
    // Explicitly set filter to "all" and render immediately
    currentRarityFilter = "all";
    renderPets("all");
  } catch (err) {
    console.warn('[DEBUG-WARNING] Failed to load pets:', err);
    container.innerHTML = '<div class="pets-loading">Failed to load pets. Try refreshing.</div>';
  }
}

// Update welcome message based on current filter
function updateWelcomeMessage(filterRarity) {
  const welcomeDiv = document.querySelector('.welcome');
  if (!welcomeDiv) return;
  
  let title, subtitle;
  if (!filterRarity || filterRarity === 'all') {
    title = 'Tap Simulator Value List';
    subtitle = 'Browse all pets and their current values';
  } else {
    title = `${filterRarity} Pets`;
    subtitle = `Viewing ${filterRarity} rarity pets`;
  }
  
  welcomeDiv.innerHTML = `<h2>${title}</h2><p>${subtitle}</p>`;
}

// Helper function to get numeric value from pet property
function getPetNumericValue(pet, property) {
  const value = pet[property];
  if (value == null) return 0;
  
  if (typeof value === 'number') return value;
  
  // Parse string value (supports "1B", "500M", etc.)
  if (typeof parseValueString === 'function') {
    return parseValueString(value) || 0;
  }
  
  return parseFloat(value) || 0;
}

// Filter and sort pets based on current state (no API calls)
function filterAndSortPets() {
  let filteredPets = [...allPets];
  
  // Apply rarity filter from sidebar
  if (currentRarityFilter && currentRarityFilter !== 'all') {
    filteredPets = filteredPets.filter(pet => pet.rarity === currentRarityFilter);
  }
  
  // Apply search query
  if (currentSearchQuery.trim()) {
    const query = currentSearchQuery.toLowerCase();
    filteredPets = filteredPets.filter(pet => 
      pet.name && pet.name.toLowerCase().includes(query)
    );
  }
  
  // NEW: Apply advanced filters from filter panel
  if (typeof applyAdvancedFilters === 'function') {
    filteredPets = applyAdvancedFilters(filteredPets);
  }
  
  // Apply sort mode
  switch (currentSortMode) {
    case 'newest':
      filteredPets.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        return dateB - dateA;
      });
      break;
    case 'oldest':
      filteredPets.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        return dateA - dateB;
      });
      break;
    case 'highest':
      // Debug warning: Sort by value_normal descending using value translator
      filteredPets.sort((a, b) => {
        const valueA = getPetNumericValue(a, 'value_normal');
        const valueB = getPetNumericValue(b, 'value_normal');
        return valueB - valueA;
      });
      break;
    case 'default':
    default:
      // Debug warning: Default sort by value_normal descending using value translator
      filteredPets.sort((a, b) => {
        const valueA = getPetNumericValue(a, 'value_normal');
        const valueB = getPetNumericValue(b, 'value_normal');
        return valueB - valueA;
      });
      break;
  }
  
  renderPetsToGrid(filteredPets);
}

// Main render function - updates state and calls filter/sort
function renderPets(filterRarity = null) {
  // Update current filter
  if (filterRarity !== null) {
    currentRarityFilter = filterRarity;
  }
  
  console.log('[DEBUG] Rendering pets with filter:', currentRarityFilter, 'Total pets:', allPets.length);
  updateWelcomeMessage(currentRarityFilter);
  filterAndSortPets();
}

// NEW: Separate render function for grid display
function renderPetsToGrid(pets) {
  const container = document.getElementById('pets-container');
  if (!container) {
    console.warn('[DEBUG-WARNING] pets-container not found in renderPetsToGrid');
    return;
  }
  
  // Apply current view density to grid
  applyViewDensity();
  
  if (!pets || pets.length === 0) {
    container.innerHTML = '<div class="pets-loading">No pets found matching your criteria.</div>';
    return;
  }
  
  console.log('[DEBUG] Rendering', pets.length, 'pets to grid');
  const html = pets.map(pet => createPetCard(pet)).join('');
  container.innerHTML = html;
  
  // Re-apply visual effects
  if (typeof applyAllCardEffects === 'function') {
    applyAllCardEffects();
  }
  
  // Show admin buttons if logged in
  if (isAdminLoggedIn) {
    const adminActions = document.querySelectorAll('.pet-admin-actions');
    adminActions.forEach(el => el.classList.add('visible'));
  }
}

// Make renderPets globally accessible for trade calculator
window.renderPets = renderPets;

// =======================
// View Density Controls
// =======================

// Apply view density to pets grid
function applyViewDensity() {
  const container = document.getElementById('pets-container');
  if (!container) return;
  
  // Remove existing density classes
  container.classList.remove('density-7', 'density-9', 'density-11');
  
  // Add current density class
  container.classList.add(`density-${currentViewDensity}`);
  
  console.log('[DEBUG] Applied view density:', currentViewDensity);
}

// Change view density (7, 9, or 11 pets per row)
function setViewDensity(density) {
  if (![7, 9, 11].includes(density)) {
    console.warn('[DEBUG] Invalid density value:', density);
    return;
  }
  
  currentViewDensity = density;
  applyViewDensity();
  console.log('[DEBUG] View density changed to:', density);
}

// =======================
// jsDelivr Image Handling with Multi-Format Support
// =======================

// Debug warning: Construct jsDelivr CDN URL with format detection
function buildImageUrl(imageId, format = null) {
  if (!imageId) return null;
  
  // Clean the image ID and check if it already has an extension
  const cleanId = imageId.trim();
  const hasExtension = /\.(webp|png|jpg|jpeg|gif)$/i.test(cleanId);
  
  if (hasExtension) {
    // If extension provided, use as-is
    return `${JSDELIVR_BASE}/${cleanId}`;
  }
  
  // If no extension, use provided format or default to webp
  const extension = format || 'webp';
  return `${JSDELIVR_BASE}/${cleanId}.${extension}`;
}

// Debug warning: Try multiple image formats with automatic fallback
function buildImageUrlsWithFallback(imageId) {
  if (!imageId) return [];
  
  const cleanId = imageId.trim().replace(/\.(webp|png|jpg|jpeg|gif)$/i, '');
  
  // Return array of URLs to try in order
  return IMAGE_FORMATS.map(format => `${JSDELIVR_BASE}/${cleanId}.${format}`);
}

// =======================
// Pet Card Creation
// =======================

// Debug warning: Display stats with optional percentage symbol based on stats_type
function createPetCard(pet) {
  const rarityClass = getRarityClass(pet.rarity);
  
  // Debug warning: Build jsDelivr CDN URLs with fallback support
  let imageHtml;
  if (pet.image_url) {
    const imageUrls = buildImageUrlsWithFallback(pet.image_url);
    const primaryUrl = imageUrls[0];
    
    // Generate fallback chain for onerror
    const fallbackChain = imageUrls.slice(1).map((url, index) => 
      `this.onerror=${index === imageUrls.length - 2 ? 'null' : 'function(){this.src=\\\''+imageUrls[index+2]+'\\\'}'};this.src='${url}'`
    ).join(';');
    
    imageHtml = `<img src="${primaryUrl}" alt="${escapeHtml(pet.name)}" loading="lazy" onerror="${fallbackChain || 'this.onerror=null'};this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3)\\'>No Image</div>';">`;
    
    console.log('[DEBUG] Pet:', pet.name, '- Image ID:', pet.image_url, '- Primary URL:', primaryUrl);
  } else {
    imageHtml = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3)">No Image</div>`;
    console.warn('[DEBUG-WARNING] Pet:', pet.name, '- No image ID provided');
  }
  
  const lastUpdated = formatLastUpdated(pet.updated_at);
  
  // Add percentage symbol if stats_type is "percentage"
  const statsDisplay = pet.stats_type === 'percentage' 
    ? `${pet.stats || 0}%` 
    : (pet.stats || 0);
  
  return `
  <div class="pet-card" data-pet-id="${pet.id}">
    
    ${pet.description ? `
  <div class="pet-tooltip">
    <span class="tooltip-icon">?</span>
    <span class="tooltip-text">${escapeHtml(pet.description)}</span>
  </div>
` : ''}

      <div class="pet-image">
        ${imageHtml}
      </div>
      <div class="pet-info">
        <h3 class="pet-name">${escapeHtml(pet.name)}</h3>
        <span class="pet-rarity pet-rarity-${rarityClass}">${escapeHtml(pet.rarity)}</span>
      </div>
      <div class="pet-stats">
        <div class="pet-stat-row">
          <span class="pet-stat-label pet-stats-label">Stats</span>
          <span class="pet-stat-value pet-stats-value">${statsDisplay}</span>
        </div>
        <div class="pet-stat-row">
          <span class="pet-stat-label pet-normal-label">Normal</span>
          <span class="pet-stat-value pet-normal-value">${pet.value_normal || 0}</span>
        </div>
        <div class="pet-stat-row">
          <span class="pet-stat-label pet-golden-label">Golden</span>
          <span class="pet-stat-value pet-golden-value">${pet.value_golden || 0}</span>
        </div>
        <div class="pet-stat-row">
          <span class="pet-stat-label pet-rainbow-label">Rainbow</span>
          <span class="pet-stat-value pet-rainbow-value">${pet.value_rainbow || 0}</span>
        </div>
        <div class="pet-stat-row">
          <span class="pet-stat-label pet-void-label">Void</span>
          <span class="pet-stat-value pet-void-value">${pet.value_void || 0}</span>
        </div>
      </div>
      <div class="pet-updated">Updated ${lastUpdated}</div>
      <div class="pet-admin-actions">
        <button class="btn-edit" onclick="editPet(${pet.id})">Edit</button>
        <button class="btn-delete" onclick="deletePet(${pet.id})">Delete</button>
      </div>
    </div>
  `;
}

// Helper function to get rarity class
function getRarityClass(rarity) {
  const map = {
    'Legendary': 'legendary',
    'Mythical': 'mythical',
    'Secret I': 'secret-i',
    'Secret II': 'secret-ii',
    'Secret III': 'secret-iii',
    'Leaderboard': 'leaderboard',
    'Exclusive': 'exclusive'
  };
  return map[rarity] || 'mythical';
}

// Helper function to format last updated timestamp
function formatLastUpdated(timestamp) {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.toLocaleString('en', { month: 'short' });
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} - ${hours}:${minutes}`;
  } catch (err) {
    console.warn('[DEBUG-WARNING] Failed to format timestamp:', err);
    return 'Unknown';
  }
}

// Helper function to format numbers (removed - now displaying raw text values)
function formatNumber(num) {
  if (num == null) return '0';
  // Return as-is for text values like "30B", "1.5M"
  return String(num);
}

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Parse value string to number for sorting
function parseValueToNumber(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = String(value).trim().toUpperCase();
  
  // If it's already a plain number
  if (!isNaN(str)) return parseFloat(str);
  
  // Extract number and suffix
  const match = str.match(/^([\d.]+)([KMBTQQAQNSXSP])?$/);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  const suffix = match[2];
  
  // Multiplier map
  const multipliers = {
    'K': 1e3,      // Thousand
    'M': 1e6,      // Million
    'B': 1e9,      // Billion
    'T': 1e12,     // Trillion
    'QA': 1e15,    // Quadrillion
    'QN': 1e18,    // Quintillion
    'SX': 1e21,    // Sextillion
    'SP': 1e24     // Septillion
  };
  
  return num * (multipliers[suffix] || 1);
}

// Make globally accessible for trade calculator
window.parseValueToNumber = parseValueToNumber;

// =======================
// CRUD Operations
// =======================

async function addPet(petData) {
  if (!await verifyAdminBeforeAction()) return false;
  
  try {
    const res = await fetch(`${API_BASE}/api/pets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Username': adminCredentials.username,
        'X-Admin-Password': adminCredentials.password
      },
      body: JSON.stringify(petData)
    });
    
    if (res.status === 401) {
      console.warn('[DEBUG] Unauthorized - logging out');
      adminLogout();
      return false;
    }
    
    if (!res.ok) {
      console.warn('[DEBUG] Failed to add pet:', res.status);
      return false;
    }
    
    const newPet = await res.json();
    allPets.push(newPet);
    window.allPets = allPets; // Update global reference
    
    setCache(CACHE_KEY, allPets, THIRTY_MINUTES_MS);
    renderPets(currentRarityFilter);
    console.log('[DEBUG] Pet added:', newPet.name);
    return true;
  } catch (err) {
    console.warn('[DEBUG-WARNING] Add pet error:', err);
    return false;
  }
}

async function updatePet(petId, petData) {
  if (!await verifyAdminBeforeAction()) return false;
  
  try {
    const res = await fetch(`${API_BASE}/api/pets/${petId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Username': adminCredentials.username,
        'X-Admin-Password': adminCredentials.password
      },
      body: JSON.stringify(petData)
    });
    
    if (res.status === 401) {
      console.warn('[DEBUG] Unauthorized - logging out');
      adminLogout();
      return false;
    }
    
    if (!res.ok) {
      console.warn('[DEBUG] Failed to update pet:', res.status);
      return false;
    }
    
    const updatedPet = await res.json();
    const index = allPets.findIndex(p => p.id === petId);
    if (index !== -1) {
      allPets[index] = updatedPet;
    }
    window.allPets = allPets; // Update global reference
    
    setCache(CACHE_KEY, allPets, THIRTY_MINUTES_MS);
    renderPets(currentRarityFilter);
    console.log('[DEBUG] Pet updated:', updatedPet.name);
    return true;
  } catch (err) {
    console.warn('[DEBUG-WARNING] Update pet error:', err);
    return false;
  }
}

async function deletePet(petId) {
  if (!confirm('Are you sure you want to delete this pet?')) return;
  
  if (!await verifyAdminBeforeAction()) return;
  
  try {
    const res = await fetch(`${API_BASE}/api/pets/${petId}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Username': adminCredentials.username,
        'X-Admin-Password': adminCredentials.password
      }
    });
    
    if (res.status === 401) {
      console.warn('[DEBUG] Unauthorized - logging out');
      adminLogout();
      return;
    }
    
    if (!res.ok) {
      console.warn('[DEBUG] Failed to delete pet:', res.status);
      alert('Failed to delete pet. Please try again.');
      return;
    }
    
    allPets = allPets.filter(p => p.id !== petId);
    window.allPets = allPets; // Update global reference
    
    setCache(CACHE_KEY, allPets, THIRTY_MINUTES_MS);
    renderPets(currentRarityFilter);
    console.log('[DEBUG] Pet deleted:', petId);
  } catch (err) {
    console.warn('[DEBUG-WARNING] Delete pet error:', err);
    alert('Failed to delete pet. Please try again.');
  }
}

// Make deletePet globally accessible
window.deletePet = deletePet;

function editPet(petId) {
  const pet = allPets.find(p => p.id === petId);
  if (pet) {
    openPetModal(pet);
  }
}

// Make editPet globally accessible
window.editPet = editPet;

// =======================
// Modal Management
// =======================
let currentEditingPetId = null;

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  const form = document.getElementById('login-form');
  const message = document.getElementById('login-message');
  
  if (form) form.reset();
  if (message) message.textContent = '';
  
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
}

// Debug warning: Updated to handle image ID input (for jsDelivr CDN with multi-format support)
function openPetModal(pet = null) {
  const modal = document.getElementById('pet-modal');
  const form = document.getElementById('pet-form');
  const modalTitle = document.getElementById('modal-title');
  const message = document.getElementById('pet-form-message');
  const imagePreview = document.getElementById('image-preview');
  
  if (form) form.reset();
  if (message) message.textContent = '';
  if (imagePreview) imagePreview.classList.add('hidden');
  
  if (pet) {
    // Edit mode
    currentEditingPetId = pet.id;
    
    if (modalTitle) modalTitle.textContent = 'Edit Pet';
    
    // Populate form fields
    document.getElementById('pet-name').value = pet.name;
    document.getElementById('pet-rarity').value = pet.rarity;
    document.getElementById('pet-stats-type').value = pet.stats_type || 'value';
    document.getElementById('pet-stats').value = pet.stats;
    document.getElementById('pet-value-normal').value = pet.value_normal;
    document.getElementById('pet-value-golden').value = pet.value_golden;
    document.getElementById('pet-value-rainbow').value = pet.value_rainbow;
    document.getElementById('pet-value-void').value = pet.value_void;
    
    // Populate image ID field (store whatever is in database as-is)
    document.getElementById('pet-description').value = pet.description
    document.getElementById('pet-image-id').value = pet.image_url || '';
    
    // Show image preview if exists
    if (pet.image_url && imagePreview) {
      const imageUrl = buildImageUrl(pet.image_url);
      if (imageUrl) {
        const previewImg = document.getElementById('preview-img');
        previewImg.src = imageUrl;
        
        // Setup fallback chain for preview
        const imageUrls = buildImageUrlsWithFallback(pet.image_url);
        let currentIndex = 0;
        previewImg.onerror = function() {
          currentIndex++;
          if (currentIndex < imageUrls.length) {
            this.src = imageUrls[currentIndex];
          } else {
            this.onerror = null;
            imagePreview.classList.add('hidden');
          }
        };
        
        imagePreview.classList.remove('hidden');
      }
    }
  } else {
    // Add mode - set default stats_type to "value"
    currentEditingPetId = null;
    if (modalTitle) modalTitle.textContent = 'Add Pet';
    document.getElementById('pet-stats-type').value = 'value';
  }
  
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closePetModal() {
  const modal = document.getElementById('pet-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }
  currentEditingPetId = null;
}

// =======================
// Event Listeners
// =======================
function initEventListeners() {
  // Admin icon button
  const adminIconBtn = document.getElementById('admin-icon-btn');
  if (adminIconBtn) {
    adminIconBtn.addEventListener('click', openLoginModal);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', adminLogout);
  }
  
  // Login modal close
  const loginModalClose = document.getElementById('login-modal-close');
  if (loginModalClose) {
    loginModalClose.addEventListener('click', closeLoginModal);
  }
  
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    const backdrop = loginModal.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeLoginModal);
    }
  }
  
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      const message = document.getElementById('login-message');
      
      message.textContent = 'Verifying credentials...';
      message.className = 'form-message';
      
      const success = await adminLogin(username, password);
      
      if (success) {
        message.textContent = 'Login successful!';
        message.className = 'form-message success';
      } else {
        message.textContent = 'Invalid username or password.';
        message.className = 'form-message error';
      }
    });
  }
  
  // Pet modal close
  const modalClose = document.getElementById('modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', closePetModal);
  }
  
  const cancelBtn = document.getElementById('cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closePetModal);
  }
  
  const petModal = document.getElementById('pet-modal');
  if (petModal) {
    const backdrop = petModal.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closePetModal);
    }
  }
  
  // Pet form submission
  const petForm = document.getElementById('pet-form');
  if (petForm) {
    petForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const message = document.getElementById('pet-form-message');
      
      // Get image ID input (just the ID like "002" or "002.webp")
      const imageIdInput = document.getElementById('pet-image-id').value.trim();
      
      // Get values as text, not as integers
      const petData = {
        name: document.getElementById('pet-name').value,
        rarity: document.getElementById('pet-rarity').value,
        stats_type: document.getElementById('pet-stats-type').value,
        stats: document.getElementById('pet-stats').value || '0',
        value_normal: document.getElementById('pet-value-normal').value || '0',
        value_golden: document.getElementById('pet-value-golden').value || '0',
        value_rainbow: document.getElementById('pet-value-rainbow').value || '0',
        value_void: document.getElementById('pet-value-void').value || '0',
        image_url: imageIdInput || null // Store ID with or without extension
      };
      
      console.log('[DEBUG] Submitting pet data:', petData);
      
      // Submit pet data
      await submitPet(petData, message);
    });
  }
  
  async function submitPet(petData, message) {
    let success;
    if (currentEditingPetId) {
      success = await updatePet(currentEditingPetId, petData);
    } else {
      success = await addPet(petData);
    }
    
    if (success) {
      message.textContent = 'Pet saved successfully!';
      message.className = 'form-message success';
      setTimeout(closePetModal, 1000);
    } else {
      message.textContent = 'Failed to save pet. Please try again.';
      message.className = 'form-message error';
    }
  }
  
  // Debug warning: Image ID input live preview with multi-format support
  const imageIdInput = document.getElementById('pet-image-id');
  if (imageIdInput) {
    imageIdInput.addEventListener('input', (e) => {
      const imageId = e.target.value.trim();
      const imagePreview = document.getElementById('image-preview');
      const previewImg = document.getElementById('preview-img');
      
      if (imageId && imagePreview && previewImg) {
        const imageUrl = buildImageUrl(imageId);
        previewImg.src = imageUrl;
        
        // Setup fallback chain for preview
        const imageUrls = buildImageUrlsWithFallback(imageId);
        let currentIndex = 0;
        previewImg.onerror = function() {
          currentIndex++;
          if (currentIndex < imageUrls.length) {
            this.src = imageUrls[currentIndex];
          } else {
            this.onerror = null;
            imagePreview.classList.add('hidden');
            console.warn('[DEBUG-WARNING] Failed to load preview image with any format');
          }
        };
        
        imagePreview.classList.remove('hidden');
        console.log('[DEBUG] Preview Image ID:', imageId, '- Primary URL:', imageUrl);
      } else if (imagePreview) {
        imagePreview.classList.add('hidden');
      }
    });
  }
  
  // Search input - real-time filtering
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderPets(); // Re-render with search applied (no API call)
    });
  }
  
  // Zoom Control Buttons - change view density
  const zoomButtons = document.querySelectorAll('.zoom-btn');
  zoomButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const density = parseInt(btn.dataset.density);
      
      // Update active state on buttons
      zoomButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Apply density change
      setViewDensity(density);
      console.log('[DEBUG] Zoom level changed to:', density);
    });
  });
  
  // NEW: Filter Panel Button Click (opens advanced filter modal)
  const filterBtn = document.getElementById('filter-btn');
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Close filter menu dropdown if open
      const filterMenu = document.getElementById('filter-menu');
      if (filterMenu) {
        filterMenu.classList.add('hidden');
      }
      
      // Open advanced filter panel
      if (typeof openFilterPanel === 'function') {
        openFilterPanel();
      } else {
        console.warn('[DEBUG-WARNING] Filter panel not initialized');
      }
    });
  }
  
  // Filter options - apply sort mode (keep existing dropdown functionality)
  const filterOptions = document.querySelectorAll('.filter-option');
  filterOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active state
      filterOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      // Update sort mode
      currentSortMode = option.dataset.sort;
      
      // Close dropdown
      const filterMenu = document.getElementById('filter-menu');
      if (filterMenu) {
        filterMenu.classList.add('hidden');
      }
      
      // Re-render with new sort (no API call)
      renderPets();
      console.log('[DEBUG] Sort mode changed to:', currentSortMode);
    });
  });
  
  // Sidebar navigation (rarity filters and admin links)
  document.addEventListener('click', (e) => {
    const navLink = e.target.closest('.nav-link');
    if (!navLink) return;
    
    e.preventDefault();
    
    // Trade Calculator button
    if (navLink.id === 'nav-trade-calculator') {
      if (typeof window.openTradeCalculator === 'function') {
        window.openTradeCalculator();
      } else {
        console.warn('[DEBUG-WARNING] Trade calculator not initialized');
      }
      return;
    }
    
    // Add Pet
    if (navLink.id === 'nav-add-pet') {
      openPetModal();
      return;
    }
    
    // Clear Cache
    if (navLink.id === 'nav-clear-cache') {
      clearCache(CACHE_KEY);
      loadPets(true);
      alert('Cache cleared. Pets reloaded from server.');
      return;
    }
    
    // Rarity filter - close trade calculator if open
    const rarity = navLink.dataset.rarity;
    if (rarity !== undefined) {
      // Close trade calculator if open
      if (typeof window.closeTradeCalculator === 'function' && window.isTradeCalculatorOpen) {
        window.closeTradeCalculator();
      }
      
      // Update active state
      document.querySelectorAll('.nav-link[data-rarity]').forEach(link => 
        link.classList.remove('active')
      );
      navLink.classList.add('active');
      
      // Render pets with rarity filter
      renderPets(rarity);
    }
  });
}

// =======================
// Initialization
// =======================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[DEBUG] Page loaded, initializing...');
  
  clearOldCaches();
  generateSidebar();
  checkAdminSession();
  
  // Load pets and wait for completion before continuing
  await loadPets();
  
  initEventListeners();
  
  // Initialize view density
  applyViewDensity();
  
  // Initialize trade calculator
  if (typeof window.initTradeCalculator === 'function') {
    window.initTradeCalculator();
    console.log('[DEBUG] Trade calculator initialized');
  } else {
    console.warn('[DEBUG-WARNING] Trade calculator script not loaded');
  }
});

// Make functions globally accessible
window.setViewDensity = setViewDensity;
window.filterAndSortPets = filterAndSortPets;
window.buildImageUrl = buildImageUrl;
window.buildImageUrlsWithFallback = buildImageUrlsWithFallback;

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /main.js
