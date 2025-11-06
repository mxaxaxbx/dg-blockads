(() => {
  // Deactivate on Google services to avoid breaking functionality
  if (window.location.hostname.endsWith('.google.com') || window.location.hostname === 'google.com') {
    return;
  }

  const adIdPattern = /^(google_ads_|trc_wrapper|utif_|adnxs-)/i;
  const adScriptPattern = /(doubleclick|googlesyndication|advertisement|advertising|tl-iframe)/i;

  function isAdScript(script) {
    // Check script src
    if (script.src && adScriptPattern.test(script.src)) {
      return true;
    }
    // Check inline script content
    if (script.textContent && adScriptPattern.test(script.textContent)) {
      return true;
    }
    // Check for common ad initialization patterns
    if (script.textContent && /(googletag|adsbygoogle|__ga|gtag|dataLayer)/i.test(script.textContent)) {
      return true;
    }
    return false;
  }

  function removeAdScripts() {
    document.querySelectorAll('script').forEach(script => {
      if (isAdScript(script)) {
        script.remove();
      }
    });
  }

  function removeAds() {
    document.querySelectorAll('[id]').forEach(el => {
      if (adIdPattern.test(el.id)) {
        el.remove();
      }
    });

    // More specific pattern to avoid removing legitimate popups and UI elements
    document.querySelectorAll('[class]').forEach(el => {
      const className = el.className;
      // Only remove if it's clearly an ad container, not just any element with "ads" in class
      if (/(^|\s)(ads|advertisement|advertising|ad-container|ad-wrapper|ad-banner|google-ads)(\s|$)/i.test(className) ||
          /GoogleActiveViewInnerContainer/i.test(className)) {
        // Additional check: don't remove if it looks like a popup/modal (common popup indicators)
        const isPopup = /(popup|modal|dialog|overlay|lightbox)/i.test(className) && 
                       !/(ad|ads)/i.test(className);
        if (!isPopup) {
          el.remove();
        }
      }
    });
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          // Check if it's a script tag
          if (node.tagName === 'SCRIPT' && isAdScript(node)) {
            node.remove();
            continue;
          }
          
          // Check for ad elements
          if (node.id && adIdPattern.test(node.id)) {
            node.remove();
          } else {
            // Check nested scripts
            node.querySelectorAll?.('script').forEach(script => {
              if (isAdScript(script)) {
                script.remove();
              }
            });
            
            // Check nested ad elements by ID
            node.querySelectorAll?.('[id]').forEach(el => {
              if (adIdPattern.test(el.id)) {
                el.remove();
              }
            });
            
            // Check nested ad elements by class (with popup protection)
            node.querySelectorAll?.('[class]').forEach(el => {
              const className = el.className;
              if (/(^|\s)(ads|advertisement|advertising|ad-container|ad-wrapper|ad-banner|google-ads)(\s|$)/i.test(className) ||
                  /GoogleActiveViewInnerContainer/i.test(className)) {
                const isPopup = /(popup|modal|dialog|overlay|lightbox)/i.test(className) && 
                               !/(ad|ads)/i.test(className);
                if (!isPopup) {
                  el.remove();
                }
              }
            });
          }
        }
      }
    }
  });

  // Initialize ad blocking
  removeAdScripts();
  
  // Setup observers
  if (document.head) {
    observer.observe(document.head, { childList: true, subtree: true });
  }
  
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    removeAds();
  }
})();
