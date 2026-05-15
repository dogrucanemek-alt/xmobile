# xmobile E2E Testing Suite

Detox gray-box end-to-end tests for xmobile app covering critical user flows and journeys.

## Overview

This directory contains comprehensive E2E tests using Detox framework. Tests cover:

- **Legal Screen Flow** (`01-legal-screen.e2e.js`) - First launch, legal agreement acceptance, app entry
- **Wardrobe CRUD** (`02-wardrobe-crud.e2e.js`) - Clothing item management, empty state, navigation
- **Outfit Suggestions** (`03-outfits-suggestion.e2e.js`) - Kombin önerisi flow, weather integration
- **Profile Management** (`04-profile-management.e2e.js`) - User settings, theme, language preferences
- **App Navigation** (`05-navigation.e2e.js`) - Tab navigation, state preservation, screen transitions

## Test Files

| File | Purpose | Tests | Status |
|------|---------|-------|--------|
| `01-legal-screen.e2e.js` | Legal agreement + app entry | 8 tests | ✅ Complete |
| `02-wardrobe-crud.e2e.js` | Wardrobe screen interaction | 12 tests | ✅ Complete |
| `03-outfits-suggestion.e2e.js` | Outfit suggestion flow | 14 tests | ✅ Complete |
| `04-profile-management.e2e.js` | Profile and settings | 20 tests | ✅ Complete |
| `05-navigation.e2e.js` | Tab and screen navigation | 15 tests | ✅ Complete |
| `config.json` | Device configuration | - | ✅ Complete |
| `config.e2e.js` | Jest configuration | - | ✅ Complete |

## Total E2E Test Coverage

**69 tests** covering major user journeys:
- First-launch legal flow
- Wardrobe empty state → item management
- Outfit suggestion requests
- Profile navigation and settings
- Cross-tab navigation and state management

## Running Tests

### Setup

```bash
# Install dependencies
npm install detox-cli
npm install

# Build app for testing
detox build-framework-cache
detox build-app --configuration ios.sim.release
# or for Android
detox build-app --configuration android.emu.release
```

### Run All Tests

```bash
# Run all E2E tests
detox test --configuration ios.sim.release

# With specific reporter
detox test --configuration ios.sim.release --record-logs all

# Android emulator
detox test --configuration android.emu.release
```

### Run Specific Test Suite

```bash
# Legal screen tests only
detox test e2e/01-legal-screen.e2e.js --configuration ios.sim.release

# Wardrobe tests only
detox test e2e/02-wardrobe-crud.e2e.js --configuration ios.sim.release

# Navigation tests only
detox test e2e/05-navigation.e2e.js --configuration ios.sim.release
```

### Run with Debugging

```bash
# Run with verbose output
detox test --configuration ios.sim.release --verbose

# Run with cleanup cleanup between tests
detox test --configuration ios.sim.release --cleanup

# Interactive mode
detox test --configuration ios.sim.release --inspectBrokenApp
```

## Test Architecture

### Test Structure

Each test suite follows this pattern:

```javascript
describe('Feature - Description', () => {
  beforeAll(async () => {
    // Launch app with permissions
    await device.launchApp({
      permissions: { notifications: 'YES', photos: 'YES' },
      newInstance: true,
    });
  });

  beforeEach(async () => {
    // Reload React Native between tests
    await device.reloadReactNative();
  });

  it('should perform specific action', async () => {
    // Test implementation
  });
});
```

### Matchers

Tests use Detox matchers:
- `by.text(string)` - Match element by visible text
- `by.id(string)` - Match element by testID prop
- `by.type(string)` - Match element by React component type

### Actions

Common actions:
- `element(...).multiTap(1)` - Tap element
- `element(...).scroll(500, 'down')` - Scroll
- `expect(element(...)).toBeVisible()` - Assert visibility
- `waitFor(element(...)).toBeVisible().withTimeout(5000)` - Wait for element

## Device Configuration

Configured devices in `config.json`:

**iOS:**
- Device: iPhone 15 simulator
- Type: ios.simulator

**Android:**
- Device: Pixel 4 (API 30) emulator
- Type: android.emu

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```bash
# GitHub Actions example
- name: Run E2E Tests
  run: |
    detox build-app --configuration ios.sim.release
    detox test --configuration ios.sim.release --cleanup
```

## Known Limitations

1. **Image Picker** - Cannot test actual photo selection from device gallery
   - Workaround: Mock photo URLs in tests if needed
   
2. **Push Notifications** - Limited testing for notification flows
   - Permissions set but actual notification delivery not testable
   
3. **Network Requests** - Tests don't mock API responses
   - Tests validate UI state, not actual API calls
   - Use unit/integration tests for API mocking

4. **Location Services** - Location requests work but actual location not provided
   - Tests check for permission prompts, not GPS functionality

## Adding New Tests

To add new E2E tests:

1. Create new file: `0X-feature-name.e2e.js`
2. Follow existing test patterns
3. Use descriptive test names starting with "should"
4. Add helpers for common flows (legal acceptance, navigation)
5. Keep test isolation - each test should be independent
6. Use `beforeEach` to reset app state

### Example New Test

```javascript
describe('New Feature - Description', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should verify feature behavior', async () => {
    await expect(element(by.text('Expected Text'))).toBeVisible();
  });
});
```

## Debugging Tests

### Common Issues

**Test timeout:**
```javascript
// Increase timeout for slow operations
await waitFor(element(by.text('Text')))
  .toBeVisible()
  .withTimeout(10000); // 10 seconds
```

**Element not found:**
```javascript
// Use device inspection
await device.nativeDebug();

// Check element ID in code
element(by.id('unique-test-id')).multiTap(1);
```

**App state issues:**
```javascript
// Clear app state between tests
beforeEach(async () => {
  await device.reloadReactNative();
});
```

## Performance Considerations

- Each test launches fresh app instance
- `reloadReactNative()` preserves app state but resets React tree
- Tests run sequentially by default
- Full test suite (69 tests) takes ~10-15 minutes

## Continuous Improvement

Test coverage targets:
- ✅ Legal/onboarding flow
- ✅ Core CRUD operations  
- ✅ User navigation paths
- 🔄 Pro features (upcoming)
- 🔄 Error states and edge cases
- 🔄 Offline functionality

## Related Documentation

- [Detox Docs](https://wix.github.io/Detox/) - Full Detox framework documentation
- [React Native Testing](../../docs/testing.md) - Unit/integration testing guide
- [Jest Configuration](../../jest.config.js) - Jest test setup

## Contributing

When adding new features to xmobile:

1. Add corresponding E2E tests
2. Ensure tests pass locally before pushing
3. Update this README if adding new test suites
4. Keep test descriptions clear and user-focused

## Support

For issues with E2E tests:
- Check Detox documentation
- Review existing test patterns
- Verify device/emulator is running
- Check React Native version compatibility
