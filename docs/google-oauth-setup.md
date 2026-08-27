# Google OAuth Setup for StudySync

StudySync uses Google’s server-side authorization-code flow with a signed, short-lived state cookie and PKCE. Google requires a **Web application** OAuth client, a configured consent screen, and an exact redirect URI that matches the callback used by the app.

## Google Cloud Console configuration

1. Create or select a Google Cloud project, then open **Google Auth Platform** or **APIs & Services → Credentials**.
2. Configure the consent screen. For class testing, select **External** unless your institution specifically requires an internal Google Workspace application. Add your Google account as a test user while the app remains in testing.
3. Create an **OAuth client ID** with application type **Web application**.
4. Add the exact redirect URI shown in the StudySync project preview after deployment: `https://YOUR-PROJECT-DOMAIN/api/auth/google/callback`.
5. For the current StudySync preview, copy the HTTPS address shown in the preview browser, then append `/api/auth/google/callback` to form the exact redirect URI.
6. For local development only, also add `http://localhost:3000/api/auth/google/callback` if you intend to test on that address.
7. Copy the generated client ID and client secret into the StudySync project secrets as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; never commit these values to source control.

## Current configuration status

The existing Google OAuth web client has been configured with both `http://localhost:3000/api/auth/google/callback` and the secure StudySync preview callback URL. Google Cloud Console may take a few minutes to activate a new redirect URI. Before the first end-to-end sign-in attempt, confirm that the consent screen’s audience includes the intended tester while the application is in testing mode.

The end-to-end preview sign-in has been verified: Google returned to `/api/auth/google/callback`, StudySync created or linked the Google identity, and the browser reached the authenticated dashboard with `auth=google-success`.

The implementation requests only the `openid`, `email`, and `profile` scopes needed for account identity. Google’s authorization guidance requires the redirect URI to be registered exactly and recommends state validation to protect against cross-site request forgery. The Google OAuth web-server documentation also describes the authorization-code flow used by this integration.

## Sources

- [Google: Using OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google: Setting up OAuth 2.0](https://support.google.com/googleapi/answer/6158849?hl=en)
