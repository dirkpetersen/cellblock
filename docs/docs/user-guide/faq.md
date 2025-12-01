# Frequently Asked Questions

Common questions and answers about CellBlock.

## General Questions

### What is CellBlock?

CellBlock is a cross-platform digital wellbeing app that helps you manage screen time through a "Default Deny" approach - everything is blocked by default, and you explicitly choose what's allowed. It features cross-device time budget synchronization and warden-based accountability.

### How is CellBlock different from other screen time apps?

Key differences:

1. **Default Deny** - Most apps block specific things. CellBlock blocks everything and you choose exceptions.
2. **Shared Budget** - Time syncs across all devices (iPhone, Windows PC, etc.)
3. **Warden Enforcement** - Trusted friend approves changes, preventing impulsive self-sabotage
4. **Privacy-First** - Tracks time usage, not content or browsing history

### Is CellBlock free?

Yes, CellBlock is completely free and open source (MIT License). There are no paid tiers, subscriptions, or premium features.

### What platforms does CellBlock support?

**Currently available:**

- iOS 16.0+ (iPhone and iPad)
- Windows 10 (version 1809+) and Windows 11

**Coming soon:**

- Android
- macOS

### Do I need a warden to use CellBlock?

No, wardens are optional. You can use CellBlock without a warden in "honor system" mode. However:

- Without a warden, you can change your own settings anytime
- The accountability benefit is significantly reduced
- Daily/weekly reminders will encourage you to add a warden

We strongly recommend using a warden for maximum effectiveness.

## Setup and Installation

### Why does CellBlock need so many permissions?

**iOS:**

- **Screen Time** - Required to block apps and websites
- **Notifications** - Sends time warnings and warden updates
- **Background Refresh** - Syncs time usage when app is closed

**Windows:**

- **Administrator** - Required to modify network settings
- **Firewall** - Required to block/allow network traffic
- **SYSTEM privileges** - Prevents tampering with service

All permissions are necessary for CellBlock to function. We don't collect unnecessary data.

### My antivirus flagged CellBlock as suspicious. Is it safe?

Yes, CellBlock is safe. Antivirus software flags it because it:

- Modifies network settings (Windows Filtering Platform or hosts file)
- Runs with elevated privileges
- Monitors active applications

This is expected behavior for parental control and screen time apps. You can:

1. Verify the installer signature (digitally signed)
2. Check the source code (open source on GitHub)
3. Add CellBlock to your antivirus exceptions

### Can I install CellBlock on multiple devices?

Yes! In fact, you should install on all your devices for the best experience. Your time budget is shared across all devices, so using 30 minutes on iPhone deducts 30 minutes from your Windows PC budget.

**Maximum devices: 12 per account**

### How do I uninstall CellBlock?

**iOS:**

1. Hold the CellBlock app icon until it jiggles
2. Tap the X to delete
3. Confirm deletion
4. Go to Settings → Screen Time to remove any remaining restrictions
5. Your warden will be notified after 7 days of inactivity

**Windows:**

1. Open Settings → Apps → Installed Apps
2. Find CellBlock
3. Click three dots → Uninstall
4. Follow the uninstaller wizard
5. Restart your computer
6. Your warden will be notified after 7 days of inactivity

!!! warning "Warden Notification"
Uninstalling CellBlock automatically cancels your warden relationship after 7 days of inactivity. Your warden receives notifications at 30 minutes and 7 days of silence.

## Time Budgets and Usage

### How does the time budget work?

You set daily and weekly time limits. CellBlock tracks your usage across all devices in real-time:

1. When you use non-whitelisted apps/sites, time is deducted
2. Every 30-60 seconds, your device sends a "heartbeat" to the server
3. Server calculates wall-clock time and deducts from your budget
4. When budget reaches 0, lockdown engages
5. Budget resets at midnight in your configured timezone

### What counts toward my time budget?

**Counts toward budget:**

- Any app or website NOT on your whitelist
- Social media, entertainment, gaming
- General web browsing
- Video streaming

**Does NOT count toward budget:**

- Whitelisted utility apps (Phone, Messages, Maps, Banking)
- Whitelisted healthy apps (Spotify, Audible) if enabled
- Custom whitelisted work tools
- Time when device is locked/asleep

### What happens when I use multiple devices at once?

CellBlock deducts wall-clock time, not device time:

**Example:**

- 2:00 PM - Start using iPhone
- 2:15 PM - Start using laptop (iPhone still active)
- 2:30 PM - Stop using iPhone (laptop still active)
- 2:45 PM - Stop using laptop

**Time deducted: 45 minutes** (2:00-2:45 PM)

Even though you used two devices, only 45 minutes of wall-clock time passed.

**Detection window: 45 seconds**

Devices sending heartbeats within 45 seconds of each other are considered "simultaneous."

### Can I have different time limits for different days?

Yes! You have three scheduling options:

1. **Uniform** - Same limit every day (e.g., 120 minutes daily)
2. **Weekday/Weekend** - Different limits for weekdays vs weekends
3. **Custom** - Unique limit for each day of the week

Example custom schedule:

- Mon-Thu: 90 minutes (busy work days)
- Fri: 150 minutes (end of week)
- Sat-Sun: 180 minutes (weekends)

### What timezone does CellBlock use?

CellBlock uses the timezone you configure in settings (defaults to your device timezone). Your daily budget resets at midnight in your configured timezone, regardless of your current location.

**Traveling?**

- Your budget resets at midnight in your configured timezone, not your current location
- If traveling temporarily: Keep your home timezone
- If relocating permanently: Update your timezone in settings

### What happens when my time runs out?

**Lockdown mode engages:**

1. Non-whitelisted apps/websites are blocked
2. iOS: Screen Time shields appear
3. Windows: Blocked page appears for non-whitelisted domains
4. Whitelisted apps (utility, healthy if enabled) remain accessible

**Warnings before lockdown:**

- 15-minute warning (push notification + banner)
- 5-minute warning (push notification + banner)

**How to regain access:**

1. Wait until midnight (budget auto-resets)
2. Request parole from your warden
3. Use whitelisted apps only
4. Break glass (ends warden relationship)

### Can I pause the timer?

No. CellBlock tracks wall-clock time continuously when devices are active and unlocked. There's no pause function because:

- It would defeat the purpose of limits
- Easy to abuse
- Adds complexity

If you need a break from limits, request parole from your warden or adjust your base limits.

### What if I need more time for an emergency?

Request parole from your warden:

1. Click **Request Parole** in dashboard
2. Explain the emergency clearly
3. Your warden can grant additional time immediately
4. Parole can be time-based (e.g., 60 minutes) or deadline-based (e.g., until 11 PM)

Alternatively, use **Break Glass** for true emergencies (ends warden relationship).

## Whitelist Management

### What's the difference between utility, healthy, and custom apps?

**Utility Apps (Always Allowed):**

- Essential apps like Phone, Messages, Maps, Calculator, Banking
- Pre-populated on account creation
- Cannot be disabled
- Never count toward time budget

**Healthy Apps (Optional):**

- Less distracting content like Spotify, Audible, Podcasts, Kindle
- Pre-populated but can be toggled off
- Don't count toward time budget when enabled
- Require warden approval to toggle after warden accepts

**Custom Apps (User-Added):**

- Apps and websites you add yourself
- Work tools, educational resources, specific services
- Require warden approval after warden accepts
- Don't count toward time budget

### How do I add an app to my whitelist?

1. Go to Settings → Whitelist
2. Click **Add Custom Item**
3. Fill in details:
   - Name (e.g., "Work Slack")
   - iOS Bundle ID (e.g., `com.tinyspeck.chatlyio`) if iOS
   - Windows Domain (e.g., `slack.com`) if Windows
4. Add comment explaining why you need it
5. Click **Add to Whitelist**

**If warden has accepted:** Request goes to warden for approval

**If no warden:** Added immediately

### Can I whitelist specific YouTube videos?

No. CellBlock operates at the domain/app level:

- **iOS:** Bundle ID level (e.g., com.google.ios.youtube)
- **Windows:** Domain level (e.g., youtube.com)

You cannot whitelist specific URLs or paths. If you whitelist YouTube, all of YouTube is whitelisted.

### Can I whitelist social media?

Technically yes, but we strongly discourage it. Social media is highly distracting and defeats the purpose of CellBlock.

If you genuinely need social media for work:

1. Use a separate device not running CellBlock
2. Use desktop-only access (whitelist domain on Windows, block iOS app)
3. Set strict time limits with warden oversight
4. Consider alternative tools (Buffer, Hootsuite) that don't include the feed

Your warden may deny social media whitelist requests based on your agreed-upon goals.

### Why can't I disable utility apps?

Utility apps are essential for daily life and emergencies:

- Phone (emergency calls)
- Messages (communication)
- Maps (navigation)
- Banking (accessing money)
- Calendar (appointments)

Disabling these could create dangerous situations or prevent essential activities. They're always accessible regardless of time budget.

## Warden Relationship

### Who should I ask to be my warden?

Good warden candidates:

- Close friends who understand your goals
- Family members (spouse, sibling, parent)
- Roommates or partners
- Accountability partners
- Mentors or coaches

**Characteristics of good wardens:**

- Trustworthy and reliable
- Available to respond within hours (not days)
- Willing to enforce boundaries firmly but compassionately
- Understands your digital wellbeing goals
- Has healthy tech habits themselves

**Avoid:**

- People who will rubber-stamp everything
- People who will deny everything rigidly
- People you don't communicate well with
- People who are too busy to respond

### Can I have multiple wardens?

Yes! You can have up to 4 wardens:

- 1 primary warden
- 3 backup wardens

**Benefits of multiple wardens:**

- Redundancy if primary is unavailable
- Faster response times (any warden can approve)
- Backup if primary resigns
- Shared accountability

**How it works:**

- ANY warden can approve requests (only one approval needed)
- All wardens see each other's decisions
- All wardens see usage reports
- Full transparency between wardens

### What can my warden see?

**Your warden CAN see:**

- Time remaining (real-time)
- Daily and weekly usage totals
- Usage history (graphs and trends)
- Which devices you use
- When devices are active
- Pending requests and your comments
- Parole grants and lockdown history

**Your warden CANNOT see:**

- Specific websites you visit
- Specific apps you use (except whitelist items)
- Content you view
- Messages or communications
- Screenshots or real-time monitoring

!!! success "Privacy-First Design"
CellBlock tracks time usage patterns, not content. Your warden sees how much time you use, not what you do with it.

### What if my warden denies everything?

If your warden is too strict:

1. **Communicate directly**
   - Explain why you need approved items
   - Discuss whether base time limits are too low
   - Clarify your goals and expectations

2. **Request backup warden**
   - Add backup wardens who might be more understanding
   - Any warden can approve (you only need one)

3. **Remove and replace warden**
   - Add a backup warden first
   - Then remove overly strict primary warden
   - Backup becomes new primary

4. **Break glass**
   - Nuclear option: Ends all warden relationships
   - Immediate full access
   - Use only if warden is abusive or unreasonable

### Can my warden abuse their power?

Wardens have significant power, but you always have recourse:

**Warden powers:**

- Approve/deny requests
- Grant parole
- Trigger lockdowns
- View usage reports

**Your safeguards:**

- **Remove warden** - You can remove any warden (need backup first)
- **Break glass** - Immediate unlock, ends all warden relationships
- **Multiple wardens** - Other wardens can override with approvals
- **Communication** - Resolve conflicts directly

If a warden is being abusive, manipulative, or unreasonable:

1. Use break glass immediately
2. Block their communication outside CellBlock if needed
3. Don't re-invite them

### How do I remove a warden?

1. Go to Settings → Wardens
2. Click **Remove** next to warden's name
3. Confirm removal

**Requirements:**

- Must have at least one backup warden to remove primary
- Removing primary promotes backup to primary
- Both you and removed warden receive notifications

**If you want to remove ALL wardens:**

- Use **Break Glass** instead
- Ends all warden relationships immediately

### What if my warden isn't responding?

**If warden hasn't responded within 3 days:**

- Request automatically expires (not approved)
- You can re-submit if needed

**If warden is consistently unresponsive:**

1. Add a backup warden who's more available
2. Contact primary warden directly to discuss availability
3. Remove primary and promote backup
4. Consider inviting a different primary warden

### Can I be a warden for someone and have them be my warden?

Yes! Reciprocal relationships are allowed:

- Person A can be warden for Person B
- Person B can be warden for Person A simultaneously

This works well for:

- Couples managing screen time together
- Friends with mutual accountability goals
- Siblings supporting each other

## Technical Questions

### How does CellBlock track my usage?

CellBlock uses a "heartbeat" system:

1. Your device sends heartbeat to server every 30-60 seconds when active
2. Heartbeat includes: device ID, timestamp, whether current app is whitelisted
3. Server calculates wall-clock time elapsed
4. Server deducts time from your daily/weekly budget
5. Server responds with updated time remaining
6. Client receives update and displays current time

**Privacy:** Heartbeat doesn't include specific URLs or app names (except whitelist items).

### What happens if CellBlock server goes down?

**Fail-safe mode:**

- Clients default to OPEN (no blocking)
- Whitelisted apps remain accessible
- Non-whitelisted apps also accessible
- Warning banner: "Server unreachable - blocking temporarily disabled"

This prevents you from being locked out due to server issues.

### What happens if my internet goes out?

**While offline:**

- Time is NOT deducted (can't send heartbeats)
- Last known blocking rules remain enforced
- Time remaining shows last synced value
- No updates until reconnected

**When reconnected:**

- Syncs immediately with server
- Updates time remaining
- Resumes normal operation

**Extended offline (30+ minutes):**

- Warden receives notification: "Device may be offline"

### Can CellBlock be bypassed?

**Known limitations:**

CellBlock is designed for accountability, not as a highly tamper-resistant parental control. Determined users can bypass:

**iOS:**

- Uninstall app and remove Screen Time settings
- Factory reset device
- Use different Apple ID

**Windows:**

- Boot into Safe Mode
- Create new admin account
- Use Live USB to access internet
- Uninstall service
- Edit hosts file (if using hosts-based blocking)

**Detection:**

- Warden notified after 30 minutes of no heartbeats
- Warden notified after 7 days (relationship cancelled)

**Philosophy:**

CellBlock relies on voluntary participation and external accountability, not perfect tamper-resistance. If someone wants to bypass, they can - but their warden will know.

### Does CellBlock work offline?

No, CellBlock requires internet connection to function:

- Heartbeats require server communication
- Time budget syncs across devices via server
- Warden approvals happen server-side
- Offline usage is NOT tracked

If you're offline for extended periods, CellBlock may not be suitable for your use case.

### Is my data encrypted?

Yes:

- **In transit:** All communications use TLS 1.3 encryption
- **At rest:** Passwords hashed with bcrypt, sensitive tokens encrypted
- **API:** JWT authentication with short-lived access tokens

### What data does CellBlock collect?

**Data collected:**

- Account info (email, name, profile picture)
- Time usage logs (device, timestamp, whitelisted flag)
- Whitelist items (app names, bundle IDs, domains)
- Warden relationships
- Request history and comments
- Parole grants and lockdowns

**Data NOT collected:**

- Specific URLs visited
- Specific apps used (except whitelist)
- Content viewed
- Messages or communications
- Location data
- Contacts or photos

### Can I export my data?

Yes:

1. Go to Settings → Privacy
2. Click **Download My Data**
3. Receive ZIP file with CSVs:
   - usage_logs.csv
   - whitelist.csv
   - wardens.csv
   - parole_grants.csv
   - requests.csv

### How long is data retained?

- **Usage logs:** 12 months, then auto-purged
- **Account data:** Until account deletion
- **Deleted accounts:** 30-day soft delete, then permanent purge

## Troubleshooting

### Time isn't syncing across devices

**Try:**

1. Ensure all devices have internet connection
2. Force refresh by opening CellBlock app
3. Check that all devices logged into same account
4. Restart devices
5. Verify CellBlock service is running (Windows)

### Whitelisted apps are still being blocked

**Try:**

1. Verify app is in your whitelist (Settings → Whitelist)
2. Confirm bundle ID/domain is correct
3. Restart device to apply changes
4. Wait 1-2 minutes for sync
5. Check iOS Screen Time settings for conflicting rules

### I'm not receiving notifications

**iOS:**

1. Settings → Notifications → CellBlock
2. Enable Allow Notifications
3. Enable Sounds and Badges
4. Check Focus mode isn't blocking CellBlock

**Windows:**

1. Settings → System → Notifications
2. Find CellBlock in list
3. Enable notifications
4. Check Focus Assist settings

### Warden says they didn't receive my request

**Try:**

1. Verify warden's email is correct (Settings → Wardens)
2. Ask warden to check spam folder
3. Ensure warden enabled push notifications
4. Resend request from Requests tab
5. Contact warden directly to confirm

### Lockdown isn't working

**iOS:**

1. Open Settings → Screen Time
2. Verify Screen Time is enabled
3. Check that CellBlock has permission
4. Restart iPhone
5. Reinstall CellBlock if needed

**Windows:**

1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to Services tab
3. Find "CellBlockService"
4. Verify it's Running
5. If stopped, restart computer

### Can't log in after email verification

**Try:**

1. Ensure you verified correct email address
2. Check Caps Lock isn't enabled
3. Try "Forgot Password" to reset
4. Clear browser cache and cookies
5. Try different browser
6. Check for typos in email/password

## Best Practices

### What's a good starting time budget?

Depends on your current usage:

1. **Track first:** Use CellBlock in "honor system" mode (no warden) for 1 week to see your baseline
2. **Start 20% below baseline:** If you average 150 min/day, start with 120 min/day
3. **Adjust gradually:** Reduce by 10-20% every 1-2 weeks until you reach target
4. **Account for life changes:** Increase temporarily for busy periods, reduce when you have more free time

**General guidelines:**

- **Strict:** 60-90 minutes/day
- **Moderate:** 90-150 minutes/day
- **Flexible:** 150-240 minutes/day

### Should I whitelist entertainment apps?

Generally no. The purpose of CellBlock is to reduce recreational screen time.

**Don't whitelist:**

- Social media (Instagram, TikTok, Twitter)
- Video streaming (YouTube, Netflix, Hulu)
- Gaming apps
- News aggregators (Reddit, news apps)

**Consider whitelisting:**

- Audio-only entertainment (Spotify, Audible) - less distracting
- Educational platforms (Coursera, Khan Academy) - if used for learning
- Work communication (Slack, Teams) - if essential for job

**When in doubt:** Don't whitelist. If you genuinely need it, request it later with warden approval.

### How many backup wardens should I have?

**Recommended: 1-2 backup wardens**

**Benefits:**

- Faster response times
- Coverage if primary is unavailable
- Backup if primary resigns

**Considerations:**

- More wardens = more people seeing your usage
- Coordination between wardens can be complex
- Only 1 approval needed (any warden can approve)

### How do I build a good relationship with my warden?

1. **Communicate your goals clearly**
   - Explain why you're using CellBlock
   - Share your struggles and motivations
   - Set expectations together

2. **Provide context in requests**
   - Don't just request - explain why
   - Help warden make informed decisions
   - Be honest about wants vs needs

3. **Accept denials gracefully**
   - Remember you asked them to enforce limits
   - Don't pressure or guilt-trip
   - If you disagree, discuss calmly

4. **Show appreciation**
   - Thank them for their time
   - Acknowledge when their enforcement helps
   - Share your progress

5. **Check in regularly**
   - Don't only contact when requesting things
   - Share wins and challenges
   - Update them on goals or life changes

### When should I use Break Glass?

**Appropriate situations:**

- True emergency requiring unrestricted internet
- Warden is abusing their authority
- You're in a dangerous situation
- You've decided to end the CellBlock program entirely
- Multiple wardens are all unavailable for extended period

**Inappropriate situations:**

- Temporary frustration with limits
- Warden denied a request you wanted
- Running out of time before deadline
- Want to binge content "just this once"

!!! danger "Break Glass is Permanent"
Break Glass immediately ends ALL warden relationships. Use only for serious situations. Consider requesting parole first.

---

## Still Have Questions?

- **Search this documentation** using the search bar above
- **Check other guides:**
  - [Getting Started](getting-started.md)
  - [Inmate Guide](inmate-guide.md)
  - [Warden Guide](warden-guide.md)
- **Community Support:** [GitHub Discussions](https://github.com/dirkpetersen/cellblock/discussions)
- **Report Bugs:** [GitHub Issues](https://github.com/dirkpetersen/cellblock/issues)
