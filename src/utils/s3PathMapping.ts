/**
 * Bidirectional path mapping between JupyterLab lakehouse_minio/ virtual
 * directories and s3a:// URLs.
 *
 * Mapping convention (see GroupedS3ContentsManager):
 *   my-files       <-> users-general-warehouse/{user}
 *   my-sql         <-> users-sql-warehouse/{user}
 *   {t}-files[-ro] <-> tenant-general-warehouse/{t}
 *   {t}-sql[-ro]   <-> tenant-sql-warehouse/{t}
 */

import { PageConfig } from '@jupyterlab/coreutils';

const LAKEHOUSE = 'lakehouse_minio';
const DEFAULT_BUCKET = 'cdm-lake';

function user(): string {
  return PageConfig.getOption('hubUser') || '';
}

function bucket(): string {
  return PageConfig.getOption('cdmDefaultBucket') || DEFAULT_BUCKET;
}

/** Split "lakehouse_minio/manager-name/rest/of/path" into [manager, rest]. */
function splitJlabPath(path: string): { manager: string; rest: string } | null {
  if (!path.startsWith(`${LAKEHOUSE}/`)) {
    return null;
  }
  const rel = path.slice(LAKEHOUSE.length + 1);
  const i = rel.indexOf('/');
  if (i === -1) {
    return null;
  }
  return { manager: rel.slice(0, i), rest: rel.slice(i + 1) };
}

/** Parse s3a://bucket/warehouse/entity/rest into parts. */
function splitS3Url(url: string): {
  urlBucket: string;
  warehouse: string;
  entity: string;
  rest: string;
} | null {
  const m = url.match(/^s3a?:\/\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)$/);
  if (!m) {
    return null;
  }
  return { urlBucket: m[1], warehouse: m[2], entity: m[3], rest: m[4] };
}

/**
 * Convert a JupyterLab lakehouse_minio/ path to an s3a:// URL.
 * Returns null if the path is outside lakehouse_minio/ or unrecognised.
 */
export function jlabToS3(jlabPath: string): string | null {
  const parts = splitJlabPath(jlabPath);
  if (!parts) {
    return null;
  }
  const { manager, rest } = parts;
  const b = bucket();

  if (manager === 'my-files') {
    return `s3a://${b}/users-general-warehouse/${user()}/${rest}`;
  }
  if (manager === 'my-sql') {
    return `s3a://${b}/users-sql-warehouse/${user()}/${rest}`;
  }

  // Tenant: strip -files, -sql, -files-ro, -sql-ro suffix to get tenant name.
  // Check longer suffixes first so -files-ro is matched before -files.
  const suffixToWarehouse: [string, string][] = [
    ['-files-ro', 'tenant-general-warehouse'],
    ['-sql-ro', 'tenant-sql-warehouse'],
    ['-files', 'tenant-general-warehouse'],
    ['-sql', 'tenant-sql-warehouse']
  ];
  for (const [suffix, warehouse] of suffixToWarehouse) {
    if (manager.endsWith(suffix) && manager.length > suffix.length) {
      const tenant = manager.slice(0, -suffix.length);
      return `s3a://${b}/${warehouse}/${tenant}/${rest}`;
    }
  }

  return null;
}

/**
 * Convert an s3a:// (or s3://) URL to a JupyterLab lakehouse_minio/ path.
 * Returns null if the URL doesn't map to any known virtual directory.
 *
 * For tenant paths, the RW manager name (e.g. "foo-files") is returned since
 * we can't know from the URL alone whether the user has RO or RW access.
 */
export function s3ToJlab(s3Url: string): string | null {
  const parts = splitS3Url(s3Url);
  if (!parts || parts.urlBucket !== bucket()) {
    return null;
  }
  const { warehouse, entity, rest } = parts;
  const u = user();

  switch (warehouse) {
    case 'users-general-warehouse':
      return entity === u ? `${LAKEHOUSE}/my-files/${rest}` : null;
    case 'users-sql-warehouse':
      return entity === u ? `${LAKEHOUSE}/my-sql/${rest}` : null;
    case 'tenant-general-warehouse':
      return `${LAKEHOUSE}/${entity}-files/${rest}`;
    case 'tenant-sql-warehouse':
      return `${LAKEHOUSE}/${entity}-sql/${rest}`;
    default:
      return null;
  }
}
