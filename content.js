// File type: Client-side JavaScript (for GitHub Pages)
// Path: /content.js

// Debug warning: Content display logic for pet details

// Display egg details (not used in admin view, but kept for compatibility)
function displayEggDetails(eggName, eggData, worldName) {
  const contentArea = document.getElementById('content');
  
  if (!contentArea) {
    console.warn('[DEBUG-WARNING] Content area not found');
    return;
  }

  // Hide pets container, show egg details
  const petsContainer = document.getElementById('pets-container');
  if (petsContainer) {
    petsContainer.style.display = 'none';
  }

  const cost = eggData.cost || 'Unknown';
  const pets = eggData.pets || [];

  // Generate HTML for egg details
  const html = `
    <div class="pet-details">
      <div class="pet-header">
        <h2 class="pet-title">${escapeHtml(eggName)}</h2>
        <div class="pet-meta">
          <span>${escapeHtml(worldName)}</span> • 
          <span>Cost: ${formatNumber(cost)}</span> • 
          <span>${pets.length} Pets</span>
        </div>
      </div>
      
      <table class="pets-table">
        <thead>
          <tr>
            <th>Pet Name</th>
            <th>Rarity</th>
            <th>Stats</th>
            <th>Normal</th>
            <th>Golden</th>
            <th>Rainbow</th>
          </tr>
        </thead>
        <tbody>
          ${pets.map(pet => `
            <tr>
              <td>${escapeHtml(pet.name)}</td>
              <td><span class="rarity-badge rarity-badge-${getRarityClass(pet.rarity)}">${escapeHtml(pet.rarity)}</span></td>
              <td class="stat-value">${formatNumber(pet.stats || 0)}</td>
              <td class="stat-value">${formatNumber(pet.value_normal || 0)}</td>
              <td class="stat-value">${formatNumber(pet.value_golden || 0)}</td>
              <td class="stat-value">${formatNumber(pet.value_rainbow || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  contentArea.innerHTML = html;

  // Trigger secret effects if available
  if (typeof initSecretEffects === 'function') {
    setTimeout(() => initSecretEffects(), 100);
  }
}

// Helper function to get rarity class
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

// Helper function to format numbers
function formatNumber(num) {
  if (num == null) return '0';
  return Number(num).toLocaleString();
}

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// File type: Client-side JavaScript (for GitHub Pages)
// Path: /content.js
