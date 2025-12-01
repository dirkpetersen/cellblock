# CellBlock Email Service Integration

This document describes the complete email service implementation for the CellBlock backend.

## Overview

The email service provides a flexible, provider-agnostic system for sending transactional emails with beautiful HTML templates. The system automatically detects and uses the best available email provider based on environment configuration.

## Architecture

### Components

1. **Email Providers** (`email-providers/`)
   - `email-provider.interface.ts` - Common interface for all providers
   - `sendgrid.provider.ts` - SendGrid integration
   - `aws-ses.provider.ts` - AWS SES integration
   - `console.provider.ts` - Development console logging

2. **Template System**
   - `email-template.service.ts` - Template rendering engine
   - `templates/` - HTML email templates with variables

3. **Integration**
   - `notifications.service.ts` - Main service that orchestrates email sending
   - Auto-detects provider based on environment variables
   - Queue-based sending with retry logic
   - Database tracking of sent/failed emails

## Email Templates

All templates are responsive, mobile-friendly, and follow CellBlock's brand guidelines:

### Available Templates

1. **verification.html** - Email verification for new users
2. **password-reset.html** - Password reset link
3. **warden-invitation.html** - Warden invitation with accept/decline
4. **break-glass.html** - Break glass notification to wardens
5. **monthly-report.html** - Monthly usage report
6. **device-offline.html** - Device offline warning
7. **warden-reminder.html** - Reminder to add a warden
8. **request-notification.html** - Pending request alert
9. **parole-granted.html** - Emergency time notification
10. **lockdown-warning.html** - Lockdown notification

### Template Features

- **Brand Colors**: Teal (#0D9488), Slate (#475569)
- **Inline CSS**: Maximum email client compatibility
- **Responsive Design**: Works on all devices
- **Variable Substitution**: Dynamic content via `{{variable}}` syntax
- **Conditional Blocks**: `{{#if condition}}...{{/if}}`
- **Loops**: `{{#each items}}...{{/each}}`

## Provider Selection

The system automatically selects a provider in this priority order:

### 1. Development/Test Mode
```bash
NODE_ENV=development  # Uses ConsoleEmailProvider
NODE_ENV=test         # Uses ConsoleEmailProvider
```

### 2. SendGrid (Recommended)
```bash
SENDGRID_API_KEY=SG.xxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@cellblock.app
```

**Pros:**
- Easy setup with API key
- Reliable delivery
- Good analytics
- Generous free tier

**Setup:**
1. Sign up at https://sendgrid.com
2. Create API key at https://app.sendgrid.com/settings/api_keys
3. Verify sender email address
4. Add credentials to `.env`

### 3. AWS SES
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SES_FROM_EMAIL=noreply@cellblock.app
```

**Pros:**
- Very low cost
- High deliverability
- Integrated with AWS ecosystem

**Setup:**
1. Enable SES in AWS console
2. Verify sender email/domain
3. Request production access (remove sandbox mode)
4. Create IAM credentials with SES permissions
5. Add credentials to `.env`

### 4. Console (Fallback)
- Used when no provider is configured
- Logs emails to console instead of sending
- Perfect for local development

## Usage

### Basic Email Sending

```typescript
import { NotificationsService } from './modules/notifications/notifications.service';

// Inject the service
constructor(private notificationsService: NotificationsService) {}

// Send a verification email
await this.notificationsService.sendVerificationEmail(
  'user@example.com',
  'verification-token-123'
);

// Send a password reset email
await this.notificationsService.sendPasswordResetEmail(
  'user@example.com',
  'reset-token-456'
);
```

### Service Methods

```typescript
// Email verification
sendVerificationEmail(email: string, token: string)

// Password reset
sendPasswordResetEmail(email: string, token: string)

// Warden invitation
sendWardenInvitation(email: string, inmateName: string, token: string)

// Break glass notification (to multiple wardens)
sendBreakGlassNotification(wardenEmails: string[], inmateName: string, comment?: string)

// Monthly usage report
sendMonthlyReport(wardenEmail: string, inmateName: string, usageData: any)
```

### Custom Email Sending

```typescript
// Send custom email with template
const html = await this.emailTemplateService.renderTemplate('template-name', {
  variable1: 'value1',
  variable2: 'value2',
});

await this.notificationsService.sendEmail({
  to: 'user@example.com',
  subject: 'Your Subject',
  html,
});
```

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# For SendGrid
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM_EMAIL=noreply@cellblock.app

# OR for AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SES_FROM_EMAIL=noreply@cellblock.app

# Frontend URL (for email links)
FRONTEND_URL=https://app.cellblock.com
```

### Switching Providers

The system automatically switches providers based on available credentials:

**To use SendGrid:**
- Set `SENDGRID_API_KEY`
- Remove or unset AWS credentials

**To use AWS SES:**
- Set AWS credentials
- Remove or unset `SENDGRID_API_KEY`

**To use Console (development):**
- Set `NODE_ENV=development`
- Or remove all email provider credentials

## Database Tracking

All emails are tracked in the `Notification` table:

```prisma
model Notification {
  id           String   @id @default(cuid())
  userId       String
  type         String   // "email"
  channel      String   // "email"
  recipient    String   // Email address
  subject      String
  body         String   // HTML content
  status       String   // "pending", "sent", "failed"
  sentAt       DateTime?
  failedReason String?
  retryCount   Int      @default(0)
  createdAt    DateTime @default(now())
}
```

## Retry Logic

Failed emails are automatically retried:

- Maximum 3 retry attempts
- Retry job runs periodically
- Exponential backoff between retries
- Failed emails logged with reason

## Testing

### Development Testing

In development mode, emails are logged to the console:

```
================================================================================
EMAIL (Console Provider - Development Mode)
================================================================================
To: user@example.com
From: noreply@cellblock.app
Subject: Verify your CellBlock email
--------------------------------------------------------------------------------
HTML Content:
<!DOCTYPE html>...
================================================================================
```

### Integration Testing

```typescript
describe('Email Service', () => {
  it('should send verification email', async () => {
    const result = await notificationsService.sendVerificationEmail(
      'test@example.com',
      'test-token'
    );

    expect(result.status).toBe('sent');
  });
});
```

## Security Considerations

1. **API Keys**: Store in environment variables, never commit to Git
2. **Sender Verification**: Always verify sender email addresses
3. **Rate Limiting**: Implement rate limits on email-triggering endpoints
4. **SPF/DKIM**: Configure DNS records for better deliverability
5. **Unsubscribe**: Include unsubscribe links for marketing emails

## Monitoring

Monitor email delivery health:

```sql
-- Email success rate
SELECT
  COUNT(*) FILTER (WHERE status = 'sent') * 100.0 / COUNT(*) as success_rate,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM "Notification"
WHERE type = 'email'
  AND "createdAt" > NOW() - INTERVAL '24 hours';

-- Failed emails by reason
SELECT
  "failedReason",
  COUNT(*) as count
FROM "Notification"
WHERE status = 'failed'
  AND type = 'email'
GROUP BY "failedReason"
ORDER BY count DESC;
```

## Troubleshooting

### Emails not sending

1. Check provider initialization logs:
   ```
   [NotificationsService] Email provider: SendGrid (verified)
   ```

2. Verify credentials are correct in `.env`

3. Check SendGrid/AWS console for errors

4. Review failed notifications in database:
   ```sql
   SELECT * FROM "Notification"
   WHERE status = 'failed'
   ORDER BY "createdAt" DESC
   LIMIT 10;
   ```

### Provider verification fails

**SendGrid:**
- Verify API key is correct
- Check API key has "Mail Send" permission
- Verify sender email address

**AWS SES:**
- Ensure SES is enabled in region
- Verify IAM credentials have SES permissions
- Check email/domain is verified
- Verify account is out of sandbox mode

### Template rendering errors

- Ensure template files exist in `templates/` directory
- Check variable names match template variables
- Verify template syntax is valid

## Production Checklist

Before going to production:

- [ ] Configure SendGrid or AWS SES with production credentials
- [ ] Verify sender email domain
- [ ] Set up SPF and DKIM DNS records
- [ ] Configure `FRONTEND_URL` to production domain
- [ ] Test all email templates
- [ ] Set up monitoring for email delivery
- [ ] Configure retry job schedule
- [ ] Review and set appropriate rate limits
- [ ] Add unsubscribe functionality for marketing emails

## Future Enhancements

Potential improvements:

1. **Email Queuing**: Use Redis or SQS for better queue management
2. **Batch Sending**: Send multiple emails in one API call
3. **Template Editor**: Web UI for editing templates
4. **A/B Testing**: Test different email versions
5. **Analytics**: Track open rates, click rates
6. **Attachments**: Support for file attachments
7. **Scheduling**: Schedule emails for future delivery
8. **Localization**: Multi-language template support
