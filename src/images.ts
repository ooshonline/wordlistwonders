// Image slot store. The prototype persisted dropped images to a sidecar file
// via the design tool's bridge; production persists to localStorage. Images
// are keyed by word id (`slot-<wordId>`) so "upload once, use everywhere"
// works — every activity reads the same slot.

export interface SlotValue {
  /** data: URL of the (downscaled) image. */
  u: string;
  /** view scale for deliberate crop (1 = baseline fit). */
  s: number;
  /** pan offset in frame-% on each axis. */
  x: number;
  y: number;
}

const STORAGE_KEY = 'wordlist_wonders_images';
const MAX_DIM = 1200;
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

let slots: Record<string, SlotValue> = load();
const subs = new Set<() => void>();

function load(): Record<string, SlotValue> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') return data;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch {
    /* quota — best effort */
  }
}

export function getSlot(id: string): SlotValue | null {
  return slots[id] || null;
}

export function setSlot(id: string, val: SlotValue | null) {
  if (!id) return;
  if (val) slots[id] = val;
  else delete slots[id];
  save();
  subs.forEach((fn) => fn());
}

export function subscribeSlots(fn: () => void): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function acceptsFile(file: File): boolean {
  return !!file && ACCEPT.indexOf(file.type) >= 0;
}

export const ACCEPT_ATTR = ACCEPT.join(',');

// Encode through a canvas so storage carries resized bytes, not the raw
// upload. Longest side capped at 2× the slot's rendered width and at MAX_DIM.
export async function toDataUrl(file: File, targetW: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
    const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL('image/webp', 0.85);
  } finally {
    bitmap.close?.();
  }
}
