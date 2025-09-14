# Codespace Viewer - Extensão Chrome

Esta extensão permite visualizar a tela (interface VS Code) de um GitHub Codespace diretamente no popup da extensão, com suporte a zoom para melhor usabilidade no tamanho limitado. Os Codespaces continuam rodando em background no GitHub mesmo ao fechar a extensão.

## Estrutura de Arquivos
- `manifest.json`: Configuração da extensão (MV3)
- `popup.html`: Interface do popup
- `popup.js`: Lógica principal (autenticação, lista, embed, zoom)
- `popup.css`: Estilos responsivos
- `background.js`: Service worker para persistência de tokens
- `icons/`: Pasta para ícones (adicione PNGs de 16x16, 48x48, 128x128)

## Instalação e Teste

### 1. Carregar como Extensão Unpacked no Chrome
1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative "Modo de desenvolvedor" no canto superior direito
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `codespace-viewer-extension/`
5. A extensão aparecerá na barra de ferramentas (ícone padrão se sem icons/)

### 2. Configurar Autenticação GitHub
- A extensão usa OAuth 2.0 via `chrome.identity` (scopes: `codespace:read user:email`)
- Clique no ícone da extensão → "Login com GitHub"
- Autorize no GitHub (será redirecionado para autenticação)
- Token é armazenado localmente e renovado automaticamente

### 3. Testar Funcionalidades

#### Teste 1: Autenticação e Lista de Codespaces
1. Após login, deve aparecer dropdown com seus Codespaces (nome + status)
2. Se vazio: Crie um Codespace no GitHub (github.com/codespaces) e teste novamente
3. Verifique console (F12 → Console no popup) para erros de API (ex: token inválido)

#### Teste 2: Embed da Tela (Iframe)
1. Selecione um Codespace ativo (status "Available" ou "Queued")
2. Clique "Carregar Tela" → Iframe deve carregar VS Code web do Codespace
3. Se erro: Verifique permissões no manifest (host_permissions para *.app.github.dev) e console para CORS
4. Confirme que o Codespace continua rodando: Feche extensão, vá ao dashboard GitHub → Deve estar "Running"

#### Teste 3: Zoom
1. Com iframe carregado, use botões + / - para zoom (50% a 300%)
2. Nível mostra % atual; deve escalar visualmente sem quebrar layout
3. Teste scroll se zoom >100% (container ajusta overflow)

#### Teste 4: Background e Persistência
1. Autentique e carregue um Codespace
2. Feche popup, reabra → Deve manter autenticação (token salvo)
3. Verifique background console (em chrome://extensions/ → Inspecionar views → background page)
4. Teste renovação: Espere 1h ou force logout/login para validar refresh

### 4. Depuração
- **Console do Popup:** Clique direito no popup → "Inspecionar" → Console
- **Console do Background:** chrome://extensions/ → Detalhes da extensão → "background page" → Inspecionar
- **Erros Comuns:**
  - "Token inválido": Reautentique ou verifique scopes no GitHub
  - "CORS no iframe": Adicione mais host_permissions se necessário
  - "Nenhum Codespace": Certifique-se de ter Codespaces ativos no GitHub
- **Logs:** Abra DevTools para ver fetchs à API e erros de chrome.identity

### 5. Limitações e Melhorias
- **Ícones:** Adicione PNGs em `icons/` e recarregue extensão
- **Popup Maior:** Edite manifest.json `action.default_popup` com CSS para width/height maiores (até 800x600px)
- **Múltiplos Codespaces:** Suporte atual é single-view; para tabs, estenda popup.js
- **Publicação:** Compacte pasta, suba zip para Chrome Web Store (requer conta dev)
- **Segurança:** Tokens são locais; para produção, considere encriptação extra

## Uso no Dia a Dia
1. Mantenha Codespace rodando no GitHub
2. Abra extensão para quick view (zoom para focar em código)
3. Feche sem parar VM - volte quando precisar

Para suporte, verifique console ou crie issue no repositório.