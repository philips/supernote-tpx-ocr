// TPX (Token Pony Express) OAuth 2.1 client for a public, client-side-only
// app: no client secret anywhere, PKCE S256 required, PAR used when the
// provider advertises it. See https://tokenpony.dev/spec (v0.3).

import { codeChallengeS256, generateCodeVerifier, generateState } from './pkce';
import { loadClientId, saveClientId, savePendingFlow, takePendingFlow } from './storage';
import type {
  AuthorizationServerMetadata,
  ClientRegistrationResponse,
  DiscoveredProvider,
  IntrospectionResponse,
  ProtectedResourceMetadata,
  StoredGrant,
  TokenResponse,
} from './types';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${url} responded ${res.status}${body ? `: ${body}` : ''}`);
  }
  return res.json() as Promise<T>;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/** RFC 9728 protected-resource metadata, then RFC 8414 authorization-server metadata; rejects a provider that doesn't advertise the llm-inference grant type. */
export async function discoverProvider(providerOrigin: string): Promise<DiscoveredProvider> {
  const origin = trimTrailingSlash(providerOrigin);
  const prm = await fetchJson<ProtectedResourceMetadata>(`${origin}/.well-known/oauth-protected-resource`);
  const asOrigin = prm.authorization_servers[0];
  if (!asOrigin) throw new Error('provider did not advertise an authorization server');

  const as = await fetchJson<AuthorizationServerMetadata>(
    `${trimTrailingSlash(asOrigin)}/.well-known/oauth-authorization-server`,
  );
  if (!as.authorization_details_types_supported?.includes('llm-inference')) {
    throw new Error('provider does not support the llm-inference grant type - not a TPX provider');
  }
  return { resource: prm.resource, as };
}

/** RFC 7591 dynamic client registration, cached per issuer so repeat logins don't re-register. */
export async function ensureClientId(as: AuthorizationServerMetadata, redirectUri: string): Promise<string> {
  const cached = loadClientId(as.issuer);
  if (cached) return cached;
  if (!as.registration_endpoint) {
    throw new Error('provider has no registration_endpoint - it must issue a client_id out of band');
  }

  const registration = await fetchJson<ClientRegistrationResponse>(as.registration_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Supernote USB MTP Viewer and AI Handwriting to Text',
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: 'none',
    }),
  });
  saveClientId(as.issuer, registration.client_id);
  return registration.client_id;
}

/** Starts the PAR + PKCE authorization request and redirects the browser to the provider. Never returns (navigates away) on success. */
export async function startAuthorization(opts: {
  discovered: DiscoveredProvider;
  clientId: string;
  redirectUri: string;
  budget: number;
}): Promise<void> {
  const { as, resource } = opts.discovered;
  const verifier = generateCodeVerifier();
  const challenge = await codeChallengeS256(verifier);
  const state = generateState();

  savePendingFlow(state, {
    verifier,
    resource,
    as,
    clientId: opts.clientId,
    redirectUri: opts.redirectUri,
  });

  const authorizationDetails = JSON.stringify([{ type: 'llm-inference', budget: opts.budget }]);

  if (as.pushed_authorization_request_endpoint) {
    const par = await fetchJson<{ request_uri: string }>(as.pushed_authorization_request_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        response_type: 'code',
        client_id: opts.clientId,
        redirect_uri: opts.redirectUri,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource,
        authorization_details: authorizationDetails,
        state,
      }),
    });

    const url = new URL(as.authorization_endpoint);
    url.searchParams.set('client_id', opts.clientId);
    url.searchParams.set('request_uri', par.request_uri);
    window.location.assign(url.toString());
    return;
  }

  // Fallback for a provider without PAR - still PKCE S256, request sent as plain query params instead.
  const url = new URL(as.authorization_endpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', opts.clientId);
  url.searchParams.set('redirect_uri', opts.redirectUri);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('resource', resource);
  url.searchParams.set('authorization_details', authorizationDetails);
  url.searchParams.set('state', state);
  window.location.assign(url.toString());
}

/**
 * Call on every page load. If the URL carries an authorization response
 * (`code`/`state`, or `error`), completes or reports it and strips those
 * params from the URL either way. Returns null when there's nothing to do
 * (a normal page load, not a callback).
 */
export async function completeAuthorizationFromUrl(): Promise<StoredGrant | null> {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  const code = params.get('code');
  const state = params.get('state');

  if (!error && !code) return null;

  const cleanUrl = window.location.pathname + window.location.hash;
  history.replaceState(null, '', cleanUrl);

  if (error) {
    throw new Error(params.get('error_description') || error);
  }
  if (!state) {
    throw new Error('authorization response is missing state');
  }

  const flow = takePendingFlow(state);
  if (!flow) {
    throw new Error('no matching authorization request for this callback (expired, or state mismatch)');
  }

  const iss = params.get('iss');
  if (iss && iss !== flow.as.issuer) {
    throw new Error(`issuer mismatch: expected ${flow.as.issuer}, got ${iss}`);
  }

  const token = await fetchJson<TokenResponse>(flow.as.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: flow.redirectUri,
      client_id: flow.clientId,
      code_verifier: flow.verifier,
    }),
  });

  const detail = token.authorization_details?.find((d) => d.type === 'llm-inference');
  const grant: StoredGrant = {
    resource: flow.resource,
    issuer: flow.as.issuer,
    tokenEndpoint: flow.as.token_endpoint,
    introspectionEndpoint: flow.as.introspection_endpoint,
    revocationEndpoint: flow.as.revocation_endpoint,
    clientId: flow.clientId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    budget: detail?.budget ?? 0,
    models: detail?.models,
  };
  return grant;
}

/** Refresh tokens rotate on every use (spec section on grant state) - always persist the new refresh_token, the old one is now invalid. */
export async function refreshGrant(grant: StoredGrant): Promise<StoredGrant> {
  if (!grant.refreshToken) throw new Error('no refresh token stored - re-authorize');

  const token = await fetchJson<TokenResponse>(grant.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: grant.refreshToken,
      client_id: grant.clientId,
    }),
  });

  const detail = token.authorization_details?.find((d) => d.type === 'llm-inference');
  return {
    ...grant,
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? grant.refreshToken,
    expiresAt: Date.now() + token.expires_in * 1000,
    budget: detail?.budget ?? grant.budget,
    models: detail?.models ?? grant.models,
  };
}

export async function introspectGrant(grant: StoredGrant): Promise<IntrospectionResponse | null> {
  if (!grant.introspectionEndpoint) return null;
  return fetchJson<IntrospectionResponse>(grant.introspectionEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: grant.accessToken }),
  });
}

export async function revokeGrant(grant: StoredGrant): Promise<void> {
  if (!grant.revocationEndpoint) return;
  const token = grant.refreshToken ?? grant.accessToken;
  await fetch(grant.revocationEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  });
}
