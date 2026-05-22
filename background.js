const BLOCKED_NETWORK_HOSTS = [
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

const BLOCKED_URL_FILTERS = [
  '||youtube.com/pagead/',
  '||youtube.com/api/stats/ads',
  '||youtube.com/api/stats/atr'
];

const BLOCKED_RESOURCE_TYPES = [
  'main_frame',
  'sub_frame',
  'script',
  'image',
  'stylesheet',
  'font',
  'xmlhttprequest',
  'media',
  'websocket',
  'other'
];

function buildNetworkBlockRules() {
  const hostRules = BLOCKED_NETWORK_HOSTS.map((host, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: 'block' },
    condition: {
      urlFilter: `||${host}^`,
      resourceTypes: BLOCKED_RESOURCE_TYPES
    }
  }));

  const urlRules = BLOCKED_URL_FILTERS.map((urlFilter, index) => ({
    id: BLOCKED_NETWORK_HOSTS.length + index + 1,
    priority: 1,
    action: { type: 'block' },
    condition: {
      urlFilter,
      resourceTypes: BLOCKED_RESOURCE_TYPES
    }
  }));

  return [...hostRules, ...urlRules];
}

async function syncNetworkBlockRules() {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [
        ...BLOCKED_NETWORK_HOSTS.map((_, index) => index + 1),
        ...BLOCKED_URL_FILTERS.map((_, index) => BLOCKED_NETWORK_HOSTS.length + index + 1)
      ],
      addRules: buildNetworkBlockRules()
    });
  } catch (error) {
    console.warn('Failed to sync network block rules:', error);
  }
}

chrome.runtime.onInstalled.addListener(syncNetworkBlockRules);
chrome.runtime.onStartup.addListener(syncNetworkBlockRules);
syncNetworkBlockRules();

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});
