/* gallery-filter.js - SIMPLIFIED WORKING VERSION */
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing gallery...');
  initializeGallery();
});

function initializeGallery() {
  console.log('initializeGallery called');
  console.log('GALLERY_ITEMS available:', window.GALLERY_ITEMS);
  
  const grid = document.getElementById('galleryGrid');
  if (!grid) {
    console.error('Gallery grid not found!');
    return;
  }
  
  // Clear loading indicator
  grid.innerHTML = '';
  
  // Check data
  if (!window.GALLERY_ITEMS || Object.keys(window.GALLERY_ITEMS).length === 0) {
    grid.innerHTML = `
      <div style="column-span: all; text-align: center; padding: 60px; color: #999;">
        <h3>⚠️ No gallery data found</h3>
        <p>Please check if gallery-data.js is loaded correctly.</p>
        <pre style="margin: 20px auto; background: #222; padding: 10px; border-radius: 5px; max-width: 500px; overflow: auto;">
GALLERY_ITEMS = ${JSON.stringify(window.GALLERY_ITEMS, null, 2)}
        </pre>
      </div>
    `;
    return;
  }
  
  console.log(`Creating ${Object.keys(window.GALLERY_ITEMS).length} gallery items`);
  
  // Create items
  Object.keys(window.GALLERY_ITEMS).forEach(itemId => {
    const itemData = window.GALLERY_ITEMS[itemId];
    createGalleryItem(grid, itemId, itemData);
  });
  
  // Setup search
  setupSearch();
  
  console.log('Gallery initialized successfully!');
}

function createGalleryItem(grid, itemId, itemData) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.dataset.id = itemId;
  
  // Use first image or placeholder
  const firstImage = itemData.images && itemData.images[0] 
    ? itemData.images[0] 
    : 'https://placehold.co/600x400/1a1a1d/ffffff?text=No+Image';
  
  // Get preview text
  const previewHeader = itemData.preview?.header || itemData.title || 'Project';
  const previewDescription = itemData.preview?.description || itemData.subtitle || 'View project details';
  
  // Create thumbnail with text overlay
  item.innerHTML = `
    <div class="gallery-thumb" style="background-image: url('${firstImage}')">
      <div class="gallery-preview-content">
        <h2>${previewHeader}</h2>
        <p>${previewDescription}</p>
      </div>
    </div>
  `;
  
  // Click handler
  item.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Clicked item:', itemId);
    
    // Try to use modal if available
    if (window.__PORTFOLIO_MODAL && window.__PORTFOLIO_MODAL.open) {
      window.__PORTFOLIO_MODAL.open(itemId);
    } else {
      // Fallback: simple alert
      alert(`Opening: ${previewHeader}\n\n${previewDescription}`);
    }
  });
  
  grid.appendChild(item);
}

function setupSearch() {
  const searchInput = document.getElementById('gallerySearch');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', function() {
    const term = this.value.toLowerCase();
    const items = document.querySelectorAll('.gallery-item');
    let visibleCount = 0;
    
    items.forEach(item => {
      const content = item.querySelector('.gallery-preview-content');
      const title = content?.querySelector('h2')?.textContent.toLowerCase() || '';
      const desc = content?.querySelector('p')?.textContent.toLowerCase() || '';
      const isVisible = title.includes(term) || desc.includes(term) || term === '';
      
      item.style.display = isVisible ? 'inline-block' : 'none';
      if (isVisible) visibleCount++;
    });
    
    // Show message if no results
    const noResults = document.querySelector('.no-results');
    if (term && visibleCount === 0) {
      if (!noResults) {
        const grid = document.getElementById('galleryGrid');
        const msg = document.createElement('div');
        msg.className = 'no-results';
        msg.style.cssText = 'column-span: all; text-align: center; padding: 40px; color: #999;';
        msg.innerHTML = `<p>No results found for "<strong>${term}</strong>"</p>`;
        grid.appendChild(msg);
      }
    } else if (noResults) {
      noResults.remove();
    }
  });
  
  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '✕';
  clearBtn.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #999; cursor: pointer; font-size: 16px;';
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.focus();
  });
  
  searchInput.parentNode.style.position = 'relative';
  searchInput.parentNode.appendChild(clearBtn);
}