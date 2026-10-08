// GitHub Pages serves a tiny entry document for each published route. Reuse the
// homepage shell at the original URL; its root base resolves all shared assets.
fetch('/index.html').then(response => {
  if (!response.ok) throw new Error('Arcade shell unavailable');
  return response.text();
}).then(html => {
  document.open();
  document.write(html);
  document.close();
}).catch(() => {
  document.body.textContent = 'The arcade could not load. Please reload to try again.';
});
