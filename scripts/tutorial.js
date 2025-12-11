document.addEventListener("DOMContentLoaded", () => {

    const tutorial = document.getElementById("page-tutorial");
    const titleBox = document.querySelector(".tutorial-title");
    const textBox = document.querySelector(".tutorial-text");
    const continueBtn = document.querySelector(".tutorial-continue");
    const skipBtn = document.querySelector(".tutorial-skip");
    const highlight = document.querySelector(".tutorial-highlight");
    const stepCounter = document.querySelector(".tutorial-step");
    const tutorialBox = document.querySelector(".tutorial-box");

    let currentSelector = null;
    let step = 0;
    let originalScrollPosition = 0;
    let highlightAnimation = null;
    let isSpecialLayout = false;
    let isFooterLayout = false;

    // Steps
    const steps = [
        {
            element: null,
            title: "Welcome!",
            text: "This is a short tutorial/how-to on navigation within my portfolio. Click CONTINUE below to proceed!"
        },
        {
            element: ".gallery-grid",
            title: "Showcased Items",
            text: "This area showcases some of my favorite works - either because I like them personally, or they demonstrate skills I want to highlight."
        },
        {
            element: ".item-aerofront",
            title: "Interactive Gallery Items",
            text: "Click on any gallery item to view more details, images, and information about that project. Try clicking this AEROFRONT magazine item!",
            specialLayout: true
        },
        {
            element: ".aboutme-section",
            title: "Learn all about me",
            text: "Read more about my background and motives for why I do what I do!"
        },
        {
            element: ".footer",
            title: "Contact & Social Links",
            text: "Find my social media links and contact information here. You can copy my Discord tag by clicking on it!",
            footerLayout: true
        }
    ];

    /* ===========================
       POSITION BUTTONS RELATIVE TO TUTORIAL BOX
       =========================== */

    function positionButtons() {
        if (!tutorialBox) return;
        
        if (isSpecialLayout) {
            // Special layout for aerofront step - buttons below box
            const boxRect = tutorialBox.getBoundingClientRect();
            const boxBottom = boxRect.bottom + window.scrollY;
            
            // Position step counter - above buttons
            stepCounter.style.position = 'fixed';
            stepCounter.style.left = `${boxRect.left}px`;
            stepCounter.style.top = `${boxBottom + 10}px`;
            stepCounter.style.transform = 'none';
            stepCounter.style.margin = '0';
            
            // Position continue button - centered below box
            continueBtn.style.position = 'fixed';
            continueBtn.style.left = `${boxRect.left + (boxRect.width / 2) - 75}px`;
            continueBtn.style.top = `${boxBottom + 40}px`;
            continueBtn.style.transform = 'none';
            continueBtn.style.margin = '0';
            
            // Position skip button - right side below box
            skipBtn.style.position = 'fixed';
            skipBtn.style.left = `${boxRect.right - 120}px`;
            skipBtn.style.top = `${boxBottom + 40}px`;
            skipBtn.style.transform = 'none';
            skipBtn.style.margin = '0';
            
        } else if (isFooterLayout) {
            // Footer layout - everything at top
            const viewportHeight = window.innerHeight;
            
            // Position tutorial box at top
            tutorialBox.style.top = '100px';
            tutorialBox.style.bottom = 'auto';
            
            const boxRect = tutorialBox.getBoundingClientRect();
            const boxBottom = boxRect.bottom + window.scrollY;
            
            // Position step counter - above buttons at top
            stepCounter.style.position = 'fixed';
            stepCounter.style.left = `${boxRect.left}px`;
            stepCounter.style.top = `${boxBottom + 10}px`;
            stepCounter.style.transform = 'none';
            stepCounter.style.margin = '0';
            
            // Position continue button - centered below box at top
            continueBtn.style.position = 'fixed';
            continueBtn.style.left = `${boxRect.left + (boxRect.width / 2) - 75}px`;
            continueBtn.style.top = `${boxBottom + 40}px`;
            continueBtn.style.transform = 'none';
            continueBtn.style.margin = '0';
            
            // Position skip button - right side below box at top
            skipBtn.style.position = 'fixed';
            skipBtn.style.left = `${boxRect.right - 120}px`;
            skipBtn.style.top = `${boxBottom + 40}px`;
            skipBtn.style.transform = 'none';
            skipBtn.style.margin = '0';
            
        } else {
            // Normal layout - buttons below box at bottom
            const boxRect = tutorialBox.getBoundingClientRect();
            const boxBottom = boxRect.bottom + window.scrollY;
            
            // Position step counter - left side, aligned with box
            stepCounter.style.position = 'fixed';
            stepCounter.style.left = `${boxRect.left}px`;
            stepCounter.style.top = `${boxBottom + 10}px`;
            stepCounter.style.transform = 'none';
            stepCounter.style.margin = '0';
            
            // Position continue button - centered under box
            continueBtn.style.position = 'fixed';
            continueBtn.style.left = `${boxRect.left + (boxRect.width / 2) - 75}px`;
            continueBtn.style.top = `${boxBottom + 10}px`;
            continueBtn.style.transform = 'none';
            continueBtn.style.margin = '0';
            
            // Position skip button - right side, aligned with box
            skipBtn.style.position = 'fixed';
            skipBtn.style.left = `${boxRect.right - 120}px`;
            skipBtn.style.top = `${boxBottom + 10}px`;
            skipBtn.style.transform = 'none';
            skipBtn.style.margin = '0';
        }
    }

    /* ===========================
       SPECIAL LAYOUTS
       =========================== */

    function setSpecialLayout(enable) {
        isSpecialLayout = enable;
        
        if (enable) {
            tutorialBox.classList.add('special-layout');
            // Center the box on screen (not near element)
            tutorialBox.style.left = '50%';
            tutorialBox.style.top = '50%';
            tutorialBox.style.transform = 'translate(-50%, -50%)';
            tutorialBox.style.width = '350px';
            tutorialBox.style.maxWidth = '350px';
            tutorialBox.style.maxHeight = '300px';
            
            // Ensure gallery items are not blurred
            document.querySelectorAll('.gallery-item').forEach(item => {
                item.classList.add('tutorial-no-blur');
            });
        } else {
            tutorialBox.classList.remove('special-layout');
            // Reset to normal position
            tutorialBox.style.left = '';
            tutorialBox.style.top = '';
            tutorialBox.style.transform = '';
            tutorialBox.style.width = '';
            tutorialBox.style.maxWidth = '';
            tutorialBox.style.maxHeight = '';
        }
        
        // Reposition buttons
        setTimeout(positionButtons, 10);
    }

    function setFooterLayout(enable) {
        isFooterLayout = enable;
        
        if (enable) {
            tutorialBox.classList.add('footer-layout');
            // Move tutorial box to top
            tutorialBox.style.bottom = 'auto';
            tutorialBox.style.top = '100px';
            
            // Make footer more visible
            const footer = document.querySelector('.footer');
            if (footer) {
                footer.classList.add('tutorial-highlighted-footer');
            }
        } else {
            tutorialBox.classList.remove('footer-layout');
            // Reset to normal position
            tutorialBox.style.bottom = '';
            tutorialBox.style.top = '';
            
            // Remove footer highlighting
            const footer = document.querySelector('.footer');
            if (footer) {
                footer.classList.remove('tutorial-highlighted-footer');
            }
        }
        
        // Reposition buttons
        setTimeout(positionButtons, 10);
    }

    /* ===========================
       ANIMATION FUNCTIONS
       =========================== */

    function startPulsingAnimation() {
        if (highlightAnimation) {
            clearInterval(highlightAnimation);
        }
        
        let borderWidth = 3;
        let growing = true;
        
        highlightAnimation = setInterval(() => {
            if (growing) {
                borderWidth += 0.1;
                if (borderWidth >= 6) growing = false;
            } else {
                borderWidth -= 0.1;
                if (borderWidth <= 3) growing = true;
            }
            
            highlight.style.borderWidth = `${borderWidth}px`;
        }, 30);
    }

    function stopPulsingAnimation() {
        if (highlightAnimation) {
            clearInterval(highlightAnimation);
            highlightAnimation = null;
            highlight.style.borderWidth = '3px';
        }
    }

    /* ===========================
       SCROLL CONTROL
       =========================== */

    function lockScroll() {
        // Save current scroll position
        originalScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add lock class to body
        document.body.classList.add("tutorial-lock");
        document.body.style.top = `-${originalScrollPosition}px`;
        
        // Add blur to all content except highlighted element
        document.body.classList.add("tutorial-blur");
    }

    function unlockScroll() {
        // Remove lock class
        document.body.classList.remove("tutorial-lock");
        document.body.classList.remove("tutorial-blur");
        
        // Restore scroll position
        document.body.style.top = '';
        window.scrollTo(0, originalScrollPosition);
    }

    /* ===========================
       BLUR MANAGEMENT - IMPROVED
       =========================== */

    function updateBlur() {
        if (!currentSelector) {
            // No element to highlight, blur everything
            document.body.classList.add("tutorial-blur-all");
            document.body.classList.remove("tutorial-blur-except-highlight");
            return;
        }

        const el = document.querySelector(currentSelector);
        if (!el) return;

        // Remove blur from highlighted element
        el.classList.add("tutorial-no-blur");
        
        // For aerofront step, also unblur all gallery items
        if (isSpecialLayout) {
            document.querySelectorAll('.gallery-item').forEach(item => {
                item.classList.add('tutorial-no-blur');
            });
        }
        
        // Add class to blur everything except highlighted element
        document.body.classList.remove("tutorial-blur-all");
        document.body.classList.add("tutorial-blur-except-highlight");
    }

    function clearBlur() {
        // Remove blur from all elements
        document.body.classList.remove("tutorial-blur-all");
        document.body.classList.remove("tutorial-blur-except-highlight");
        
        // Remove no-blur class from any previously highlighted element
        document.querySelectorAll(".tutorial-no-blur").forEach(el => {
            el.classList.remove("tutorial-no-blur");
        });
    }

    /* ===========================
       HIGHLIGHT MANAGEMENT
       =========================== */

    function updateHighlight() {
        if (!currentSelector) {
            // Fade out highlight
            highlight.style.opacity = "0";
            highlight.style.borderWidth = "3px";
            stopPulsingAnimation();
            return;
        }

        const el = document.querySelector(currentSelector);
        if (!el) {
            highlight.style.opacity = "0";
            stopPulsingAnimation();
            return;
        }

        const rect = el.getBoundingClientRect();
        
        // First fade out the highlight
        highlight.style.opacity = "0";
        highlight.style.borderWidth = "3px";
        stopPulsingAnimation();
        
        // Wait for fade out, then reposition and fade in
        setTimeout(() => {
            // Set new position
            highlight.style.left = `${rect.left}px`;
            highlight.style.top = `${rect.top}px`;
            highlight.style.width = `${rect.width}px`;
            highlight.style.height = `${rect.height}px`;
            
            // Fade in with new position
            setTimeout(() => {
                highlight.style.opacity = "1";
                highlight.style.transition = 'opacity 0.4s ease, border-width 0.4s ease';
                
                // Start pulsing animation after highlight is visible
                setTimeout(() => {
                    startPulsingAnimation();
                }, 200);
            }, 50);
        }, 300);
    }

    /* ===========================
       SCROLLING
       =========================== */

    function scrollToElement(element) {
        if (!element) return;
        
        // Temporarily unlock scroll for smooth scrolling
        document.body.classList.remove("tutorial-lock");
        document.body.style.top = '';
        
        // Scroll to element with options
        element.scrollIntoView({
            behavior: 'smooth',
            block: isFooterLayout ? 'end' : 'center',
            inline: 'nearest'
        });
        
        // Re-lock scroll after animation
        setTimeout(() => {
            if (tutorial.classList.contains("tutorial-hidden")) return;
            lockScroll();
            updateHighlight();
            updateBlur();
            // Re-position buttons after scroll
            setTimeout(positionButtons, 50);
        }, 600);
    }

    /* ===========================
       UPDATE BUTTON TEXT
       =========================== */

    function updateContinueButton() {
        if (step >= steps.length - 1) {
            // Last step, change to FINISH
            continueBtn.textContent = "FINISH >>";
            continueBtn.classList.add("finish-btn");
        } else {
            continueBtn.textContent = "CONTINUE >>";
            continueBtn.classList.remove("finish-btn");
        }
    }

    /* ===========================
       SCROLL TO TOP ELEMENT
       =========================== */

    function scrollToTopElement() {
        const header = document.querySelector('.main-header');
        if (header) {
            header.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            // Fallback to top of page
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    /* ===========================
       FINISH TUTORIAL
       =========================== */

    function finishTutorial() {
        // Stop any animations
        stopPulsingAnimation();
        
        // Reset special layouts if active
        if (isSpecialLayout) {
            setSpecialLayout(false);
        }
        if (isFooterLayout) {
            setFooterLayout(false);
        }
        
        // Fade out tutorial elements
        tutorial.classList.add("tutorial-fade-out");
        
        // Scroll to top element smoothly
        setTimeout(() => {
            scrollToTopElement();
        }, 300);
        
        // Completely remove tutorial after animations
        setTimeout(() => {
            tutorial.classList.add("tutorial-hidden");
            tutorial.classList.remove("tutorial-fade-out");
            highlight.style.opacity = "0";
            unlockScroll();
            clearBlur();
            currentSelector = null;
            
            // Reset step for if tutorial is started again
            step = 0;
            updateContinueButton();
            
            // Hide tutorial elements completely
            tutorial.style.display = 'none';
        }, 800);
    }

    /* ===========================
       SKIP TUTORIAL
       =========================== */

    function skipTutorial() {
        stopPulsingAnimation();
        
        // Reset special layouts if active
        if (isSpecialLayout) {
            setSpecialLayout(false);
        }
        if (isFooterLayout) {
            setFooterLayout(false);
        }
        
        // Fade out tutorial elements
        tutorial.classList.add("tutorial-fade-out");
        
        // Scroll to top element smoothly
        setTimeout(() => {
            scrollToTopElement();
        }, 300);
        
        // Completely remove tutorial after animations
        setTimeout(() => {
            tutorial.classList.add("tutorial-hidden");
            tutorial.classList.remove("tutorial-fade-out");
            highlight.style.opacity = "0";
            unlockScroll();
            clearBlur();
            currentSelector = null;
            
            // Reset step
            step = 0;
            updateContinueButton();
            
            // Hide tutorial elements completely
            tutorial.style.display = 'none';
        }, 500);
    }

    /* ===========================
       STEP HANDLING
       =========================== */

    function loadStep(n) {
        if (n >= steps.length) {
            finishTutorial();
            return;
        }

        const stepData = steps[n];
        
        // Update text content
        titleBox.textContent = stepData.title;
        textBox.textContent = stepData.text;
        stepCounter.textContent = `Step ${n + 1} of ${steps.length}`;
        
        currentSelector = stepData.element;
        
        // Update continue button text
        updateContinueButton();
        
        // Clear previous blur effects
        clearBlur();
        
        // Handle special layout for aerofront step
        if (stepData.specialLayout) {
            setSpecialLayout(true);
        } else if (isSpecialLayout) {
            setSpecialLayout(false);
        }
        
        // Handle footer layout
        if (stepData.footerLayout) {
            setFooterLayout(true);
        } else if (isFooterLayout) {
            setFooterLayout(false);
        }
        
        // Position buttons relative to tutorial box
        setTimeout(positionButtons, 10);
        
        // Wait for DOM to update
        setTimeout(() => {
            if (stepData.element) {
                const el = document.querySelector(stepData.element);
                if (el) {
                    // Scroll to element
                    scrollToElement(el);
                    
                    // Update highlight and blur after a delay
                    setTimeout(() => {
                        updateHighlight();
                        updateBlur();
                    }, 400);
                }
            } else {
                // Welcome step - no element to highlight, blur everything
                updateHighlight();
                updateBlur();
            }
        }, 50);
    }

    /* ===========================
       EVENT LISTENERS
       =========================== */

    continueBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        
        if (step >= steps.length - 1) {
            // Last step - finish tutorial
            finishTutorial();
        } else {
            step++;
            loadStep(step);
        }
    });

    skipBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        skipTutorial();
    });

    // Close tutorial on ESC key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !tutorial.classList.contains("tutorial-hidden")) {
            skipTutorial();
        }
    });

    // Update positions on resize
    window.addEventListener("resize", () => {
        if (!tutorial.classList.contains("tutorial-hidden")) {
            if (isSpecialLayout) {
                setSpecialLayout(true);
            }
            if (isFooterLayout) {
                setFooterLayout(true);
            }
            positionButtons();
            updateHighlight();
            updateBlur();
        }
    });

    /* ===========================
       START TUTORIAL
       =========================== */

    window.startTutorial = () => {
        // Reset step
        step = 0;
        
        // Show tutorial
        tutorial.style.display = 'block';
        setTimeout(() => {
            tutorial.classList.remove("tutorial-hidden");
        }, 10);
        
        // Reset button text
        updateContinueButton();
        
        // Reset layouts
        if (isSpecialLayout) {
            setSpecialLayout(false);
        }
        if (isFooterLayout) {
            setFooterLayout(false);
        }
        
        // Lock scroll and start
        lockScroll();
        
        // Position buttons
        setTimeout(positionButtons, 50);
        
        // Load first step
        setTimeout(() => loadStep(0), 100);
    };
});