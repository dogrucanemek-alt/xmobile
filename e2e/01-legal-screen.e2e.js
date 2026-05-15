describe('Legal Screen - First Launch Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES', photos: 'YES' },
      newInstance: true,
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display legal screen on first launch', async () => {
    await expect(element(by.text('Gizlilik Politikası'))).toBeVisible();
    await expect(element(by.text('Kullanım Şartları'))).toBeVisible();
    await expect(element(by.text('KVKK Onayı'))).toBeVisible();
  });

  it('should show disabled "Devam Et" button when checkbox unchecked', async () => {
    const continueButton = element(by.text('Devam Et'));
    await expect(continueButton).toBeVisible();
    // Button should be disabled (reduced opacity)
    await expect(continueButton).toHaveToggleValue(false);
  });

  it('should enable "Devam Et" button when legal checkbox is checked', async () => {
    const checkbox = element(by.text('Tüm şartları kabul ediyorum').atIndex(0));
    await checkbox.multiTap(1);

    const continueButton = element(by.text('Devam Et'));
    await expect(continueButton).toHaveToggleValue(true);
  });

  it('should navigate to home screen when legal agreement is accepted', async () => {
    const checkbox = element(by.text('Tüm şartları kabul ediyorum').atIndex(0));
    await checkbox.multiTap(1);

    const continueButton = element(by.text('Devam Et'));
    await continueButton.multiTap(1);

    // After accepting, should see the main app tabs or home screen
    await expect(element(by.text('Gardırobum'))).toBeVisible();
  });

  it('should not accept terms when alert dialog is dismissed', async () => {
    const continueButton = element(by.text('Devam Et'));
    // Button should be disabled without checking checkbox
    await continueButton.multiTap(1);

    // Should still see legal screen
    await expect(element(by.text('Gizlilik Politikası'))).toBeVisible();
  });

  it('should scroll through all legal sections', async () => {
    const scrollView = element(by.id('legal-scrollview'));

    // Scroll down to see more content
    await scrollView.scroll(500, 'down');
    await expect(element(by.text('İletişim'))).toBeVisible();

    // Scroll back up
    await scrollView.scroll(500, 'up');
    await expect(element(by.text('Gizlilik Politikası'))).toBeVisible();
  });

  it('should persist legal agreement in AsyncStorage', async () => {
    const checkbox = element(by.text('Tüm şartları kabul ediyorum').atIndex(0));
    await checkbox.multiTap(1);

    const continueButton = element(by.text('Devam Et'));
    await continueButton.multiTap(1);

    // Wait for navigation
    await waitFor(element(by.text('Gardırobum')))
      .toBeVisible()
      .withTimeout(5000);

    // Restart app
    await device.sendToHome();
    await device.launchApp({ newInstance: false });

    // Should go directly to home screen, not legal screen
    await expect(element(by.text('Gardırobum'))).toBeVisible();
  });
});
