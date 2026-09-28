/*
 * Vien Noir - next-event programme hero, 2026-09-28.
 * Dates and start times are read from the visible programme's <time> elements.
 * Comparisons always use Europe/Vienna, independently of the viewer's timezone.
 *
 * The inline #programme-event-images snapshot provides an immediate, local
 * image for each existing production. On HTTP(S), the linked show page is also
 * checked for its current hero. Failed/blocked page requests no longer prevent
 * choosing the correct production. No fetch is attempted for file:// previews.
 */
(() => {
  'use strict';

  const hero = document.querySelector('[data-next-event-hero]');
  const list = document.querySelector('.program-list');
  if (!hero || !list || !window.Intl) return;

  let clock;
  try {
    clock = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Vienna', calendar: 'gregory', numberingSystem: 'latn',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
  } catch (_) {
    // Keep the image already provided by the HTML in unsupported browsers.
    return;
  }

  const pageBase = new URL(document.baseURI);
  const canFetch = /^https?:$/.test(pageBase.protocol) && typeof window.fetch === 'function';
  const remoteImages = new Map();
  const loadedImages = new Set();
  const snapshots = new Map();
  let selectedKey = null;
  let revision = 0;
  let warnedAboutDates = false;

  function imageURL(value, base = pageBase) {
    if (!value) throw new Error('Missing image URL.');
    const url = new URL(value, base);
    if (!/^(https?:|file:)$/.test(url.protocol)) throw new Error('Unsupported image URL.');
    return url.href;
  }

  function pageKey(value) {
    const url = new URL(value, pageBase);
    url.hash = '';
    url.search = '';
    // Match the old .html links, explicit index.html files and clean routes.
    url.pathname = url.pathname.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '/');
    return url.href;
  }

  const fallback = {
    src: imageURL(hero.dataset.defaultSrc || hero.getAttribute('src')),
    alt: hero.dataset.defaultAlt || hero.getAttribute('alt') || ''
  };

  const snapshot = document.getElementById('programme-event-images');
  if (snapshot) {
    try {
      const entries = JSON.parse(snapshot.textContent);
      Object.entries(entries).forEach(([page, image]) => {
        if (image && typeof image.src === 'string') {
          snapshots.set(pageKey(page), {
            src: imageURL(image.src), alt: typeof image.alt === 'string' ? image.alt : ''
          });
        }
      });
    } catch (error) {
      console.warn('[Vien Noir] Programme image snapshot:', error.message);
    }
  }

  function viennaNow() {
    const parts = {};
    clock.formatToParts(new Date()).forEach(({ type, value }) => { parts[type] = value; });
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  function nextEvent() {
    const now = viennaNow();
    const events = [];
    let validCount = 0;
    list.querySelectorAll('.program-row').forEach((row) => {
      const date = row.querySelector('.program-row__date time[datetime]');
      const time = row.querySelector('.program-row__time time[data-event-start][datetime]');
      const link = row.querySelector('.program-row__show a[href]');
      if (!date || !time || !link) return;
      const day = date.getAttribute('datetime');
      const start = time.getAttribute('datetime');
      if (!validDate(day) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start)) return;
      try {
        const url = new URL(link.getAttribute('href'), pageBase);
        // Local files are valid too; never confuse a blocked fetch with no dates.
        if (!/^(https?:|file:)$/.test(url.protocol) || url.origin !== pageBase.origin) return;
        url.hash = '';
        validCount += 1;
        const when = `${day}T${start}:00`;
        if (when > now) events.push({ when, page: url.href, title: link.textContent.trim() });
      } catch (_) {
        // One invalid row must not suppress the remaining valid dates.
      }
    });
    events.sort((a, b) => a.when.localeCompare(b.when));
    return { event: events[0] || null, validCount };
  }

  async function eventImage(event) {
    const key = pageKey(event.page);
    if (remoteImages.has(key)) return remoteImages.get(key);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    let response;
    let html;
    try {
      response = await fetch(event.page, {
        method: 'GET', mode: 'same-origin', credentials: 'omit',
        cache: 'no-cache', signal: controller.signal
      });
      if (!response.ok) throw new Error(`Event page: HTTP ${response.status}`);
      html = await response.text();
    } finally {
      window.clearTimeout(timeout);
    }
    const base = new URL(response.url || event.page);
    if (base.origin !== pageBase.origin) throw new Error('External event page ignored.');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const source = doc.querySelector('.page-hero__media img');
    if (!source || !source.getAttribute('src')) throw new Error('Event hero not found.');
    return {
      src: imageURL(source.getAttribute('src'), base),
      alt: source.getAttribute('alt') || event.title
    };
  }

  function preloadImage(src) {
    if (loadedImages.has(src) || (hero.src === src && hero.complete && hero.naturalWidth > 0)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const image = new Image();
      let finished = false;
      const timer = window.setTimeout(() => finish(new Error('Image load timed out.')), 8000);
      function finish(error) {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        image.onload = null;
        image.onerror = null;
        if (error) reject(error);
        else { loadedImages.add(src); resolve(); }
      }
      image.onload = () => finish();
      image.onerror = () => finish(new Error('Event image could not be loaded.'));
      image.decoding = 'async';
      image.src = src;
    });
  }

  async function apply(image, request) {
    if (!image || request !== revision) return false;
    await preloadImage(image.src);
    if (request !== revision) return false;
    hero.removeAttribute('srcset');
    hero.removeAttribute('sizes');
    hero.src = image.src;
    hero.alt = image.alt;
    return true;
  }

  async function refresh() {
    const { event, validCount } = nextEvent();
    if (!validCount) {
      // Invalid/missing markup is not the same as an entirely finished season.
      if (!warnedAboutDates) console.warn('[Vien Noir] No readable programme dates; keeping current image.');
      warnedAboutDates = true;
      return;
    }
    const key = event ? `${pageKey(event.page)}|${event.when}` : 'season-finished';
    if (key === selectedKey) return;
    selectedKey = key;
    const request = ++revision;
    let shown = false;
    hero.dataset.nextEvent = event ? event.title : '';
    hero.dataset.nextEventStart = event ? event.when : '';
    hero.dataset.nextEventState = 'loading';

    // Start the optional network refresh in parallel, handling rejection at once.
    const fresh = event && canFetch
      ? eventImage(event).then(image => ({ image }), error => ({ error }))
      : null;
    const stored = event ? snapshots.get(pageKey(event.page)) : fallback;
    if (stored) {
      try {
        shown = await apply(stored, request);
        if (shown) hero.dataset.nextEventState = event ? 'snapshot' : 'season-finished';
      } catch (_) { /* The fetched page can still supply a working image. */ }
    }
    if (request !== revision) return;

    if (fresh) {
      const result = await fresh;
      if (request !== revision) return;
      if (result.image) {
        try {
          if (await apply(result.image, request)) {
            shown = true;
            remoteImages.set(pageKey(event.page), result.image);
            hero.dataset.nextEventState = 'event-page';
          }
        } catch (_) { /* Keep the correctly selected snapshot or current image. */ }
      }
    }
    if (request !== revision) return;
    if (!shown) {
      hero.dataset.nextEventState = 'unavailable';
      console.warn('[Vien Noir] Next-event image unavailable; keeping current image.');
    }
    // Retry missing network images on the next tick; never cache a failed request.
    if (!shown || (event && canFetch && !remoteImages.has(pageKey(event.page)))) selectedKey = null;
  }

  refresh();
  window.addEventListener('pageshow', refresh);
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.setInterval(() => { if (!document.hidden) refresh(); }, 60000);
})();
