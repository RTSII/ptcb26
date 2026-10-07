// Home Dashboard Dynamic Telemetry & Course Linker
(function () {
  'use strict';

  function esc(s) {
    return (window.App && App.Util && App.Util.escapeHtml)
      ? App.Util.escapeHtml(String(s || ''))
      : String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function loadCourseMeta() {
    try {
      if (!window.App || !App.Util || !App.Storage) return;
      const course = await App.Util.fetchJSON('data/course.json');
      const progress = App.Storage.getCourseProgress();
      const doneSet = new Set(progress.completed || []);

      let totalLessons = 0;
      let completedLessons = 0;
      const domainStats = {};
      let firstUnfinishedLesson = null;
      let lastLessonObj = null;

      (course.modules || []).forEach(m => {
        const dom = m.domain || 'Medications';
        if (!domainStats[dom]) {
          domainStats[dom] = { completed: 0, total: 0 };
        }
        (m.lessons || []).forEach(l => {
          totalLessons++;
          domainStats[dom].total++;
          const done = doneSet.has(l.id);
          if (done) {
            completedLessons++;
            domainStats[dom].completed++;
          } else if (!firstUnfinishedLesson) {
            firstUnfinishedLesson = { lesson: l, module: m };
          }
          if (progress.lastLesson === l.id) {
            lastLessonObj = { lesson: l, module: m };
          }
        });
      });

      // Update total lesson count & completed count
      const totalEl = document.getElementById('hxLessonTotal');
      if (totalEl) totalEl.textContent = String(totalLessons);

      const lessonsEl = document.getElementById('homeLessons');
      if (lessonsEl) lessonsEl.textContent = String(completedLessons);

      // Percentage calculation
      const pct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const pctEl = document.getElementById('hxCoursePct');
      if (pctEl) {
        pctEl.innerHTML = `${pct}<small>%</small>`;
      }

      // Reactor ring arc progress
      const ringProg = document.getElementById('hxRingProg');
      if (ringProg) {
        ringProg.style.setProperty('--pct', String(pct));
      }

      // Next / Resume lesson button & banner
      const target = lastLessonObj || firstUnfinishedLesson;
      const nextEl = document.getElementById('hxCourseNext');
      const ctaEl = document.getElementById('hxCourseCtaText');
      const courseLink = document.getElementById('hxCourseLink');
      const kickerEl = document.getElementById('hxCourseKicker');

      if (target && target.lesson) {
        if (completedLessons > 0) {
          if (kickerEl) kickerEl.textContent = 'Continue Training';
          if (nextEl) {
            nextEl.innerHTML = `<span>NEXT</span> ${esc(target.module.title)}: ${esc(target.lesson.title)}`;
          }
          if (ctaEl) ctaEl.textContent = 'Resume Lesson';
        } else {
          if (kickerEl) kickerEl.textContent = 'Start Here';
          if (nextEl) {
            nextEl.innerHTML = `<span>NEXT</span> ${esc(target.module.title)}: ${esc(target.lesson.title)}`;
          }
          if (ctaEl) ctaEl.textContent = 'Open Course';
        }
        if (courseLink && target.lesson.id) {
          courseLink.href = `course.html?lesson=${encodeURIComponent(target.lesson.id)}`;
        }
      }

      // Per-domain progress indicators
      const domainsEl = document.getElementById('hxDomains');
      if (domainsEl) {
        const domList = [
          { key: 'Medications', label: 'Medications' },
          { key: 'Patient Safety and Quality Assurance', label: 'Patient Safety' },
          { key: 'Order Entry and Processing', label: 'Order Entry' },
          { key: 'Federal Requirements', label: 'Federal' }
        ];

        domainsEl.innerHTML = domList.map(d => {
          const s = domainStats[d.key] || { completed: 0, total: 1 };
          const p = s.total ? Math.round((s.completed / s.total) * 100) : 0;
          return `
            <div class="hx-dom">
              <span class="hx-dom-name">${esc(d.label)} <em>${s.completed}/${s.total}</em></span>
              <span class="hx-dom-bar"><i style="--p:${p}"></i></span>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.warn('Course metadata load note:', err);
    }
  }

  function loadAuxTelemetry() {
    if (!window.App || !App.Storage) return;
    const p = App.Storage.read();

    // 1. Quizzes stats
    const quizzes = p.quizzes.length;
    const scoreOf = (a) => (typeof a.score === 'number' ? a.score : App.Util.pct(a.correct || 0, a.total || 0));
    const avg = quizzes
      ? Math.round(p.quizzes.reduce((sum, attempt) => sum + scoreOf(attempt), 0) / quizzes)
      : null;

    const quizData = document.getElementById('hxQuizData');
    if (quizData) {
      const missedCount = Object.keys(p.missed || {}).length;
      if (missedCount > 0) {
        quizData.innerHTML = `<span class="warn">${missedCount} missed</span> ready for review`;
      } else if (quizzes > 0) {
        quizData.innerHTML = `<b>${quizzes}</b> attempts logged · <b>${avg}%</b> avg`;
      } else {
        quizData.textContent = 'Pick a domain to begin';
      }
    }

    // 2. Flashcards stats (cards due today)
    const flashData = document.getElementById('hxFlashData');
    if (flashData) {
      const reviewedCount = p.flashcards?.reviewed?.length || 0;
      const knownCount = p.flashcards?.known?.length || 0;
      if (reviewedCount > 0) {
        flashData.innerHTML = `<b>${knownCount}</b> mastered / <b>${reviewedCount}</b> seen`;
      } else {
        flashData.textContent = 'No cards due';
      }
    }

    // 3. Exams stats
    const examBest = document.getElementById('hxExamBest');
    if (examBest) {
      if (p.exams && p.exams.length > 0) {
        const best = Math.max(...p.exams.map(e => (typeof e.score === 'number' ? e.score : App.Util.pct(e.correct || 0, e.total || 0))));
        examBest.textContent = `${best}%`;
      } else {
        examBest.textContent = '—';
      }
    }
  }

  function init() {
    loadCourseMeta();
    loadAuxTelemetry();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
