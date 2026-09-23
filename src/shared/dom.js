export const $ = (selector, root = document) => root.querySelector(selector);
export const create = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
export const safeURL = (value) => {
  if (!value || typeof value !== "string") return "";
  try {
    const url = new URL(value, document.baseURI);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
};
export const announce = (text) => { $("#announcer").textContent = text; };
export const pixelIcon = (name, className = "") => {
  const icon = create("img", `pixel-icon ${className}`.trim());
  icon.src = `assets/pixel-ui/${name}.png`;
  icon.alt = "";
  icon.width = 16;
  icon.height = 16;
  icon.draggable = false;
  return icon;
};

export const rgbChannels = color => color.slice(1).match(/../g).map(channel => parseInt(channel, 16));
