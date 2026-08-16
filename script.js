(() => {
  "use strict";

  const MOBILE_BREAKPOINT = 680;
  const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

  const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  const menuButton = document.querySelector(".menu-button");
  const navigation = document.querySelector("#site-nav");
  const revealElements = document.querySelectorAll(".reveal");
  const pageSections = document.querySelectorAll("main section[id]");

  const navigationLinks = document.querySelectorAll(
    '#site-nav a[href^="#"]',
  );

  const yearElement = document.querySelector("#year");
  const reducedMotion = window.matchMedia(
    REDUCED_MOTION_QUERY,
  );

  let previouslyFocusedElement = null;

  function isMenuOpen() {
    return (
      menuButton?.getAttribute("aria-expanded") === "true"
    );
  }

  function openMenu() {
    if (!menuButton || !navigation) return;

    previouslyFocusedElement = document.activeElement;

    menuButton.setAttribute("aria-expanded", "true");
    navigation.classList.add("is-open");
    document.body.style.overflow = "hidden";

    navigation
      .querySelector(FOCUSABLE_SELECTOR)
      ?.focus();
  }

  function closeMenu({ restoreFocus = false } = {}) {
    if (!menuButton || !navigation) return;

    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
    document.body.style.overflow = "";

    if (
      restoreFocus &&
      previouslyFocusedElement instanceof HTMLElement
    ) {
      previouslyFocusedElement.focus();
    }

    previouslyFocusedElement = null;
  }

  function toggleMenu() {
    if (isMenuOpen()) {
      closeMenu({ restoreFocus: true });
    } else {
      openMenu();
    }
  }

  function trapMenuFocus(event) {
    if (
      event.key !== "Tab" ||
      !isMenuOpen() ||
      !navigation
    ) {
      return;
    }

    const focusableElements = [
      ...navigation.querySelectorAll(
        FOCUSABLE_SELECTOR,
      ),
    ];

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (
      event.shiftKey &&
      document.activeElement === firstElement
    ) {
      event.preventDefault();
      lastElement.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === lastElement
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function handleKeyboardNavigation(event) {
    if (event.key === "Escape" && isMenuOpen()) {
      closeMenu({ restoreFocus: true });
      return;
    }

    trapMenuFocus(event);
  }

  function handleViewportChange() {
    if (
      window.innerWidth > MOBILE_BREAKPOINT &&
      isMenuOpen()
    ) {
      closeMenu();
    }
  }

  function initializeMenu() {
    if (!menuButton || !navigation) return;

    menuButton.addEventListener(
      "click",
      toggleMenu,
    );

    navigation.addEventListener(
      "click",
      (event) => {
        if (event.target.closest("a")) {
          closeMenu();
        }
      },
    );

    document.addEventListener(
      "keydown",
      handleKeyboardNavigation,
    );

    window.addEventListener(
      "resize",
      handleViewportChange,
      { passive: true },
    );
  }

  function showAllRevealElements() {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }

  function initializeRevealAnimations() {
    if (
      reducedMotion.matches ||
      !("IntersectionObserver" in window)
    ) {
      showAllRevealElements();
      return;
    }

    const revealObserver =
      new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add(
              "is-visible",
            );

            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -40px",
        },
      );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });

    reducedMotion.addEventListener(
      "change",
      (event) => {
        if (!event.matches) return;

        revealObserver.disconnect();
        showAllRevealElements();
      },
    );
  }

  function setActiveNavigation(sectionId) {
    navigationLinks.forEach((link) => {
      if (link.hash === `#${sectionId}`) {
        link.setAttribute(
          "aria-current",
          "location",
        );
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function initializeActiveNavigation() {
    if (
      !("IntersectionObserver" in window) ||
      pageSections.length === 0
    ) {
      return;
    }

    const visibleSections = new Map();

    const sectionObserver =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSections.set(
                entry.target.id,
                entry.intersectionRatio,
              );
            } else {
              visibleSections.delete(
                entry.target.id,
              );
            }
          });

          const activeSection = [
            ...visibleSections.entries(),
          ].sort(
            (first, second) =>
              second[1] - first[1],
          )[0];

          if (activeSection) {
            setActiveNavigation(
              activeSection[0],
            );
          }
        },
        {
          rootMargin: "-20% 0px -60%",
          threshold: [
            0,
            0.25,
            0.5,
            0.75,
            1,
          ],
        },
      );

    pageSections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  function initializeSmoothAnchorLinks() {
    document
      .querySelectorAll('a[href^="#"]')
      .forEach((link) => {
        link.addEventListener(
          "click",
          (event) => {
            const destination =
              document.querySelector(link.hash);

            if (!destination) return;

            event.preventDefault();

            destination.scrollIntoView({
              behavior: reducedMotion.matches
                ? "auto"
                : "smooth",
              block: "start",
            });

            history.replaceState(
              null,
              "",
              link.hash,
            );
          },
        );
      });
  }

  function initializeFooterYear() {
    if (yearElement) {
      yearElement.textContent = String(
        new Date().getFullYear(),
      );
    }
  }

  initializeMenu();
  initializeRevealAnimations();
  initializeActiveNavigation();
  initializeSmoothAnchorLinks();
  initializeFooterYear();
})();