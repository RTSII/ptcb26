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
  let openModuleId = null;     // one accordion at a time; null = all closed

  function esc(s) { return Util.escapeHtml(String(s)); }

  function buildIndexes() {
    moduleIndex.clear();
    lessonIndex.clear();
    flatLessons = [];
    course.modules.forEach(function (m) {
      moduleIndex.set(m.id, m);
      m.lessons.forEach(function (l) {
        lessonIndex.set(l.id, { module: m, lesson: l, flatIndex: flatLessons.length });
        flatLessons.push({ module: m, lesson: l });
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

  function renderList() {
    const done = new Set(progress().completed);
    const labels = moduleLabels(course.modules);
    const target = resumeTarget();
    document.body.classList.toggle('course-reading', !!openModuleId);

    let html = '';
    if (target) {
      html += '<div class="course-resume">' +
        '<a class="btn gold course-resume-btn" href="course.html?lesson=' + encodeURIComponent(target.entry.lesson.id) + '">' +
        esc(target.verb) + ' "' + esc(target.entry.lesson.title) + '"</a></div>';
    }

    // One module open at a time. The open card is rendered first so it sits
    // under the header once the idle spacer eases shut. Reload and returning
    // to the list both start closed (openModuleId is cleared in showList).
    const ordered = course.modules.map(function (m, mi) { return { m: m, mi: mi }; });
    if (openModuleId) {
      const at = ordered.findIndex(function (x) { return x.m.id === openModuleId; });
      if (at > 0) ordered.unshift(ordered.splice(at, 1)[0]);
    }

    html += ordered.map(function (item) {
      const m = item.m;
      const mi = item.mi;
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
      const label = labels[mi];
      const isOpen = openModuleId === m.id;
      return '<details class="module' + (mpct === 100 ? ' module-complete' : '') + '" data-module-id="' + esc(m.id) + '"' + (isOpen ? ' open' : '') + '>' +
        '<summary>' +
          '<span class="module-pill">D' + label.domainNum + '·' + label.chapter + '</span>' +
          '<span class="module-title">' + esc(m.title) + '</span>' +
          '<span class="module-meta">' + completed + '/' + featured.length + '</span>' +
        '</summary>' +
        '<div class="module-body">' +
          '<p class="module-desc">' + esc(m.desc) + '</p>' +
          '<div class="bar-track module-bar"><div class="bar-fill" style="width:' + mpct + '%"></div></div>' +
          '<div class="lesson-list">' + lessons + archive + '</div>' +
          '<a class="btn gold module-quiz" href="' + quizUrl(m) + '">Test Yourself: ' + esc(m.domain) + ' Quiz</a>' +
        '</div>' +
        '</details>';
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
      '<span class="crumb">' + esc(m.domain) + '</span>' +
      '<span class="lesson-domain">' + esc(m.title) + '</span>' +
      '</div>' +
      optBanner +
      '<h2 class="lesson-title-main">' + esc(l.title) + '</h2>' +
      '<p class="lesson-intro">' + esc(l.intro) + '</p>' +
      '<div class="lesson-layout">' +
      '<div class="lesson-body"><ul>' +
      l.bullets.map(b => '<li>' + esc(b) + '</li>').join('') +
      '</ul></div>' +
      (l.keyPoints && l.keyPoints.length ?
        '<div class="key-points"><h3>⭐ Key Points to Remember</h3><ul>' +
        l.keyPoints.map(k => '<li>' + esc(k) + '</li>').join('') +
        '</ul></div>' : '') +
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
    openModuleId = null;
    document.body.classList.remove('lesson-open', 'course-reading');
    lessonView.style.display = 'none';
    if (listWrap) listWrap.style.display = '';
    listView.style.display = 'block';
    renderList();
    document.title = 'Study Course · PTCE 2026';
  }

  function showLesson(lessonId) {
    document.body.classList.add('lesson-open');
    document.body.classList.remove('course-reading');
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

  // One open accordion. preventDefault keeps the native details toggle from
  // opening a second card; renderList applies the single open attribute.
  listView.addEventListener('click', function (e) {
    const summary = e.target.closest('.module > summary');
    if (!summary || !listView.contains(summary)) return;
    const details = summary.parentElement;
    if (!details) return;
    e.preventDefault();
    const id = details.getAttribute('data-module-id');
    openModuleId = (openModuleId === id) ? null : id;
    renderList();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (openModuleId) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const focusSel = '.module[data-module-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"] > summary';
    const focusEl = listView.querySelector(focusSel);
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
