// src/utils/pkce.ts

/**
 * PKCE (Proof Key for Code Exchange) utility functions
 * Used for securing OAuth 2.0 Authorization Code Flow
 */

/**
 * Generate a random code verifier (43-128 characters)
 * This is a cryptographically random string
 */
export const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
};

/**
 * Generate code challenge from code verifier using SHA-256
 * This will be sent to authorization endpoint
 */
export const generateCodeChallenge = async (
  verifier: string
): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64URLEncode(new Uint8Array(hash));
};

/**
 * Base64-URL encode (without padding)
 * Required for PKCE parameters
 */
const base64URLEncode = (buffer: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

/**
 * Generate random state parameter for CSRF protection
 */
export const generateState = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
};