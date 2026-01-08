// lib/sessionTracking.ts

const TRACKING_ENDPOINT = 'https://damien-henry.com/api/track';
const APP_PREFIX = 'sqwrite';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = getCookie('user-session-id');
  
  if (!sessionId) {
    sessionId = sessionStorage.getItem('user-session-id') || '';
  }
  
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCookie('user-session-id', sessionId, 30);
    sessionStorage.setItem('user-session-id', sessionId);
  } else if (!getCookie('user-session-id')) {
    setCookie('user-session-id', sessionId, 30);
  } else if (!sessionStorage.getItem('user-session-id')) {
    sessionStorage.setItem('user-session-id', sessionId);
  }
  
  return sessionId;
}

function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || '';
  }
  return '';
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export async function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return;
  if (window.location.hostname === 'localhost') return; // Skip in dev
  
  const sessionId = getSessionId();
  
  try {
    await fetch(TRACKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        eventType: 'page_view',
        path,
        title,
        timestamp: new Date().toISOString(),
        prefix: APP_PREFIX
      })
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

export async function trackEvent(eventType: string, data: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (window.location.hostname === 'localhost') return; // Skip in dev
  
  const sessionId = getSessionId();
  
  try {
    await fetch(TRACKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        eventType,
        ...data,
        timestamp: new Date().toISOString(),
        prefix: APP_PREFIX
      })
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

