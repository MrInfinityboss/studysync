import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "./db";
import { createGoogleAuthorizationUrl, createGoogleAuthState, createSignedGoogleStateCookie, decideGoogleCallbackOutcome, exchangeGoogleCode, fetchGoogleIdentity, getGoogleOauthConfig, readSignedGoogleStateCookie } from "./googleOAuth";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

const GOOGLE_STATE_COOKIE = "studysync_google_state";

function requestOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto.split(",")[0].trim() : req.protocol;
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = typeof forwardedHost === "string" ? forwardedHost.split(",")[0].trim() : req.get("host");
  if (!host) throw new Error("Could not determine the StudySync callback host.");
  return `${protocol}://${host}`;
}

function clearGoogleState(res: Response, req: Request) {
  res.clearCookie(GOOGLE_STATE_COOKIE, { ...getSessionCookieOptions(req), maxAge: -1 });
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/auth/google", (req: Request, res: Response) => {
    try {
      getGoogleOauthConfig();
      const state = createGoogleAuthState();
      res.cookie(GOOGLE_STATE_COOKIE, createSignedGoogleStateCookie(state), { ...getSessionCookieOptions(req), maxAge: 10 * 60 * 1000 });
      res.redirect(302, createGoogleAuthorizationUrl(requestOrigin(req), state));
    } catch (error) {
      console.error("[Google OAuth] Authorization start failed", error);
      res.redirect(302, "/?auth=google-configuration-error");
    }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    const providerError = typeof req.query.error === "string" ? req.query.error : undefined;
    const cookieValue = parseCookieHeader(req.headers.cookie ?? "")[GOOGLE_STATE_COOKIE];
    const storedState = readSignedGoogleStateCookie(cookieValue);
    clearGoogleState(res, req);

    const outcome = decideGoogleCallbackOutcome({ code, receivedState: state, storedState, providerError });
    if (outcome === "provider_cancelled") {
      res.redirect(302, "/?auth=google-cancelled");
      return;
    }
    if (outcome === "invalid_state") {
      res.redirect(302, "/?auth=google-invalid-state");
      return;
    }
    if (!code || !storedState) {
      res.redirect(302, "/?auth=google-invalid-state");
      return;
    }

    try {
      const origin = requestOrigin(req);
      const tokens = await exchangeGoogleCode({ code, origin, codeVerifier: storedState.codeVerifier });
      const identity = await fetchGoogleIdentity(tokens.access_token);
      const user = await db.createOrLinkGoogleIdentity(identity);
      const sessionToken = await sdk.createSessionToken(`google:${identity.sub}`, { name: user.name || identity.name || "StudySync member", expiresInMs: ONE_YEAR_MS });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, "/dashboard?auth=google-success");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.redirect(302, "/?auth=google-failed");
    }
  });
}
