# Release Checklist - Step by Step

Complete checklist for releasing xmobile to production app stores.

## 1. Pre-Release Testing (1 week before)

### Functional Testing
- [ ] Launch app on real Android device
- [ ] Launch app on real iOS device
- [ ] Complete legal screen flow
- [ ] Add multiple wardrobe items
- [ ] Test outfit suggestion flow
- [ ] Test all navigation tabs
- [ ] Test dark mode toggle
- [ ] Change language (English ↔ Turkish)
- [ ] Test search functionality
- [ ] Edit and delete items
- [ ] Test history screen
- [ ] Test offline functionality

### Performance Testing
- [ ] Measure app launch time (< 3 seconds)
- [ ] Monitor memory usage (< 300MB)
- [ ] Test with 100+ wardrobe items
- [ ] Test with slow network (3G)
- [ ] Test with no network
- [ ] Monitor battery usage (30 mins of use)

### Device Testing
- [ ] Small phone (5.0")
- [ ] Large phone (6.5"+)
- [ ] Tablet (if supported)
- [ ] Android 10 minimum
- [ ] iOS 14 minimum
- [ ] Various screen densities

### Accessibility Testing
- [ ] Enable TalkBack/VoiceOver
- [ ] Navigate entire app with screen reader
- [ ] Test all buttons and inputs
- [ ] Verify contrast ratios
- [ ] Test focus order
- [ ] Verify all images have descriptions

### Security Testing
- [ ] Verify no hardcoded API keys
- [ ] Check for exposed secrets in logs
- [ ] Verify HTTPS for all API calls
- [ ] Test logout functionality
- [ ] Verify token expiration handling
- [ ] Check for SQL injection vulnerabilities
- [ ] Test with invalid/malicious input

### Automated Testing
- [ ] Run: `npm test`
- [ ] All tests pass ✅
- [ ] Coverage > 80%
- [ ] Run: `npm test -- accessibility.test.ts`
- [ ] All a11y tests pass ✅
- [ ] Run: `tsc --noEmit`
- [ ] Type checking passes ✅
- [ ] Run E2E tests
- [ ] All 69+ E2E tests pass ✅

### Content Review
- [ ] Proofread all UI text
- [ ] Verify Turkish translations
- [ ] Verify English translations
- [ ] Check for typos/grammar
- [ ] Verify no placeholder text
- [ ] Check all links work
- [ ] Verify images display correctly
- [ ] Check color contrast meets WCAG AA

## 2. Version Update (Release day)

### Update Version Numbers

**Android:**
```bash
# Edit android/app/build.gradle
# Change:
versionCode = 1       # Increment for every build
versionName = "1.0.0" # Format: MAJOR.MINOR.PATCH
```

**iOS:**
```bash
# Edit ios/xmobile/Info.plist
# Change:
<key>CFBundleVersion</key>
<string>1</string>

<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
```

**Web Package:**
```bash
# Edit package.json
# Change:
"version": "1.0.0"
```

**Commit version changes:**
```bash
git add .
git commit -m "chore: bump version to 1.0.0"
git push origin main
```

## 3. Build Preparation

### Prepare Android

```bash
# Clean previous builds
cd android
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Or build bundle for Play Store
./gradlew bundleRelease

# Verify build
ls -la app/build/outputs/apk/release/
# Output: app-release.apk (signed)
```

**Verify APK:**
```bash
# Check signing certificate
jarsigner -verify -verbose app-release.apk

# Check contents
unzip -l app-release.apk | grep -i classes

# Install on device
adb install -r app-release.apk

# Test on device
adb shell am start -n com.emekcan.xmobile/.MainActivity
```

### Prepare iOS

```bash
# Update build number
vi ios/xmobile/Info.plist

# Create archive
xcodebuild -workspace ios/xmobile.xcworkspace \
  -scheme xmobile \
  -configuration Release \
  -archivePath build/xmobile-1.0.0.xcarchive \
  archive

# Verify archive created
ls -la build/xmobile-1.0.0.xcarchive

# Export for app store
xcodebuild -exportArchive \
  -archivePath build/xmobile-1.0.0.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath build/xmobile.ipa
```

## 4. App Store Submission

### Google Play Store

1. **Go to Play Console**
   - [ ] Navigate to console.cloud.google.com
   - [ ] Select xmobile project
   - [ ] Go to Release > Production

2. **Create Release**
   - [ ] Click "Create new release"
   - [ ] Upload Bundle (AAB file)
   - [ ] Wait for validation (usually instant)

3. **Store Listing Review**
   - [ ] Verify app title
   - [ ] Verify description
   - [ ] Verify screenshots
   - [ ] Verify feature graphic
   - [ ] Verify icon
   - [ ] Verify category
   - [ ] Verify rating

4. **Content Rating Form**
   - [ ] Complete questionnaire
   - [ ] Verify rating (should be 4+)
   - [ ] Submit form

5. **Privacy & Safety**
   - [ ] Update privacy policy
   - [ ] Verify data types collected
   - [ ] Verify data deletion info
   - [ ] No ads or analytics selected

6. **Release Notes**
   - [ ] Add release notes
   - [ ] Format as markdown
   - [ ] Keep under 500 characters

7. **Submit for Review**
   - [ ] Review all information
   - [ ] Click "Submit to review"
   - [ ] Estimated review time: 1-3 hours

8. **Monitor Review**
   - [ ] Check email for review status
   - [ ] Check console for updates
   - [ ] Expected: Approved status

### Apple App Store

1. **In Xcode**
   - [ ] Select correct team
   - [ ] Verify app capabilities
   - [ ] Verify signing certificate valid

2. **Upload to App Store Connect**
   - [ ] Open Xcode → Product → Archive
   - [ ] Select build
   - [ ] Click "Distribute App"
   - [ ] Select "App Store Connect"
   - [ ] Proceed through wizard
   - [ ] Wait for upload completion

3. **App Store Connect Website**
   - [ ] Go to appstoreconnect.apple.com
   - [ ] Select xmobile app
   - [ ] Go to TestFlight to verify build

4. **Build Processing**
   - [ ] Wait for processing (5-10 minutes)
   - [ ] Check for missing metadata
   - [ ] Monitor build status

5. **Store Information**
   - [ ] Update description
   - [ ] Update keywords
   - [ ] Update URL schemes
   - [ ] Update privacy policy URL

6. **App Preview & Screenshots**
   - [ ] Add 2-5 screenshots
   - [ ] Add preview video (optional)
   - [ ] Verify aspect ratio

7. **Version Information**
   - [ ] Add release notes
   - [ ] Update copyright/version
   - [ ] Add rating info

8. **App Privacy**
   - [ ] Complete privacy questionnaire
   - [ ] Add data types
   - [ ] Verify data deletion
   - [ ] Specify age rating

9. **Submit for Review**
   - [ ] Review all information
   - [ ] Click "Submit for Review"
   - [ ] Estimated review: 24-48 hours

## 5. Monitor Submissions

### During Review
- [ ] Check for rejection emails
- [ ] Monitor console for status
- [ ] Have version 1.0.1 planned (for quick fix if needed)

### After Approval

**Google Play:**
- [ ] Status changes to "Approved"
- [ ] Schedule release: Immediate or scheduled
- [ ] Monitor for crashes in Play Console

**Apple App Store:**
- [ ] Status changes to "Ready for Sale"
- [ ] Build appears in App Store in 1-2 hours
- [ ] Monitor for crashes in TestFlight/Xcode

## 6. Post-Launch (First Week)

### Day 1
- [ ] App appears on App Store
- [ ] App appears on Google Play
- [ ] Test installation from store
- [ ] Monitor crash reports
- [ ] Monitor user reviews
- [ ] Answer first questions/issues

### Days 2-3
- [ ] Check download numbers
- [ ] Monitor ratings (target: 4.5+)
- [ ] Monitor crash rate (target: < 1%)
- [ ] Respond to all reviews
- [ ] Fix any critical bugs found

### Days 4-7
- [ ] Assess performance metrics
- [ ] Plan first update (v1.0.1)
- [ ] Consider v1.1.0 features
- [ ] Begin marketing push
- [ ] Monitor feedback trends

## 7. Version 1.0.1 (Emergency Patch)

If critical bugs found:

```bash
# Create hotfix branch
git checkout -b hotfix/1.0.1 main

# Fix the issue
# ... code changes ...

# Update version
vi android/app/build.gradle  # versionCode = 2, versionName = "1.0.1"
vi ios/xmobile/Info.plist     # CFBundleVersion = 2, version = "1.0.1"

# Commit
git commit -m "fix: critical issue in wardrobe screen"

# Create tag
git tag v1.0.1

# Push
git push origin hotfix/1.0.1
git push origin --tags

# Merge back to main
git checkout main
git merge hotfix/1.0.1
git push origin main

# Clean up
git branch -d hotfix/1.0.1
git push origin --delete hotfix/1.0.1
```

Then repeat steps 3-6 for 1.0.1 release.

## 8. Documentation Updates

After launch:
- [ ] Update README.md with store links
- [ ] Update docs/APP_STORE.md with launch notes
- [ ] Document any issues encountered
- [ ] Create postmortem if any problems
- [ ] Plan next version improvements

## Troubleshooting

### Android Build Fails
```bash
# Clear gradle cache
./gradlew clean
./gradlew cleanBuildCache

# Rebuild
./gradlew assembleRelease
```

### iOS Build Fails
```bash
# Remove derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clean and rebuild
xcodebuild clean -workspace ios/xmobile.xcworkspace -scheme xmobile
xcodebuild archive -workspace ios/xmobile.xcworkspace -scheme xmobile
```

### Google Play Rejects Build
Common issues:
- [ ] Missing INTERNET permission
- [ ] App crashes on startup
- [ ] Manifest file invalid
- [ ] Build not properly signed

Solution: Fix issue, increment versionCode, rebuild, resubmit

### Apple Rejects Build
Common issues:
- [ ] Crashes on launch
- [ ] Broken functionality
- [ ] Misleading description
- [ ] Privacy violations
- [ ] Using private APIs

Solution: Fix issue, increment CFBundleVersion, rebuild, resubmit

## Success Criteria

✅ Release is successful when:
1. App approved on both stores
2. App visible in store search
3. Install and launch without crashes
4. First user gives 4+ star rating
5. < 2% crash rate within first week
6. No critical bug reports

🎉 Celebrate! You've launched xmobile!

---

**Release Version:** 1.0.0  
**Expected Timeline:** 2 weeks from start of checklist  
**Estimated Duration:** 1 hour automated, 2-4 hours waiting for reviews  
**Owner:** Emekcan Doğru  

For issues: github.com/dogrucanemek-alt/xmobile/issues
