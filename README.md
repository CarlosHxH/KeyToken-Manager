# KeyToken Manager

Extensão para Chrome/Firefox que obtém e gerencia Access Tokens do Keycloak (OpenID Connect).

## Pré-requisitos

- Navegador baseado em Chromium (Chrome, Edge, Brave) **ou** Firefox
- Git instalado (para clonar o repositório)

## Instalação

### 1. Obtenha o código

```bash
git clone https://github.com/CarlosHxH/KeyToken-Manager.git
```

Ou faça o download manual: [GitHub → Download ZIP](https://github.com/CarlosHxH/KeyToken-Manager) e extraia o arquivo.

### 2. Carregue a extensão no navegador

#### No Chrome / Edge / Brave

1. Acesse `chrome://extensions/`
2. Ative o **Modo do desenvolvedor** no canto superior direito
3. Clique em **Carregar sem compactação** (Load unpacked)
4. Selecione a pasta raiz do projeto (`KeyToken-Manager/`)

#### No Firefox

1. Acesse `about:debugging#/runtime/this-firefox`
2. Clique em **Carregar Complemento Temporário**
3. Selecione o arquivo `manifest.json` dentro da pasta do projeto

### 3. Pronto! 🎉

A extensão estará disponível na barra de extensões do navegador. Clique no ícone 🔐 para abrir o popup e configurar suas credenciais.

## Atualização

Após alterar o código, vá em `chrome://extensions/` (ou `about:debugging`) e clique em **Recarregar** na extensão.

## Estrutura do projeto

```
KeyToken-Manager/
├── manifest.json
├── popup.html          ← entry point do popup
├── styles.css
├── decode.html         ← página de decodificação JWT
├── decode.js           ← script clássico (sem imports)
├── js/
│   ├── popup.js        ← módulo principal (ESM)
│   ├── ui.js           ← manipulação do DOM
│   ├── api.js          ← requisição HTTP ao Keycloak
│   ├── timer.js        ← contagem regressiva do token
│   └── storage.js      ← persistência local (chrome.storage)
├── icon16.png
├── icon48.png
└── icon128.png
```

## Compatibilidade

- ✅ Chrome, Edge, Brave (Manifest V3)
- ✅ Firefox (via shim `browser` / `chrome` API)

## 🧪 Troubleshooting

### Extensão não aparece

* Verifique se o `manifest.json` está correto
* Veja erros no console (`F12` → aba *Console*)

### Erro ao carregar

* Confirme se selecionou a pasta raiz correta
