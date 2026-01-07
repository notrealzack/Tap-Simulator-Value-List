// File type: Client-side JavaScript (for GitHub Pages)
// Path: /main.js

// =======================
// Simple localStorage cache with expiry
// =======================

// Debug warning: localStorage is used with a 30-minute TTL; expired entries are auto-cleared.
const CACHE_KEYS = {
  PETS: "rpv_pets_cache",
  ONLINE: "rpv_online_cache",
  ADMIN: "rpv_admin_session"
};

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

/**
 * Save a value into localStorage with an expiry timestamp.
 */
function setCache(key, value, ttlMs) {
  try {
    const item = {
      value,
      expiry: ttlMs ? Date.now() + ttlMs : null
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (err) {
    console.warn("[DEBUG-WARNING] Failed to store cache key:", key, err);
  }
}

/**
 * Read a value from localStorage and respect expiry.
 */
function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const item = JSON.parse(raw);
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key);
      console.warn("[DEBUG-WARNING] Cache expired and cleared for key:", key);
      return null;
    }
    return item.value;
  } catch (err) {
    console.warn("[DEBUG-WARNING] Failed to read cache key:", key, err);
    return null;
  }
}

/**
 * Clear a cache key explicitly.
 */
function clearCache(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn("[DEBUG-WARNING] Failed to clear cache key:", key, err);
  }
}

// =======================
// DOM helpers
// =======================

function $(selector) {
  return document.querySelector(selector);
}

// Safe way to attach event listeners.
function on(element, event, handler) {
  if (!element) return;
  element.addEventListener(event, handler);
}

// =======================
// Pet list logic
// =======================

// Debug warning: API_BASE now points to your live Vercel backend
const API_BASE = "https://ts-value-list-proxy-qcd33g150-astros-projects-7d607cbf.vercel.app";
const PETS_ENDPOINT = "/api/pets";
const ONLINE_ENDPOINT = "/api/online";

/**
 * Fetch pets from backend or cache (cache-first, 30-minute TTL).
 */
async function loadPets() {
  const petListContainer = $("#pet-list");
  if (!petListContainer) {
    console.warn("[DEBUG-WARNING] #pet-list element missing in DOM.");
    return;
  }

  // First, try cache
  const cachedPets = getCache(CACHE_KEYS.PETS);
  if (cachedPets && Array.isArray(cachedPets)) {
    renderPets(cachedPets);
  } else {
    petListContainer.innerHTML = `<p class="placeholder">Loading pets from server...</p>`;
  }

  // If cached, we stop here to avoid extra calls (30-min rule).
  if (cachedPets) return;

  // No valid cache, fetch from backend
  try {
    const res = await fetch(API_BASE + PETS_ENDPOINT, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      // Debug warning: rely on HTTP cache headers from the server
      cache: "default"
    });

    if (!res.ok) {
      console.warn("[DEBUG-WARNING] Failed to fetch pets. Status:", res.status);
      petListContainer.innerHTML = `<p class="placeholder">Failed to load pets. Try refreshing.</p>`;
      return;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn("[DEBUG-WARNING] Pets endpoint did not return an array.");
      return;
    }

    // Cache for 30 minutes
    setCache(CACHE_KEYS.PETS, data, THIRTY_MINUTES_MS);
    renderPets(data);
  } catch (err) {
    console.warn("[DEBUG-WARNING] Error fetching pets:", err);
    petListContainer.innerHTML = `<p class="placeholder">Network error. Check your connection.</p>`;
  }
}

/**
 * Render pet cards into #pet-list.
 * For now, expect data to be an array of objects with keys:
 * { id, name, rarity, stats, value, image_url }
 */
function renderPets(pets) {
  const petListContainer = $("#pet-list");
  if (!petListContainer) return;

  if (!Array.isArray(pets) || pets.length === 0) {
    petListContainer.innerHTML = `<p class="placeholder">No pets found yet. Admins can add pets using the panel.</p>`;
    return;
  }

  const html = pets
    .map((pet) => {
      const rarity = pet.rarity || "Common";
      const rarityClass = getRarityClass(rarity);
      const safeName = escapeHtml(pet.name || "Unknown Pet");
      const safeStats = escapeHtml(pet.stats || "");
      const safeValue = Number.isFinite(pet.value) ? pet.value : "?";
      const imageUrl = pet.image_url || "";

      return `
        <article class="card pet-card" data-pet-id="${pet.id || ""}">
          <div class="pet-card-image">
            ${
              imageUrl
                ? `<img src="${imageUrl}" alt="${safeName}" loading="lazy" />`
                : `<div class="placeholder">No image</div>`
            }
          </div>
          <div class="pet-card-header">
            <div class="pet-name">${safeName}</div>
            <div class="pet-rarity ${rarityClass}">${rarity}</div>
          </div>
          ${
            safeStats
              ? `<div class="pet-stats">${safeStats}</div>`
              : ""
          }
          <div class="pet-value">Value: ${safeValue}</div>
          <!-- Admin buttons will be injected when admin session is known -->
          <div class="pet-admin-actions"></div>
        </article>
      `;
    })
    .join("");

  petListContainer.innerHTML = html;
}

/**
 * Map rarity string to CSS class.
 */
function getRarityClass(rarity) {
  const r = String(rarity).toLowerCase();
  if (r === "rare" || r === "uncommon") return "pet-rarity-rare";
  if (r === "legendary") return "pet-rarity-legendary";
  if (r === "exclusive") return "pet-rarity-exclusive";
  return "pet-rarity-common";
}

/**
 * Basic HTML escaping to avoid accidental injection.
 */
function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// =======================
// Online counter logic
// =======================

async function loadOnlineCount() {
  const onlineSpan = $("#online-value");
  if (!onlineSpan) {
    console.warn("[DEBUG-WARNING] #online-value element missing in DOM.");
    return;
  }

  // Use cached value if valid
  const cachedOnline = getCache(CACHE_KEYS.ONLINE);
  if (typeof cachedOnline === "number") {
    onlineSpan.textContent = cachedOnline;
  }

  // Respect rule: only fetch once per page load if there is no valid cache
  if (cachedOnline != null) return;

  try {
    const res = await fetch(API_BASE + ONLINE_ENDPOINT, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      cache: "default"
    });

    if (!res.ok) {
      console.warn("[DEBUG-WARNING] Failed to fetch online count. Status:", res.status);
      return;
    }

    const data = await res.json();
    const count = typeof data.count === "number" ? data.count : null;
    if (count == null) {
      console.warn("[DEBUG-WARNING] Online endpoint did not return a numeric count.");
      return;
    }

    onlineSpan.textContent = count;
    // Cache for 30 minutes
    setCache(CACHE_KEYS.ONLINE, count, THIRTY_MINUTES_MS);
  } catch (err) {
    console.warn("[DEBUG-WARNING] Error fetching online count:", err);
  }
}

// =======================
// Admin login & session shell
// =======================

/**
 * For now, this is a local fake login to allow UI testing without backend.
 * Later we will replace this with a real API call to Vercel + Supabase auth.
 */
function initAdminLogin() {
  const loginForm = $("#login-form");
  const messageEl = $("#login-message");
  const adminPanel = $("#admin-panel");
  const adminRoleSpan = $("#admin-role");

  // Load any fake admin session from cache
  const savedAdmin = getCache(CACHE_KEYS.ADMIN);
  if (savedAdmin && savedAdmin.username) {
    if (adminPanel) adminPanel.classList.remove("hidden");
    if (adminRoleSpan) adminRoleSpan.textContent = savedAdmin.role || "Admin";
  }

  if (!loginForm) {
    console.warn("[DEBUG-WARNING] #login-form element missing in DOM.");
    return;
  }

  on(loginForm, "submit", (event) => {
    event.preventDefault();
    if (!messageEl) return;

    const usernameInput = $("#login-username");
    const passwordInput = $("#login-password");

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!username || !password) {
      messageEl.textContent = "Please enter username and password.";
      return;
    }

    // Debug: this is purely local validation
    if (username.toLowerCase() === "admin" && password === "admin") {
      const adminSession = {
        username,
        role: "Full Admin"
      };
      setCache(CACHE_KEYS.ADMIN, adminSession, THIRTY_MINUTES_MS);

      if (adminPanel) adminPanel.classList.remove("hidden");
      if (adminRoleSpan) adminRoleSpan.textContent = adminSession.role;
      messageEl.textContent = "Logged in as admin (local only).";
    } else {
      messageEl.textContent = "Invalid credentials (only local test right now).";
    }
  });
}

// =======================
// Add Pet modal & local add behavior
// =======================

function initAddPetModal() {
  const openBtn = $("#open-add-pet");
  const closeBtn = $("#close-add-pet");
  const modal = $("#add-pet-modal");
  const form = $("#add-pet-form");
  const messageEl = $("#add-pet-message");

  if (!modal || !form) {
    console.warn("[DEBUG-WARNING] Add Pet modal or form missing in DOM.");
    return;
  }

  // Open modal
  on(openBtn, "click", () => {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  });

  // Close modal
  const closeModal = () => {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    if (messageEl) messageEl.textContent = "";
    form.reset();
  };

  on(closeBtn, "click", closeModal);

  // Close by clicking backdrop
  const backdrop = modal.querySelector(".modal-backdrop");
  on(backdrop, "click", closeModal);

  // Handle submit: for now, only update local cache and UI (no backend calls yet)
  on(form, "submit", (event) => {
    event.preventDefault();
    if (messageEl) messageEl.textContent = "";

    const nameInput = $("#pet-name");
    const rarityInput = $("#pet-rarity");
    const statsInput = $("#pet-stats");
    const valueInput = $("#pet-value");
    const imageInput = $("#pet-image");

    const name = nameInput ? nameInput.value.trim() : "";
    const rarity = rarityInput ? rarityInput.value : "";
    const stats = statsInput ? statsInput.value.trim() : "";
    const value = valueInput ? parseInt(valueInput.value, 10) : NaN;

    if (!name || !rarity || Number.isNaN(value)) {
      if (messageEl) {
        messageEl.textContent = "Name, rarity and numeric value are required.";
      }
      return;
    }

    // NOTE: image handling will be wired to Supabase later; for now we ignore file content
    const newPet = {
      id: "local-" + Date.now(),
      name,
      rarity,
      stats,
      value,
      image_url: ""
    };

    // Merge with existing cached pets and re-render
    const cachedPets = getCache(CACHE_KEYS.PETS);
    const updatedPets = Array.isArray(cachedPets)
      ? [...cachedPets, newPet]
      : [newPet];

    setCache(CACHE_KEYS.PETS, updatedPets, THIRTY_MINUTES_MS);
    renderPets(updatedPets);

    if (messageEl) {
      messageEl.textContent = "Pet added locally. Real backend will be wired later.";
    }

    // Close the modal after a short delay to let the user see the message
    setTimeout(closeModal, 400);
  });
}

// =======================
// Initialization
// =======================

// Debug warning: All init logic runs once on DOMContentLoaded; there are no 24/7 loops here.
document.addEventListener("DOMContentLoaded", () => {
  loadPets();
  loadOnlineCount();
  initAdminLogin();
  initAddPetModal();
});

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /main.js
