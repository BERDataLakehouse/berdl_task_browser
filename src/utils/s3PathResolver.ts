/**
 * Bidirectional S3 path resolution using server-provided mappings.
 *
 * All mapping data comes from the server endpoint
 * GET /api/task-browser/s3-path-mappings — no mapping knowledge is baked in.
 */

const LAKEHOUSE = 'lakehouse_minio';

export interface IS3Mapping {
  bucket: string;
  prefix: string;
  read_only?: boolean;
}

export type S3Mappings = Record<string, IS3Mapping>;

/**
 * Convert an s3a:// (or s3://) URL to a JupyterLab lakehouse_minio/ path.
 *
 * Matches against the provided mappings using longest prefix first, and
 * prefers RW mappings over RO when both match the same prefix.
 *
 * Returns null if no mapping matches.
 */
export function resolveS3ToJlab(
  s3Url: string,
  mappings: S3Mappings | null
): string | null {
  if (!mappings) {
    return null;
  }

  const parsed = parseS3Url(s3Url);
  if (!parsed) {
    return null;
  }

  const { bucket, key } = parsed;

  type Match = { virtualDir: string; mapping: IS3Mapping; remainder: string };
  const matches: Match[] = [];

  for (const [virtualDir, mapping] of Object.entries(mappings)) {
    if (mapping.bucket !== bucket) {
      continue;
    }

    const prefix = mapping.prefix.replace(/\/+$/, '');
    if (key === prefix || key.startsWith(prefix + '/')) {
      const remainder = key === prefix ? '' : key.slice(prefix.length + 1);
      matches.push({ virtualDir, mapping, remainder });
    }
  }

  if (matches.length === 0) {
    return null;
  }

  // Sort: longest prefix first, then prefer RW (non-read_only) over RO
  matches.sort((a, b) => {
    const prefixLenDiff = b.mapping.prefix.length - a.mapping.prefix.length;
    if (prefixLenDiff !== 0) {
      return prefixLenDiff;
    }
    // Prefer RW over RO
    const aRo = a.mapping.read_only ? 1 : 0;
    const bRo = b.mapping.read_only ? 1 : 0;
    return aRo - bRo;
  });

  const best = matches[0];
  const trail = best.remainder ? `/${best.remainder}` : '';
  return `${LAKEHOUSE}/${best.virtualDir}${trail}`;
}

/**
 * Convert a JupyterLab lakehouse_minio/ path to an s3a:// URL.
 *
 * Looks up the virtual directory name in the provided mappings.
 * Returns null if the path is outside lakehouse_minio/ or unmapped.
 */
export function resolveJlabToS3(
  jlabPath: string,
  mappings: S3Mappings | null
): string | null {
  if (!mappings) {
    return null;
  }

  if (!jlabPath.startsWith(`${LAKEHOUSE}/`)) {
    return null;
  }

  const rel = jlabPath.slice(LAKEHOUSE.length + 1);
  const slashIdx = rel.indexOf('/');
  const virtualDir = slashIdx === -1 ? rel : rel.slice(0, slashIdx);
  const remainder = slashIdx === -1 ? '' : rel.slice(slashIdx + 1);

  const mapping = mappings[virtualDir];
  if (!mapping) {
    return null;
  }

  const prefix = mapping.prefix.replace(/\/+$/, '');
  const trail = remainder ? `/${remainder}` : '';
  return `s3a://${mapping.bucket}/${prefix}${trail}`;
}

/**
 * Fetch S3 path mappings from the server endpoint.
 */
export async function fetchS3Mappings(
  baseUrl: string
): Promise<S3Mappings | null> {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/task-browser/s3-path-mappings`;
  try {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) {
      console.warn(`[CTS] S3 mappings endpoint returned ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.mappings || null;
  } catch (err) {
    console.warn('[CTS] Failed to fetch S3 mappings:', err);
    return null;
  }
}

/** Parse s3a:// or s3:// URL into bucket and key. */
function parseS3Url(url: string): { bucket: string; key: string } | null {
  const m = url.match(/^s3a?:\/\/([^/]+)\/(.+)$/);
  if (!m) {
    return null;
  }
  return { bucket: m[1], key: m[2] };
}
