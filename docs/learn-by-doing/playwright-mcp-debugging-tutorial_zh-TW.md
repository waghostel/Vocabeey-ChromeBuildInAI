# Playwright MCP 除錯教學

使用 Playwright MCP 工具對 Language Learning Chrome Extension 進行自動化測試與除錯的完整指南。

## 目錄

- [什麼是 Playwright MCP](#什麼是-playwright-mcp)
- [環境準備](#環境準備)
- [快速開始](#快速開始)
- [核心除錯流程](#核心除錯流程)
- [常用 MCP 指令](#常用-mcp-指令)
- [實戰案例](#實戰案例)
- [疑難排解](#疑難排解)

---

## 什麼是 Playwright MCP

**Playwright MCP (Model Context Protocol)** 是一個標準化協議，讓 AI 助手能夠透過 Playwright 自動化工具與瀏覽器互動。在 Chrome Extension 除錯場景中，它提供：

- **自動化瀏覽器操作**：導航、點擊、填表、截圖
- **Console 訊息擷取**：即時捕捉錯誤與警告
- **網路請求監控**：追蹤 API 呼叫與失敗請求
- **程式碼執行**：在瀏覽器環境中執行 JavaScript
- **快照與截圖**：視覺化除錯與狀態記錄

### 為什麼需要 Playwright MCP？

Chrome Extension 的除錯挑戰：

1. **多重執行環境**：Service Worker、Content Script、Offscreen Document、UI Pages
2. **跨環境通訊**：Message Passing 機制複雜
3. **動態載入**：Content Script 注入時機不確定
4. **權限限制**：Chrome API 存取受限
5. **錯誤追蹤困難**：錯誤可能發生在任何環境

Playwright MCP 提供統一的自動化介面，讓除錯流程可重現、可追蹤。

---

## 環境準備

### 1. 前置需求

```bash
# Node.js 18+ 與 pnpm
node --version  # v18.0.0+
pnpm --version  # 8.0.0+

# Chrome/Chromium 140+
google-chrome --version
```

### 2. 建置 Extension

```bash
# 安裝相依套件
pnpm install

# 建置 Extension 到 dist/ 目錄
pnpm build

# 驗證建置結果
ls dist/
# 應該看到：manifest.json, background/, content/, offscreen/, ui/
```

### 3. 配置 MCP Server

確認 `mcp-config.json` 已配置 Playwright MCP Server：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

### 4. 手動載入 Extension

**重要**：Playwright MCP 無法自動化 `chrome://extensions` 的檔案選擇對話框，需手動載入：

1. 開啟 Chrome 瀏覽器
2. 前往 `chrome://extensions`
3. 啟用右上角「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇專案的 `dist/` 目錄
6. 複製 Extension ID（例如：`abcdefghijklmnopqrstuvwxyz123456`）

---

## 快速開始

### 執行驗證腳本

```bash
# 基本驗證（檢查建置檔案）
npx tsx debug/run-extension-validation.ts

# 完整驗證（需要 Extension ID）
EXTENSION_ID=your_extension_id npx tsx debug/run-extension-validation.ts
```

### 查看生成的報告

```bash
# 驗證報告
cat debug/playwright-reports/validation-report.md

# MCP 呼叫指南
cat debug/playwright-reports/mcp-call-guide.md

# Console 錯誤分析指南
cat debug/playwright-reports/console-analysis-guide.md
```

---

## 核心除錯流程

### 流程圖

```
1. 建置 Extension (pnpm build)
   ↓
2. 手動載入到 Chrome
   ↓
3. 執行驗證腳本
   ↓
4. 使用 MCP 指令測試
   ↓
5. 分析錯誤報告
   ↓
6. 修正問題並重新建置
   ↓
7. 重複測試直到通過
```

### 步驟詳解

#### 步驟 1：導航到測試頁面

```typescript
// MCP 呼叫
mcp_playwright_browser_navigate({
  url: 'https://example.com/article',
});
```

**目的**：載入一個測試文章頁面，驗證 Content Script 是否正確注入。

#### 步驟 2：擷取頁面快照

```typescript
// MCP 呼叫
mcp_playwright_browser_snapshot({});
```

**目的**：捕捉 Accessibility Tree，用於後續元素定位。

#### 步驟 3：檢查 Content Script 注入

```typescript
// MCP 呼叫
mcp_playwright_browser_evaluate({
  function: `() => {
    return {
      hasExtension: typeof window.__LANGUAGE_LEARNING_EXTENSION__ !== 'undefined',
      hasChromeRuntime: typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined',
      documentReady: document.readyState,
      timestamp: Date.now()
    };
  }`,
});
```

**預期結果**：

```json
{
  "hasExtension": true,
  "hasChromeRuntime": true,
  "documentReady": "complete",
  "timestamp": 1730304098810
}
```

#### 步驟 4：擷取 Console 訊息

```typescript
// 擷取所有訊息
mcp_playwright_browser_console_messages({
  onlyErrors: false,
});

// 只擷取錯誤
mcp_playwright_browser_console_messages({
  onlyErrors: true,
});
```

**目的**：識別載入過程中的錯誤與警告。

#### 步驟 5：測試 Extension 功能

```typescript
// 點擊 Extension Action 按鈕
mcp_playwright_browser_click({
  element: 'Extension action button',
  ref: '[uid from snapshot]',
});

// 等待 UI 出現
mcp_playwright_browser_wait_for({
  text: 'Learning Interface',
  time: 5,
});

// 截圖記錄
mcp_playwright_browser_take_screenshot({
  fullPage: true,
  type: 'png',
});
```

#### 步驟 6：監控網路請求

```typescript
// 擷取所有網路請求
mcp_playwright_browser_network_requests({});

// 檢查失敗的請求
const failedRequests = requests.filter(r => r.status >= 400);
```

---

## 常用 MCP 指令

### 導航與頁面操作

```typescript
// 導航到 URL
mcp_playwright_browser_navigate({ url: 'https://example.com' });

// 返回上一頁
mcp_playwright_browser_navigate_page_history({ navigate: 'back' });

// 前進下一頁
mcp_playwright_browser_navigate_page_history({ navigate: 'forward' });

// 重新載入頁面
mcp_playwright_browser_navigate({ url: window.location.href });
```

### 元素互動

```typescript
// 點擊元素
mcp_playwright_browser_click({
  element: 'button description',
  ref: "button[data-action='start']",
});

// 填寫表單
mcp_playwright_browser_fill_form({
  elements: [
    {
      name: 'search input',
      type: 'textbox',
      ref: "input[type='search']",
      value: 'test query',
    },
  ],
});

// 輸入文字
mcp_playwright_browser_type({
  element: 'text input',
  ref: "input[type='text']",
  text: 'Hello world',
  submit: true,
});

// 滑鼠懸停
mcp_playwright_browser_hover({
  element: 'vocabulary word',
  ref: '.vocabulary-word',
});
```

### 程式碼執行

```typescript
// 檢查 Extension 狀態
mcp_playwright_browser_evaluate({
  function: `() => ({
    runtime: !!chrome.runtime,
    storage: !!chrome.storage,
    tabs: !!chrome.tabs,
    extensionId: chrome.runtime?.id
  })`,
});

// 取得 Storage 資料
mcp_playwright_browser_evaluate({
  function: `() => new Promise(resolve => {
    chrome.storage.local.get(null, items => {
      resolve({
        items: items,
        size: JSON.stringify(items).length,
        keys: Object.keys(items)
      });
    });
  })`,
});

// 檢查記憶體使用
mcp_playwright_browser_evaluate({
  function: `() => ({
    memory: performance.memory,
    timing: performance.timing,
    navigation: performance.navigation
  })`,
});
```

### 資訊擷取

```typescript
// 擷取 Console 訊息
mcp_playwright_browser_console_messages({
  onlyErrors: true,
  includePreservedMessages: true,
});

// 擷取網路請求
mcp_playwright_browser_network_requests({
  resourceTypes: ['xhr', 'fetch'],
});

// 擷取頁面快照
mcp_playwright_browser_snapshot({});

// 截圖
mcp_playwright_browser_take_screenshot({
  filename: 'debug-screenshot.png',
  fullPage: true,
});
```

---

## 實戰案例

### 案例 1：Content Script 注入失敗

**問題描述**：Content Script 沒有在頁面上注入。

**除錯步驟**：

```typescript
// 1. 導航到測試頁面
mcp_playwright_browser_navigate({ url: 'https://example.com' });

// 2. 檢查注入狀態
const injectionStatus = mcp_playwright_browser_evaluate({
  function: `() => ({
    contentScript: !!window.extensionContentScript,
    readyState: document.readyState,
    scriptsLoaded: document.querySelectorAll('script[src*="extension"]').length
  })`,
});

// 3. 擷取 Console 錯誤
const errors = mcp_playwright_browser_console_messages({ onlyErrors: true });

// 4. 檢查 manifest.json 配置
// 查看 content_scripts 的 matches 是否包含測試 URL
```

**常見原因**：

- `manifest.json` 的 `matches` 模式不匹配
- Content Script 檔案路徑錯誤
- 模組載入失敗（缺少 `.js` 副檔名）

**解決方案**：

```json
// manifest.json
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"], // 或更具體的模式
      "js": ["content/content-script.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### 案例 2：模組匯入錯誤

**問題描述**：Console 顯示 `Failed to resolve module specifier`。

**錯誤訊息範例**：

```
Failed to resolve module specifier "./utils/storage-manager"
```

**除錯步驟**：

```typescript
// 1. 擷取完整錯誤訊息
const errors = mcp_playwright_browser_console_messages({ onlyErrors: true });

// 2. 分析錯誤類型
errors.forEach(error => {
  if (error.text.includes('module specifier')) {
    console.log('Import error:', error.text);
    console.log('File:', error.url);
    console.log('Line:', error.lineNumber);
  }
});
```

**常見原因**：

- 缺少 `.js` 副檔名
- 相對路徑錯誤
- TypeScript 編譯配置問題

**解決方案**：

```typescript
// ❌ 錯誤
import { StorageManager } from './utils/storage-manager';

// ✅ 正確
import { StorageManager } from './utils/storage-manager.js';
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "node",
    "allowImportingTsExtensions": false
  }
}
```

### 案例 3：Service Worker 錯誤

**問題描述**：Service Worker 無法啟動或頻繁重啟。

**除錯步驟**：

```typescript
// 1. 檢查 Service Worker 狀態
// 前往 chrome://serviceworker-internals

// 2. 使用 MCP 檢查 Service Worker
mcp_playwright_browser_navigate({ url: 'chrome://serviceworker-internals' });

// 3. 擷取 Service Worker Console
// 注意：需要切換到 Service Worker 的執行環境

// 4. 檢查 Message Handlers
const handlers = mcp_playwright_browser_evaluate({
  function: `() => ({
    onMessage: !!chrome.runtime.onMessage.hasListeners(),
    onInstalled: !!chrome.runtime.onInstalled.hasListeners(),
    onStartup: !!chrome.runtime.onStartup.hasListeners()
  })`,
});
```

**常見原因**：

- 未捕捉的 Promise rejection
- 同步程式碼執行時間過長
- 記憶體洩漏
- 無限迴圈

**解決方案**：

```typescript
// ✅ 正確的 Message Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      const result = await processMessage(message);
      sendResponse({ success: true, data: result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true; // 保持 message channel 開啟
});
```

### 案例 4：Offscreen Document AI 處理失敗

**問題描述**：AI 服務無法正常運作。

**除錯步驟**：

```typescript
// 1. 檢查 Offscreen Document 是否已建立
const offscreenStatus = mcp_playwright_browser_evaluate({
  function: `() => ({
    offscreenAvailable: typeof chrome.offscreen !== 'undefined',
    aiCoordinator: !!window.aiServiceCoordinator,
    chromeAI: !!window.ai
  })`,
});

// 2. 測試 AI 服務
const aiTest = mcp_playwright_browser_evaluate({
  function: `() => {
    if (window.aiServiceCoordinator) {
      return window.aiServiceCoordinator.testAllServices();
    }
    return "AI coordinator not available";
  }`,
});

// 3. 檢查 API 可用性
const apiStatus = mcp_playwright_browser_evaluate({
  function: `() => ({
    chromeAI: {
      available: !!window.ai,
      summarizer: !!window.ai?.summarizer,
      translator: !!window.ai?.translator,
      rewriter: !!window.ai?.rewriter
    },
    geminiAPI: !!window.geminiAPI
  })`,
});
```

**常見原因**：

- Chrome Built-in AI API 未啟用（需要 Chrome 140+）
- Gemini API Key 未設定
- Offscreen Document 未正確建立
- 權限不足

**解決方案**：

```typescript
// 確保 Offscreen Document 已建立
async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen/offscreen.html',
      reasons: ['WORKERS'],
      justification: 'AI processing',
    });
  }
}
```

### 案例 5：UI 頁面載入錯誤

**問題描述**：Learning Interface 無法正常顯示。

**除錯步驟**：

```typescript
// 1. 導航到 UI 頁面
mcp_playwright_browser_navigate({
  url: `chrome-extension://${extensionId}/ui/learning.html`,
});

// 2. 檢查頁面載入狀態
const pageStatus = mcp_playwright_browser_evaluate({
  function: `() => ({
    readyState: document.readyState,
    components: document.querySelectorAll('[data-component]').length,
    errors: window.errors || []
  })`,
});

// 3. 擷取 Console 錯誤
const errors = mcp_playwright_browser_console_messages({ onlyErrors: true });

// 4. 截圖記錄
mcp_playwright_browser_take_screenshot({
  filename: 'ui-error.png',
  fullPage: true,
});
```

**常見原因**：

- CSS 檔案載入失敗
- JavaScript 模組錯誤
- 資料載入失敗
- 權限問題

---

## 疑難排解

### 問題：Extension 無法載入

**症狀**：

- `chrome://extensions` 顯示錯誤
- Extension 圖示不出現

**檢查清單**：

```bash
# 1. 確認 dist/ 目錄存在
ls dist/

# 2. 驗證 manifest.json
cat dist/manifest.json | jq .

# 3. 檢查必要檔案
ls dist/background/service-worker.js
ls dist/content/content-script.js
ls dist/offscreen/offscreen.js

# 4. 重新建置
pnpm build
```

### 問題：MCP 指令無回應

**症狀**：

- MCP 呼叫超時
- 沒有返回結果

**解決方案**：

```bash
# 1. 檢查 MCP Server 狀態
# 查看 mcp-config.json 配置

# 2. 重啟 MCP Server
# 重新啟動 AI 助手或 CLI

# 3. 驗證 Playwright 安裝
npx playwright --version

# 4. 測試簡單指令
mcp_playwright_browser_navigate({ url: "https://example.com" })
```

### 問題：Console 錯誤過多

**症狀**：

- 大量重複錯誤
- 難以定位根本原因

**分析策略**：

```typescript
// 1. 按類型分類錯誤
const errorsByType = {
  loading: [],
  import: [],
  path: [],
  runtime: []
};

errors.forEach(error => {
  const type = categorizeError(error.text);
  errorsByType[type].push(error);
});

// 2. 優先處理 CRITICAL 錯誤
// loading 和 import 錯誤通常是根本原因

// 3. 使用錯誤分析工具
npx tsx debug/console-error-analyzer.ts
```

### 問題：效能問題

**症狀**：

- Extension 反應緩慢
- 記憶體使用過高

**除錯步驟**：

```typescript
// 1. 監控記憶體使用
const memoryInfo = mcp_playwright_browser_evaluate({
  function: `() => {
    const mem = performance.memory;
    return {
      used: mem.usedJSHeapSize,
      total: mem.totalJSHeapSize,
      limit: mem.jsHeapSizeLimit,
      percentage: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100
    };
  }`
})

// 2. 檢查效能指標
const performanceMetrics = mcp_playwright_browser_evaluate({
  function: `() => ({
    timing: performance.timing,
    navigation: performance.navigation,
    resources: performance.getEntriesByType('resource').length
  })`
})

// 3. 執行效能測試
npx tsx debug/test-performance-page-load.ts
```

---

## 進階技巧

### 自動化測試腳本

建立可重複執行的測試腳本：

```typescript
// debug/my-custom-test.ts
import { chromium } from 'playwright';

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 測試流程
  await page.goto('https://example.com');

  // 檢查 Content Script
  const hasExtension = await page.evaluate(() => {
    return typeof window.__LANGUAGE_LEARNING_EXTENSION__ !== 'undefined';
  });

  console.log('Extension injected:', hasExtension);

  await browser.close();
}

runTest();
```

### 持續監控

設定持續監控系統：

```typescript
// 使用 debug/monitoring/ 下的工具
npx tsx debug/monitoring/continuous-debug-monitor.ts
```

### 視覺化除錯

使用視覺化工具：

```typescript
// 執行視覺化除錯工作流程
npx tsx debug/run-visual-debugging-workflow.ts

// 查看生成的截圖和報告
ls debug/playwright-reports/
```

---

## 參考資源

### 專案內文件

- `debug/README.md` - 除錯系統總覽
- `debug/playwright-extension-testing-README.md` - Playwright 測試指南
- `debug/MCP_DEBUGGING_COMMANDS_CHEATSHEET.md` - MCP 指令速查表
- `debug/DEBUGGING_BEST_PRACTICES.md` - 除錯最佳實踐

### 執行腳本

- `debug/run-extension-validation.ts` - 完整驗證流程
- `debug/extension-context-verifier.ts` - 環境驗證
- `debug/console-error-analyzer.ts` - 錯誤分析
- `debug/test-content-script-injection.ts` - Content Script 測試
- `debug/test-user-interaction.ts` - 使用者互動測試

### 外部資源

- [Playwright 官方文件](https://playwright.dev/)
- [Chrome Extension 開發指南](https://developer.chrome.com/docs/extensions/)
- [Model Context Protocol 規範](https://modelcontextprotocol.io/)

---

## 總結

Playwright MCP 提供了強大的自動化除錯能力，讓 Chrome Extension 的測試與驗證變得更加高效。關鍵要點：

1. **建置優先**：確保 `pnpm build` 成功完成
2. **手動載入**：目前需手動載入 Extension 到 Chrome
3. **系統化測試**：使用提供的腳本進行完整驗證
4. **錯誤分類**：按類型（loading、import、path、runtime）處理錯誤
5. **持續監控**：建立自動化測試流程

透過本教學的方法，你可以快速定位並解決 Extension 開發中的各種問題，提升開發效率與程式碼品質。
