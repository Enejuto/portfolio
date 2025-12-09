(function(){
  // Simple modular JS to power search + tag + year filtering for the gallery
  const searchInput = document.getElementById('gallerySearch');
  const grid = document.getElementById('galleryGrid');
  if(!grid) return;

  // Collect all items (gallery-item)
  let items = Array.from(grid.querySelectorAll('.gallery-item'));

  // Build filter UI: unique tags and years
  const filtersRow = document.createElement('div');
  filtersRow.className = 'gallery-filters';
  grid.parentNode.insertBefore(filtersRow, grid);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'clear-filters';
  clearBtn.textContent = 'Clear filters';
  clearBtn.addEventListener('click', ()=>{
    activeFilters = { tags:new Set(), years:new Set() };
    updateFilterChips();
    applyFilters();
  });
  filtersRow.appendChild(clearBtn);

  // State
  let activeFilters = { tags:new Set(), years:new Set(), q: '' };

  // Helper: read tags from data-tags attribute (space separated) and year from data-year
  function extractMeta(item){
    const tagsStr = item.dataset.tags || '';
    const tags = tagsStr.split(/\s+/).filter(Boolean).map(t=>t.toLowerCase());
    const year = (item.dataset.year || '').toString();
    const title = (item.querySelector('h2')||{textContent:''}).textContent.toLowerCase();
    const desc = (item.querySelector('.gallery-summary')||{textContent:''}).textContent.toLowerCase();
    return { item, tags, year, title, desc };
  }

  const meta = items.map(extractMeta);

  // Build unique lists
  const tagCounts = {};
  const yearCounts = {};
  meta.forEach(m=>{
    m.tags.forEach(t=> tagCounts[t]=(tagCounts[t]||0)+1);
    if(m.year) yearCounts[m.year]=(yearCounts[m.year]||0)+1;
  });

  const tagList = Object.keys(tagCounts).sort((a,b)=> tagCounts[b]-tagCounts[a]);
  const yearList = Object.keys(yearCounts).sort((a,b)=> b - a);

  // Render chips
  function updateFilterChips(){
    // remove existing chips except clear button
    Array.from(filtersRow.querySelectorAll('.filter-chip, .chip-group')).forEach(n=>n.remove());

    if(tagList.length){
      const group = document.createElement('div'); group.className='chip-group';
      tagList.forEach(t=>{
        const chip = document.createElement('button');
        chip.className='filter-chip';
        chip.textContent = `${t} (${tagCounts[t]})`;
        if(activeFilters.tags.has(t)) chip.classList.add('active');
        chip.addEventListener('click', ()=>{
          if(activeFilters.tags.has(t)) activeFilters.tags.delete(t); else activeFilters.tags.add(t);
          updateFilterChips(); applyFilters();
        });
        // clicking while holding shift will open modal on first matching item (convenience)
        chip.addEventListener('dblclick', ()=>{
          openFirstMatchingForTag(t);
        });
        group.appendChild(chip);
      });
      filtersRow.insertBefore(group, clearBtn);
    }

    if(yearList.length){
      const yearGroup = document.createElement('div'); yearGroup.className='chip-group';
      yearList.forEach(y=>{
        const chip = document.createElement('button');
        chip.className='filter-chip';
        chip.textContent = y;
        if(activeFilters.years.has(y)) chip.classList.add('active');
        chip.addEventListener('click', ()=>{
          if(activeFilters.years.has(y)) activeFilters.years.delete(y); else activeFilters.years.add(y);
          updateFilterChips(); applyFilters();
        });
        yearGroup.appendChild(chip);
      });
      filtersRow.insertBefore(yearGroup, clearBtn);
    }
  }

  updateFilterChips();

  // Live search with debounce
  let debounceTimer = null;
  function onSearchChange(e){
    const q = (e.target.value||'').trim().toLowerCase();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(()=>{
      activeFilters.q = q; applyFilters();
    }, 180);
  }
  searchInput && searchInput.addEventListener('input', onSearchChange);

  // Apply the filters to show/hide cards
  function applyFilters(){
    let visibleCount = 0;
    meta.forEach(m=>{
      let visible = true;
      // tags: item must include ALL active tags (AND semantics). If you prefer OR change logic.
      if(activeFilters.tags.size){
        for(const t of activeFilters.tags){ if(!m.tags.includes(t)) { visible=false; break; } }
      }
      // years: if any year selected, item must match one of them
      if(activeFilters.years.size){ if(!activeFilters.years.has(m.year)) visible=false; }
      // query: match title, desc, tags
      if(activeFilters.q){
        const q = activeFilters.q;
        const inTitle = m.title.includes(q);
        const inDesc = m.desc.includes(q);
        const inTags = m.tags.join(' ').includes(q);
        if(!(inTitle||inDesc||inTags)) visible=false;
      }

      // show/hide
      if(visible){
        m.item.style.display = 'inline-block';
        visibleCount++;
      } else {
        m.item.style.display = 'none';
      }
    });

    // empty state
    if(!document.querySelector('.gallery-empty')){
      const empty = document.createElement('div'); empty.className='gallery-empty'; empty.textContent = 'No results — try clearing filters.';
      grid.parentNode.appendChild(empty);
    }
    const emptyNode = document.querySelector('.gallery-empty');
    if(visibleCount===0) emptyNode.style.display='block'; else emptyNode.style.display='none';
  }

  // clicking a card opens modal if modal logic exists in main page; otherwise nothing
  items.forEach(card=>{
    // tag clicks inside card should trigger tag filters
    Array.from(card.querySelectorAll('.card-tags span')).forEach(tagEl=>{
      tagEl.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const tagText = tagEl.textContent.trim().toLowerCase();
        if(activeFilters.tags.has(tagText)) activeFilters.tags.delete(tagText); else activeFilters.tags.add(tagText);
        updateFilterChips(); applyFilters();
      });
    });

    card.addEventListener('click', ()=>{
      // prefer to dispatch a custom event so the site's existing modal JS can pick it up
      const evt = new CustomEvent('gallery:item:open', { detail: { card } });
      window.dispatchEvent(evt);

      // fallback: if the project uses the same modal container with id galleryModal and expects images array on window.GALLERY_DATA
      try{
        const modal = document.getElementById('galleryModal');
        if(modal){
          // attempt to find a data-images attribute with comma separated images
          const raw = card.dataset.images || '';
          const imgs = raw.split(',').map(s=>s.trim()).filter(Boolean);
          // attach a small payload and open modal by adding active class (many modal impl use that)
          window.__GALLERY_CURRENT = { title:(card.querySelector('h2')||{textContent:''}).textContent, images: imgs };
          modal.classList.add('active');
          // invoke any global modal opener if available
          if(typeof window.openGalleryModal === 'function') window.openGalleryModal(window.__GALLERY_CURRENT);
        }
      }catch(e){ console.warn('gallery: modal open fallback failed', e); }
    });
  });

  // convenience: open first matching card for a tag
  function openFirstMatchingForTag(tag){
    const found = meta.find(m=> m.tags.includes(tag));
    if(found){ found.item.click(); }
  }

  // expose simple API
  window.GalleryFilter = {
    apply: applyFilters,
    addItem: function(node){ items.push(node); meta.push(extractMeta(node)); updateFilterChips(); applyFilters(); },
    getActive: ()=> ({ tags: Array.from(activeFilters.tags), years: Array.from(activeFilters.years), q: activeFilters.q })
  };

  // init
  applyFilters();

})();

/* AUTO-ADJUST THUMBNAIL RATIO */
function adjustThumbRatio(card){
  const thumb = card.querySelector('.gallery-thumb');
  if(!thumb) return;
  const url = thumb.style.backgroundImage.slice(5,-2);
  const img = new Image();
  img.onload = ()=>{
    const ratio = (img.height/img.width);
    if(ratio > 1.2){ thumb.style.paddingTop = '130%'; }
    else if(ratio < 0.8){ thumb.style.paddingTop = '56%'; }
    else{ thumb.style.paddingTop = '75%'; }
  };
  img.src = url;
}
Array.from(document.querySelectorAll('.gallery-item')).forEach(adjustThumbRatio);

/* --- Infinite scroll additions JS appended below --- */

/* INFINITE SCROLL + REAL-ASSET DUMMY LOADER */
(function(){
  const grid = document.getElementById('galleryGrid');
  if(!grid) return;

  /* real assets from /portfolioAssets/ — dummy list for cycling */
  const assetPool = [
    'aboutme1.png','aboutme2.png','aerofront_vol3.png','manga1.png','animationpreview.webp'
  ];

  /* generate N dummy items using real images */
  function createDummyItems(n){
    const fr = document.createDocumentFragment();
    for(let i=0;i<n;i++){
      const img = assetPool[i % assetPool.length];
      const year = 2020 + (i % 5);
      const div = document.createElement('div');
      div.className='gallery-item';
      div.dataset.tags='dummy auto test';
      div.dataset.year=year;
      div.innerHTML = `
        <div class="gallery-content">
           <h2>Test Item ${Date.now()}-${i}</h2>
           <p>Autogenerated dummy item for layout testing.</p>
        </div>`;

      div.style.animationDelay = (i * 0.08) + 's';
      div.addEventListener('click', () => {
        if (window.__PORTFOLIO_MODAL && window.__PORTFOLIO_MODAL.open) {
          const dummyData = {
            title: 'Gallery Item',
            subtitle: 'Autogenerated Preview',
            description: ['This is a placeholder modal for testing infinite scroll items.'],
            images: [
              '/portfolioAssets/aboutme1.png',
              '/portfolioAssets/aboutme2.png',
              '/portfolioAssets/manga1.png'
            ],
            tools: [{ name: 'Placeholder', icon: '' }],
            specs: [{ label: 'Type', value: 'Dummy Entry' }]
          };
          window.__PORTFOLIO_MODAL.open(dummyData);
        }
      });
      fr.appendChild(div);
      // register item in filter system
      if(window.GalleryFilter){ window.GalleryFilter.addItem(div);}    
    }
    grid.appendChild(fr);
  }

  /* infinite scroll that stops after fixed number of batches */
  let batch = 0;
  const maxBatches = 4; // II ⇒ stop after real limit
  let loading = false;

  function onScroll(){
    if(loading) return;
    const scrollPos = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 600;
    if(scrollPos >= threshold){ loadMore(); }
  }

  function loadMore(){
    if(batch >= maxBatches) return;
    loading = true;
    setTimeout(()=>{
      createDummyItems(10);
      batch++;
      loading = false;
    }, 250);
  }

  window.addEventListener('scroll', onScroll);
})();