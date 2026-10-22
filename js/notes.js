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

  // Four-column pair table: name | value | name | value, one row of two pairs.
  // Row-major fill (left pair, then right pair, then the next row) so the
  // original order reads left to right. Column-major would park the second
  // half of the list at the top of the right side.
  function renderPairTable(entries, nameHeader, valueHeader, term, kind) {
    const rows = [];
    for (let i = 0; i < entries.length; i += 2) {
      const stripe = (i / 2) % 2 === 0 ? 'nx-row-even' : 'nx-row-odd';
      rows.push(`<tr class="${stripe}">${renderPairCells(entries[i], term, kind)}${renderPairCells(entries[i + 1], term, kind)}</tr>`);
    }
    const dense = kind === 'brand' ? ' nx-pair-dense' : '';
    return `
      <div class="nx-table-wrap nx-pair-wrap">
        <table class="nx-data-table nx-pair-table nx-pair-${kind}${dense}">
          <thead>
            <tr>
              <th scope="col" class="nx-pair-name">${esc(nameHeader)}</th>
              <th scope="col" class="nx-pair-value">${esc(valueHeader)}</th>
              <th scope="col" class="nx-pair-name">${esc(nameHeader)}</th>
              <th scope="col" class="nx-pair-value">${esc(valueHeader)}</th>
            </tr>
          </thead>
          <tbody>${rows.join('')}</tbody>
        </table>
      </div>
    `;
  }

  function renderPairCells(entry, term, kind) {
    if (!entry) return '<td class="nx-pair-name"></td><td class="nx-pair-value"></td>';
    const nameHtml = highlightTerm(esc(entry.name), term);
    const valueHtml = highlightTerm(esc(entry.value), term);
    let nameClass = 'nx-pair-drug';
    let valueInner = `<span class="nx-details-body">${valueHtml}</span>`;
    if (kind === 'brand') {
      nameClass = 'nx-brand-badge';
      valueInner = `<span class="nx-generic-name">${valueHtml}</span>`;
    } else if (kind === 'otc') {
      nameClass = 'nx-otc-badge';
      const note = entry.note && entry.note !== '—' && entry.note !== '-'
        ? `<span class="nx-pair-note">${highlightTerm(esc(entry.note), term)}</span>`
        : '';
      valueInner = `<span class="nx-active-ing">${valueHtml}</span>${note}`;
    }
    return `<td class="nx-pair-name"><span class="${nameClass}">${nameHtml}</span></td><td class="nx-pair-value">${valueInner}</td>`;
  }

  function parseOtcSegment(clean) {
    const eqIdx = findOutsideParens(clean, '=');
    if (eqIdx <= 0) return { name: clean, value: '', note: '' };
    const name = clean.slice(0, eqIdx).trim();
    const remainder = clean.slice(eqIdx + 1).trim();
    const parenIdx = remainder.indexOf('(');
    if (parenIdx > 0) {
      return {
        name: name,
        value: remainder.slice(0, parenIdx).trim(),
        note: remainder.slice(parenIdx + 1).replace(/\)\s*$/, '').trim()
      };
    }
    return { name: name, value: remainder, note: '' };
  }

  // A trailing "(note)" on the last brand of one source item applies to the
  // brands before it that have no note of their own. That is how
  // "Claritin = loratadine; Zyrtec = cetirizine; Allegra = fexofenadine (2nd-gen antihistamines)."
  // is written. Brands that already have a note keep their own.
  function parseOtcEntries(items) {
    const entries = [];
    items.forEach(itemStr => {
      const parts = splitOutsideParens(itemStr, ';')
        .map(part => part.trim().replace(/\.$/, ''))
        .filter(Boolean)
        .map(parseOtcSegment);
      const shared = parts.length > 1 && parts[parts.length - 1].note && parts.slice(0, -1).every(part => !part.note)
        ? parts[parts.length - 1].note
        : '';
      parts.forEach(part => {
        if (shared && !part.note) part.note = shared;
        entries.push(part);
      });
    });
    return entries;
  }

  // 1. BRAND / GENERIC: Brand | Generic | Brand | Generic
  function renderBrandTable(items, term) {
    const entries = items.map(raw => {
      const line = String(raw || '').trim().replace(/\.$/, '');
      if (line.includes(' = ')) {
        const parts = line.split(' = ');
        const generic = parts.slice(1).join(' = ').trim();
        return { name: parts[0].trim(), value: generic === '—' ? '' : generic };
      }
      return { name: line, value: '' };
    });
    return renderPairTable(entries, 'Brand', 'Generic', term, 'brand');
  }

  // 2. OTC: Brand | Generic | Brand | Generic. The old third column is a
  // muted second line under the generic. Empty placeholders are omitted.
  function renderOtcTable(items, term) {
    return renderPairTable(parseOtcEntries(items), 'Brand', 'Generic', term, 'otc');
  }

  // Side effects: Drug | Key | Drug | Key. Same pair table, short rows.
  function renderSideEffectTable(items, term) {
    const entries = items.map(raw => {
      const text = String(raw || '').trim();
      const colonIdx = findOutsideParens(text, ': ');
      if (colonIdx > 0) {
        return { name: text.slice(0, colonIdx).trim(), value: text.slice(colonIdx + 2).trim() };
      }
      return { name: text, value: '' };
    });
    return renderPairTable(entries, 'Drug', 'Key', term, 'side');
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
              <th scope="col" class="nx-th-term" style="width: 32%;">Drug/Term</th>
              <th scope="col" class="nx-th-key" style="width: 68%;">Key</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  // 5. BRIEFING GRID (Procedures, Laws, Standards, Narrative Notes)
  function renderBriefingGrid(items, term, showIndex) {
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
      const indexHtml = showIndex ? `<span class="nx-card-index">#${String(idx + 1).padStart(2, '0')}</span>` : '';
      const header = (showIndex || tag)
        ? `<div class="nx-card-header-bar">${indexHtml}${tag ? `<span class="nx-card-tag">${tagHtml}</span>` : ''}</div>`
        : '';

      return `
        <div class="nx-briefing-card">
          ${header}
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
        if ((section.title || '').toLowerCase().includes('side effects')) {
          return renderSideEffectTable(items, term);
        }
        return renderClinicalTable(items, term);
      case 'briefing-grid':
      default:
        return renderBriefingGrid(items, term, section.title !== 'Key Federal Laws');
    }
  }

  const ICON_PREV = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 5.25 8 12l6.5 6.75" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 5.25 16 12l-6.5 6.75" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function topicAt(domainIdx, topicIdx) {
    const domain = loadedDomains[domainIdx];
    const sections = domain && domain.sections ? domain.sections : [];
    if (!domain || topicIdx < 0 || topicIdx >= sections.length) return null;
    return {
      domainIdx: domainIdx,
      topicIdx: topicIdx,
      domain: domain.domain,
      title: sections[topicIdx].title
    };
  }

  // Neighbor in the flattened topic list. A step off either end of a domain
  // lands on the next domain's first topic, or the previous domain's last.
  function topicNeighbor(domainIdx, topicIdx, delta) {
    const domain = loadedDomains[domainIdx];
    const sections = domain && domain.sections ? domain.sections : [];
    const inside = topicIdx + delta;
    if (inside >= 0 && inside < sections.length) return topicAt(domainIdx, inside);
    const otherIdx = domainIdx + (delta < 0 ? -1 : 1);
    const other = loadedDomains[otherIdx];
    const otherSections = other && other.sections ? other.sections : [];
    if (!other || !otherSections.length) return null;
    return topicAt(otherIdx, delta < 0 ? otherSections.length - 1 : 0);
  }

  function navLabel(action, fromDomainIdx, target) {
    const verb = action === 'prev' ? 'Previous topic' : 'Next topic';
    if (!target) return verb;
    if (target.domainIdx !== fromDomainIdx) return verb + ': ' + target.domain + ', ' + target.title;
    return verb + ': ' + target.title;
  }

  function renderNavButton(action, domainIdx, target) {
    const isPrev = action === 'prev';
    const label = navLabel(action, domainIdx, target);
    return `<button type="button" class="nx-nav-btn nx-btn-${isPrev ? 'prev' : 'next'}" data-action="${action}" data-domain="${domainIdx}" ${target ? '' : 'disabled'} aria-label="${esc(label)}" title="${esc(label)}">${isPrev ? ICON_PREV : ICON_NEXT}</button>`;
  }

  // Top row: icon prev, centered topic menu, icon next.
  // Bottom row: the same icons with the point count in the center (no "x of y", no second menu).
  // Both bars walk every topic and cross domain boundaries.
  function renderTopicNavigation(domainIdx, currentIdx, totalTopics, sections, placement, pointCount) {
    const prevTarget = topicNeighbor(domainIdx, currentIdx, -1);
    const nextTarget = topicNeighbor(domainIdx, currentIdx, 1);
    const prev = renderNavButton('prev', domainIdx, prevTarget);
    const next = renderNavButton('next', domainIdx, nextTarget);

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
    const chipRow = `
      <div class="nx-domain-switch" role="group" aria-label="Switch domain">
        ${domains.map((d, di) => {
          const active = di === openDomainIndex;
          return `<button type="button" class="nx-domain-chip${active ? ' is-active' : ''}" data-domain-switch="${di}" ${active ? 'disabled aria-current="true"' : ''} aria-label="${esc(d.domain)}, ${esc(d.weight || '')}">D${di + 1} ${esc(d.weight || '')}</button>`;
        }).join('')}
      </div>`;

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
      area.innerHTML = chipRow + cards[openDomainIndex];
    } else {
      area.innerHTML = cards.join('');
    }
  }

  // Event Delegation for Accordion Toggles and Topic Pagers
  area.addEventListener('click', function (e) {
    // 1. Slim domain switcher (open state only). Does not close the active domain.
    const switchBtn = e.target.closest('[data-domain-switch]');
    if (switchBtn && !switchBtn.disabled) {
      const idx = parseInt(switchBtn.getAttribute('data-domain-switch'), 10);
      if (!isNaN(idx) && idx !== openDomainIndex) {
        openDomainIndex = idx;
        render(loadedDomains, searchInput ? searchInput.value : '');
      }
      return;
    }

    // 2. Accordion Toggle
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

    // 2. Topic Navigation Buttons (Prev / Next). Both bars cross domains.
    const navBtn = e.target.closest('.nx-nav-btn');
    if (navBtn && !navBtn.disabled) {
      const domainIdx = parseInt(navBtn.getAttribute('data-domain'), 10);
      const action = navBtn.getAttribute('data-action');
      if (!loadedDomains[domainIdx] || (action !== 'prev' && action !== 'next')) return;
      const placement = navBtn.closest('.nx-topic-nav-bottom') ? 'bottom' : 'top';
      const cur = activeTopic[domainIdx] || 0;
      const target = topicNeighbor(domainIdx, cur, action === 'prev' ? -1 : 1);
      if (!target) return;

      const crossed = target.domainIdx !== domainIdx;
      activeTopic[target.domainIdx] = target.topicIdx;
      openDomainIndex = target.domainIdx;
      render(loadedDomains, searchInput ? searchInput.value : '');
      const topicContent = Util.el('[data-domain-card="' + target.domainIdx + '"] .nx-topic-content');
      if (topicContent) topicContent.scrollTop = 0;
      const focusBtn = Util.el('.nx-topic-nav-' + placement + ' .nx-btn-' + action);
      if (focusBtn && !focusBtn.disabled) focusBtn.focus();
      if (crossed) {
        const live = Util.el('#nxTopicLive');
        if (live) live.textContent = 'Domain ' + (target.domainIdx + 1) + ', ' + target.title;
      }
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
