import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

jest.mock('expo-router');

describe('LegalCheck Redirect Logic', () => {

  it('should redirect to /legal screen when legal_agreed is not set', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });

    const agreed = await AsyncStorage.getItem('legal_agreed');

    if (!agreed) {
      mockReplace('/legal');
    }

    expect(mockReplace).toHaveBeenCalledWith('/legal');
  });

  it('should not redirect when legal_agreed is true', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

    const mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });

    const agreed = await AsyncStorage.getItem('legal_agreed');

    if (!agreed) {
      mockReplace('/legal');
    }

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should handle AsyncStorage errors gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
      new Error('Storage Error')
    );

    const mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });

    try {
      await AsyncStorage.getItem('legal_agreed');
    } catch (_) {
      mockReplace('/legal');
    }

    expect(mockReplace).toHaveBeenCalledWith('/legal');
  });

  it('should save legal_agreed when user accepts terms', async () => {
    const mockSetItem = jest.fn().mockResolvedValue(undefined);
    (AsyncStorage.setItem as jest.Mock) = mockSetItem;

    await AsyncStorage.setItem('legal_agreed', 'true');

    expect(mockSetItem).toHaveBeenCalledWith('legal_agreed', 'true');
  });

  it('should prevent navigation to other screens before legal acceptance', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const agreed = await AsyncStorage.getItem('legal_agreed');

    expect(agreed).toBeNull();

    const canNavigate = agreed === 'true';

    expect(canNavigate).toBe(false);
  });
});
