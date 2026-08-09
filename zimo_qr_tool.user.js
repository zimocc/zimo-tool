// ==UserScript==
// @name         紫陌二维码工具箱 (QR Floating Mini Window Tool)
// @namespace    https://abc.zimo.cc/
// @version      1.0.0
// @description  全网通用的网页悬浮小窗二维码识别与生成工具，纯前端离线安全，支持拖拽、剪贴板粘贴、右键图片快捷解析与实时生成。
// @author       紫陌 (zimocc)
// @icon         https://tool.zimo.cc/favicon.svg
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js
// @require      https://cdn.jsdelivr.net/npm/qrcode@1.5.0/build/qrcode.min.js
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // Prevent multiple injections
  if (document.getElementById('zimo-qr-root')) return;

  // Root Container & Shadow DOM Setup
  const rootContainer = document.createElement('div');
  rootContainer.id = 'zimo-qr-root';
  rootContainer.style.position = 'absolute';
  rootContainer.style.top = '0';
  rootContainer.style.left = '0';
  rootContainer.style.width = '0';
  rootContainer.style.height = '0';
  rootContainer.style.zIndex = '2147483647';
  document.body.appendChild(rootContainer);

  const shadow = rootContainer.attachShadow({ mode: 'open' });

  // Styles Definition (Neo-brutalism / Sleek Mini Window)
  const styles = `
    :host {
      all: initial;
      font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
    }

    .zimo-theme-light {
      --bg-main: #f0faff;
      --card-bg: #ffffff;
      --border-color: #3d405b;
      --text-main: #3d405b;
      --text-muted: #636e72;
      --input-bg: #f8fafc;
      --shadow-color: rgba(61, 64, 91, 0.25);

      --btn-primary: #74b9ff;
      --btn-action: #a29bfe;
      --btn-secondary: #55efc4;
      --btn-warning: #ffeaa7;
      --btn-danger: #ff7675;
      --btn-hover: #0984e3;

      --badge-success-bg: #e6fffa;
      --badge-success-color: #00b894;
      --badge-fail-bg: #ffe6e6;
      --badge-fail-color: #d63031;
    }

    .zimo-theme-dark {
      --bg-main: #0f172a;
      --card-bg: #1e293b;
      --border-color: #475569;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --input-bg: #0f172a;
      --shadow-color: rgba(0, 0, 0, 0.5);

      --btn-primary: #3b82f6;
      --btn-action: #8b5cf6;
      --btn-secondary: #10b981;
      --btn-warning: #d97706;
      --btn-danger: #ef4444;
      --btn-hover: #2563eb;

      --badge-success-bg: rgba(16, 185, 129, 0.2);
      --badge-success-color: #34d399;
      --badge-fail-bg: rgba(239, 68, 68, 0.2);
      --badge-fail-color: #f87171;
    }

    /* Floating Launcher Button */
    .zimo-float-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--btn-action);
      border: 3px solid var(--border-color);
      box-shadow: 0 4px 10px var(--shadow-color), 0 3px 0 var(--border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s;
      color: #ffffff;
    }
    .zimo-float-btn:hover {
      transform: scale(1.08) translateY(-2px);
    }
    .zimo-float-btn:active {
      transform: scale(0.95) translateY(1px);
    }
    .zimo-float-btn svg {
      width: 24px;
      height: 24px;
      stroke-width: 2.3;
    }

    /* Mini Window Outer Shell */
    .zimo-mini-window {
      position: fixed;
      width: 380px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 40px);
      background: var(--card-bg);
      border: 3px solid var(--border-color);
      border-radius: 18px;
      box-shadow: 0 12px 30px var(--shadow-color), 0 6px 0 var(--border-color);
      color: var(--text-main);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 2147483646;
      transition: opacity 0.2s ease, transform 0.2s ease;
      font-size: 13px;
    }

    .zimo-mini-window.hidden {
      opacity: 0;
      pointer-events: none;
      transform: scale(0.92) translateY(12px);
    }

    /* Header Bar */
    .zimo-header {
      background: var(--bg-main);
      padding: 10px 14px;
      border-bottom: 3px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: move;
    }
    .zimo-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      font-size: 14px;
      color: var(--text-main);
    }
    .zimo-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .zimo-icon-btn {
      background: transparent;
      border: 2px solid transparent;
      border-radius: 8px;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.15s;
    }
    .zimo-icon-btn:hover {
      background: var(--card-bg);
      color: var(--text-main);
      border-color: var(--border-color);
    }

    /* Navigation Tabs Bar */
    .zimo-tabs {
      display: flex;
      background: var(--bg-main);
      border-bottom: 2.5px solid var(--border-color);
      padding: 4px 8px 0 8px;
      gap: 4px;
    }
    .zimo-tab-item {
      flex: 1;
      text-align: center;
      padding: 8px 4px;
      font-weight: 700;
      font-size: 12px;
      color: var(--text-muted);
      cursor: pointer;
      border: 2px solid transparent;
      border-bottom: none;
      border-radius: 10px 10px 0 0;
      transition: all 0.15s;
    }
    .zimo-tab-item:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.4);
    }
    .zimo-tab-item.active {
      color: var(--text-main);
      background: var(--card-bg);
      border-color: var(--border-color);
      font-weight: 900;
    }

    /* Content Body Area */
    .zimo-body {
      padding: 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 480px;
    }

    .zimo-tab-content {
      display: none;
      flex-direction: column;
      gap: 12px;
    }
    .zimo-tab-content.active {
      display: flex;
    }

    /* Compact Dropzone / Scan Area */
    .zimo-dropzone {
      border: 2.5px dashed var(--border-color);
      border-radius: 12px;
      background: var(--bg-main);
      padding: 16px 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .zimo-dropzone:hover, .zimo-dropzone.drag-over {
      border-color: var(--btn-action);
      background: var(--card-bg);
    }
    .zimo-dropzone-title {
      font-weight: 800;
      font-size: 13px;
    }
    .zimo-dropzone-subtitle {
      font-size: 11px;
      color: var(--text-muted);
    }
    .zimo-kbd {
      background: var(--card-bg);
      border: 1.5px solid var(--border-color);
      border-radius: 4px;
      padding: 1px 5px;
      font-family: monospace;
      font-weight: 700;
      font-size: 10px;
      box-shadow: 0 2px 0 var(--border-color);
    }

    /* Canvas Preview Wrapper */
    .zimo-canvas-wrapper {
      position: relative;
      width: 100%;
      max-height: 180px;
      background: var(--bg-main);
      border: 2px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .zimo-canvas-wrapper canvas {
      max-width: 100%;
      max-height: 180px;
      object-fit: contain;
    }

    /* Status Badge */
    .zimo-status-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .zimo-status-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
      border: 1.5px solid var(--border-color);
      background: var(--bg-main);
      color: var(--text-muted);
    }
    .zimo-status-badge.success {
      background: var(--badge-success-bg);
      color: var(--badge-success-color);
    }
    .zimo-status-badge.fail {
      background: var(--badge-fail-bg);
      color: var(--badge-fail-color);
    }

    /* Textarea & Inputs */
    .zimo-textarea {
      width: 100%;
      height: 72px;
      padding: 8px 10px;
      border: 2px solid var(--border-color);
      border-radius: 10px;
      background: var(--input-bg);
      color: var(--text-main);
      font-family: inherit;
      font-size: 12px;
      resize: vertical;
      outline: none;
      user-select: text;
    }
    .zimo-textarea:focus {
      border-color: var(--btn-action);
    }

    /* Buttons Grid */
    .zimo-btn-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 6px;
    }
    .zimo-btn {
      background: var(--btn-primary);
      color: #ffffff;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 3px 0 var(--border-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.1s;
      white-space: nowrap;
    }
    .zimo-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 0 var(--border-color);
    }
    .zimo-btn:active:not(:disabled) {
      transform: translateY(2px);
      box-shadow: 0 1px 0 var(--border-color);
    }
    .zimo-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }
    .zimo-btn-action { background: var(--btn-action); }
    .zimo-btn-secondary { background: var(--btn-secondary); color: #2d3436; }
    .zimo-btn-danger { background: var(--btn-danger); }

    /* Generator Options Row */
    .zimo-gen-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--bg-main);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 12px;
      min-height: 160px;
    }
    .zimo-gen-preview canvas {
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    /* History List */
    .zimo-history-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 320px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .zimo-history-item {
      background: var(--bg-main);
      border: 2px solid var(--border-color);
      border-radius: 10px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .zimo-history-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10.5px;
      color: var(--text-muted);
      font-weight: 700;
    }
    .zimo-history-content {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .zimo-history-qr-img {
      width: 64px;
      height: 64px;
      min-width: 64px;
      min-height: 64px;
      object-fit: contain;
      background: #ffffff;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      padding: 2px;
      box-shadow: 0 2px 0 var(--border-color);
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .zimo-history-qr-img:hover {
      transform: scale(1.05);
    }
    .zimo-history-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }
    .zimo-history-text {
      font-size: 11.5px;
      font-weight: 600;
      word-break: break-all;
      user-select: text;
      max-height: 52px;
      overflow-y: auto;
    }
    .zimo-history-actions {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    /* Toast Notification */
    .zimo-toast-container {
      position: fixed;
      bottom: 80px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 2147483647;
      pointer-events: none;
    }
    .zimo-toast {
      background: var(--card-bg);
      color: var(--text-main);
      border: 2.5px solid var(--border-color);
      border-radius: 10px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 800;
      box-shadow: 0 4px 10px var(--shadow-color), 0 3px 0 var(--border-color);
      animation: zimo-toast-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes zimo-toast-in {
      from { opacity: 0; transform: translateY(12px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;

  // Inject Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  // Shell Structure
  const wrapper = document.createElement('div');
  wrapper.className = 'zimo-theme-light';
  shadow.appendChild(wrapper);

  wrapper.innerHTML = `
    <!-- Floating Launcher -->
    <button class="zimo-float-btn" id="zimo-float-btn" title="打开/收起二维码工具箱 (Ctrl+Q)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    </button>

    <!-- Mini Window -->
    <div class="zimo-mini-window hidden" id="zimo-window">
      <!-- Header Bar -->
      <div class="zimo-header" id="zimo-header">
        <div class="zimo-header-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>紫陌二维码工具</span>
        </div>
        <div class="zimo-header-actions">
          <button class="zimo-icon-btn" id="zimo-btn-theme" title="切换暗黑/亮色主题">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>
          <button class="zimo-icon-btn" id="zimo-btn-close" title="关闭窗口">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs Bar -->
      <div class="zimo-tabs">
        <div class="zimo-tab-item active" data-tab="scan">🔍 扫码识别</div>
        <div class="zimo-tab-item" data-tab="gen">⚡ 生成二维码</div>
        <div class="zimo-tab-item" data-tab="history">📜 历史记录</div>
      </div>

      <!-- Content Body -->
      <div class="zimo-body">

        <!-- TAB 1: 二维码识别 -->
        <div class="zimo-tab-content active" id="tab-scan">
          <input type="file" id="zimo-file-input" accept="image/*" style="display: none;">

          <div class="zimo-dropzone" id="zimo-dropzone">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <div class="zimo-dropzone-title">点击选择 / 拖拽图片 / <kbd class="zimo-kbd">Ctrl+V</kbd> 粘贴</div>
            <div class="zimo-dropzone-subtitle">💡 支持右键网页任意图片快捷解析</div>
          </div>

          <div class="zimo-canvas-wrapper" id="zimo-canvas-wrapper" style="display: none;">
            <canvas id="zimo-scan-canvas"></canvas>
          </div>

          <div class="zimo-status-bar">
            <span style="font-weight: 800; font-size: 11.5px;">识别结果：</span>
            <span class="zimo-status-badge" id="zimo-status-badge">等待图片</span>
          </div>

          <textarea class="zimo-textarea" id="zimo-scan-result" placeholder="解析出的文本或 URL 链接将显示在此处..." readonly></textarea>

          <div class="zimo-btn-grid">
            <button class="zimo-btn zimo-btn-action" id="zimo-btn-select-img">上传图片</button>
            <button class="zimo-btn zimo-btn-secondary" id="zimo-btn-copy-scan" disabled>复制文本</button>
            <button class="zimo-btn" id="zimo-btn-open-link" disabled>打开链接</button>
            <button class="zimo-btn zimo-btn-danger" id="zimo-btn-clear-scan" disabled>重置</button>
          </div>
        </div>

        <!-- TAB 2: 生成二维码 -->
        <div class="zimo-tab-content" id="tab-gen">
          <textarea class="zimo-textarea" id="zimo-gen-input" placeholder="请输入任意文本或 URL 网址..."></textarea>

          <div style="display: flex; gap: 6px;">
            <button class="zimo-btn zimo-btn-action" id="zimo-btn-gen-curr-url" style="flex:1;">当前页 URL</button>
            <button class="zimo-btn zimo-btn-secondary" id="zimo-btn-gen-selection" style="flex:1;">网页选中文本</button>
          </div>

          <div class="zimo-gen-preview">
            <canvas id="zimo-gen-canvas"></canvas>
          </div>

          <div class="zimo-btn-grid">
            <button class="zimo-btn zimo-btn-action" id="zimo-btn-dl-qr">下载二维码</button>
            <button class="zimo-btn zimo-btn-secondary" id="zimo-btn-copy-qr-img">复制图片</button>
            <button class="zimo-btn" id="zimo-btn-copy-gen-text">复制文本</button>
          </div>
        </div>

        <!-- TAB 3: 历史记录 -->
        <div class="zimo-tab-content" id="tab-history">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 11.5px;">近期记录 (最多保留 20 条)</span>
            <button class="zimo-btn zimo-btn-danger" id="zimo-btn-clear-history" style="padding: 3px 8px; font-size: 10.5px;">清空历史</button>
          </div>
          <div class="zimo-history-list" id="zimo-history-list"></div>
        </div>

      </div>
    </div>

    <!-- Toast Notifications Container -->
    <div class="zimo-toast-container" id="zimo-toast-container"></div>
  `;

  // UI Element References
  const floatBtn = shadow.getElementById('zimo-float-btn');
  const win = shadow.getElementById('zimo-window');
  const header = shadow.getElementById('zimo-header');
  const btnClose = shadow.getElementById('zimo-btn-close');
  const btnTheme = shadow.getElementById('zimo-btn-theme');

  const fileInput = shadow.getElementById('zimo-file-input');
  const dropzone = shadow.getElementById('zimo-dropzone');
  const canvasWrapper = shadow.getElementById('zimo-canvas-wrapper');
  const scanCanvas = shadow.getElementById('zimo-scan-canvas');
  const scanCtx = scanCanvas.getContext('2d');
  const statusBadge = shadow.getElementById('zimo-status-badge');
  const scanResultInput = shadow.getElementById('zimo-scan-result');

  const btnSelectImg = shadow.getElementById('zimo-btn-select-img');
  const btnCopyScan = shadow.getElementById('zimo-btn-copy-scan');
  const btnOpenLink = shadow.getElementById('zimo-btn-open-link');
  const btnClearScan = shadow.getElementById('zimo-btn-clear-scan');

  const genInput = shadow.getElementById('zimo-gen-input');
  const btnGenCurrUrl = shadow.getElementById('zimo-btn-gen-curr-url');
  const btnGenSelection = shadow.getElementById('zimo-btn-gen-selection');
  const genCanvas = shadow.getElementById('zimo-gen-canvas');
  const btnDlQr = shadow.getElementById('zimo-btn-dl-qr');
  const btnCopyQrImg = shadow.getElementById('zimo-btn-copy-qr-img');
  const btnCopyGenText = shadow.getElementById('zimo-btn-copy-gen-text');

  const historyListEl = shadow.getElementById('zimo-history-list');
  const btnClearHistory = shadow.getElementById('zimo-btn-clear-history');
  const toastContainer = shadow.getElementById('zimo-toast-container');

  // State Management
  let isWindowVisible = false;
  let currentScanResult = '';
  let currentScanImage = null;
  const historyData = GM_getValue('zimo_qr_history', []);

  // Toast Function
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'zimo-toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s';
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  }

  // Theme Management
  function toggleTheme() {
    const isDark = wrapper.classList.contains('zimo-theme-dark');
    if (isDark) {
      wrapper.classList.remove('zimo-theme-dark');
      wrapper.classList.add('zimo-theme-light');
      GM_setValue('zimo_qr_theme', 'light');
    } else {
      wrapper.classList.remove('zimo-theme-light');
      wrapper.classList.add('zimo-theme-dark');
      GM_setValue('zimo_qr_theme', 'dark');
    }
  }

  const savedTheme = GM_getValue('zimo_qr_theme', 'light');
  if (savedTheme === 'dark') {
    wrapper.classList.remove('zimo-theme-light');
    wrapper.classList.add('zimo-theme-dark');
  }

  btnTheme.addEventListener('click', toggleTheme);

  // Toggle Window Visibility
  function toggleWindow(show) {
    if (typeof show === 'boolean') {
      isWindowVisible = show;
    } else {
      isWindowVisible = !isWindowVisible;
    }

    if (isWindowVisible) {
      win.classList.remove('hidden');
      if (!genInput.value.trim()) {
        genInput.value = window.location.href;
        triggerQRGeneration();
      }
      // Auto focus on active input element
      setTimeout(() => {
        const activeTab = shadow.querySelector('.zimo-tab-item.active')?.getAttribute('data-tab');
        if (activeTab === 'gen') {
          genInput.focus();
          genInput.select();
        } else if (activeTab === 'scan') {
          scanResultInput.focus();
        }
      }, 50);
    } else {
      win.classList.add('hidden');
    }
  }

  // Global Keyboard Shortcut: Ctrl + Q (or Cmd + Q)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'q') {
      e.preventDefault();
      toggleWindow();
    }
  });

  // Floating Launcher Button Draggable & Position Persistence
  let isBtnDragging = false;
  let btnDragStartX = 0;
  let btnDragStartY = 0;
  let btnInitialLeft = 0;
  let btnInitialTop = 0;
  let hasBtnMoved = false;

  // Restore saved position for floating launcher button
  const savedFloatPos = GM_getValue('zimo_qr_float_pos', null);
  if (savedFloatPos && typeof savedFloatPos.left === 'number' && typeof savedFloatPos.top === 'number') {
    const safeLeft = Math.max(8, Math.min(window.innerWidth - 56, savedFloatPos.left));
    const safeTop = Math.max(8, Math.min(window.innerHeight - 56, savedFloatPos.top));
    floatBtn.style.left = `${safeLeft}px`;
    floatBtn.style.top = `${safeTop}px`;
    floatBtn.style.right = 'auto';
    floatBtn.style.bottom = 'auto';
  }

  function onFloatBtnPointerDown(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    isBtnDragging = true;
    hasBtnMoved = false;
    btnDragStartX = clientX;
    btnDragStartY = clientY;

    const rect = floatBtn.getBoundingClientRect();
    btnInitialLeft = rect.left;
    btnInitialTop = rect.top;

    floatBtn.style.transition = 'none';

    window.addEventListener('mousemove', onFloatBtnPointerMove, { passive: false });
    window.addEventListener('touchmove', onFloatBtnPointerMove, { passive: false });
    window.addEventListener('mouseup', onFloatBtnPointerUp);
    window.addEventListener('touchend', onFloatBtnPointerUp);
  }

  function onFloatBtnPointerMove(e) {
    if (!isBtnDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - btnDragStartX;
    const dy = clientY - btnDragStartY;

    if (Math.hypot(dx, dy) > 4) {
      hasBtnMoved = true;
    }

    if (hasBtnMoved) {
      if (e.cancelable) e.preventDefault();
      let newLeft = btnInitialLeft + dx;
      let newTop = btnInitialTop + dy;

      newLeft = Math.max(8, Math.min(window.innerWidth - floatBtn.offsetWidth - 8, newLeft));
      newTop = Math.max(8, Math.min(window.innerHeight - floatBtn.offsetHeight - 8, newTop));

      floatBtn.style.left = `${newLeft}px`;
      floatBtn.style.top = `${newTop}px`;
      floatBtn.style.right = 'auto';
      floatBtn.style.bottom = 'auto';
    }
  }

  function onFloatBtnPointerUp() {
    if (!isBtnDragging) return;
    isBtnDragging = false;
    floatBtn.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s';

    window.removeEventListener('mousemove', onFloatBtnPointerMove);
    window.removeEventListener('touchmove', onFloatBtnPointerMove);
    window.removeEventListener('mouseup', onFloatBtnPointerUp);
    window.removeEventListener('touchend', onFloatBtnPointerUp);

    if (hasBtnMoved) {
      const rect = floatBtn.getBoundingClientRect();
      GM_setValue('zimo_qr_float_pos', { left: rect.left, top: rect.top });
    }
  }

  floatBtn.addEventListener('mousedown', onFloatBtnPointerDown);
  floatBtn.addEventListener('touchstart', onFloatBtnPointerDown, { passive: true });

  floatBtn.addEventListener('click', (e) => {
    if (hasBtnMoved) {
      e.stopImmediatePropagation();
      e.preventDefault();
      hasBtnMoved = false;
      return;
    }
    toggleWindow();
  });

  btnClose.addEventListener('click', () => toggleWindow(false));

  // Draggable Window Logic
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('.zimo-icon-btn')) return;
    isDragging = true;
    const rect = win.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let newX = e.clientX - dragOffsetX;
    let newY = e.clientY - dragOffsetY;

    // Bounds limit
    newX = Math.max(10, Math.min(window.innerWidth - win.offsetWidth - 10, newX));
    newY = Math.max(10, Math.min(window.innerHeight - win.offsetHeight - 10, newY));

    win.style.left = `${newX}px`;
    win.style.top = `${newY}px`;
    win.style.right = 'auto';
    win.style.bottom = 'auto';
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Initial Window Positioning
  win.style.bottom = '84px';
  win.style.right = '24px';

  // Tabs Switching
  const tabItems = shadow.querySelectorAll('.zimo-tab-item');
  const tabContents = shadow.querySelectorAll('.zimo-tab-content');

  tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      tabItems.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      shadow.getElementById(`tab-${targetTab}`).classList.add('active');

      if (targetTab === 'history') {
        renderHistory();
      } else if (targetTab === 'gen') {
        triggerQRGeneration();
      }
    });
  });

  // Dual-Engine QR Scan Processing
  function decodeQRResultToString(jsqrResult) {
    if (!jsqrResult) return null;
    const rawBytes = jsqrResult.binaryData || (jsqrResult.chunks && jsqrResult.chunks[0] && jsqrResult.chunks[0].bytes);
    if (!rawBytes || rawBytes.length === 0) {
      return jsqrResult.data;
    }

    const uint8 = new Uint8Array(rawBytes);
    try {
      const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
      const decoded = utf8Decoder.decode(uint8);
      if (decoded && !decoded.includes("\uFFFD")) return decoded;
    } catch (e) {}

    const encodings = ["gbk", "gb18030", "gb2312"];
    for (const enc of encodings) {
      try {
        const gbkDecoder = new TextDecoder(enc, { fatal: false });
        const decoded = gbkDecoder.decode(uint8);
        if (decoded && !decoded.includes("\uFFFD")) return decoded;
      } catch (e) {}
    }
    return jsqrResult.data || "";
  }

  async function processQRScanImage(imgElement) {
    statusBadge.className = 'zimo-status-badge';
    statusBadge.textContent = '解析中...';

    const w = imgElement.naturalWidth || imgElement.width;
    const h = imgElement.naturalHeight || imgElement.height;
    scanCanvas.width = w;
    scanCanvas.height = h;
    scanCtx.drawImage(imgElement, 0, 0);

    let decodedText = null;
    let locationObj = null;

    // 1. Native BarcodeDetector if supported by browser
    if ('BarcodeDetector' in window) {
      try {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(scanCanvas);
        if (barcodes && barcodes.length > 0) {
          decodedText = barcodes[0].rawValue;
          if (barcodes[0].cornerPoints) {
            locationObj = {
              topLeftCorner: barcodes[0].cornerPoints[0],
              topRightCorner: barcodes[0].cornerPoints[1],
              bottomRightCorner: barcodes[0].cornerPoints[2],
              bottomLeftCorner: barcodes[0].cornerPoints[3]
            };
          }
        }
      } catch (err) {}
    }

    // 2. Full Resolution jsQR Pass
    if (!decodedText && window.jsQR) {
      const imgData = scanCtx.getImageData(0, 0, w, h);
      const code = jsQR(imgData.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (code) {
        decodedText = decodeQRResultToString(code);
        locationObj = code.location;
      }
    }

    // 3. Multi-scale Fallback Pass
    if (!decodedText && window.jsQR) {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      const scales = [0.75, 0.5, 1.25, 0.35];

      for (const scale of scales) {
        const sw = Math.round(w * scale);
        const sh = Math.round(h * scale);
        if (sw < 80 || sh < 80) continue;

        tempCanvas.width = sw;
        tempCanvas.height = sh;
        tempCtx.drawImage(imgElement, 0, 0, sw, sh);

        const scaledData = tempCtx.getImageData(0, 0, sw, sh);
        const code = jsQR(scaledData.data, sw, sh, { inversionAttempts: 'attemptBoth' });
        if (code) {
          decodedText = decodeQRResultToString(code);
          if (code.location) {
            const invScale = 1 / scale;
            locationObj = {
              topLeftCorner: { x: code.location.topLeftCorner.x * invScale, y: code.location.topLeftCorner.y * invScale },
              topRightCorner: { x: code.location.topRightCorner.x * invScale, y: code.location.topRightCorner.y * invScale },
              bottomRightCorner: { x: code.location.bottomRightCorner.x * invScale, y: code.location.bottomRightCorner.y * invScale },
              bottomLeftCorner: { x: code.location.bottomLeftCorner.x * invScale, y: code.location.bottomLeftCorner.y * invScale }
            };
          }
          break;
        }
      }
    }

    if (decodedText) {
      currentScanResult = decodedText;
      scanResultInput.value = decodedText;
      statusBadge.className = 'zimo-status-badge success';
      statusBadge.textContent = '解析成功 ✓';
      btnCopyScan.disabled = false;
      btnClearScan.disabled = false;

      const isUrl = /^https?:\/\/[^\s]+$/i.test(decodedText.trim());
      btnOpenLink.disabled = !isUrl;

      // Render highlight polygon over detected QR code
      if (locationObj && locationObj.topLeftCorner) {
        const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = locationObj;
        scanCtx.strokeStyle = '#55efc4';
        scanCtx.lineWidth = Math.max(5, Math.floor(w / 80));
        scanCtx.fillStyle = 'rgba(85, 239, 196, 0.25)';
        scanCtx.beginPath();
        scanCtx.moveTo(topLeftCorner.x, topLeftCorner.y);
        scanCtx.lineTo(topRightCorner.x, topRightCorner.y);
        scanCtx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
        scanCtx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
        scanCtx.closePath();
        scanCtx.stroke();
        scanCtx.fill();
      }

      addHistory('scan', decodedText);
      showToast('二维码解析成功！');
    } else {
      currentScanResult = '';
      scanResultInput.value = '';
      statusBadge.className = 'zimo-status-badge fail';
      statusBadge.textContent = '未检测到二维码 ✕';
      btnCopyScan.disabled = true;
      btnOpenLink.disabled = true;
      btnClearScan.disabled = false;
      showToast('未检测到有效的二维码');
    }
  }

  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('请选择有效的图片文件！');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentScanImage = img;
        canvasWrapper.style.display = 'flex';
        processQRScanImage(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleImageUrl(url) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      currentScanImage = img;
      canvasWrapper.style.display = 'flex';
      processQRScanImage(img);
    };
    img.onerror = () => {
      showToast('图片读取受跨域限制或加载失败');
    };
    img.src = url;
  }

  // Scan Events Setup
  btnSelectImg.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageFile(e.target.files[0]);
    }
  });

  // Drag & Drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, () => dropzone.classList.add('drag-over'));
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, () => dropzone.classList.remove('drag-over'));
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleImageFile(dt.files[0]);
    }
  });

  // Clipboard Paste Support inside window or document
  window.addEventListener('paste', (e) => {
    if (!isWindowVisible) return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleImageFile(file);
          showToast('已从剪贴板接收图片并识别...');
          break;
        }
      }
    }
  });

  // Action Buttons Handler
  btnCopyScan.addEventListener('click', () => {
    if (currentScanResult) {
      GM_setClipboard(currentScanResult);
      showToast('文本已成功复制到剪贴板！');
    }
  });

  btnOpenLink.addEventListener('click', () => {
    if (currentScanResult && /^https?:\/\/[^\s]+$/i.test(currentScanResult.trim())) {
      window.open(currentScanResult.trim(), '_blank');
    }
  });

  btnClearScan.addEventListener('click', () => {
    currentScanImage = null;
    currentScanResult = '';
    fileInput.value = '';
    scanCtx.clearRect(0, 0, scanCanvas.width, scanCanvas.height);
    canvasWrapper.style.display = 'none';
    scanResultInput.value = '';
    statusBadge.className = 'zimo-status-badge';
    statusBadge.textContent = '等待图片';
    btnCopyScan.disabled = true;
    btnOpenLink.disabled = true;
    btnClearScan.disabled = true;
    showToast('已重置识别页面');
  });

  // Standalone Lightweight Inline QR Code Generator Engine (Zero external dependencies)
  const QRCodeEngine = (function () {
    const EXP_TABLE = new Array(256);
    const LOG_TABLE = new Array(256);
    for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
    for (let i = 8; i < 256; i++) EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
    for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;

    function glog(n) { if (n < 1) throw new Error("glog(" + n + ")"); return LOG_TABLE[n]; }
    function gexp(n) { while (n < 0) n += 255; while (n >= 255) n -= 255; return EXP_TABLE[n]; }

    function Polynomial(num, shift) {
      let offset = 0;
      while (offset < num.length && num[offset] === 0) offset++;
      this.num = new Array(num.length - offset + shift);
      for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
      for (let i = num.length - offset; i < this.num.length; i++) this.num[i] = 0;
    }
    Polynomial.prototype = {
      get: function (index) { return this.num[index]; },
      getLength: function () { return this.num.length; },
      multiply: function (e) {
        const num = new Array(this.getLength() + e.getLength() - 1);
        for (let i = 0; i < num.length; i++) num[i] = 0;
        for (let i = 0; i < this.getLength(); i++) {
          for (let j = 0; j < e.getLength(); j++) {
            num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
          }
        }
        return new Polynomial(num, 0);
      },
      mod: function (e) {
        if (this.getLength() - e.getLength() < 0) return this;
        const ratio = glog(this.get(0)) - glog(e.get(0));
        const num = new Array(this.getLength());
        for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
        for (let i = 0; i < e.getLength(); i++) num[i] ^= gexp(glog(e.get(i)) + ratio);
        return new Polynomial(num, 0).mod(e);
      }
    };

    const RS_POLY_CACHE = {};
    function getErrorCorrectionPolynomial(errorCorrectionLength) {
      if (RS_POLY_CACHE[errorCorrectionLength]) return RS_POLY_CACHE[errorCorrectionLength];
      let a = new Polynomial([1], 0);
      for (let i = 0; i < errorCorrectionLength; i++) {
        a = a.multiply(new Polynomial([1, gexp(i)], 0));
      }
      RS_POLY_CACHE[errorCorrectionLength] = a;
      return a;
    }

    const CAPACITY = [
      [17, 14, 11, 7], [32, 26, 20, 14], [53, 42, 32, 24], [78, 62, 46, 34],
      [106, 84, 60, 44], [134, 106, 74, 58], [154, 122, 86, 64], [192, 152, 108, 84],
      [230, 180, 130, 98], [271, 213, 151, 119]
    ];
    const EC_PARAMS = [
      [1, 10], [1, 16], [1, 26], [2, 18], [2, 24], [4, 16], [4, 18], [4, 22], [5, 22], [5, 26]
    ];

    function toUTF8Bytes(str) {
      const utf8 = [];
      for (let i = 0; i < str.length; i++) {
        let charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
        } else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
        } else {
          i++;
          charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
          utf8.push(
            0xf0 | (charcode >> 18),
            0x80 | ((charcode >> 12) & 0x3f),
            0x80 | ((charcode >> 6) & 0x3f),
            0x80 | (charcode & 0x3f)
          );
        }
      }
      return utf8;
    }

    function createMatrix(text) {
      const bytes = toUTF8Bytes(text);
      let version = 1;
      for (let v = 1; v <= 10; v++) {
        if (bytes.length <= CAPACITY[v - 1][1]) {
          version = v;
          break;
        }
      }

      const moduleCount = version * 4 + 17;
      const matrix = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(null));

      function setupFinder(row, col) {
        for (let r = -1; r <= 7; r++) {
          if (row + r < 0 || row + r >= moduleCount) continue;
          for (let c = -1; c <= 7; c++) {
            if (col + c < 0 || col + c >= moduleCount) continue;
            if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
                (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
                (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
              matrix[row + r][col + c] = true;
            } else {
              matrix[row + r][col + c] = false;
            }
          }
        }
      }

      setupFinder(0, 0);
      setupFinder(moduleCount - 7, 0);
      setupFinder(0, moduleCount - 7);

      if (version >= 2) {
        const alignPos = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]][version - 1];
        for (let i = 0; i < alignPos.length; i++) {
          for (let j = 0; j < alignPos.length; j++) {
            const r = alignPos[i];
            const c = alignPos[j];
            if (matrix[r][c] !== null) continue;
            for (let dr = -2; dr <= 2; dr++) {
              for (let dc = -2; dc <= 2; dc++) {
                if (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)) {
                  matrix[r + dr][c + dc] = true;
                } else {
                  matrix[r + dr][c + dc] = false;
                }
              }
            }
          }
        }
      }

      for (let r = 8; r < moduleCount - 8; r++) {
        if (matrix[r][6] === null) matrix[r][6] = (r % 2 === 0);
        if (matrix[6][r] === null) matrix[6][r] = (r % 2 === 0);
      }

      matrix[moduleCount - 8][8] = true;
      for (let i = 0; i < 8; i++) {
        if (matrix[8][i] === null) matrix[8][i] = false;
        if (matrix[i][8] === null) matrix[i][8] = false;
        if (matrix[8][moduleCount - 1 - i] === null) matrix[8][moduleCount - 1 - i] = false;
        if (matrix[moduleCount - 1 - i][8] === null) matrix[moduleCount - 1 - i][8] = false;
      }
      matrix[8][8] = false;

      const bits = [];
      function putBits(num, val) {
        for (let i = 0; i < num; i++) bits.push(((val >> (num - 1 - i)) & 1) === 1);
      }

      putBits(4, 4);
      const countBits = version < 10 ? 8 : 16;
      putBits(countBits, bytes.length);
      for (let b of bytes) putBits(8, b);

      const TOTAL_DATA_BYTES_M = [16, 28, 44, 64, 86, 108, 124, 154, 182, 216];
      const totalDataBytes = TOTAL_DATA_BYTES_M[version - 1];
      const totalDataBits = totalDataBytes * 8;
      if (bits.length + 4 <= totalDataBits) putBits(4, 0);
      while (bits.length % 8 !== 0) bits.push(false);

      const padBytes = [236, 17];
      let padIdx = 0;
      while (bits.length < totalDataBits) {
        putBits(8, padBytes[padIdx]);
        padIdx = (padIdx + 1) % 2;
      }

      const dataBytes = [];
      for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] ? 1 : 0);
        dataBytes.push(byte);
      }

      const ecCount = EC_PARAMS[version - 1][1];
      const rsPoly = getErrorCorrectionPolynomial(ecCount);
      const rawPoly = new Polynomial(dataBytes, rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);

      const ecBytes = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecBytes.length; i++) {
        const modIndex = i + modPoly.getLength() - ecBytes.length;
        ecBytes[i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }

      const finalBits = [];
      for (let b of dataBytes) {
        for (let i = 7; i >= 0; i--) finalBits.push(((b >> i) & 1) === 1);
      }
      for (let b of ecBytes) {
        for (let i = 7; i >= 0; i--) finalBits.push(((b >> i) & 1) === 1);
      }

      let bitIdx = 0;
      let dir = -1;
      let row = moduleCount - 1;
      let col = moduleCount - 1;

      while (col > 0) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (matrix[row][col - c] === null) {
              let dark = false;
              if (bitIdx < finalBits.length) dark = finalBits[bitIdx++];
              if ((row + (col - c)) % 2 === 0) dark = !dark;
              matrix[row][col - c] = dark;
            }
          }
          row += dir;
          if (row < 0 || moduleCount <= row) {
            row -= dir;
            dir = -dir;
            break;
          }
        }
        col -= 2;
      }

      const formatBits = [true, false, true, false, true, false, false, false, false, false, true, false, false, true, false];
      for (let i = 0; i < 15; i++) {
        const bit = formatBits[i];
        if (i < 6) matrix[8][i] = bit;
        else if (i === 6) matrix[8][7] = bit;
        else if (i === 7) { matrix[8][8] = bit; matrix[8][moduleCount - 8] = bit; }
        else matrix[8][moduleCount - 15 + i] = bit;

        if (i < 7) matrix[moduleCount - 1 - i][8] = bit;
        else if (i === 8) matrix[7][8] = bit;
        else if (i > 8) matrix[14 - i][8] = bit;
      }

      return matrix;
    }

    return {
      drawCanvas: function (canvas, text, opts = {}) {
        const matrix = createMatrix(text);
        const moduleCount = matrix.length;
        const margin = opts.margin || 2;
        const targetWidth = opts.width || 200;
        const size = moduleCount + margin * 2;
        const cellSize = Math.max(1, Math.floor(targetWidth / size));
        const actualSize = size * cellSize;

        canvas.width = actualSize;
        canvas.height = actualSize;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = opts.color?.light || '#ffffff';
        ctx.fillRect(0, 0, actualSize, actualSize);

        ctx.fillStyle = opts.color?.dark || '#000000';
        for (let r = 0; r < moduleCount; r++) {
          for (let c = 0; c < moduleCount; c++) {
            if (matrix[r][c]) {
              ctx.fillRect((c + margin) * cellSize, (r + margin) * cellSize, cellSize, cellSize);
            }
          }
        }
      }
    };
  })();

  // Helper to safely obtain QRCode library instance
  function getQRCodeLib() {
    if (typeof QRCode !== 'undefined') return QRCode;
    if (typeof window !== 'undefined' && window.QRCode) return window.QRCode;
    if (typeof self !== 'undefined' && self.QRCode) return self.QRCode;
    return null;
  }

  // Helper Utilities for Image and Clipboard Actions
  function dataURLToBlob(dataURL) {
    try {
      const parts = dataURL.split(';base64,');
      const contentType = (parts[0].match(/:(.*?);/) || [])[1] || 'image/png';
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    } catch (e) {
      return null;
    }
  }

  function generateQRDataURL(text) {
    if (!text) return null;
    try {
      const tempCanvas = document.createElement('canvas');
      QRCodeEngine.drawCanvas(tempCanvas, text, {
        width: 240,
        margin: 4,
        color: { dark: '#000000', light: '#ffffff' }
      });
      return tempCanvas.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }

  function downloadQRImage(dataUrlOrCanvas, filename) {
    let url = dataUrlOrCanvas;
    if (dataUrlOrCanvas instanceof HTMLCanvasElement) {
      url = dataUrlOrCanvas.toDataURL('image/png');
    }
    if (!url) {
      showToast('获取图片数据失败');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `qrcode_${Date.now()}.png`;
    a.click();
    showToast('二维码已开始下载！');
  }

  async function copyQRImageToClipboard(dataUrlOrCanvas) {
    let blob = null;
    if (dataUrlOrCanvas instanceof HTMLCanvasElement) {
      blob = await new Promise(resolve => dataUrlOrCanvas.toBlob(resolve, 'image/png'));
    } else if (typeof dataUrlOrCanvas === 'string') {
      blob = dataURLToBlob(dataUrlOrCanvas);
    }
    if (!blob) {
      showToast('生成图片数据失败');
      return;
    }
    try {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      showToast('二维码图片已成功复制到剪贴板！');
    } catch (err) {
      console.error('Copy image error:', err);
      showToast('复制图片受浏览器限制');
    }
  }

  // QR Code Generation Logic
  let historyDebounceTimer = null;

  async function triggerQRGeneration(isImmediate = false) {
    const text = genInput.value.trim();
    const ctx = genCanvas.getContext('2d');
    if (!text) {
      ctx.clearRect(0, 0, genCanvas.width, genCanvas.height);
      return;
    }

    const isDark = wrapper.classList.contains('zimo-theme-dark');
    const qrLib = getQRCodeLib();

    try {
      if (qrLib && qrLib.toCanvas) {
        await new Promise((resolve, reject) => {
          qrLib.toCanvas(genCanvas, text, {
            width: 180,
            margin: 4,
            color: {
              dark: isDark ? '#000000' : '#3d405b',
              light: '#ffffff'
            }
          }, (err) => err ? reject(err) : resolve());
        });
      } else {
        QRCodeEngine.drawCanvas(genCanvas, text, {
          width: 180,
          margin: 4,
          color: {
            dark: isDark ? '#000000' : '#3d405b',
            light: '#ffffff'
          }
        });
      }
      saveGenHistory(text, isImmediate);
    } catch (err) {
      try {
        QRCodeEngine.drawCanvas(genCanvas, text, {
          width: 180,
          margin: 4,
          color: {
            dark: isDark ? '#000000' : '#3d405b',
            light: '#ffffff'
          }
        });
        saveGenHistory(text, isImmediate);
      } catch (fallbackErr) {
        console.error('QR Engine error:', fallbackErr);
        showToast('生成二维码失败');
      }
    }
  }

  function saveGenHistory(text, isImmediate = false) {
    clearTimeout(historyDebounceTimer);
    const doSave = () => {
      try {
        const dataUrl = genCanvas.toDataURL('image/png');
        addHistory('gen', text, dataUrl);
      } catch (e) {
        addHistory('gen', text, null);
      }
    };
    if (isImmediate) {
      doSave();
    } else {
      historyDebounceTimer = setTimeout(doSave, 2000);
    }
  }

  genInput.addEventListener('input', () => triggerQRGeneration(false));

  btnGenCurrUrl.addEventListener('click', () => {
    genInput.value = window.location.href;
    triggerQRGeneration(true);
    showToast('已填入当前页面 URL');
  });

  btnGenSelection.addEventListener('click', () => {
    const sel = window.getSelection().toString().trim();
    if (sel) {
      genInput.value = sel;
      triggerQRGeneration(true);
      showToast('已填入网页选中文本');
    } else {
      showToast('当前未选中文本');
    }
  });

  btnDlQr.addEventListener('click', () => {
    const text = genInput.value.trim();
    if (!text) {
      showToast('请先输入文本或 URL');
      return;
    }
    downloadQRImage(genCanvas, `qrcode_${Date.now()}.png`);
  });

  btnCopyQrImg.addEventListener('click', () => {
    const text = genInput.value.trim();
    if (!text) {
      showToast('请先输入文本或 URL');
      return;
    }
    copyQRImageToClipboard(genCanvas);
  });

  btnCopyGenText.addEventListener('click', () => {
    const text = genInput.value.trim();
    if (text) {
      GM_setClipboard(text);
      showToast('文本已成功复制！');
    }
  });

  // History Manager
  function addHistory(type, text, imageData = null) {
    if (!text) return;
    const timeStr = new Date().toLocaleTimeString();

    // Deduplicate existing identical text entry
    const existingIndex = historyData.findIndex(item => item.type === type && item.text === text);
    if (existingIndex !== -1) {
      historyData.splice(existingIndex, 1);
    }

    historyData.unshift({ type, text, time: timeStr, imageData });
    if (historyData.length > 20) historyData.pop();
    GM_setValue('zimo_qr_history', historyData);
  }

  function renderHistory() {
    historyListEl.innerHTML = '';
    if (historyData.length === 0) {
      historyListEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">暂无历史记录</div>';
      return;
    }

    historyData.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'zimo-history-item';

      const typeTag = item.type === 'scan' ? '🔍 识别' : '⚡ 生成';
      const isUrl = /^https?:\/\/[^\s]+$/i.test(item.text.trim());
      const hasImage = item.type === 'gen' || !!item.imageData;

      let qrImgSrc = item.imageData;
      if (!qrImgSrc && item.type === 'gen') {
        qrImgSrc = generateQRDataURL(item.text);
      }

      const escapedText = item.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      if (hasImage && qrImgSrc) {
        el.innerHTML = `
          <div class="zimo-history-meta">
            <span>${typeTag}</span>
            <span>${item.time}</span>
          </div>
          <div class="zimo-history-content">
            <img class="zimo-history-qr-img" src="${qrImgSrc}" alt="二维码" id="hist-img-${index}" title="点击复制二维码" />
            <div class="zimo-history-details">
              <div class="zimo-history-text">${escapedText}</div>
              <div class="zimo-history-actions">
                <button class="zimo-btn zimo-btn-action" style="padding:2px 6px; font-size:10px;" id="hist-dl-img-${index}">下载图片</button>
                <button class="zimo-btn zimo-btn-secondary" style="padding:2px 6px; font-size:10px;" id="hist-copy-img-${index}">复制图片</button>
                <button class="zimo-btn" style="padding:2px 6px; font-size:10px;" id="hist-copy-text-${index}">复制文本</button>
                ${isUrl ? `<button class="zimo-btn" style="padding:2px 6px; font-size:10px; background:var(--btn-warning); color:#2d3436;" id="hist-open-${index}">打开</button>` : ''}
              </div>
            </div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="zimo-history-meta">
            <span>${typeTag}</span>
            <span>${item.time}</span>
          </div>
          <div class="zimo-history-text">${escapedText}</div>
          <div class="zimo-history-actions">
            <button class="zimo-btn" style="padding:2px 6px; font-size:10px;" id="hist-copy-text-${index}">复制文本</button>
            ${isUrl ? `<button class="zimo-btn zimo-btn-secondary" style="padding:2px 6px; font-size:10px;" id="hist-open-${index}">打开</button>` : ''}
          </div>
        `;
      }

      historyListEl.appendChild(el);

      if (hasImage && qrImgSrc) {
        shadow.getElementById(`hist-dl-img-${index}`).addEventListener('click', () => {
          downloadQRImage(qrImgSrc, `qrcode_history_${Date.now()}.png`);
        });

        shadow.getElementById(`hist-copy-img-${index}`).addEventListener('click', () => {
          copyQRImageToClipboard(qrImgSrc);
        });

        shadow.getElementById(`hist-img-${index}`).addEventListener('click', () => {
          copyQRImageToClipboard(qrImgSrc);
        });
      }

      shadow.getElementById(`hist-copy-text-${index}`).addEventListener('click', () => {
        GM_setClipboard(item.text);
        showToast('文本已成功复制！');
      });

      if (isUrl) {
        shadow.getElementById(`hist-open-${index}`).addEventListener('click', () => {
          window.open(item.text.trim(), '_blank');
        });
      }
    });
  }

  btnClearHistory.addEventListener('click', () => {
    historyData.length = 0;
    GM_setValue('zimo_qr_history', historyData);
    renderHistory();
    showToast('历史记录已清空');
  });

  // Tampermonkey Menu Commands Registration
  GM_registerMenuCommand('打开/隐藏 二维码工具箱', () => toggleWindow());
  GM_registerMenuCommand('识别网页选中内容生成二维码', () => {
    const sel = window.getSelection().toString().trim();
    toggleWindow(true);
    // Switch to gen tab
    tabItems[1].click();
    if (sel) {
      genInput.value = sel;
      triggerQRGeneration();
    }
  });

  // Right-click context listener on images for quick scan
  let lastRightClickedImgSrc = null;
  document.addEventListener('contextmenu', (e) => {
    const img = e.target.closest('img');
    if (img && img.src) {
      lastRightClickedImgSrc = img.src;
    }
  }, true);

  GM_registerMenuCommand('识别刚刚右键点击的网页图片', () => {
    if (lastRightClickedImgSrc) {
      toggleWindow(true);
      tabItems[0].click();
      handleImageUrl(lastRightClickedImgSrc);
    } else {
      showToast('未捕捉到右键点击的图片');
    }
  });

})();
