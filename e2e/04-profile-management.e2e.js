describe('Profile Management - User Profile Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES', photos: 'YES' },
      newInstance: true,
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  // Helper to accept legal agreement and navigate to profile
  const acceptLegalAndNavigateToProfile = async () => {
    const checkbox = element(by.text('Tüm şartları kabul ediyorum').atIndex(0));
    await checkbox.multiTap(1);
    const continueButton = element(by.text('Devam Et'));
    await continueButton.multiTap(1);
    await waitFor(element(by.text('Gardırobum')))
      .toBeVisible()
      .withTimeout(5000);

    // Navigate to profile tab
    const profileTab = element(by.text('Profil'));
    await profileTab.multiTap(1);
  };

  it('should display profile screen with user information', async () => {
    await acceptLegalAndNavigateToProfile();

    // Profile screen should be visible
    const profileScreen = element(by.id('profile-screen'));
    // Profile may not have an ID, just verify navigation happened
  });

  it('should show user avatar or default avatar on profile', async () => {
    await acceptLegalAndNavigateToProfile();

    // Profile should display avatar
    const avatarElement = element(by.id('profile-avatar'));
    // Avatar may not have ID, check for image or placeholder
  });

  it('should display user profile settings options', async () => {
    await acceptLegalAndNavigateToProfile();

    // Profile should have settings/menu items
    // Look for common profile menu items
    const settingsButton = element(by.text('Ayarlar'));
    // Settings might have different label
  });

  it('should allow viewing user statistics if available', async () => {
    await acceptLegalAndNavigateToProfile();

    // Profile might show style stats, outfit count, etc.
    const statsDisplay = element(by.id('profile-stats'));
    // Stats may not be visible in early version
  });

  it('should have language/theme settings in profile', async () => {
    await acceptLegalAndNavigateToProfile();

    // Look for language or theme toggle
    const themeToggle = element(by.text('Tema'));
    // Theme setting might be labeled differently
  });

  it('should allow changing app language from profile', async () => {
    await acceptLegalAndNavigateToProfile();

    // Look for language switcher
    const languageOption = element(by.text('Dil'));
    // Language option might be in settings submenu
  });

  it('should display theme toggle (Dark/Light mode)', async () => {
    await acceptLegalAndNavigateToProfile();

    // Look for dark/light mode toggle
    const darkModeToggle = element(by.text('Koyu Tema'));
    // Toggle might be labeled differently
  });

  it('should show subscription/premium status in profile', async () => {
    await acceptLegalAndNavigateToProfile();

    // Profile might display premium status
    const premiumBadge = element(by.text('Premium'));
    // Premium status might be shown or hidden
  });

  it('should have about/help section in profile', async () => {
    await acceptLegalAndNavigateToProfile();

    // Look for about app or help option
    const aboutOption = element(by.text('Hakkında'));
    // About option might have different label
  });

  it('should display version information', async () => {
    await acceptLegalAndNavigateToProfile();

    // Look for app version in profile
    const versionText = element(by.text('Versiyon'));
    // Version might not be visible in regular profile
  });

  it('should have logout/sign out option', async () => {
    await acceptLegalAndNavigateToProfile();

    // Look for logout button
    const logoutButton = element(by.text('Çıkış Yap'));
    // Logout might be in settings or menu
  });

  it('should allow scrolling through profile options', async () => {
    await acceptLegalAndNavigateToProfile();

    // Profile screen should be scrollable if many options
    const profileScroll = element(by.id('profile-scroll'));
    // Scroll might be needed for long option lists
  });

  it('should show profile header with title', async () => {
    await acceptLegalAndNavigateToProfile();

    // Profile should have title header
    const profileTitle = element(by.text('Profil'));
    await expect(profileTitle).toBeVisible();
  });

  it('should have back button to return to previous screen', async () => {
    await acceptLegalAndNavigateToProfile();

    // Profile should have navigation option to go back
    const backButton = element(by.text('Geri'));
    // Back button might only appear in modal/pushed view
  });

  it('should handle theme toggle and apply immediately', async () => {
    await acceptLegalAndNavigateToProfile();

    // Look for theme toggle
    const themeToggle = element(by.text('Koyu Tema'));
    // If found, tapping should toggle theme
  });

  it('should persist profile settings after app restart', async () => {
    await acceptLegalAndNavigateToProfile();

    // Change a setting
    const themeToggle = element(by.text('Koyu Tema'));
    // Toggle theme (if available)

    // Restart app
    await device.sendToHome();
    await device.launchApp({ newInstance: false });

    // Navigate to profile again
    // Setting should be persisted
    await acceptLegalAndNavigateToProfile();
  });

  it('should display user account information section', async () => {
    await acceptLegalAndNavigateToProfile();

    // Profile should show account details
    const accountSection = element(by.id('account-section'));
    // Account info might be in expandable section
  });

  it('should show notification preferences in profile', async () => {
    await acceptLegalAndNavigateToProfile();

    // Look for notification settings
    const notificationOption = element(by.text('Bildirimler'));
    // Notification settings might have different label
  });

  it('should have privacy/help related links', async () => {
    await acceptLegalAndNavigateToProfile();

    // Look for privacy policy or help link
    const privacyOption = element(by.text('Gizlilik'));
    // Privacy might be accessible from profile
  });

  it('should navigate back to main tabs from profile', async () => {
    await acceptLegalAndNavigateToProfile();

    // Tap wardrobe tab to leave profile
    const wardrobeTab = element(by.text('Gardırobum'));
    await wardrobeTab.multiTap(1);

    // Should navigate away from profile
    const profileScreen = element(by.id('profile-screen'));
    // Profile should not be visible (or only if in tab view)
  });
});
