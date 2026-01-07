// File type: Client-side JavaScript (for GitHub Pages)
// Path: /sidebar.js

// Debug warning: Sidebar navigation logic, event-driven (no 24/7 loops)

(function() {
  let currentRarity = null;

  // Toggle collapsible sections
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

  // Handle navigation link clicks
  function initNavLinks() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        // Special handling for admin links
        if (link.id === 'nav-add-pet') {
          window.dispatchEvent(new CustomEvent('openAddPetModal'));
          return;
        }

        if (link.id === 'nav-logout') {
          window.dispatchEvent(new CustomEvent('adminLogout'));
          return;
        }

        // Get rarity from data attribute
        const rarity = link.getAttribute('data-rarity');
        if (!rarity) return;

        // Update current rarity filter
        currentRarity = rarity;

        // Update active state
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Dispatch event for main.js to filter pets
        window.dispatchEvent(new CustomEvent('rarityFilterChanged', {
          detail: { rarity }
        }));
      });
    });
  }

  // Show/hide admin section
  function toggleAdminSection(isVisible) {
    const adminSection = document.getElementById('admin-nav-section');
    if (!adminSection) return;

    if (isVisible) {
      adminSection.classList.remove('hidden');
      adminSection.classList.add('visible');
    } else {
      adminSection.classList.add('hidden');
      adminSection.classList.remove('visible');
    }
  }

  // Get current rarity filter
  function getCurrentRarity() {
    return currentRarity;
  }

  // Reset navigation (clear all filters)
  function resetNavigation() {
    currentRarity = null;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    initCollapsibleSections();
    initNavLinks();
  });

  // Listen for admin login/logout events from main.js
  window.addEventListener('adminLoggedIn', () => {
    toggleAdminSection(true);
  });

  window.addEventListener('adminLoggedOut', () => {
    toggleAdminSection(false);
  });

  // Public API for main.js
  window.Sidebar = {
    showAdminSection: () => toggleAdminSection(true),
    hideAdminSection: () => toggleAdminSection(false),
    getCurrentRarity,
    resetNavigation
  };

  // Debug warning: All sidebar interactions are event-driven, no polling
})();

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /sidebar.js
