(() => {
  const adIdPattern = /^google_ads_/i;
  const adScriptPattern = /(google|doubleclick|googlesyndication|advertisement|advertising|ads)/i;

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
    console.log('🚫 Removing ad scripts');
    document.querySelectorAll('script').forEach(script => {
      if (isAdScript(script)) {
        script.remove();
        console.log('🚫 Removed ad script:', script.src || 'inline script');
      }
    });
  }

  function removeAds() {
    console.log('🚫 Removing ads');
    document.querySelectorAll('[id]').forEach(el => {
      if (adIdPattern.test(el.id)) {
        el.remove();
        console.log('🧹 Removed:', el.id);
      }
    });

    document.querySelectorAll('[class]').forEach(el => {
      if (/GoogleActiveViewInnerContainer/i.test(el.className)) {
        el.remove();
        console.log('🧹 Removed:', el.className);
      }
    });

    document.querySelectorAll('[class]').forEach(el => {
      if (/ads/i.test(el.className)) {
        el.remove();
        console.log('🧹 Removed:', el.className);
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
            console.log('🚫 Removed dynamic ad script:', node.src || 'inline script');
            continue;
          }
          
          // Check for ad elements
          if (node.id && adIdPattern.test(node.id)) {
            node.remove();
            console.log('🧹 Removed dynamic ad:', node.id);
          } else {
            // Check nested scripts
            node.querySelectorAll?.('script').forEach(script => {
              if (isAdScript(script)) {
                script.remove();
                console.log('🚫 Removed nested ad script:', script.src || 'inline script');
              }
            });
            
            // Check nested ad elements
            node.querySelectorAll?.('[id]').forEach(el => {
              if (adIdPattern.test(el.id)) {
                el.remove();
                console.log('🧹 Removed nested ad:', el.id);
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
  
  console.log('🚫 Google Ads auto-removal active');
})();
