// Study Notes Codex v2: High-Legibility, Parenthesis-Safe Multi-Layout Clinical Reference
(function () {
  'use strict';

  const { Util } = window.App;
  const area = Util.el('#notesArea');
  const searchInput = Util.el('#notesSearch');
  const searchClearBtn = Util.el('#notesSearchClear');

  let loadedDomains = [];
  // Active topic index per domain (0-indexed)
  const activeTopic = {};
  // Active open domain index (single open accordion, default -1 = all closed initially)
  let openDomainIndex = -1;

  function esc(s) {
    return Util.escapeHtml(String(s || ''));
  }

  // Parenthesis and bracket aware string splitting so items like:
  // "Tylenol = acetaminophen (max 4,000 mg/day; hepatotoxic in overdose)."
  // are NOT broken at the internal semicolon!
  function splitOutsideParens(str, delimiter = ';') {
    const raw = String(str || '');
    const result = [];
    let current = '';
    let parenDepth = 0;
    let bracketDepth = 0;

    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];
      if (char === '(') parenDepth++;
      else if (char === ')') { if (parenDepth > 0) parenDepth--; }
      else if (char === '[') bracketDepth++;
      else if (char === ']') { if (bracketDepth > 0) bracketDepth--; }

      if (parenDepth === 0 && bracketDepth === 0 && raw.startsWith(delimiter, i)) {
        if (current.trim()) result.push(current.trim());
        current = '';
        i += delimiter.length - 1;
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      result.push(current.trim());
    }
    return result;
  }

  // Find index of character outside parens
  function findOutsideParens(str, target) {
    let parenDepth = 0;
    let bracketDepth = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '(') parenDepth++;
      else if (char === ')') { if (parenDepth > 0) parenDepth--; }
      else if (char === '[') bracketDepth++;
      else if (char === ']') { if (bracketDepth > 0) bracketDepth--; }

      if (parenDepth === 0 && bracketDepth === 0 && str.startsWith(target, i)) {
        return i;
      }
    }
    return -1;
  }

  function highlightTerm(htmlStr, term) {
    if (!term) return htmlStr;
    const cleanTerm = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!cleanTerm) return htmlStr;
    const regex = new RegExp('(' + cleanTerm + ')', 'gi');
    return htmlStr.replace(regex, '<mark class="note-highlight">$1</mark>');
  }

  // Detect section layout type based on title and content characteristics
  function detectLayoutType(title, items) {
    const t = (title || '').toLowerCase();
    if (t.includes('brand / generic') || t.includes('brand/generic')) {
      return 'brand-table';
    }
    if (t.includes('otc active') || t.includes('common otc')) {
      return 'otc-table';
    }
    if (t.includes('sig codes') || t.includes('conversions') || t.includes('temperature') || t.includes('equivalents')) {
      return 'token-grid';
    }
    if (t.includes('classes & suffixes') || t.includes('mechanisms of action') || t.includes('side effects') || t.includes('controlled substance schedules') || t.includes('high-alert')) {
      return 'clinical-table';
    }
    return 'briefing-grid';
  }

  // 1. BRAND / GENERIC TABLE (2-Column Data Grid with explicit headers)
  function renderBrandTable(items, term) {
    const parsedPairs = [];
    items.forEach(raw => {
      const line = String(raw || '').trim().replace(/\.$/, '');
      if (line.includes(' = ')) {
        const parts = line.split(' = ');
        parsedPairs.push({ brand: parts[0].trim(), generic: parts.slice(1).join(' = ').trim() });
      } else {
        parsedPairs.push({ brand: line, generic: '—' });
      }
    });

    // Split pairs into two balanced columns for widescreen 2-up layout
    const mid = Math.ceil(parsedPairs.length / 2);
    const col1 = parsedPairs.slice(0, mid);
    const col2 = parsedPairs.slice(mid);

    function buildTableHtml(pairs) {
      if (!pairs.length) return '';
      let rows = pairs.map((p, idx) => {
        const rowClass = idx % 2 === 0 ? 'nx-row-even' : 'nx-row-odd';
        const brandHtml = highlightTerm(esc(p.brand), term);
        const genericHtml = highlightTerm(esc(p.generic), term);
        return `<tr class="${rowClass}">
          <td class="nx-cell-brand"><span class="nx-brand-badge">${brandHtml}</span></td>
          <td class="nx-cell-generic"><span class="nx-generic-name">${genericHtml}</span></td>
        </tr>`;
      }).join('');

      return `
        <div class="nx-table-wrap">
          <table class="nx-data-table nx-brand-table">
            <thead>
              <tr>
                <th scope="col" class="nx-th-brand">BRAND NAME</th>
                <th scope="col" class="nx-th-generic">GENERIC NAME</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }

    return `
      <div class="nx-brand-grid-container">
        <div class="nx-table-dual-col">
          ${buildTableHtml(col1)}
          ${col2.length ? buildTableHtml(col2) : ''}
        </div>
      </div>
    `;
  }

  // 2. OTC ACTIVE INGREDIENTS TABLE (3-Column Table with explicit headers)
  function renderOtcTable(items, term) {
    const flatItems = [];
    items.forEach(itemStr => {
      // Semicolon split outside parens
      const parts = splitOutsideParens(itemStr, ';');
      parts.forEach(p => {
        const clean = p.trim().replace(/\.$/, '');
        if (clean) flatItems.push(clean);
      });
    });

    const rows = flatItems.map((item, idx) => {
      const eqIdx = findOutsideParens(item, '=');
      let brand = item;
      let active = '—';
      let notes = '—';

      if (eqIdx > 0) {
        brand = item.slice(0, eqIdx).trim();
        const remainder = item.slice(eqIdx + 1).trim();
        const parenIdx = remainder.indexOf('(');
        if (parenIdx > 0) {
          active = remainder.slice(0, parenIdx).trim();
          notes = remainder.slice(parenIdx + 1).replace(/\)$/, '').trim();
        } else {
          active = remainder;
        }
      }

      const rowClass = idx % 2 === 0 ? 'nx-row-even' : 'nx-row-odd';
      const brandHtml = highlightTerm(esc(brand), term);
      const activeHtml = highlightTerm(esc(active), term);
      const notesHtml = highlightTerm(esc(notes), term);

      return `
        <tr class="${rowClass}">
          <td class="nx-cell-otc-brand"><span class="nx-otc-badge">${brandHtml}</span></td>
          <td class="nx-cell-otc-active"><span class="nx-active-ing">${activeHtml}</span></td>
          <td class="nx-cell-otc-notes"><span class="nx-notes-body">${notesHtml}</span></td>
        </tr>
      `;
    }).join('');

    return `
      <div class="nx-table-wrap">
        <table class="nx-data-table nx-otc-table">
          <thead>
            <tr>
              <th scope="col" style="width: 25%;">OTC BRAND NAME</th>
              <th scope="col" style="width: 25%;">ACTIVE INGREDIENT</th>
              <th scope="col" style="width: 50%;">CLINICAL CLASS &amp; KEY PEARLS</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  // 3. TOKEN MATRIX (Sig Codes, Abbreviations, Conversions)
  function renderTokenGrid(items, term) {
    const tokens = [];
    items.forEach(itemStr => {
      const splitted = splitOutsideParens(itemStr, ';');
      splitted.forEach(sub => {
        const clean = sub.trim();
        if (clean) tokens.push(clean);
      });
    });

    const tiles = tokens.map(tok => {
      let code = '';
      let arrow = '➔';
      let meaning = '';

      if (tok.includes(' = ')) {
        const parts = tok.split(' = ');
        code = parts[0].trim();
        arrow = '=';
        meaning = parts.slice(1).join(' = ').trim();
      } else if (tok.includes(' → ')) {
        const parts = tok.split(' → ');
        code = parts[0].trim();
        arrow = '→';
        meaning = parts.slice(1).join(' → ').trim();
      } else if (tok.includes(': ')) {
        const parts = tok.split(': ');
        code = parts[0].trim();
        arrow = ':';
        meaning = parts.slice(1).join(': ').trim();
      } else {
        meaning = tok;
      }

      const codeHtml = highlightTerm(esc(code), term);
      const meaningHtml = highlightTerm(esc(meaning), term);

      if (code) {
        return `
          <div class="nx-token-card">
            <div class="nx-token-code">${codeHtml}</div>
            <div class="nx-token-arrow">${arrow}</div>
            <div class="nx-token-meaning">${meaningHtml}</div>
          </div>
        `;
      }
      return `
        <div class="nx-token-card nx-token-single">
          <div class="nx-token-meaning">${meaningHtml}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="nx-token-section">
        <div class="nx-token-legend">
          <span class="nx-legend-lead">ABBREVIATION / CONVERSION CODE</span>
          <span class="nx-legend-arrow">➔</span>
          <span class="nx-legend-meaning">CLINICAL TRANSLATION / STANDARD EQUIVALENT</span>
        </div>
        <div class="nx-token-grid">
          ${tiles}
        </div>
      </div>
    `;
  }

  // 4. CLINICAL TABLE (Drug Classes, Mechanisms, Side Effects, Schedules)
  function renderClinicalTable(items, term) {
    const rows = items.map((itemStr, idx) => {
      const text = String(itemStr || '').trim();
      const colonIdx = findOutsideParens(text, ': ');
      const emDashIdx = findOutsideParens(text, ' — ');
      const delimIdx = (colonIdx > 0 && colonIdx < 50) ? colonIdx : ((emDashIdx > 0 && emDashIdx < 50) ? emDashIdx : -1);

      let termTitle = '';
      let details = text;

      if (delimIdx > 0) {
        termTitle = text.substring(0, delimIdx).trim();
        const sepLen = (delimIdx === colonIdx) ? 2 : 3;
        details = text.substring(delimIdx + sepLen).trim();
      }

      const rowClass = idx % 2 === 0 ? 'nx-row-even' : 'nx-row-odd';
      const titleHtml = highlightTerm(esc(termTitle), term);
      const detailsHtml = highlightTerm(esc(details), term);

      return `
        <tr class="${rowClass}">
          <td class="nx-cell-term">
            <span class="nx-term-badge">${titleHtml || 'NOTE'}</span>
          </td>
          <td class="nx-cell-details">
            <span class="nx-details-body">${detailsHtml}</span>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="nx-table-wrap">
        <table class="nx-data-table nx-clinical-table">
          <thead>
            <tr>
              <th scope="col" style="width: 32%;">CLASSIFICATION / SCHEDULE / TERM</th>
              <th scope="col" style="width: 68%;">CLINICAL SPECIFICATIONS, MECHANISMS &amp; PEARLS</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  // 5. BRIEFING GRID (Procedures, Laws, Standards, Narrative Notes)
  function renderBriefingGrid(items, term) {
    const cards = items.map((itemStr, idx) => {
      const text = String(itemStr || '').trim();
      const colonIdx = findOutsideParens(text, ': ');
      const emDashIdx = findOutsideParens(text, ' — ');
      const delimIdx = (colonIdx > 0 && colonIdx < 45) ? colonIdx : ((emDashIdx > 0 && emDashIdx < 45) ? emDashIdx : -1);

      let tag = '';
      let narrative = text;

      if (delimIdx > 0) {
        tag = text.substring(0, delimIdx).trim();
        const sepLen = (delimIdx === colonIdx) ? 2 : 3;
        narrative = text.substring(delimIdx + sepLen).trim();
      }

      const tagHtml = highlightTerm(esc(tag), term);
      const narrativeHtml = highlightTerm(esc(narrative), term);

      return `
        <div class="nx-briefing-card">
          <div class="nx-card-header-bar">
            <span class="nx-card-index">#${String(idx + 1).padStart(2, '0')}</span>
            ${tag ? `<span class="nx-card-tag">${tagHtml}</span>` : ''}
          </div>
          <div class="nx-card-narrative">${narrativeHtml}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="nx-briefing-grid">
        ${cards}
      </div>
    `;
  }

  // Master layout dispatcher
  function renderSectionContent(section, term) {
    const items = section.items || [];
    if (!items.length) {
      return '<div class="nx-empty-topic">No notes documented for this topic.</div>';
    }

    const layout = detectLayoutType(section.title, items);
    switch (layout) {
      case 'brand-table':
        return renderBrandTable(items, term);
      case 'otc-table':
        return renderOtcTable(items, term);
      case 'token-grid':
        return renderTokenGrid(items, term);
      case 'clinical-table':
        return renderClinicalTable(items, term);
      case 'briefing-grid':
      default:
        return renderBriefingGrid(items, term);
    }
  }

  const ICON_PREV = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 5.25 8 12l6.5 6.75" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 5.25 16 12l-6.5 6.75" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function renderNavButton(action, domainIdx, enabled) {
    const isPrev = action === 'prev';
    return `<button type="button" class="nx-nav-btn nx-btn-${isPrev ? 'prev' : 'next'}" data-action="${action}" data-domain="${domainIdx}" ${enabled ? '' : 'disabled'} aria-label="${isPrev ? 'Previous topic' : 'Next topic'}">${isPrev ? ICON_PREV : ICON_NEXT}</button>`;
  }

  // Top row: icon prev, centered topic menu, icon next.
  // Bottom row: the same icons with the point count in the center (no "x of y", no second menu).
  function renderTopicNavigation(domainIdx, currentIdx, totalTopics, sections, placement, pointCount) {
    const hasPrev = currentIdx > 0;
    const hasNext = currentIdx < totalTopics - 1;
    const prev = renderNavButton('prev', domainIdx, hasPrev);
    const next = renderNavButton('next', domainIdx, hasNext);

    let center;
    if (placement === 'bottom') {
      const n = pointCount || 0;
      const label = n === 1 ? '1 Point' : `${n} Points`;
      center = `<div class="nx-nav-center"><span class="nx-item-count-chip">${label}</span></div>`;
    } else {
      const options = sections.map((sec, idx) => {
        const isSelected = idx === currentIdx ? 'selected' : '';
        return `<option value="${idx}" ${isSelected}>${esc(sec.title)}</option>`;
      }).join('');
      center = `
        <div class="nx-nav-center">
          <label class="nx-sr" for="nxTopicSelect_${domainIdx}">Topic</label>
          <select id="nxTopicSelect_${domainIdx}" class="nx-topic-select" data-action="jump" data-domain="${domainIdx}">
            ${options}
          </select>
        </div>`;
    }

    return `
      <div class="nx-topic-nav nx-topic-nav-${placement}" data-domain-nav="${domainIdx}">
        ${prev}
        ${center}
        ${next}
      </div>
    `;
  }

  function syncStage(filterText) {
    const reading = !String(filterText || '').trim() && openDomainIndex !== -1;
    document.body.classList.toggle('nx-reading', reading);
  }

  // Master Render Function
  function render(domains, filterText = '') {
    syncStage(filterText);
    if (!domains || !domains.length) {
      area.innerHTML = '<p class="nx-empty-notice">No clinical notes archives found.</p>';
      return;
    }

    const term = filterText.trim().toLowerCase();

    // 1. FILTER / SEARCH MODE: Render matching items across all domains expanded
    if (term) {
      let totalMatchCount = 0;
      const domainBlocks = domains.map((d, di) => {
        const matchingSections = [];

        (d.sections || []).forEach(sec => {
          const titleMatches = sec.title.toLowerCase().includes(term);
          const matchedItems = (sec.items || []).filter(item => {
            return String(item).toLowerCase().includes(term);
          });

          if (titleMatches || matchedItems.length > 0) {
            matchingSections.push({
              title: sec.title,
              items: titleMatches ? sec.items : matchedItems,
              matchedCount: titleMatches ? (sec.items || []).length : matchedItems.length
            });
            totalMatchCount += (titleMatches ? (sec.items || []).length : matchedItems.length);
          }
        });

        if (!matchingSections.length) return '';

        const sectionsHtml = matchingSections.map(sec => {
          return `
            <div class="nx-search-section-block">
              <div class="nx-search-section-header">
                <span class="nx-topic-chip">TOPIC MATCH</span>
                <h3 class="nx-search-section-title">${highlightTerm(esc(sec.title), term)}</h3>
                <span class="nx-match-count">${sec.items.length} item${sec.items.length === 1 ? '' : 's'}</span>
              </div>
              <div class="nx-search-section-body">
                ${renderSectionContent(sec, term)}
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="nx-domain-card nx-domain-open" data-domain-card="${di}">
            <div class="nx-domain-header" data-domain-toggle="${di}">
              <div class="nx-domain-header-left">
                <span class="nx-domain-pill">DOMAIN ${di + 1}</span>
                <span class="nx-weight-badge">${esc(d.weight || '')}</span>
              </div>
              <h2 class="nx-domain-name">${highlightTerm(esc(d.domain), term)}</h2>
              <div class="nx-domain-header-right">
                <span class="nx-matched-pill">${matchingSections.length} MATCHING TOPICS</span>
              </div>
            </div>
            <div class="nx-domain-body">
              ${sectionsHtml}
            </div>
          </div>
        `;
      }).filter(Boolean);

      if (!domainBlocks.length) {
        area.innerHTML = `
          <div class="nx-empty-search-card">
            <div class="nx-empty-icon">🔍</div>
            <h3>No Results Found for "${esc(filterText)}"</h3>
            <p>Try searching by drug name (e.g. <em>lisinopril</em>, <em>warfarin</em>), class (<em>ACE inhibitors</em>, <em>statins</em>), or law (<em>DEA</em>, <em>HIPAA</em>).</p>
            <button type="button" class="nx-btn-reset-search" id="nxResetSearchBtn">Clear Search</button>
          </div>
        `;
        const resetBtn = Util.el('#nxResetSearchBtn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchClearBtn.hidden = true;
            render(loadedDomains, '');
            searchInput.focus();
          });
        }
        return;
      }

      area.innerHTML = `
        <div class="nx-search-summary-bar">
          <span>Found <strong>${totalMatchCount}</strong> reference matches across <strong>${domainBlocks.length}</strong> domains for "${esc(filterText)}"</span>
        </div>
        ${domainBlocks.join('')}
      `;
      return;
    }

    // 2. NORMAL ACCORDION MODE: Mutually exclusive domain accordion.
    // An open domain is rendered first so its header sits under the page header
    // and the other closed headers follow its card.
    const cards = domains.map((d, di) => {
      const isOpen = di === openDomainIndex;
      const sections = d.sections || [];
      const totalSections = sections.length;

      if (activeTopic[di] == null) {
        activeTopic[di] = 0;
      }
      const currentTopicIdx = Math.max(0, Math.min(activeTopic[di], totalSections - 1));
      const activeSection = sections[currentTopicIdx] || { title: 'Untitled', items: [] };

      return `
        <div class="nx-domain-card ${isOpen ? 'nx-domain-open' : 'nx-domain-closed'}" data-domain-card="${di}">
          <button type="button" class="nx-domain-header" data-domain-toggle="${di}" aria-expanded="${isOpen}">
            <span class="nx-domain-header-left">
              <span class="nx-domain-pill">DOMAIN ${di + 1}</span>
              <span class="nx-weight-badge">${esc(d.weight || '')}</span>
            </span>
            <h2 class="nx-domain-name">${esc(d.domain)}</h2>
            <span class="nx-domain-header-right">
              <span class="nx-topic-count-badge">${totalSections} Clinical Topics</span>
              <span class="nx-chevron-icon" aria-hidden="true">${isOpen ? '▲' : '▼'}</span>
            </span>
          </button>

          ${isOpen ? `
            <div class="nx-domain-body">
              <section class="nx-topic-card" aria-label="${esc(d.domain)}: ${esc(activeSection.title)}">
                <div class="nx-topic-card-top">
                  ${renderTopicNavigation(di, currentTopicIdx, totalSections, sections, 'top')}
                </div>

                <div class="nx-topic-content">
                  ${renderSectionContent(activeSection, '')}
                </div>

                ${renderTopicNavigation(di, currentTopicIdx, totalSections, sections, 'bottom', (activeSection.items || []).length)}
              </section>
            </div>
          ` : ''}
        </div>
      `;
    });
    if (openDomainIndex >= 0 && openDomainIndex < cards.length) {
      const rest = cards.filter((_, i) => i !== openDomainIndex);
      area.innerHTML = cards[openDomainIndex] + rest.join('');
    } else {
      area.innerHTML = cards.join('');
    }
  }

  // Event Delegation for Accordion Toggles and Topic Pagers
  area.addEventListener('click', function (e) {
    // 1. Accordion Toggle
    const toggleBtn = e.target.closest('[data-domain-toggle]');
    if (toggleBtn) {
      const idx = parseInt(toggleBtn.getAttribute('data-domain-toggle'), 10);
      if (!isNaN(idx)) {
        // Mutually exclusive: if clicking the currently open domain, close it; else open clicked domain
        openDomainIndex = (openDomainIndex === idx) ? -1 : idx;
        render(loadedDomains, searchInput ? searchInput.value : '');
      }
      return;
    }

    // 2. Topic Navigation Buttons (Prev / Next)
    const navBtn = e.target.closest('.nx-nav-btn');
    if (navBtn && !navBtn.disabled) {
      const domainIdx = parseInt(navBtn.getAttribute('data-domain'), 10);
      const action = navBtn.getAttribute('data-action');
      const domainData = loadedDomains[domainIdx];
      if (!domainData) return;

      const total = (domainData.sections || []).length;
      let cur = activeTopic[domainIdx] || 0;

      if (action === 'prev' && cur > 0) {
        activeTopic[domainIdx] = cur - 1;
      } else if (action === 'next' && cur < total - 1) {
        activeTopic[domainIdx] = cur + 1;
      }

      render(loadedDomains, searchInput ? searchInput.value : '');
      const topicContent = Util.el(`[data-domain-card="${domainIdx}"] .nx-topic-content`);
      if (topicContent) topicContent.scrollTop = 0;
    }
  });

  // Topic Jump Dropdown Selector
  area.addEventListener('change', function (e) {
    const select = e.target.closest('.nx-topic-select');
    if (select) {
      const domainIdx = parseInt(select.getAttribute('data-domain'), 10);
      const targetIdx = parseInt(select.value, 10);
      if (!isNaN(domainIdx) && !isNaN(targetIdx)) {
        activeTopic[domainIdx] = targetIdx;
        render(loadedDomains, searchInput ? searchInput.value : '');
        const topicContent = Util.el(`[data-domain-card="${domainIdx}"] .nx-topic-content`);
        if (topicContent) topicContent.scrollTop = 0;
      }
    }
  });

  // Instant Live Search Filter
  if (searchInput) {
    let debounceTimer = null;
    searchInput.addEventListener('input', function () {
      const val = searchInput.value;
      if (searchClearBtn) {
        searchClearBtn.hidden = !val.trim();
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        render(loadedDomains, val);
      }, 140);
    });
  }

  // Clear button for search
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', function () {
      searchInput.value = '';
      searchClearBtn.hidden = true;
      render(loadedDomains, '');
      searchInput.focus();
    });
  }

  // Data Loader
  fetch('data/notes.json')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      loadedDomains = data.domains || [];
      // Initialize topic indices for all domains to 0
      loadedDomains.forEach((_, idx) => {
        activeTopic[idx] = 0;
      });
      // Every accordion starts closed. Do not restore a previous open domain.
      openDomainIndex = -1;
      render(loadedDomains, '');
    })
    .catch(err => {
      console.error('Failed to load notes data:', err);
      area.innerHTML = `
        <div class="nx-empty-search-card">
          <div class="nx-empty-icon">⚠️</div>
          <h3>Failed to load study notes archive</h3>
          <p class="muted">${esc(err.message)}</p>
        </div>
      `;
    });

})();
