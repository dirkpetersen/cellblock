# Inmate Guide

This guide covers everything you need to know about using CellBlock to manage your screen time effectively.

## Understanding Your Dashboard

When you open CellBlock or visit the web dashboard, you'll see your current status at a glance.

### Time Remaining

**Desktop/Web Dashboard:**

- Large countdown timer showing remaining minutes
- Updates in real-time as you use your devices
- Color coding:
    - Green: More than 30 minutes remaining
    - Yellow: 15-30 minutes remaining
    - Red: Less than 15 minutes remaining

**Windows System Tray:**

- Hover over the CellBlock icon to see remaining time
- Quick access without opening the full app

**iOS Widget:**

- Add CellBlock widget to your home screen
- See remaining time at a glance

### Device Status

View all your connected devices:

- Device name and platform (iOS/Windows)
- Last active timestamp
- Currently active indicator (green dot)

### Quick Actions

- **Request Whitelist Addition** - Add a new app or website
- **Request Time Budget Change** - Ask for more daily/weekly time
- **View Usage History** - See past usage patterns
- **Break Glass** - Emergency unlock (ends warden relationship)

## Setting Time Budgets

Your time budget controls how much recreational screen time you get each day and week.

### Daily Limits

Set limits for each day of the week:

1. Go to **Settings → Time Budget**
2. Choose your schedule type:
    - **Uniform**: Same limit every day
    - **Weekday/Weekend**: Different limits for weekdays vs weekends
    - **Custom**: Unique limit for each day
3. Adjust sliders to set minutes (0-300 per day)
4. Click **Save Changes**

!!! example "Example Schedules"

    **Student Schedule**

    - Mon-Thu: 90 minutes (homework days)
    - Fri: 150 minutes (end of week)
    - Sat-Sun: 180 minutes (weekend)
    - Weekly Max: 1020 minutes

    **Professional Schedule**

    - Mon-Fri: 60 minutes (work days)
    - Sat-Sun: 240 minutes (free time)
    - Weekly Max: 780 minutes

### Weekly Maximum

Prevents excessive use even if daily limits allow it:

1. Set your weekly maximum in minutes
2. Must be at least equal to your highest daily limit × 7
3. When weekly limit is exhausted, all remaining days are locked

!!! warning "Weekly Limit Priority"
    If you exhaust your weekly limit mid-week, you'll be locked out even if daily budgets remain. Plan accordingly!

### Requesting Changes

After your warden accepts their invitation, time budget changes require approval:

1. Go to **Settings → Time Budget**
2. Make your desired changes
3. Add a comment explaining why (recommended)
4. Click **Request Changes**
5. Your warden receives a notification
6. Changes apply after approval

**Request Comments Example:**

> "Starting a new online course that requires 30 extra minutes Mon-Wed. Need to increase weekday limits from 90 to 120 minutes for the next 8 weeks."

### Timezone Configuration

Your budget resets at midnight in your configured timezone:

1. Go to **Settings → General → Timezone**
2. Search for your city or select from list
3. Click **Save**

!!! info "Traveling?"
    Your budget resets at midnight in your configured timezone, not your current location. If you travel temporarily, keep your home timezone. If you relocate permanently, update your timezone.

## Managing Whitelist

The whitelist determines what remains accessible when your time budget expires.

### Whitelist Categories

#### 1. Utility Apps (Always Allowed)

Essential apps that never count toward your budget:

- Phone, Messages, FaceTime (iOS)
- Maps, Calendar, Clock, Calculator
- Banking apps (manually add yours)
- Weather apps

**These cannot be disabled.** They're always accessible.

#### 2. Healthy Apps (Optional)

Less distracting content, allowed by default but can be disabled:

- Spotify, Apple Music, Audible
- Podcasts, Kindle
- Meditation apps

**Toggle these on/off:**

1. Go to **Settings → Whitelist**
2. Find the "Healthy Apps" section
3. Toggle switches to enable/disable
4. After warden accepts: Requires warden approval

#### 3. Custom Apps (User-Added)

Apps and websites you add yourself:

1. Go to **Settings → Whitelist**
2. Click **Add Custom Item**
3. Enter details:
    - **Name**: Display name (e.g., "Work Slack")
    - **iOS Bundle ID** (if iOS): e.g., `com.tinyspeck.chatlyio`
    - **Windows Domain** (if Windows): e.g., `slack.com`
4. Add a comment explaining why (required after warden accepts)
5. Click **Add to Whitelist**

!!! tip "Finding Bundle IDs"
    On iOS, you can find bundle IDs by:

    1. Search Google for "[app name] bundle ID"
    2. Use apps like "My Bundle ID" from App Store
    3. Check developer documentation

### Requesting Whitelist Additions

After your warden accepts:

1. Click **Add Custom Item**
2. Fill in the details
3. **Write a clear comment** explaining why you need it:

    Good example:
    > "Need Zoom (us.zoom.videomeetings) for daily standup meetings with my remote team. Meetings are 9-9:30 AM Monday through Friday."

    Bad example:
    > "need this"

4. Click **Request Addition**
5. Wait for warden approval (they have 3 days to respond)
6. You'll receive email notification of their decision

### Removing Whitelist Items

To remove a custom item you previously added:

1. Go to **Settings → Whitelist**
2. Find the item in your custom list
3. Click the trash icon
4. If warden has accepted: Requires warden approval
5. If no warden: Removed immediately

!!! note "Warden-Added Items"
    Your warden can add items directly to your whitelist. These appear in your list and you can't remove them without warden approval.

## Inviting Wardens

Wardens provide accountability by approving your settings changes. You can have up to 4 wardens.

### Primary Warden

Your main warden who receives all notifications:

1. Go to **Settings → Wardens**
2. Click **Invite Primary Warden**
3. Enter their email address
4. Add a personal message (optional):

    Example:
    > "Hey Sarah! Would you be willing to be my warden on CellBlock? I'm trying to reduce my phone usage and need someone to help keep me accountable. You'd get notifications when I request changes and can grant me emergency time if needed. Thanks!"

5. Click **Send Invitation**

**What happens next:**

- Your warden receives an email with accept/decline links
- Until they accept:
    - You can change settings freely
    - No approval required for changes
- After they accept:
    - All whitelist changes require their approval
    - All time budget changes require their approval
    - They can grant parole or trigger lockdowns

### Backup Wardens

Add up to 3 backup wardens for redundancy:

1. Go to **Settings → Wardens**
2. Scroll to "Backup Wardens"
3. Click **Add Backup Warden**
4. Enter email and message
5. Click **Send Invitation**

**Why backup wardens?**

- If primary warden is unavailable, backups can approve
- If primary warden resigns, backup is promoted automatically
- Any warden can approve requests (only one approval needed)

### Warden Visibility

All your wardens can see:

- Each other's identities and emails
- All approval/denial decisions from other wardens
- Comments left by other wardens
- Your usage patterns and time remaining

This transparency prevents conflicts and ensures coordination.

### Removing a Warden

To remove a warden:

1. Go to **Settings → Wardens**
2. Click **Remove** next to the warden's name
3. Confirm removal

**Requirements:**

- You must have at least one backup warden to remove your primary
- Removing primary promotes backup to primary automatically
- Both you and the removed warden receive email notifications

!!! warning "Impact of Removing Wardens"
    If you remove all wardens, you return to "no warden" mode where you can change settings freely. This reduces accountability significantly.

## Understanding Warnings and Lockdowns

CellBlock gives you warnings before your time expires, then enforces lockdown mode.

### Time Warnings

You'll receive warnings at:

#### 15-Minute Warning

When 15 minutes remain:

- **Push notification**: "15 minutes remaining"
- **Banner in app**: Yellow banner at top
- **System tray** (Windows): Icon changes to yellow

#### 5-Minute Warning

When 5 minutes remain:

- **Push notification**: "5 minutes remaining - wrap up soon"
- **Banner in app**: Red banner at top
- **System tray** (Windows): Icon changes to red
- **Widget** (iOS): Red background

!!! tip "Warning Sounds"
    Enable notification sounds in Settings → Notifications to ensure you hear warnings even when device is locked.

### Lockdown Mode

When your time expires (0 minutes remaining):

#### What Happens

**iOS:**

1. Non-whitelisted apps show Screen Time shield
2. Shield displays: "Time's up. Ask for more time or try again tomorrow."
3. Whitelisted apps (utility, healthy if enabled) remain accessible
4. Phone, Messages, FaceTime always work

**Windows:**

1. Non-whitelisted domains show blocking page
2. Page displays: "This site is blocked by CellBlock"
3. Shows time until next reset ("Available again in X hours")
4. Whitelisted domains remain accessible
5. Button to open dashboard and request more time

#### How to Regain Access

You have several options:

1. **Wait until midnight** - Your budget automatically resets at midnight in your timezone
2. **Request parole from warden** - Ask for emergency time
3. **Use whitelisted apps only** - Continue using utility and healthy apps
4. **Break glass** - Emergency unlock that ends warden relationship

### Warden-Triggered Lockdown

Your warden can trigger an immediate lockdown:

**Immediate Lockdown:**

- All time instantly set to 0
- Lockdown engages immediately
- No grace period

**Lockdown with Grace Period:**

- Warden sets grace period (e.g., "Lockdown in 30 minutes")
- You receive notification with countdown
- Timer displays in app
- Lockdown executes after grace period expires

**Why would a warden do this?**

- You violated an agreement
- Emergency situation requiring focus
- Observed concerning usage patterns
- Temporary restriction for specific event

## Requesting Parole (Emergency Time)

If you need extra time urgently, request parole from your warden.

### How to Request

1. Go to dashboard
2. Click **Request Parole** button
3. Explain why you need extra time:

    Example:
    > "Urgent work deadline tonight - need 2 hours extra to finish project presentation for 9 AM meeting tomorrow."

4. Suggest amount: "X minutes" or "Until [time]"
5. Click **Send Request**

### What Your Warden Sees

Your warden receives:

- Push notification and email
- Your comment/explanation
- Your current usage today
- Your usage patterns this week
- Option to grant or deny

### Types of Parole

Your warden can grant:

#### Time-Based Parole

Add X minutes to your current budget:

- "Grant 60 minutes"
- Added immediately to your remaining time
- Counts toward your weekly limit

#### Deadline-Based Parole

Unlock until specific date/time:

- "Unlock until 11:59 PM tonight"
- "Unlock until 6:00 PM Friday"
- No blocking during parole period
- Time used still counts toward weekly limit

!!! info "Parole Replacement"
    If your warden grants new parole while previous parole is active, the new one replaces the old one (not cumulative).

### After Parole Expires

When parole time runs out:

- Standard lockdown rules resume
- Any remaining daily budget is still available
- Weekly limit still enforced

## Break Glass Emergency

Break Glass is the nuclear option - it immediately unlocks all devices but permanently ends your warden relationships.

### When to Use Break Glass

**Appropriate situations:**

- True emergency requiring unrestricted internet access
- Warden is abusing their authority
- You're in a dangerous situation
- You need to end the CellBlock program entirely

**Inappropriate situations:**

- Temporary frustration with limits
- Warden denied a request you wanted
- Running out of time before a deadline (request parole instead)
- Want to binge content "just this once"

!!! danger "Consequences"
    Break Glass is permanent and irreversible:

    - All warden relationships immediately ended
    - All pending requests cancelled
    - All wardens notified via email and push notification
    - No time limits enforced until you re-invite wardens
    - Cannot be undone

### How to Break Glass

1. Go to **Settings → Emergency**
2. Click **Break Glass**
3. Read the consequences carefully
4. Optionally add a comment for wardens:

    Example:
    > "Family emergency - need unrestricted access. Will reach out later to explain. Thanks for your help so far."

5. Type "BREAK GLASS" to confirm
6. Click **Confirm Break Glass**

### What Happens Next

**Immediately:**

- All blocking disabled across all devices
- Full internet access restored
- All pending requests cancelled

**Within 1 minute:**

- All wardens receive notification: "[Your Name] has broken glass and is no longer under your supervision"
- Your comment (if any) is included
- Warden dashboard no longer shows you

**Moving forward:**

- You can continue using CellBlock without wardens (honor system)
- You can invite new wardens anytime
- Daily reminders sent to invite wardens

## Device Management

CellBlock tracks all devices connected to your account and synchronizes time usage across them.

### Viewing Connected Devices

1. Go to **Settings → Devices**
2. See all registered devices:
    - Device name (e.g., "John's iPhone")
    - Platform (iOS/Windows/Android)
    - Last active timestamp
    - Currently active indicator

### Adding a New Device

CellBlock automatically registers new devices:

1. Install CellBlock on new device
2. Log in with your account credentials
3. Device registers automatically on first heartbeat
4. Appears in device list within 30 seconds

!!! info "Device Limit"
    You can have up to 12 devices connected. This covers multiple phones, computers, tablets, etc.

### Removing Old Devices

To remove a device you no longer use:

1. Go to **Settings → Devices**
2. Click **Remove** next to the device
3. Confirm removal

**What happens:**

- Device removed from device list
- If that device tries to connect again, it re-registers automatically
- Useful for cleaning up old/sold devices

### Simultaneous Device Usage

CellBlock handles multiple devices intelligently:

**Example: Using iPhone and Laptop simultaneously**

- 12:00 PM - Start using iPhone
- 12:15 PM - Start using laptop (iPhone still active)
- 12:30 PM - Stop using iPhone
- 12:45 PM - Stop using laptop

**Time deducted: 45 minutes**

CellBlock deducts wall-clock time, not device time. From 12:00-12:45 PM is 45 minutes, even though you used two devices.

**Detection window: 45 seconds**

Devices sending heartbeats within 45 seconds of each other are considered simultaneous. Only one minute of wall-clock time is deducted per minute.

### Offline Devices

If a device loses internet connection:

**While offline:**

- Time is NOT deducted (can't send heartbeats)
- Blocking rules remain enforced (cached locally)
- Time remaining shows last known value

**When reconnected:**

- Syncs with server immediately
- Updates time remaining
- Resumes normal operation

**Extended offline (30+ minutes):**

- Warden receives notification: "Device may be offline or app uninstalled"
- After 7 days: Warden relationship automatically cancelled

## Usage History and Analytics

Track your screen time patterns over time to identify trends and improve habits.

### Daily Usage View

1. Go to **Dashboard → Usage**
2. View today's usage:
    - Total time used
    - Time remaining
    - Usage by time of day (graph)
    - Active devices

### Weekly Overview

See usage patterns for the current week:

- Bar chart showing daily usage
- Total weekly usage vs limit
- Average daily usage
- Days where you went over limit (if any)

### Monthly Trends

Long-term patterns:

- Usage trend line
- Compliance rate (% of days under limit)
- Most active devices
- Comparison to previous months

### Data Export

Download your usage data:

1. Go to **Settings → Privacy**
2. Click **Download My Data**
3. Receive ZIP file containing:
    - `usage_logs.csv` - Time usage by day and device
    - `whitelist.csv` - Your whitelisted apps/domains
    - `wardens.csv` - Warden relationships
    - `parole_grants.csv` - Emergency time granted
    - `requests.csv` - All your requests and their status

### Data Retention

- Usage logs retained for **12 months**
- After 12 months, data automatically purged
- Export before purge if you want to keep historical data

## Account Settings

### Profile Settings

Update your account information:

1. Go to **Settings → Profile**
2. Update:
    - Display name
    - Email address (requires verification)
    - Profile picture (optional)
    - Timezone

### Password and Security

Change your password or enable two-factor authentication:

1. Go to **Settings → Security**
2. **Change Password**:
    - Enter current password
    - Enter new password (min 8 characters)
    - Confirm new password
    - Click **Update Password**

### Notification Preferences

Control which notifications you receive:

1. Go to **Settings → Notifications**
2. Toggle individual notification types:
    - Time warnings (15 min, 5 min)
    - Warden responses to requests
    - Parole grants
    - Lockdown notifications
    - Weekly usage summaries
    - Warden invitation reminders

### Account Deletion

To permanently delete your account:

1. Go to **Settings → Account → Delete Account**
2. Read the consequences:
    - All wardens notified
    - All warden relationships ended
    - Data retained for 30 days (soft delete)
    - After 30 days, permanently purged
3. Enter your password to confirm
4. Click **Delete Account**

!!! warning "Irreversible After 30 Days"
    You have 30 days to contact support to recover your account. After 30 days, deletion is permanent and irreversible.

## Tips for Success

### Start Gradually

Don't go from unlimited screen time to 60 minutes immediately:

1. Week 1: Track current usage without limits (use honor system)
2. Week 2: Set limits 20% below your average
3. Week 3: Reduce by another 20%
4. Week 4: Reach your target sustainable limit

### Use Whitelist Wisely

Only whitelist truly essential items:

- **DO whitelist**: Banking apps, work tools, navigation, emergency contacts
- **DON'T whitelist**: Social media, streaming services, news sites

### Communicate with Your Warden

Good warden relationships require communication:

- Explain your goals clearly when inviting them
- Provide context in request comments
- Update them on progress and challenges
- Thank them for their help
- Respect their decisions even when denied

### Plan Around Your Schedule

Adjust time budgets for your life patterns:

- More time on days with less structure (weekends)
- Less time on busy workdays
- Account for regular video calls or online courses
- Align resets with your sleep schedule (timezone)

### Track Your Triggers

Use analytics to identify patterns:

- What time of day do you use most time?
- Which device do you default to?
- Do weekends differ from weekdays?
- How does stress affect your usage?

### Create Friction

Make bypassing harder:

- Keep only one backup warden (harder to remove primary)
- Choose a warden who will enforce strictly
- Don't whitelist "gateway" apps that lead to distractions
- Place devices in inconvenient locations when not needed

### Celebrate Progress

Acknowledge improvements:

- Review weekly compliance rates
- Compare monthly trends
- Share successes with your warden
- Reward yourself for consistent compliance (non-screen rewards)

## Troubleshooting

### Time Not Syncing

**Problem:** Time remaining different on different devices.

**Solutions:**

1. Ensure all devices have internet connection
2. Force refresh by opening CellBlock app
3. Check that CellBlock service is running (Windows)
4. Verify all devices logged into same account
5. Restart devices if issue persists

### Whitelist Not Working

**Problem:** Whitelisted app still being blocked.

**Solutions:**

1. Verify app is actually in your whitelist (check settings)
2. Confirm bundle ID/domain is correct
3. Restart device to apply changes
4. Wait 1-2 minutes for changes to sync
5. Check that app isn't time-restricted by separate Screen Time rules (iOS)

### Warden Not Receiving Notifications

**Problem:** Warden says they didn't get notification.

**Solutions:**

1. Verify warden's email address is correct
2. Ask warden to check spam folder
3. Ensure warden enabled push notifications in CellBlock
4. Check that warden's account is active
5. Resend request from your pending requests page

### Can't Remove Warden

**Problem:** "Remove Warden" button is grayed out.

**Solutions:**

1. You must have at least one backup warden first
2. Add a backup warden before removing primary
3. Or use Break Glass to end all relationships

### App Won't Open After Lockdown

**Problem:** CellBlock app itself won't open.

**Solutions:**

- CellBlock app itself is always accessible
- If iOS shows Screen Time shield on CellBlock:
    1. Go to iOS Settings → Screen Time
    2. Tap App Limits
    3. Remove any limit on CellBlock
    4. Restart iPhone

---

## Next Steps

- **[Warden Guide](warden-guide.md)** - Share this with your wardens
- **[FAQ](faq.md)** - Common questions and answers
- **[GitHub Discussions](https://github.com/dirkpetersen/cellblock/discussions)** - Community support

---

!!! success "You're All Set!"
    You now know everything you need to use CellBlock effectively. Remember: the goal is sustainable digital wellbeing, not perfection. Be patient with yourself as you adjust to new limits.
