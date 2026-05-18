/**
 * Accessibility utilities and helpers for inclusive app design
 * WCAG 2.1 compliance for color contrast, labels, and interactions
 */

export const A11Y_COLORS = {
  // WCAG AA compliant color pairs (4.5:1 contrast ratio for text)
  lightText: '#F5F0E8',        // Light text on dark
  darkText: '#060606',         // Dark text on light
  mutedText: '#bbb',           // Secondary text
  accentPrimary: '#00D4FF',    // Cyan accent
  accentSecondary: '#2ED573',  // Green accent
  errorColor: '#FF3B30',       // Red for errors
  warningColor: '#FF9500',     // Orange for warnings
};

export const A11Y_LABELS = {
  // Common accessibility labels (Turkish)
  accept: 'Kabul et',
  decline: 'Reddet',
  close: 'Kapat',
  back: 'Geri',
  next: 'İleri',
  previous: 'Önceki',
  save: 'Kaydet',
  delete: 'Sil',
  edit: 'Düzenle',
  share: 'Paylaş',
  more: 'Daha fazla',
  menu: 'Menü',
  search: 'Ara',
  filter: 'Filtre',
  sort: 'Sırala',
  loading: 'Yükleniyor',
  error: 'Hata',
  success: 'Başarılı',
  warning: 'Uyarı',
};

export const A11Y_HINTS = {
  // Accessibility hints for interactive elements (Turkish)
  doubleTab: 'Etkinleştirmek için çift dokun',
  swipeHint: 'Sağa kaydırarak seçenekleri göster',
  doubleTapToActivate: 'Etkinleştirmek için iki kez dokunun',
  expandableSection: 'Ayrıntıları göstermek için çift dokun',
  scrollable: 'Daha fazla içerik görmek için kaydırın',
  toggleSwitch: 'Durumu değiştirmek için çift dokun',
};

/**
 * Generate testID from screen and component name
 * Pattern: screen-component-element
 * Example: wardrobe-item-card-1, legal-checkbox-agree
 */
export const getTestID = (screen: string, component: string, element?: string | number): string => {
  if (element !== undefined) {
    return `${screen}-${component}-${element}`;
  }
  return `${screen}-${component}`;
};

/**
 * Generate accessible label with context
 * Combines primary label with optional count or status
 */
export const getAccessibleLabel = (
  primary: string,
  secondary?: string,
  status?: string
): string => {
  const parts = [primary];
  if (secondary) parts.push(secondary);
  if (status) parts.push(`(${status})`);
  return parts.join(', ');
};

/**
 * Get hint for interactive element based on type
 */
export const getHintForRole = (role: 'button' | 'checkbox' | 'switch' | 'link'): string => {
  switch (role) {
    case 'checkbox':
      return A11Y_HINTS.doubleTapToActivate;
    case 'switch':
      return A11Y_HINTS.toggleSwitch;
    case 'button':
      return A11Y_HINTS.doubleTab;
    case 'link':
      return 'Bağlantıyı açmak için çift dokun';
    default:
      return '';
  }
};

/**
 * Calculate WCAG contrast ratio between two colors
 * Returns true if ratio >= 4.5:1 (AA level for body text)
 */
export const hasGoodContrast = (foreground: string, background: string): boolean => {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const luminance = [r, g, b].map((x) => {
      x = x / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });

    return luminance[0] * 0.2126 + luminance[1] * 0.7152 + luminance[2] * 0.0722;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return ratio >= 4.5;
};

/**
 * Get semantic role for element
 * Returns appropriate role for accessibility tree
 */
export const getSemanticRole = (
  elementType: 'button' | 'input' | 'text' | 'image' | 'list' | 'listitem' | 'header' | 'link'
): string => {
  const roleMap: Record<string, string> = {
    button: 'button',
    input: 'textbox',
    text: 'text',
    image: 'image',
    list: 'list',
    listitem: 'listitem',
    header: 'header',
    link: 'link',
  };
  return roleMap[elementType] || 'none';
};

/**
 * Format number with accessibility considerations
 * E.g., "1 item" instead of "1" for screen readers
 */
export const formatCountA11y = (count: number, singular: string, plural: string): string => {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
};

/**
 * Format status text for screen readers
 * Converts visual indicators to descriptive text
 */
export const formatStatusA11y = (status: 'loading' | 'error' | 'success' | 'idle'): string => {
  const statusMap: Record<string, string> = {
    loading: 'Yükleniyor',
    error: 'Hata oluştu',
    success: 'Başarılı',
    idle: 'Hazır',
  };
  return statusMap[status] || '';
};

/**
 * Generate description for icon-only button
 * Ensures accessibility for buttons without visible text
 */
export const getIconButtonLabel = (icon: string, action: string): string => {
  const iconNames: Record<string, string> = {
    '🗑': 'Sil',
    '↑': 'Paylaş',
    '👗': 'Dene',
    '📋': 'Geçmiş',
    '⚙️': 'Ayarlar',
    '🔍': 'Ara',
    '❤️': 'Beğen',
    '⭐': 'Favori',
    '🔔': 'Bildirimler',
    '👤': 'Profil',
  };

  const iconName = iconNames[icon] || 'İşlem';
  return `${iconName}: ${action}`;
};

/**
 * Create accessible container for form group
 * Ensures inputs and labels are properly associated
 */
export const createFormGroupA11y = (
  labelText: string,
  inputId: string,
  helperText?: string
) => ({
  testID: `form-group-${inputId}`,
  accessibilityLabel: labelText,
  accessibilityHint: helperText,
  accessible: true,
});

/**
 * Verify accessibility requirements met
 * Returns object with audit results
 */
export const auditComponentA11y = (props: {
  hasLabel?: boolean;
  hasTestID?: boolean;
  hasRole?: boolean;
  hasHint?: boolean;
  colorContrast?: boolean;
}): { passed: number; failed: number; suggestions: string[] } => {
  const checks = [
    { name: 'Label', value: props.hasLabel },
    { name: 'TestID', value: props.hasTestID },
    { name: 'Role', value: props.hasRole },
    { name: 'Hint', value: props.hasHint },
    { name: 'Color Contrast', value: props.colorContrast },
  ];

  const passed = checks.filter((c) => c.value).length;
  const failed = checks.filter((c) => !c.value).length;
  const suggestions = checks.filter((c) => !c.value).map((c) => `Add ${c.name}`);

  return { passed, failed, suggestions };
};

/**
 * Standard button accessibility props
 * Use this for all custom buttons to ensure consistency
 */
export const getButtonA11yProps = (
  label: string,
  hint?: string
) => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint || getHintForRole('button'),
  accessibilityRole: 'button' as const,
});

/**
 * Standard input accessibility props
 * Use this for all form inputs
 */
export const getInputA11yProps = (
  label: string,
  placeholder?: string
) => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: placeholder || `Enter ${label.toLowerCase()}`,
});

/**
 * Standard image accessibility props
 * Ensures images are described for screen readers
 */
export const getImageA11yProps = (
  description: string
) => ({
  accessible: true,
  accessibilityLabel: description,
  accessibilityRole: 'image' as const,
});

export default {
  A11Y_COLORS,
  A11Y_LABELS,
  A11Y_HINTS,
  getTestID,
  getAccessibleLabel,
  getHintForRole,
  hasGoodContrast,
  getSemanticRole,
  formatCountA11y,
  formatStatusA11y,
  getIconButtonLabel,
  createFormGroupA11y,
  auditComponentA11y,
  getButtonA11yProps,
  getInputA11yProps,
  getImageA11yProps,
};
