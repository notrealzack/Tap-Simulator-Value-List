// File type: Client-side JavaScript (for GitHub Pages)
// Path: /main.js (UPDATED - Better debugging and credential handling)

// Debug warning: Main application logic with improved credential debugging

// =======================
// Configuration
// =======================

const API_BASE = "https://ts-value-list-proxy.vercel.app";
const CACHE_KEY = "rpv_pets_cache";
const ADMIN_KEY = "rpv_admin_session";
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

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
    
    // Verify credentials with backend
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

    // Store credentials for future requests
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
  
  window.dispatchEvent(new Event('adminLoggedIn'));
  
  // Show admin action buttons on all pet cards
  const adminActions = document.querySelectorAll('.pet-admin-actions');
  adminActions.forEach(el => el.classList.add('visible'));
}

function hideAdminUI() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.classList.add('hidden');
  
  window.dispatchEvent(new Event('adminLoggedOut'));
  
  // Hide admin action buttons
  const adminActions = document.querySelectorAll('.pet-admin-actions');
  adminActions.forEach(el => el.classList.remove('visible'));
}

// =======================
// Pet data management
// =======================

let allPets = [];

async function loadPets() {
  const container = document.getElementById('pets-container');
  container.innerHTML = '<div class="pets-loading">Loading pets...</div>';

  // Try cache first
  const cached = getCache(CACHE_KEY);
  if (cached && Array.isArray(cached)) {
    allPets = cached;
    renderPets();
    return;
  }

  // Fetch from backend
  try {
    const res = await fetch(`${API_BASE}/api/pets`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    allPets = Array.isArray(data) ? data : [];
    setCache(CACHE_KEY, allPets, THIRTY_MINUTES_MS);
    renderPets();
  } catch (err) {
    console.warn('[DEBUG-WARNING] Failed to load pets:', err);
    container.innerHTML = '<div class="pets-loading">Failed to load pets. Try refreshing.</div>';
  }
}

function renderPets(filterRarity = null) {
  const container = document.getElementById('pets-container');
  
  // Filter by rarity if specified
  let petsToRender = allPets;
  if (filterRarity) {
    petsToRender = allPets.filter(pet => pet.rarity === filterRarity);
  }

  if (petsToRender.length === 0) {
    container.innerHTML = '<div class="pets-loading">No pets found.</div>';
    return;
  }

  // Sort by value descending
  petsToRender.sort((a, b) => (b.value || 0) - (a.value || 0));

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
  const imageUrl = pet.image_url || '';
  const lastUpdated = formatLastUpdated(pet.updated_at);

  return `
    <article class="pet-card" data-pet-id="${pet.id}">
      <div class="pet-image">
        ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(pet.name)}" loading="lazy" />` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">No Image</div>'}
      </div>
      <div class="pet-header">
        <div class="pet-name">${escapeHtml(pet.name)}</div>
        <div class="pet-rarity pet-rarity-${rarityClass}">${escapeHtml(pet.rarity)}</div>
      </div>
      <div class="pet-stats">
        <div class="pet-stat-row">
          <span class="pet-stat-label">Tap Stats:</span>
          <span class="pet-stat-value">${formatNumber(pet.tap_stats)}</span>
        </div>
        <div class="pet-stat-row">
          <span class="pet-stat-label">Gem Stats:</span>
          <span class="pet-stat-value">${formatNumber(pet.gem_stats)}</span>
        </div>
      </div>
      <div class="pet-value">Value: ${formatNumber(pet.value)}</div>
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
  // Verify credentials before action
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
  // Verify credentials before action
  if (!(await verifyAdminBeforeAction())) {
    alert('Your session has expired or credentials are invalid. Please login again.');
    return false;
  }

  console.log('[DEBUG] Sending update request for pet', petId, 'with credentials:', adminCredentials.username);

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
      setCache(CACHE_KEY, allPets, THIRTY_MINUTES_MS);
      renderPets();
    }
    return true;
  } catch (err) {
    console.warn('[DEBUG-WARNING] Update pet error:', err);
    return false;
  }
}

async function deletePet(petId) {
  if (!confirm('Are you sure you want to delete this pet?')) return;

  // Verify credentials before action
  if (!(await verifyAdminBeforeAction())) {
    alert('Your session has expired or credentials are invalid. Please login again.');
    return;
  }

  console.log('[DEBUG] Sending delete request for pet', petId, 'with credentials:', adminCredentials.username);

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

// Make functions global for onclick handlers
window.editPet = function(petId) {
  const pet = allPets.find(p => p.id === petId);
  if (!pet) return;
  openPetModal(pet);
};

window.deletePet = deletePet;

// =======================
// Modal management
// =======================

let currentEditingPetId = null;

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  const form = document.getElementById('login-form');
  const message = document.getElementById('login-message');
  
  form.reset();
  message.textContent = '';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function openPetModal(pet = null) {
  const modal = document.getElementById('pet-modal');
  const form = document.getElementById('pet-form');
  const title = document.getElementById('modal-title');
  const message = document.getElementById('pet-form-message');

  // Reset form
  form.reset();
  message.textContent = '';
  document.getElementById('image-preview').classList.add('hidden');

  if (pet) {
    // Edit mode
    title.textContent = 'Edit Pet';
    currentEditingPetId = pet.id;
    document.getElementById('pet-id').value = pet.id;
    document.getElementById('pet-name').value = pet.name;
    document.getElementById('pet-rarity').value = pet.rarity;
    document.getElementById('pet-tap-stats').value = pet.tap_stats || 0;
    document.getElementById('pet-gem-stats').value = pet.gem_stats || 0;
    document.getElementById('pet-value').value = pet.value || 0;

    // Show current image if exists
    if (pet.image_url) {
      const preview = document.getElementById('image-preview');
      const previewImg = document.getElementById('preview-img');
      previewImg.src = pet.image_url;
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
  // Admin icon button opens login modal
  const adminIconBtn = document.getElementById('admin-icon-btn');
  if (adminIconBtn) {
    adminIconBtn.addEventListener('click', openLoginModal);
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', adminLogout);
  }

  // Login modal controls
  const loginModalClose = document.getElementById('login-modal-close');
  if (loginModalClose) {
    loginModalClose.addEventListener('click', closeLoginModal);
  }

  const loginModalBackdrop = document.querySelector('#login-modal .modal-backdrop');
  if (loginModalBackdrop) {
    loginModalBackdrop.addEventListener('click', closeLoginModal);
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const message = document.getElementById('login-message');

    message.textContent = 'Verifying credentials...';
    message.style.color = '#a8b3cf';

    const success = await adminLogin(username, password);
    
    if (success) {
      message.textContent = 'Login successful!';
      message.style.color = '#00ff88';
    } else {
      message.textContent = 'Invalid credentials';
      message.style.color = '#ff4343';
    }
  });

  // Pet modal controls
  document.getElementById('modal-close').addEventListener('click', closePetModal);
  document.getElementById('cancel-btn').addEventListener('click', closePetModal);
  
  const petModalBackdrop = document.querySelector('#pet-modal .modal-backdrop');
  if (petModalBackdrop) {
    petModalBackdrop.addEventListener('click', closePetModal);
  }

  // Pet form submit
  const petForm = document.getElementById('pet-form');
  petForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('pet-form-message');
    message.textContent = '';

    const petData = {
      name: document.getElementById('pet-name').value.trim(),
      rarity: document.getElementById('pet-rarity').value,
      tap_stats: parseInt(document.getElementById('pet-tap-stats').value) || 0,
      gem_stats: parseInt(document.getElementById('pet-gem-stats').value) || 0,
      value: parseInt(document.getElementById('pet-value').value) || 0,
      image_url: document.getElementById('preview-img').src || ''
    };

    if (!petData.name || !petData.rarity) {
      message.textContent = 'Name and rarity are required';
      return;
    }

    let success = false;
    if (currentEditingPetId) {
      console.log('[DEBUG] Submitting edit for pet ID:', currentEditingPetId);
      success = await updatePet(currentEditingPetId, petData);
    } else {
      console.log('[DEBUG] Submitting add for new pet');
      success = await addPet(petData);
    }

    if (success) {
      message.textContent = 'Pet saved successfully!';
      message.style.color = '#00ff88';
      setTimeout(closePetModal, 1000);
    } else {
      message.textContent = 'Failed to save pet. Check console for details.';
      message.style.color = '#ff4343';
    }
  });

  // Image preview
  const imageInput = document.getElementById('pet-image');
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = document.getElementById('image-preview');
      const previewImg = document.getElementById('preview-img');
      previewImg.src = event.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });

  // Custom events from sidebar
  window.addEventListener('openAddPetModal', () => {
    if (isAdminLoggedIn) openPetModal();
  });

  window.addEventListener('adminLogout', adminLogout);

  window.addEventListener('rarityFilterChanged', (e) => {
    renderPets(e.detail.rarity);
  });
}

// =======================
// Initialization
// =======================

document.addEventListener('DOMContentLoaded', () => {
  checkAdminSession();
  loadPets();
  initEventListeners();
});

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /main.js
