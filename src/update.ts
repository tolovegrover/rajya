/**
 * Update check against the public GitHub releases of the app. No native SDK and no
 * extra dependency: the release script already publishes a signed APK there, so the
 * newest tag is the source of truth for sideloaders and App Distribution testers alike.
 */
const LATEST = 'https://api.github.com/repos/tolovegrover/rajya/releases/latest';

export interface Update {
  version: string;
  url: string;
  notes: string;
}

/** "0.10" is newer than "0.9" — compare segment by segment, never as strings. */
export function isNewer(candidate: string, current: string): boolean {
  const parts = (v: string) => v.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const a = parts(candidate);
  const b = parts(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}

export async function checkForUpdate(current: string): Promise<Update | null> {
  try {
    const res = await fetch(LATEST, { headers: { accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      tag_name?: string;
      body?: string;
      assets?: { name?: string; browser_download_url?: string }[];
    };
    const version = (data.tag_name ?? '').replace(/^v/i, '');
    if (!version || !isNewer(version, current)) return null;
    const apk = (data.assets ?? []).find((a) => a.name?.endsWith('.apk'));
    if (!apk?.browser_download_url) return null;
    return { version, url: apk.browser_download_url, notes: (data.body ?? '').slice(0, 300) };
  } catch {
    return null;
  }
}
