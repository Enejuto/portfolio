// gallery-hover.js
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  const items = Array.from(grid.querySelectorAll('.gallery-item'));

  // Handle video hover-play (if your gallery has any video-gif blocks)
  document.querySelectorAll(".video-gif video").forEach(vid => {
    vid.pause();
    const parent = vid.closest(".video-gif");

    parent.addEventListener("mouseenter", () => vid.play());
    parent.addEventListener("mouseleave", () => vid.pause());
  });

  // Hover + focus expansion logic
  items.forEach(item => {
    item.addEventListener('mouseenter', () => {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      grid.classList.add('has-hover');
    });

    item.addEventListener('mouseleave', () => {
      item.classList.remove('active');
      grid.classList.remove('has-hover');
    });

    // Keyboard accessibility (tab focus)
    item.addEventListener('focusin', () => {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      grid.classList.add('has-hover');
    });

    item.addEventListener('focusout', () => {
      item.classList.remove('active');
      grid.classList.remove('has-hover');
    });
  });
});
