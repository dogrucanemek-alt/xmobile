# CI/CD Pipeline Documentation

Complete automated testing, building, and deployment pipeline for xmobile using GitHub Actions.

## Overview

The CI/CD system runs automatically on every push and pull request, ensuring code quality, test coverage, and deployment readiness.

### Pipelines at a Glance

| Workflow | Trigger | Purpose | Status |
|----------|---------|---------|--------|
| **CI** | Push, PR | Tests, linting, type checking | ✅ Enabled |
| **Build** | Push, Manual | Build APK artifacts | ✅ Enabled |
| **E2E Tests** | Push, PR, Schedule | End-to-end testing | ✅ Enabled |
| **Quality** | Push, PR | Coverage, dependency audit | ✅ Enabled |
| **Deploy** | Tag push | Create releases | ✅ Enabled |

## Workflow Details

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to ensure code quality.

**Jobs:**
- **Tests** - Unit and integration tests on Node 18.x and 20.x
  - Runs `npm test` with coverage
  - Uploads coverage to Codecov
  - Runs on both Node versions for compatibility

- **Type Checking** - TypeScript validation
  - Runs `tsc --noEmit`
  - Catches type errors before runtime

- **Accessibility** - a11y compliance tests
  - Runs 33 accessibility tests
  - Validates WCAG AA contrast ratios

- **Security Audit** - Dependency security checks
  - Audits npm packages
  - Checks for vulnerable dependencies

**Duration:** ~5-10 minutes

**Failure Handling:**
- PR will show failing checks
- Required checks must pass before merge
- No deployment on CI failure

### 2. Build Workflow (`.github/workflows/build.yml`)

Creates build artifacts for distribution.

**Triggers:**
- Push to `main` or `develop`
- Tag push (v*)
- Manual workflow dispatch

**Jobs:**
- **Android APK**
  - Builds debug APK on develop
  - Builds release APK on main
  - Uploads to artifacts storage

- **Web Bundle**
  - Builds web version (if configured)
  - Stores for deployment

- **GitHub Release**
  - Creates release on tag push
  - Uploads APK files
  - Generates release notes

**Duration:** ~15-30 minutes

**APK Locations:**
```
artifacts/android-apk/
├── debug/app-debug.apk (from develop)
└── release/app-release.apk (from main/tags)
```

**Download APK:**
1. Go to Actions tab
2. Select latest build
3. Download `android-apk` artifact

### 3. E2E Tests Workflow (`.github/workflows/e2e-tests.yml`)

Automated end-to-end testing with Detox.

**Triggers:**
- Push to main/develop
- Pull requests
- Nightly schedule (2 AM UTC)

**Jobs:**
- **iOS Simulator** - macOS runner
  - Builds Detox test app
  - Launches iPhone 15 simulator
  - Runs 69 E2E tests
  - ~25-40 minutes

- **Android Emulator** - Ubuntu runner
  - Builds Android test APK
  - Launches Pixel 4 emulator
  - Runs same 69 E2E tests
  - ~30-45 minutes
  - Skipped on PRs (to save CI minutes)

**Test Coverage:**
- Legal screen acceptance flow
- Wardrobe CRUD operations
- Outfit suggestion flow
- Profile management
- Tab navigation

**Results:**
- Artifacts with test logs
- PR comment with status
- Failure blocks deployment

### 4. Quality Workflow (`.github/workflows/quality.yml`)

Code quality metrics and analysis.

**Jobs:**
- **Test Coverage**
  - Generates coverage report
  - Uploads to Codecov
  - Comments on PR with percentages
  - Target: >80% coverage

- **Bundle Analysis**
  - Measures node_modules size
  - Tracks dist folder size
  - Reports bundle metrics

- **Dependency Check**
  - Audits packages
  - Reports outdated packages
  - Security vulnerability scan

- **Code Quality**
  - Linting (if configured)
  - Type checking
  - Checks for debug code
  - A11y compliance

- **Performance Baseline**
  - Measures test execution time
  - Tracks build performance
  - Reports improvements/regressions

**Duration:** ~10-15 minutes

### 5. Deploy Workflow (`.github/workflows/deploy.yml`)

Automated release creation and deployment.

**Trigger:** Tag push (v1.0.0, v1.1.0-rc1, etc.)

**Process:**
1. Create GitHub Release
2. Build signed APK
3. Upload APK to release
4. Archive artifacts

**Tagging Convention:**
```
v1.0.0              # Release
v1.0.0-rc1          # Release candidate
v1.0.0-beta1        # Beta
v1.0.0-alpha1       # Alpha
```

**Duration:** ~20-35 minutes

**Release Notes:**
- Automatically generated
- Lists APK download
- Shows commit info

## Setting Up Locally

### Run Tests Locally (Before Push)

```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# Specific test file
npm test -- accessibility.test.ts

# E2E tests (requires simulator/emulator)
detox test --configuration ios.sim.release
```

### Run Quality Checks

```bash
# Type checking
npx tsc --noEmit

# Linting (if configured)
npm run lint

# Full quality check
npm test -- --coverage && npx tsc --noEmit
```

### Build APK Locally

```bash
# Debug APK
cd android && ./gradlew assembleDebug

# Release APK (requires signing)
cd android && ./gradlew assembleRelease

# APK location
# android/app/build/outputs/apk/debug/app-debug.apk
# android/app/build/outputs/apk/release/app-release.apk
```

## GitHub Actions Badges

Add to README.md:

```markdown
[![CI](https://github.com/dogrucanemek-alt/xmobile/actions/workflows/ci.yml/badge.svg)](https://github.com/dogrucanemek-alt/xmobile/actions/workflows/ci.yml)
[![Build](https://github.com/dogrucanemek-alt/xmobile/actions/workflows/build.yml/badge.svg)](https://github.com/dogrucanemek-alt/xmobile/actions/workflows/build.yml)
[![E2E Tests](https://github.com/dogrucanemek-alt/xmobile/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/dogrucanemek-alt/xmobile/actions/workflows/e2e-tests.yml)
[![codecov](https://codecov.io/gh/dogrucanemek-alt/xmobile/branch/main/graph/badge.svg)](https://codecov.io/gh/dogrucanemek-alt/xmobile)
```

## Secrets & Configuration

### Required Secrets

Store in GitHub Settings → Secrets:

```
CODECOV_TOKEN         # For coverage reports (optional)
SIGNING_KEY_ALIAS     # Android APK signing (optional for release)
SIGNING_KEY_STORE     # Android keystore file (optional)
SIGNING_KEY_PASSWORD  # Keystore password (optional)
```

### Environment Variables

Set in workflow or Actions settings:

```yaml
ANDROID_API: 30
NODE_VERSION: 20.x
TEST_TIMEOUT: 120000
```

## Troubleshooting

### Tests Failing Locally but Passing in CI

1. Check Node version: `node --version`
2. Clear cache: `npm cache clean --force && rm -rf node_modules`
3. Reinstall: `npm ci`
4. Run exact CI command: `npm test -- --coverage`

### Build Failures

**Android build fails:**
```bash
cd android
./gradlew clean
./gradlew assembleDebug -x lintDebug
```

**Java version mismatch:**
```bash
java -version  # Should be 17.x
```

### E2E Tests Failing

**On iOS:**
```bash
detox build-framework-cache
xcrun simctl erase all
detox test --configuration ios.sim.release --cleanup
```

**On Android:**
```bash
adb devices  # Verify emulator running
detox test --configuration android.emu.release --cleanup
```

### Coverage Not Uploading

1. Check Codecov token in secrets
2. Verify coverage file exists:
   ```bash
   ls -la coverage/lcov.info
   ```
3. Check for coverage collection:
   ```bash
   npm test -- --coverage --verbose
   ```

## Performance Optimization

### Faster CI Runs

1. **Cache dependencies:**
   - GitHub Actions caches npm automatically
   - Set `cache: 'npm'` in setup-node

2. **Parallel jobs:**
   - CI, Quality, and Build run in parallel
   - E2E tests run on demand (not on every PR)

3. **Skip unnecessary jobs:**
   - Android E2E skipped on PRs
   - Web build skipped if no dist
   - Deploy only on tags

### Current Run Times

| Job | Time | Skip Condition |
|-----|------|---|
| Tests | 5-7 min | - |
| Type check | 1-2 min | - |
| A11y tests | 1-2 min | - |
| Security audit | 1-2 min | - |
| E2E (iOS) | 25-40 min | Manual trigger |
| E2E (Android) | 30-45 min | PRs only |
| Coverage report | 2-3 min | - |
| Code quality | 3-5 min | - |

**Total for PR:** ~15-20 minutes  
**Total for main push:** ~25-30 minutes  
**Total for release tag:** ~35-50 minutes

## Monitoring & Alerts

### View Workflow Runs

1. Go to repository "Actions" tab
2. Select workflow
3. Click run to see details
4. Expand job to see logs

### Failed Workflows

GitHub notifies:
- Email notification to repository admins
- PR status check shows ❌
- Red "Failed" badge in Actions tab

### Coverage Reports

- Codecov dashboard: codecov.io/gh/dogrucanemek-alt/xmobile
- PR comments with coverage percentage
- Coverage history and trends

## Extending the Pipeline

### Add New Workflow

1. Create `.github/workflows/new-workflow.yml`
2. Define triggers, jobs, steps
3. Push and monitor in Actions tab

### Add Security Scanning

```yaml
- name: Snyk Security Scan
  uses: snyk/actions/node@master
```

### Add Performance Testing

```yaml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
```

### Add Code Coverage Gating

```yaml
- name: Comment PR with Coverage
  uses: romeovs/lcov-reporter-action@v0.3.1
```

## Best Practices

✅ **Do:**
- Run tests locally before pushing
- Use meaningful commit messages
- Tag releases with semantic versioning
- Review workflow logs for failures
- Keep workflows DRY with reusable steps

❌ **Don't:**
- Commit without passing tests
- Force push to main
- Ignore failing E2E tests
- Skip accessibility checks
- Leave debug code in commits

## Related Documentation

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Testing Guide](./TESTING.md)
- [Accessibility Guide](./ACCESSIBILITY.md)
- [Build Instructions](./BUILD.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Support

For CI/CD issues:
1. Check workflow logs in Actions tab
2. Review this documentation
3. Check GitHub Actions status: https://www.githubstatus.com
4. Create an issue with workflow logs

## Timeline

- ✅ CI workflow complete
- ✅ Build workflow complete
- ✅ E2E testing integrated
- ✅ Quality gates configured
- ✅ Automated deployment ready

Total: 5 production-ready workflows covering all stages of development to deployment.
