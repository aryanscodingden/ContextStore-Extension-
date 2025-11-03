console.log('ContextStore background loaded');

// Listen for auth tokens from Vercel callback page
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('Message from external:', request);
  
  if (request.type === 'SUPABASE_AUTH') {
    chrome.storage.local.set({
      supabase_access_token: request.accessToken,
      supabase_refresh_token: request.refreshToken,
      auth_completed: true
    }, () => {
      console.log('Tokens stored');
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveToContext',
    title: 'Save to ContextStore',
    contexts: ['selection']
  });
  console.log('Context menu created');
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'saveToContext' && info.selectionText) {
    console.log('Context menu clicked, tab:', tab?.id);
    

    const tabId = tab?.id;
    const tabUrl = tab?.url || 'Unknown URL';
    const tabTitle = tab?.title || 'Untitled Page';
    
    if (!tabId) {
      console.error('No tab ID available');
      return;
    }
    

    chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_ERRORS' }, (response) => {
      let pageErrors = [];
      

      if (chrome.runtime.lastError) {
        console.log('Content script not available:', chrome.runtime.lastError.message);

      } else if (response && response.errors) {
        pageErrors = response.errors;
        console.log('Got page errors:', pageErrors.length);
      }
      
      const highlightData = {
        text: info.selectionText,
        url: tabUrl,
        title: tabTitle,
        timestamp: new Date().toISOString(),
        pageErrors: pageErrors
      };

      console.log('Saving highlight:', highlightData);

      // Store selected text temporarily
      chrome.storage.local.set({
        pending_highlight: highlightData.text,
        pending_url: highlightData.url,
        pending_title: highlightData.title,
        pending_timestamp: highlightData.timestamp,
        pending_errors: highlightData.pageErrors
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
        } else {
          console.log('Highlight stored, opening popup');
          // Open popup to let user choose folder
          chrome.action.openPopup();
        }
      });
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request.type);
  
  try {
    if (request.type === 'GET_PENDING_HIGHLIGHT') {
      chrome.storage.local.get([
        'pending_highlight',
        'pending_url',
        'pending_title',
        'pending_timestamp',
        'pending_errors'
      ], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Get error:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          console.log('Retrieved pending highlight:', result);
          sendResponse(result);
        }
      });
      return true; // Keep channel open for async response
    }
    
    if (request.type === 'CLEAR_PENDING_HIGHLIGHT') {
      chrome.storage.local.remove([
        'pending_highlight',
        'pending_url',
        'pending_title',
        'pending_timestamp',
        'pending_errors'
      ], () => {
        if (chrome.runtime.lastError) {
          console.error('Clear error:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          console.log('Pending highlight cleared');
          sendResponse({ success: true });
        }
      });
      return true; 
    }
  } catch (error) {
    console.error('Error in message handler:', error);
    sendResponse({ error: error.toString() });
  }
  
  return true; 
});

// Log startup
console.log('ContextStore background script initialized');
