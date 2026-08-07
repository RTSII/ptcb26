// Flashcard deck: flip, prev/next, swipe, domain filter, reviewed tracking
(function () {
  const { Storage, Util, DOMAINS } = window.App;

  let allCards = [];
  let cards = [];
  let idx = 0;
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
    flipBtn: Util.el('#flipBtn')
  };

  function buildFilters() {
    const domains = ['All'].concat(DOMAINS);
    el.filterRow.innerHTML = '';
    domains.forEach(function (d, i) {
      const b = document.createElement('button');
      b.className = 'pill' + (i === 0 ? ' active' : '');
      b.textContent = d;
      b.dataset.domain = d;
      b.addEventListener('click', function () {
        el.filterRow.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
        b.classList.add('active');
        applyFilter(d);
      });
      el.filterRow.appendChild(b);
    });
  }

  function applyFilter(domain) {
    cards = domain === 'All' ? allCards.slice() : allCards.filter(function (c) { return c.domain === domain; });
    cards = Util.shuffle(cards);
    idx = 0;
    render();
  }

  function render() {
    if (!cards.length) {
      el.frontText.textContent = 'No cards in this domain.';
      el.backText.textContent = '';
      el.counter.textContent = '';
      return;
    }
    el.flashcard.classList.remove('flipped');
    const c = cards[idx];
    el.frontDomain.textContent = c.domain;
    el.backDomain.textContent = c.domain;
    el.frontText.textContent = c.front;
    el.backText.textContent = c.back;
    el.counter.textContent = 'Card ' + (idx + 1) + ' of ' + cards.length;

    if (!sessionReviewed.has(c.id)) {
      sessionReviewed.add(c.id);
      Storage.markReviewed(c.id);
    }
  }

  function flip() { el.flashcard.classList.toggle('flipped'); }
  function next() { if (cards.length) { idx = (idx + 1) % cards.length; render(); } }
  function prev() { if (cards.length) { idx = (idx - 1 + cards.length) % cards.length; render(); } }

  el.flashcard.addEventListener('click', flip);
  el.flipBtn.addEventListener('click', function (e) { e.stopPropagation(); flip(); });
  el.nextBtn.addEventListener('click', next);
  el.prevBtn.addEventListener('click', prev);

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
