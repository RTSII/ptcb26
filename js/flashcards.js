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
    frontText: Util.el('#frontText'),
    backText: Util.el('#backText'),
    counter: Util.el('#counter'),
    prevBtn: Util.el('#prevBtn'),
    nextBtn: Util.el('#nextBtn'),
    flipBtn: Util.el('#flipBtn'),
    knewBtn: Util.el('#knewBtn'),
    didntKnowBtn: Util.el('#didntKnowBtn'),
    bookmarkBtn: Util.el('#bookmarkCardBtn')
  };

  const FILTERS = ['All', 'Due / New', 'Bookmarked'].concat(DOMAINS);

  function filterLabel(name) {
    return name.replace(/\band\b/gi, '&').replace(/Quality Assurance/g, 'Q.A.');
  }

  function buildFilters() {
    el.filterRow.innerHTML = '';
    FILTERS.forEach(function (d, i) {
      const b = document.createElement('button');
      const label = filterLabel(d);
      b.className = 'pill' + (i === 0 ? ' active' : '');
      b.type = 'button';
      b.textContent = label;
      b.dataset.filter = d;
      if (label !== d) {
        b.title = d;
        b.setAttribute('aria-label', d);
      }
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
      const ids = allCards.map(c => String(c.id));
      const due = new Set(Storage.dueCards(ids).map(String));
      cards = allCards.filter(c => due.has(String(c.id)));
    } else if (f === 'Bookmarked') {
      mode = 'bookmarked';
      const bm = new Set(Storage.getBookmarks('card').map(String));
      cards = allCards.filter(c => bm.has(String(c.id)));
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

  // Short prompts use a large ceiling; paragraphs start smaller and shrink until
  // they fit the face. Measured in px so a long answer cannot overflow the card.
  function maxFontPx(text) {
    var t = (text || '').trim();
    var words = t ? t.split(/\s+/).length : 0;
    var n = t.length;
    if (!n) return 40;
    if (n <= 18 && words <= 3) return 108;
    if (n <= 48) return 80;
    if (n <= 100) return 64;
    if (n <= 180) return 50;
    return 42;
  }

  function fitCardText(textEl) {
    if (!textEl) return;
    var face = textEl.closest('.face');
    if (!face) return;
    var sample = textEl.textContent || '';
    var cs = window.getComputedStyle(face);
    var padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    var maxH = face.clientHeight - padY - 4;
    if (maxH < 28 || face.clientWidth < 80) return;

    var trimmed = sample.trim();
    var words = trimmed ? trimmed.split(/\s+/).length : 0;
    var singleLine = words > 0 && words <= 2 && trimmed.length <= 18;
    var hi = maxFontPx(sample);
    var lo = 16;

    function apply(px) {
      textEl.style.fontSize = px + 'px';
      textEl.style.lineHeight = px >= 64 ? '1.08' : px >= 42 ? '1.16' : '1.34';
      textEl.style.fontWeight = px >= 48 ? '700' : '600';
      textEl.style.letterSpacing = px >= 64 ? '-0.02em' : '0';
      textEl.style.textWrap = trimmed.length < 110 ? 'balance' : 'pretty';
    }

    function fits(px) {
      apply(px);
      if (singleLine) {
        textEl.style.whiteSpace = 'nowrap';
        var wide = textEl.scrollWidth > textEl.clientWidth + 1;
        textEl.style.whiteSpace = '';
        if (wide) return false;
      }
      return textEl.scrollHeight <= maxH + 1;
    }

    if (fits(hi)) return;
    var best = lo;
    var low = lo;
    var high = hi - 1;
    while (low <= high) {
      var mid = (low + high) >> 1;
      if (fits(mid)) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    apply(best);
    textEl.style.whiteSpace = '';
  }

  var fitFrame = 0;
  var lastFitSig = '';
  function fitBoth() {
    if (fitFrame) cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(function () {
      fitFrame = 0;
      var sig = el.flashcard.clientWidth + 'x' + el.flashcard.clientHeight
        + '|' + (el.frontText.textContent || '')
        + '|' + (el.backText.textContent || '');
      if (sig === lastFitSig) return;
      lastFitSig = sig;
      fitCardText(el.frontText);
      fitCardText(el.backText);
    });
  }

  function render() {
    if (!cards.length) {
      if (mode === 'due') {
        el.frontText.textContent = 'Nothing due right now. New cards and anything you missed will appear here.';
      } else if (mode === 'bookmarked') {
        el.frontText.textContent = 'No bookmarked cards yet. Tap the star while studying a card.';
      } else {
        el.frontText.textContent = 'No cards in this domain.';
      }
      el.backText.textContent = '';
      el.counter.textContent = '';
      updateBookmark();
      fitBoth();
      return;
    }
    const wasFlipped = el.flashcard.classList.contains('flipped');
    if (wasFlipped) {
      el.flashcard.style.transition = 'none';
      el.flashcard.classList.remove('flipped');
    }
    const c = cards[idx];
    el.frontText.textContent = c.front;
    el.backText.textContent = c.back;
    el.counter.textContent = 'Card ' + (idx + 1) + ' of ' + cards.length;
    updateBookmark();
    if (wasFlipped) {
      void el.flashcard.offsetWidth;
      el.flashcard.style.transition = '';
    }
    fitBoth();

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
  el.nextBtn.addEventListener('click', function (e) { e.stopPropagation(); next(); });
  el.prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
  el.knewBtn.addEventListener('click', function () { grade(true); });
  el.didntKnowBtn.addEventListener('click', function () { grade(false); });
  el.bookmarkBtn.addEventListener('click', function () {
    if (!cards.length) return;
    Storage.toggleBookmark('card', cards[idx].id);
    updateBookmark();
  });

  document.addEventListener('keydown', function (e) {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' || e.key === 'Enter') {
      if (tag === 'BUTTON' || tag === 'A') return;
      e.preventDefault();
      flip();
    }
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

  if (window.ResizeObserver) {
    var cardObserver = new ResizeObserver(function () { fitBoth(); });
    cardObserver.observe(el.flashcard.parentElement || el.flashcard);
  } else {
    window.addEventListener('resize', fitBoth);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      lastFitSig = '';
      fitBoth();
    });
  }

  Util.fetchJSON('data/flashcards.json')
    .then(function (data) {
      allCards = (data.cards || []).map(function (c) {
        var copy = Object.assign({}, c);
        copy.id = String(c.id);
        return copy;
      });
      buildFilters();
      applyFilter('All');
    })
    .catch(function () {
      el.frontText.textContent = 'Could not load flashcards. If opening the file directly, run a local server (see README).';
    });
})();
