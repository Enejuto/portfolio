document.addEventListener("DOMContentLoaded", () => {

    const tutorial = document.getElementById("page-tutorial");
    const titleBox = document.querySelector(".tutorial-title");
    const textBox = document.querySelector(".tutorial-text");
    const continueBtn = document.querySelector(".tutorial-continue");
    const highlight = document.querySelector(".tutorial-highlight");
    const stepCounter = document.querySelector(".tutorial-step");
    const dimLayer = document.querySelector(".tutorial-dim");

    let currentSelector = null;
    let step = 0;

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
       SCROLL CONTROL
       =========================== */

    // Lock manual scroll
    function lockScroll() {
        document.body.classList.add("tutorial-lock");
    }

    // Unlock scroll at end
    function unlockScroll() {
        document.body.classList.remove("tutorial-lock");
    }

    // Smooth scroll to center element
    function scrollElementToCenter(el) {
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const elementCenter = rect.top + window.scrollY + rect.height / 2;
        const screenCenter = window.innerHeight / 2;

        const targetY = elementCenter - screenCenter;

        // Native smooth scroll if supported
        if ("scrollBehavior" in document.documentElement.style) {
            window.scroll({
                top: Math.max(0, targetY),
                behavior: "smooth"
            });
        } else {
            window.scrollTo(0, Math.max(0, targetY));
        }
    }

    /* ===========================
       HIGHLIGHT POSITIONING
       =========================== */

    function updateHighlight() {
        if (!currentSelector) {
            highlight.style.opacity = "0";
            return;
        }

        const el = document.querySelector(currentSelector);
        if (!el) return;

        const rect = el.getBoundingClientRect();

        // Absolute position so it follows the real element
        highlight.style.left = rect.left + window.scrollX + "px";
        highlight.style.top = rect.top + window.scrollY + "px";
        highlight.style.width = rect.width + "px";
        highlight.style.height = rect.height + "px";
        highlight.style.opacity = "1";
    }

    // Re-sync highlight on scroll & resize
    window.addEventListener("scroll", updateHighlight, { passive: true });
    window.addEventListener("resize", updateHighlight);

    /* ===========================
       STEP HANDLING
       =========================== */

    function loadStep(n) {
        if (n >= steps.length) {
            tutorial.classList.add("tutorial-hidden");
            highlight.style.opacity = "0";
            dimLayer.style.opacity = "0";
            currentSelector = null;
            unlockScroll();
            return;
        }

        const s = steps[n];

        // UI text
        titleBox.textContent = s.title;
        textBox.textContent = s.text;
        stepCounter.textContent = `Step ${n + 1} of ${steps.length}`;

        currentSelector = s.element;

        if (s.element) {
            const el = document.querySelector(s.element);
            if (el) {
                scrollElementToCenter(el);
                setTimeout(updateHighlight, 350); // Wait for scroll animation to begin
            }
        } else {
            highlight.style.opacity = "0";
        }
    }

    continueBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        step++;
        loadStep(step);
    });

    /* ===========================
       START TUTORIAL
       =========================== */

    window.startTutorial = () => {
        step = 0;
        tutorial.classList.remove("tutorial-hidden");
        dimLayer.style.opacity = "1";
        lockScroll();

        // Give layout time before positioning
        setTimeout(() => loadStep(0), 100);
    };
});
