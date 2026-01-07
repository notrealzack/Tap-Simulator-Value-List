// File type: Client-side JavaScript (for GitHub Pages)
// Path: /secreteffects.js

// Debug warning: Special visual effects for Secret and high-tier rarity cards, CSS-based (no 24/7 loops)

(function() {
  // Rarity effect configurations
  const rarityEffects = {
    'Secret I': {
      glowColor: 'rgba(255, 174, 66, 0.4)',
      borderColor: '#ffae42',
      animationDuration: '2s'
    },
    'Secret II': {
      glowColor: 'rgba(0, 212, 255, 0.4)',
      borderColor: '#00d4ff',
      animationDuration: '2s'
    },
    'Secret III': {
      glowColor: 'rgba(179, 136, 255, 0.4)',
      borderColor: '#b388ff',
      animationDuration: '2s'
    },
    'Leaderboard': {
      glowColor: 'rgba(255, 215, 0, 0.5)',
      borderColor: '#ffd700',
      animationDuration: '1.5s'
    },
    'Exclusive': {
      glowColor: 'rgba(0, 255, 136, 0.5)',
      borderColor: '#00ff88',
      animationDuration: '2s'
    }
  };

  // Apply glow effect to pet card
  function applyGlowEffect(card, rarity) {
    if (!rarityEffects[rarity]) return;

    const config = rarityEffects[rarity];

    // Add glow class for styling
    card.classList.add('pet-card-glow');
    card.setAttribute('data-rarity-effect', rarity);

    // Set custom CSS properties for this card
    card.style.setProperty('--glow-color', config.glowColor);
    card.style.setProperty('--border-color', config.borderColor);
    card.style.setProperty('--animation-duration', config.animationDuration);
  }

  // Apply sparkle overlay effect for Secret III and Leaderboard
  function applySparkleEffect(card, rarity) {
    if (rarity !== 'Secret III' && rarity !== 'Leaderboard') return;

    // Create sparkle container if not exists
    let sparkleContainer = card.querySelector('.sparkle-container');
    if (!sparkleContainer) {
      sparkleContainer = document.createElement('div');
      sparkleContainer.className = 'sparkle-container';
      
      // Add 3 sparkle elements
      for (let i = 0; i < 3; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.animationDelay = `${i * 0.7}s`;
        sparkleContainer.appendChild(sparkle);
      }
      
      card.appendChild(sparkleContainer);
    }
  }

  // Apply exclusive particle effect for Exclusive rarity
  function applyExclusiveEffect(card, rarity) {
    if (rarity !== 'Exclusive') return;

    // Create particle container if not exists
    let particleContainer = card.querySelector('.exclusive-particles');
    if (!particleContainer) {
      particleContainer = document.createElement('div');
      particleContainer.className = 'exclusive-particles';
      
      // Add 6 floating particles
      for (let i = 0; i < 6; i++) {
        const particle = document.createElement('div');
        particle.className = 'exclusive-particle';
        particle.style.animationDelay = `${i * 0.5}s`;
        particle.style.left = `${Math.random() * 80 + 10}%`;
        particleContainer.appendChild(particle);
      }
      
      card.appendChild(particleContainer);
    }
  }

  // Initialize effects on all pet cards
  function initSecretEffects() {
    const petCards = document.querySelectorAll('.pet-card');
    
    petCards.forEach(card => {
      const rarityElement = card.querySelector('.pet-rarity');
      if (!rarityElement) return;

      const rarity = rarityElement.textContent.trim();
      
      // Apply glow effect to special rarities
      if (rarityEffects[rarity]) {
        applyGlowEffect(card, rarity);
        applySparkleEffect(card, rarity);
        applyExclusiveEffect(card, rarity);
      }
    });
  }

  // Inject CSS styles for effects
  function injectEffectStyles() {
    if (document.getElementById('secret-effects-styles')) return;

    const style = document.createElement('style');
    style.id = 'secret-effects-styles';
    style.textContent = `
      /* Glow effect for special rarity cards */
      .pet-card-glow {
        border-color: var(--border-color) !important;
        box-shadow: 0 0 20px var(--glow-color),
                    0 0 40px var(--glow-color),
                    inset 0 0 20px rgba(255, 255, 255, 0.05);
        animation: cardPulse var(--animation-duration) ease-in-out infinite;
      }

      @keyframes cardPulse {
        0%, 100% {
          box-shadow: 0 0 20px var(--glow-color),
                      0 0 40px var(--glow-color),
                      inset 0 0 20px rgba(255, 255, 255, 0.05);
        }
        50% {
          box-shadow: 0 0 30px var(--glow-color),
                      0 0 60px var(--glow-color),
                      inset 0 0 30px rgba(255, 255, 255, 0.08);
        }
      }

      /* Sparkle container */
      .sparkle-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        border-radius: 12px;
      }

      /* Individual sparkle */
      .sparkle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        animation: sparkleFloat 3s ease-in-out infinite;
        opacity: 0;
      }

      .sparkle:nth-child(1) {
        left: 20%;
        animation-delay: 0s;
      }

      .sparkle:nth-child(2) {
        left: 50%;
        animation-delay: 0.7s;
      }

      .sparkle:nth-child(3) {
        left: 80%;
        animation-delay: 1.4s;
      }

      @keyframes sparkleFloat {
        0% {
          top: 100%;
          opacity: 0;
          transform: scale(0);
        }
        10% {
          opacity: 1;
          transform: scale(1);
        }
        90% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          top: -10%;
          opacity: 0;
          transform: scale(0);
        }
      }

      /* Exclusive particle container */
      .exclusive-particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        border-radius: 12px;
      }

      /* Individual exclusive particle */
      .exclusive-particle {
        position: absolute;
        width: 6px;
        height: 6px;
        background: #00ff88;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0, 255, 136, 0.8),
                    0 0 20px rgba(0, 255, 136, 0.4);
        animation: exclusiveFloat 4s ease-in-out infinite;
        opacity: 0;
      }

      @keyframes exclusiveFloat {
        0% {
          top: 50%;
          opacity: 0;
          transform: translateY(0) scale(0);
        }
        10% {
          opacity: 1;
          transform: translateY(-10px) scale(1);
        }
        50% {
          transform: translateY(-50px) scale(1.2);
        }
        90% {
          opacity: 1;
          transform: translateY(-90px) scale(1);
        }
        100% {
          top: -10%;
          opacity: 0;
          transform: translateY(-100px) scale(0);
        }
      }

      .exclusive-particle:nth-child(1) { animation-delay: 0s; }
      .exclusive-particle:nth-child(2) { animation-delay: 0.5s; }
      .exclusive-particle:nth-child(3) { animation-delay: 1s; }
      .exclusive-particle:nth-child(4) { animation-delay: 1.5s; }
      .exclusive-particle:nth-child(5) { animation-delay: 2s; }
      .exclusive-particle:nth-child(6) { animation-delay: 2.5s; }

      /* Enhanced hover effect for glow cards */
      .pet-card-glow:hover {
        transform: translateY(-6px) scale(1.02);
        box-shadow: 0 0 30px var(--glow-color),
                    0 0 60px var(--glow-color),
                    0 12px 24px rgba(0, 0, 0, 0.5),
                    inset 0 0 30px rgba(255, 255, 255, 0.08);
      }
    `;
    document.head.appendChild(style);
  }

  // Observer for dynamically added pet cards
  const observer = new MutationObserver(() => {
    initSecretEffects();
  });

  // Debug warning: MutationObserver watches for new cards and applies effects automatically
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
    injectEffectStyles();
    initSecretEffects();
    startObserving();
  });

  // Public API for manual re-initialization
  window.SecretEffects = {
    refresh: initSecretEffects
  };
})();

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /secreteffects.js
