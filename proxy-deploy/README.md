# Proxy Deploy — Replicate Switch

xmobile-proxy GitHub repo'sundaki `api/fashn.ts` dosyasını bu klasördekiyle değiştir.

## Adımlar

### 1. Replicate hesabı
- https://replicate.com → Sign up (GitHub ile en hızlı)
- https://replicate.com/account/api-tokens → "Create token" → kopyala
- https://replicate.com/account/billing → kart ekle, $5 başlangıç krediği yükle

### 2. Vercel env güncelle
Vercel → xmobile-proxy → Settings → Environment Variables

İki yeni env ekle:

| Key | Value | Environments |
|---|---|---|
| `REPLICATE_API_TOKEN` | r8_... (Replicate'dan kopyaladığın) | Production + Preview + Development |
| `TRYON_PROVIDER` | `replicate` | Production + Preview + Development |

> `FASHN_KEY` mevcut kalsın — siliyoruz, Fashn'a geri dönmek için lazım.

### 3. Proxy kodunu güncelle
xmobile-proxy GitHub repo'suna git → `api/fashn.ts` dosyasını **bu klasördeki içerikle değiştir** → commit + push.

### 4. Auto-deploy bekle (1-2 dk)

### 5. Test
Uygulamada sanal deneme yap. Replicate idm-vton ~10-30s'de cevap dönecek.

## Fashn'a geri dönmek için

1. Vercel env: `TRYON_PROVIDER=fashn` yap
2. Redeploy
3. Bitti — frontend kodu hiç değişmez

## A/B test için

`TRYON_PROVIDER` env'i yerine `?provider=replicate` veya `?provider=fashn` query param ile de yönlendirme yapılabilir — istersen sonra ekleriz.
