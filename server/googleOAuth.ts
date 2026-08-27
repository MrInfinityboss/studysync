import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_SCOPES = ["openid", "email", "profile"];
const MAX_STATE_AGE_MS = 10 * 60 * 1000;

export type GoogleOauthConfig = {
  clientId: string;
  clientSecret: string;
};

export type GoogleAuthState = {
  state: string;
  codeVerifier: string;
  issuedAt: number;
};

export function decideGoogleIdentityLink({ hasProviderIdentity, hasEmailMatch }: { hasProviderIdentity: boolean; hasEmailMatch: boolean }) {
  if (hasProviderIdentity) return "existing_identity" as const;
  if (hasEmailMatch) return "link_existing_user" as const;
  return "create_google_user" as const;
}

export function decideGoogleCallbackOutcome({ code, receivedState, storedState, providerError }: { code?: string; receivedState?: string; storedState: GoogleAuthState | null; providerError?: string }) {
  if (providerError) return "provider_cancelled" as const;
  if (!code || !receivedState || !storedState || receivedState !== storedState.state) return "invalid_state" as const;
  return "exchange_code" as const;
}

export function getGoogleOauthConfig(): GoogleOauthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to project secrets.");
  }
  return { clientId, clientSecret };
}

export function googleCallbackUrl(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function createGoogleAuthState(): GoogleAuthState {
  return { state: randomBytes(32).toString("base64url"), codeVerifier: randomBytes(48).toString("base64url"), issuedAt: Date.now() };
}

export function createSignedGoogleStateCookie(payload: GoogleAuthState) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required to protect Google OAuth state.");
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function readSignedGoogleStateCookie(value: string | undefined): GoogleAuthState | null {
  const secret = process.env.JWT_SECRET;
  if (!value || !secret) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  const given = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (given.length !== expectedBuffer.length || !timingSafeEqual(given, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as GoogleAuthState;
    if (!payload.state || !payload.codeVerifier || !Number.isFinite(payload.issuedAt) || Date.now() - payload.issuedAt > MAX_STATE_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createGoogleAuthorizationUrl(origin: string, oauthState: GoogleAuthState) {
  const { clientId } = getGoogleOauthConfig();
  const codeChallenge = createHash("sha256").update(oauthState.codeVerifier).digest("base64url");
  const url = new URL(GOOGLE_AUTHORIZATION_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", googleCallbackUrl(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  url.searchParams.set("state", oauthState.state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleCode({ code, origin, codeVerifier }: { code: string; origin: string; codeVerifier: string }) {
  const { clientId, clientSecret } = getGoogleOauthConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: googleCallbackUrl(origin), grant_type: "authorization_code", code_verifier: codeVerifier }),
  });
  if (!response.ok) throw new Error("Google could not complete sign-in. Please try again.");
  return response.json() as Promise<{ access_token: string; id_token: string; expires_in: number }>;
}

export async function fetchGoogleIdentity(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error("Google could not verify the account identity.");
  const identity = await response.json() as { sub?: string; email?: string; name?: string; picture?: string; email_verified?: boolean };
  if (!identity.sub || !identity.email || !identity.email_verified) throw new Error("Google did not provide a verified email address.");
  return identity as Required<Pick<typeof identity, "sub" | "email" | "email_verified">> & { name?: string; picture?: string };
}

export async function validateGoogleClientCredentials() {
  const { clientId, clientSecret } = getGoogleOauthConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: "studysync-credential-validation",
      redirect_uri: "http://localhost:3000/api/auth/google/callback",
      grant_type: "authorization_code",
    }),
  });
  const body = await response.json().catch(() => ({})) as { error?: string };
  return { status: response.status, error: body.error };
}
