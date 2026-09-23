export function initializeWallpaper(config) {
  "use strict";
  const desktop = document.querySelector("#desktop");
  document.documentElement.style.setProperty('--desktop', config.themeColor || '#2d2f2d');
  desktop.style.backgroundImage = 'url(' + JSON.stringify(new URL(config.wallpaper, document.baseURI).href) + ')';
  desktop.style.backgroundPosition = config.wallpaperPosition || 'center center';
  const canvas = document.querySelector("#wallpaper-edges");
  const context = canvas.getContext("2d");
  if (!context) return;

  const source = new Image();
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let frame = 0;

  // Computed background-position uses percentages or lengths for ordinary
  // keyword, percentage and pixel positions. Unusual calc() forms use center.
  const positionOffset = (value, available) => {
    if (value.endsWith("%")) return available * parseFloat(value) / 100;
    if (value.endsWith("px")) return parseFloat(value);
    return available / 2;
  };

  function draw() {
    frame = 0;
    if (!source.naturalWidth || !source.naturalHeight) return;
    const width = desktop.clientWidth;
    const height = desktop.clientHeight;
    if (!width || !height) return;
    const density = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);

    const style = getComputedStyle(desktop);
    context.fillStyle = style.backgroundColor;
    const scale = Math.min(width / source.naturalWidth, height / source.naturalHeight);
    const imageWidth = source.naturalWidth * scale;
    const imageHeight = source.naturalHeight * scale;
    const position = style.backgroundPosition.split(/\s+/);
    const left = positionOffset(position[0], width - imageWidth);
    const top = positionOffset(position[1] || "50%", height - imageHeight);
    const pixel = 2;
    const feather = Math.min(40, imageWidth * 0.08, imageHeight * 0.08);
    const columns = Math.ceil(imageWidth / pixel);
    const rows = Math.ceil(imageHeight / pixel);
    const edgeColumns = Math.ceil(feather / pixel);

    // Draw only the border strips. The interior stays completely transparent.
    // Each square is either solid fill or absent: no blur or alpha gradient.
    context.beginPath();
    for (let row = 0; row < rows; row += 1) {
      const y = row * pixel;
      const cellHeight = Math.min(pixel, imageHeight - y);
      const verticalDistance = Math.min(y, imageHeight - y - cellHeight);
      for (let column = 0; column < columns; column += 1) {
        if (verticalDistance >= feather && column === edgeColumns) {
          column = Math.max(column, columns - edgeColumns - 1);
        }
        const x = column * pixel;
        const cellWidth = Math.min(pixel, imageWidth - x);
        const distance = Math.min(x, imageWidth - x - cellWidth, verticalDistance);
        const coverage = Math.max(0, 1 - distance / feather);
        const threshold = (bayer[(row % 4) * 4 + column % 4] + 0.5) / 16;
        if (coverage > threshold) context.rect(left + x, top + y, cellWidth, cellHeight);
      }
    }
    context.fill();
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };
  source.addEventListener("load", schedule);
  if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(desktop);
  window.addEventListener("resize", schedule);
  try {
    const url = new URL(config.wallpaper, document.baseURI);
    if (["http:", "https:"].includes(url.protocol)) source.src = url.href;
  } catch { /* Keep the ordinary CSS wallpaper if its URL cannot be loaded. */ }
}
