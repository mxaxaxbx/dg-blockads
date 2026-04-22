(() => {
  if (window.location.hostname.endsWith('.google.com') || window.location.hostname === 'google.com') {
    return;
  }

  const adIdPattern = /^(google_ads_|trc_wrapper|utif_|adnxs-1|ad_)/i;
  const adScriptPattern = /(doubleclick|googlesyndication|advertisement|advertising|tl-iframe)/i;

  function injectAdStyles() {
    if (document.getElementById('dg-blockads-style')) return;
    const style = document.createElement('style');
    style.id = 'dg-blockads-style';
    style.textContent = `
      [id^="google_ads_"],
      [id^="trc_wrapper"],
      [id^="utif_"],
      [id^="adnxs-1"],
      [id^="ad_"],
      [class~="adsbygoogle"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        z-index: -9999 !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function isAdScript(script) {
    if (script.src && adScriptPattern.test(script.src)) return true;
    if (script.textContent && adScriptPattern.test(script.textContent)) return true;
    if (script.textContent && /(googletag|adsbygoogle|__ga|gtag|dataLayer)/i.test(script.textContent)) return true;
    return false;
  }

  function removeAdScripts() {
    document.querySelectorAll('script').forEach(script => {
      if (isAdScript(script)) script.remove();
    });
  }

  function isAdElement(el) {
    if (el.id && adIdPattern.test(el.id)) return true;
    const className = typeof el.className === 'string' ? el.className : '';
    if (/(^|\s)(adsbygoogle|ads|advertisement|advertising|ad-container|ad-wrapper|ad-banner|google-ads)(\s|$)/i.test(className) ||
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
  }

  function processNode(node) {
    if (node.nodeType !== 1) return;
    if (node.tagName === 'SCRIPT' && isAdScript(node)) {
      node.remove();
      return;
    }
    if (isAdElement(node)) {
      node.remove();
      return;
    }
    node.querySelectorAll?.('script').forEach(s => { if (isAdScript(s)) s.remove(); });
    node.querySelectorAll?.('[id]').forEach(el => { if (adIdPattern.test(el.id)) el.remove(); });
    node.querySelectorAll?.('[class]').forEach(el => { if (isAdElement(el)) el.remove(); });
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
        else if (mutation.attributeName === 'src' && node.tagName === 'SCRIPT' && isAdScript(node)) node.remove();
      }
    }
  });

  // Start observing immediately on documentElement so nothing slips through before body/head exist
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['id', 'class', 'src']
  });

  injectAdStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      removeAdScripts();
      removeAds();
    });
  } else {
    removeAdScripts();
    removeAds();
  }
})();
