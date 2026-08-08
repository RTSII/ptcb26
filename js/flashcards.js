// Flashcard deck: flip, prev/next, swipe, domain + spaced-repetition filters, bookmarking
(function () {
  const { Storage, Util, DOMAINS } = window.App;

  let allCards = [];
  let cards = [];
  let idx = 0;
  let mode = 'all'; // 'all' | 'due'
  const sessionReviewed = new Set();

  const el = {
    filterRow: Util.el('#filterRow'),
    flashcard: Util.el('#flashcard'),
    frontDomain: Util.el('#frontDomain'),
    frontText: Util.el('#frontText'),
    backDomain: Util.el('#backDomain'),
    backText: Util.el('#backText'),
    counter: Util.el('#counter'),
    prevBtn: Util.el('#prevBtn'),
    nextBtn: Util.el('#nextBtn'),
    flipBtn: Util.el('#flipBtn'),
    knewBtn: Util.el('#knewBtn'),
    didntKnowBtn: Util.el('#didntKnowBtn'),
    bookmarkBtn: Util.el('#bookmarkCardBtn')
  };

  const FILTERS = ['All', 'Due / New'].concat(DOMAINS);

  function buildFilters() {
    el.filterRow.innerHTML = '';
    FILTERS.forEach(function (d, i) {
      const b = document.createElement('button');
      b.className = 'pill' + (i === 0 ? ' active' : '');
      b.textContent = d;
      b.dataset.filter = d;
      b.addEventListener('click', function () {
        el.filterRow.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
        b.classList.add('active');
        applyFilter(d);
      });
      el.filterRow.appendChild(b);
    });
  }

  function applyFilter(f) {
    if (f === 'Due / New') {
      mode = 'due';
      const ids = allCards.map(c => c.id);
      const due = new Set(Storage.dueCards(ids));
      cards = allCards.filter(c => due.has(c.id));
    } else if (f === 'All') {
      mode = 'all';
      cards = allCards.slice();
    } else {
      mode = 'all';
      cards = allCards.filter(c => c.domain === f);
    }
    cards = Util.shuffle(cards);
    idx = 0;
    render();
  }

  function render() {
    if (!cards.length) {
      el.frontDomain.textContent = '';
      el.backDomain.textContent = '';
      el.frontText.textContent = mode === 'due'
        ? 'Nothing due right now. New cards and anything you missed will appear here.'
        : 'No cards in this domain.';
      el.backText.textContent = '';
      el.counter.textContent = '';
      updateBookmark();
      return;
    }
    el.flashcard.classList.remove('flipped');
    const c = cards[idx];
    el.frontDomain.textContent = c.domain;
    el.backDomain.textContent = c.domain;
    el.frontText.textContent = c.front;
    el.backText.textContent = c.back;
    el.counter.textContent = 'Card ' + (idx + 1) + ' of ' + cards.length;
    updateBookmark();

    if (!sessionReviewed.has(c.id)) {
      sessionReviewed.add(c.id);
      Storage.markReviewed(c.id);
    }
  }

  function updateBookmark() {
    if (!cards.length) { el.bookmarkBtn.textContent = '☆ Bookmark'; el.bookmarkBtn.classList.remove('bookmarked'); return; }
    const on = Storage.isBookmarked('card', cards[idx].id);
    el.bookmarkBtn.classList.toggle('bookmarked', on);
    el.bookmarkBtn.textContent = on ? '★ Bookmarked' : '☆ Bookmark';
    el.bookmarkBtn.setAttribute('aria-pressed', on);
  }

  function flip() { el.flashcard.classList.toggle('flipped'); }
  function next() { if (cards.length) { idx = (idx + 1) % cards.length; render(); } }
  function prev() { if (cards.length) { idx = (idx - 1 + cards.length) % cards.length; render(); } }

  function grade(knew) {
    if (!cards.length) return;
    Storage.gradeCard(cards[idx].id, knew);
    next();
  }

  el.flashcard.addEventListener('click', flip);
  el.flipBtn.addEventListener('click', function (e) { e.stopPropagation(); flip(); });
  el.nextBtn.addEventListener('click', next);
  el.prevBtn.addEventListener('click', prev);
  el.knewBtn.addEventListener('click', function () { grade(true); });
  el.didntKnowBtn.addEventListener('click', function () { grade(false); });
  el.bookmarkBtn.addEventListener('click', function () {
    if (!cards.length) return;
    Storage.toggleBookmark('card', cards[idx].id);
    updateBookmark();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
  });

  let startX = 0, startY = 0, touching = false;
  el.flashcard.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX; startY = e.touches[0].clientY; touching = true;
  }, { passive: true });
  el.flashcard.addEventListener('touchend', function (e) {
    if (!touching) return;
    touching = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
  });

  Util.fetchJSON('data/flashcards.json')
    .then(function (data) {
      allCards = data.cards || [];
      buildFilters();
      applyFilter('All');
    })
    .catch(function () {
      el.frontText.textContent = 'Could not load flashcards. If opening the file directly, run a local server (see README).';
    });
})();
