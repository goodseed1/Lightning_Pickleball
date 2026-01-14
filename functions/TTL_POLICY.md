# Firestore TTL (Time To Live) Policy

## Overview

This document describes the TTL (Time To Live) policy for archived documents in Firestore.

**Policy**: Archived documents are automatically deleted after **1 year** from the archive date.

---

## Affected Collections

| Archive Collection                   | TTL Field          | Retention Period |
| ------------------------------------ | ------------------ | ---------------- |
| `participation_applications_archive` | `archiveExpiresAt` | 1 year           |
| `events_archive`                     | `archiveExpiresAt` | 1 year           |

---

## How It Works

### 1. Archiving Process (Automatic)

The `archiveOldData` Cloud Function runs **daily at 2 AM** and:

1. **Identifies Eligible Documents**:
   - Status contains `'cancelled'` (any variant)
   - Document is older than **6 months** (180 days)
   - Based on `cancelledAt`, `processedAt`, or `updatedAt` timestamp

2. **Archives Documents**:
   - Copies document to archive collection
   - Adds `archivedAt` timestamp (current time)
   - **Adds `archiveExpiresAt` timestamp** (current time + 1 year)
   - Deletes document from original collection

### 2. TTL Deletion (Manual Configuration Required)

After archiving, documents in archive collections are **automatically deleted** after 1 year, based on the `archiveExpiresAt` field.

**IMPORTANT**: TTL deletion is handled by **Firestore's built-in TTL feature**, which must be **configured manually in Firebase Console**.

---

## Firebase Console Configuration

### Step 1: Navigate to Firestore TTL Settings

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click on the **"TTL"** tab (next to "Data", "Rules", "Indexes")

### Step 2: Create TTL Policy for `participation_applications_archive`

1. Click **"Create policy"** or **"Add field"**
2. Fill in the following:
   - **Collection ID**: `participation_applications_archive`
   - **TTL field**: `archiveExpiresAt`
   - **Field type**: `Timestamp`
3. Click **"Create"** or **"Save"**

### Step 3: Create TTL Policy for `events_archive`

1. Repeat the same process:
   - **Collection ID**: `events_archive`
   - **TTL field**: `archiveExpiresAt`
   - **Field type**: `Timestamp`
2. Click **"Create"** or **"Save"**

### Step 4: Verify Configuration

After creating the policies:

- TTL policies may take **24-72 hours** to become active
- Check the TTL tab to see the policies listed
- Monitor Firestore logs for TTL deletion activity

---

## Important Notes

### ⚠️ TTL Configuration is Manual

- **Cannot be configured via code** (Security limitation)
- Must be set up through Firebase Console
- Applies to all documents in the collection with the TTL field

### ⏰ TTL Deletion Timing

- Firestore TTL deletion is **not real-time**
- Documents may be deleted **within 72 hours** after expiration
- Deletion is handled by Firebase's background processes

### 🔍 Monitoring

- Check Firebase Console → Firestore → TTL tab for policy status
- Monitor Cloud Functions logs for archiving activity
- Check Firestore usage metrics for storage impact

### 🛡️ Data Recovery

- **Once deleted by TTL, documents cannot be recovered**
- If you need longer retention, adjust the TTL period in the Cloud Function:
  ```typescript
  const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000; // Change to 2 years: 730 days
  ```

---

## Testing TTL (Development/Staging)

To test TTL functionality without waiting 1 year:

1. **Temporarily reduce TTL period** in `archiveOldData.ts`:

   ```typescript
   // For testing: 1 day TTL
   const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
   const archiveExpiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + ONE_DAY_IN_MS);
   ```

2. **Deploy the function** and trigger archiving
3. **Wait 24-72 hours** for TTL to process
4. **Verify deletion** in Firestore Console
5. **Restore original TTL period** (1 year) before production deployment

---

## Troubleshooting

### TTL Not Deleting Documents

**Possible Causes**:

1. TTL policy not configured in Firebase Console
2. `archiveExpiresAt` field is missing or has wrong type
3. TTL deletion may take up to 72 hours after expiration
4. TTL is disabled for the project (contact Firebase Support)

**Solutions**:

- Verify TTL policy exists in Console → Firestore → TTL tab
- Check archived documents have `archiveExpiresAt` field
- Wait at least 72 hours after expiration time
- Enable billing if required (TTL may require Blaze plan)

### Archived Documents Missing `archiveExpiresAt`

**Cause**: Cloud Function was not running when documents were archived

**Solution**:

1. Run a one-time migration script to add `archiveExpiresAt` to existing archived documents:

   ```typescript
   // One-time migration (run in Firebase Console)
   const archiveCollections = ['participation_applications_archive', 'events_archive'];

   for (const collection of archiveCollections) {
     const snapshot = await db.collection(collection).get();
     const batch = db.batch();

     for (const doc of snapshot.docs) {
       if (!doc.data().archiveExpiresAt) {
         const archivedAt = doc.data().archivedAt;
         const expiresAt = new Date(archivedAt.toMillis() + ONE_YEAR_IN_MS);
         batch.update(doc.ref, { archiveExpiresAt: expiresAt });
       }
     }

     await batch.commit();
   }
   ```

---

## Reference

- [Firestore TTL Documentation](https://firebase.google.com/docs/firestore/ttl)
- [Cloud Functions Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)
- [Firestore Batch Operations](https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes)

---

**Last Updated**: 2025-11-21
**Maintained By**: Lightning Pickleball Team
