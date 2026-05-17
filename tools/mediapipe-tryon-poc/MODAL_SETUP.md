# Modal.com Deploy Talimatı

POC'u kullanıcı tarafına götürmek için son adım. ~10 dakika.

## 1. Modal hesabı

- https://modal.com → "Sign up" → GitHub veya Google ile giriş
- Free tier $30 kredi (yaklaşık 5000 try-on'a yeter)
- Workspace adı oluştur (örn. `xmobile`)

## 2. CLI

```powershell
# venv'i aktif et ya da direkt python kullan
C:\Users\emek.dogru\Desktop\mediapipe-tryon-poc\.venv\Scripts\python.exe -m pip install modal

# Token oluştur — tarayıcı açar, authorize et
C:\Users\emek.dogru\Desktop\mediapipe-tryon-poc\.venv\Scripts\python.exe -m modal token new
```

Token `~/.modal.toml` dosyasına yazılır, paylaşma.

## 3. Deploy

```powershell
Set-Location "C:\Users\emek.dogru\Desktop\mediapipe-tryon-poc"
.\.venv\Scripts\python.exe -m modal deploy modal_deploy.py
```

İlk deploy 2-3 dk (image build + push). Çıktıda HTTPS URL göreceksin:

```
✓ Created web function fastapi_app =>
  https://<workspace>--xmobile-tryon-fastapi-app.modal.run
```

## 4. xmobile-proxy entegrasyonu

`xmobile-proxy/.env` (Vercel dashboard'tan da eklenebilir):

```
COMPOSITE_TRYON_URL=https://<workspace>--xmobile-tryon-fastapi-app.modal.run
```

Proxy `/api/composite` endpoint'i bu URL'e proxy yapar (commit `composite-entegrasyon` ile gelir).

## 5. Test

```powershell
# Health
Invoke-RestMethod -Method Get -Uri "https://<workspace>--xmobile-tryon-fastapi-app.modal.run/health"

# Shoe try-on URL
$body = @{
  model_url = "https://example.com/model.jpg"
  shoe_url  = "https://example.com/shoe.png"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "https://<workspace>--xmobile-tryon-fastapi-app.modal.run/tryon/shoe/url" `
  -ContentType "application/json" -Body $body
```

## Maliyet

Modal serverless pricing (Mayıs 2026):
- CPU 2 vCPU + 2GB RAM ≈ $0.000020/sn
- Cold start 5-15 sn (image cached sonra)
- Hot inference 3-5 sn

**~$0.00010/try-on** = 100K try-on için $10. Bucket'tan da düşük.

## Üretim için TODO (POC ötesi)

- Modal **secrets** ile xmobile-proxy auth token (URL public, brute force koruması)
- Modal **volume** ile MediaPipe model cache (cold start hızlandır)
- A100/T4 GPU upgrade (3-5 sn → 1-2 sn) — trafik artarsa
- Sentry / Modal logs ile telemetry
