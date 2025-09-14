(function() {
  'use strict';

  const GITHUB_CLIENT_ID = 'YOUR_GITHUB_APP_CLIENT_ID'; // Substitua por um app OAuth real ou use GitHub implicit flow; para dev, use chrome.identity sem client_id explícito
  const SCOPES = 'codespace:read user:email';
  const API_BASE = 'https://api.github.com';

  let currentToken = null;
  let currentZoom = 1.0;

  // Elementos DOM
  const loginBtn = document.getElementById('login-btn');
  const status = document.getElementById('status');
  const codespaceSection = document.getElementById('codespace-section');
  const codespaceSelect = document.getElementById('codespace-select');
  const loadBtn = document.getElementById('load-btn');
  const viewerSection = document.getElementById('viewer-section');
  const iframe = document.getElementById('codespace-iframe');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomLevel = document.getElementById('zoom-level');

  // Função para obter token OAuth
  async function getAuthToken() {
    try {
      const token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(token);
          }
        });
      });
      currentToken = token;
      chrome.storage.local.set({ githubToken: token });
      return token;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      throw error;
    }
  }

  // Verificar token salvo
  async function checkAuth() {
    const { githubToken } = await chrome.storage.local.get('githubToken');
    if (githubToken) {
      currentToken = githubToken;
      status.textContent = 'Autenticado';
      loginBtn.style.display = 'none';
      codespaceSection.style.display = 'block';
      loadCodespaces();
    } else {
      status.textContent = 'Não autenticado. Faça login.';
      loginBtn.style.display = 'block';
    }
  }

  // Carregar lista de codespaces
  async function loadCodespaces() {
    if (!currentToken) return;

    try {
      status.textContent = 'Carregando codespaces...';
      codespaceSelect.innerHTML = '<option value="">Carregando...</option>';
      codespaceSelect.disabled = true;

      const response = await fetch(`${API_BASE}/user/codespaces`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token inválido. Faça login novamente.');
        }
        throw new Error(`Erro API: ${response.status}`);
      }

      const codespaces = await response.json();
      codespaceSelect.innerHTML = '';
      if (codespaces.length === 0) {
        codespaceSelect.innerHTML = '<option value="">Nenhum codespace encontrado</option>';
        return;
      }

      codespaces.forEach(cs => {
        const option = document.createElement('option');
        option.value = cs.name;
        option.textContent = `${cs.display_name || cs.name} (${cs.state})`;
        option.dataset.webUrl = cs.web_url;
        codespaceSelect.appendChild(option);
      });

      codespaceSelect.disabled = false;
      status.textContent = 'Selecione um codespace.';
    } catch (error) {
      console.error('Erro ao carregar codespaces:', error);
      codespaceSelect.innerHTML = '<option value="">Erro ao carregar</option>';
      status.textContent = error.message;
      if (error.message.includes('Token inválido')) {
        currentToken = null;
        chrome.storage.local.remove('githubToken');
        checkAuth();
      }
    }
  }

  // Carregar iframe
  async function loadIframe() {
    const selectedOption = codespaceSelect.selectedOptions[0];
    if (!selectedOption || !selectedOption.dataset.webUrl) {
      status.textContent = 'Selecione um codespace válido.';
      return;
    }

    try {
      status.textContent = 'Carregando tela...';
      viewerSection.style.display = 'block';
      iframe.src = selectedOption.dataset.webUrl;
      iframe.onload = () => {
        status.textContent = 'Tela carregada. Use zoom para ajustar.';
        currentZoom = 1.0;
        updateZoom();
      };
      iframe.onerror = () => {
        status.textContent = 'Erro ao carregar iframe. Verifique permissões.';
      };
    } catch (error) {
      console.error('Erro ao carregar iframe:', error);
      status.textContent = 'Erro ao carregar.';
    }
  }

  // Atualizar zoom
  function updateZoom() {
    iframe.style.transform = `scale(${currentZoom})`;
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
    // Ajustar container se necessário para scroll
    viewerSection.style.overflow = currentZoom > 1 ? 'auto' : 'hidden';
  }

  // Event listeners
  loginBtn.addEventListener('click', async () => {
    try {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Autenticando...';
      await getAuthToken();
      await checkAuth();
    } catch (error) {
      status.textContent = `Erro de autenticação: ${error.message}`;
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login com GitHub';
    }
  });

  loadBtn.addEventListener('click', loadIframe);

  codespaceSelect.addEventListener('change', (e) => {
    loadBtn.disabled = !e.target.value;
  });

  zoomInBtn.addEventListener('click', () => {
    if (currentZoom < 3.0) {
      currentZoom += 0.25;
      updateZoom();
    }
  });

  zoomOutBtn.addEventListener('click', () => {
    if (currentZoom > 0.25) {
      currentZoom -= 0.25;
      updateZoom();
    }
  });

  // Inicializar
  document.addEventListener('DOMContentLoaded', checkAuth);

})();