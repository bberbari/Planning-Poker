// Connection test utility
import { getApiUrl } from './apiConfig';

export async function testBackendConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(getApiUrl('api/health'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[ConnectionTest] Backend health check passed', data);
      return { success: true };
    } else {
      console.error('[ConnectionTest] Backend health check failed', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error: any) {
    console.error('[ConnectionTest] Backend connection error', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to backend server' 
    };
  }
}
