export type ScannerCallback = (barcode: string) => void;

let buffer = "";
let lastKey = 0;

export function startHardwareScanner(onScan: ScannerCallback) {
  const handler = (e: KeyboardEvent) => {
    const now = performance.now();
    if (now - lastKey > 100) buffer = "";
    lastKey = now;

    if (e.key === "Enter") {
      const value = buffer.trim();
      buffer = "";
      if (value.length >= 4) onScan(value);
      return;
    }
    if (e.key.length === 1) buffer += e.key;
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}

export async function scanWithCamera(video: HTMLVideoElement, onScan: ScannerCallback) {
  const Detector = (window as typeof window & { BarcodeDetector?: typeof BarcodeDetector }).BarcodeDetector;
  if (!Detector) throw new Error("BarcodeDetector tidak tersedia di browser ini.");
  const detector = new Detector({ formats: ["ean_13","ean_8","upc_a","upc_e","code_128","code_39"] });
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  video.srcObject = stream;
  await video.play();

  let active = true;
  const loop = async () => {
    if (!active) return;
    try {
      const codes = await detector.detect(video);
      if (codes.length) {
        const value = codes[0].rawValue;
        if (value) { onScan(value); active = false; return; }
      }
    } catch {}
    requestAnimationFrame(loop);
  };
  loop();

  return () => {
    active = false;
    stream.getTracks().forEach(t => t.stop());
  };
}