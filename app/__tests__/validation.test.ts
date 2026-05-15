import {
  validateKiyafet,
  validateProfil,
  validateKombin,
  validateKiyafetArray,
  KiyafetSchema,
  ProfilSchema,
  KombinSchema,
} from '../../lib/validation';

describe('Zod Validation Schemas', () => {
  describe('Kiyafet Validation', () => {
    it('should validate correct Kiyafet data', () => {
      const validKiyafet = {
        id: 1,
        ad: 'Mavi Tişört',
        tur: 'Üst',
        sezon: 'Yaz',
        foto: null,
        renk: 'Mavi',
        fiyat: 50,
      };

      const result = validateKiyafet(validKiyafet);
      expect(result).not.toBeNull();
      expect(result?.ad).toBe('Mavi Tişört');
    });

    it('should reject invalid tur (category)', () => {
      const invalidKiyafet = {
        id: 1,
        ad: 'Test',
        tur: 'InvalidType',
        sezon: 'Yaz',
        foto: null,
      };

      const result = validateKiyafet(invalidKiyafet);
      expect(result).toBeNull();
    });

    it('should validate array of Kiyafet', () => {
      const kiyafetArray = [
        { id: 1, ad: 'Tişört', tur: 'Üst', sezon: 'Yaz', foto: null },
        { id: 2, ad: 'Pantolon', tur: 'Alt', sezon: 'Tüm Sezon', foto: null },
      ];

      const result = validateKiyafetArray(kiyafetArray);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should return empty array for invalid data', () => {
      const result = validateKiyafetArray('not an array');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Profil Validation', () => {
    it('should validate correct Profil data', () => {
      const validProfil = {
        tenRengi: '#FDDBB4',
        sacRengi: '#3D2314',
        gozRengi: '#5C3D2E',
        boy: '180',
        kilo: '75',
        cinsiyet: 'Erkek',
        profilFoto: null,
      };

      const result = validateProfil(validProfil);
      expect(result).not.toBeNull();
    });

    it('should reject invalid hex color', () => {
      const invalidProfil = {
        tenRengi: 'not-a-hex',
        sacRengi: '#3D2314',
        gozRengi: '#5C3D2E',
        boy: '180',
        kilo: '75',
        cinsiyet: 'Erkek',
        profilFoto: null,
      };

      const result = validateProfil(invalidProfil);
      expect(result).toBeNull();
    });

    it('should reject invalid cinsiyet', () => {
      const invalidProfil = {
        tenRengi: '#FDDBB4',
        sacRengi: '#3D2314',
        gozRengi: '#5C3D2E',
        boy: '180',
        kilo: '75',
        cinsiyet: 'InvalidGender',
        profilFoto: null,
      };

      const result = validateProfil(invalidProfil);
      expect(result).toBeNull();
    });
  });

  describe('Kombin Validation', () => {
    it('should validate correct Kombin data', () => {
      const validKombin = {
        baslik: 'Günlük Kombin',
        tur: 'Üst',
        parcalar: ['Mavi Tişört', 'Siyah Pantolon', 'Beyaz Spor Ayakkabı'],
        neden: 'Rahat ve şık bir günlük kombin',
        favori: false,
      };

      const result = validateKombin(validKombin);
      expect(result).not.toBeNull();
      expect(result?.parcalar.length).toBe(3);
    });

    it('should reject Kombin with empty parcalar', () => {
      const invalidKombin = {
        baslik: 'Invalid Kombin',
        tur: 'Üst',
        parcalar: [],
        neden: 'This has no clothes',
        favori: false,
      };

      const result = validateKombin(invalidKombin);
      expect(result).toBeNull();
    });

    it('should reject Kombin with too many parcalar', () => {
      const invalidKombin = {
        baslik: 'Too Many Items',
        tur: 'Üst',
        parcalar: Array(15).fill('Item'),
        neden: 'Too many items',
        favori: false,
      };

      const result = validateKombin(invalidKombin);
      expect(result).toBeNull();
    });
  });

  describe('Schema Parsing', () => {
    it('should parse valid data with Zod schema', () => {
      const data = {
        ad: 'Test Kiyafet',
        tur: 'Üst',
        sezon: 'Yaz',
        foto: null,
        id: 1,
      };

      expect(() => KiyafetSchema.parse(data)).not.toThrow();
    });

    it('should throw error for invalid schema data', () => {
      const data = {
        ad: 'Test',
        tur: 'InvalidType',
        sezon: 'Yaz',
        foto: null,
        id: 1,
      };

      expect(() => KiyafetSchema.parse(data)).toThrow();
    });
  });
});
