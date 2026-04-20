export async function compressImage(file, maxSizeBytes = 2 * 1024 * 1024, maxDimension = 1024, squareSize = 512) {
  if (!file || !file.type.startsWith("image/")) return file;

  const imageDataUrl = await readFileAsDataURL(file);
  const img = await loadImage(imageDataUrl);

  const { width, height } = img;
  const minSide = Math.min(width, height);
  const sx = Math.floor((width - minSide) / 2);
  const sy = Math.floor((height - minSide) / 2);
  const destSize = Math.min(squareSize, maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = destSize;
  canvas.height = destSize;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, destSize, destSize);

  let quality = 0.9;
  let blob = await canvasToBlob(canvas, "image/jpeg", quality);
  while (blob.size > maxSizeBytes && quality > 0.6) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  return new File([blob], replaceExtension(file.name, "jpg"), { type: "image/jpeg" });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function replaceExtension(name, ext) {
  const base = name.replace(/\.[^/.]+$/, "");
  return `${base}.${ext}`;
}
