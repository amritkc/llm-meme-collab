import type { MemeTextLayer } from "./MemeEditor";

type ExportArgs = {
  imageUrl: string;
  layers: MemeTextLayer[];
  width?: number; // output resolution width in px
};

export async function exportMemePNG({ imageUrl, layers, width = 1200 }: ExportArgs) {
  const img = await loadImage(imageUrl);

  const scale = width / img.width;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // base image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // draw each layer
  for (const layer of layers) {
    const text = (layer.text ?? "").trim();
    if (!text) continue;

    const x = (layer.xPct / 100) * canvas.width;
    const y = (layer.yPct / 100) * canvas.height;

    const fontPx = Math.max(10, Math.round(layer.fontSize * scale));
    ctx.font = `${fontPx}px Impact, Arial Black, Arial, sans-serif`;
    ctx.textBaseline = "top";

    // meme-like white fill + black outline
    ctx.lineWidth = Math.max(2, Math.round(6 * scale));
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";

    wrapText(ctx, text, x, y, canvas.width * 0.9, Math.round(fontPx * 1.2));
  }

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // for remote images you may need this; for local Vite assets it’s fine
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && n > 0) {
      ctx.strokeText(line.trim(), x, yy);
      ctx.fillText(line.trim(), x, yy);
      line = words[n] + " ";
      yy += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line.trim()) {
    ctx.strokeText(line.trim(), x, yy);
    ctx.fillText(line.trim(), x, yy);
  }
}
