/* Santa Baby: progressively enhanced, dependency-free accordions and seating plan. */
(() => {
  'use strict';
  const section = document.querySelector('[data-sb-info]');
  if (!section) return;
  const grid = section.querySelector('[data-sb-grid]');
  if (!grid) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 759px)');
  const duration = 540;
  const root = document.documentElement;
  const states = [...grid.querySelectorAll('[data-sb-toggle]')].map((button) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    return panel && { button, panel, inner: panel.firstElementChild, open: false, animation: null };
  }).filter(Boolean);
  if (!states.length || states.some((state) => !state.inner)) return;

  // Disable native scroll anchoring only during our mobile layout change.
  // Otherwise the browser can compensate a second time when a panel collapses.
  let layoutBatch = false;
  let anchoringFrame = 0;
  const needsAnchoringLock = () => mobile.matches &&
    (layoutBatch || states.some((state) => state.animation));
  const updateAnchoring = () => {
    cancelAnimationFrame(anchoringFrame);
    if (needsAnchoringLock()) {
      root.classList.add('sb-layout-changing');
      return;
    }
    // Retain the lock for the final layout frame, including the return to auto.
    anchoringFrame = requestAnimationFrame(() => {
      if (!needsAnchoringLock()) root.classList.remove('sb-layout-changing');
    });
  };
  const settle = (state) => {
    state.panel.hidden = !state.open;
    state.panel.style.height = '';
    state.animation = null;
    updateAnchoring();
  };
  const setPanel = (state, open, animate = true) => {
    const { panel, button, inner } = state;
    // Measure before cancelling, so rapid clicks continue from the current frame.
    const start = panel.hidden ? 0 : panel.getBoundingClientRect().height;
    if (state.animation) {
      state.animation.cancel();
      state.animation = null;
    }
    state.open = open;
    button.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    panel.inert = !open;
    if (open) panel.hidden = false;
    panel.style.height = `${start}px`;
    // Establish the initial content state before starting its staggered reveal.
    void panel.offsetHeight;
    panel.classList.toggle('is-open', open);
    if (!animate || motion.matches || !panel.animate) {
      settle(state);
      return;
    }
    const end = open ? inner.getBoundingClientRect().height : 0;
    const animation = panel.animate([
      { height: `${start}px` },
      { height: `${end}px` }
    ], { duration, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    panel.style.height = `${end}px`;
    state.animation = animation;
    updateAnchoring();
    animation.finished.then(() => {
      if (state.animation === animation) settle(state);
    }).catch(() => { /* Cancellation is expected when clicking or resizing. */ });
  };
  states.forEach((state) => setPanel(state, false, false));
  section.classList.add('sb-ready');

  // A single, synchronous compensation, never a per-frame scrolling loop.
  // Explicitly override the site's smooth scrolling for this layout correction;
  // this also works in older Safari versions without behavior: "instant".
  const compensateScroll = (top) => {
    const limit = Math.max(0, root.scrollHeight - root.clientHeight);
    const target = Math.max(0, Math.min(limit, top));
    if (Math.abs(window.scrollY - target) < 1) return;
    const value = root.style.getPropertyValue('scroll-behavior');
    const priority = root.style.getPropertyPriority('scroll-behavior');
    root.style.setProperty('scroll-behavior', 'auto', 'important');
    try {
      window.scrollTo({ top: target, left: window.scrollX, behavior: 'auto' });
    } finally {
      if (value) root.style.setProperty('scroll-behavior', value, priority);
      else root.style.removeProperty('scroll-behavior');
    }
  };
  const setSelection = (state, open) => {
    if (!mobile.matches) {
      // Preserve the original desktop transition and layout.
      states.forEach((other) => {
        if (other !== state && other.open) setPanel(other, false);
      });
      setPanel(state, open);
      return;
    }

    layoutBatch = true;
    updateAnchoring();
    try {
      const { button } = state;
      const header = document.querySelector('[data-header]');
      const safeTop = (header ? Math.max(0, header.getBoundingClientRect().bottom) : 0) + 18;
      const before = button.getBoundingClientRect();
      // Normally the card stays exactly where it was tapped. Only a hidden card
      // (e.g. when closing with Escape) is brought back below the fixed header.
      const anchorTop = before.top < safeTop || before.top >= window.innerHeight - 44
        ? safeTop : before.top;
      const selectedIndex = states.indexOf(state);
      states.forEach((other, index) => {
        if (other === state) return;
        if (index < selectedIndex && !other.panel.hidden) {
          // Close preceding content in this same task and compensate once.
          // Its height must not keep moving the selected card during unfolding.
          // Also finish an already-closing panel after a rapid second tap.
          setPanel(other, false, false);
        } else if (other.open) {
          setPanel(other, false);
        }
      });
      setPanel(state, open);
      compensateScroll(window.scrollY + button.getBoundingClientRect().top - anchorTop);
    } finally {
      layoutBatch = false;
      updateAnchoring();
    }
  };
  states.forEach((state) => {
    state.button.addEventListener('click', () => setSelection(state, !state.open));
    state.panel.querySelectorAll('[data-sb-close]').forEach((button) => {
      button.addEventListener('click', () => {
        state.button.focus({ preventScroll: true });
        setSelection(state, false);
      });
    });
  });
  const dialog = section.querySelector('[data-sb-lightbox]');
  section.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || (dialog && dialog.open)) return;
    const current = states.find((state) => state.open);
    if (!current) return;
    event.preventDefault();
    current.button.focus({ preventScroll: true });
    setSelection(current, false);
  });

  // The height is returned to 'auto' after every transition. Font loads,
  // different translations and viewport changes therefore cannot clip content.
  let previousWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (previousWidth === window.innerWidth) return;
    previousWidth = window.innerWidth;
    states.forEach((state) => {
      if (state.animation) state.animation.cancel();
      settle(state);
    });
  }, { passive: true });
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    states.forEach((state) => {
      if (state.animation) state.animation.cancel();
      settle(state);
    });
  });

  const reveal = [...section.querySelectorAll('[data-sb-reveal]')];
  if (motion.matches || !('IntersectionObserver' in window)) {
    reveal.forEach((element) => element.classList.add('sb-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('sb-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -3% 0px' });
    reveal.forEach((element) => observer.observe(element));
  }

  // Without native <dialog>, the seating plan's normal image link still works.
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const viewer = dialog.querySelector('[data-sb-viewer]');
  const image = dialog.querySelector('[data-sb-plan-image]');
  const zoomButton = dialog.querySelector('[data-sb-zoom]');
  const zoomLabel = zoomButton && zoomButton.querySelector('span');
  if (!viewer || !image || !zoomButton || !zoomLabel) return;
  let opener = null;
  let closing = false;
  let closeTimer = 0;
  let savedStyle = null;
  const zoom = (expanded, point = { x: .5, y: .5 }) => {
    dialog.classList.toggle('is-zoomed', expanded);
    zoomButton.setAttribute('aria-pressed', String(expanded));
    zoomLabel.textContent = expanded ? zoomButton.dataset.fitLabel : zoomButton.dataset.zoomLabel;
    requestAnimationFrame(() => {
      viewer.scrollLeft = expanded ? image.clientWidth * point.x - viewer.clientWidth / 2 : 0;
      viewer.scrollTop = expanded ? image.clientHeight * point.y - viewer.clientHeight / 2 : 0;
    });
  };
  section.querySelectorAll('[data-sb-open-plan]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (dialog.open) return;
      opener = link;
      closing = false;
      clearTimeout(closeTimer);
      const gutter = window.innerWidth - root.clientWidth;
      savedStyle = { overflow: root.style.overflow, padding: root.style.paddingRight };
      root.style.paddingRight = `${parseFloat(getComputedStyle(root).paddingRight) + gutter}px`;
      root.style.overflow = 'hidden';
      dialog.showModal();
      zoom(false);
      void dialog.offsetHeight;
      dialog.classList.add('is-visible');
    });
  });
  const closeDialog = () => {
    if (!dialog.open || closing) return;
    closing = true;
    dialog.classList.remove('is-visible');
    if (motion.matches) dialog.close();
    else closeTimer = window.setTimeout(() => dialog.close(), 350);
  };
  dialog.querySelector('[data-sb-dismiss]').addEventListener('click', closeDialog);
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')]
      .filter((element) => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });
  let pointerBeganOutside = false;
  const outside = (event) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', (event) => { pointerBeganOutside = outside(event); });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && pointerBeganOutside && outside(event)) closeDialog();
  });
  dialog.addEventListener('close', () => {
    clearTimeout(closeTimer);
    dialog.classList.remove('is-visible', 'is-zoomed');
    if (savedStyle) {
      root.style.overflow = savedStyle.overflow;
      root.style.paddingRight = savedStyle.padding;
      savedStyle = null;
    }
    closing = false;
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  });
  zoomButton.addEventListener('click', () => zoom(!dialog.classList.contains('is-zoomed')));
  image.addEventListener('click', (event) => {
    const rect = image.getBoundingClientRect();
    zoom(!dialog.classList.contains('is-zoomed'), {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
    });
  });
})();
