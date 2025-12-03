const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * When an incident is created, ensure recipient is set to 'admin' for regular users.
 * If the creator is an admin (custom claim), allow 'both' or 'users' as-is.
 */
exports.enforceRecipientOnCreate = functions.firestore
  .document('incidents/{incidentId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const createdByUid = data?.createdBy;

    try {
      if (!createdByUid) {
        // no creator — make admin only by default
        await snap.ref.update({ recipient: 'admin' });
        return null;
      }

      const userRecord = await admin.auth().getUser(createdByUid);
      const isAdmin = !!userRecord.customClaims && !!userRecord.customClaims.admin;

      if (isAdmin) {
        // leave recipient as provided (or default to both)
        if (!data.recipient) await snap.ref.update({ recipient: 'both' });
      } else {
        // Ensure it's admin-only so users won't see it until admin approves
        await snap.ref.update({ recipient: 'admin' });
      }
    } catch (err) {
      console.error('enforceRecipientOnCreate error:', err);
    }

    return null;
  });