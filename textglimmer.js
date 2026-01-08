// File type: Client-side JavaScript (for GitHub Pages)
// Path: /textglimmer.js

// Debug warning: Text glimmer effect for pet names and rarity badges, uses CSS animations (no 24/7 loops)

(function() {
  // Rarity gradient configurations for badges
  const rarityGradients = {
    'Legendary':{
      colors: ['#ffa200', '#ffbb45ff', '#ffa200'],
      animationDuration: '3s'
    },
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

  // Pet name glimmer configuration (subtle white-to-cyan shimmer)
  const petNameGradient = {
    colors: ['#ffffff', '#e0f2fe', '#bae6fd', '#e0f2fe', '#ffffff'],
    animationDuration: '4s'
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

  // Apply subtle glimmer to pet names
  function applyPetNameGlimmer(element) {
    const gradient = `linear-gradient(90deg, ${petNameGradient.colors.join(', ')})`;

    // Set gradient background
    element.style.backgroundImage = gradient;
    element.style.backgroundSize = '300% 100%';
    element.style.backgroundClip = 'text';
    element.style.webkitBackgroundClip = 'text';
    element.style.color = 'transparent';

    // Add animation
    element.style.animation = `glimmer ${petNameGradient.animationDuration} ease-in-out infinite`;
  }

  // Initialize glimmer on all rarity badges
  function initRarityGlimmer() {
    const rarityElements = document.querySelectorAll('.pet-rarity');
    
    rarityElements.forEach(element => {
      const rarityText = element.textContent.trim();
      applyGlimmerEffect(element, rarityText);
    });
  }

  // Initialize glimmer on all pet names
  function initPetNameGlimmer() {
    const nameElements = document.querySelectorAll('.pet-name');
    
    nameElements.forEach(element => {
      applyPetNameGlimmer(element);
    });
  }

  // Initialize all glimmers
  function initGlimmer() {
    initRarityGlimmer();
    initPetNameGlimmer();
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

      /* Ensure pet names maintain readability */
      .pet-name {
        font-weight: 600;
        letter-spacing: 0.3px;
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
