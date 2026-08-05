import { describe, expect, it } from 'vitest';
import { codeChallengeS256, generateCodeVerifier, generateState } from './pkce';

describe('codeChallengeS256', () => {
  it('matches the RFC 7636 Appendix B test vector', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    await expect(codeChallengeS256(verifier)).resolves.toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});

describe('generateCodeVerifier', () => {
  it('produces a URL-safe, unpadded string', () => {
    expect(generateCodeVerifier()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('produces different values each call', () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
  });
});

describe('generateState', () => {
  it('produces a URL-safe, unpadded string', () => {
    expect(generateState()).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
