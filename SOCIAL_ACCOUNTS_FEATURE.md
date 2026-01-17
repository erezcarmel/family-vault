# Social Accounts Feature Documentation

## Overview
The Social Accounts subcategory has been added to Digital Assets management, allowing users to track their social media accounts with automatic network detection and recovery email validation.

## Features Implemented

### 1. Social Accounts Subcategory
- Added new subcategory "Social Accounts" under Digital Assets
- New asset type: `social_accounts`
- Appears alongside Email Accounts, Computer Access, and Phone Access

### 2. Form Fields

#### Profile Link (Required)
- Text input field for entering social media profile URL
- "Apply" button to detect the social network
- Validates URL format
- Auto-normalizes URLs (adds https:// if missing)
- Supports 15+ major social networks:
  - Facebook
  - Twitter/X
  - Instagram
  - LinkedIn
  - YouTube
  - TikTok
  - Snapchat
  - Pinterest
  - Reddit
  - WhatsApp
  - Telegram
  - GitHub
  - Discord
  - Twitch

#### Email (Required)
- Email input field with validation
- Associated with the social account
- Triggers automatic recovery email validation on blur
- Shows warning if:
  - No email asset exists for this email address
  - Email asset exists but lacks a recovery email

#### Password (Optional)
- Checkbox to enable password field
- Obfuscated password input (type="password")
- Eye icon button to toggle password visibility
- Shows security warning about password storage
- Not recommended for security reasons

### 3. Logo Detection

When user enters a profile URL and clicks "Apply":
1. URL is validated and normalized
2. Social network is detected from URL patterns
3. Brand logo icon is displayed with brand color
4. Success message shows detected network name
5. Logo and network info are saved with the asset

Example detection:
```
https://facebook.com/user → Facebook icon (blue)
https://twitter.com/user → Twitter/X icon (black)
https://instagram.com/user → Instagram icon (pink/red)
```

### 4. Recovery Email Validation

After entering an email address and moving to next field (onBlur):
1. System checks for existing email assets
2. Looks for matching email address
3. Verifies if recovery email is defined
4. Displays warning if validation fails

Warning messages:
- "⚠️ No email asset found for this email address. Consider creating one for better account recovery."
- "⚠️ The email asset for this address does not have a recovery email defined. Consider adding one for better security."

### 5. Display in Asset Cards

Social account cards show:
- Social network logo with brand color
- Network name (e.g., "Facebook", "Instagram")
- Associated email address
- "View Profile" link to the social media profile
- Password (obfuscated with show/hide button if saved)

## Technical Implementation

### Files Modified/Created

1. **types/index.ts**
   - Added `social_accounts` to `AssetType`

2. **app/dashboard/digital-assets/page.tsx**
   - Added Social Accounts to subcategories list

3. **lib/social-network-detector.ts** (NEW)
   - `detectSocialNetwork()`: Detects network from URL
   - `validateUrl()`: Validates URL format
   - `normalizeUrl()`: Normalizes URLs with protocol

4. **components/AssetModal.tsx**
   - Added social account state variables
   - Implemented `handleApplyProfileLink()` for network detection
   - Implemented `checkRecoveryEmail()` for validation
   - Added social account form UI section
   - Updated validation and data building logic
   - Excluded social accounts from document scanner

5. **components/AssetCard.tsx**
   - Added display logic for social accounts
   - Shows network logo and brand colors
   - Displays profile link and email
   - Handles password visibility toggle

6. **package.json**
   - Added `@fortawesome/free-brands-svg-icons` for social media icons

### Data Structure

Social account assets are stored with the following data fields:

```typescript
{
  profile_link: string        // Full URL to profile
  social_email: string        // Associated email (required)
  social_password?: string    // Optional password (not recommended)
  network_name?: string       // Detected network name (e.g., "Facebook")
  network_icon?: string       // FontAwesome icon name (e.g., "faFacebook")
  network_color?: string      // Brand color (e.g., "#1877F2")
}
```

### Supported Social Networks

| Network | Icon | Color | URL Patterns |
|---------|------|-------|--------------|
| Facebook | faFacebook | #1877F2 | facebook.com, fb.com, fb.me |
| Twitter/X | faXTwitter | #000000 | twitter.com, x.com |
| Instagram | faInstagram | #E4405F | instagram.com |
| LinkedIn | faLinkedin | #0A66C2 | linkedin.com |
| YouTube | faYoutube | #FF0000 | youtube.com, youtu.be |
| TikTok | faTiktok | #000000 | tiktok.com |
| Snapchat | faSnapchat | #FFFC00 | snapchat.com |
| Pinterest | faPinterest | #E60023 | pinterest.com |
| Reddit | faReddit | #FF4500 | reddit.com |
| WhatsApp | faWhatsapp | #25D366 | whatsapp.com, wa.me |
| Telegram | faTelegram | #0088cc | telegram.org, t.me |
| GitHub | faGithub | #181717 | github.com |
| Discord | faDiscord | #5865F2 | discord.com, discord.gg |
| Twitch | faTwitch | #9146FF | twitch.tv |

## User Workflow

### Adding a Social Account

1. Navigate to Digital Assets → Social Accounts
2. Click "Add Digital Asset"
3. Select "Social Accounts" from subcategory dropdown
4. Enter profile URL (e.g., `https://facebook.com/myprofile`)
5. Click "Apply" to detect network (logo appears on success)
6. Enter associated email address
7. Wait for recovery email validation (warning appears if needed)
8. Optionally enable and enter password (not recommended)
9. Click "Add Asset"

### Viewing Social Accounts

- Cards display with network logo and brand color
- Click "View Profile" to open social media profile
- Click "Show" to reveal saved password (if any)
- Click edit icon to update account details
- Click delete icon to remove account

## Security Considerations

1. **Password Storage Warning**
   - Clear warning displayed when enabling password field
   - Recommends using dedicated password manager instead
   - Passwords stored in plain text in database (encrypted at rest by Supabase)

2. **Recovery Email Validation**
   - Encourages users to create email assets for all accounts
   - Reminds users to set recovery emails for better security
   - Helps maintain account recovery information

3. **URL Validation**
   - All URLs are validated before saving
   - Prevents invalid URLs from being stored
   - Normalizes URLs for consistency

## Testing Recommendations

### Manual Testing Checklist

- [ ] Add social account with Facebook URL
- [ ] Verify logo detection works
- [ ] Add social account with email that has no email asset
- [ ] Verify warning message appears
- [ ] Add social account with email that has email asset without recovery email
- [ ] Verify appropriate warning appears
- [ ] Enable password field and add password
- [ ] Verify password is obfuscated in card view
- [ ] Toggle password visibility
- [ ] Test with various social network URLs
- [ ] Test with invalid URLs
- [ ] Test with URL without protocol (should auto-add https://)
- [ ] Edit existing social account
- [ ] Delete social account
- [ ] Filter by Social Accounts subcategory

### Edge Cases to Test

1. URL without protocol (e.g., `facebook.com/user`)
2. Unrecognized social network
3. Invalid URL format
4. Empty form submission
5. Very long profile URLs
6. URLs with query parameters
7. Mobile URLs (e.g., `m.facebook.com`)

## Future Enhancements

Potential improvements for future versions:

1. **Enhanced Logo Detection**
   - Use Open Graph meta tags for custom icons
   - Support more niche social networks
   - Custom icon upload option

2. **Two-Factor Authentication**
   - Store 2FA backup codes
   - Link to authenticator apps

3. **Account Activity**
   - Last login tracking
   - Account status (active/deactivated)

4. **Bulk Import**
   - Import from password managers
   - CSV import support

5. **Security Audit**
   - Check for weak passwords
   - Remind about 2FA setup
   - Alert on breached accounts

6. **Network Statistics**
   - Count of accounts per network
   - Most used networks

## Migration Notes

No database migration required. The feature uses the existing `assets` table with JSONB data field.

Existing digital assets are not affected by this change.

## Troubleshooting

### Logo Not Appearing
- Check if URL is valid and normalized
- Verify network is in supported list
- Check browser console for errors

### Recovery Email Warning Not Showing
- Ensure email asset exists in Digital Assets → Email Accounts
- Verify email addresses match exactly (case-sensitive)
- Check if recovery email is set in email asset

### Password Not Saving
- Verify checkbox is enabled before entering password
- Check form validation messages
- Ensure password field is not empty when enabled
