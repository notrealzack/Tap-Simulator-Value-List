// File type: Client-side JavaScript (for GitHub Pages)
// Path: /sidebar.js

// Debug warning: Sidebar navigation helpers - supplementary to main.js
// Note: Core sidebar generation and nav-link handling is in main.js to avoid duplicate listeners

(function() {
  let currentRarity = null;

  // Toggle collapsible sections (for future expandable sidebar sections)
  function initCollapsibleSections() {
    const toggleButtons = document.querySelectorAll('.nav-section-toggle');

    toggleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const sectionName = button.getAttribute('data-section');
        const content = document.querySelector(`[data-section-content="${sectionName}"]`);

        if (!content) return;

        // Toggle collapsed state
        const isCollapsed = content.classList.contains('hidden');
        
        if (isCollapsed) {
          content.classList.remove('hidden');
          button.classList.remove('collapsed');
        } else {
          content.classList.add('hidden');
          button.classList.add('collapsed');
        }
      });
    });
  }

  // Show/hide admin section (called from main.js events)
  function toggleAdminSection(isVisible) {
    const adminSection = document.getElementById('admin-nav-section');
    if (!adminSection) return;

    if (isVisible) {
      adminSection.style.display = 'block';
      adminSection.classList.remove('hidden');
      adminSection.classList.add('visible');
    } else {
      adminSection.style.display = 'none';
      adminSection.classList.add('hidden');
      adminSection.classList.remove('visible');
    }
  }

  // Get current rarity filter
  function getCurrentRarity() {
    return currentRarity;
  }

  // Set current rarity (called from main.js when filter changes)
  function setCurrentRarity(rarity) {
    currentRarity = rarity;
  }

  // Reset navigation (clear all filters)
  function resetNavigation() {
    currentRarity = null;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Set "All Pets" as active
    const allPetsLink = document.querySelector('.nav-link[data-rarity="all"]');
    if (allPetsLink) {
      allPetsLink.classList.add('active');
    }
  }

  // Initialize sidebar (called from index.html)
  function initSidebar() {
    console.log('[Sidebar] Initializing sidebar helpers');
    initCollapsibleSections();
    
    // Listen for admin login/logout events from main.js
    window.addEventListener('adminLoggedIn', () => {
      toggleAdminSection(true);
    });

    window.addEventListener('adminLoggedOut', () => {
      toggleAdminSection(false);
    });

    // Listen for rarity filter changes from main.js
    window.addEventListener('rarityFilterChanged', (e) => {
      if (e.detail && e.detail.rarity !== undefined) {
        setCurrentRarity(e.detail.rarity);
      }
    });
  }

  // Public API for main.js and other scripts
  window.Sidebar = {
    showAdminSection: () => toggleAdminSection(true),
    hideAdminSection: () => toggleAdminSection(false),
    getCurrentRarity,
    setCurrentRarity,
    resetNavigation,
    init: initSidebar
  };

  // Make initSidebar globally accessible for index.html initialization
  window.initSidebar = initSidebar;

  // Debug warning: Navigation link clicks handled by main.js event delegation
  // Debug warning: Sidebar generation handled by generateSidebar() in main.js
  // Debug warning: All sidebar interactions are event-driven, no polling loops
})();

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /sidebar.js
