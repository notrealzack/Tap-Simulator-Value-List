// File type: Client-side JavaScript (for GitHub Pages)
// Path: /textglimmer.js

// Debug warning: Text glimmer effect for rarity badges, uses CSS animations (no 24/7 loops)

(function() {
  // Rarity gradient configurations
  const rarityGradients = {
    'Mythical': {
      colors: ['#ff6b9d', '#ff8fab', '#ff6b9d'],
      animationDuration: '3s'
    },
    'Secret I': {
      colors: ['#ffae42', '#ffc870', '#ffae42'],
      animationDuration: '2.5s'
    },
    'Secret II': {
      colors: ['#00d4ff', '#33ddff', '#00d4ff'],
      animationDuration: '2.5s'
    },
    'Secret III': {
      colors: ['#b388ff', '#c9a8ff', '#b388ff'],
      animationDuration: '2.5s'
    },
    'Leaderboard': {
      colors: ['#ffd700', '#ffe44d', '#ffd700'],
      animationDuration: '2s'
    },
    'Exclusive': {
      colors: ['#00ff88', '#33ffaa', '#00ff88'],
      animationDuration: '2s'
    }
  };

  // Apply glimmer effect to rarity badges
  function applyGlimmerEffect(element, rarity) {
    if (!rarityGradients[rarity]) return;

    const config = rarityGradients[rarity];
    const gradient = `linear-gradient(90deg, ${config.colors.join(', ')})`;

    // Set gradient background
    element.style.backgroundImage = gradient;
    element.style.backgroundSize = '200% 100%';
    element.style.backgroundClip = 'text';
    element.style.webkitBackgroundClip = 'text';
    element.style.color = 'transparent';

    // Add animation
    element.style.animation = `glimmer ${config.animationDuration} ease-in-out infinite`;
  }

  // Initialize glimmer on all rarity elements
  function initGlimmer() {
    const rarityElements = document.querySelectorAll('.pet-rarity');
    
    rarityElements.forEach(element => {
      const rarityText = element.textContent.trim();
      applyGlimmerEffect(element, rarityText);
    });
  }

  // Create CSS animation keyframes dynamically
  function injectGlimmerStyles() {
    if (document.getElementById('glimmer-styles')) return;

    const style = document.createElement('style');
    style.id = 'glimmer-styles';
    style.textContent = `
      @keyframes glimmer {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Observer for dynamically added pet cards
  const observer = new MutationObserver(() => {
    initGlimmer();
  });

  // Debug warning: MutationObserver watches for new pet cards, automatically applies effect
  function startObserving() {
    const petsContainer = document.getElementById('pets-container');
    if (petsContainer) {
      observer.observe(petsContainer, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    injectGlimmerStyles();
    initGlimmer();
    startObserving();
  });

  // Public API for manual re-initialization (used by main.js after rendering pets)
  window.TextGlimmer = {
    refresh: initGlimmer
  };
})();

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /textglimmer.js
