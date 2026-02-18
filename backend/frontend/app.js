const API = 'https://insightforge-a53q.onrender.com/api';

// ─── Page Navigation ───────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  document.getElementById(`page-${name}`).classList.remove('hidden');
  document.getElementById(`page-${name}`).classList.add('active');

  if (name === 'history') loadHistory();
  if (name === 'status') loadStatus();
}

// ─── Generate Brief ────────────────────────────────────
async function generate() {
  const input = document.getElementById('links').value;
  const links = input.split('\n').map(l => l.trim()).filter(l => l);

  if (links.length < 5 || links.length > 10) {
    showError('Please provide 5-10 links (one per line)');
    return;
  }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Processing...';

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');

  try {
    const response = await fetch(`${API}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ links })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    document.getElementById('loading').classList.add('hidden');
    renderResult(data.brief);

  } catch (error) {
    document.getElementById('loading').classList.add('hidden');
    showError(error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '🚀 Generate Research Brief';
  }
}

// ─── Render Result ─────────────────────────────────────
function renderResult(brief) {
  const el = document.getElementById('result');

  el.innerHTML = `
    <div class="stats-bar">
      <div class="stat">
        <div class="num">${brief.stats.successful}</div>
        <div class="label">Sources Fetched</div>
      </div>
      <div class="stat">
        <div class="num">${brief.keyPoints.length}</div>
        <div class="label">Key Points</div>
      </div>
      <div class="stat">
        <div class="num">${brief.whatToVerify.length}</div>
        <div class="label">To Verify</div>
      </div>
      <div class="stat">
        <div class="num">${brief.conflicts.length}</div>
        <div class="label">Conflicts</div>
      </div>
    </div>

    <div class="section">
      <h3>📝 Summary</h3>
      <p>${brief.summary}</p>
    </div>

    <div class="section">
      <h3>💡 Key Points</h3>
      ${brief.keyPoints.map(kp => `
        <div class="key-point">
          <div class="point">${kp.point}</div>
          <div class="citation">📎 <a href="${kp.url}" target="_blank">${kp.source}</a></div>
          ${kp.snippet ? `<div class="snippet">"${kp.snippet}"</div>` : ''}
        </div>
      `).join('')}
    </div>

    ${brief.whatToVerify.length > 0 ? `
    <div class="section">
      <h3>✅ What to Verify</h3>
      ${brief.whatToVerify.map(item => `
        <div class="checklist-item">${item}</div>
      `).join('')}
    </div>` : ''}

    ${brief.conflicts.length > 0 ? `
    <div class="section">
      <h3>⚔️ Conflicting Claims</h3>
      ${brief.conflicts.map(c => `
        <div class="conflict-item">
          <div class="claim">${c.claim}</div>
          <div class="sides">🔵 ${c.sourceA}<br>🔴 ${c.sourceB}</div>
        </div>
      `).join('')}
    </div>` : ''}

    <div class="section">
      <h3>🔗 Sources</h3>
      ${brief.sourcesUsed.map(s => `
        <div class="source-item">
          <span class="source-badge used">✓ Used</span>
          <div class="source-info">
            <a href="${s.url}" target="_blank">${s.title}</a>
            <div class="source-contribution">${s.contribution}</div>
          </div>
        </div>
      `).join('')}
      ${brief.sources.filter(s => !s.used).map(s => `
        <div class="source-item">
          <span class="source-badge failed">✗ Failed</span>
          <div class="source-info">
            <a href="${s.url}" target="_blank">${s.url}</a>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  el.classList.remove('hidden');
}

// ─── History ───────────────────────────────────────────
async function loadHistory() {
  const el = document.getElementById('history-list');
  el.innerHTML = '<p style="color:#888">Loading...</p>';

  try {
    const res = await fetch(`${API}/briefs`);
    const data = await res.json();

    if (!data.briefs.length) {
      el.innerHTML = '<p style="color:#888">No briefs yet. Generate your first one!</p>';
      return;
    }

    el.innerHTML = data.briefs.map(b => `
      <div class="brief-card" onclick="openBriefModal(${JSON.stringify(b).replace(/"/g, '&quot;')})">
        <div class="date">${new Date(b.createdAt).toLocaleString()}</div>
        <div class="summary">${b.summary.substring(0, 200)}...</div>
        <div class="brief-stats">
          ${b.keyPoints.length} key points • 
          ${b.sources.filter(s => s.used).length} sources • 
          ${b.conflicts.length} conflicts
        </div>
      </div>
    `).join('');

  } catch {
    el.innerHTML = '<p style="color:#f87171">Failed to load history</p>';
  }
}

function openBriefModal(brief) {
  let overlay = document.getElementById('brief-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'brief-modal';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" onclick="document.getElementById('brief-modal').classList.remove('active')">✕</button>
      <h2 style="color:#7c3aed; margin-bottom:20px">Research Brief</h2>
      ${renderBriefHTML(brief)}
    </div>
  `;

  overlay.classList.add('active');
}

function renderBriefHTML(brief) {
  return `
    <div class="section">
      <h3>📝 Summary</h3>
      <p>${brief.summary}</p>
    </div>
    <div class="section">
      <h3>💡 Key Points</h3>
      ${brief.keyPoints.map(kp => `
        <div class="key-point">
          <div class="point">${kp.point}</div>
          <div class="citation">📎 <a href="${kp.url}" target="_blank">${kp.source}</a></div>
          ${kp.snippet ? `<div class="snippet">"${kp.snippet}"</div>` : ''}
        </div>
      `).join('')}
    </div>
    ${brief.whatToVerify?.length > 0 ? `
    <div class="section">
      <h3>✅ What to Verify</h3>
      ${brief.whatToVerify.map(item => `<div class="checklist-item">${item}</div>`).join('')}
    </div>` : ''}
  `;
}

// ─── Status ────────────────────────────────────────────
async function loadStatus() {
  const el = document.getElementById('status-content');
  el.innerHTML = '<p style="color:#888">Checking...</p>';

  try {
    const res = await fetch(`${API}/status`);
    const data = await res.json();

    const dbColor = data.database === 'connected' ? 'online' : 'offline';
    const llmColor = data.llm.status === 'configured' ? 'online' : 'warning';

    el.innerHTML = `
      <div class="status-grid">
        <div class="status-card">
          <div class="icon">🟢</div>
          <div class="name">Backend</div>
          <div class="value online">${data.status}</div>
        </div>
        <div class="status-card">
          <div class="icon">🗄️</div>
          <div class="name">Database</div>
          <div class="value ${dbColor}">${data.database}</div>
        </div>
        <div class="status-card">
          <div class="icon">🤖</div>
          <div class="name">LLM (${data.llm.provider})</div>
          <div class="value ${llmColor}">${data.llm.status}</div>
        </div>
      </div>
      <p style="color:#666; margin-top:16px; font-size:0.85em">Uptime: ${data.uptime}</p>
    `;
  } catch {
    el.innerHTML = '<p style="color:#f87171">Backend not reachable</p>';
  }
}

// ─── Error ─────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('error');
  el.innerHTML = `❌ ${msg}`;
  el.classList.remove('hidden');
}
