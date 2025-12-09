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
  const galleryData = typeof PORTFOLIO_ITEMS !== 'undefined' ? PORTFOLIO_ITEMS : {};

  // ---------- DOM SELECTORS (matching your markup) ----------
  const modal = document.getElementById('galleryModal');
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
    listeners: []          // to easily remove later
  };

  // ---------- HELPERS ----------
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function clearListeners() {
    state.listeners.forEach(({ el, ev, fn }) => el.removeEventListener(ev, fn));
    state.listeners = [];
  }

  function addListener(el, ev, fn) {
    el.addEventListener(ev, fn);
    state.listeners.push({ el, ev, fn });
  }

  function now() { return performance.now(); }

  // ---------- INIT ----------
  function initModal() {
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', function (e) {
        // Skip if it's a video item (video modal handles it separately)
        if (item.dataset.video) return;
        
        if (!e.target.closest('.menu-button')) {
          const itemId = Array.from(this.classList).find(cls => cls.startsWith('item-'));
          if (itemId && galleryData[itemId]) openModal(itemId);
        }
      });
    });

    addListener(modalOverlay, 'click', closeModal);
    addListener(modalClose, 'click', closeModal);

    // keyboard
    addListener(document, 'keydown', e => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') showNextSlideImmediate();
      if (e.key === 'ArrowLeft') showPrevSlideImmediate();
    });

    // ensure touch support for swipe
    addListener(sliderContainer, 'touchstart', onTouchStart, { passive: true });
    addListener(sliderContainer, 'touchmove', onTouchMove, { passive: true });
    addListener(sliderContainer, 'touchend', onTouchEnd);
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
    data.description.forEach(text => {
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
    modalClose.focus?.();

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
    cleanupSlider(); // in case replacing content

    state.totalSlides = images.length;
    state.currentSlide = 0;
    state.progressBars = [];
    state.preloaded = {};

    // create slides
    sliderTrack.innerHTML = '';
    sliderProgress.innerHTML = '';

    images.forEach((src, index) => {
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

      // click-to-jump progress
      track.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(index);
      });

      // start preloading for initial slides (others lazily)
      preloadImage(src, index);
    });

    // ensure track width (slides are flex 100%)
    updateSliderPosition();

    // hover pause/resume
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
      const bar = state.progressBars[currentIndex].bar;
      bar.style.width = pct + '%';

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
    state.currentSlide = (state.currentSlide + 1) % state.totalSlides;
    updateSliderPosition();
    resetProgressAndStart();
    // preload ahead for the new index
    const nextSrc = state.currentItemData?.images?.[state.currentSlide];
    if (nextSrc) preloadAhead(state.currentSlide);
  }

  function showPrevSlideImmediate() {
    state.currentSlide = (state.currentSlide - 1 + state.totalSlides) % state.totalSlides;
    updateSliderPosition();
    resetProgressAndStart();
    const nextSrc = state.currentItemData?.images?.[state.currentSlide];
    if (nextSrc) preloadAhead(state.currentSlide);
  }

  function goToSlide(i) {
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
    // remove older hover listeners first
    sliderContainer.onmouseenter = null;
    sliderContainer.onmouseleave = null;

    sliderContainer.addEventListener('mouseenter', () => {
      pauseAutoPlay();
    });

    sliderContainer.addEventListener('mouseleave', () => {
      resumeAutoPlay();
    });
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
    const percent = (state.touch.deltaX / sliderContainer.clientWidth) * 100;
    sliderTrack.style.transform = `translateX(calc(-${state.currentSlide * 100}% + ${percent}%))`;
  }

  function onTouchEnd(e) {
    const threshold = sliderContainer.clientWidth * 0.15; // 15% swipe
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
    // remove event listeners we added dynamically
    clearListeners();
    // clear DOM parts
    sliderTrack.innerHTML = '';
    sliderProgress.innerHTML = '';
    state.progressBars = [];
    state.preloaded = {};
    // reattach the base listeners for overlay/close/keyboard/touch
    initModal(); // rebind base listeners (safe no-op for duplicates)
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
    imgs[i].classList.add("active");
    i = (i + 1) % imgs.length;
  };    

  cycle(); // initialize
  setInterval(cycle, 4000); // 4s per image
});

// ================= VIDEO MODAL ====================

// Separate listener specifically for video items (separate from photo modal listener)
setTimeout(() => {
  document.querySelectorAll('.gallery-item[data-video]').forEach(item => {
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
