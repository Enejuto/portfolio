document.addEventListener("DOMContentLoaded", () => {

    const tutorial = document.getElementById("page-tutorial");
    const titleBox = document.querySelector(".tutorial-title");
    const textBox = document.querySelector(".tutorial-text");
    const continueBtn = document.querySelector(".tutorial-continue");
    const highlight = document.querySelector(".tutorial-highlight");
    const stepCounter = document.querySelector(".tutorial-step");

    let currentSelector = null;
    let step = 0;
    let originalScrollPosition = 0;

    // Steps
    const steps = [
        {
            element: null,
            title: "Welcome to the Portfolio",
            text: "This tutorial will guide you through key parts of the website."
        },
        {
            element: ".gallery-grid",
            title: "Showcase Grid",
            text: "This grid contains visual highlights of featured work."
        },
        {
            element: ".aboutme-section",
            title: "About Me",
            text: "Learn more about my background, design interests, and creative style."
        }
    ];

    /* ===========================
       SCROLL CONTROL - IMPROVED
       =========================== */

    function lockScroll() {
        // Save current scroll position
        originalScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add lock class to body
        document.body.classList.add("tutorial-lock");
        document.body.style.top = `-${originalScrollPosition}px`;
    }

    function unlockScroll() {
        // Remove lock class
        document.body.classList.remove("tutorial-lock");
        
        // Restore scroll position
        document.body.style.top = '';
        window.scrollTo(0, originalScrollPosition);
    }

    /* ===========================
       SCROLLING - SIMPLE AND RELIABLE
       =========================== */

    function scrollToElement(element) {
        if (!element) return;
        
        // Temporarily unlock scroll for smooth scrolling
        document.body.classList.remove("tutorial-lock");
        
        // Scroll to element with options
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        });
        
        // Re-lock scroll after animation
        setTimeout(() => {
            if (tutorial.classList.contains("tutorial-hidden")) return;
            lockScroll();
            updateHighlight();
        }, 600); // Match the smooth scroll duration
    }

    /* ===========================
       HIGHLIGHT POSITIONING - FIXED
       =========================== */

    function updateHighlight() {
        if (!currentSelector) {
            highlight.style.opacity = "0";
            return;
        }

        const el = document.querySelector(currentSelector);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        
        // Use fixed positioning based on viewport
        highlight.style.left = `${rect.left}px`;
        highlight.style.top = `${rect.top}px`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        highlight.style.opacity = "1";
        
        // Add transition for smooth movement
        highlight.style.transition = 'all 0.3s ease';
    }

    /* ===========================
       STEP HANDLING
       =========================== */

    function loadStep(n) {
        if (n >= steps.length) {
            endTutorial();
            return;
        }

        const stepData = steps[n];
        
        // Update text content
        titleBox.textContent = stepData.title;
        textBox.textContent = stepData.text;
        stepCounter.textContent = `Step ${n + 1} of ${steps.length}`;
        
        currentSelector = stepData.element;
        
        // Hide highlight initially
        highlight.style.opacity = "0";
        
        // Wait for DOM to update
        setTimeout(() => {
            if (stepData.element) {
                const el = document.querySelector(stepData.element);
                if (el) {
                    // Scroll to element
                    scrollToElement(el);
                    
                    // Show highlight after a delay
                    setTimeout(() => {
                        updateHighlight();
                    }, 400);
                }
            } else {
                // Welcome step - no element to highlight
                highlight.style.opacity = "0";
            }
        }, 50);
    }

    function endTutorial() {
        tutorial.classList.add("tutorial-hidden");
        highlight.style.opacity = "0";
        unlockScroll();
        currentSelector = null;
    }

    /* ===========================
       EVENT LISTENERS
       =========================== */

    continueBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        step++;
        loadStep(step);
    });

    // Close tutorial on ESC key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !tutorial.classList.contains("tutorial-hidden")) {
            endTutorial();
        }
    });

    // Update highlight on resize
    window.addEventListener("resize", () => {
        if (!tutorial.classList.contains("tutorial-hidden")) {
            updateHighlight();
        }
    });

    /* ===========================
       START TUTORIAL
       =========================== */

    window.startTutorial = () => {
        // Reset step
        step = 0;
        
        // Show tutorial
        tutorial.classList.remove("tutorial-hidden");
        
        // Lock scroll and start
        lockScroll();
        
        // Load first step
        setTimeout(() => loadStep(0), 100);
    };
});