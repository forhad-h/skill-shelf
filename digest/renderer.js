/* ════════════════════════════════════════════════════════════
 * HRP · Harness Report Protocol · v1 renderer
 * Vanilla JS, zero deps. Reads `<script type="application/json" id="hrp-data">`,
 * validates, hydrates the template, wires interactions.
 *
 * Public surface:
 *   window.HRP = { render, escapeHtml, validate, formatTime, formatDuration }
 * ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else node.setAttribute(k, v);
      }
    }
    const flat = [];
    for (const c of children) flat.push(...(Array.isArray(c) ? c.flat(Infinity) : [c]));
    for (const c of flat) {
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  function clamp(s, n) {
    if (!s) return s;
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) { return iso; }
  }

  function formatDuration(ms) {
    if (ms === null || ms === undefined) return '';
    if (ms < 1000) return ms + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    const m = Math.floor(ms / 60000);
    const s = Math.round((ms % 60000) / 1000);
    return m + 'm ' + s + 's';
  }

  // ──────────────────────────────────────────────────────────
  // Validator
  // ──────────────────────────────────────────────────────────

  const VALID_STATUS    = ['success', 'partial', 'failed', 'noop'];
  const VALID_ACTIONS   = ['created', 'modified', 'deleted', 'renamed'];
  const VALID_SEVERITY  = ['error', 'warn', 'info'];
  const VALID_SOURCES   = ['command', 'file', 'tool', 'other'];
  const VALID_INPUT_KINDS = ['transcript', 'file', 'pasted'];

  const SOFT_CAP_TOTAL     = 10;
  const WARN_CAP_TOTAL     = 25;
  const HARD_CAP_TOTAL     = 50;
  const SOFT_CAP_FILES     = 20;
  const SOFT_CAP_DECISIONS = 10;
  const SOFT_CAP_COMMANDS  = 20;

  // Single source of truth for tag styling. Each value maps to a CSS kind
  // (drives `.label-X` and `.status[data-kind="X"]` rules) and a display word.
  const TAG_MAPS = {
    status: {
      success: { kind: 'success', text: 'success' },
      partial: { kind: 'warn',    text: 'partial' },
      failed:  { kind: 'failed',  text: 'failed'  },
      noop:    { kind: 'noop',    text: 'no-op'   },
    },
    action: {
      created:  { kind: 'success', text: 'created'  },
      modified: { kind: 'info',    text: 'modified' },
      deleted:  { kind: 'failed',  text: 'deleted'  },
      renamed:  { kind: 'noop',    text: 'renamed'  },
    },
    severity: {
      error: { kind: 'failed', text: 'error' },
      warn:  { kind: 'warn',   text: 'warn'  },
      info:  { kind: 'info',   text: 'info'  },
    },
  };

  function validate(envelope) {
    const issues = [];
    if (!envelope || typeof envelope !== 'object') {
      return { ok: false, issues: ['envelope must be an object'] };
    }
    if (envelope.hrp !== '1.0') issues.push('hrp must be "1.0"');
    if (!envelope.report || typeof envelope.report !== 'object') {
      issues.push('report object is required');
      return { ok: false, issues };
    }
    const r = envelope.report;
    if (!r.title)            issues.push('report.title required');
    if (!r.timestamp)        issues.push('report.timestamp required');
    if (!r.project)          issues.push('report.project required');
    if (!r.status)           issues.push('report.status required');
    else if (VALID_STATUS.indexOf(r.status) === -1)
      issues.push('report.status must be one of ' + VALID_STATUS.join('|'));
    if (!r.sections || typeof r.sections !== 'object') {
      issues.push('report.sections required');
      return { ok: false, issues };
    }
    const req = ['overview', 'files', 'decisions', 'errors', 'commands'];
    for (const k of req) {
      if (!(k in r.sections)) issues.push('sections.' + k + ' missing');
    }
    (r.sections.files || []).forEach((f, i) => {
      if (!f.path) issues.push('files[' + i + '].path missing');
      if (VALID_ACTIONS.indexOf(f.action) === -1) issues.push('files[' + i + '].action invalid');
    });
    (r.sections.errors || []).forEach((e, i) => {
      if (!e.title) issues.push('errors[' + i + '].title missing');
      if (VALID_SEVERITY.indexOf(e.severity) === -1) issues.push('errors[' + i + '].severity invalid');
    });
    (r.sections.commands || []).forEach((c, i) => {
      if (!c.command) issues.push('commands[' + i + '].command missing');
      if (typeof c.exit_code !== 'number') issues.push('commands[' + i + '].exit_code must be number');
    });
    // report.sources[] — optional; if present, validate each item.
    if (Array.isArray(r.sources)) {
      r.sources.forEach((s, i) => {
        if (!s || typeof s !== 'object') {
          issues.push('sources[' + i + '] must be an object');
          return;
        }
        if (VALID_INPUT_KINDS.indexOf(s.kind) === -1) {
          issues.push('sources[' + i + '].kind must be one of ' + VALID_INPUT_KINDS.join('|'));
        }
        if (!s.ref || typeof s.ref !== 'string') {
          issues.push('sources[' + i + '].ref required');
        }
      });
    }
    return { ok: issues.length === 0, issues };
  }

  // ──────────────────────────────────────────────────────────
  // Tag builder — one helper for status/action/severity tags.
  // Status lives in title-block (`.status[data-kind]`); action/severity
  // live inside rows (`.label-X`).
  // ──────────────────────────────────────────────────────────

  function tag(kind, value) {
    const map = TAG_MAPS[kind];
    const def = map[value] || { kind: 'noop', text: String(value || '—') };
    const cls = kind === 'status' ? 'status' : 'label';
    const node = el('span', { class: cls });
    node.dataset.kind = def.kind;
    node.textContent = def.text;
    return node;
  }

  // ──────────────────────────────────────────────────────────
  // Header / metadata
  // ──────────────────────────────────────────────────────────

  function metaCell(k, v) {
    if (v === null || v === undefined || v === '') return null;
    return el('span', { class: 'cell' },
      el('span', { class: 'k' }, k),
      el('span', { class: 'v' }, v)
    );
  }

  function hydrateHeader(r) {
    const titleEl = document.getElementById('report-title');
    if (titleEl) titleEl.textContent = r.title || 'Harness Report';
    const subEl = document.getElementById('report-subtitle');
    if (subEl) {
      if (r.subtitle) { subEl.textContent = r.subtitle; subEl.style.display = ''; }
      else subEl.style.display = 'none';
    }

    const statusEl = document.getElementById('report-status');
    if (statusEl) {
      const def = (TAG_MAPS.status[r.status]) || TAG_MAPS.status.noop;
      statusEl.className = 'status';
      statusEl.dataset.kind = def.kind;
      statusEl.textContent = def.text;
    }

    const metaEl = document.getElementById('report-meta');
    if (metaEl) {
      metaEl.innerHTML = '';
      const wall = r.wall_time_seconds != null ? r.wall_time_seconds + 's' : null;
      const cost = r.cost_usd != null ? '$' + Number(r.cost_usd).toFixed(2) : null;
      const tok  = r.tokens && r.tokens.total != null
        ? (r.tokens.total + ' tok (' + (r.tokens.in || 0) + ' in / ' + (r.tokens.out || 0) + ' out)')
        : null;
      [
        metaCell('date',    r.timestamp ? formatTime(r.timestamp) : null),
        metaCell('project', r.project),
        metaCell('branch',  r.branch),
        metaCell('model',   r.model),
        metaCell('wall',    wall),
        metaCell('tokens',  tok),
        metaCell('cost',    cost),
      ].forEach(c => { if (c) metaEl.appendChild(c); });
    }
  }

  // ──────────────────────────────────────────────────────────
  // Stats (inline definition list)
  // ──────────────────────────────────────────────────────────

  function paintStats(stats) {
    const target = document.getElementById('overview-stats');
    if (!target) return;
    target.innerHTML = '';
    if (!stats || !stats.length) { target.style.display = 'none'; return; }
    target.style.display = '';
    stats.forEach(s => {
      target.appendChild(
        el('div', { class: 'stat' },
          el('dt', { class: 'k' }, s.label || ''),
          el('dd', { class: 'v' }, s.value || '')
        )
      );
    });
  }

  // Render the optional sources[] list inside the Overview card. Each entry
  // becomes a small pill. file entries link to the parent directory; transcript
  // and pasted entries are static. The container starts hidden in the template
  // and only becomes visible when at least one source is present.
  function paintSources(sources) {
    const target = document.getElementById('overview-sources');
    if (!target) return;
    target.innerHTML = '';
    if (!sources || !sources.length) { target.style.display = 'none'; return; }
    target.style.display = '';

    const list = el('div', { class: 'sources-list' });

    sources.forEach(s => {
      const kind = s.kind || 'pasted';
      const ref = s.ref || '';
      const label = s.label || (kind === 'file' ? truncatePath(ref) : (kind === 'transcript' ? 'last turn' : 'pasted prose'));
      const bytes = (typeof s.bytes === 'number' && s.bytes >= 0) ? formatBytes(s.bytes) : null;
      const pill = el('span', { class: 'source-pill', dataset: { kind } });

      // Kind micro-text — keeps the pill scannable without dominating it.
      pill.appendChild(el('span', { class: 'source-kind' }, kind));

      // Label/ref — for file kind with an absolute path, link to the parent dir
      // so the user can pop it open in their OS file manager. Empty or invalid
      // hrefs gracefully degrade to a static span.
      if (kind === 'file' && ref && (ref.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(ref))) {
        const parentDir = parentDirOf(ref);
        if (parentDir) {
          const link = el('a', {
            class: 'source-ref',
            href: 'file://' + parentDir,
            title: 'Open parent directory: ' + parentDir,
          }, label);
          pill.appendChild(link);
        } else {
          pill.appendChild(el('span', { class: 'source-ref' }, label));
        }
      } else {
        pill.appendChild(el('span', { class: 'source-ref', title: ref }, label));
      }

      if (bytes) pill.appendChild(el('span', { class: 'source-bytes' }, bytes));
      list.appendChild(pill);
    });

    target.appendChild(list);
  }

  // Truncate a long absolute path for use as the visible pill label. Keeps the
  // last two segments and prepends an ellipsis. e.g. /a/b/c/d.md → …/c/d.md
  function truncatePath(p) {
    if (!p) return '';
    const m = p.match(/^(.*[\\/])([^\\/]+[\\/][^\\/]+)$/);
    return m ? '…/' + m[2] : p;
  }

  function parentDirOf(p) {
    if (!p) return '';
    const idx = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
    return idx > 0 ? p.slice(0, idx) : '';
  }

  function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function paintEmpty(mountId, message) {
    const target = document.getElementById(mountId);
    if (!target) return;
    target.innerHTML = '';
    target.appendChild(el('div', { class: 'empty' }, message));
  }

  // ──────────────────────────────────────────────────────────
  // Density helpers
  // ──────────────────────────────────────────────────────────

  function groupFilesByDirectory(files) {
    const groups = new Map();
    files.forEach(f => {
      const p = f.path || '';
      const slash = p.lastIndexOf('/');
      const dir = slash === -1 ? '(root)' : p.slice(0, slash + 1);
      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir).push(f);
    });
    return Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  }

  function densityBanner(count, softCap, hardCap, kind) {
    if (count <= softCap) return null;
    const overHard = count > hardCap;
    const note = overHard
      ? count + ' ' + kind + ' — long list. Consider grouping related items into one bullet.'
      : count + ' ' + kind + ' — fine density. Showing all.';
    return el('div', { class: 'density-note' },
      el('span', { class: 'marker' + (overHard ? ' warn' : '') }, overHard ? 'DENSE' : 'DENSITY'),
      el('span', null, note)
    );
  }

  // ──────────────────────────────────────────────────────────
  // Row builders (flat)
  // ──────────────────────────────────────────────────────────

  function fileRow(f) {
    const head = el('div', { class: 'item-head' }, tag('action', f.action));

    if (f.lines_added != null || f.lines_removed != null) {
      const a = f.lines_added || 0, b = f.lines_removed || 0;
      const meta = el('span', { class: 'meta' },
        el('span', { class: 'plus' },  '+' + a),
        document.createTextNode(' / '),
        el('span', { class: 'minus' }, '−' + b)
      );
      head.appendChild(el('span', { class: 'path mono' }, f.path || ''));
      head.appendChild(meta);
    } else {
      head.appendChild(el('span', { class: 'path mono' }, f.path || ''));
    }

    return el('div', { class: 'item file-row' },
      head,
      f.summary ? el('p', { class: 'item-detail' }, f.summary) : null
    );
  }

  function groupRow(dir, filesInDir) {
    const actionCounts = {};
    filesInDir.forEach(f => { actionCounts[f.action] = (actionCounts[f.action] || 0) + 1; });
    const summary = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([a, n]) => n + ' ' + a)
      .join(', ');

    const inner = el('div', { class: 'group-inner' });
    filesInDir.forEach(f => inner.appendChild(fileRow(f)));

    return el('details', { class: 'group-bullet' },
      el('summary', null,
        el('div', { class: 'group-summary' },
          el('span', { class: 'count' }, filesInDir.length + ' files'),
          el('span', { class: 'dir' }, dir),
          el('span', { class: 'breakdown' }, summary),
          el('span', { class: 'chev' })
        )
      ),
      inner
    );
  }

  function decisionRow(d) {
    const tradeoffsList = (d.tradeoffs && d.tradeoffs.length)
      ? el('ul', { class: 'tradeoffs' },
          d.tradeoffs.map(t => {
            const s = (t || '').trim();
            const pro = s.startsWith('+');
            const con = s.startsWith('−') || s.startsWith('-');
            const cleaned = s.replace(/^[+\-−]\s*/, '');
            const mark = pro ? '+' : con ? '−' : '·';
            const cls = pro ? 'pro' : con ? 'con' : '';
            return el('li', { class: cls, dataset: { mark } }, cleaned);
          })
        )
      : null;

    return el('div', { class: 'item decision-row' },
      el('div', { class: 'item-head' },
        el('span', { class: 'label', dataset: { kind: 'noop' } }, d.reversible === false ? 'locked' : 'choice'),
        el('h3', { class: 'item-title' }, d.title || '')
      ),
      d.detail ? el('p', { class: 'item-detail' }, d.detail) : null,
      tradeoffsList
    );
  }

  function errorRow(e) {
    const excerpt = e.output_excerpt ? clamp(e.output_excerpt, 1000) : '';
    const sev = e.severity || 'error';
    const extra = sev === 'warn' ? ' warn' : sev === 'info' ? ' info' : '';
    const rowClass = 'item error-row' + extra;

    return el('div', { class: rowClass },
      el('div', { class: 'item-head' },
        tag('severity', sev),
        el('h3', { class: 'item-title' }, e.title || ''),
        e.source ? el('span', { class: 'label', dataset: { kind: 'noop' } }, e.source) : null
      ),
      e.detail ? el('p', { class: 'item-detail' }, e.detail) : null,
      excerpt ? el('div', { class: 'payload' }, excerpt) : null
    );
  }

  function commandRow(c) {
    const exitCls = c.exit_code === 0 ? 'ok' : 'bad';
    const exitLabel = c.exit_code === 0 ? '0' : String(c.exit_code);

    return el('div', { class: 'item command-row' },
      el('div', { class: 'cmd-line' },
        el('span', { class: 'exit ' + exitCls }, exitLabel),
        el('code', { class: 'cmd-text' }, c.command || ''),
        c.duration_ms != null ? el('span', { class: 'duration' }, formatDuration(c.duration_ms)) : null
      ),
      c.note ? el('p', { class: 'note' }, c.note) : null,
      c.output_excerpt ? el('div', { class: 'payload' }, clamp(c.output_excerpt, 1000)) : null
    );
  }

  // ──────────────────────────────────────────────────────────
  // Section hydration
  // ──────────────────────────────────────────────────────────

  function hydrateSections(r) {
    const s = r.sections || {};

    const ovwTarget = document.getElementById('overview-body');
    if (ovwTarget) {
      ovwTarget.innerHTML = '';
      if (s.overview && s.overview.summary) {
        ovwTarget.appendChild(el('p', { class: 'item-detail' }, s.overview.summary));
      } else {
        ovwTarget.appendChild(el('p', { class: 'item-detail', style: 'color: var(--text-faint); font-style: italic;' }, 'No overview provided.'));
      }
    }
    paintSources(r.sources);
    paintStats(s.overview ? s.overview.stats : []);

    const files = s.files || [];
    const filesMount = document.getElementById('files-body');
    if (filesMount) {
      filesMount.innerHTML = '';
      if (files.length) {
        const banner = densityBanner(files.length, SOFT_CAP_FILES, HARD_CAP_TOTAL, 'files');
        if (banner) filesMount.appendChild(banner);
        if (files.length > SOFT_CAP_FILES) {
          groupFilesByDirectory(files).forEach(([dir, items]) => filesMount.appendChild(groupRow(dir, items)));
        } else {
          files.forEach(f => filesMount.appendChild(fileRow(f)));
        }
      } else {
        paintEmpty('files-body', 'No files modified this turn.');
      }
    }

    const decisions = s.decisions || [];
    const decMount = document.getElementById('decisions-body');
    if (decMount) {
      decMount.innerHTML = '';
      if (decisions.length) {
        const banner = densityBanner(decisions.length, SOFT_CAP_DECISIONS, SOFT_CAP_DECISIONS * 2, 'decisions');
        if (banner) decMount.appendChild(banner);
        decisions.forEach(d => decMount.appendChild(decisionRow(d)));
      } else {
        paintEmpty('decisions-body', 'No decisions surfaced this turn.');
      }
    }

    const errors = s.errors || [];
    const errMount = document.getElementById('errors-body');
    if (errMount) {
      errMount.innerHTML = '';
      if (errors.length) errors.forEach(e => errMount.appendChild(errorRow(e)));
      else paintEmpty('errors-body', 'Clean run — no errors or unresolved items.');
    }

    const commands = s.commands || [];
    const cmdMount = document.getElementById('commands-body');
    if (cmdMount) {
      cmdMount.innerHTML = '';
      if (commands.length) {
        const banner = densityBanner(commands.length, SOFT_CAP_COMMANDS, SOFT_CAP_COMMANDS * 2, 'commands');
        if (banner) cmdMount.appendChild(banner);
        commands.forEach(c => cmdMount.appendChild(commandRow(c)));
      } else {
        paintEmpty('commands-body', 'No shell commands were run this turn.');
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // Validation / fatal banners
  // ──────────────────────────────────────────────────────────

  function renderValidationBanner(issues) {
    if (!issues || !issues.length) return;
    const banner = el('div', { class: 'validation-banner' },
      el('h4', null, 'HRP validation found ' + issues.length + ' issue(s):'),
      el('ul', null, issues.map(i => el('li', null, i)))
    );
    const main = document.getElementById('main-content');
    if (main) main.insertBefore(banner, main.firstChild);
    console.warn('HRP validation issues:', issues);
  }

  function renderFatal(msg) {
    document.body.innerHTML = '';
    const banner = el('div', {
      style: 'max-width:600px; margin:4rem auto; padding:1.5rem 2rem; background:var(--error-bg); border-radius:8px; font-family:Inter,sans-serif; color:var(--text);'
    },
      el('h1', { style: 'font-size:1.125rem; font-weight:700; margin:0 0 .5rem; color:var(--error);' }, 'Could not render report'),
      el('p', { style: 'color:var(--text-dim); margin:0;' }, msg)
    );
    document.body.appendChild(banner);
    console.error('HRP render fatal:', msg);
  }

  // ──────────────────────────────────────────────────────────
  // Interactions
  // ──────────────────────────────────────────────────────────

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1600);
  }

  function wireCopyDownload(envelope, json) {
    const copyBtn = document.getElementById('btn-copy-json');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        navigator.clipboard.writeText(json).then(() => showToast('JSON copied'));
      } else {
        const ta = document.createElement('textarea');
        ta.value = json; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); showToast('JSON copied'); }
        catch (e) { showToast('Copy failed — see console'); console.log(json); }
        document.body.removeChild(ta);
      }
    });

    const dlBtn = document.getElementById('btn-download-html');
    if (dlBtn) dlBtn.addEventListener('click', () => {
      const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'harness-report.html';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded harness-report.html');
    });

    const viewBtn = document.getElementById('btn-view-json');
    if (viewBtn) viewBtn.addEventListener('click', () => {
      const w = window.open('', '_blank');
      if (w) {
        w.document.write('<!DOCTYPE html><html><head><title>HRP JSON</title></head><body style="font-family:JetBrains Mono,monospace; padding:1rem; background:#1c1917; color:#e7e5e4; white-space:pre-wrap; word-break:break-all;">' + escapeHtml(json) + '</body></html>');
        w.document.close();
      }
    });

    // Clean from Disk — wipe the report's source files. The browser can't
    // delete files directly, so we copy a ready-to-paste shell command
    // (rm -rf on Unix, Remove-Item on Windows) to the clipboard.
    const cleanBtn = document.getElementById('btn-clean-disk');
    if (cleanBtn) {
      const sourceDir  = envelope.report && envelope.report.source_dir;
      const sourceFiles = envelope.report && envelope.report.source_files;
      const hasTarget = !!(sourceDir || (sourceFiles && sourceFiles.length));

      if (!hasTarget) {
        cleanBtn.title = 'No source_dir in envelope — older report, nothing to wipe';
      } else {
        cleanBtn.disabled = false;
        cleanBtn.title = 'Wipe this report\'s files from disk';
        cleanBtn.addEventListener('click', () => {
          const cmd = buildCleanCommand(sourceDir, sourceFiles);
          const ok = copyToClipboard(cmd);
          if (ok) {
            cleanBtn.classList.add('confirmed');
            cleanBtn.textContent = 'Clean command copied';
            cleanBtn.disabled = true;
            showToast('Cleanup command copied — paste it in your terminal');
          } else {
            // Fallback: show the command in a prompt so the user can copy it.
            window.prompt('Copy and run this command to clean the report from disk:', cmd);
          }
        });
      }
    }
  }

  // Build a cross-platform command that wipes the report files. The
  // browser can't run it — the user pastes it into their terminal.
  function buildCleanCommand(sourceDir, sourceFiles) {
    const isWin = typeof navigator !== 'undefined'
      && /Win/i.test(navigator.platform || (navigator.userAgentData && navigator.userAgentData.platform) || navigator.userAgent || '');
    const quote = (s) => '"' + String(s).replace(/"/g, '\\"') + '"';

    if (sourceDir) {
      // Preferred: delete the whole temp dir.
      return isWin
        ? `Remove-Item -Recurse -Force ${quote(sourceDir)}`
        : `rm -rf ${quote(sourceDir)}`;
    }
    // Fallback: delete individual files.
    if (isWin) {
      return sourceFiles.map(f => `Remove-Item -Force ${quote(f)}`).join(' ; ');
    }
    return sourceFiles.map(f => `rm -f ${quote(f)}`).join(' && ');
  }

  // Copy to clipboard with a fallback for non-secure contexts.
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      return true;
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function wireKeyboard() {
    // Ctrl/Cmd+E toggles all grouped-file details at once.
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        const details = document.querySelectorAll('details');
        if (!details.length) return;
        const anyOpen = Array.from(details).some(d => d.open);
        details.forEach(d => { d.open = !anyOpen; });
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  // Public render function
  // ──────────────────────────────────────────────────────────

  function render(envelope) {
    if (!envelope || typeof envelope !== 'object') {
      renderFatal('Envelope is missing or malformed.');
      return;
    }
    if (!envelope.report) {
      renderFatal('Envelope.report is required.');
      return;
    }
    const v = validate(envelope);
    if (v.issues && v.issues.length) renderValidationBanner(v.issues);
    const json = JSON.stringify(envelope, null, 2);
    hydrateHeader(envelope.report);
    hydrateSections(envelope.report);
    wireCopyDownload(envelope, json);
    wireKeyboard();
    document.body.setAttribute('data-hrp-rendered', 'true');
  }

  function bootstrap() {
    const node = document.getElementById('hrp-data');
    if (!node) { renderFatal('No #hrp-data element found in document.'); return; }
    let env;
    try { env = JSON.parse(node.textContent); }
    catch (e) { renderFatal('JSON parse error: ' + e.message); return; }
    render(env);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  window.HRP = {
    render, validate, escapeHtml, formatTime, formatDuration,
    buildCleanCommand
  };
})();