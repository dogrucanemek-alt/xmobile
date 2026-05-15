import {
  syncYukle,
  syncKaydet,
  syncSil,
  syncTumunuYukle,
} from '../../lib/wardrobeSync';
import { supabase } from '../../lib/supabase';
import * as FileSystem from '../../lib/fileSystem';
import type { Kiyafet } from '../../lib/types';

jest.mock('../../lib/supabase');
jest.mock('../../lib/fileSystem');

describe('Wardrobe CRUD Operations', () => {
  const userId = 'test-user-123';
  const mockKiyafet: Kiyafet = {
    id: 1,
    ad: 'Mavi Tişört',
    tur: 'Üst',
    sezon: 'Yaz',
    foto: null,
    renk: 'Mavi',
    fiyat: 50,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // READ OPERATIONS (syncYukle)
  describe('syncYukle - Load Wardrobe Items', () => {
    it('should load all wardrobe items for a user', async () => {
      const mockData = [
        {
          item_id: 1,
          ad: 'Tişört',
          tur: 'Üst',
          sezon: 'Yaz',
          foto_url: null,
          fiyat: 50,
        },
        {
          item_id: 2,
          ad: 'Pantolon',
          tur: 'Alt',
          sezon: 'Tüm Sezon',
          foto_url: null,
          fiyat: 100,
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      const result = await syncYukle(userId);

      expect(result).toHaveLength(2);
      expect(result[0].ad).toBe('Tişört');
      expect(result[1].ad).toBe('Pantolon');
    });

    it('should return empty array when user has no items', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const result = await syncYukle(userId);

      expect(result).toEqual([]);
    });

    it('should return empty array on Supabase error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      });

      const result = await syncYukle(userId);

      expect(result).toEqual([]);
    });
  });

  // CREATE/UPDATE OPERATIONS (syncKaydet)
  describe('syncKaydet - Save/Update Items', () => {
    it('should save a new clothing item', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      await syncKaydet(userId, mockKiyafet);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          item_id: 1,
          user_id: userId,
          ad: 'Mavi Tişört',
          tur: 'Üst',
          sezon: 'Yaz',
          fiyat: 50,
        }),
        expect.any(Object)
      );
    });

    it('should upload photo if item has local file URI', async () => {
      const kiyafetWithPhoto: Kiyafet = {
        ...mockKiyafet,
        foto: 'file:///local/path/photo.jpg',
      };

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64data');

      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/photo.jpg' },
      });

      const mockUpload = jest.fn().mockResolvedValue({ error: null });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      await syncKaydet(userId, kiyafetWithPhoto);

      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
        'file:///local/path/photo.jpg',
        expect.any(Object)
      );
      expect(mockUpload).toHaveBeenCalled();
    });

    it('should handle photo upload failure gracefully', async () => {
      const kiyafetWithPhoto: Kiyafet = {
        ...mockKiyafet,
        foto: 'https://example.com/photo.jpg', // Use URL that won't trigger upload
      };

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      await syncKaydet(userId, kiyafetWithPhoto);

      // Should save with the provided URL (not try to upload)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          foto_url: 'https://example.com/photo.jpg',
        }),
        expect.any(Object)
      );
    });

    it('should update existing item with same ID', async () => {
      const updatedKiyafet: Kiyafet = {
        ...mockKiyafet,
        ad: 'Mavi Tişört (Updated)',
        fiyat: 75,
      };

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      await syncKaydet(userId, updatedKiyafet);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ad: 'Mavi Tişört (Updated)',
          fiyat: 75,
        }),
        expect.objectContaining({
          onConflict: 'item_id,user_id',
        })
      );
    });
  });

  // DELETE OPERATIONS (syncSil)
  describe('syncSil - Delete Items', () => {
    beforeEach(() => {
      // Setup default mock for delete chain
      const mockEq = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });
      const mockDelete = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });
    });

    it('should delete a clothing item from database', async () => {
      const mockStorageRemove = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.storage.from as jest.Mock).mockReturnValue({
        remove: mockStorageRemove,
      });

      await syncSil(userId, 1);

      expect(mockStorageRemove).toHaveBeenCalledWith([`${userId}/1.jpg`]);
    });

    it('should delete photo file from storage', async () => {
      const mockStorageRemove = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.storage.from as jest.Mock).mockReturnValue({
        remove: mockStorageRemove,
      });

      await syncSil(userId, 42);

      expect(mockStorageRemove).toHaveBeenCalledWith([`${userId}/42.jpg`]);
    });

    it('should continue even if storage deletion fails', async () => {
      const mockStorageRemove = jest.fn().mockResolvedValue({
        error: new Error('Storage error'),
      });
      (supabase.storage.from as jest.Mock).mockReturnValue({
        remove: mockStorageRemove,
      });

      await expect(syncSil(userId, 1)).resolves.not.toThrow();
    });
  });

  // BULK OPERATIONS (syncTumunuYukle)
  describe('syncTumunuYukle - Bulk Upload Items', () => {
    it('should save multiple clothing items', async () => {
      const kiyafetler: Kiyafet[] = [
        mockKiyafet,
        { ...mockKiyafet, id: 2, ad: 'Siyah Pantolon', tur: 'Alt' },
      ];

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      await syncTumunuYukle(userId, kiyafetler);

      expect(mockUpsert).toHaveBeenCalledTimes(2);
    });

    it('should save items in order', async () => {
      const kiyafetler: Kiyafet[] = [
        { ...mockKiyafet, id: 1 },
        { ...mockKiyafet, id: 2 },
        { ...mockKiyafet, id: 3 },
      ];

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      await syncTumunuYukle(userId, kiyafetler);

      const calls = (mockUpsert as jest.Mock).mock.calls;
      expect(calls[0][0].item_id).toBe(1);
      expect(calls[1][0].item_id).toBe(2);
      expect(calls[2][0].item_id).toBe(3);
    });

    it('should handle empty array', async () => {
      const mockUpsert = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      await syncTumunuYukle(userId, []);

      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });

  // EDGE CASES & DATA VALIDATION
  describe('Data Validation & Edge Cases', () => {
    it('should handle missing optional fields', async () => {
      const minimalKiyafet: Kiyafet = {
        id: 1,
        ad: 'Basic Item',
        tur: 'Üst',
        sezon: 'Tüm Sezon',
        foto: null,
      };

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      await syncKaydet(userId, minimalKiyafet);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          fiyat: null,
        }),
        expect.any(Object)
      );
    });

    it('should preserve item properties during round-trip (load and save)', async () => {
      const originalKiyafet: Kiyafet = {
        id: 99,
        ad: 'Test Item',
        tur: 'Alt',
        sezon: 'Kış',
        foto: 'https://example.com/photo.jpg',
        renk: 'Kırmızı',
        fiyat: 150,
      };

      // Simulate load
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            {
              item_id: 99,
              ad: 'Test Item',
              tur: 'Alt',
              sezon: 'Kış',
              foto_url: 'https://example.com/photo.jpg',
              fiyat: 150,
            },
          ],
          error: null,
        }),
      });

      const loaded = await syncYukle(userId);
      expect(loaded[0].id).toBe(99);
      expect(loaded[0].ad).toBe('Test Item');
      expect(loaded[0].fiyat).toBe(150);
    });
  });
});
