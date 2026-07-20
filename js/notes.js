/* Study Notes: render collapsible per-domain reference from notes.json */
(function () {
  "use strict";
  var P = window.PTCE;
  var area = document.getElementById("notesArea");

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render(domains) {
    if (!domains || !domains.length) {
      area.innerHTML = '<p class="empty-state">No notes available.</p>';
      return;
    }
    var html = domains.map(function (d, di) {
      var sections = d.sections.map(function (s) {
        var items = s.items.map(function (it) { return '<li>' + esc(it) + '</li>'; }).join("");
        return '<div class="note-section"><h4>' + esc(s.title) + '</h4><ul>' + items + '</ul></div>';
      }).join("");
      return '<details class="note-domain"' + (di === 0 ? " open" : "") + '>' +
        '<summary>' + esc(d.domain) + '<span class="weight-badge">' + esc(d.weight) + '</span></summary>' +
        '<div class="note-body"><p class="note-summary">' + esc(d.summary) + '</p>' + sections + '</div>' +
        '</details>';
    }).join("");
    area.innerHTML = html;
  }

  P.loadJSON("data/notes.json")
    .then(function (data) { render(data.domains || []); })
    .catch(function () {
      area.innerHTML = '<p class="empty-state">Could not load notes. If opening the file directly, run a local server (see README).</p>';
    });
})();
