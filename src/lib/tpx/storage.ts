import type { PendingFlow, StoredGrant } from './types';

const GRANT_KEY = 'tpx.grant';
const CLIENT_ID_PREFIX = 'tpx.client_id.';
const FLOW_PREFIX = 'tpx.flow.';

export function loadGrant(): StoredGrant | null {
  const raw = localStorage.getItem(GRANT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredGrant;
  } catch {
    return null;
  }
}

export function saveGrant(grant: StoredGrant): void {
  localStorage.setItem(GRANT_KEY, JSON.stringify(grant));
}

export function clearGrant(): void {
  localStorage.removeItem(GRANT_KEY);
}

/** Client registration is per authorization server, not per grant - cache it independently so re-authorizing (or a fresh login after logout) doesn't re-register. */
export function loadClientId(issuer: string): string | null {
  return localStorage.getItem(CLIENT_ID_PREFIX + issuer);
}

export function saveClientId(issuer: string, clientId: string): void {
  localStorage.setItem(CLIENT_ID_PREFIX + issuer, clientId);
}

/** Round-trips across the redirect to the provider and back; sessionStorage so it never outlives the tab and never leaks into localStorage's longer-lived grant state. */
export function savePendingFlow(state: string, flow: PendingFlow): void {
  sessionStorage.setItem(FLOW_PREFIX + state, JSON.stringify(flow));
}

export function takePendingFlow(state: string): PendingFlow | null {
  const key = FLOW_PREFIX + state;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  sessionStorage.removeItem(key);
  try {
    return JSON.parse(raw) as PendingFlow;
  } catch {
    return null;
  }
}
