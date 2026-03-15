/**
 * Agentic Billing Support — Chat Widget
 * Embeds the AI triage agent directly in the invoice portal.
 */

(function () {
  const API_URL = '/api/chat';
  const sessionId = 'session-' + Date.now();

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .chat-fab {
      position: fixed; bottom: 24px; right: 24px;
      width: 56px; height: 56px; border-radius: 50%;
      background: #3b6cee; color: #fff; border: none;
      font-size: 24px; cursor: pointer; z-index: 1000;
      box-shadow: 0 4px 12px rgba(59,108,238,0.4);
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(59,108,238,0.5); }
    .chat-fab.open { display: none; }

    .chat-panel {
      position: fixed; bottom: 24px; right: 24px;
      width: 400px; height: 520px;
      background: #fff; border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.18);
      z-index: 1001; display: none; flex-direction: column;
      overflow: hidden;
    }
    .chat-panel.open { display: flex; }

    .chat-header {
      background: #1e293b; color: #fff;
      padding: 14px 18px; display: flex;
      justify-content: space-between; align-items: center;
    }
    .chat-header-title { font-weight: 600; font-size: 14px; }
    .chat-header-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .chat-close {
      background: none; border: none; color: #94a3b8;
      font-size: 20px; cursor: pointer; padding: 4px;
    }
    .chat-close:hover { color: #fff; }

    .chat-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
    }

    .chat-msg {
      max-width: 88%; padding: 10px 14px;
      border-radius: 10px; font-size: 13px; line-height: 1.55;
      word-wrap: break-word;
    }
    .chat-msg.user {
      align-self: flex-end;
      background: #3b6cee; color: #fff;
      border-bottom-right-radius: 4px;
    }
    .chat-msg.assistant {
      align-self: flex-start;
      background: #f1f5f9; color: #1e293b;
      border-bottom-left-radius: 4px;
    }
    .chat-msg.system {
      align-self: center;
      background: transparent; color: #94a3b8;
      font-size: 11px; text-align: center;
      padding: 4px;
    }
    .chat-tool-call {
      font-size: 11px; color: #64748b;
      padding: 2px 0; font-style: italic;
    }

    .chat-input-area {
      border-top: 1px solid #e5e7eb;
      padding: 12px; display: flex; gap: 8px;
    }
    .chat-input {
      flex: 1; border: 1px solid #d1d5db;
      border-radius: 8px; padding: 10px 14px;
      font-size: 13px; outline: none;
      font-family: inherit;
    }
    .chat-input:focus { border-color: #3b6cee; }
    .chat-send {
      background: #3b6cee; color: #fff; border: none;
      border-radius: 8px; padding: 10px 16px;
      font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .chat-send:hover { background: #2b5cd9; }
    .chat-send:disabled { background: #94a3b8; cursor: not-allowed; }

    .chat-typing {
      align-self: flex-start;
      color: #94a3b8; font-size: 12px;
      padding: 6px 14px;
    }
    .chat-typing::after {
      content: '...';
      animation: dots 1.2s steps(3, end) infinite;
    }
    @keyframes dots { 0% { content: ''; } 33% { content: '.'; } 66% { content: '..'; } 100% { content: '...'; } }

    .chat-suggestions {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding: 0 16px 12px;
    }
    .chat-suggestion {
      background: #f1f5f9; border: 1px solid #e2e8f0;
      border-radius: 16px; padding: 6px 12px;
      font-size: 12px; color: #475569; cursor: pointer;
      transition: all 0.15s;
    }
    .chat-suggestion:hover { background: #e0e7ff; border-color: #c7d2fe; color: #3b6cee; }
  `;
  document.head.appendChild(style);

  // Get page context
  function getPageContext() {
    const path = window.location.pathname;
    if (path.includes('invoice-detail')) {
      const title = document.querySelector('.card-title')?.textContent || '';
      const invoiceId = title.replace('Invoice ', '');
      return {
        page: `invoice detail page for ${invoiceId}`,
        details: `Account: ACCT-001 (Acme Widgets). Core plan. The invoice has a Third-Party Transaction Fee (processing fee) line item from Stripe.`,
      };
    }
    return {
      page: 'the invoices list page',
      details: 'Account: ACCT-001 (Acme Widgets). Core plan. Recent invoices show processing fee line items.',
    };
  }

  // Build DOM
  const fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.innerHTML = '💬';
  fab.title = 'Need help with your bill?';

  const panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <div>
        <div class="chat-header-title">Billing Support</div>
        <div class="chat-header-sub">AI-powered · Ask about invoices, charges, or your plan</div>
      </div>
      <button class="chat-close">×</button>
    </div>
    <div class="chat-messages" id="chatMessages">
      <div class="chat-msg assistant">Hi! I can help you understand your invoices, explain charges, check your GMV status, or explore plan options. What would you like to know?</div>
    </div>
    <div class="chat-suggestions" id="chatSuggestions">
      <div class="chat-suggestion" data-msg="What is the processing fee on my latest invoice?">What's this processing fee?</div>
      <div class="chat-suggestion" data-msg="How can I reduce my transaction fees?">Reduce my fees</div>
      <div class="chat-suggestion" data-msg="Show me my store's GMV status">GMV status</div>
      <div class="chat-suggestion" data-msg="What support options do I have?">Support options</div>
    </div>
    <div class="chat-input-area">
      <input class="chat-input" id="chatInput" placeholder="Ask about your bill..." autocomplete="off">
      <button class="chat-send" id="chatSend">Send</button>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const messages = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const suggestions = document.getElementById('chatSuggestions');

  // Toggle
  fab.addEventListener('click', () => {
    fab.classList.add('open');
    panel.classList.add('open');
    input.focus();
  });

  panel.querySelector('.chat-close').addEventListener('click', () => {
    panel.classList.remove('open');
    fab.classList.remove('open');
  });

  // Suggestion clicks
  suggestions.addEventListener('click', (e) => {
    const btn = e.target.closest('.chat-suggestion');
    if (btn) {
      input.value = btn.dataset.msg;
      send();
      suggestions.style.display = 'none';
    }
  });

  // Send
  async function send() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    sendBtn.disabled = true;

    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.textContent = text;
    messages.appendChild(userMsg);

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.textContent = 'Looking up your account';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
          context: getPageContext(),
        }),
      });

      const data = await res.json();
      typing.remove();

      // Show tool calls (dimmed)
      if (data.toolCalls && data.toolCalls.length > 0) {
        for (const tc of data.toolCalls) {
          const toolEl = document.createElement('div');
          toolEl.className = 'chat-tool-call';
          toolEl.textContent = `↳ ${tc.name}`;
          messages.appendChild(toolEl);
        }
      }

      // Assistant response
      const assistantMsg = document.createElement('div');
      assistantMsg.className = 'chat-msg assistant';
      assistantMsg.textContent = data.response || data.error || 'No response received.';
      messages.appendChild(assistantMsg);
    } catch (err) {
      typing.remove();
      const errMsg = document.createElement('div');
      errMsg.className = 'chat-msg system';
      errMsg.textContent = 'Connection error. Make sure the server is running (npm run serve).';
      messages.appendChild(errMsg);
    }

    sendBtn.disabled = false;
    messages.scrollTop = messages.scrollHeight;
    input.focus();
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
})();
