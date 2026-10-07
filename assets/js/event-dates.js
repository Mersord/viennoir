/* Progressive enhancement only. All event content and links are in static HTML. */
(() => {
  'use strict';
  const english = document.documentElement.lang.toLowerCase().startsWith('en');
  const label = english ? 'Past event' : 'Vergangen';
  function refresh() {
    const now = Date.now();
    document.querySelectorAll('[data-event-start-at]').forEach((section) => {
      const start = Date.parse(section.dataset.eventStartAt);
      if (!Number.isFinite(start) || now < start) return;
      section.querySelectorAll('a[data-event-ticket]').forEach((link) => {
        const text = document.createElement('span');
        text.className = 'button event-past';
        text.textContent = label;
        link.replaceWith(text);
      });
      section.querySelectorAll('[data-event-archive-note]').forEach((note) => { note.hidden = false; });
    });
  }
  refresh();
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.setInterval(() => { if (!document.hidden) refresh(); }, 60000);
})();
