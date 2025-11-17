
import { generateCodeChallenge, generateCodeVerifier, generateState } from "../utils/pkce"

// OIDC Configuration
const OIDC_CONFIG = {
  clientId: 'e63a1e6f-eddb-49a7-900c-edcf0e8c7808',
  clientSecret: 't5gFu4DN-muGlEjNIj.Qjm7bLJZX4yl07siFCexrgec6EJma66detbr0NL~H.DgL',
  redirectUri: 'http://localhost:3000',
  authorizationEndpoint: 'https://id-dev.velocityfrequentflyer.com/as/authorize',
  tokenEndpoint: 'https://id-dev.velocityfrequentflyer.com/as/token',
  userInfoEndpoint: 'https://id-dev.velocityfrequentflyer.com/as/userinfo',
  endSessionEndpoint: 'https://id-dev.velocityfrequentflyer.com/as/signoff',
  scope: 'openid',
};

export interface UserInfo {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token: string;
  refresh_token?: string;
}

class AuthService {
  /**
   * Initiate login - redirect to authorization endpoint
   */
  async login(): Promise<void> {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store in sessionStorage for later use
    sessionStorage.setItem('code_verifier', codeVerifier);
    sessionStorage.setItem('auth_state', state);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: OIDC_CONFIG.clientId,
      response_type: 'code',
      redirect_uri: OIDC_CONFIG.redirectUri,
      scope: OIDC_CONFIG.scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${OIDC_CONFIG.authorizationEndpoint}?${params.toString()}`;
    
    // Redirect to authorization server
    window.location.href = authUrl;
  }

  /**
   * Handle callback after authorization
   * Extract code and exchange for tokens
   */
  async handleCallback(): Promise<UserInfo | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    // Check for errors
    if (error) {
      console.error('Authorization error:', error);
      throw new Error(`Authorization failed: ${error}`);
    }

    // Validate state (CSRF protection)
    const storedState = sessionStorage.getItem('auth_state');
    if (!state || state !== storedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    if (!code) {
      return null;
    }

    // Get code verifier
    const codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code, codeVerifier);
    
    // Store tokens
    this.storeTokens(tokens);

    // Clean up
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('auth_state');
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    // Get user info
    return await this.getUserInfo(tokens.access_token);
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OIDC_CONFIG.redirectUri,
      client_id: OIDC_CONFIG.clientId,
      client_secret: OIDC_CONFIG.clientSecret,
      code_verifier: codeVerifier,
    });

    const response = await fetch(OIDC_CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    return await response.json();
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch(OIDC_CONFIG.userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(tokens: TokenResponse): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('id_token', tokens.id_token);
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
    
    // Store expiry time
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    localStorage.setItem('expires_at', expiresAt.toString());
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const expiresAt = localStorage.getItem('expires_at');
    
    if (!accessToken || !expiresAt) {
      return false;
    }

    // Check if token is expired
    return Date.now() < parseInt(expiresAt);
  }

  /**
   * Logout - clear tokens and redirect to end session endpoint
   */
  async logout(): Promise<void> {
    const idToken = localStorage.getItem('id_token');
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');

    // Redirect to end session endpoint
    if (idToken) {
      const params = new URLSearchParams({
        id_token_hint: idToken,
        post_logout_redirect_uri: OIDC_CONFIG.redirectUri,
      });
      window.location.href = `${OIDC_CONFIG.endSessionEndpoint}?${params.toString()}`;
    } else {
      window.location.href = OIDC_CONFIG.redirectUri;
    }
  }

  /**
   * Get current user info if authenticated
   */
  async getCurrentUser(): Promise<UserInfo | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return null;
    }

    try {
      return await this.getUserInfo(accessToken);
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }
}

export const authService = new AuthService();