jest.mock('@react-native-async-storage/async-storage', () => {
  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  return mockStorage;
});

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('./lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
    auth: {
      setSession: jest.fn(),
      verifyOtp: jest.fn(),
    },
  },
}));

jest.mock('./lib/fileSystem', () => ({
  documentDirectory: '/mock/documents',
  cacheDirectory: '/mock/cache',
  readAsStringAsync: jest.fn(),
  copyAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
    UTF8: 'utf8',
  },
}));
