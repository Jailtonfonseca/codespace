// Service worker para gerenciar persistência de token e renovação
chrome.runtime.onInstalled.addListener(() => {
  console.log('Codespace Viewer Extension instalada.');
});

// Escutar mensagens do popup para refresh token se necessário
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshToken') {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError) {
        // Token expirado, forçar interactive no popup
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        chrome.storage.local.set({ githubToken: token });
        sendResponse({ token: token });
      }
    });
    return true; // Async response
  }
});

// Opcional: renovação automática de token a cada hora se armazenado
setInterval(() => {
  chrome.storage.local.get('githubToken', (result) => {
    if (result.githubToken) {
      // Simples check; em produção, usar jwt decode para expiry
      chrome.identity.getAuthToken({ interactive: false }, (newToken) => {
        if (!chrome.runtime.lastError && newToken) {
          chrome.storage.local.set({ githubToken: newToken });
        }
      });
    }
  });
}, 3600000); // 1 hora