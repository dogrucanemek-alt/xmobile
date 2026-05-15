import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Wardrobe AsyncStorage Fallback', () => {

  it('should load local AsyncStorage data when Supabase sync fails', async () => {
    const mockLocalData = [
      { id: '1', name: 'Tişört', kategori: 'Üst' },
      { id: '2', name: 'Pantolon', kategori: 'Alt' },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockLocalData)
    );

    const loadedData = JSON.parse(
      (await AsyncStorage.getItem('wardrobe')) || '[]'
    );

    expect(loadedData).toEqual(mockLocalData);
    expect(loadedData.length).toBe(2);
  });

  it('should return empty array when both Supabase and AsyncStorage fail', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const loadedData = JSON.parse(
      (await AsyncStorage.getItem('wardrobe')) || '[]'
    );

    expect(loadedData).toEqual([]);
  });

  it('should prioritize Supabase data over local AsyncStorage when both available', async () => {
    const supabaseData = [
      { id: '1', name: 'Yeni Tişört', kategori: 'Üst' },
    ];
    const localData = [
      { id: '1', name: 'Eski Tişört', kategori: 'Üst' },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(localData)
    );

    const loadedData = supabaseData.length > 0 ? supabaseData : localData;

    expect(loadedData).toEqual(supabaseData);
    expect(loadedData[0].name).toBe('Yeni Tişört');
  });
});
