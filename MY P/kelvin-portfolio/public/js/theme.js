/* theme.js — set theme before first paint to avoid a flash */
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
  } catch (e) { /* private mode — keep default */ }
})();
