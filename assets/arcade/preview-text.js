// All cabinet previews use Retro Arcade's text treatment and typing pace.
export function typePreviewText(canvas, paintBackground, lines, draw) {
  const context = canvas.getContext('2d');
  const font = getComputedStyle(document.querySelector('#retro-panel')).fontFamily;
  const prepared = lines.map(line => {
    let size = line.size;
    context.font = `${size}px ${font}`;
    while (line.fitWidth && context.measureText(line.text).width > line.fitWidth) context.font = `${--size}px ${font}`;
    return { ...line, font: context.font };
  });
  const total = lines.reduce((count, line) => count + line.text.length, 0);
  const start = performance.now(), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function type(now) {
    let remaining = reduce ? total : Math.min(total, Math.floor((now - start) / 45));
    const complete = remaining === total;
    context.clearRect(0, 0, canvas.width, canvas.height);
    paintBackground(context);
    context.fillStyle = '#39ff6a'; context.textAlign = 'center';
    context.shadowColor = '#39ff6a30'; context.shadowBlur = 3;
    for (const line of prepared) {
      context.font = line.font;
      const text = line.text.slice(0, Math.max(0, remaining));
      if (line.maxWidth) context.fillText(text, canvas.width / 2, line.y, line.maxWidth);
      else context.fillText(text, canvas.width / 2, line.y);
      remaining -= line.text.length;
    }
    context.shadowBlur = 0;
    if (draw(canvas) && !complete) requestAnimationFrame(type);
  }
  type(start);
}
