# App Store Preparation & Release Guide

Complete checklist and documentation for publishing xmobile to Google Play Store and Apple App Store.

## Pre-Release Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Type checking passing (`tsc --noEmit`)
- [ ] E2E tests passing (69+ tests)
- [ ] Accessibility compliance verified
- [ ] No console.log/debug code remaining
- [ ] No hardcoded API keys or secrets
- [ ] ProGuard rules configured for Android

### Functionality Testing
- [ ] Legal screen shows on first launch
- [ ] Wardrobe CRUD fully functional
- [ ] Outfit suggestions working
- [ ] Profile settings accessible
- [ ] Navigation between tabs smooth
- [ ] No crash loops or hangs
- [ ] Offline functionality tested
- [ ] Permissions requested properly

### Performance
- [ ] App launch time < 3 seconds
- [ ] No memory leaks on extended use
- [ ] Battery usage reasonable
- [ ] Network requests efficient
- [ ] Storage usage within limits

### Security
- [ ] No hardcoded credentials
- [ ] API endpoints using HTTPS
- [ ] Data encrypted in transit
- [ ] No sensitive logs
- [ ] Dependencies up to date

### Visual & Content
- [ ] App icon finalized
- [ ] Screenshots match current UI
- [ ] All text proofread
- [ ] No broken images/links
- [ ] Proper localization (Turkish + English)
- [ ] Dark mode verified
- [ ] Landscape orientation tested

## Version Management

### Current Version
- **Version:** 1.0.0
- **Build:** 1
- **Release Date:** TBD

### Version Files

**Update version in:**
```
android/app/build.gradle
  - versionCode = 1
  - versionName = "1.0.0"

ios/xmobile/Info.plist
  - CFBundleShortVersionString = 1.0.0
  - CFBundleVersion = 1

package.json
  - "version": "1.0.0"
```

### Versioning Scheme (Semantic)
- **MAJOR.MINOR.PATCH**
- 1.0.0 = Initial release
- 1.1.0 = New features
- 1.0.1 = Bug fixes
- 2.0.0 = Breaking changes

## App Store Metadata

### Google Play Store (Android)

#### Listing Information

**App Title:** xmobile (max 50 chars)
```
xmobile - AI-Powered Wardrobe
```

**Short Description** (max 80 chars):
```
AI wardrobe manager for daily outfit suggestions
```

**Full Description** (max 4000 chars):
```
🧵 xmobile - Your Personal AI Wardrobe Manager

Tired of deciding what to wear? xmobile uses artificial intelligence to:

✨ SMART SUGGESTIONS
- Get personalized outfit recommendations daily
- AI learns your style preferences
- Weather-aware suggestions

👗 WARDROBE MANAGEMENT
- Add clothes via photo or name
- Organize by type, season, color
- Track clothing prices and usage
- Search across entire wardrobe

🎨 STYLE INSIGHTS
- Track your outfit history
- Discover your style signature
- See which pieces you wear most
- Cost per wear calculations

🌐 MULTILINGUAL
- English and Turkish support
- Fully accessible design
- Screen reader compatible

📱 FEATURES
- Offline-first architecture
- Secure cloud sync via Supabase
- Privacy-focused (no ad tracking)
- Dark mode support

🔒 YOUR PRIVACY MATTERS
- Your data stays private
- No ads or tracking
- Open-source committed
- GDPR/KVKK compliant

Start building your perfect wardrobe today!
```

**Promotional Text** (max 80 chars):
```
AI fashion advisor in your pocket. Get outfit ideas in seconds.
```

**Category:** Lifestyle  
**Content Rating:** Everyone (4+)  
**Languages:** English, Turkish

#### Store Listing Assets

**Icon** (512x512 PNG):
- Rounded corners
- No transparent parts
- Vibrant and recognizable

**Feature Graphic** (1024x500 PNG):
- Shows app highlight
- No text overlay
- Clear and engaging

**Screenshots** (1080x1920 PNG, min 2, max 8):
```
1. Wardrobe Screen
   "Organize your entire wardrobe"

2. Outfit Suggestion
   "Get AI-powered suggestions daily"

3. Profile & Settings
   "Customize your preferences"

4. Style Analytics
   "Track your style signature"

5. Outfit History
   "See what you wore"
```

**Video Promo** (optional):
- 30 seconds
- Shows app in action
- Showcase key features

#### Permissions Disclosure

**Photos:** Selecting clothing from gallery/camera  
**Storage:** Saving wardrobe data locally  
**Location:** Weather-based suggestions (optional)  
**Contacts:** None (disclose if used)

#### Privacy & Compliance

**Privacy Policy URL:**
```
https://dogrucanemek-alt.github.io/xmobile/privacy.html
```

**Terms of Service URL:**
```
https://dogrucanemek-alt.github.io/xmobile/terms.html
```

**Data Safety Form:**
- ✅ Data encryption in transit
- ✅ Data deletion available
- ✅ No advertising
- ✅ No analytics sharing

#### Release Notes

```
v1.0.0 - Initial Release

🎉 Welcome to xmobile!

This initial release includes:
- Complete wardrobe management
- AI outfit suggestions
- Style analytics
- Turkish & English support
- Dark mode support

We're excited to bring AI fashion to your pocket!

Questions? Email: dogrucanemek@gmail.com
Privacy: Full KVKK/GDPR compliance
```

### Apple App Store (iOS)

#### App Information

**App Name:** xmobile  
**Subtitle:** AI Wardrobe Manager  
**Bundle ID:** com.emekcan.xmobile  
**App Type:** Utilities / Lifestyle

**Keywords** (up to 100 chars total):
```
wardrobe,fashion,outfit,ai,style,clothing,organizer
```

**Description:**
```
[Same as Google Play, but formatted for iOS]

Your personal AI fashion advisor. Get outfit suggestions, 
organize your wardrobe, and discover your style signature.

✨ Features:
- Smart AI outfit recommendations
- Photo-based wardrobe management
- Style analytics and insights
- Weather-aware suggestions
- Offline functionality
- Dark mode
- Turkish & English support

🔒 Privacy First:
- Your data is yours alone
- No ads or tracking
- KVKK/GDPR compliant
- Secure Supabase backend
```

**Support URL:**
```
https://github.com/dogrucanemek-alt/xmobile/issues
```

**Privacy Policy URL:**
```
https://dogrucanemek-alt.github.io/xmobile/privacy.html
```

**App Preview / Screenshots:**

**Device:** iPhone 12 Pro Max (1242x2688)
- 2-5 screenshots maximum
- Promotional text overlay (optional)
- Focus on key features

**App Preview Video:**
- 15-30 seconds
- Show app in action
- No audio required

**App Clip (if applicable):**
- Quick wardrobe search
- Single outfit suggestion

#### App Privacy

**Data Privacy Declaration:**

| Data Type | Collected | Purpose |
|-----------|-----------|---------|
| User ID | Yes | Account identification |
| Email | Yes | Communication |
| Wardrobe Items | Yes | Core functionality |
| Outfit History | Yes | Analytics |
| Photos | Optional | Clothing identification |
| Location | Optional | Weather data |

**Data Deletion:** Available in Settings > Account > Delete Account

**Age Rating:**
- Alcohol, Tobacco, Drugs: None
- Gambling: None
- Horror: None
- Medical: None
- Profanity: None
- Sexual Content: None
- Violence: None
- Unrestricted Web: No

**Rating:** 4+ (Everyone)

## Build & Release Process

### Android Release Build

```bash
# 1. Update version
vi android/app/build.gradle
# versionCode = X
# versionName = "1.0.X"

# 2. Update package.json
npm version minor

# 3. Create signed APK
cd android
./gradlew clean
./gradlew bundleRelease

# 4. Create keystore (first time only)
keytool -genkey -v -keystore xmobile-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias xmobile-release

# 5. Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore xmobile-release.keystore \
  app/build/outputs/bundle/release/app-release.aab xmobile-release

# 6. Verify signature
jarsigner -verify -verbose app/build/outputs/bundle/release/app-release.aab
```

### iOS Release Build

```bash
# 1. Update version
vi ios/xmobile/Info.plist
# CFBundleVersion = X
# CFBundleShortVersionString = 1.0.X

# 2. Create archive
xcodebuild -workspace ios/xmobile.xcworkspace \
  -scheme xmobile \
  -configuration Release \
  -archivePath build/xmobile.xcarchive \
  archive

# 3. Export signed build
xcodebuild -exportArchive \
  -archivePath build/xmobile.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/ipa
```

### Upload to Stores

**Google Play Console:**
1. Go to Release > Production
2. Create new release
3. Upload AAB file
4. Add release notes
5. Review store listing
6. Submit for review (1-3 hours typically)

**App Store Connect:**
1. Go to TestFlight > iOS Builds
2. Upload build via Xcode or Transporter
3. Wait for processing (~5-10 min)
4. Submit to App Review
5. Review takes 24-48 hours

## Post-Release

### Monitor Performance
- Check crash rates in stores
- Monitor user reviews
- Track ratings trend
- Monitor download numbers

### Respond to Feedback
- Reply to reviews within 24 hours
- Fix reported bugs urgently
- Add requested features to backlog
- Maintain high rating (target > 4.5 ⭐)

### Update Strategy
- Bug fixes: Weekly to bi-weekly
- Features: Monthly releases
- Major updates: Quarterly
- Security patches: ASAP

### Marketing

**Channels:**
- Social media (Instagram, Twitter)
- Tech blogs / coverage
- Reddit communities
- Turkish app directories
- App review sites

**Assets:**
- App store links
- Screenshots / GIFs
- Demo video
- Press release

## Compliance Requirements

### Data Protection (KVKK/GDPR)

**Requirements Met:**
- ✅ Privacy policy available in-app
- ✅ User consent for data collection
- ✅ Data deletion functionality
- ✅ No third-party ad networks
- ✅ Secure data transmission

**User Rights:**
- Right to access data
- Right to correct data
- Right to delete data
- Right to data portability

### Accessibility (WCAG 2.1 AA)

**Compliance:**
- ✅ 33 accessibility tests
- ✅ Screen reader support
- ✅ Color contrast (4.5:1 minimum)
- ✅ Touch targets (48x48dp minimum)
- ✅ Focus indicators

### Code Quality

**Standards:**
- ✅ TypeScript strict mode
- ✅ 80%+ test coverage
- ✅ ESLint configured
- ✅ No security vulnerabilities
- ✅ Semantic versioning

## Files to Generate

### Documentation
- [ ] `docs/APP_STORE.md` (this file)
- [ ] `docs/STORE_LISTING.md` (detailed copy)
- [ ] `docs/RELEASE_CHECKLIST.md` (step-by-step)

### Store Assets
- [ ] `assets/app-icon-512.png` (store icon)
- [ ] `assets/feature-graphic.png` (Play Store)
- [ ] `assets/screenshots-*.png` (5-8 per store)
- [ ] `assets/privacy-policy.html`
- [ ] `assets/terms-of-service.html`

### Configuration
- [ ] `android/app/build.gradle` (version updated)
- [ ] `ios/xmobile/Info.plist` (version updated)
- [ ] `ExportOptions.plist` (iOS signing config)
- [ ] Keystore file (Android signing)

## Timeline

**Week 1:** Final testing & bug fixes  
**Week 2:** Create store assets & listings  
**Week 3:** Submit for review  
**Week 4:** Approval & launch  

## Support Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://help.apple.com/app-store-connect)
- [KVKK Compliance Guide](https://kvkk.gov.tr/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Contacts

**Developer:** Emekcan Doğru  
**Email:** dogrucanemek@gmail.com  
**GitHub:** github.com/dogrucanemek-alt/xmobile

## Launch Success Checklist

When launching v1.0.0:
- [ ] 100+ downloads in first week
- [ ] 4.5+ star rating target
- [ ] < 5% crash rate
- [ ] < 2 second launch time
- [ ] Zero privacy complaints
- [ ] Positive press coverage (goal)
- [ ] 1000+ active users (goal for month 1)

---

**Last Updated:** 2026-05-15  
**Status:** Ready for v1.0.0 submission  
**Next Review:** Before major release
