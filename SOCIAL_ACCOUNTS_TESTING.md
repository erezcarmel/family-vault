# Social Accounts Testing Guide

## Prerequisites
- Running instance of Family Vault with Supabase credentials configured
- At least one email asset created in Digital Assets → Email Accounts
- Browser with developer tools for debugging

## Test Scenarios

### Test 1: Add Social Account with Facebook URL

**Steps:**
1. Navigate to Dashboard → Digital Assets
2. Click on "Social Accounts" filter button
3. Click "Add Digital Asset" button
4. Select "Social Accounts" from the Sub-Category dropdown
5. In the Profile Link field, enter: `https://facebook.com/myprofile`
6. Click the "Apply" button
7. Verify that a green box appears showing the Facebook logo (blue) with checkmark and text "Facebook detected"
8. In the Email field, enter an email that you have as an email asset
9. Verify that no warning appears (or appropriate warning if recovery email not set)
10. Click "Add Asset"

**Expected Result:**
- Asset is created successfully
- Card displays with Facebook logo in blue
- Email is shown
- "View Profile" link opens Facebook profile

### Test 2: URL Normalization

**Steps:**
1. Start adding a new Social Account
2. In Profile Link field, enter: `twitter.com/myhandle` (without https://)
3. Click "Apply"

**Expected Result:**
- URL is automatically normalized to `https://twitter.com/myhandle`
- Twitter/X logo appears (black X icon)
- Network is detected as "Twitter / X"

### Test 3: Recovery Email Validation - No Email Asset

**Steps:**
1. Start adding a new Social Account
2. Enter profile link and click Apply
3. In Email field, enter an email that does NOT exist as an email asset
4. Tab out of the email field or click elsewhere

**Expected Result:**
- Red warning box appears below email field
- Warning text: "⚠️ No email asset found for this email address. Consider creating one for better account recovery."

### Test 4: Recovery Email Validation - No Recovery Email Set

**Steps:**
1. Create an email asset WITHOUT setting a recovery email
2. Start adding a new Social Account
3. Enter profile link and click Apply
4. In Email field, enter the email from step 1
5. Tab out of the email field

**Expected Result:**
- Red warning box appears
- Warning text: "⚠️ The email asset for this address does not have a recovery email defined. Consider adding one for better security."

### Test 5: Password Field with Show/Hide

**Steps:**
1. Start adding a new Social Account
2. Fill in Profile Link and Email
3. Check the "Include password field" checkbox
4. Verify yellow warning box appears
5. Enter password: `TestPass123!`
6. Verify password is obfuscated (shows dots)
7. Click the eye icon
8. Verify password becomes visible
9. Click the eye icon again
10. Verify password is hidden again
11. Save the asset
12. In the card view, verify password is obfuscated
13. Click "Show" button
14. Verify password is revealed

**Expected Result:**
- Password toggle works correctly in form
- Warning about password storage is displayed
- Password is obfuscated by default in card view
- Show/Hide button works in card view

### Test 6: Multiple Social Networks

**Test URLs:**
- Instagram: `https://instagram.com/myaccount`
- LinkedIn: `https://linkedin.com/in/myprofile`
- YouTube: `https://youtube.com/@mychannel`
- TikTok: `https://tiktok.com/@myaccount`
- GitHub: `https://github.com/myusername`

**Steps:**
For each URL:
1. Add new Social Account
2. Enter the URL
3. Click Apply
4. Verify correct network is detected
5. Verify correct logo and color appear
6. Complete and save the asset
7. Verify card displays correct information

**Expected Results:**
- Instagram: Pink/red gradient icon
- LinkedIn: Blue icon
- YouTube: Red icon
- TikTok: Black icon
- GitHub: Black icon

### Test 7: Invalid URL Handling

**Steps:**
1. Start adding Social Account
2. Enter invalid URL: `not-a-valid-url`
3. Click Apply

**Expected Result:**
- Alert message: "Please enter a valid URL"
- No network detected
- Cannot save form until valid URL entered

### Test 8: Unrecognized Social Network

**Steps:**
1. Add Social Account
2. Enter: `https://some-unknown-social-network.com/profile`
3. Click Apply

**Expected Result:**
- Alert message: "Could not detect social network from this URL. The link will still be saved."
- No logo displayed
- Asset can still be saved
- Card shows "Social Account" as title without logo

### Test 9: Edit Existing Social Account

**Steps:**
1. Create a social account (any network)
2. Save it
3. Click the edit icon on the card
4. Verify all fields are populated correctly
5. Change the profile link to a different network
6. Click Apply
7. Verify new network is detected
8. Change email address
9. Verify recovery email validation runs
10. Update and save

**Expected Result:**
- Form loads with existing data
- Network detection updates when URL changes
- Recovery email validation re-runs
- Changes are saved correctly

### Test 10: Filter by Social Accounts

**Steps:**
1. Create multiple assets across different subcategories:
   - 2 Email Accounts
   - 1 Computer Access
   - 3 Social Accounts
2. Go to Digital Assets page
3. Click "Social Accounts" filter button

**Expected Result:**
- Only the 3 social accounts are displayed
- Count shows (3)
- Other assets are hidden

### Test 11: Delete Social Account

**Steps:**
1. Create a social account
2. Click the delete icon
3. Verify confirmation dialog appears
4. Confirm deletion

**Expected Result:**
- Confirmation dialog: "Are you sure you want to delete this asset?"
- Asset is removed from list
- Count updates

### Test 12: View Profile Link

**Steps:**
1. Create a social account with valid profile URL
2. In the card view, click "View Profile" link

**Expected Result:**
- New tab/window opens
- Social media profile page loads

### Test 13: Empty Form Validation

**Steps:**
1. Click "Add Digital Asset"
2. Select "Social Accounts"
3. Leave all fields empty
4. Try to submit

**Expected Result:**
- Form validation prevents submission
- Required field indicators are shown
- Appropriate error messages display

### Test 14: Long URL Handling

**Steps:**
1. Add Social Account
2. Enter very long URL: `https://facebook.com/profile?with=lots&of=query&parameters=here&and=more&stuff=appended`
3. Click Apply

**Expected Result:**
- URL is validated and normalized
- Network is detected correctly
- Full URL is saved
- Card displays "View Profile" link (truncated display)

### Test 15: Mobile URL Formats

**Test URLs:**
- `https://m.facebook.com/profile`
- `https://mobile.twitter.com/handle`

**Steps:**
1. Try each mobile URL
2. Click Apply

**Expected Result:**
- Mobile URLs are recognized
- Network detection works
- URLs are saved as-is

## Visual Verification Checklist

- [ ] Facebook logo appears in blue (#1877F2)
- [ ] Twitter/X logo appears in black
- [ ] Instagram logo appears in pink (#E4405F)
- [ ] LinkedIn logo appears in blue (#0A66C2)
- [ ] GitHub logo appears in black (#181717)
- [ ] Logos are appropriately sized (text-2xl)
- [ ] Warning messages have red background (bg-red-50)
- [ ] Success detection has green background (bg-green-50)
- [ ] Password warning has yellow background (bg-yellow-50)
- [ ] Cards have hover effect (hover:shadow-lg)
- [ ] Form is responsive on mobile devices
- [ ] All buttons are properly styled (btn-primary, btn-secondary)

## Browser Testing

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Performance Testing

- [ ] Form loads quickly
- [ ] Network detection is instant
- [ ] Recovery email check completes within 2 seconds
- [ ] No console errors
- [ ] No memory leaks

## Accessibility Testing

- [ ] All form fields have labels
- [ ] Keyboard navigation works
- [ ] Screen reader announces field requirements
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible

## Edge Cases to Verify

- [ ] Very long email addresses
- [ ] Special characters in URLs
- [ ] Emoji in profile URLs
- [ ] International domain names
- [ ] Multiple consecutive clicks on Apply button
- [ ] Network connection loss during recovery email check
- [ ] Rapid form submission attempts

## Regression Testing

Verify existing functionality still works:
- [ ] Email Accounts still work
- [ ] Computer Access still works
- [ ] Phone Access still works
- [ ] Other asset categories unaffected
- [ ] Document scanner not shown for social accounts
- [ ] Custom fields not shown for social accounts

## Screenshots to Capture

1. Social Accounts filter button active with count
2. Add Social Account form with empty fields
3. Profile Link field with Apply button
4. Facebook detected with logo and green box
5. Email field with red warning (no email asset)
6. Email field with red warning (no recovery email)
7. Password field checkbox enabled with yellow warning
8. Password field with eye icon
9. Social account card with Facebook logo
10. Social account card with password hidden
11. Social account card with password shown
12. Grid view with multiple social accounts
13. Edit modal with existing social account
14. Mobile view of social account card
15. Mobile view of add form

## Acceptance Criteria

All tests pass and:
- ✅ Social accounts can be created with profile link
- ✅ Logo detection works for 15+ social networks
- ✅ Email field is mandatory with validation
- ✅ Recovery email validation shows appropriate warnings
- ✅ Password is optional and can be toggled visibility
- ✅ Cards display social accounts with logos and colors
- ✅ All existing functionality remains intact
- ✅ No console errors or warnings
- ✅ TypeScript compilation succeeds
- ✅ ESLint passes without new errors
- ✅ Responsive design works on all screen sizes

## Troubleshooting Guide

### Issue: Logo not appearing
**Solutions:**
- Clear browser cache
- Check network tab for icon loading errors
- Verify FontAwesome brand icons package is installed
- Check brand icon name matches FontAwesome naming

### Issue: Recovery email check not working
**Solutions:**
- Verify Supabase connection
- Check browser console for errors
- Ensure email asset exists in database
- Verify family_id matches

### Issue: Form validation not working
**Solutions:**
- Check browser console for JavaScript errors
- Verify required attributes on form fields
- Test with different browsers

### Issue: URL not normalizing
**Solutions:**
- Check URL contains valid domain
- Test with https:// prefix manually
- Verify normalizeUrl function logic

## Success Metrics

- All 15 test scenarios pass
- No breaking changes to existing features
- Code review comments addressed
- Documentation is complete
- Screenshots captured for all key features
