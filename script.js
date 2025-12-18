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
});