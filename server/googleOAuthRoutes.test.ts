import { createServer } from "node:http";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { registerGoogleOAuthRoutes } from "./googleOAuthRoutes";

const servers: Array<ReturnType<typeof createServer>> = [];

async function requestCallback(path: string) {
  const app = express();
  registerGoogleOAuthRoutes(app);
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start.");
  return fetch(`http://127.0.0.1:${address.port}${path}`, { redirect: "manual" });
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))));
});

describe("Google OAuth callback routes", () => {
  it("redirects a provider cancellation to an actionable public sign-in message", async () => {
    const response = await requestCallback("/api/auth/google/callback?error=access_denied");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/?auth=google-cancelled");
  });

  it("rejects a callback with a missing or mismatched state without exchanging its code", async () => {
    const response = await requestCallback("/api/auth/google/callback?code=untrusted-code&state=mismatch");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/?auth=google-invalid-state");
    expect(response.headers.get("set-cookie")).toContain("studysync_google_state=");
  });
});
