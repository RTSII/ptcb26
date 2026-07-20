/* Flashcard deck: flip, prev/next, swipe, domain filter */
(function () {
  "use strict";
  var P = window.PTCE;

  var allCards = [];
  var cards = [];
  var idx = 0;
  var reviewedIds = {};

  var el = {
    filterRow: document.getElementById("filterRow"),
    flashcard: document.getElementById("flashcard"),
    frontDomain: document.getElementById("frontDomain"),
    frontText: document.getElementById("frontText"),
    backDomain: document.getElementById("backDomain"),
    backText: document.getElementById("backText"),
    counter: document.getElementById("counter"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    flipBtn: document.getElementById("flipBtn")
  };

  function buildFilters() {
    var domains = ["All"].concat(P.DOMAINS);
    el.filterRow.innerHTML = "";
    domains.forEach(function (d, i) {
      var b = document.createElement("button");
      b.className = "pill" + (i === 0 ? " active" : "");
      b.textContent = d === "All" ? "All" : P.domainLabel(d);
      b.dataset.domain = d;
      b.addEventListener("click", function () {
        el.filterRow.querySelectorAll(".pill").forEach(function (p) { p.classList.remove("active"); });
        b.classList.add("active");
        applyFilter(d);
      });
      el.filterRow.appendChild(b);
    });
  }

  function applyFilter(domain) {
    cards = domain === "All" ? allCards.slice() : allCards.filter(function (c) { return c.domain === domain; });
    cards = P.shuffle(cards);
    idx = 0;
    render();
  }

  function render() {
    if (!cards.length) {
      el.frontText.textContent = "No cards in this domain.";
      el.backText.textContent = "";
      el.counter.textContent = "";
      return;
    }
    el.flashcard.classList.remove("flipped");
    var c = cards[idx];
    el.frontDomain.textContent = P.domainLabel(c.domain);
    el.backDomain.textContent = P.domainLabel(c.domain);
    el.frontText.textContent = c.front;
    el.backText.textContent = c.back;
    el.counter.textContent = "Card " + (idx + 1) + " of " + cards.length;

    if (!reviewedIds[c.id]) {
      reviewedIds[c.id] = true;
      P.incrementCardsReviewed(1);
    }
  }

  function flip() { el.flashcard.classList.toggle("flipped"); }
  function next() { if (cards.length) { idx = (idx + 1) % cards.length; render(); } }
  function prev() { if (cards.length) { idx = (idx - 1 + cards.length) % cards.length; render(); } }

  el.flashcard.addEventListener("click", flip);
  el.flipBtn.addEventListener("click", function (e) { e.stopPropagation(); flip(); });
  el.nextBtn.addEventListener("click", next);
  el.prevBtn.addEventListener("click", prev);

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
  });

  // Swipe
  var startX = 0, startY = 0, touching = false;
  el.flashcard.addEventListener("touchstart", function (e) {
    startX = e.touches[0].clientX; startY = e.touches[0].clientY; touching = true;
  }, { passive: true });
  el.flashcard.addEventListener("touchend", function (e) {
    if (!touching) return;
    touching = false;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
  });

  P.loadJSON("data/flashcards.json")
    .then(function (data) {
      allCards = data.cards || [];
      buildFilters();
      applyFilter("All");
    })
    .catch(function () {
      el.frontText.textContent = "Could not load flashcards. If opening the file directly, run a local server (see README).";
    });
})();
