export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollToMonth(key: string, behavior: ScrollBehavior = 'smooth'): void {
  const scroller = document.querySelector<HTMLElement>('.scrollport');
  const target = document.getElementById(`month-${key}`);
  if (!scroller || !target) return;
  const motion = prefersReducedMotion() ? 'auto' : behavior;
  const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  scroller.style.scrollSnapType = 'none';
  if (motion === 'auto') {
    scroller.scrollTop = top;
    requestAnimationFrame(() => {
      scroller.style.scrollSnapType = '';
    });
    return;
  }
  scroller.scrollTo({ top, behavior: 'smooth' });
  const restore = () => {
    scroller.style.scrollSnapType = '';
    scroller.removeEventListener('scrollend', restore);
  };
  scroller.addEventListener('scrollend', restore);
  window.setTimeout(restore, 700);
}
