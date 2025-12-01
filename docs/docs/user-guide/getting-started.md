# Getting Started

This guide will walk you through installing CellBlock and completing your initial setup.

## System Requirements

### iOS
- iOS 16.0 or later
- iPhone or iPad
- Active internet connection
- Apple ID for app installation

### Windows
- Windows 10 (version 1809 or later) or Windows 11
- Administrator privileges for installation
- Active internet connection
- 50 MB free disk space

## Installation

=== "iOS"

    ### Install from App Store

    1. Open the App Store on your iPhone or iPad
    2. Search for "CellBlock Digital Wellbeing"
    3. Tap **Get** or the download icon
    4. Authenticate with Face ID, Touch ID, or your Apple ID password
    5. Wait for the app to download and install

    ### Grant Permissions

    When you first open CellBlock, you'll be prompted to grant several permissions:

    1. **Screen Time Access** (Required)
        - Tap **Continue** when prompted
        - Tap **Open Settings** to go to iOS Settings
        - Enable **Screen Time** if not already enabled
        - Return to CellBlock

    2. **Notifications** (Recommended)
        - Tap **Allow** when prompted
        - This enables time warnings and warden notifications

    3. **Background App Refresh** (Required)
        - This allows CellBlock to sync time usage when not active
        - Enable in Settings → General → Background App Refresh

    !!! tip "Screen Time Permission"
        If you accidentally skip the Screen Time permission, go to iOS Settings → Screen Time → [Your Name] → Share Across Devices and enable CellBlock.

=== "Windows"

    ### Download Installer

    1. Visit [cellblock.app/download](https://cellblock.app/download)
    2. Click **Download for Windows**
    3. Save the installer (`CellBlock-Setup.exe`) to your Downloads folder

    ### Run Installer

    1. Locate `CellBlock-Setup.exe` in your Downloads folder
    2. Right-click and select **Run as administrator**
    3. Click **Yes** when prompted by User Account Control
    4. Follow the installation wizard:
        - Accept the license agreement
        - Choose installation location (default recommended)
        - Click **Install**
    5. Wait for installation to complete
    6. Check **Launch CellBlock** and click **Finish**

    ### Grant Permissions

    CellBlock needs several permissions to function:

    1. **Windows Firewall**
        - You'll see a Windows Security Alert
        - Check both **Private networks** and **Public networks**
        - Click **Allow access**

    2. **Administrator Rights**
        - The CellBlock service runs with SYSTEM privileges
        - This prevents tampering with blocking rules

    !!! warning "Antivirus Warning"
        Some antivirus software may flag CellBlock as suspicious because it modifies network settings. This is expected behavior. Add CellBlock to your antivirus exceptions if needed.

## Create Your Account

### Sign Up

1. Open CellBlock and click **Create Account**
2. Choose your signup method:

=== "Email & Password"

    1. Enter your email address
    2. Create a strong password (minimum 8 characters)
    3. Confirm your password
    4. Click **Sign Up**
    5. Check your email for a verification link
    6. Click the link to verify your account
    7. Return to CellBlock and log in

=== "Google OAuth"

    1. Click **Continue with Google**
    2. Select your Google account
    3. Grant CellBlock access to your profile
    4. You'll be automatically logged in

!!! tip "Email Verification"
    You must verify your email before using CellBlock. Check your spam folder if you don't see the verification email within a few minutes.

## Initial Setup Wizard

After creating your account, you'll go through a guided setup process.

### Step 1: Set Your Time Budget

Choose how much recreational screen time you want each day.

1. **Daily Limit**
    - Drag the slider to set your daily limit (0-300 minutes)
    - Default: 120 minutes (2 hours)
    - Color coding:
        - Green: 0-120 minutes (healthy)
        - Yellow: 121-240 minutes (moderate)
        - Red: 241-300 minutes (high)

2. **Weekly Limit**
    - Set your maximum weekly usage
    - Default: 840 minutes (14 hours)
    - Must be greater than or equal to your daily limit

3. **Schedule Options**
    - **Uniform**: Same limit every day
    - **Weekday/Weekend**: Different limits for weekdays vs weekends
    - **Custom**: Set different limits for each day

!!! example "Example Configurations"

    **Strict Schedule**

    - Weekdays: 60 minutes (1 hour)
    - Weekends: 180 minutes (3 hours)
    - Weekly: 780 minutes (13 hours)

    **Moderate Schedule**

    - Daily: 120 minutes (2 hours)
    - Weekly: 840 minutes (14 hours)

    **Flexible Schedule**

    - Mon-Thu: 90 minutes
    - Fri: 150 minutes
    - Sat-Sun: 180 minutes
    - Weekly: 1020 minutes (17 hours)

### Step 2: Configure Your Whitelist

Choose which apps and websites remain accessible even when your time runs out.

#### Utility Apps (Always Allowed)

These essential apps are pre-enabled and cannot be disabled:

**iOS:**

- Phone
- Messages
- FaceTime
- Maps
- Calendar
- Clock
- Calculator
- Weather
- Wallet (for banking)

**Windows:**

- maps.google.com
- weather.com
- Banking domains (add your banks)

#### Healthy Apps (Optional)

Less distracting audio and reading apps. Pre-enabled but can be disabled:

**iOS:**

- Spotify
- Apple Music
- Apple Podcasts
- Audible
- Kindle

**Windows:**

- spotify.com
- audible.com
- kindle.amazon.com

1. Review the list of healthy apps
2. Toggle off any you want to count toward your time budget
3. Click **Continue**

!!! note "Warden Approval"
    After you invite a warden, toggling healthy apps will require their approval. Until then, you can change them freely.

### Step 3: Set Your Timezone

Your daily time budget resets at midnight in your configured timezone.

1. CellBlock detects your current timezone automatically
2. To change it:
    - Click **Change Timezone**
    - Search for your city or select from the list
    - Click **Save**

!!! tip "Timezone Handling"
    If you travel across timezones, your budget resets at midnight in your configured timezone, not your current location. Update your timezone in settings if you move permanently.

### Step 4: Invite Your Warden (Optional)

A warden provides accountability by approving your settings changes.

1. Enter your warden's email address
2. Add a personal message (optional)
3. Click **Send Invitation**

**What happens next:**

- Your warden receives an email invitation
- They can accept or decline
- Until they accept, you can change your settings freely
- After they accept, all changes require their approval

!!! info "Multiple Wardens"
    You can have up to 4 wardens (1 primary + 3 backups). Add backups in Settings → Wardens after completing setup.

**No Warden Yet?**

You can skip this step and add a warden later. CellBlock will send you:

- Daily email reminders for the first 7 days
- Weekly reminders after that

### Step 5: Complete Setup

1. Review your configuration summary
2. Click **Start Using CellBlock**
3. Your time budget begins immediately

## Next Steps

Now that you've completed setup:

- **[Read the Inmate Guide](inmate-guide.md)** - Learn how to use CellBlock effectively
- **[Add Custom Whitelist Items](inmate-guide.md#managing-whitelist)** - Add work tools or essential websites
- **[Install on Other Devices](inmate-guide.md#device-management)** - Install CellBlock on all your devices
- **[Understand Warnings](inmate-guide.md#understanding-warnings)** - Learn what happens when time runs low

## Troubleshooting

### iOS: Screen Time Not Working

**Problem:** Apps aren't being blocked when time expires.

**Solutions:**

1. Open iOS Settings → Screen Time
2. Ensure Screen Time is enabled
3. Check that CellBlock has permission
4. Restart your iPhone
5. Reinstall CellBlock if issues persist

### Windows: Websites Not Blocked

**Problem:** Blocked websites still load.

**Solutions:**

1. Check that CellBlock service is running:
    - Open Task Manager (Ctrl+Shift+Esc)
    - Go to Services tab
    - Find "CellBlockService" and verify it's Running
2. If stopped, restart your computer
3. Check Windows Firewall isn't blocking CellBlock
4. Run CellBlock as administrator

### Email Verification Not Received

**Problem:** Didn't receive verification email.

**Solutions:**

1. Check your spam/junk folder
2. Wait 5-10 minutes (email servers can be slow)
3. Click **Resend Verification Email** in CellBlock
4. Ensure you entered your email correctly
5. Try a different email provider if issues persist

### Can't Log In After Verification

**Problem:** "Invalid credentials" error after verifying email.

**Solutions:**

1. Ensure you verified the correct email address
2. Check Caps Lock isn't enabled
3. Try **Forgot Password** to reset
4. Clear browser cache and cookies
5. Try a different browser

## Getting Help

Need assistance?

- **Documentation**: Search this site using the search bar above
- **FAQ**: Check the [Frequently Asked Questions](faq.md)
- **Community**: Join [GitHub Discussions](https://github.com/dirkpetersen/cellblock/discussions)
- **Bug Reports**: File an issue on [GitHub Issues](https://github.com/dirkpetersen/cellblock/issues)

---

Ready to learn more? Continue to the [Inmate Guide](inmate-guide.md) for detailed feature documentation.
