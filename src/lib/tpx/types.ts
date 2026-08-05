// Types for the TPX (Token Pony Express) OAuth 2.1 profile for metered LLM
// inference grants. See https://tokenpony.dev/spec (v0.3) and /llms.txt for
// the full protocol; this project talks to whichever provider the user
// names, not just tokenpony.dev itself.

export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
}

export interface AuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  pushed_authorization_request_endpoint?: string;
  registration_endpoint?: string;
  introspection_endpoint?: string;
  revocation_endpoint?: string;
  authorization_details_types_supported?: string[];
}

export interface DiscoveredProvider {
  resource: string;
  as: AuthorizationServerMetadata;
}

export interface ClientRegistrationResponse {
  client_id: string;
  client_id_issued_at?: number;
}

export interface LlmInferenceAuthorizationDetail {
  type: 'llm-inference';
  budget: number;
  models?: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  authorization_details?: LlmInferenceAuthorizationDetail[];
}

export interface IntrospectionResponse {
  active: boolean;
  client_id?: string;
  exp?: number;
  authorization_details?: LlmInferenceAuthorizationDetail[];
  budget_used?: number;
}

/** What we persist in localStorage between page loads. */
export interface StoredGrant {
  resource: string;
  issuer: string;
  tokenEndpoint: string;
  introspectionEndpoint?: string;
  revocationEndpoint?: string;
  clientId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  budget: number;
  models?: string[];
}

/** What we persist in sessionStorage for the duration of one redirect round trip. */
export interface PendingFlow {
  verifier: string;
  resource: string;
  as: AuthorizationServerMetadata;
  clientId: string;
  redirectUri: string;
}
