// scripts/set-admin.js
// Usage: node scripts/set-admin.js <UID> <true|false> <path-to-service-account.json>
// Requires: npm install firebase-admin

const admin = require('firebase-admin');
const fs = require('fs');

const [,, uid, flag, serviceAccountPath] = process.argv;
if (!uid || (flag !== 'true' && flag !== 'false') || !serviceAccountPath) {
  console.error('Usage: node scripts/set-admin.js <UID> <true|false> <path-to-service-account.json>');
  process.exit(1);
}

const serviceAccount = require(require('path').resolve(serviceAccountPath));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

admin.auth().setCustomUserClaims(uid, { admin: flag === 'true' })
  .then(() => console.log(`Set admin=${flag} for ${uid}`))
  .catch((err) => console.error('Failed to set claim', err));
