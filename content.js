(() => {
  if (window.__dgBlockadsInitialized) return;
  window.__dgBlockadsInitialized = true;

  const hostname = window.location.hostname.toLowerCase();
  const isGoogleProperty = hostname.endsWith('.google.com') || hostname === 'google.com';
  const isYouTubeProperty = hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be';

  if (isGoogleProperty) {
    return;
  }

  const adIdPattern = /^(google_ads_|trc_wrapper|utif_|adnxs-1|ad_)/i;
  const adScriptPattern = /(doubleclick|googlesyndication|advertisement|advertising|tl-iframe)/i;
  const blockedNetworkHosts = [
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'googletagmanager.com',
    'google-analytics.com',
    'analytics.google.com',
    'adservice.google.com',
    'adnxs.com',
    'criteo.com',
    'pubmatic.com',
    'rubiconproject.com',
    'taboola.com',
    'outbrain.com',
    'scorecardresearch.com',
    'quantserve.com',
    'fullstory.com',
    'hotjar.com',
    'mixpanel.com',
    'segment.io',
    'connect.facebook.net',
    'analytics.tiktok.com'
  ];
  const blockedResourceTags = new Set([
    'SCRIPT',
    'IFRAME',
    'IMG',
    'LINK',
    'SOURCE',
    'AUDIO',
    'VIDEO',
    'TRACK',
    'EMBED',
    'OBJECT',
    'FORM'
  ]);
  const blockedResourceAttributes = ['src', 'href', 'data', 'action', 'poster', 'srcset'];
  const youtubeAdSelectors = [
    'ytd-ad-slot-renderer',
    'ytd-display-ad-renderer',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-video-renderer',
    'ytd-promoted-sparkles-text-search-renderer',
    'ytd-in-feed-ad-layout-renderer',
    'ytd-action-companion-ad-renderer',
    'ytd-companion-slot-renderer',
    'ytd-video-masthead-ad-v3-renderer',
    'ytd-player-legacy-desktop-watch-ads-renderer',
    'yt-mealbar-promo-renderer',
    'tp-yt-paper-dialog yt-mealbar-promo-renderer',
    '#player-ads',
    '#masthead-ad',
    '.ytp-ad-module',
    '.ytp-ad-image-overlay',
    '.ytp-ad-overlay-container',
    '.ytp-ad-player-overlay',
    '.ytp-ad-text-overlay',
    '.ytp-ad-skip-button-container',
    '.ytp-ad-preview-container',
    '.ytp-ad-progress-list',
    '.ytp-ad-survey',
    '.ytp-ad-overlay-close-button'
  ];

  function isBlockedNetworkUrl(value) {
    if (!value || typeof value !== 'string') return false;
    try {
      const url = new URL(value, document.baseURI);
      const hostname = url.hostname.toLowerCase();
      return blockedNetworkHosts.some(host => hostname === host || hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }

  function isBlockedSrcset(value) {
    if (!value || typeof value !== 'string') return false;
    return value.split(',').some(part => {
      const candidate = part.trim().split(/\s+/)[0];
      return isBlockedNetworkUrl(candidate);
    });
  }

  function isBlockedResourceElement(el) {
    if (!el || el.nodeType !== 1 || !blockedResourceTags.has(el.tagName)) return false;
    return blockedResourceAttributes.some(attr => {
      if (attr === 'srcset') return isBlockedSrcset(el.getAttribute(attr));
      return isBlockedNetworkUrl(el.getAttribute(attr) || el[attr]);
    });
  }

  function injectAdStyles() {
    if (document.getElementById('dg-blockads-style')) return;
    const style = document.createElement('style');
    style.id = 'dg-blockads-style';
    style.textContent = `
      [id^="google_ads_"],
      [id*="google_ads_iframe_"],
      [id*="__container__"],
      [id^="trc_wrapper"],
      [id^="utif_"],
      [id^="adnxs-1"],
      [id^="ad_"],
      iframe[id*="google_ads_iframe_"],
      [class~="adsbygoogle"],
      [class~="ad-content"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        z-index: -9999 !important;
      }

      ${isYouTubeProperty ? `
      ytd-ad-slot-renderer,
      ytd-display-ad-renderer,
      ytd-promoted-sparkles-web-renderer,
      ytd-promoted-video-renderer,
      ytd-promoted-sparkles-text-search-renderer,
      ytd-in-feed-ad-layout-renderer,
      ytd-action-companion-ad-renderer,
      ytd-companion-slot-renderer,
      ytd-video-masthead-ad-v3-renderer,
      ytd-player-legacy-desktop-watch-ads-renderer,
      yt-mealbar-promo-renderer,
      tp-yt-paper-dialog yt-mealbar-promo-renderer,
      #player-ads,
      #masthead-ad,
      .ytp-ad-module,
      .ytp-ad-image-overlay,
      .ytp-ad-overlay-container,
      .ytp-ad-player-overlay,
      .ytp-ad-text-overlay,
      .ytp-ad-skip-button-container,
      .ytp-ad-preview-container,
      .ytp-ad-progress-list,
      .ytp-ad-survey,
      .ytp-ad-overlay-close-button {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      ` : ''}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function isYouTubeAdElement(el) {
    if (!isYouTubeProperty || !el || el.nodeType !== 1) return false;
    if (el.id === 'player-ads' || el.id === 'masthead-ad') return true;
    if (youtubeAdSelectors.includes(el.tagName.toLowerCase())) return true;
    const className = typeof el.className === 'string' ? el.className : '';
    return /(^|\s)(ytp-ad-|ytp-paid-content|ytd-display-ad-renderer|ytd-promoted-|ytd-ad-slot-renderer|yt-mealbar-promo-renderer)(\s|$)/i.test(className);
  }

  function removeYouTubeAds(root = document) {
    if (!isYouTubeProperty) return;

    root.querySelectorAll?.(youtubeAdSelectors.join(',')).forEach(el => el.remove());

    root.querySelectorAll?.('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer').forEach(el => {
      if (el.querySelector?.('ytd-ad-slot-renderer, ytd-display-ad-renderer, ytd-promoted-sparkles-web-renderer, ytd-in-feed-ad-layout-renderer, ytd-promoted-video-renderer, ytd-video-masthead-ad-v3-renderer, ytd-player-legacy-desktop-watch-ads-renderer, yt-mealbar-promo-renderer')) {
        el.remove();
      }
    });

    root.querySelectorAll?.('[aria-label*="Sponsored" i], [title*="Sponsored" i]').forEach(el => {
      const card = el.closest?.('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer');
      (card || el).remove();
    });
  }

  function clickYouTubeSkipButtons(root = document) {
    if (!isYouTubeProperty) return;
    root.querySelectorAll?.('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-container button, button[aria-label*="Skip" i], button[title*="Skip" i]').forEach(button => {
      if (typeof button.click === 'function') button.click();
    });
  }

  function isYouTubeAdPlayback() {
    if (!isYouTubeProperty) return false;

    const player = document.querySelector('#movie_player, .html5-video-player');
    if (player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'))) {
      return true;
    }

    return Boolean(
      document.querySelector('ytd-watch-flexy.ad-showing') ||
      document.querySelector('#movie_player .ytp-ad-player-overlay') ||
      document.querySelector('#movie_player .ytp-ad-module') ||
      document.querySelector('#movie_player .ytp-ad-text-overlay')
    );
  }

  function bypassYouTubeVideoAds() {
    if (!isYouTubeProperty || !isYouTubeAdPlayback()) return;

    const video = document.querySelector('video');
    if (video) {
      try {
        video.muted = true;
      } catch {}

      const duration = Number(video.duration);
      const currentTime = Number(video.currentTime);
      if (Number.isFinite(duration) && duration > 0 && Number.isFinite(currentTime)) {
        const targetTime = Math.max(0, duration - 0.1);
        if (targetTime > currentTime + 0.25) {
          try {
            video.currentTime = targetTime;
          } catch {}
        }
      }
    }

    clickYouTubeSkipButtons();
  }

  function startYouTubeAdBypassLoop() {
    if (!isYouTubeProperty) return;

    const run = () => {
      clickYouTubeSkipButtons();
      bypassYouTubeVideoAds();
    };

    run();
    window.addEventListener('yt-navigate-finish', run, true);
    window.addEventListener('yt-page-data-updated', run, true);
    document.addEventListener('play', run, true);
    document.addEventListener('timeupdate', run, true);
    document.addEventListener('visibilitychange', run, true);
    setInterval(run, 500);
  }

  function isAdScript(script) {
    const srcMatch =
      script.src && adScriptPattern.test(script.src);

    const contentMatch =
      script.textContent &&
      adScriptPattern.test(script.textContent);

    return srcMatch || contentMatch;
  }

  function removeAdScripts() {
    document.querySelectorAll('script').forEach(script => {
      if (isAdScript(script)) script.remove();
    });
  }

  function removeBlockedNetworkResources(root = document) {
    const selector = Array.from(blockedResourceTags).map(tag => tag.toLowerCase()).join(',');
    root.querySelectorAll?.(selector).forEach(el => {
      if (isBlockedResourceElement(el)) el.remove();
    });
  }

  function isAdElement(el) {
    if (el.id && adIdPattern.test(el.id)) return true;
    if (el.id && /google_ads_iframe_/i.test(el.id)) return true;
    if (el.id && /__container__$/i.test(el.id) && /google_ads_iframe_/i.test(el.id)) return true;
    const className = typeof el.className === 'string' ? el.className : '';
    if (/(^|\s)(adsbygoogle|ads|advertisement|advertising|ad-container|ad-wrapper|ad-banner|ad-content|google-ads)(\s|$)/i.test(className) ||
        /GoogleActiveViewInnerContainer/i.test(className)) {
      const isPopup = /(popup|modal|dialog|overlay|lightbox)/i.test(className) && !/(ad|ads)/i.test(className);
      return !isPopup;
    }
    return false;
  }

  function removeAds() {
    document.querySelectorAll('[id]').forEach(el => {
      if (adIdPattern.test(el.id)) el.remove();
    });
    document.querySelectorAll('[class]').forEach(el => {
      if (isAdElement(el)) el.remove();
    });

    removeYouTubeAds();
    clickYouTubeSkipButtons();
  }

  function processNode(node) {
    if (node.nodeType !== 1) return;
    if (node.tagName === 'SCRIPT' && isAdScript(node)) {
      node.remove();
      return;
    }
    if (isBlockedResourceElement(node)) {
      node.remove();
      return;
    }
    if (isYouTubeAdElement(node)) {
      node.remove();
      return;
    }
    if (isAdElement(node)) {
      node.remove();
      return;
    }
    node.querySelectorAll?.('script').forEach(s => { if (isAdScript(s)) s.remove(); });
    removeBlockedNetworkResources(node);
    node.querySelectorAll?.('[id]').forEach(el => { if (adIdPattern.test(el.id)) el.remove(); });
    node.querySelectorAll?.('[class]').forEach(el => { if (isAdElement(el)) el.remove(); });
    removeYouTubeAds(node);
    clickYouTubeSkipButtons(node);
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) processNode(node);
      } else if (mutation.type === 'attributes') {
        const node = mutation.target;
        if (node.nodeType !== 1) continue;
        if (mutation.attributeName === 'id' && isAdElement(node)) node.remove();
        else if (mutation.attributeName === 'class' && isAdElement(node)) node.remove();
        else if ((mutation.attributeName === 'id' || mutation.attributeName === 'class') && isYouTubeAdElement(node)) node.remove();
        else if (mutation.attributeName === 'src' && node.tagName === 'SCRIPT' && isAdScript(node)) node.remove();
        else if (blockedResourceAttributes.includes(mutation.attributeName) && isBlockedResourceElement(node)) node.remove();
      }
    }
  });

  // Start observing immediately on documentElement so nothing slips through before body/head exist
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['id', 'class', 'src', 'href', 'data', 'action', 'poster', 'srcset']
  });

  injectAdStyles();
  removeBlockedNetworkResources();
  removeYouTubeAds();
  clickYouTubeSkipButtons();
  startYouTubeAdBypassLoop();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      removeAdScripts();
      removeAds();
      removeBlockedNetworkResources();
      removeYouTubeAds();
      clickYouTubeSkipButtons();
      bypassYouTubeVideoAds();
    });
  } else {
    removeAdScripts();
    removeAds();
    removeBlockedNetworkResources();
    removeYouTubeAds();
    clickYouTubeSkipButtons();
    bypassYouTubeVideoAds();
  }
})();
