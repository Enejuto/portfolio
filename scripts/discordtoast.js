document.addEventListener("DOMContentLoaded", () => {

    const discordBtn = document.querySelector(".discord-tag");
    const toast = document.getElementById("copy-toast");

    // Safety checks to avoid any errors
    if (!discordBtn) {
        console.warn("Discord copy button (.discord-tag) not found.");
        return;
    }
    if (!toast) {
        console.warn("#copy-toast element not found.");
        return;
    }

    discordBtn.addEventListener("click", () => {

        // Copy text to clipboard
        navigator.clipboard.writeText("enejuto").catch(err => {
            console.error("Clipboard error:", err);
        });

        // Show toast
        toast.classList.add("show");

        // Auto-hide
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2000);
    });

});
