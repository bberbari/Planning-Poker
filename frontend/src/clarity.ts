import Clarity from '@microsoft/clarity';

/**
 * Initialize Microsoft Clarity analytics.
 * Set VITE_CLARITY_PROJECT_ID in .env with your project ID from
 * https://clarity.microsoft.com/projects > Settings > Overview.
 */
export function initClarity(): void {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;
  if (projectId && typeof projectId === 'string') {
    Clarity.init(projectId);
  }
}
