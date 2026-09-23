import { $, pixelIcon } from '../shared/dom.js';
export function createEffects(preferences) {
  const desktop = $('#desktop');
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let starAnimation = 0;
  let starsRunning = false;
  function updateStars() {
    const enabled = preferences.floatingStars && !reducedMotion.matches;
    if (enabled === starsRunning) return;
    starsRunning = enabled;
    cancelAnimationFrame(starAnimation);
    const effects = $("#effects");
    effects.replaceChildren();
    if (!enabled) return;
    const stars = Array.from({ length: 16 }, (_, index) => {
      const star = pixelIcon("star", "floating-star");
      effects.append(star);
      return { element: star, offset: index * 89, speed: 12 + index % 7, x: (index * 37 + 7) % 100 };
    });
    let previousTick = -Infinity;
    const animate = (time) => {
      if (time - previousTick >= 80) {
        const width = desktop.clientWidth;
        const height = desktop.clientHeight + 32;
        for (const star of stars) {
          const x = Math.round((width * star.x / 100) / 2) * 2;
          const y = Math.round(((time / 1000 * star.speed + star.offset) % height - 24) / 2) * 2;
          star.element.style.transform = `translate(${x}px, ${y}px)`;
        }
        previousTick = time;
      }
      starAnimation = requestAnimationFrame(animate);
    };
    starAnimation = requestAnimationFrame(animate);
  }
  reducedMotion.addEventListener("change", updateStars);
  return updateStars;
}
