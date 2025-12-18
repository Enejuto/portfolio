document.addEventListener('DOMContentLoaded', function() {
    const scrollContainer = document.querySelector('.scroll-container');
    const transitionSection = document.querySelector('.sticky-transition');
    const header = document.querySelector('.main-header-container');
    
    let isTransitioning = false;
    
    // Scroll behavior for sticky section
    if (scrollContainer && transitionSection) {
        scrollContainer.addEventListener('scroll', function() {
            const scrollTop = scrollContainer.scrollTop;
            const windowHeight = window.innerHeight;
            const transitionOffset = transitionSection.offsetTop;
            
            // Calculate if we're in the transition section
            const inTransition = scrollTop >= transitionOffset && 
                                scrollTop < transitionOffset + windowHeight;
            
            if (inTransition && !isTransitioning) {
                isTransitioning = true;
                console.log('Entering sticky transition section');
                
                // Optional: Add class to header during transition
                header.classList.add('in-transition');
            } else if (!inTransition && isTransitioning) {
                isTransitioning = false;
                header.classList.remove('in-transition');
            }
            
            // Optional: Header background opacity on scroll
            if (scrollTop > 100) {
                header.style.background = 'rgba(24, 24, 24, 0.98)';
            } else {
                header.style.background = 'rgba(24, 24, 24, 0.95)';
            }
        });
    }
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#contact') return;
            
            e.preventDefault();
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Use the scroll container for smooth scrolling
                if (scrollContainer) {
                    const offsetTop = targetElement.offsetTop;
                    scrollContainer.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback to default scroll
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // Contact button smooth scroll
    const contactBtn = document.querySelector('.header-contact-btn');
    if (contactBtn) {
        contactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const lastSection = document.querySelector('.second-section');
            if (lastSection && scrollContainer) {
                scrollContainer.scrollTo({
                    top: lastSection.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // Add hover effect to project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05) translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) translateY(0)';
        });
    });

       // Enhanced parallax effect for the layered layout
    const heroLayout = document.querySelector('.hero-layout');
    const portfolioFilled = document.querySelector('.portfolio-filled');
    const portfolioStroked = document.querySelectorAll('.portfolio-stroked');
    const heroImage = document.querySelector('.hero-image');
    
    if (heroLayout) {
        // Mouse move parallax
        heroLayout.addEventListener('mousemove', function(e) {
            const { left, top, width, height } = this.getBoundingClientRect();
            const x = (e.clientX - left) / width - 0.5;
            const y = (e.clientY - top) / height - 0.5;
            
            // Filled word moves opposite to mouse
            if (portfolioFilled) {
                const xMove = x * -15;
                const yMove = y * -8;
                portfolioFilled.style.transform = `translate(calc(-50% + ${xMove}px), calc(-50% + ${yMove}px))`;
            }
            
            // Stroked words move with mouse but at different speeds
            portfolioStroked.forEach((word, index) => {
                const depth = (index + 1) * 0.3;
                const xMove = x * 20 * depth;
                const yMove = y * 10 * depth;
                word.style.transform = `translateX(calc(-50% + ${xMove}px)) translateY(${yMove}px)`;
            });
            
            // Image moves slightly
            if (heroImage) {
                const xMove = x * -10;
                const yMove = y * -5;
                heroImage.style.transform = `translateY(-5px) rotate(-1deg) translate(${xMove}px, ${yMove}px)`;
            }
        });
        
        // Reset on mouse leave
        heroLayout.addEventListener('mouseleave', function() {
            if (portfolioFilled) {
                portfolioFilled.style.transform = `translate(-50%, -50%)`;
                portfolioFilled.style.transition = 'transform 0.5s cubic-bezier(0.645, 0.045, 0.355, 1)';
            }
            
            portfolioStroked.forEach(word => {
                word.style.transform = `translateX(-50%)`;
                word.style.transition = 'transform 0.5s cubic-bezier(0.645, 0.045, 0.355, 1)';
            });
            
            if (heroImage) {
                heroImage.style.transform = 'translateY(-5px) rotate(-1deg)';
                heroImage.style.transition = 'transform 0.5s cubic-bezier(0.645, 0.045, 0.355, 1)';
            }
            
            // Reset transition after animation
            setTimeout(() => {
                if (portfolioFilled) portfolioFilled.style.transition = '';
                portfolioStroked.forEach(word => word.style.transition = '');
                if (heroImage) heroImage.style.transition = '';
            }, 500);
        });
    }
    
    // Image load animation
    const heroImg = document.querySelector('.hero-image img');
    if (heroImg) {
        heroImg.addEventListener('load', function() {
            this.style.opacity = '0.7';
            this.style.transition = 'opacity 1s ease';
        });
    }

});

// -----------------
// Simple i18n handler
// -----------------
(function(){
    function getQueryParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    const translations = {
        en: {
            'nav.about': 'About Me',
            'nav.work': 'Work',
            'nav.contact': 'Contact',
            'button.contact': 'Get in touch!',
            
        },
        nl: {
            'nav.about': 'Over Mij',
            'nav.work': 'Werk',
            'nav.contact': 'Contact',
            'button.contact': 'Neem contact op',
            
        }
    };

    function applyTranslations(lang){
        const map = translations[lang] || translations.en;
        Object.keys(map).forEach(key => {
            const el = document.querySelector('[data-i18n="' + key + '"]');
            if (el) el.textContent = map[key];
        });
        // also update hero description if present
        const heroDesc = document.querySelector('.hero-description p');
        if (heroDesc && map['hero.description']) heroDesc.textContent = map['hero.description'];
    }

    function setLanguage(lang){
        localStorage.setItem('site_lang', lang);
        applyTranslations(lang);
        // update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);
    }

    document.addEventListener('DOMContentLoaded', function(){
        const param = getQueryParam('lang');
        const saved = localStorage.getItem('site_lang');
        const lang = param || saved || 'en';
        applyTranslations(lang);

        // attach listeners to locale flags
        document.querySelectorAll('.locale-flag').forEach(node => {
            node.addEventListener('click', function(e){
                e.preventDefault();
                const href = this.getAttribute('href');
                // href is like ?lang=en
                const qp = new URLSearchParams(href.replace('?',''));
                const newLang = qp.get('lang') || (this.textContent.trim() === '🇳🇱' ? 'nl' : 'en');
                setLanguage(newLang);
            });
        });
    });
})();

// Copy-to-clipboard + toast for Discord contact
document.addEventListener('DOMContentLoaded', function () {
    const discordAnchor = document.querySelector('.contact-bubble li.discord a');
    function ensureToast() {
        let t = document.querySelector('.site-toast');
        if (!t) {
            t = document.createElement('div');
            t.className = 'site-toast';
            t.setAttribute('role', 'status');
            t.setAttribute('aria-live', 'polite');
            document.body.appendChild(t);
        }
        return t;
    }

    function showToast(message, ms = 2000) {
        const t = ensureToast();
        t.textContent = message;
        t.classList.add('show');
        clearTimeout(t._hideTimer);
        t._hideTimer = setTimeout(() => t.classList.remove('show'), ms);
    }

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        // fallback
        return new Promise((resolve, reject) => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                resolve();
            } catch (err) {
                reject(err);
            } finally {
                document.body.removeChild(ta);
            }
        });
    }

    if (discordAnchor) {
        discordAnchor.addEventListener('click', function (e) {
            e.preventDefault();
            const name = 'enejuto';
            copyText(name).then(() => {
                showToast('Copied "' + name + '" to clipboard');
            }).catch(() => {
                showToast('Could not copy to clipboard');
            });
        });
    }
});