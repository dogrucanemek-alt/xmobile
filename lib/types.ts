export interface Kiyafet {
  id: number;
  ad: string;
  tur: string;
  sezon: string;
  foto: string | null;
}

export interface Profil {
  tenRengi: string;
  sacRengi: string;
  gozRengi: string;
  boy: string;
  kilo: string;
  cinsiyet: string;
  profilFoto: string | null;
  sacStili?: string;
  sakal?: string;
  avatarUrl?: string;
}

export interface Kombin {
  baslik: string;
  tur: string;
  parcalar: string[];
  neden: string;
}

export interface HavaDurumu {
  derece: number;
  durum: string;
  nem: number;
  hissedilen: number;
}

export interface KombinKayit {
  id: string;
  tarih: string;
  kombin: Kombin;
  favori: boolean;
  hava?: { derece: number; durum: string };
}
