import { describe, expect, it } from "vitest";
import { createGoogleAuthState, createGoogleAuthorizationUrl, createSignedGoogleStateCookie, decideGoogleCallbackOutcome, decideGoogleIdentityLink, googleCallbackUrl, readSignedGoogleStateCookie, validateGoogleClientCredentials } from "./googleOAuth";

describe("Google OAuth security helpers", () => {
  it("uses an exact HTTPS callback path and carries PKCE parameters", () => {
    const state = createGoogleAuthState();
    const url = new URL(createGoogleAuthorizationUrl("https://studysync.example.edu", state));
    expect(googleCallbackUrl("https://studysync.example.edu/")).toBe("https://studysync.example.edu/api/auth/google/callback");
    expect(url.searchParams.get("redirect_uri")).toBe("https://studysync.example.edu/api/auth/google/callback");
    expect(url.searchParams.get("state")).toBe(state.state);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("scope")).toContain("openid");
  });

  it("rejects a tampered OAuth state cookie", () => {
    const cookie = createSignedGoogleStateCookie(createGoogleAuthState());
    expect(readSignedGoogleStateCookie(cookie)).not.toBeNull();
    expect(readSignedGoogleStateCookie(`${cookie}tampered`)).toBeNull();
  });

  it("chooses the correct account-linking action for all identity states", () => {
    expect(decideGoogleIdentityLink({ hasProviderIdentity: true, hasEmailMatch: true })).toBe("existing_identity");
    expect(decideGoogleIdentityLink({ hasProviderIdentity: false, hasEmailMatch: true })).toBe("link_existing_user");
    expect(decideGoogleIdentityLink({ hasProviderIdentity: false, hasEmailMatch: false })).toBe("create_google_user");
  });

  it("accepts only a fresh matching state before exchanging the Google authorization code", () => {
    const state = createGoogleAuthState();
    expect(decideGoogleCallbackOutcome({ code: "code", receivedState: state.state, storedState: state })).toBe("exchange_code");
    expect(decideGoogleCallbackOutcome({ code: "code", receivedState: "mismatch", storedState: state })).toBe("invalid_state");
    expect(decideGoogleCallbackOutcome({ code: "code", receivedState: state.state, storedState: null })).toBe("invalid_state");
    expect(decideGoogleCallbackOutcome({ code: "code", receivedState: state.state, storedState: state, providerError: "access_denied" })).toBe("provider_cancelled");
  });

  it("confirms Google accepts the configured client before an intentionally invalid authorization code is rejected", async () => {
    const result = await validateGoogleClientCredentials();
    expect(result.error).not.toBe("invalid_client");
    expect(result.status).not.toBe(401);
  }, 15_000);
});
