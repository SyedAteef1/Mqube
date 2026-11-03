const COLOR_PROPERTIES = [
  "color",
  "backgroundColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "textDecorationColor",
  "webkitTextStrokeColor",
] as const;

const isModernColor = (value: string) => /oklch|oklab|lab\(|lch\(|color\(|color-mix/.test(value);

/**
 * html2canvas cannot read modern CSS colours such as oklch().
 * Rewrites them as rgba() across a cloned document so PDF export can render it.
 */
export function prepareForCanvas(doc: Document): void {
  const view = doc.defaultView;
  const painter = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!view || !painter) return;

  const toRgba = (value: string) => {
    painter.clearRect(0, 0, 1, 1);
    painter.fillStyle = value;
    painter.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = painter.getImageData(0, 0, 1, 1).data;
    return `rgba(${r}, ${g}, ${b}, ${Number((a / 255).toFixed(3))})`;
  };

  for (const element of Array.from(doc.querySelectorAll<HTMLElement>("*"))) {
    const computed = view.getComputedStyle(element);
    for (const property of COLOR_PROPERTIES) {
      if (isModernColor(computed[property])) element.style[property] = toRgba(computed[property]);
    }
    if (isModernColor(computed.boxShadow)) element.style.boxShadow = "none";
    if (isModernColor(computed.textShadow)) element.style.textShadow = "none";
    if (isModernColor(computed.backgroundImage)) element.style.backgroundImage = "none";
  }
}
