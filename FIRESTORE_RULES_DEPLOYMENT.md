# Firestore Security Rules Deployment Guide

## Updated Rules for Regular Meetup System

The `firestore.rules` file has been updated to include comprehensive security rules for the new Regular Meetup system. Here's what was added:

### New Collections Covered

1. **`club_meetups`** - Regular recurring meetup templates
2. **`regular_meetups`** - Individual meetup instances
3. **`meetup_participants`** - Detailed participant tracking
4. **`meetup_chat/{chatId}/messages`** - Meetup-specific chat messages

### Security Model

#### Helper Functions

- `isClubAdminOrManager(clubId)` - Checks if user is club admin, manager, or creator
- `isClubMember(clubId)` - Checks if user is a club member (includes admins/managers)

#### Permission Structure

- **Read Access**: Club members can read all meetup data, non-members can only read confirmed meetups
- **Create Access**: Only club admins/managers can create meetups
- **Update Access**: Admins/managers have full update rights, members can update RSVP status only
- **Delete Access**: Only admins/managers can delete meetups

## Deployment Steps

### 1. Deploy Rules via Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `lightning-tennis-community`
3. Navigate to **Firestore Database** > **Rules**
4. Copy the contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish** to deploy

### 2. Deploy Rules via Firebase CLI (Alternative)

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### 3. Test Rules Deployment

After deployment, test the rules by:

1. **Run the app** and navigate to a club's Regular Meetup tab
2. **Check console logs** - should see successful Firebase queries instead of permission errors
3. **Test RSVP functionality** - members should be able to update their participation status
4. **Test admin functions** - admins should be able to create/confirm meetups

### Expected Log Changes

**Before (with permission errors):**

```
❌ Club meetups listener error: FirebaseError: Missing or insufficient permissions.
❌ Real-time meetup listener error: FirebaseError: Missing or insufficient permissions.
```

**After (successful deployment):**

```
✅ Club meetups loaded successfully
✅ Real-time meetup listener established
✅ User RSVP updated successfully
```

## Security Features

### Data Protection

- Users can only access meetup data for clubs they belong to
- Sensitive operations (create/delete) restricted to club administrators
- RSVP updates validated to prevent unauthorized participation changes

### Role-Based Access

- **Club Creators**: Full access to all meetup operations
- **Admins/Managers**: Can create, confirm, and manage meetups
- **Members**: Can view meetups and update their own RSVP status
- **Non-members**: Can only view confirmed meetups (for discovery)

### Chat Security

- Only meetup participants can read/write chat messages
- Users can edit/delete their own messages
- Club admins can moderate all messages

## Troubleshooting

### Common Issues

1. **Rules don't take effect**: Wait 1-2 minutes for propagation
2. **Still seeing permission errors**: Clear app cache and restart
3. **Admin functions not working**: Verify user has correct role in club document

### Verification Commands

```bash
# Check if rules deployed successfully
firebase firestore:rules:get

# Test rules with Firebase emulator
firebase emulators:start --only firestore
```

## Production Checklist

- [x] Weather API key added to environment variables
- [x] Firestore security rules updated for meetup collections
- [ ] Rules deployed to Firebase Console
- [ ] Real-time listeners tested with actual Firebase data
- [ ] RSVP functionality tested by club members
- [ ] Admin meetup confirmation workflow tested

## Next Steps

1. Deploy these rules to Firebase Console
2. Test the Regular Meetup system with real Firebase data
3. Verify all permission levels work correctly
4. Monitor Firebase logs for any remaining security issues

---

**⚠️ Important**: These rules provide comprehensive security for the meetup system while maintaining the existing security model for all other collections. Deploy carefully and test thoroughly before production use.
