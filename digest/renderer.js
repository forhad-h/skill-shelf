/* ════════════════════════════════════════════════════════════
 * HRP · Harness Report Protocol · v1 renderer
 * Vanilla JS, zero deps. Reads `<script type="application/json" id="hrp-data">`,
 * validates, hydrates the template, wires interactions.
 *
 * Public surface:
 *   window.HRP = { render, escapeHtml, validate, formatTime }
 *
 * Theme: single theme ("lavender") is in effect. Other themes were removed
 * for verification; reintroduce via `[data-theme]` blocks + cycling UI when ready.
 * ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // Utilities
  // ──────────────────────────────────────────────────────────

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
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else node.setAttribute(k, v);
      }
    }
    for (const c of children.flat()) {
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
  // Validator (hand-rolled, no ajv)
  // Returns { ok: true } or { ok: false, issues: string[] }
  // ──────────────────────────────────────────────────────────

  const VALID_STATUS    = ['success', 'partial', 'failed', 'noop'];
  const VALID_ACTIONS   = ['created', 'modified', 'deleted', 'renamed'];
  const VALID_SEVERITY  = ['error', 'warn', 'info'];
  const VALID_SOURCES   = ['command', 'file', 'tool', 'other'];

  // Flexible caps — see comment block above validate() for tiered behavior.
  // Errors NEVER truncated (highest priority). Files can grow but get grouped.
  const SOFT_CAP_TOTAL     = 10;   // ≤ this: no note at all
  const WARN_CAP_TOTAL     = 25;   // 11-25: small "fine density" note
  const HARD_CAP_TOTAL     = 50;   // 26-50: warning banner; group files by directory
  // Per-section soft caps (errors is exempt — see hydrateSections)
  const SOFT_CAP_FILES     = 20;   // > this triggers directory grouping
  const SOFT_CAP_DECISIONS = 10;
  const SOFT_CAP_COMMANDS  = 20;

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
    // Bullet count — no longer a hard fail. Renderer handles density.
    // (Errors are exempt from any cap and never truncated.)
    // Per-section item validation
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
    return { ok: issues.length === 0, issues };
  }

  // ──────────────────────────────────────────────────────────
  // Status / pill helpers
  // ──────────────────────────────────────────────────────────

  function statusPill(status) {
    const map = {
      success: ['pill-success', '● SUCCESS'],
      partial: ['pill-warn',    '● PARTIAL'],
      failed:  ['pill-error',   '● FAILED'],
      noop:    ['pill-neutral', '● NO-OP'],
    };
    const [cls, label] = map[status] || ['pill-neutral', status || '—'];
    return el('span', { class: 'pill ' + cls }, label);
  }

  function severityPill(sev) {
    const map = {
      error: ['pill-error',   'ERROR'],
      warn:  ['pill-warn',    'WARN'],
      info:  ['pill-info',    'INFO'],
    };
    const [cls, label] = map[sev] || ['pill-neutral', sev || ''];
    return el('span', { class: 'pill ' + cls }, label);
  }

  function actionPill(action) {
    const map = {
      created:  ['pill-success', 'CREATED'],
      modified: ['pill-info',    'MODIFIED'],
      deleted:  ['pill-error',   'DELETED'],
      renamed:  ['pill-neutral', 'RENAMED'],
    };
    const [cls, label] = map[action] || ['pill-neutral', action || ''];
    return el('span', { class: 'pill ' + cls }, label);
  }

  function exitPill(code) {
    const cls = code === 0 ? 'pill-success' : 'pill-error';
    return el('span', { class: 'pill ' + cls }, code === 0 ? 'OK' : 'EXIT ' + code);
  }

  // ──────────────────────────────────────────────────────────
  // Hydrators
  // ──────────────────────────────────────────────────────────

  function hydrateHeader(r) {
    const titleEl = document.getElementById('report-title');
    if (titleEl) titleEl.textContent = r.title || 'Harness Report';
    const subEl = document.getElementById('report-subtitle');
    if (subEl) {
      if (r.subtitle) { subEl.textContent = r.subtitle; subEl.style.display = ''; }
      else subEl.style.display = 'none';
    }
    const stampEl = document.getElementById('report-meta-time');
    if (stampEl) stampEl.textContent = formatTime(r.timestamp);
    const projEl = document.getElementById('report-meta-project');
    if (projEl) projEl.textContent = r.project || '—';
    const branchEl = document.getElementById('report-meta-branch');
    if (branchEl) branchEl.textContent = r.branch || '(no git)';

    // Sidebar summary card
    const sumStatus = document.getElementById('sum-status');
    if (sumStatus) sumStatus.replaceWith(statusPill(r.status).cloneNode(true));
    const sumStatusCell = document.getElementById('sum-status-cell');
    if (sumStatusCell) sumStatusCell.innerHTML = '';
    if (sumStatusCell) sumStatusCell.appendChild(statusPill(r.status));

    const sumWall = document.getElementById('sum-wall');
    if (sumWall) sumWall.textContent = r.wall_time_seconds != null ? r.wall_time_seconds + 's' : '—';
    const sumModel = document.getElementById('sum-model');
    if (sumModel) sumModel.textContent = r.model ? r.model : '—';
    const sumFiles = document.getElementById('sum-files');
    if (sumFiles) sumFiles.textContent = (r.sections.files || []).length;
    const sumCost = document.getElementById('sum-cost');
    if (sumCost) sumCost.textContent = r.cost_usd != null ? '$' + r.cost_usd.toFixed(2) : '—';

    // Tokens row in summary (optional)
    const tokens = r.tokens || {};
    const tInEl = document.getElementById('sum-tok-in');
    const tOutEl = document.getElementById('sum-tok-out');
    const tTotEl = document.getElementById('sum-tok-total');
    if (tInEl && tOutEl && tTotEl) {
      if (tokens.total != null) {
        tInEl.textContent = tokens.in || 0;
        tOutEl.textContent = tokens.out || 0;
        tTotEl.textContent = tokens.total;
        document.getElementById('sum-tokens-row').style.display = '';
      } else {
        document.getElementById('sum-tokens-row').style.display = 'none';
      }
    }
  }

  function paintStatsCard(stats) {
    const target = document.getElementById('overview-stats');
    if (!target) return;
    target.innerHTML = '';
    if (!stats || !stats.length) return;
    stats.forEach(s => {
      target.appendChild(
        el('div', { class: 'card-soft p-4' },
          el('div', { class: 'font-mono text-[10px] uppercase tracking-widest text-lavender-700' }, s.label || ''),
          el('div', { class: 'text-2xl font-extrabold text-ink-900 mt-1' }, s.value || ''),
        )
      );
    });
  }

  function paintEmpty(mountId, message) {
    const target = document.getElementById(mountId);
    if (!target) return;
    target.innerHTML = '';
    target.appendChild(
      el('div', { class: 'empty-state' }, message)
    );
  }

  function paintBullets(mountId, items, builder) {
    const target = document.getElementById(mountId);
    if (!target) return;
    target.innerHTML = '';
    items.forEach(item => target.appendChild(builder(item)));
  }

  // ──────────────────────────────────────────────────────────
  // Density helpers — flexible caps + directory grouping
  // ──────────────────────────────────────────────────────────

  /**
   * Group file items by top-level directory.
   * "src/components/Foo.tsx" → group "src/components/" with 1 file in it.
   * For files at the root ("README.md") → group "(root)".
   */
  function groupFilesByDirectory(files) {
    const groups = new Map();
    files.forEach(f => {
      const p = f.path || '';
      const slash = p.lastIndexOf('/');
      const dir = slash === -1 ? '(root)' : p.slice(0, slash + 1);
      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir).push(f);
    });
    // Sort groups: most files first, then alphabetical
    return Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  }

  /**
   * Render a density banner for a section when its item count crosses a threshold.
   * Thresholds (per-section):
   *   ≤ SOFT_CAP  → no banner
   *   > SOFT_CAP  → muted "fine density" note (count + suggest grouping)
   *   > HARD_CAP  → amber warning banner
   */
  function densityBanner(count, softCap, hardCap, kind) {
    if (count <= softCap) return null;
    const cls = count > hardCap ? 'pill-warn' : 'pill-info';
    const note = count > hardCap
      ? count + ' ' + kind + ' — long list. Consider grouping related items into one bullet.'
      : count + ' ' + kind + ' — fine density. Showing all.';
    return el('div', {
      class: 'flex items-center gap-2 mb-3 text-xs',
      style: 'color: var(--text-dim);'
    },
      el('span', { class: 'pill ' + cls }, count > hardCap ? 'DENSE' : 'DENSITY'),
      el('span', null, note)
    );
  }

  /**
   * Build a single grouped-bullet that summarizes N files in the same directory.
   * The grouped bullet is expandable to reveal individual files.
   */
  function groupBullet(dir, filesInDir) {
    const actionCounts = {};
    filesInDir.forEach(f => { actionCounts[f.action] = (actionCounts[f.action] || 0) + 1; });
    const summary = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([a, n]) => n + ' ' + a)
      .join(', ');

    const details = el('details', { class: 'group-bullet' },
      el('summary', {
        class: 'bullet cursor-pointer list-none',
        style: 'list-style: none;'
      },
        el('div', { class: 'flex items-start gap-4 w-full' },
          el('span', { class: 'pill pill-neutral shrink-0 mt-1' }, filesInDir.length + ' FILES'),
          el('div', { class: 'flex-1 min-w-0' },
            el('div', {
              class: 'font-mono text-sm',
              style: 'color: var(--accent);'
            }, dir),
            el('div', {
              class: 'text-xs mt-1',
              style: 'color: var(--text-dim);'
            }, summary)
          ),
          el('span', {
            class: 'text-xs shrink-0 mt-1',
            style: 'color: var(--text-faint);'
          }, '▸ click to expand')
        )
      )
    );

    const inner = el('div', {
      class: 'pl-6 pb-2',
      style: 'border-left: 2px solid var(--border-2); margin-left: 14px;'
    });
    filesInDir.forEach(f => inner.appendChild(fileBullet(f)));
    details.appendChild(inner);

    return details;
  }

  function fileBullet(f) {
    const meta = [];
    if (f.lines_added != null || f.lines_removed != null) {
      const a = f.lines_added || 0, b = f.lines_removed || 0;
      meta.push('+' + a + ' / −' + b);
    }
    return el('div', { class: 'bullet' },
      el('div', { class: 'flex items-start gap-4 w-full' },
        actionPill(f.action),
        el('div', { class: 'flex-1 min-w-0' },
          el('a', {
            href: 'file:///' + escapeHtml(f.path),
            class: 'font-mono text-sm text-lavender-600 hover:text-lavender-700 break-all'
          }, f.path || ''),
          f.summary ? el('p', { class: 'text-sm text-ink-500 mt-1.5' }, f.summary) : null,
          meta.length ? el('div', { class: 'flex gap-2 mt-2 text-xs font-mono text-ink-400' },
            meta.map(m => el('span', { class: 'pill pill-neutral' }, m))
          ) : null
        )
      )
    );
  }

  function decisionBullet(d) {
    return el('div', { class: 'card-soft p-5' },
      el('div', { class: 'flex items-start gap-3 mb-2' },
        el('span', { class: 'pill pill-neutral' }, d.reversible === false ? 'LOCKED' : 'CHOICE'),
        el('h3', { class: 'text-lg font-bold text-ink-900' }, d.title || ''),
      ),
      el('p', { class: 'text-sm text-ink-500' }, d.detail || ''),
      (d.tradeoffs && d.tradeoffs.length) ? el('div', { class: 'flex flex-wrap gap-2 mt-3 text-xs font-mono' },
        d.tradeoffs.map(t => {
          const good = t.trim().startsWith('+');
          const bad  = t.trim().startsWith('−') || t.trim().startsWith('-');
          return el('span', { class: 'pill ' + (good ? 'pill-success' : bad ? 'pill-warn' : 'pill-neutral') }, clamp(t, 60));
        })
      ) : null
    );
  }

  function errorBullet(e) {
    const excerpt = e.output_excerpt ? clamp(e.output_excerpt, 1000) : '';
    return el('div', { class: 'rounded-xl border border-error-100 p-5', style: 'background:#fbd9e033;' },
      el('div', { class: 'flex items-start gap-3 mb-2' },
        severityPill(e.severity),
        el('h3', { class: 'text-lg font-bold text-ink-900' }, e.title || ''),
        e.source ? el('span', { class: 'pill pill-neutral ml-auto' }, e.source.toUpperCase()) : null
      ),
      e.detail ? el('p', { class: 'text-sm text-ink-500 mb-3' }, e.detail) : null,
      excerpt ? el('div', { class: 'payload' }, excerpt) : null
    );
  }

  function commandBullet(c) {
    return el('div', { class: 'rounded-xl border border-ink-900/5 overflow-hidden' },
      el('div', { class: 'flex items-center gap-3 px-4 py-3 bg-cream-50 border-b border-ink-900/5' },
        exitPill(c.exit_code),
        el('code', { class: 'font-mono text-sm text-ink-800 break-all' }, c.command || ''),
        c.duration_ms != null ? el('span', { class: 'text-xs text-ink-400 ml-auto font-mono' }, formatDuration(c.duration_ms)) : null
      ),
      c.note ? el('div', { class: 'px-4 py-2 text-xs text-ink-500 italic border-b border-ink-900/5' }, c.note) : null,
      c.output_excerpt ? el('div', { class: 'payload !rounded-t-none !border-0' }, clamp(c.output_excerpt, 1000)) : null
    );
  }

  function hydrateSections(r) {
    const s = r.sections || {};

    // Overview
    const ovwTarget = document.getElementById('overview-body');
    if (ovwTarget) {
      ovwTarget.innerHTML = '';
      if (s.overview && s.overview.summary) {
        ovwTarget.appendChild(el('p', { class: 'text-ink-500 max-w-2xl text-[15px]' }, s.overview.summary));
      } else {
        ovwTarget.appendChild(el('p', { class: 'text-ink-400 italic' }, 'No overview provided.'));
      }
      paintStatsCard(s.overview ? s.overview.stats : []);
    }

    // Files
    const files = s.files || [];
    const filesMount = document.getElementById('files-body');
    if (filesMount) {
      filesMount.innerHTML = '';
      if (files.length) {
        const banner = densityBanner(files.length, SOFT_CAP_FILES, HARD_CAP_TOTAL, 'files');
        if (banner) filesMount.appendChild(banner);
        // Auto-group when over the soft cap
        if (files.length > SOFT_CAP_FILES) {
          const groups = groupFilesByDirectory(files);
          groups.forEach(([dir, items]) => filesMount.appendChild(groupBullet(dir, items)));
        } else {
          files.forEach(f => filesMount.appendChild(fileBullet(f)));
        }
      } else {
        paintEmpty('files-body', 'None — no files were modified this turn.');
      }
    }

    // Decisions
    const decisions = s.decisions || [];
    const decMount = document.getElementById('decisions-body');
    if (decMount) {
      decMount.innerHTML = '';
      if (decisions.length) {
        const banner = densityBanner(decisions.length, SOFT_CAP_DECISIONS, SOFT_CAP_DECISIONS * 2, 'decisions');
        if (banner) decMount.appendChild(banner);
        decisions.forEach(d => decMount.appendChild(decisionBullet(d)));
      } else {
        paintEmpty('decisions-body', 'None — no decisions were surfaced this turn.');
      }
    }

    // Errors
    const errors = s.errors || [];
    const errMount = document.getElementById('errors-body');
    if (errMount) {
      errMount.innerHTML = '';
      if (errors.length) paintBullets('errors-body', errors, errorBullet);
      else paintEmpty('errors-body', 'None — clean run, no errors or unresolved items.');
    }

    // Commands
    const commands = s.commands || [];
    const cmdMount = document.getElementById('commands-body');
    if (cmdMount) {
      cmdMount.innerHTML = '';
      if (commands.length) {
        const banner = densityBanner(commands.length, SOFT_CAP_COMMANDS, SOFT_CAP_COMMANDS * 2, 'commands');
        if (banner) cmdMount.appendChild(banner);
        commands.forEach(c => cmdMount.appendChild(commandBullet(c)));
      } else {
        paintEmpty('commands-body', 'None — no shell commands were run this turn.');
      }
    }

    // Sidebar counts
    const setCount = (id, n) => { const e = document.getElementById(id); if (e) e.textContent = n; };
    setCount('count-files',     files.length);
    setCount('count-decisions', decisions.length);
    setCount('count-errors',    errors.length);
    setCount('count-commands',  commands.length);

    // Sidebar pill (errors color)
    const errNav = document.getElementById('count-errors');
    if (errNav) {
      if (errors.length > 0) errNav.classList.add('pill-error');
      else errNav.classList.remove('pill-error');
    }
  }

  // ──────────────────────────────────────────────────────────
  // Validation banner
  // ──────────────────────────────────────────────────────────

  function renderValidationBanner(issues) {
    if (!issues || !issues.length) return;
    const banner = el('div', {
      class: 'card mb-4',
      style: 'background:#fbd9e033; border-color:#f5b8c5; padding:1rem 1.25rem;'
    },
      el('div', { class: 'flex items-start gap-3' },
        el('span', { class: 'pill pill-error' }, 'VALIDATION'),
        el('div', { class: 'flex-1' },
          el('div', { class: 'font-semibold text-ink-900 mb-1' }, 'HRP validation found ' + issues.length + ' issue(s):'),
          el('ul', { class: 'text-sm text-ink-500 list-disc pl-5 space-y-0.5' },
            issues.map(i => el('li', null, i))
          )
        )
      )
    );
    const main = document.getElementById('main-content');
    if (main) main.insertBefore(banner, main.firstChild);
    console.warn('HRP validation issues:', issues);
  }

  function renderFatal(msg) {
    document.body.innerHTML = '';
    const banner = el('div', {
      style: 'max-width:600px; margin:4rem auto; padding:2rem; background:#fbd9e0; border-radius:12px; font-family:Inter,sans-serif;'
    },
      el('h1', { style: 'font-size:1.4rem; font-weight:700; margin:0 0 0.5rem; color:#a01a37;' }, 'Could not render report'),
      el('p', { style: 'color:#6b6586; margin:0;' }, msg)
    );
    document.body.appendChild(banner);
    console.error('HRP render fatal:', msg);
  }

  // ──────────────────────────────────────────────────────────
  // Interactions
  // ──────────────────────────────────────────────────────────

  function wireScrollSpy() {
    const navItems = document.querySelectorAll('#section-nav .nav-item');
    const sections = [];
    navItems.forEach(item => {
      const id = item.getAttribute('data-target');
      const elNode = document.getElementById(id);
      if (elNode) sections.push({ id: id, node: elNode, item: item });
    });

    function setActive(targetId) {
      navItems.forEach(n => n.classList.remove('active'));
      const found = document.querySelector('[data-target="' + targetId + '"]');
      if (found) found.classList.add('active');
    }

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-target');
        const elNode = document.getElementById(id);
        if (elNode) {
          elNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActive(id);
        }
      });
    });

    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
    sections.forEach(s => observer.observe(s.node));
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function wireCopyDownload(envelope) {
    const copyBtn = document.getElementById('btn-copy-json');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const json = JSON.stringify(envelope, null, 2);
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
      const json = JSON.stringify(envelope, null, 2);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write('<!DOCTYPE html><html><head><title>HRP JSON</title></head><body style="font-family:JetBrains Mono,monospace; padding:1rem; background:#1c1a2e; color:#d8d3e8; white-space:pre-wrap; word-break:break-all;">' + escapeHtml(json) + '</body></html>');
        w.document.close();
      }
    });
  }

  function wireTheme() {
    // Single theme for now (lavender). Re-introduce cycling once other themes are verified.
    document.documentElement.setAttribute('data-theme', 'lavender');
  }

  function wireKeyboard() {
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
    wireTheme();
    hydrateHeader(envelope.report);
    hydrateSections(envelope.report);
    wireScrollSpy();
    wireCopyDownload(envelope);
    wireKeyboard();
    document.body.setAttribute('data-hrp-rendered', 'true');
  }

  // Auto-bootstrap from inline JSON
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

  // Expose for tests / programmatic use
  window.HRP = {
    render, validate, escapeHtml, formatTime, formatDuration
  };
})();
