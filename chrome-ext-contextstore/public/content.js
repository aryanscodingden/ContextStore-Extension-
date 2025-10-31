(function () {
    'use strict';

    const pageErrors = [];
    const MAX_ERRORS = 10;

    const originalError = console.error;
    console.error = function(...args) {
        pageErrors.push({
            type: 'Console Error',
            message: args.map(arg => String(arg)).join(' '),
            timestamp: new Date().toISOString(),
            url: window.location.href
        });

        if (pageErrors.length > MAX_ERRORS) {
            pageErrors.shift();
        }

        originalError.apply(console, args);
    };

    window.addEventListener('unhandledrejection', (event) => {
        pageErrors.push({
            type: 'Unhandled Promise',
            message: event?.reason?.toString() || 'Unknown Rejection',
            timestamp: new Date().toISOString(),
            url: window.location.href
        });

        if (pageErrors.length > MAX_ERRORS) {
            pageErrors.shift();
        }
    });
})();
if (window.chrome && window.chrome.runtime) {
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_PAGE_ERRORS') {
      console.log('[ContextStore] Sending page errors:', pageErrors.length);
      sendResponse({ 
        errors: pageErrors.slice(-5),
        url: window.location.href,
        title: document.title
       });
      }
    });
  }

  console.log('[ContextStore] Content script loaded on:', window.loacation.href);