"use strict";

const state = {
  menu: null,
  currentIndex: -1,
  coverOpen: false,
  searchOpen: false,
  imageOpen: false,
  transitioning: false,
  searchMatches: [],
  touchStart: null,

};

const elements = {
  app: document.querySelector("#app"),
  cover: document.querySelector("#cover"),
  bookShell: document.querySelector("#book-shell"),
  openMenu: document.querySelector("#open-menu"),
  brandButton: document.querySelector("#brand-button"),
  pageStage: document.querySelector("#page-stage"),
  pageCount: document.querySelector("#page-count"),
  previousButton: document.querySelector("#previous-button"),
  categoriesButton: document.querySelector("#categories-button"),
  nextButton: document.querySelector("#next-button"),
  searchTrigger: document.querySelector("#search-trigger"),
  searchOverlay: document.querySelector("#search-overlay"),
  searchClose: document.querySelector("#search-close"),
  searchInput: document.querySelector("#search-input"),
  searchResults: document.querySelector("#search-results"),
};

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

const TORONTO_TIME_ZONE = "America/Toronto";



const DAILY_SPECIAL_CATEGORY_IDS = new Set([
  "menu-daily-specials",
  "samosa-daily-specials",
]);

function isDailySpecialCategory(category) {
  return DAILY_SPECIAL_CATEGORY_IDS.has(category?.id);
}

function getTorontoWeekday() {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    timeZone: TORONTO_TIME_ZONE,
  }).format(new Date());
}

function isTodaySpecial(category, item) {
  return (
    isDailySpecialCategory(category) &&
    String(item?.name || "").toLowerCase() ===
      getTorontoWeekday().toLowerCase()
  );
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function itemAnchor(categoryId, itemName) {
  return `item-${slugify(categoryId)}-${slugify(itemName)}`;
}

function itemPrice(item) {
  return item.price || item.options?.[0]?.price || "See options";
}

function setupOptionalImages(root = document) {
  root.querySelectorAll("[data-optional-image]").forEach((container) => {
    const image = container.querySelector("[data-image]");

    if (!image || image.dataset.ready === "true") return;

    image.dataset.ready = "true";

    const showImage = () => {
      container.classList.add("has-image");
    };

    const showFallback = () => {
      container.classList.remove("has-image");
      image.hidden = true;
    };

    image.addEventListener("load", showImage, {
      once: true,
    });

    image.addEventListener("error", showFallback, {
      once: true,
    });

    if (image.complete) {
      if (image.naturalWidth > 0) {
        showImage();
      } else {
        showFallback();
      }
    }
  });
}

function renderPrice(item, choicesShown = false) {
  if (item.options?.length && !choicesShown) {
    return `
      <div class="price-options">
        ${item.options
          .map(
            (option) => `
              <div class="price-line">
                <span>${escapeHTML(option.label)}</span>
                <i aria-hidden="true"></i>
                <strong>${escapeHTML(option.price)}</strong>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }

  return item.price
    ? `<strong class="single-price">${escapeHTML(item.price)}</strong>`
    : "";
}

function renderChoices(item) {
  if (!item.choices?.length) return "";

  const list = `
    <ul
      class="choice-list"
      aria-label="${escapeHTML(item.name)} choices"
    >
      ${item.choices
        .map((choice) => `<li>${escapeHTML(choice)}</li>`)
        .join("")}
    </ul>
  `;

  const prices = item.options?.length
    ? `
      <div
        class="choice-prices"
        aria-label="${escapeHTML(item.name)} prices"
      >
        ${item.options
          .map(
            (option) => `
              <span>
                <small>${escapeHTML(option.label)}</small>
                <strong>${escapeHTML(option.price)}</strong>
              </span>
            `,
          )
          .join("")}
      </div>
    `
    : "";

  return list + prices;
}

function renderImageSlot(item, index) {
  if (!item.imageSlot && !item.image) return "";

  if (item.image) {
    const isInitiallyVisible = index < 2;
    const thumbnail = item.thumbnail || item.image;

    const shouldLoadImmediately =
      Boolean(item.thumbnail) || isInitiallyVisible;

    return `
      <button
        class="product-image-slot"
        type="button"
        data-enlarge-image
        data-full-image="${escapeHTML(item.image)}"
        aria-label="Enlarge image of ${escapeHTML(item.name)}"
      >
        <img
          src="${escapeHTML(thumbnail)}"
          data-fallback-image="${escapeHTML(item.image)}"
          alt="${escapeHTML(item.name)}"
          width="360"
          height="360"
          loading="${shouldLoadImmediately ? "eager" : "lazy"}"
          fetchpriority="${isInitiallyVisible ? "high" : "auto"}"
          decoding="async"
        >
      </button>
    `;
  }

  return `
    <div
      class="product-image-slot"
      aria-hidden="true"
    ></div>
  `;
}

function renderItem(category, item, index) {
  const hasImage = Boolean(item.imageSlot || item.image);
  const isDailySpecial = isDailySpecialCategory(category);
  const isToday = isTodaySpecial(category, item);

  return `
    <article
      id="${escapeHTML(itemAnchor(category.id, item.name))}"
      class="menu-item${hasImage ? " has-image" : ""}${
        isDailySpecial ? " daily-special-card" : ""
      }${isToday ? " is-today" : ""}"
      ${
        isToday
          ? 'data-today-special aria-current="date"'
          : ""
      }
    >
      ${renderImageSlot(item, index)}

      <div class="menu-item-content">
        ${
          isToday
            ? '<span class="today-special-label">Today’s Special</span>'
            : ""
        }

        <div class="item-topline">
          <span class="item-number">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <h3>${escapeHTML(item.name)}</h3>

          ${
            item.accent
              ? `<em>${escapeHTML(item.accent)}</em>`
              : ""
          }

          ${renderPrice(item, Boolean(item.choices?.length))}
        </div>

        ${renderChoices(item)}

        ${
          !item.choices?.length && item.note
            ? `<p>${escapeHTML(item.note)}</p>`
            : ""
        }

        ${
          item.allergyWarning
            ? `
              <p class="item-allergy-note">
                <strong>Allergy warning:</strong>
                ${escapeHTML(item.allergyWarning)}
              </p>
            `
            : ""
        }
      </div>
    </article>
  `;
}

function renderFlavourGuide(guide) {
  if (!guide) return "";

  const words = String(
    guide.title || "Choose your Flavour",
  ).split(" ");

  const finalWord = words.pop() || "Flavour";

  return `
    <section
      class="fusion-guide"
      aria-label="Fusion flavour choices"
    >
      <div class="fusion-guide-intro">
        <p>${escapeHTML(words.join(" "))}</p>
        <h3>${escapeHTML(finalWord)}</h3>
        <small>${escapeHTML(guide.note)}</small>
      </div>

      <ul>
        ${guide.choices
          .map((choice) => `<li>${escapeHTML(choice)}</li>`)
          .join("")}
      </ul>
    </section>
  `;
}

function renderSpecialNotice(notice) {
  if (!notice) return "";

  return `
    <section
      class="specials-notice"
      aria-label="Daily special conditions"
    >
      <div class="specials-notice-main">
        ${notice.primary
          .map((line) => `<strong>${escapeHTML(line)}</strong>`)
          .join("")}
      </div>

      <p>(${escapeHTML(notice.secondary)})</p>
    </section>
  `;
}

/*
  This inline SVG creates the Instagram logo.

  It does not require an image file, icon font,
  Bootstrap Icons, Font Awesome or another library.
*/
const instagramLogo = `
  <svg
    class="menu-marquee-instagram-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="5"
    ></rect>

    <circle
      cx="12"
      cy="12"
      r="4"
    ></circle>

    <circle
      class="instagram-icon-dot"
      cx="17.5"
      cy="6.5"
      r="1"
    ></circle>
  </svg>
`;

function renderCategories() {
  const categories = state.menu.categories;

  return `
    <section class="contents-page">
      <aside
        class="menu-marquee"
        aria-label="Restaurant hours, Instagram and locations"
      >
        <div class="menu-marquee-track">
          <div class="menu-marquee-copy">
            <span>Monday–Saturday 11 AM–9 PM</span>
            <span>Sunday 11 AM–8 PM</span>

            <span>
              <a
                class="menu-marquee-instagram"
                href="https://www.instagram.com/samosahut/?hl=en#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram: @samosahut"
              >
                ${instagramLogo}
                <b>@samosahut</b>
              </a>
            </span>

            <span>
              Locations: Ajax &amp; Bowmanville
            </span>
          </div>

          <div
            class="menu-marquee-copy"
            aria-hidden="true"
          >
            <span>Monday–Saturday 11 AM–9 PM</span>
            <span>Sunday 11 AM–8 PM</span>

            <span>
              <b class="menu-marquee-instagram">
                ${instagramLogo}
                <span>@samosahut</span>
              </b>
            </span>

            <span>
              Locations: Ajax &amp; Bowmanville
            </span>
          </div>
        </div>
      </aside>

      <div class="contents-heading">
        <p>Choose your craving</p>
        <h2>Menu Categories</h2>

        <span
          class="hand-underline"
          aria-hidden="true"
        ></span>
      </div>

      <div class="category-grid">
        ${categories
          .map(
            (category, index) => `
              <button
                type="button"
                class="category-tile"
                data-category-index="${index}"
              >
                <span class="category-number">
                  ${escapeHTML(category.number)}
                </span>

                <span class="category-copy">
                  <b>${escapeHTML(category.name)}</b>

                  <small>
                    ${escapeHTML(category.description)}
                  </small>
                </span>

                <span
                  class="category-arrow"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </button>
            `,
          )
          .join("")}
      </div>

      <p class="tax-note">
        Prices shown are exclusive of applicable taxes.
      </p>
    </section>
  `;
}

function renderCategory(category) {
  const isDailySpecials =
    isDailySpecialCategory(category);

  const ending = category.flavourGuide
    ? renderFlavourGuide(category.flavourGuide)
    : category.specialNotice
      ? renderSpecialNotice(category.specialNotice)
      : category.footnote
        ? `
          <p class="category-footnote">
            ${escapeHTML(category.footnote)}
          </p>
        `
        : "";

  return `
    <section class="category-page${
      isDailySpecials ? " daily-specials-page" : ""
    }">
      <div class="category-heading">
        <p>${escapeHTML(category.eyebrow)}</p>
        <h2>${escapeHTML(category.name)}</h2>

        <span
          class="hand-underline"
          aria-hidden="true"
        ></span>

        <small>
          ${escapeHTML(category.description)}
        </small>
      </div>

      ${
        isDailySpecials
          ? `
            <p class="daily-specials-hint">
              <strong>
                ${escapeHTML(getTorontoWeekday())}
              </strong>
              is highlighted

              <span aria-hidden="true">·</span>

              Swipe to view other days
            </p>
          `
          : ""
      }

      <div class="menu-grid${
        isDailySpecials ? " daily-specials-grid" : ""
      }">
        ${category.items
          .map((item, index) =>
            renderItem(category, item, index),
          )
          .join("")}
      </div>

      ${ending}
    </section>
  `;
}

function updateNavigation() {
  const total = state.menu.categories.length;
  const isCategories = state.currentIndex < 0;

  elements.pageCount.textContent = isCategories
    ? `${total} categories`
    : `${String(state.currentIndex + 1).padStart(
        2,
        "0",
      )} / ${String(total).padStart(2, "0")}`;

  elements.previousButton.disabled = isCategories;

  elements.nextButton.disabled =
    state.currentIndex >= total - 1;

  elements.categoriesButton.classList.toggle(
    "active",
    isCategories,
  );
}

function renderView() {
  const category =
    state.currentIndex >= 0
      ? state.menu.categories[state.currentIndex]
      : null;

  elements.pageStage.innerHTML = category
    ? renderCategory(category)
    : renderCategories();

  updateNavigation();

  if (
    category &&
    isDailySpecialCategory(category)
  ) {
    centerTodaySpecial();
  }
}

function centerTodaySpecial() {
  window.requestAnimationFrame(() => {
    const scroller = elements.pageStage.querySelector(
      ".daily-specials-grid",
    );

    const todayCard = scroller?.querySelector(
      "[data-today-special]",
    );

    if (
      !scroller ||
      !todayCard ||
      scroller.scrollWidth <= scroller.clientWidth + 1
    ) {
      return;
    }

    const scrollerBox = scroller.getBoundingClientRect();
    const cardBox = todayCard.getBoundingClientRect();

    const left =
      scroller.scrollLeft +
      cardBox.left -
      scrollerBox.left -
      (scroller.clientWidth - cardBox.width) / 2;

    scroller.scrollTo({
      left: Math.max(0, left),
      behavior: reducedMotion.matches
        ? "auto"
        : "smooth",
    });
  });
}

async function goTo(index) {
  if (!state.menu || state.transitioning) return;

  const target = Math.max(
    -1,
    Math.min(
      state.menu.categories.length - 1,
      index,
    ),
  );

  if (target === state.currentIndex) {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches
        ? "auto"
        : "smooth",
    });

    return;
  }

  const direction =
    target > state.currentIndex ? 1 : -1;

  state.transitioning = true;

  if (
    !reducedMotion.matches &&
    elements.pageStage.animate
  ) {
    const outgoing = elements.pageStage.animate(
      [
        {
          opacity: 1,
          transform: "translate3d(0,0,0)",
        },
        {
          opacity: 0,
          transform: `translate3d(${
            direction * -28
          }px,0,0)`,
        },
      ],
      {
        duration: 130,
        easing: "ease-out",
        fill: "forwards",
      },
    );

    await outgoing.finished.catch(() => {});
  }

  state.currentIndex = target;

  renderView();

  window.scrollTo({
    top: 0,
    behavior: "auto",
  });

  if (
    !reducedMotion.matches &&
    elements.pageStage.animate
  ) {
    const incoming = elements.pageStage.animate(
      [
        {
          opacity: 0,
          transform: `translate3d(${
            direction * 28
          }px,0,0)`,
        },
        {
          opacity: 1,
          transform: "translate3d(0,0,0)",
        },
      ],
      {
        duration: 190,
        easing: "cubic-bezier(.2,.75,.2,1)",
        fill: "both",
      },
    );

    await incoming.finished.catch(() => {});
  }

  state.transitioning = false;
}

function openMenu() {
  if (!state.menu) return;

  state.coverOpen = true;

  elements.app.classList.add("is-open");

  elements.cover.setAttribute(
    "aria-hidden",
    "true",
  );

  elements.bookShell.setAttribute(
    "aria-hidden",
    "false",
  );

  elements.bookShell.inert = false;

  updateBackToTop();

window.setTimeout(() => {
  showSwipeHintOnce();
}, 500);
}

function returnToCover() {
  closeSearch();

  state.currentIndex = -1;

  renderView();

  state.coverOpen = false;

  elements.app.classList.remove("is-open");

  elements.cover.setAttribute(
    "aria-hidden",
    "false",
  );

  elements.bookShell.setAttribute(
    "aria-hidden",
    "true",
  );

  elements.bookShell.inert = true;

  updateBackToTop();

  window.scrollTo({
    top: 0,
    behavior: "auto",
  });
}

function openSearch() {
  state.searchOpen = true;

  elements.searchOverlay.classList.add(
    "is-visible",
  );

  elements.searchOverlay.setAttribute(
    "aria-hidden",
    "false",
  );

  document.body.classList.add("modal-open");

  renderSearchResults("");

  window.setTimeout(() => {
    elements.searchInput.focus();
  }, 80);
}

function closeSearch() {
  if (!state.searchOpen) return;

  state.searchOpen = false;

  elements.searchOverlay.classList.remove(
    "is-visible",
  );

  elements.searchOverlay.setAttribute(
    "aria-hidden",
    "true",
  );

  elements.searchInput.value = "";

  document.body.classList.remove("modal-open");
}

function setupImageViewer() {
  const viewer = document.createElement("section");

  viewer.id = "image-viewer";
  viewer.className = "image-viewer";

  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");

  viewer.setAttribute(
    "aria-label",
    "Food image viewer",
  );

  viewer.setAttribute(
    "aria-hidden",
    "true",
  );

  viewer.innerHTML = `
    <button
      class="image-viewer-close"
      type="button"
      aria-label="Close image viewer"
    >
      &times;
    </button>

    <div class="image-viewer-frame">
      <img alt="">
      <p></p>
    </div>
  `;

  document.body.appendChild(viewer);

  elements.imageViewer = viewer;

  elements.imageViewerImage =
    viewer.querySelector("img");

  elements.imageViewerCaption =
    viewer.querySelector("p");

  elements.imageViewerClose =
    viewer.querySelector(".image-viewer-close");
}

function setupBackToTop() {
  const button =
    document.createElement("button");

  button.className = "back-to-top";
  button.type = "button";

  button.setAttribute(
    "aria-label",
    "Back to top",
  );

  button.setAttribute(
    "title",
    "Back to top",
  );

  document.body.appendChild(button);

  elements.backToTop = button;
}
function setupSwipeHint() {
  const hint = document.createElement("aside");

  hint.className = "swipe-hint";
  hint.setAttribute("role", "status");
  hint.setAttribute("aria-live", "polite");
  hint.setAttribute("aria-hidden", "true");

  hint.innerHTML = `
    <svg
      class="swipe-hint-animation"
      viewBox="0 0 76 34"
      aria-hidden="true"
    >
      <path
        class="swipe-hint-arrow"
        d="M8 17H68M59 8L68 17L59 26"
      ></path>

      <circle
        class="swipe-hint-dot"
        cx="17"
        cy="17"
        r="7"
      ></circle>
    </svg>

    <span class="swipe-hint-copy">
      <strong>Swipe right</strong>
      <small>Go to the next menu page</small>
    </span>
  `;

  document.body.appendChild(hint);

  elements.swipeHint = hint;
}

function hideSwipeHint() {
  if (!elements.swipeHint) return;

  window.clearTimeout(state.swipeHintTimer);

  elements.swipeHint.classList.remove(
    "is-visible",
  );

  elements.swipeHint.setAttribute(
    "aria-hidden",
    "true",
  );
}

function showSwipeHintOnce() {
  if (
    !elements.swipeHint ||
    state.swipeHintShown ||
    !window.matchMedia("(max-width: 700px)").matches
  ) {
    return;
  }

  state.swipeHintShown = true;

  elements.swipeHint.setAttribute(
    "aria-hidden",
    "false",
  );

  elements.swipeHint.classList.add(
    "is-visible",
  );

  state.swipeHintTimer = window.setTimeout(() => {
    elements.swipeHint.classList.remove(
      "is-visible",
    );

    elements.swipeHint.setAttribute(
      "aria-hidden",
      "true",
    );

    state.swipeHintTimer = null;
  }, 3000);
}

function updateBackToTop() {
  if (!elements.backToTop) return;

  elements.backToTop.classList.toggle(
    "is-visible",
    state.coverOpen,
  );
}

function openImageViewer(trigger) {
  const image = trigger.querySelector("img");

  if (!image) return;

  state.imageOpen = true;
  state.lastImageTrigger = trigger;

  elements.imageViewerImage.src =
    trigger.dataset.fullImage ||
    image.currentSrc ||
    image.src;

  elements.imageViewerImage.alt = image.alt;

  elements.imageViewerCaption.textContent =
    image.alt;

  elements.imageViewer.classList.add(
    "is-visible",
  );

  elements.imageViewer.setAttribute(
    "aria-hidden",
    "false",
  );

  document.body.classList.add("modal-open");

  window.setTimeout(() => {
    elements.imageViewerClose.focus();
  }, 80);
}

function closeImageViewer() {
  if (!state.imageOpen) return;

  state.imageOpen = false;

  elements.imageViewer.classList.remove(
    "is-visible",
  );

  elements.imageViewer.setAttribute(
    "aria-hidden",
    "true",
  );

  elements.imageViewerImage.removeAttribute(
    "src",
  );

  document.body.classList.remove("modal-open");

  state.lastImageTrigger?.focus();
  state.lastImageTrigger = null;
}

function buildSearchMatches(query) {
  const normalized =
    query.trim().toLowerCase();

  if (!normalized) return [];

  return state.menu.categories.flatMap(
    (category, categoryIndex) =>
      category.items
        .filter((item) => {
          const searchable = [
            item.name,
            item.note,
            item.accent,
            ...(item.choices || []),
            ...(item.options || []).map(
              (option) => option.label,
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(normalized);
        })
        .map((item) => ({
          category,
          categoryIndex,
          item,
        })),
  );
}

function renderSearchResults(query) {
  state.searchMatches =
    buildSearchMatches(query);

  if (!query.trim()) {
    elements.searchResults.innerHTML = `
      <p class="search-state">
        Search every item, flavour and option
        across all ${state.menu.categories.length}
        categories.
      </p>
    `;

    return;
  }

  if (!state.searchMatches.length) {
    elements.searchResults.innerHTML = `
      <p class="search-state">
        No menu items found for
        “${escapeHTML(query)}”.
      </p>
    `;

    return;
  }

  elements.searchResults.innerHTML =
    state.searchMatches
      .map(
        ({ category, item }, index) => `
          <button
            type="button"
            class="search-result"
            data-search-index="${index}"
          >
            <span>
              <small>
                ${escapeHTML(category.shortName)}
              </small>

              <b>${escapeHTML(item.name)}</b>

              ${
                item.note
                  ? `<em>${escapeHTML(item.note)}</em>`
                  : ""
              }
            </span>

            <strong>
              ${escapeHTML(itemPrice(item))}
            </strong>
          </button>
        `,
      )
      .join("");
}

async function chooseSearchMatch(index) {
  const match = state.searchMatches[index];

  if (!match) return;

  closeSearch();
  hideSwipeHint();

  await goTo(match.categoryIndex);

  document
    .getElementById(
      itemAnchor(
        match.category.id,
        match.item.name,
      ),
    )
    ?.scrollIntoView({
      behavior: reducedMotion.matches
        ? "auto"
        : "smooth",
      block: "center",
    });
}

function bindEvents() {
  elements.openMenu.addEventListener(
    "click",
    openMenu,
  );

  elements.brandButton.addEventListener(
    "click",
    returnToCover,
  );

  elements.previousButton.addEventListener(
    "click",
    () => {
      goTo(state.currentIndex - 1);
    },
  );

  elements.categoriesButton.addEventListener(
    "click",
    () => {
      goTo(-1);
    },
  );

  elements.nextButton.addEventListener(
    "click",
    () => {
      goTo(state.currentIndex + 1);
    },
  );

  elements.searchTrigger.addEventListener(
    "click",
    openSearch,
  );

  elements.searchClose.addEventListener(
    "click",
    closeSearch,
  );

  elements.searchInput.addEventListener(
    "input",
    (event) => {
      renderSearchResults(event.target.value);
    },
  );

  elements.pageStage.addEventListener(
    "click",
    (event) => {
      const imageTrigger = event.target.closest(
        "[data-enlarge-image]",
      );

      if (imageTrigger) {
        openImageViewer(imageTrigger);
        return;
      }

      const categoryButton =
        event.target.closest(
          "[data-category-index]",
        );

      if (categoryButton) {
        goTo(
          Number(categoryButton.dataset.categoryIndex),
  );
}
        },
      );

  elements.pageStage.addEventListener(
    "error",
    (event) => {
      const image = event.target.closest?.(
        "img[data-fallback-image]",
      );

      if (
        !image ||
        image.dataset.fallbackUsed === "true"
      ) {
        return;
      }

      image.dataset.fallbackUsed = "true";
      image.src = image.dataset.fallbackImage;
    },
    true,
  );

  elements.imageViewerClose.addEventListener(
    "click",
    closeImageViewer,
  );

  elements.imageViewer.addEventListener(
    "click",
    (event) => {
      if (event.target === elements.imageViewer) {
        closeImageViewer();
      }
    },
  );

  elements.backToTop.addEventListener(
    "click",
    () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches
          ? "auto"
          : "smooth",
      });
    },
  );

  elements.searchResults.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest(
        "[data-search-index]",
      );

      if (button) {
        chooseSearchMatch(
          Number(button.dataset.searchIndex),
        );
      }
    },
  );

  elements.searchOverlay.addEventListener(
    "click",
    (event) => {
      if (
        event.target === elements.searchOverlay
      ) {
        closeSearch();
      }
    },
  );

  elements.pageStage.addEventListener(
    "touchstart",
    (event) => {
      if (
        event.target.closest(
          "button, input, a, .daily-specials-grid",
        ) ||
        state.searchOpen ||
        state.imageOpen
      ) {
        return;
      }

      const touch = event.touches[0];

      state.touchStart = {
        x: touch.clientX,
        y: touch.clientY,
      };
    },
    {
      passive: true,
    },
  );

  elements.pageStage.addEventListener(
    "touchend",
    (event) => {
      if (
        !state.touchStart ||
        state.searchOpen
      ) {
        return;
      }

      const touch = event.changedTouches[0];

      const dx =
        touch.clientX - state.touchStart.x;

      const dy =
        touch.clientY - state.touchStart.y;

      state.touchStart = null;

      if (
        Math.abs(dx) < 72 ||
        Math.abs(dx) < Math.abs(dy) * 1.35
      ) {
        return;
      }

      goTo(
        state.currentIndex +
          (dx < 0 ? 1 : -1),
      );
    },
    {
      passive: true,
    },
  );

  window.addEventListener(
    "keydown",
    (event) => {
      if (!state.coverOpen) return;

      if (
        event.key === "Escape" &&
        state.imageOpen
      ) {
        return closeImageViewer();
      }

      if (
        event.key === "Escape" &&
        state.searchOpen
      ) {
        return closeSearch();
      }

      if (
        state.searchOpen ||
        state.imageOpen
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        goTo(state.currentIndex + 1);
      }

      if (event.key === "ArrowLeft") {
        goTo(state.currentIndex - 1);
      }
    },
  );
}

async function loadMenu() {
  try {
    const response = await fetch(
      "menu.json",
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        `Menu request failed with ${response.status}`,
      );
    }

    const menu = await response.json();

    if (
      !Array.isArray(menu.categories) ||
      !menu.categories.length
    ) {
      throw new Error(
        "No menu categories found",
      );
    }

    state.menu = menu;

    renderView();

    elements.openMenu.disabled = false;
  } catch (error) {
    console.error(error);

    elements.pageStage.innerHTML = `
      <p class="error-state">
        The menu could not load. If you opened
        index.html directly, run it through GitHub
        Pages, Cloudflare Pages or a local web server
        so menu.json can be read.
      </p>
    `;

    elements.openMenu.disabled = true;
  }
}

async function init() {
  elements.bookShell.inert = true;

    setupOptionalImages();
    setupImageViewer();
    setupBackToTop();
    setupSwipeHint();
    bindEvents();
  
  await loadMenu();

  if (
    "serviceWorker" in navigator &&
    location.protocol.startsWith("http")
  ) {
    navigator.serviceWorker
      .register("service-worker.js")
      .catch((error) => {
        console.warn(
          "Service worker not registered",
          error,
        );
      });
  }
}

init();
