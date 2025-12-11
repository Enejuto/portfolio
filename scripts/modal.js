// modal.js - Rewritten, optimized & fixed
// Imports gallery data from portfolioData.js (MUST be loaded before this script)
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const CONFIG = {
    slideDuration: 10000, // ms
    debug: true,
    defaultImageAlt: 'Portfolio image',
    preloadAhead: 1 // how many slides ahead to preload
  };

  const log = (...args) => { if (CONFIG.debug) console.log('[Modal Debug]', ...args); };

  // ---------- DATA FROM portfolioData.js ----------
  // Reference the global PORTFOLIO_ITEMS object (ensure portfolioData.js is loaded first)
  const galleryData = typeof PORTFOLIO_ITEMS !== 'undefined' ? PORTFOLIO_ITEMS : 
                    (typeof GALLERY_ITEMS !== 'undefined' ? GALLERY_ITEMS : {});

  // ---------- DOM SELECTORS (matching your markup) ----------
  const modal = document.getElementById('galleryModal');
  if (!modal) {
    console.warn('galleryModal element not found - modal script will no-op.');
    return;
  }
  const modalOverlay = modal.querySelector('.modal-overlay');
  const modalClose = modal.querySelector('.modal-close');
  const modalTitle = modal.querySelector('.modal-title');
  const modalSubtitle = modal.querySelector('.modal-subtitle');
  const modalDescription = modal.querySelector('.modal-description');
  const sliderTrack = modal.querySelector('.slider-track');
  const sliderProgress = modal.querySelector('.slider-progress');
  const sliderContainer = modal.querySelector('.slider-container');
  const toolsGrid = modal.querySelector('.tools-grid');
  const specsGrid = modal.querySelector('.specs-grid');

  // ---------- STATE ----------
  const state = {
    currentSlide: 0,
    totalSlides: 0,
    isPaused: false,
    rafId: null,           // for requestAnimationFrame progress animation
    slideStartTs: 0,
    elapsedBeforePause: 0,
    remaining: CONFIG.slideDuration,
    currentItemData: null,
    progressBars: [],      // { track, bar }
    preloaded: {},         // src -> { imgEl, status: 'loaded' | 'error' }
    touch: { startX: 0, deltaX: 0 },
    listeners: []          // { el, ev, fn, options, persist }
  };

  // ---------- HELPERS ----------
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  // Remove only non-persistent listeners (used when cleaning up slider)
  function clearTemporaryListeners() {
    const keep = [];
    state.listeners.forEach(({ el, ev, fn, options, persist }) => {
      if (!persist) {
        try {
          el.removeEventListener(ev, fn, options);
        } catch (err) {
          // fallback if options not identical
          try { el.removeEventListener(ev, fn); } catch (e) {}
        }
      } else {
        keep.push({ el, ev, fn, options, persist });
      }
    });
    state.listeners = keep;
  }

  // Remove all tracked listeners (rare; used if you truly want to unbind everything)
  function clearAllListeners() {
    state.listeners.forEach(({ el, ev, fn, options }) => {
      try {
        el.removeEventListener(ev, fn, options);
      } catch (err) {
        try { el.removeEventListener(ev, fn); } catch (e) {}
      }
    });
    state.listeners = [];
  }

  // options can be boolean or object; persist = true keeps across cleanupSlider()
  function addListener(el, ev, fn, options = undefined, persist = false) {
    if (!el || !el.addEventListener) return;
    el.addEventListener(ev, fn, options);
    state.listeners.push({ el, ev, fn, options, persist });
  }

  function now() { return performance.now(); }

  // ---------- INIT ----------
  function initModal() {
    if (initModal._initialized) return;
    initModal._initialized = true;

    // gallery items - use persistent listeners so they survive modal open/close
    document.querySelectorAll('.gallery-item').forEach(item => {
      // avoid double-binding: check if we've already tracked this exact handler
      const already = state.listeners.some(l => l.el === item && l.ev === 'click' && l.persist);
      if (already) return;

      addListener(item, 'click', function (e) {
        // if it's a video item, let the video-specific handler take over
        if (item.dataset.video) return;
        // don't open if clicking a nested control (menu/button)
        if (e.target.closest('.menu-button')) return;

        const itemId = Array.from(this.classList).find(cls => cls.startsWith('item-'));
        if (itemId && galleryData[itemId]) {
          openModal(itemId);
        } else {
          log('No portfolio data for', itemId);
        }
      }, undefined, true); // persist = true
    });

    // modal overlay & close - persistent
    addListener(modalOverlay, 'click', closeModal, undefined, true);
    addListener(modalClose, 'click', closeModal, undefined, true);

    // keyboard - persistent
    addListener(document, 'keydown', e => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') showNextSlideImmediate();
      if (e.key === 'ArrowLeft') showPrevSlideImmediate();
    }, undefined, true);

    // touch swipe on the slider container - persistent
    // pass passive option for touch handlers
    addListener(sliderContainer, 'touchstart', onTouchStart, { passive: true }, true);
    addListener(sliderContainer, 'touchmove', onTouchMove, { passive: true }, true);
    addListener(sliderContainer, 'touchend', onTouchEnd, undefined, true);
  }

  // ---------- OPEN / CLOSE ----------
  function openModal(itemId) {
    const data = galleryData[itemId];
    if (!data) {
      console.warn('No gallery data for', itemId);
      return;
    }
    state.currentItemData = data;
    modalTitle.textContent = data.title || '';
    modalSubtitle.textContent = data.subtitle || '';

    // description
    modalDescription.innerHTML = '';
    (data.description || []).forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      modalDescription.appendChild(p);
    });

    createToolsGrid(data.tools || []);
    createSpecsGrid(data.specs || []);
    createSlider(data.images || []);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // accessibility: focus close button
    try { modalClose.focus(); } catch (e) {}

    startAutoPlay();
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    stopAutoPlay();
    cleanupSlider();
    state.currentItemData = null;
  }

  // ---------- SLIDER CREATION ----------
  function createSlider(images) {
    cleanupSlider(); // clear previous slider content + temp listeners

    state.totalSlides = images.length || 0;
    state.currentSlide = 0;
    state.progressBars = [];
    state.preloaded = {};

    // create slides
    sliderTrack.innerHTML = '';
    sliderProgress.innerHTML = '';

    (images || []).forEach((src, index) => {
      // slide
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.dataset.index = index;

      // placeholder element while image loads (so layout stays)
      const placeholder = document.createElement('div');
      placeholder.className = 'slide-placeholder';
      placeholder.style.width = '100%';
      placeholder.style.height = '100%';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.pointerEvents = 'none';

      // create image element (we'll attach src after setting handlers)
      const img = document.createElement('img');
      img.className = 'slide-image loading';
      img.alt = `${CONFIG.defaultImageAlt} ${index + 1}`;

      // append img to placeholder, placeholder to slide
      placeholder.appendChild(img);
      slide.appendChild(placeholder);
      sliderTrack.appendChild(slide);

      // progress track
      const track = document.createElement('div');
      track.className = 'progress-track';
      track.dataset.slide = index;

      const bar = document.createElement('div');
      bar.className = 'progress-bar';
      track.appendChild(bar);

      sliderProgress.appendChild(track);
      state.progressBars.push({ track, bar });

      // click-to-jump progress - these are slider-specific, mark as temporary listeners
      const onTrackClick = (e) => {
        e.stopPropagation();
        goToSlide(index);
      };
      track.addEventListener('click', onTrackClick);
      state.listeners.push({ el: track, ev: 'click', fn: onTrackClick, options: undefined, persist: false });

      // start preloading for initial slides (others lazily)
      preloadImage(src, index);
    });

    // ensure track width (slides are flex 100%)
    updateSliderPosition();

    // hover pause/resume (slider-specific; attach as temporary listeners)
    addHoverPause();

    // ensure we render the initial progress bar state
    renderProgressBarsImmediate();
  }

  // ---------- PRELOAD / IMAGE HANDLING ----------
  function preloadImage(src, index) {
    if (!src) return;
    if (state.preloaded[src]) return; // already started

    const img = new Image();
    state.preloaded[src] = { imgEl: null, status: 'loading' };

    img.onload = () => {
      state.preloaded[src] = { imgEl: img, status: 'loaded' };
      // find the corresponding slide img element and set src / classes
      const slideImg = sliderTrack.querySelector(`.slide[data-index="${index}"] .slide-image`);
      if (slideImg) {
        slideImg.src = src;
        slideImg.classList.remove('loading');
        slideImg.classList.add('loaded');
      }
      log('preloaded', src);
      // attempt to preload further ahead (if requested)
      preloadAhead(index);
    };

    img.onerror = () => {
      state.preloaded[src] = { imgEl: null, status: 'error' };
      const slideImg = sliderTrack.querySelector(`.slide[data-index="${index}"] .slide-image`);
      if (slideImg) {
        slideImg.classList.remove('loading');
        slideImg.classList.add('error');
        // optionally show a small fallback element
        slideImg.removeAttribute('src');
        slideImg.alt = 'Image failed to load';
        slideImg.style.maxWidth = '60%';
        slideImg.style.padding = '18px';
        slideImg.style.background = '#2a2a2a';
        slideImg.style.borderRadius = '8px';
      }
      console.error('Image failed to preload:', src);
      preloadAhead(index);
    };

    // set src as last step to start loading
    img.src = src;
  }

  function preloadAhead(index) {
    const images = state.currentItemData?.images || [];
    for (let i = 1; i <= CONFIG.preloadAhead; i++) {
      if (!images.length) return;
      const j = (index + i) % images.length;
      const src = images[j];
      if (src && !state.preloaded[src]) {
        preloadImage(src, j);
      }
    }
  }

  // ---------- PROGRESS & AUTO-PLAY (uses RAF for smoother control) ----------
  function startAutoPlay() {
    stopAutoPlay();
    state.isPaused = false;
    state.elapsedBeforePause = 0;
    state.slideStartTs = now();
    state.remaining = CONFIG.slideDuration;
    // reset bars style and start animation
    animateProgressForCurrentSlide();
  }

  function stopAutoPlay() {
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = null;
    state.isPaused = true;
  }

  function pauseAutoPlay() {
    if (state.isPaused) return;
    state.isPaused = true;
    // compute elapsed
    const elapsed = now() - state.slideStartTs;
    state.elapsedBeforePause = clamp(elapsed, 0, CONFIG.slideDuration);
    state.remaining = clamp(CONFIG.slideDuration - state.elapsedBeforePause, 0, CONFIG.slideDuration);
    log('paused, elapsed', state.elapsedBeforePause, 'remaining', state.remaining);
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }

  function resumeAutoPlay() {
    if (!state.isPaused) return;
    state.isPaused = false;
    // resume where we left off
    state.slideStartTs = now() - state.elapsedBeforePause;
    animateProgressForCurrentSlide();
  }

  function animateProgressForCurrentSlide() {
    const start = now() - (state.elapsedBeforePause || 0);
    const duration = CONFIG.slideDuration;
    const currentIndex = state.currentSlide;

    // ensure the active track has proper transition reset
    state.progressBars.forEach((p, i) => {
      p.bar.style.transition = 'none';
      p.bar.style.width = i === currentIndex ? '0%' : (i < currentIndex ? '100%' : '0%');
      p.track.classList.toggle('active', i === currentIndex);
    });

    function step() {
      if (state.isPaused) return; // stop RAF if paused
      const t = now();
      const elapsed = t - start;
      const pct = clamp((elapsed / duration) * 100, 0, 100);
      const bar = state.progressBars[currentIndex]?.bar;
      if (bar) bar.style.width = pct + '%';

      if (elapsed >= duration) {
        // advance to next slide
        showNextSlideImmediate();
      } else {
        state.rafId = requestAnimationFrame(step);
      }
    }

    // start RAF
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(step);
  }

  // jump to next slide (immediate, resets timer)
  function showNextSlideImmediate() {
    if (state.totalSlides === 0) return;
    state.currentSlide = (state.currentSlide + 1) % state.totalSlides;
    updateSliderPosition();
    resetProgressAndStart();
    // preload ahead for the new index
    const nextSrc = state.currentItemData?.images?.[state.currentSlide];
    if (nextSrc) preloadAhead(state.currentSlide);
  }

  function showPrevSlideImmediate() {
    if (state.totalSlides === 0) return;
    state.currentSlide = (state.currentSlide - 1 + state.totalSlides) % state.totalSlides;
    updateSliderPosition();
    resetProgressAndStart();
    const nextSrc = state.currentItemData?.images?.[state.currentSlide];
    if (nextSrc) preloadAhead(state.currentSlide);
  }

  function goToSlide(i) {
    if (state.totalSlides === 0) return;
    state.currentSlide = clamp(i, 0, state.totalSlides - 1);
    updateSliderPosition();
    resetProgressAndStart();
    const src = state.currentItemData?.images?.[state.currentSlide];
    if (src) preloadAhead(state.currentSlide);
  }

  function resetProgressAndStart() {
    state.elapsedBeforePause = 0;
    state.remaining = CONFIG.slideDuration;
    state.slideStartTs = now();
    // start playing
    if (!state.isPaused) animateProgressForCurrentSlide();
  }

  // immediate style update for bars (used when building)
  function renderProgressBarsImmediate() {
    state.progressBars.forEach((p, i) => {
      p.bar.style.transition = 'none';
      p.bar.style.width = i === state.currentSlide ? '0%' : (i < state.currentSlide ? '100%' : '0%');
      p.track.classList.toggle('active', i === state.currentSlide);
    });
  }

  // ---------- SLIDER POSITIONING ----------
  function updateSliderPosition() {
    sliderTrack.style.transform = `translateX(-${state.currentSlide * 100}%)`;
    // ensure slides are visible in DOM order
    state.progressBars.forEach((p, i) => p.track.classList.toggle('active', i === state.currentSlide));
  }

  // ---------- HOVER PAUSE ----------
  function addHoverPause() {
    // remove older hover listeners first for slider (these were added as temporary listeners)
    // find and remove any existing temporary mouseenter/mouseleave listeners on sliderContainer
    state.listeners = state.listeners.filter(l => {
      if (l.el === sliderContainer && (l.ev === 'mouseenter' || l.ev === 'mouseleave') && !l.persist) {
        try { sliderContainer.removeEventListener(l.ev, l.fn, l.options); } catch (e) { try { sliderContainer.removeEventListener(l.ev, l.fn); } catch (e2) {} }
        return false; // remove from registry
      }
      return true;
    });

    const onEnter = () => pauseAutoPlay();
    const onLeave = () => resumeAutoPlay();

    sliderContainer.addEventListener('mouseenter', onEnter);
    sliderContainer.addEventListener('mouseleave', onLeave);
    state.listeners.push({ el: sliderContainer, ev: 'mouseenter', fn: onEnter, options: undefined, persist: false });
    state.listeners.push({ el: sliderContainer, ev: 'mouseleave', fn: onLeave, options: undefined, persist: false });
  }

  // ---------- TOUCH SWIPE HANDLERS ----------
  function onTouchStart(e) {
    if (!e.touches || !e.touches.length) return;
    const touch = e.touches[0];
    state.touch.startX = touch.clientX;
    state.touch.deltaX = 0;
    pauseAutoPlay();
  }

  function onTouchMove(e) {
    if (!e.touches || !e.touches.length) return;
    const touch = e.touches[0];
    state.touch.deltaX = touch.clientX - state.touch.startX;
    // we could apply a slight transform to sliderTrack for feedback (optional)
    const percent = (state.touch.deltaX / (sliderContainer.clientWidth || 1)) * 100;
    sliderTrack.style.transform = `translateX(calc(-${state.currentSlide * 100}% + ${percent}%))`;
  }

  function onTouchEnd(e) {
    const threshold = (sliderContainer.clientWidth || 0) * 0.15; // 15% swipe
    const dx = state.touch.deltaX;
    // reset transform
    sliderTrack.style.transform = `translateX(-${state.currentSlide * 100}%)`;
    if (dx > threshold) {
      showPrevSlideImmediate();
    } else if (dx < -threshold) {
      showNextSlideImmediate();
    } else {
      // small swipe -> resume current
      resetProgressAndStart();
    }
    resumeAutoPlay();
  }

  // ---------- TOOLS / SPECS RENDER ----------
  function createToolsGrid(tools = []) {
    toolsGrid.innerHTML = '';

    tools.forEach(t => {
      const el = document.createElement('div');
      el.className = 'tool-item';

      let iconHTML = '';

      if (t.icon && t.icon.trim() !== '') {
        // Normal icon
        iconHTML = `<img src="${t.icon}" alt="${t.name} icon">`;
      } else {
        // Generate fallback letter icon
        const letter = t.name ? t.name.trim()[0].toUpperCase() : '?';
        iconHTML = `
          <div class="fallback-icon">
            ${letter}
          </div>
        `;
      }

      el.innerHTML = `
        <div class="tool-icon">
          ${iconHTML}
        </div>
        <div class="tool-name">${t.name}</div>
      `;

      toolsGrid.appendChild(el);
    });
  }

  function createSpecsGrid(specs = []) {
    specsGrid.innerHTML = '';
    specs.forEach(s => {
      const el = document.createElement('div');
      el.className = 'spec-item';
      el.innerHTML = `<div class="spec-label">${s.label}</div><div class="spec-value">${s.value}</div>`;
      specsGrid.appendChild(el);
    });
  }

  // ---------- CLEANUP ----------
  function cleanupSlider() {
    // stop RAF / timers
    stopAutoPlay();

    // remove only temporary listeners (slider-specific, progress tracks, hover, etc.)
    clearTemporaryListeners();

    // clear DOM parts
    sliderTrack.innerHTML = '';
    sliderProgress.innerHTML = '';
    state.progressBars = [];
    state.preloaded = {};
  }

  // ---------- UTILITY: for debug devs ----------
  window.__PORTFOLIO_MODAL = {
    open: openModal,
    close: closeModal,
    next: showNextSlideImmediate,
    prev: showPrevSlideImmediate,
    goTo: goToSlide,
    state
  };

  // ---------- INITIALIZE ----------
  initModal();

  // Safety: observe resizes and recalc transform if necessary
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateSliderPosition();
    }, 120);
  });

  const imgs = document.querySelectorAll(".aboutme-img");
  let i = 0;

  const cycle = () => {
    imgs.forEach(img => img.classList.remove("active"));
    if (imgs.length) imgs[i].classList.add("active");
    i = (i + 1) % (imgs.length || 1);
  };

  cycle(); // initialize
  setInterval(cycle, 4000); // 4s per image
});

// ================= VIDEO MODAL ====================

// Separate listener specifically for video items (separate from photo modal listener)
setTimeout(() => {
  document.querySelectorAll('.gallery-item[data-video]').forEach(item => {
    // avoid double-binding
    if (item.__videoBound) return;
    item.__videoBound = true;

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openVideoModal(item);
    });
  });
}, 0);

function openVideoModal(item) {
  const videoModal = document.getElementById("videoModal");
  if (!videoModal) {
    console.warn('Video modal not found');
    return;
  }

  // Set video
  const videoFrame = videoModal.querySelector(".modal-video");
  if (videoFrame) {
    videoFrame.src = "https://www.youtube.com/embed/" + item.dataset.video + "?rel=0";
  }

  // Set title
  const titleEl = videoModal.querySelector(".modal-title");
  if (titleEl) {
    titleEl.textContent = item.dataset.title || "Video Project";
  }

  // Set subtitle
  const subtitleEl = videoModal.querySelector(".modal-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = item.dataset.subtitle || "";
  }

  // Set description
  const descEl = videoModal.querySelector(".modal-description");
  if (descEl) {
    descEl.innerHTML = "<p>" + (item.dataset.description || "") + "</p>";
  }

  // Tools grid
  const toolsGrid = videoModal.querySelector(".tools-grid");
  if (toolsGrid) {
    toolsGrid.innerHTML = "";
    const tools = (item.dataset.tools || "").split(",");
    tools.forEach(t => {
      const toolName = t.trim();
      if (!toolName) return;

      const el = document.createElement("div");
      el.className = "tool-item";

      el.innerHTML = `
        <div class="tool-icon">
          <div class="fallback-icon">${toolName.charAt(0).toUpperCase()}</div>
        </div>
        <div class="tool-name">${toolName}</div>
      `;

      toolsGrid.appendChild(el);
    });
  }

  // Open modal
  videoModal.classList.add("active");
  document.body.style.overflow = 'hidden';
}

// Close video modal
document.querySelectorAll('#videoModal .modal-close, #videoModal .modal-overlay')
  .forEach(el => {
    el.addEventListener('click', () => {
      const videoModal = document.getElementById("videoModal");
      if (videoModal) {
        videoModal.classList.remove("active");
        document.body.style.overflow = '';
        const videoFrame = videoModal.querySelector(".modal-video");
        if (videoFrame) {
          videoFrame.src = "";
        }
      }
    });
  });
