export interface Kiyafet {
  id: number;
  ad: string;
  tur: string;
  sezon: string;
  foto: string | null;
  renk?: string;
  fiyat?: number;
  satinamlaTarihi?: string;
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
  avatarGlbPath?: string;
}

export interface Kombin {
  baslik: string;
  tur: string;
  parcalar: string[];
  neden: string;
  favori?: boolean;
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

export interface MeshyGorev {
  taskId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  glbUrl?: string;
  progress?: number;
}

export interface MeshyCacheGirdisi {
  glbUrl: string;
  olusturuldu: number;
}
