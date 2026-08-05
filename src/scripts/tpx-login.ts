import {
  clearGrant,
  completeAuthorizationFromUrl,
  discoverProvider,
  ensureClientId,
  introspectGrant,
  loadGrant,
  revokeGrant,
  saveGrant,
  startAuthorization,
  type StoredGrant,
} from '../lib/tpx';

const providerInput = document.getElementById('tpx-provider') as HTMLInputElement;
const budgetInput = document.getElementById('tpx-budget') as HTMLInputElement;
const connectButton = document.getElementById('tpx-connect') as HTMLButtonElement;
const disconnectButton = document.getElementById('tpx-disconnect') as HTMLButtonElement;
const statusEl = document.getElementById('tpx-status') as HTMLElement;

function redirectUri(): string {
  return window.location.origin + window.location.pathname;
}

function formatUsd(amount: number): string {
  return `$${amount.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`;
}

function renderConnected(grant: StoredGrant, remaining?: number): void {
  connectButton.hidden = true;
  providerInput.disabled = true;
  budgetInput.disabled = true;
  disconnectButton.hidden = false;
  const budgetText = remaining === undefined
    ? formatUsd(grant.budget)
    : `${formatUsd(remaining)} of ${formatUsd(grant.budget)}`;
  statusEl.textContent = `Connected to ${new URL(grant.issuer).host} — ${budgetText} remaining`;
}

function renderDisconnected(message = 'Not connected.'): void {
  connectButton.hidden = false;
  connectButton.disabled = false;
  providerInput.disabled = false;
  budgetInput.disabled = false;
  disconnectButton.hidden = true;
  statusEl.textContent = message;
}

async function refreshStatus(grant: StoredGrant): Promise<void> {
  try {
    const introspection = await introspectGrant(grant);
    if (introspection && !introspection.active) {
      clearGrant();
      renderDisconnected('Grant is no longer active - reconnect to continue.');
      return;
    }
    const remaining = introspection?.budget_used !== undefined
      ? grant.budget - introspection.budget_used
      : undefined;
    renderConnected(grant, remaining);
  } catch (err) {
    // Introspection is a nice-to-have status check - a failure here shouldn't hide that we're connected.
    renderConnected(grant);
    console.warn('tpx: introspection failed', err);
  }
}

async function connect(): Promise<void> {
  const providerOrigin = providerInput.value.trim();
  const budget = Number(budgetInput.value);
  if (!providerOrigin) {
    statusEl.textContent = 'Enter a TPX provider URL first.';
    return;
  }
  if (!Number.isFinite(budget) || budget <= 0) {
    statusEl.textContent = 'Budget must be a positive number of USD.';
    return;
  }

  connectButton.disabled = true;
  statusEl.textContent = 'Discovering provider…';
  try {
    const discovered = await discoverProvider(providerOrigin);
    statusEl.textContent = 'Registering client…';
    const clientId = await ensureClientId(discovered.as, redirectUri());
    statusEl.textContent = 'Redirecting to sign in…';
    await startAuthorization({ discovered, clientId, redirectUri: redirectUri(), budget });
  } catch (err) {
    statusEl.textContent = `Connection failed: ${(err as Error).message}`;
    connectButton.disabled = false;
  }
}

async function disconnect(): Promise<void> {
  const grant = loadGrant();
  if (!grant) return;
  disconnectButton.disabled = true;
  try {
    await revokeGrant(grant);
  } catch (err) {
    console.warn('tpx: revocation failed', err);
  } finally {
    clearGrant();
    disconnectButton.disabled = false;
    renderDisconnected('Disconnected.');
  }
}

connectButton.addEventListener('click', () => void connect());
disconnectButton.addEventListener('click', () => void disconnect());

async function init(): Promise<void> {
  try {
    const fresh = await completeAuthorizationFromUrl();
    if (fresh) {
      saveGrant(fresh);
      await refreshStatus(fresh);
      return;
    }
  } catch (err) {
    renderDisconnected(`Sign-in failed: ${(err as Error).message}`);
    return;
  }

  const existing = loadGrant();
  if (existing) {
    await refreshStatus(existing);
  } else {
    renderDisconnected();
  }
}

void init();
