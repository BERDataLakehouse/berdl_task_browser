/**
 * Centralized token management for CTS API authentication.
 *
 * Token sources (checked in order):
 * 1. kbase_session cookie - set by JupyterHub in production
 * 2. PageConfig kbaseAuthToken - set from KBASE_AUTH_TOKEN env var in dev
 */

import { PageConfig } from '@jupyterlab/coreutils';

/**
 * Check if mock mode is enabled via window.kbase.task_browser.mockMode
 */
export function isMockMode(): boolean {
  const win = window as unknown as Record<string, unknown>;
  const kbase = win.kbase as Record<string, unknown> | undefined;
  const tb = kbase?.task_browser as { mockMode?: boolean } | undefined;
  return tb?.mockMode === true;
}

/**
 * Get KBase auth token from available sources.
 *
 * @returns The auth token string, or empty string if not found
 */
export function getToken(): string {
  // Production: JupyterHub sets kbase_session cookie on login
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'kbase_session') {
      return value;
    }
  }

  // Development: KBASE_AUTH_TOKEN env var exposed via server extension
  // (see berdl_task_browser/__init__.py)
  return PageConfig.getOption('kbaseAuthToken') || '';
}
