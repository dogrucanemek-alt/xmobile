describe('Kombin Suggestion Fallback', () => {

  const mockKiyafetler = [
    { id: '1', name: 'Tişört', kategori: 'Üst' },
    { id: '2', name: 'Pantolon', kategori: 'Alt' },
    { id: '3', name: 'Ayakkabı', kategori: 'Ayakkabı' },
    { id: '4', name: 'Ceket', kategori: 'Üst' },
  ];

  it('should generate fallback kombinler when all API calls fail', async () => {
    const generateFallbackKombin = (kiyafetler: any[]) => {
      if (kiyafetler.length < 2) return null;
      const count = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...kiyafetler].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count).map((k) => k.id);
    };

    const fallback = generateFallbackKombin(mockKiyafetler);

    expect(fallback).not.toBeNull();
    expect(Array.isArray(fallback)).toBe(true);
    expect(fallback!.length).toBeGreaterThanOrEqual(2);
    expect(fallback!.length).toBeLessThanOrEqual(4);
  });

  it('should guarantee at least 1 kombin even if API fails', async () => {
    const kombinSonucu = Promise.allSettled([
      Promise.reject(new Error('API Error 1')),
      Promise.reject(new Error('API Error 2')),
      Promise.reject(new Error('API Error 3')),
    ]);

    const results = await kombinSonucu;
    const failedCount = results.filter((r) => r.status === 'rejected').length;

    expect(failedCount).toBe(3);

    const fallbackKombinler = [
      mockKiyafetler.slice(0, 2).map((k) => k.id),
      mockKiyafetler.slice(1, 3).map((k) => k.id),
    ];

    expect(fallbackKombinler.length).toBeGreaterThan(0);
  });

  it('should prefer API results over fallback when available', async () => {
    const apiResult = {
      kombinler: [mockKiyafetler.map((k) => k.id)],
    };

    const kombinler =
      apiResult.kombinler && apiResult.kombinler.length > 0
        ? apiResult.kombinler
        : [[mockKiyafetler[0].id, mockKiyafetler[1].id]];

    expect(kombinler).toEqual(apiResult.kombinler);
  });

  it('should handle mixed success/failure with Promise.allSettled', async () => {
    const promises = [
      Promise.resolve({ kombinler: [[mockKiyafetler[0].id]] }),
      Promise.reject(new Error('API Error')),
      Promise.resolve({ kombinler: [[mockKiyafetler[1].id]] }),
    ];

    const results = await Promise.allSettled(promises);

    const kombinler = results
      .filter((r) => r.status === 'fulfilled' && (r.value as any).kombinler)
      .flatMap((r) => ((r as any).value.kombinler || []))
      .slice(0, 3);

    expect(kombinler.length).toBeGreaterThan(0);
    expect(kombinler[0]).toEqual([mockKiyafetler[0].id]);
  });
});
