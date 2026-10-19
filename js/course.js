// Study Course: module list, lesson reader, progress tracking, test-yourself links
(function () {
  const { Storage, Util } = window.App;

  const listWrap = Util.el('#courseListWrap');
  const listView = Util.el('#courseList');
  const lessonView = Util.el('#lessonView');
  const loadErrorEl = Util.el('#loadError');

  const NAV_BACK = '<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 6.5 9 12l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const NAV_NEXT = '<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 6.5 15 12l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const NAV_MODULES = '<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';

  let course = null;
  let moduleIndex = new Map(); // moduleId -> module
  let lessonIndex = new Map(); // lessonId -> { module, lesson, flatIndex }
  let flatLessons = [];        // [{module, lesson}] in course order
  let currentFlat = 0;
  // Notes domain badges (data/notes.json weights). Names come from App.DOMAINS.
  const DOMAIN_WEIGHTS = {
    'Medications': '35%',
    'Patient Safety and Quality Assurance': '23.75%',
    'Order Entry and Processing': '22.50%',
    'Federal Requirements': '18.75%'
  };
  let openDomainIndex = -1;   // one domain accordion; -1 = all closed

  function esc(s) { return Util.escapeHtml(String(s)); }

  function buildIndexes() {
    moduleIndex.clear();
    lessonIndex.clear();
    flatLessons = [];
    course.modules.forEach(function (m) {
      moduleIndex.set(m.id, m);
      m.lessons.forEach(function (l) {
        const entry = { module: m, lesson: l, flatIndex: flatLessons.length };
        lessonIndex.set(l.id, entry);
        flatLessons.push(entry);
      });
    });
  }

  function progress() { return Storage.getCourseProgress(); }
  function isDone(id) { return progress().completed.includes(id); }
  function isOptional(lesson) { return !!(lesson && lesson.optional); }
  function featuredOf(lessons) { return lessons.filter(function (l) { return !isOptional(l); }); }

  // Resume target, from the saved course record only (completed ids + lastLesson).
  // Featured lessons are the default path; optional archive lessons stay off it
  // unless the learner is currently inside one.
  // 1. Partway: lastLesson is set and not complete → that lesson.
  // 2. Otherwise the first featured lesson after the most recently marked
  //    complete lesson (completed[] order). Already-finished lessons are skipped.
  // 3. Nothing saved → the first featured lesson (Start).
  // 4. Every featured lesson is complete → the last featured lesson.
  function resumeTarget() {
    const featured = flatLessons.filter(function (x) { return !isOptional(x.lesson); });
    if (!featured.length) return null;
    const p = progress();
    const done = new Set(p.completed);

    if (p.lastLesson && lessonIndex.has(p.lastLesson) && !done.has(p.lastLesson)) {
      return { verb: 'Resume', entry: lessonIndex.get(p.lastLesson) };
    }

    let lastMarked = null;
    for (let i = p.completed.length - 1; i >= 0; i--) {
      const entry = lessonIndex.get(p.completed[i]);
      if (entry) { lastMarked = entry; break; }
    }

    if (!lastMarked) return { verb: 'Start', entry: featured[0] };

    const next = featured.find(function (x) {
      return x.flatIndex > lastMarked.flatIndex && !done.has(x.lesson.id);
    });
    if (next) return { verb: 'Resume', entry: next };

    if (featured.every(function (x) { return done.has(x.lesson.id); })) {
      return { verb: 'Resume', entry: featured[featured.length - 1] };
    }

    const gap = featured.find(function (x) { return !done.has(x.lesson.id); });
    return { verb: 'Resume', entry: gap || featured[featured.length - 1] };
  }

  function navNeighbor(flatIndex, dir) {
    const currentOptional = isOptional(flatLessons[flatIndex].lesson);
    for (let i = flatIndex + dir; i >= 0 && i < flatLessons.length; i += dir) {
      if (currentOptional || !isOptional(flatLessons[i].lesson)) return flatLessons[i];
    }
    return null;
  }

  function lessonLinkHtml(l, done) {
    const opt = isOptional(l);
    const badge = opt ? '<span class="archive-badge">' + esc(l.badge || 'Not emphasized on 2026 PTCE') + '</span>' : '';
    return '<a class="lesson-link' + (done ? ' done' : '') + (opt ? ' optional' : '') + '" href="course.html?lesson=' + encodeURIComponent(l.id) + '">' +
      '<span class="lesson-check">' + (done ? '✓' : '○') + '</span>' +
      '<span class="lesson-title">' + esc(l.title) + badge + '</span></a>';
  }

  function quizUrl(mod) {
    const q = mod.quiz || { domain: mod.domain, count: 10 };
    return 'quiz.html?mode=chapter&domain=' + encodeURIComponent(q.domain) + '&count=' + (q.count || 10);
  }

  function moduleLabels(modules) {
    const seen = [];
    const counts = {};
    return modules.map(function (m) {
      if (seen.indexOf(m.domain) < 0) seen.push(m.domain);
      counts[m.domain] = (counts[m.domain] || 0) + 1;
      return { domainNum: seen.indexOf(m.domain) + 1, chapter: counts[m.domain] };
    });
  }

  function domainPillText(m) {
    const labels = moduleLabels(course.modules);
    const mi = course.modules.indexOf(m);
    const num = labels[mi] ? labels[mi].domainNum : 1;
    const shortName = String(m.domain).split(' and ')[0];
    return 'Domain ' + num + ' · ' + shortName;
  }

  const BODY_SCALES = [0.98, 0.96, 0.94, 0.92];
  const HEAD_SCALES = [];
  for (let n = 98; n >= 52; n -= 2) HEAD_SCALES.push(n / 100);
  const TITLE_SCALES = [];
  for (let n = 100; n >= 66; n -= 2) TITLE_SCALES.push(n / 100);
  const FIT_OVERFLOW = 60;
  const FIT_HEAD_OVERFLOW = 100;
  const TITLE_PREF = 1.5;
  // These four still overflow after the body floor. The title may scale
  // for them only. The intro stays in the data and is not rendered.
  const HEAD_FIT = { m4l3: 1, m6l2: 1, m7l2: 1, m10l1: 1 };
  let fitLessonId = '';
  let titleRowScale = 1;

  function lessonTextPast(layout) {
    const edge = layout.getBoundingClientRect().bottom;
    let past = 0;
    const nodes = layout.querySelectorAll('h3, li');
    for (let i = 0; i < nodes.length; i++) {
      const range = document.createRange();
      range.selectNodeContents(nodes[i]);
      const rects = range.getClientRects();
      for (let j = 0; j < rects.length; j++) {
        const d = rects[j].bottom - edge;
        if (d > past) past = d;
      }
    }
    return past;
  }

  function lessonOverflow(layout) {
    return Math.max(layout.scrollHeight - layout.clientHeight, lessonTextPast(layout));
  }

  // Center the title on the top row. Keep the domain pill and module label
  // fully visible when a one- or two-line title still clears them. Otherwise
  // ellipsize the label and keep the title at most two lines.
  function fitLessonTitle() {
    const header = document.querySelector('.lesson-header');
    const meta = header && header.querySelector('.lesson-header-meta');
    const title = header && header.querySelector('.lesson-title-main');
    const pill = meta && meta.querySelector('.crumb');
    if (!header || !meta || !title || !pill) return;
    const gap = 12;
    meta.style.maxWidth = 'none';
    title.classList.remove('is-clamped');
    title.style.width = 'max-content';
    title.style.maxWidth = 'none';
    const headerW = header.clientWidth;
    const fullMeta = meta.getBoundingClientRect().width;
    const pillW = pill.getBoundingClientRect().width;
    const minMeta = pillW + gap + 36;
    function applyScale(scale) {
      title.style.fontSize = scale === 1
        ? TITLE_PREF + 'rem'
        : 'calc(' + TITLE_PREF + 'rem * ' + scale + ')';
    }
    function lineCount() {
      const lh = parseFloat(getComputedStyle(title).lineHeight) || 1;
      return title.getBoundingClientRect().height / lh;
    }
    function naturalWidth() {
      title.style.width = 'max-content';
      title.style.maxWidth = 'none';
      return title.getBoundingClientRect().width;
    }
    function linesIn(lane) {
      const w = Math.max(40, Math.floor(lane));
      title.style.width = w + 'px';
      title.style.maxWidth = w + 'px';
      return lineCount();
    }
    function use(scale, maxW, clamp) {
      titleRowScale = scale;
      applyScale(scale);
      title.style.width = 'max-content';
      title.style.maxWidth = Math.max(40, Math.floor(maxW)) + 'px';
      title.classList.toggle('is-clamped', !!clamp);
      title.dataset.titleScale = String(scale);
    }
    // Smallest width at which this size wraps to at most two lines.
    function minLane(scale) {
      applyScale(scale);
      const one = naturalWidth();
      const cap = Math.max(80, headerW - 2 * (minMeta + gap));
      let lane = Math.max(80, Math.ceil(one / 2.2));
      if (lane > cap) lane = cap;
      for (let n = 0; n < 12; n++) {
        if (linesIn(lane) <= 2.05) return lane;
        if (lane >= cap - 1) return null;
        lane = Math.min(cap, lane + Math.max(20, Math.ceil(one * 0.05)));
      }
      return null;
    }
    for (let i = 0; i < TITLE_SCALES.length; i++) {
      const scale = TITLE_SCALES[i];
      applyScale(scale);
      const one = naturalWidth();
      const fullLane = headerW - 2 * (fullMeta + gap);
      if (one + 2 * (fullMeta + gap) <= headerW + 1) {
        use(scale, Math.max(one + 8, fullLane), false);
        return;
      }
      if (fullLane >= 160 && linesIn(fullLane) <= 2.05) {
        use(scale, fullLane, false);
        return;
      }
    }
    // Full label does not fit. Shrink the title first. Ellipsize the label
    // only for the leftover, and only as far as the pill plus a stub.
    let chosen = null;
    for (let i = 0; i < TITLE_SCALES.length; i++) {
      const scale = TITLE_SCALES[i];
      const need = minLane(scale);
      if (!need) continue;
      const room = (headerW - need) / 2 - gap;
      if (room < minMeta) continue;
      const cut = Math.max(0, fullMeta - room);
      // A few dozen pixels of ellipsis is enough. Past that, shrink the
      // title further so the module label stays readable. Scales are tried
      // largest first, so the first modest cut is the largest readable title.
      if (cut <= 64) {
        chosen = { scale: scale, need: need, room: room, cut: cut };
        break;
      }
      if (!chosen || cut < chosen.cut) chosen = { scale: scale, need: need, room: room, cut: cut };
    }
    if (chosen) {
      meta.style.maxWidth = Math.floor(chosen.room) + 'px';
      use(chosen.scale, chosen.need + 8, false);
      return;
    }
    const floor = TITLE_SCALES[TITLE_SCALES.length - 1];
    const lane = Math.max(80, headerW - 2 * (minMeta + gap));
    meta.style.maxWidth = Math.floor(minMeta) + 'px';
    use(floor, lane, true);
  }

  function fitLessonBody() {
    const layout = document.querySelector('.lesson-layout');
    const body = layout && layout.querySelector('.lesson-body');
    const title = document.querySelector('.lesson-title-main');
    const header = document.querySelector('.lesson-header');
    if (!layout || !body) return;
    const lis = body.querySelectorAll('li');
    const allowHead = !!HEAD_FIT[fitLessonId];
    const rowScale = titleRowScale || 1;
    function applyBody(scale) {
      const size = scale === 1 ? '' : 'calc(1.35rem * ' + scale + ')';
      for (let i = 0; i < lis.length; i++) lis[i].style.fontSize = size;
      body.dataset.bodyScale = String(scale);
    }
    function applyHead(scale, margins) {
      if (!title) return;
      const used = Math.max(0.52, Math.min(rowScale, scale));
      title.style.fontSize = 'calc(' + TITLE_PREF + 'rem * ' + used + ')';
      title.dataset.titleScale = String(Math.round(used * 100) / 100);
      if (header) header.style.marginBottom = margins ? (8 * used) + 'px' : '';
    }
    function boxExtra() {
      return layout.scrollHeight - layout.clientHeight;
    }
    // A few pixels of box overflow with the glyphs already inside the
    // reading region is a phantom scrollbar. Pull the header's bottom
    // margin in so the reading region grows and the bar goes away.
    function absorb() {
      if (lessonTextPast(layout) > 1) return false;
      if (boxExtra() <= 0.5) return true;
      if (boxExtra() > 4 || !header) return false;
      const mb = parseFloat(getComputedStyle(header).marginBottom) || 0;
      header.style.marginBottom = Math.max(0, mb - Math.ceil(boxExtra())) + 'px';
      return lessonTextPast(layout) <= 1 && boxExtra() <= 0.5;
    }
    function fitted() {
      return absorb();
    }
    applyBody(1);
    applyHead(1, false);
    if (fitted()) return;
    const initial = lessonOverflow(layout);
    if (initial > (allowHead ? FIT_HEAD_OVERFLOW : FIT_OVERFLOW)) return;
    for (let s = 0; s < BODY_SCALES.length; s++) {
      applyBody(BODY_SCALES[s]);
      if (header && !allowHead) header.style.marginBottom = '';
      if (fitted()) return;
    }
    if (allowHead) {
      applyBody(0.92);
      for (let h = 0; h < HEAD_SCALES.length; h++) {
        if (HEAD_SCALES[h] >= rowScale - 0.001) continue;
        applyHead(HEAD_SCALES[h], false);
        if (fitted()) return;
      }
      for (let h = 0; h < HEAD_SCALES.length; h++) {
        if (HEAD_SCALES[h] >= rowScale - 0.001) continue;
        applyHead(HEAD_SCALES[h], true);
        if (fitted()) return;
      }
    }
    applyBody(1);
    applyHead(1, false);
  }

  function fitLesson() {
    if (!document.body.classList.contains('lesson-open')) return;
    fitLessonTitle();
    fitLessonBody();
  }

  function domainGroups() {
    const names = (window.App.DOMAINS || []).slice();
    return names.map(function (name) {
      return {
        name: name,
        weight: DOMAIN_WEIGHTS[name] || '',
        modules: course.modules.filter(function (m) { return m.domain === name; })
      };
    });
  }

  function moduleBlock(m, done) {
    const featured = featuredOf(m.lessons);
    const optional = m.lessons.filter(isOptional);
    const completed = featured.filter(function (l) { return done.has(l.id); }).length;
    const mpct = featured.length ? Math.round((completed / featured.length) * 100) : 0;
    const lessons = featured.map(function (l) {
      return lessonLinkHtml(l, done.has(l.id));
    }).join('');
    const archive = optional.length
      ? '<div class="archive-block"><div class="archive-label">Optional / not emphasized on 2026 PTCE</div>' +
        optional.map(function (l) { return lessonLinkHtml(l, done.has(l.id)); }).join('') + '</div>'
      : '';
    return '<section class="course-module' + (mpct === 100 ? ' course-module-complete' : '') + '" data-module-id="' + esc(m.id) + '">' +
      '<h3 class="course-module-title">' + esc(m.title) + '</h3>' +
      '<p class="module-desc">' + esc(m.desc) + '</p>' +
      '<div class="bar-track module-bar"><div class="bar-fill" style="width:' + mpct + '%"></div></div>' +
      '<div class="lesson-list">' + lessons + archive + '</div>' +
      '<a class="btn gold module-quiz" href="' + quizUrl(m) + '">Test Yourself: ' + esc(m.domain) + ' Quiz</a>' +
      '</section>';
  }

  function domainCard(group, di, isOpen) {
    const moduleCount = group.modules.length;
    const countLabel = moduleCount === 1 ? '1 Module' : moduleCount + ' Modules';
    const header = '<button type="button" class="nx-domain-header" data-domain-toggle="' + di + '" aria-expanded="' + (isOpen ? 'true' : 'false') + '">' +
      '<span class="nx-domain-header-left">' +
        '<span class="nx-domain-pill">DOMAIN ' + (di + 1) + '</span>' +
        '<span class="nx-weight-badge">' + esc(group.weight) + '</span>' +
      '</span>' +
      '<h2 class="nx-domain-name">' + esc(group.name) + '</h2>' +
      '<span class="nx-domain-header-right">' +
        '<span class="nx-topic-count-badge">' + countLabel + '</span>' +
        '<span class="nx-chevron-icon" aria-hidden="true">' + (isOpen ? '▲' : '▼') + '</span>' +
      '</span>' +
      '</button>';
    const body = isOpen
      ? '<div class="nx-domain-body">' + group.modules.map(function (m) {
          return moduleBlock(m, new Set(progress().completed));
        }).join('') + '</div>'
      : '';
    return '<div class="nx-domain-card ' + (isOpen ? 'nx-domain-open' : 'nx-domain-closed') + '" data-domain-card="' + di + '">' +
      header + body + '</div>';
  }

  function domainChips(groups) {
    return '<div class="nx-domain-switch" role="group" aria-label="Switch domain">' +
      groups.map(function (g, di) {
        const active = di === openDomainIndex;
        return '<button type="button" class="nx-domain-chip' + (active ? ' is-active' : '') + '" data-domain-switch="' + di + '"' +
          (active ? ' disabled aria-current="true"' : '') +
          ' aria-label="' + esc(g.name) + ', ' + esc(g.weight) + '">D' + (di + 1) + ' ' + esc(g.weight) + '</button>';
      }).join('') +
      '</div>';
  }

  function renderList() {
    const groups = domainGroups();
    const target = resumeTarget();

    let html = '';
    if (target) {
      html += '<div class="course-resume">' +
        '<a class="btn gold course-resume-btn" href="course.html?lesson=' + encodeURIComponent(target.entry.lesson.id) + '">' +
        esc(target.verb) + ' "' + esc(target.entry.lesson.title) + '"</a></div>';
    }

    // Closed list is the four domain cards. An open domain is rendered first,
    // under the Notes domain-pill row, so it sits at the top. The other
    // domains stay collapsed cards below it, in domain order. Modules and
    // lessons stay in course order inside the open card. Reload starts closed.
    const order = groups.map(function (g, di) { return di; });
    if (openDomainIndex >= 0 && openDomainIndex < groups.length) {
      html += domainChips(groups);
      order.splice(openDomainIndex, 1);
      order.unshift(openDomainIndex);
    }
    html += order.map(function (di) {
      return domainCard(groups[di], di, di === openDomainIndex);
    }).join('');

    listView.innerHTML = html;
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }

  function renderLesson(lessonId) {
    const entry = lessonIndex.get(lessonId);
    if (!entry) { showList(); return; }
    const { module: m, lesson: l, flatIndex } = entry;
    currentFlat = flatIndex;
    Storage.setLastLesson(lessonId);

    const prev = navNeighbor(flatIndex, -1);
    const next = navNeighbor(flatIndex, 1);
    const done = isDone(lessonId);
    const optBanner = isOptional(l)
      ? '<div class="archive-banner">' + esc(l.badge || 'Not emphasized on 2026 PTCE') + ' — optional archive, skipped on the default study path.</div>'
      : '';

    let html = '<div class="lesson-header">' +
      '<div class="lesson-header-meta">' +
        '<span class="crumb">' + esc(domainPillText(m)) + '</span>' +
        '<span class="lesson-domain" title="' + esc(m.title) + '">' + esc(m.title) + '</span>' +
      '</div>' +
      '<h2 class="lesson-title-main">' + esc(l.title) + '</h2>' +
      '</div>' +
      optBanner +
      '<div class="lesson-layout">' +
      (l.keyPoints && l.keyPoints.length ?
        '<div class="key-points"><h3>⭐ Key Points to Remember</h3><ul>' +
        l.keyPoints.map(k => '<li>' + esc(k) + '</li>').join('') +
        '</ul></div>' : '') +
      '<div class="lesson-body"><ul>' +
      l.bullets.map(b => '<li>' + esc(b) + '</li>').join('') +
      '</ul></div>' +
      '</div>' +
      '<div class="lesson-actions">' +
        '<button class="btn ' + (done ? 'outline' : 'gold') + '" id="completeBtn">' + (done ? '✓ Completed' : 'Mark Complete') + '</button>' +
        '<a class="btn" href="' + quizUrl(m) + '">Test This Module</a>' +
      '</div>' +
      '<nav class="lesson-nav" aria-label="Lesson">' +
        lessonNavControl(prev, 'lesson-back', 'Back', NAV_BACK, false) +
        '<a class="btn ghost lesson-modules" href="course.html">' + NAV_MODULES + '<span>All Modules</span></a>' +
        lessonNavControl(next, 'lesson-next', 'Next', NAV_NEXT, true) +
      '</nav>';

    lessonView.innerHTML = html;
    fitLessonId = lessonId;
    titleRowScale = 1;
    fitLesson();

    Util.el('#completeBtn').addEventListener('click', function () {
      if (!isDone(lessonId)) {
        Storage.markLessonComplete(lessonId);
        renderLesson(lessonId); // re-render to show completed state
      }
    });
  }

  function lessonNavControl(entry, slot, label, icon, iconEnd) {
    if (!entry) return '<span class="lesson-nav-slot ' + slot + '"></span>';
    const title = entry.lesson.title;
    const href = 'course.html?lesson=' + encodeURIComponent(entry.lesson.id);
    const inner = iconEnd
      ? '<span>' + label + '</span>' + icon
      : icon + '<span>' + label + '</span>';
    return '<a class="btn ghost ' + slot + '" href="' + href + '" title="' + esc(title) + '" aria-label="' + esc(label + ': ' + title) + '">' + inner + '</a>';
  }

  function showList() {
    openDomainIndex = -1;
    document.body.classList.remove('lesson-open');
    lessonView.style.display = 'none';
    if (listWrap) listWrap.style.display = '';
    listView.style.display = '';
    renderList();
    document.title = 'Study Course · PTCE 2026';
  }

  function showLesson(lessonId) {
    document.body.classList.add('lesson-open');
    if (listWrap) listWrap.style.display = 'none';
    lessonView.style.display = '';
    renderLesson(lessonId);
    document.title = 'Lesson · PTCE 2026';
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  function route() {
    const params = new URLSearchParams(location.search);
    const lessonId = params.get('lesson');
    if (lessonId && lessonIndex.has(lessonId)) showLesson(lessonId);
    else showList();
  }

  window.addEventListener('popstate', route);

  let fitTimer = 0;
  window.addEventListener('resize', function () {
    if (!document.body.classList.contains('lesson-open')) return;
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitLesson, 60);
  });

  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () {
      fitLesson();
    });
  }

  // One open domain. The pill row switches domains without closing.
  // The header toggles that card to the top. Lesson links are left to the
  // router so a lesson still opens the full lesson page.
  listView.addEventListener('click', function (e) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const switchBtn = e.target.closest('[data-domain-switch]');
    if (switchBtn && !switchBtn.disabled && listView.contains(switchBtn)) {
      const idx = parseInt(switchBtn.getAttribute('data-domain-switch'), 10);
      if (!isNaN(idx) && idx !== openDomainIndex) {
        openDomainIndex = idx;
        renderList();
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      }
      return;
    }
    const toggleBtn = e.target.closest('[data-domain-toggle]');
    if (!toggleBtn || !listView.contains(toggleBtn)) return;
    const idx = parseInt(toggleBtn.getAttribute('data-domain-toggle'), 10);
    if (isNaN(idx)) return;
    openDomainIndex = (openDomainIndex === idx) ? -1 : idx;
    renderList();
    if (openDomainIndex >= 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const focusEl = listView.querySelector('[data-domain-card="' + idx + '"] .nx-domain-header');
    if (focusEl) focusEl.focus({ preventScroll: true });
  });

  // Intercept in-page navigation to update without full reload
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="course.html"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname === location.pathname) {
      e.preventDefault();
      history.pushState({}, '', a.href);
      route();
    }
  });

  Util.fetchJSON('data/course.json')
    .then(function (data) {
      course = data;
      buildIndexes();
      route();
    })
    .catch(function (err) {
      console.error(err);
      listView.style.display = 'none';
      loadErrorEl.style.display = 'block';
    });
})();
