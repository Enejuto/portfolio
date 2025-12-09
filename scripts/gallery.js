/* ===========================
   GALLERY PAGE SCRIPT
=========================== */

// Modal elements
const modal = document.querySelector(".gallery-modal");
const modalClose = document.querySelector(".modal-close");
const modalImg = document.querySelector(".modal-image");
const modalTitle = document.querySelector(".modal-title");
const modalSubtitle = document.querySelector(".modal-subtitle");
const modalTagsContainer = document.querySelector(".modal-tags");
const modalDescription = document.querySelector(".modal-description");

// Search + Filter
const searchInput = document.getElementById("gallerySearch");
const tagFilters = document.querySelectorAll(".tag-filter");
const galleryItems = document.querySelectorAll(".gallery-item");

/* ===========================
   OPEN MODAL
=========================== */
document.querySelectorAll("[data-open-modal]").forEach(item => {
  item.addEventListener("click", () => {

    modalTitle.textContent = item.dataset.title;
    modalSubtitle.textContent = item.dataset.subtitle;
    modalDescription.textContent = item.dataset.description;
    modalImg.src = item.dataset.img;

    modalTagsContainer.innerHTML = "";
    item.dataset.tags.split(",").forEach(t => {
      const tag = document.createElement("span");
      tag.classList.add("modal-tag");
      tag.textContent = t.trim();
      modalTagsContainer.appendChild(tag);
    });

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  });
});

/* ===========================
   CLOSE MODAL
=========================== */
modalClose.addEventListener("click", () => {
  modal.classList.remove("open");
  document.body.style.overflow = "";
});

modal.addEventListener("click", e => {
  if (e.target === modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
});

/* ===========================
   SEARCH FILTER
=========================== */
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();

  galleryItems.forEach(item => {
    const title = item.dataset.title.toLowerCase();
    const tags = item.dataset.tags.toLowerCase();

    item.style.display =
      title.includes(q) || tags.includes(q) ? "block" : "none";
  });
});

/* ===========================
   TAG FILTERS
=========================== */
tagFilters.forEach(btn => {
  btn.addEventListener("click", () => {
    const tag = btn.dataset.tag;

    tagFilters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    galleryItems.forEach(item => {
      const itemTags = item.dataset.tags.toLowerCase();

      item.style.display =
        tag === "all" || itemTags.includes(tag) ? "block" : "none";
    });
  });
});
