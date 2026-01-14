# 📧 Email Notification System Setup Guide

This guide explains how to configure and use the Lightning Pickleball email notification system.

## 📋 Overview

The email notification system uses **SendGrid** to send professional HTML emails to users for important events:

- 🏆 Tournament invitations
- ⚡ Team partner invitations
- 🎾 Match reminders
- 🏅 Tournament completion results
- 📊 Weekly activity summaries

## 🚀 Setup Instructions

### Step 1: Get SendGrid API Key

1. Go to [SendGrid](https://sendgrid.com/) and create a free account
   - Free tier: 100 emails/day
   - Paid tier: Scalable pricing

2. Navigate to **Settings > API Keys**

3. Click **Create API Key**
   - Name: `Lightning Pickleball Functions`
   - Permissions: **Full Access** or **Mail Send** only

4. Copy the API key (you'll only see it once!)

### Step 2: Verify Sender Email

1. In SendGrid dashboard, go to **Settings > Sender Authentication**

2. Choose one option:
   - **Domain Authentication** (recommended for production)
     - Verify `lightning-pickleball.com` domain
     - Follow DNS setup instructions

   - **Single Sender Verification** (quick start)
     - Add sender email (e.g., `noreply@lightning-pickleball.com`)
     - Verify via email confirmation

3. Update `FROM_EMAIL` in `emailNotificationSender.ts`:
   ```typescript
   const FROM_EMAIL = 'noreply@lightning-pickleball.com'; // Your verified email
   ```

### Step 3: Configure Firebase Functions

Set the SendGrid API key as an environment variable:

```bash
# For local development (.env file)
echo "SENDGRID_API_KEY=YOUR_API_KEY_HERE" >> functions/.env

# For production (Firebase config)
firebase functions:config:set sendgrid.api_key="YOUR_API_KEY_HERE"

# Verify configuration
firebase functions:config:get
```

### Step 4: Deploy Functions

```bash
cd functions
npm run build
npm run deploy

# Or deploy specific function
firebase deploy --only functions:sendTournamentInvitationEmail
```

## 📚 Usage Examples

### Send Tournament Invitation Email

```typescript
import { sendTournamentInvitationEmail } from './utils/emailNotificationSender';

const result = await sendTournamentInvitationEmail(
  'user123', // userId
  'John Doe', // userName
  'Summer Championship', // tournamentName
  'tour123', // tournamentId
  'Seoul Pickleball Club' // clubName
);

if (result.success) {
  console.log('✅ Email sent successfully');
} else {
  console.error('❌ Email failed:', result.error);
}
```

### Send Team Invitation Email

```typescript
import { sendTeamInvitationEmail } from './utils/emailNotificationSender';

await sendTeamInvitationEmail(
  'user456', // inviteeId
  'Jane Smith', // inviteeName
  'John Doe', // inviterName
  'Summer Championship', // tournamentName
  'team123' // teamId
);
```

### Send Match Reminder Email

```typescript
import { sendMatchReminderEmail } from './utils/emailNotificationSender';

await sendMatchReminderEmail(
  'user123', // userId
  'John Doe', // userName
  'Jane Smith', // opponentName
  '2025-11-15 14:00', // matchTime
  'Seoul Pickleball Club Court 1', // location
  'match123' // matchId
);
```

### Send Tournament Completion Email

```typescript
import { sendTournamentCompletionEmail } from './utils/emailNotificationSender';

await sendTournamentCompletionEmail(
  'user123', // userId
  'John Doe', // userName
  'Summer Championship', // tournamentName
  '1st', // placement
  +45, // eloChange
  'tour123' // tournamentId
);
```

### Send Weekly Summary Email

```typescript
import { sendWeeklySummaryEmail } from './utils/emailNotificationSender';

await sendWeeklySummaryEmail('user123', 'John Doe', {
  matchesPlayed: 8,
  wins: 5,
  losses: 3,
  eloChange: +32,
  newBadges: 2,
  upcomingMatches: 3,
});
```

## 🔧 Integration with Cloud Functions

### Example: Tournament Invitation Trigger

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendTournamentInvitationEmail } from './utils/emailNotificationSender';

export const onTournamentParticipantAdded = onDocumentCreated(
  'tournaments/{tournamentId}/participants/{participantId}',
  async event => {
    const participant = event.data.data();
    const tournamentId = event.params.tournamentId;

    // Fetch tournament data
    const tournamentSnap = await admin.firestore().doc(`tournaments/${tournamentId}`).get();
    const tournament = tournamentSnap.data();

    // Send email
    await sendTournamentInvitationEmail(
      participant.userId,
      participant.userName,
      tournament.name,
      tournamentId,
      tournament.clubName
    );
  }
);
```

## 📊 Monitoring & Logs

### View Email Logs in Firestore

```typescript
// Query email notification logs
const logs = await admin
  .firestore()
  .collection('email_notification_logs')
  .where('userId', '==', 'user123')
  .where('status', '==', 'sent')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get();
```

### Check SendGrid Dashboard

1. Go to SendGrid dashboard
2. Navigate to **Activity**
3. View real-time email delivery status
4. Check bounce/spam reports

### Firebase Functions Logs

```bash
# View all function logs
firebase functions:log

# Filter by function name
firebase functions:log --only sendTournamentInvitationEmail

# Tail logs in real-time
firebase functions:log --tail
```

## 🎨 Email Template Customization

The email template uses a clean, responsive design with:

- Gradient header with Lightning Pickleball branding
- Clear content sections
- Call-to-action buttons
- Mobile-responsive layout

To customize the template, edit `generateEmailTemplate()` in `emailNotificationSender.ts`.

### Template Structure

```html
- Header (purple gradient with ⚡ Lightning Pickleball) - Content Section - Title (H2) - Body (HTML
content) - CTA Button (optional) - Footer - Contact information - Support email
```

## 🔐 Security Best Practices

1. **Never commit API keys to Git**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Use domain authentication**
   - More reliable delivery
   - Better sender reputation

3. **Monitor spam reports**
   - Keep unsubscribe option
   - Respect user preferences

4. **Rate limiting**
   - SendGrid free tier: 100 emails/day
   - Consider batch sending for large tournaments

## 🐛 Troubleshooting

### Email not sending

1. **Check API key**

   ```bash
   firebase functions:config:get sendgrid.api_key
   ```

2. **Verify sender email**
   - Must be verified in SendGrid dashboard
   - Update `FROM_EMAIL` constant

3. **Check function logs**

   ```bash
   firebase functions:log --tail
   ```

4. **Test locally**
   ```bash
   cd functions
   npm run serve
   ```

### Email goes to spam

1. **Use domain authentication** instead of single sender
2. **Avoid spam trigger words** in subject/body
3. **Add unsubscribe link** (required for bulk emails)
4. **Warm up your domain** (gradually increase email volume)

### SendGrid API errors

- **401 Unauthorized**: Invalid API key
- **403 Forbidden**: Sender not verified
- **429 Too Many Requests**: Rate limit exceeded
- **500 Server Error**: SendGrid service issue

## 📈 Future Enhancements

- [ ] Email templates in Korean/English (i18n)
- [ ] User email preferences (opt-in/opt-out)
- [ ] HTML/Plain text email preview
- [ ] A/B testing for email content
- [ ] Email analytics dashboard
- [ ] Scheduled emails (weekly summaries)
- [ ] Rich media support (images, videos)

## 📞 Support

For issues or questions:

- **SendGrid Docs**: https://docs.sendgrid.com/
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **Lightning Pickleball Team**: support@lightning-pickleball.com

---

**Last Updated**: 2025-11-11
**Maintained By**: Kim (Chief Project Architect)
