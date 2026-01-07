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

// Track current rarity filter for dynamic welcome message
let currentRarityFilter = null;

// Track search and sort state
let currentSearchQuery = "";
let currentSortMode = "default"; // default, newest, oldest, highest

// Clear old cache versions on load
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
    const item = { value, expiry: ttl ? Date.now() + ttl : null };
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
// Sidebar generation
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
      ${rarities.map(r => `
        <a href="#" class="nav-link" data-rarity="${r.value}">${r.name}</a>
      `).join('')}
    </nav>
    <nav id="admin-nav-section" class="nav-section admin-only" style="display:none;">
      <a href="#" class="nav-link" id="nav-add-pet">+ Add Pet</a>
      <a href="#" class="nav-link" id="nav-clear-cache">🔄 Clear Cache</a>
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
    console.log('[DEBUG] Admin session restored for:', session.username);
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
  if (logoutBtn) logoutBtn.classList.remove('hidden');
  
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
  if (logoutBtn) logoutBtn.classList.add('hidden');
  
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

async function loadPets(forceRefresh = false) {
  const container = document.getElementById('pets-container');
  container.innerHTML = '<div class="pets-loading">Loading pets...</div>';

  // Try cache first unless force refresh
  if (!forceRefresh) {
    const cached = getCache(CACHE_KEY);
    if (cached && Array.isArray(cached)) {
      allPets = cached;
      renderPets();
      return;
    }
  }

  // Fetch from backend with timestamp to prevent caching
  try {
    const res = await fetch(`${API_BASE}/api/pets?t=${Date.now()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    allPets = Array.isArray(data) ? data : [];
    setCache(CACHE_KEY, allPets, THIRTY_MINUTES_MS);
    renderPets();
    console.log('[DEBUG] Loaded', allPets.length, 'pets from API');
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

  welcomeDiv.innerHTML = `
    <h2>${title}</h2>
    <p>${subtitle}</p>
  `;
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

  // Apply sort mode
  switch (currentSortMode) {
    case 'newest':
      // Sort by updated_at descending (newest first)
      filteredPets.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        return dateB - dateA;
      });
      break;
    
    case 'oldest':
      // Sort by updated_at ascending (oldest first)
      filteredPets.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        return dateA - dateB;
      });
      break;
    
    case 'highest':
      // Sort by value_normal descending (highest value first)
      filteredPets.sort((a, b) => (b.value_normal || 0) - (a.value_normal || 0));
      break;
    
    case 'default':
    default:
      // Default sort by value_normal descending
      filteredPets.sort((a, b) => (b.value_normal || 0) - (a.value_normal || 0));
      break;
  }

  return filteredPets;
}

function renderPets(filterRarity = null) {
  const container = document.getElementById('pets-container');
  
  // Update current filter and welcome message
  if (filterRarity !== null) {
    currentRarityFilter = filterRarity;
  }
  updateWelcomeMessage(currentRarityFilter);

  // Get filtered and sorted pets
  const petsToRender = filterAndSortPets();

  if (petsToRender.length === 0) {
    container.innerHTML = '<div class="pets-loading">No pets found.</div>';
    return;
  }

  const html = petsToRender.map(pet => createPetCard(pet)).join('');
  container.innerHTML = html;

  // Re-apply visual effects
  if (window.TextGlimmer) window.TextGlimmer.refresh();
  if (window.SecretEffects) window.SecretEffects.refresh();

  // Show admin buttons if logged in
  if (isAdminLoggedIn) {
    const adminActions = document.querySelectorAll('.pet-admin-actions');
    adminActions.forEach(el => el.classList.add('visible'));
  }
}

function createPetCard(pet) {
  const rarityClass = getRarityClass(pet.rarity);
  const imageUrl = pet.image_url;
  const lastUpdated = formatLastUpdated(pet.updated_at);

  return `
    <article class="pet-card" data-pet-id="${pet.id}">
      <div class="pet-image">
        ${imageUrl ? 
          `<img src="${imageUrl}" alt="${escapeHtml(pet.name)}" loading="lazy">` :
          `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">No Image</div>`
        }
      </div>
      <div class="pet-info">
        <div class="pet-name">${escapeHtml(pet.name)}</div>
        <div class="pet-rarity pet-rarity-${rarityClass}">${escapeHtml(pet.rarity)}</div>
      </div>
      <div class="pet-stats">
        <div class="pet-stat-row">
          <span class="pet-stat-label">Stats:</span>
          <span class="pet-stat-value">${formatNumber(pet.stats)}</span>
        </div>
        <div class="pet-stat-row">
          <span class="pet-stat-label">Normal:</span>
          <span class="pet-stat-value">${formatNumber(pet.value_normal)}</span>
        </div>
        <div class="pet-stat-row">
          <span class="pet-stat-label">Golden:</span>
          <span class="pet-stat-value">${formatNumber(pet.value_golden)}</span>
        </div>
        <div class="pet-stat-row">
          <span class="pet-stat-label">Rainbow:</span>
          <span class="pet-stat-value">${formatNumber(pet.value_rainbow)}</span>
        </div>
      </div>
      <div class="pet-updated">Updated: ${lastUpdated}</div>
      <div class="pet-admin-actions">
        <button class="btn-edit" onclick="editPet(${pet.id})">Edit</button>
        <button class="btn-delete" onclick="deletePet(${pet.id})">Delete</button>
      </div>
    </article>
  `;
}

function getRarityClass(rarity) {
  const map = {
    'Mythical': 'mythical',
    'Secret I': 'secret-i',
    'Secret II': 'secret-ii',
    'Secret III': 'secret-iii',
    'Leaderboard': 'leaderboard',
    'Exclusive': 'exclusive'
  };
  return map[rarity] || 'mythical';
}

function formatLastUpdated(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} - ${hours}:${minutes}`;
}

function formatNumber(num) {
  if (num == null) return '0';
  return Number(num).toLocaleString();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =======================
// CRUD operations
// =======================
async function addPet(petData) {
  if (!(await verifyAdminBeforeAction())) {
    alert('Your session has expired or credentials are invalid. Please login again.');
    return false;
  }

  console.log('[DEBUG] Sending add request with credentials:', adminCredentials.username);

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

    console.log('[DEBUG] Add pet response status:', res.status);

    if (res.status === 401) {
      console.warn('[DEBUG] Unauthorized - logging out');
      adminLogout();
      return false;
    }

    if (!res.ok) {
      const errorData = await res.json();
      console.warn('[DEBUG] Add pet failed:', errorData);
      throw new Error(`HTTP ${res.status}`);
    }

    const newPet = await res.json();
    allPets.push(newPet);
    setCache(CACHE_KEY, allPets, THIRTY_MINUTES_MS);
    renderPets();
    return true;
  } catch (err) {
    console.warn('[DEBUG-WARNING] Add pet error:', err);
    return false;
  }
}

async function updatePet(petId, petData) {
  if (!(await verifyAdminBeforeAction())) {
    alert('Your session has expired or credentials are invalid. Please login again.');
    return false;
  }

  console.log('[DEBUG] Sending update request for pet:', petId, 'with credentials:', adminCredentials.username);

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

    console.log('[DEBUG] Update pet response status:', res.status);

    if (res.status === 401) {
      console.warn('[DEBUG] Unauthorized - logging out');
      adminLogout();
      return false;
    }

    if (!res.ok) {
      const errorData = await res.json();
      console.warn('[DEBUG] Update pet failed:', errorData);
      throw new Error(`HTTP ${res.status}`);
    }

    const updatedPet = await res.json();
    const index = allPets.findIndex(p => p.id === petId);
    if (index !== -1) {
      allPets[index] = updatedPet;
    }
    setCache(CACHE_KEY, allPets, THIRTY_MINUTES_MS);
    renderPets();
    return true;
  } catch (err) {
    console.warn('[DEBUG-WARNING] Update pet error:', err);
    return false;
  }
}

async function deletePet(petId) {
  if (!confirm('Are you sure you want to delete this pet?')) {
    return;
  }

  if (!(await verifyAdminBeforeAction())) {
    alert('Your session has expired or credentials are invalid. Please login again.');
    return;
  }

  console.log('[DEBUG] Sending delete request for pet:', petId);

  try {
    const res = await fetch(`${API_BASE}/api/pets/${petId}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Username': adminCredentials.username,
        'X-Admin-Password': adminCredentials.password
      }
    });

    console.log('[DEBUG] Delete pet response status:', res.status);

    if (res.status === 401) {
      console.warn('[DEBUG] Unauthorized - logging out');
      adminLogout();
      return;
    }

    if (!res.ok) {
      const errorData = await res.json();
      console.warn('[DEBUG] Delete pet failed:', errorData);
      throw new Error(`HTTP ${res.status}`);
    }

    allPets = allPets.filter(p => p.id !== petId);
    setCache(CACHE_KEY, allPets, THIRTY_MINUTES_MS);
    renderPets();
  } catch (err) {
    console.warn('[DEBUG-WARNING] Delete pet error:', err);
    alert('Failed to delete pet. Please try again.');
  }
}

// Make deletePet available globally for onclick handlers
window.deletePet = deletePet;

function editPet(petId) {
  const pet = allPets.find(p => p.id === petId);
  if (!pet) {
    alert('Pet not found');
    return;
  }
  openPetModal(pet);
}

// Make editPet available globally for onclick handlers
window.editPet = editPet;

// =======================
// Modal management
// =======================
function openLoginModal() {
  const modal = document.getElementById('login-modal');
  const form = document.getElementById('login-form');
  const message = document.getElementById('login-message');
  
  form.reset();
  message.textContent = '';
  message.className = 'form-message';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

let currentEditingPetId = null;

function openPetModal(pet = null) {
  const modal = document.getElementById('pet-modal');
  const form = document.getElementById('pet-form');
  const title = document.getElementById('modal-title');
  const message = document.getElementById('pet-form-message');
  const preview = document.getElementById('image-preview');

  form.reset();
  message.textContent = '';
  message.className = 'form-message';
  preview.classList.add('hidden');

  if (pet) {
    // Edit mode
    title.textContent = 'Edit Pet';
    currentEditingPetId = pet.id;
    document.getElementById('pet-name').value = pet.name || '';
    document.getElementById('pet-rarity').value = pet.rarity || '';
    document.getElementById('pet-stats').value = pet.stats || 0;
    document.getElementById('pet-value-normal').value = pet.value_normal || 0;
    document.getElementById('pet-value-golden').value = pet.value_golden || 0;
    document.getElementById('pet-value-rainbow').value = pet.value_rainbow || 0;
    
    if (pet.image_url) {
      document.getElementById('preview-img').src = pet.image_url;
      preview.classList.remove('hidden');
    }
  } else {
    // Add mode
    title.textContent = 'Add Pet';
    currentEditingPetId = null;
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closePetModal() {
  const modal = document.getElementById('pet-modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  currentEditingPetId = null;
}

// =======================
// Event listeners
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
  const loginModalBackdrop = document.querySelector('#login-modal .modal-backdrop');
  if (loginModalClose) loginModalClose.addEventListener('click', closeLoginModal);
  if (loginModalBackdrop) loginModalBackdrop.addEventListener('click', closeLoginModal);

  // Login form submit
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const message = document.getElementById('login-message');

      message.textContent = 'Verifying credentials...';
      message.className = 'form-message';

      const success = await adminLogin(username, password);

      if (success) {
        message.textContent = 'Login successful!';
        message.classList.add('success');
      } else {
        message.textContent = 'Invalid username or password.';
        message.classList.add('error');
      }
    });
  }

  // Pet modal close
  const petModalClose = document.getElementById('modal-close');
  const petModalBackdrop = document.querySelector('#pet-modal .modal-backdrop');
  const cancelBtn = document.getElementById('cancel-btn');
  if (petModalClose) petModalClose.addEventListener('click', closePetModal);
  if (petModalBackdrop) petModalBackdrop.addEventListener('click', closePetModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closePetModal);

  // Pet form submit
  const petForm = document.getElementById('pet-form');
  if (petForm) {
    petForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const petData = {
        name: document.getElementById('pet-name').value.trim(),
        rarity: document.getElementById('pet-rarity').value,
        stats: parseInt(document.getElementById('pet-stats').value) || 0,
        value_normal: parseInt(document.getElementById('pet-value-normal').value) || 0,
        value_golden: parseInt(document.getElementById('pet-value-golden').value) || 0,
        value_rainbow: parseInt(document.getElementById('pet-value-rainbow').value) || 0,
        image_url: document.getElementById('preview-img').src || null
      };

      const message = document.getElementById('pet-form-message');

      if (!petData.name || !petData.rarity) {
        message.textContent = 'Name and rarity are required.';
        message.className = 'form-message error';
        return;
      }

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
    });
  }

  // Image preview
  const imageInput = document.getElementById('pet-image');
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('preview-img').src = event.target.result;
          document.getElementById('image-preview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
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

  // Filter button - toggle dropdown
  const filterBtn = document.getElementById('filter-btn');
  const filterMenu = document.getElementById('filter-menu');
  if (filterBtn && filterMenu) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle('hidden');
      filterBtn.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
        filterMenu.classList.add('hidden');
        filterBtn.classList.remove('active');
      }
    });
  }

  // Filter options - apply sort mode
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
      filterMenu.classList.add('hidden');
      filterBtn.classList.remove('active');
      
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

    // Rarity filter
    const rarity = navLink.dataset.rarity;
    if (rarity !== undefined) {
      // Update active state
      document.querySelectorAll('.nav-link[data-rarity]').forEach(link => {
        link.classList.remove('active');
      });
      navLink.classList.add('active');

      // Render pets with rarity filter
      renderPets(rarity);
    }
  });
}

// =======================
// Initialization
// =======================
document.addEventListener('DOMContentLoaded', () => {
  clearOldCaches();
  generateSidebar();
  checkAdminSession();
  loadPets();
  initEventListeners();
});

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /main.js
