/// <reference types="vite/client" />
import { C } from '../tokens';

/*
 * M4 — reserved space for ONE future display ad (ads-only ceiling; the app stays free).
 *
 * Today this renders NOTHING on the live site: `AD_SLOT_ENABLED` is false, so the
 * slot collapses to zero height. There is no ad script and no network call here.
 *
 * To wire up AdSense later (Kyle's call):
 *   1. Add the AdSense loader <script> to index.html.
 *   2. Put the <ins class="adsbygoogle" …> unit inside the box below and push it.
 *   3. Flip AD_SLOT_ENABLED to true.
 *
 * The slot lives only on the Library screen (teacher prep), never on the projector
 * games or worksheets, and carries `vw-noprint` so it can never reach a printout.
 * For a local layout check, open the dev server with `?adslot` to see a dashed
 * placeholder (dev builds only — production ignores the flag).
 */
export const AD_SLOT_ENABLED = false;

function previewRequested(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return new URLSearchParams(window.location.search).has('adslot');
  } catch {
    return false;
  }
}

export function AdSlot() {
  const preview = previewRequested();
  if (!AD_SLOT_ENABLED && !preview) return null;

  return (
    <aside className="vw-ad-slot vw-noprint" aria-label="Advertisement">
      {/* Fixed min-height reserves the space up front so the page doesn't jump when an ad loads. */}
      <div className="vw-ad-slot-box" style={{ color: C.muted, borderColor: C.borderCard, background: C.track }}>
        {preview && !AD_SLOT_ENABLED ? 'Ad space (dev preview — off on the live site)' : null}
      </div>
    </aside>
  );
}
