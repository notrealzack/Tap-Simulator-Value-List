// File type: Client-side JavaScript (for GitHub Pages)
// Path: /virtualscroll.js

// Debug warning: Virtual scrolling manager for performance optimization
// Handles lazy rendering of pet cards - only renders visible items

// ===========================
// Configuration
// ===========================
const RENDER_BUFFER = 5; // Extra cards to render above/below viewport
const SCROLL_DEBOUNCE_MS = 16; // ~60fps scroll handling

// ===========================
// State Management
// ===========================
let virtualScrollState = {
  allItems: [], // Complete pet data array
  visibleStartIndex: 0,
  visibleEndIndex: 0,
  cardHeight: 0, // Measured dynamically
  cardsPerRow: 7, // Updated based on density
  viewportHeight: 0,
  scrollTop: 0,
  totalRows: 0,
  isEnabled: false // Only enable for high density views
};

let scrollTimeout = null;
let lastScrollTime = 0;

// ===========================
// Initialize Virtual Scroll
// ===========================
function initVirtualScroll(pets, density) {
  virtualScrollState.allItems = pets;
  virtualScrollState.cardsPerRow = density;
  virtualScrollState.isEnabled = density >= 9; // Enable for +3 and +5 zoom only
  
  if (!virtualScrollState.isEnabled) {
    console.log('[VirtualScroll] Disabled - density too low');
    return false;
  }
  
  // Measure card height on first render
  measureCardHeight();
  
  // Calculate total rows needed
  virtualScrollState.totalRows = Math.ceil(pets.length / density);
  
  // Get viewport height
  const container = document.getElementById('pets-container');
  if (container) {
    virtualScrollState.viewportHeight = container.clientHeight || window.innerHeight - 200;
  }
  
  // Calculate initial visible range
  calculateVisibleRange();
  
  // Attach scroll listener
  attachScrollListener();
  
  console.log('[VirtualScroll] Initialized -', pets.length, 'pets,', virtualScrollState.totalRows, 'rows');
  return true;
}

// ===========================
// Measure Card Height
// ===========================
function measureCardHeight() {
  // Check if we already have a card in DOM to measure
  const existingCard = document.querySelector('.pet-card');
  if (existingCard) {
    virtualScrollState.cardHeight = existingCard.offsetHeight + 16; // Include gap
    console.log('[VirtualScroll] Measured card height:', virtualScrollState.cardHeight);
    return;
  }
  
  // Fallback estimates based on density
  const heightMap = {
    7: 320,  // Default view
    9: 280,  // +3 zoom
    11: 240  // +5 zoom
  };
  virtualScrollState.cardHeight = heightMap[virtualScrollState.cardsPerRow] || 300;
  console.log('[VirtualScroll] Using estimated card height:', virtualScrollState.cardHeight);
}

// ===========================
// Calculate Visible Range
// ===========================
function calculateVisibleRange() {
  if (!virtualScrollState.isEnabled || virtualScrollState.cardHeight === 0) {
    return;
  }
  
  const container = document.getElementById('pets-container');
  if (!container) return;
  
  // Get current scroll position
  virtualScrollState.scrollTop = container.scrollTop || window.pageYOffset || 0;
  
  // Calculate which row is at top of viewport
  const firstVisibleRow = Math.floor(virtualScrollState.scrollTop / virtualScrollState.cardHeight);
  
  // Calculate how many rows fit in viewport
  const visibleRows = Math.ceil(virtualScrollState.viewportHeight / virtualScrollState.cardHeight);
  
  // Add buffer above and below
  const startRow = Math.max(0, firstVisibleRow - RENDER_BUFFER);
  const endRow = Math.min(virtualScrollState.totalRows, firstVisibleRow + visibleRows + RENDER_BUFFER);
  
  // Convert rows to item indices
  virtualScrollState.visibleStartIndex = startRow * virtualScrollState.cardsPerRow;
  virtualScrollState.visibleEndIndex = Math.min(
    virtualScrollState.allItems.length,
    endRow * virtualScrollState.cardsPerRow
  );
  
  console.log('[VirtualScroll] Visible range:', virtualScrollState.visibleStartIndex, '-', virtualScrollState.visibleEndIndex);
}

// ===========================
// Get Visible Items
// ===========================
function getVisibleItems() {
  if (!virtualScrollState.isEnabled) {
    return virtualScrollState.allItems; // Return all items if disabled
  }
  
  return virtualScrollState.allItems.slice(
    virtualScrollState.visibleStartIndex,
    virtualScrollState.visibleEndIndex
  );
}

// ===========================
// Get Spacer Heights
// ===========================
function getSpacerHeights() {
  if (!virtualScrollState.isEnabled) {
    return { top: 0, bottom: 0 };
  }
  
  // Calculate height of hidden items above viewport
  const topRows = Math.floor(virtualScrollState.visibleStartIndex / virtualScrollState.cardsPerRow);
  const topHeight = topRows * virtualScrollState.cardHeight;
  
  // Calculate height of hidden items below viewport
  const bottomRows = virtualScrollState.totalRows - Math.ceil(virtualScrollState.visibleEndIndex / virtualScrollState.cardsPerRow);
  const bottomHeight = Math.max(0, bottomRows * virtualScrollState.cardHeight);
  
  return { top: topHeight, bottom: bottomHeight };
}

// ===========================
// Scroll Event Handler
// ===========================
function handleScroll() {
  if (!virtualScrollState.isEnabled) return;
  
  const now = Date.now();
  
  // Throttle scroll events
  if (now - lastScrollTime < SCROLL_DEBOUNCE_MS) {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScroll, SCROLL_DEBOUNCE_MS);
    return;
  }
  
  lastScrollTime = now;
  
  // Recalculate visible range
  const oldStart = virtualScrollState.visibleStartIndex;
  const oldEnd = virtualScrollState.visibleEndIndex;
  
  calculateVisibleRange();
  
  // Only re-render if range changed significantly
  if (virtualScrollState.visibleStartIndex !== oldStart || virtualScrollState.visibleEndIndex !== oldEnd) {
    console.log('[VirtualScroll] Range changed - triggering re-render');
    
    // Trigger re-render via global function
    if (typeof window.renderVirtualizedPets === 'function') {
      window.renderVirtualizedPets();
    }
  }
}

// ===========================
// Attach Scroll Listener
// ===========================
function attachScrollListener() {
  const container = document.getElementById('pets-container');
  if (!container) {
    console.warn('[VirtualScroll] Container not found');
    return;
  }
  
  // Make container scrollable
  container.style.overflowY = 'auto';
  container.style.maxHeight = 'calc(100vh - 200px)';
  
  // Add scroll listener
  container.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  console.log('[VirtualScroll] Scroll listener attached');
}

// ===========================
// Disable Virtual Scroll
// ===========================
function disableVirtualScroll() {
  virtualScrollState.isEnabled = false;
  
  const container = document.getElementById('pets-container');
  if (container) {
    container.style.overflowY = '';
    container.style.maxHeight = '';
    container.removeEventListener('scroll', handleScroll);
  }
  
  window.removeEventListener('scroll', handleScroll);
  
  console.log('[VirtualScroll] Disabled');
}

// ===========================
// Update Items (for filter/search)
// ===========================
function updateVirtualScrollItems(newItems) {
  virtualScrollState.allItems = newItems;
  virtualScrollState.totalRows = Math.ceil(newItems.length / virtualScrollState.cardsPerRow);
  
  // Reset to top on data change
  virtualScrollState.scrollTop = 0;
  virtualScrollState.visibleStartIndex = 0;
  
  const container = document.getElementById('pets-container');
  if (container) {
    container.scrollTop = 0;
  }
  
  calculateVisibleRange();
  console.log('[VirtualScroll] Items updated -', newItems.length, 'pets');
}

// ===========================
// Export Functions
// ===========================
window.VirtualScroll = {
  init: initVirtualScroll,
  getVisibleItems: getVisibleItems,
  getSpacerHeights: getSpacerHeights,
  updateItems: updateVirtualScrollItems,
  disable: disableVirtualScroll,
  isEnabled: () => virtualScrollState.isEnabled,
  recalculate: calculateVisibleRange
};

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /virtualscroll.js
