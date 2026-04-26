(function () {
  const links = Array.from(document.querySelectorAll('.masonry-item a'));
  if (links.length === 0) return;

  // Build the lightbox in JS and append to <body> so it escapes any
  // theme styles applied inside <section> / .wrapper.
  function el(tag, cls, attrs) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  const overlay = el('div', 'lightbox-overlay', { id: 'lightbox' });
  overlay.hidden = true;

  const closeBtn = el('button', 'lb-close', { type: 'button', 'aria-label': 'Close' });
  closeBtn.textContent = '×'; // ×

  const prevBtn = el('button', 'lb-prev', { type: 'button', 'aria-label': 'Previous' });
  prevBtn.textContent = '‹'; // ‹

  const imgEl = el('img', 'lb-img', { src: '', alt: '' });

  const nextBtn = el('button', 'lb-next', { type: 'button', 'aria-label': 'Next' });
  nextBtn.textContent = '›'; // ›

  const counter = el('div', 'lb-counter');

  overlay.append(closeBtn, prevBtn, imgEl, nextBtn, counter);
  document.body.appendChild(overlay);

  let idx = 0;

  function show(i) {
    idx = (i + links.length) % links.length;
    imgEl.src = links[idx].dataset.full || links[idx].href;
    counter.textContent = (idx + 1) + ' / ' + links.length;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function hide() {
    overlay.hidden = true;
    imgEl.src = '';
    document.body.style.overflow = '';
  }

  links.forEach((a, i) => a.addEventListener('click', e => {
    e.preventDefault();
    show(i);
  }));

  closeBtn.addEventListener('click', hide);
  prevBtn.addEventListener('click', () => show(idx - 1));
  nextBtn.addEventListener('click', () => show(idx + 1));
  overlay.addEventListener('click', e => { if (e.target === overlay) hide(); });
  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
})();
