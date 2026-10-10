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
  const FIT_OVERFLOW = 60;
  const FIT_HEAD_OVERFLOW = 100;
  // These four still overflow after the body floor. Title and intro may scale
  // for them only, so every other lesson keeps the body-only rule.
  const HEAD_FIT = { m4l3: 1, m6l2: 1, m7l2: 1, m10l1: 1 };
  let fitLessonId = '';

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

  function fitLessonBody() {
    const layout = document.querySelector('.lesson-layout');
    const body = layout && layout.querySelector('.lesson-body');
    const title = document.querySelector('.lesson-title-main');
    const intro = document.querySelector('.lesson-intro');
    if (!layout || !body) return;
    const lis = body.querySelectorAll('li');
    const allowHead = !!HEAD_FIT[fitLessonId];
    function applyBody(scale) {
      const size = scale === 1 ? '' : 'calc(1.35rem * ' + scale + ')';
      for (let i = 0; i < lis.length; i++) lis[i].style.fontSize = size;
    }
    function applyHead(scale, margins) {
      if (!title || !intro) return;
      if (scale === 1) {
        title.style.fontSize = '';
        intro.style.fontSize = '';
        title.style.marginBottom = '';
        intro.style.marginBottom = '';
        return;
      }
      title.style.fontSize = 'calc(1.9rem * ' + scale + ')';
      intro.style.fontSize = 'calc(1.45rem * ' + scale + ')';
      title.style.marginBottom = margins ? (8 * scale) + 'px' : '';
      intro.style.marginBottom = margins ? (12 * scale) + 'px' : '';
    }
    function bodyFits() {
      return layout.scrollHeight - layout.clientHeight <= 1 && lessonTextPast(layout) <= 1;
    }
    function headFits() {
      return layout.scrollHeight - layout.clientHeight <= 0.5 && lessonTextPast(layout) <= 1;
    }
    applyBody(1);
    applyHead(1, false);
    const initial = lessonTextPast(layout);
    if (initial <= 4 || initial > (allowHead ? FIT_HEAD_OVERFLOW : FIT_OVERFLOW)) return;
    for (let s = 0; s < BODY_SCALES.length; s++) {
      applyBody(BODY_SCALES[s]);
      if (bodyFits()) return;
    }
    if (allowHead) {
      applyBody(0.92);
      for (let h = 0; h < HEAD_SCALES.length; h++) {
        applyHead(HEAD_SCALES[h], false);
        if (headFits()) return;
      }
      for (let h = 0; h < HEAD_SCALES.length; h++) {
        applyHead(HEAD_SCALES[h], true);
        if (headFits()) return;
      }
    }
    applyBody(1);
    applyHead(1, false);
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

  function renderList() {
    const groups = domainGroups();
    const target = resumeTarget();

    let html = '';
    if (target) {
      html += '<div class="course-resume">' +
        '<a class="btn gold course-resume-btn" href="course.html?lesson=' + encodeURIComponent(target.entry.lesson.id) + '">' +
        esc(target.verb) + ' "' + esc(target.entry.lesson.title) + '"</a></div>';
    }

    // Closed list is the four domain cards. An open domain is rendered first
    // so it sits at the top; the other domains stay collapsed cards below it,
    // in domain order. Modules and lessons stay in course order inside the
    // open card. Reload starts closed.
    const order = groups.map(function (g, di) { return di; });
    if (openDomainIndex >= 0 && openDomainIndex < groups.length) {
      order.splice(openDomainIndex, 1);
      order.unshift(openDomainIndex);
    }
    html += order.map(function (di) {
      return domainCard(groups[di], di, di === openDomainIndex);
    }).join('');

    listView.innerHTML = html;
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
      '<span class="crumb">' + esc(domainPillText(m)) + '</span>' +
      '<span class="lesson-domain">' + esc(m.title) + '</span>' +
      '</div>' +
      optBanner +
      '<h2 class="lesson-title-main">' + esc(l.title) + '</h2>' +
      '<p class="lesson-intro">' + esc(l.intro) + '</p>' +
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
    fitLessonBody();

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
    fitTimer = setTimeout(fitLessonBody, 60);
  });

  // One open domain. The header toggles that card to the top. Lesson links
  // are left to the router so a lesson still opens the full lesson page.
  listView.addEventListener('click', function (e) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
