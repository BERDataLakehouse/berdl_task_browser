/**
 * Centralized token management for CTS API authentication.
 *
 * Token sources (checked in order):
 * 1. kbase_session cookie - set by JupyterHub in production
 * 2. PageConfig kbaseAuthToken - set from KBASE_AUTH_TOKEN env var in dev
 */

import { PageConfig } from '@jupyterlab/coreutils';
import { MOCK_TOKEN } from '../config';

/**
 * Check if mock mode is enabled via CTS_MOCK_MODE env var.
 */
export function isMockMode(): boolean {
  return PageConfig.getOption('ctsMockMode') === 'true';
}

/**
 * Get KBase auth token from available sources.
 *
 * @returns The auth token string, or empty string if not found
 */
export function getToken(): string {
  // Mock mode: return a placeholder token
  if (isMockMode()) {
    return MOCK_TOKEN;
  }

  // Production: JupyterHub sets kbase_session cookie on login
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split('=');
    const value = valueParts.join('=');
    if (name === 'kbase_session') {
      return value;
    }
  }

  // Development: KBASE_AUTH_TOKEN env var exposed via server extension
  // (see berdl_task_browser/__init__.py)
  return PageConfig.getOption('kbaseAuthToken') || '';
}

/**
 * Get authorization header for CTS API requests.
 * Returns empty object if no token is available.
 */
export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  if (!token) {
    return {};
  }
  const bearer = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  return { Authorization: bearer };
}
