# Firestore Security + Firebase setup — Mountain Sentinel

This file contains recommended Firestore security rules, deployment steps, and helper scripts to manage admin accounts. Use the included templates in this repo to deploy rules and hosting using the Firebase CLI.

---

Files added to this repo for Firebase setup:

- `firestore.rules` — Firestore rules (already present) that:
  - Require auth for creating incidents and include `createdBy` validation.
  - Deny regular users from reading incidents marked `recipient == 'admin'`.
  - Allow only admin users (`custom claim admin == true`) to update/delete any incidents.

- `firebase.json` — Hosting + Firestore configuration references `firestore.rules`.

- `.firebaserc` — Contains a placeholder `<YOUR_FIREBASE_PROJECT_ID>` to be replaced with your project id.

- `scripts/set-admin.js` — Helper Node script to set `admin` custom claim for a user using a service account.

---

Quick deployment steps (local, using Firebase CLI)

1. Install Firebase CLI (if not installed):

```bash
# macOS / Linux
npm install -g firebase-tools

# or Windows with npm
npm install -g firebase-tools

2. Log in and select your project:

Note about Cloud Functions and free tier:

- Cloud Functions (serverless) are powerful but they require the Blaze (pay-as-you-go) plan for production-level usage and outbound network calls. If you want to keep everything free under the Firebase Spark (free) tier, do not deploy server-side functions or external services that require billing. The repository contains an example Cloud Function in `functions/index.js` (enforceRecipientOnCreate) but deploying that function may require a paid plan in some projects.

Instead, this repository uses a combination of strict Firestore rules and an admin-side helper script to manage admin custom claims without needing functions — that keeps your deployment on the free tier.

firebase projects:list
firebase use <YOUR_FIREBASE_PROJECT_ID>

```

3. Deploy Firestore rules and Hosting (if you also want to deploy built app):

````bash

# Free-tier deploy (Hosting + Firestore rules, no functions/billing required)
Use the helper npm script added to this repository — it builds the Angular app, then deploys hosting and your Firestore rules in one step:

```powershell
npm run deploy:free
````

If you prefer the CLI steps directly, do:

```powershell
# build the app first
npm run build

# deploy hosting (dist output) and rules only
firebase deploy --only hosting,firestore:rules
```

# deploy hosting + rules (make sure you built your app into the `public` folder or configured Angular build for hosting)

npm run build
firebase deploy --only hosting,firestore:rules

````

4. Set an admin user (server side operation; still free — run locally)

Use the helper script (`scripts/set-admin.js`). You only need to run this locally using the Firebase Admin SDK and a service-account key; this does not require you to deploy functions or enable billing. Steps:

1. Download a Service Account JSON from Firebase Console → Project Settings → Service accounts → Generate new private key.
2. From your local machine install the tools and run the script:

```powershell
npm install firebase-admin
node ./scripts/set-admin.js <UID> true <path/to/serviceAccountKey.json>
````

```bash
# install firebase-admin on your machine if not already
npm install firebase-admin

# usage
node ./scripts/set-admin.js <UID> true <path/to/serviceAccountKey.json>

# to remove admin
node ./scripts/set-admin.js <UID> false <path/to/serviceAccountKey.json>
```

Notes:

- After setting the custom claim, the user must sign out and sign back in to pick up the refreshed token (auth changes take effect only after token refresh).

---

Security recommendations (production-ready):

- Use Firestore rules to enforce createdBy matches request.auth.uid and limit who can set `recipient` to 'admin' (only admin should be able to set recipient:'admin' — currently we accept recipient from client for flexibility during development). Consider moving recipient assignments to backend (trusted environment or Cloud Function).

- Add rate-limiting (Cloud Functions or a small backend API, which may require Blaze billing) or CAPTCHA (reCAPTCHA) on the report form to reduce spam. reCAPTCHA can be used on the client side while staying on the free tier.

Email verification (optional, not enforced right now):

- Reporting and SOS currently require a signed-in account, but email verification is not enforced by rules. This keeps the user experience simple while ensuring only registered users can submit incidents.
- If you want stronger protection later you can enable email verification checks and have the client require verification before allowing reports.

Quick checklist to stay on the free (Spark) tier and keep basic security:

1. Enable Email/Password authentication in the Firebase Console (Authentication → Sign-in method → Email/Password).
2. Require users to sign-up/sign-in before reporting (email verification is optional and not enforced in rules).
3. Use the included `scripts/set-admin.js` to mark trusted admin accounts locally (no functions / no billing necessary).

Short, relevant rule snippet (already present in `firestore.rules`):

```text
// non-admin creators must be signed-in and match createdBy
request.auth != null
&& (request.resource.data.createdBy == request.auth.uid || request.resource.data.createdBy == request.auth.token.email)
&& (request.auth.token.admin == true || request.resource.data.recipient == 'admin')
```

Testing: Use the Firebase Emulator Suite (free) locally to validate rules and client behavior before deploying.

Quick tests you can run locally (Emulator):

1. Start the emulators for Auth and Firestore:

```powershell
firebase emulators:start --only firestore,auth
```

2. In another terminal, use the Firebase Admin SDK or the Emulator UI to create a test user (no email verification required) and sign in with the app.

3. Attempt to create an incident from the app while signed out — the rules should deny it. The report page and submit action are only available to signed-in users; the UI provides a sign-up or login flow when not signed in.

4. Sign in as the test user and attempt to create an incident — the request should succeed and the incident `createdBy` should match the user's UID or email.

5. UI tests (manual):

- Attempt to click the map and report while signed out — the app should redirect you to the sign-up/login page.
- After signing in, click the map again and confirm the report form is prefilling the coordinates and you can submit the incident.

5. (Optional) Test an admin user flow: mark a user as admin (using the helper script and the emulator admin SDK), sign in and create an incident with recipient:'users' or 'both' to validate admin behavior.

Auto-admin (first visitor) behaviour — how it works in this repo (MVP):

- The app creates a `/users/{uid}` document when a new user registers.
- If there is no existing admin marker document at `/config/adminExists`, the first registered user will be created with role `admin` and a `/config/adminExists` document will be written.
- Subsequent users will be created as `citizen`.

Testing (Emulator):

1. Start the emulator:

```powershell
firebase emulators:start --only firestore,auth
```

2. Register a fresh user via the app (open `/login?signup=true`) — the first registered user should be created as `admin`.

3. In the Emulator UI or via the Firestore console, verify there is a `config/adminExists` document and the user's `/users/{uid}` document has `role: "admin"`.

4. Register another user and confirm the second user has `role: "citizen"`.

Note: This approach uses a simple marker document to avoid requiring server-side Cloud Functions or manual custom claims assignment for the MVP. For production-ready systems, consider using a trusted server-side process (Cloud Function or admin SDK) to set custom claims and prevent client-side role escalation.

This proves the application requires a signed-in user to report but does not yet require email verification.

- Use Firebase Emulator Suite locally to test rules before deploying.

---

If you'd like, I can:

- Keep everything free and avoid deploying functions: tighten rules, rely on local admin scripts. Email verification remains optional and can be added later if you want stricter checks.
- Or, if you want server-side enforcement (extra protection) I can help prepare and deploy the Cloud Function, but note this may require enabling Blaze billing for that project.

Tell me which option you'd like and I can finish the setup and run through a test using the Firebase Emulator Suite or your project directly.

Tell me which of the above you want next and I will implement it.
