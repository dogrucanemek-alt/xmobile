# MediaPipe Try-On POC (Shoe + Glasses + Hat)

xmobile için açık kaynak ayakkabı + aksesuar sanal deneme prototipi. Fashn AI bu kategorileri desteklemiyor; MediaPipe Pose / Face Mesh keypoint'leri ile 2D affine warp + alpha composite.

## Lisans (tüm bağımlılıklar ticari serbest)
- MediaPipe — **Apache 2.0** ✅
- OpenCV — Apache 2.0
- Pillow — HPND (BSD benzeri)
- NumPy, FastAPI, Uvicorn — BSD

## Kurulum

```powershell
cd C:\Users\emek.dogru\Desktop\mediapipe-tryon-poc
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## CLI Kullanım

### Ayakkabı try-on
```powershell
.\.venv\Scripts\python.exe shoe_overlay.py inputs\model.jpg inputs\shoe.png outputs\result.png --debug
```

### Aksesuar (gözlük / şapka)
```powershell
.\.venv\Scripts\python.exe accessory_overlay.py inputs\model.jpg inputs\glasses.png glasses outputs\glasses_result.png --debug
.\.venv\Scripts\python.exe accessory_overlay.py inputs\model.jpg inputs\hat.png     hat     outputs\hat_result.png     --debug
```

### Input dosyaları
- `inputs/model.jpg` — Tam boy / yüz fotoğrafı
- `inputs/shoe.png` / `glasses.png` / `hat.png` — Transparent BG, tek nesne

## HTTP API

```powershell
.\.venv\Scripts\python.exe -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### Endpoints
| Method | Path | Body |
|---|---|---|
| GET  | `/health` | — |
| POST | `/tryon/shoe`         | multipart `model_image`, `shoe_image` |
| POST | `/tryon/shoe/url`     | JSON `{ model_url, shoe_url, vis_threshold? }` |
| POST | `/tryon/accessory`    | multipart `model_image`, `accessory_image`, `accessory_type` |
| POST | `/tryon/accessory/url`| JSON `{ model_url, accessory_url, accessory_type }` |

URL endpoint'leri LRU cache (200 entry, 1h TTL).

## Pipeline Bileşenleri

1. **Pose Detection** — MediaPipe Pose Heavy (model_complexity=2). 33-point landmark; ankle/heel/foot_index.
2. **Face Mesh** — 478-point landmark; eye corners, nose bridge, temples, forehead.
3. **Person Segmentation** — `enable_segmentation=True` → uint8 mask, pantolon occlusion için.
4. **Single-shoe extraction** — Çift sneaker PNG için k-means clustering (2 cluster, alt-y foreground).
5. **Affine Warp** — 3-anchor: heel/toe + perpendicular height.
6. **Pose-aware scaling** — Ankle y-pozisyonuna göre `height_ratio` 0.25-0.55 arası.
7. **Drop Shadow** — Alpha-blurred offset shadow (offset 3,5 / blur 11 / opacity 0.35).
8. **Occlusion** — Person mask + ankle_y cutoff ile pantolon paçası shoe üstüne biner.
9. **Input Validation** — Pose confidence + ayak konumu pre-flight check.

## Test

```powershell
.\.venv\Scripts\python.exe -m pytest tests/ -v
```

11 test (10 unit + 1 integration smoke). MediaPipe model dosyası ilk run'da indirilir.

## Deployment

POC altyapısı tamam; production deploy için: [MODAL_SETUP.md](./MODAL_SETUP.md)

xmobile-proxy entegrasyonu: `POST /api/fashn?action=composite`
```json
{ "model_url": "...", "accessory_url": "...", "type": "shoe|glasses|hat", "user_id": "..." }
```

Env var: `COMPOSITE_TRYON_URL=https://<modal-endpoint>`

## Bilinen Sınırlamalar

1. **Yan-profil sneaker PNG'leri model önden duruyorsa** perspektif uyumsuz → katalog standardı şart (3 açı: front / 3-quarter / side).
2. **Tek kişi** — `max_num_faces=1`, çoklu kişi destekli değil POC için.
3. **Drop shadow ayak gölgesi sentetik** — gerçek ışıklandırma matchi yok.
4. **Mobile bridge yok** — server-side önce, react-native-mediapipe ileride.

## Roadmap

- [x] Faz 1: Pose detection + debug
- [x] Faz 2: Shoe warp + composite
- [x] Faz 3: Person mask occlusion + drop shadow + pose-aware scaling
- [x] Faz 4: FastAPI wrapper + URL cache
- [x] Faz 5: Glasses + hat composite (Face Mesh)
- [x] Faz 6: Pytest suite
- [x] Faz 7: Modal deploy config + xmobile-proxy entegrasyon
- [ ] Faz 8: Production Modal deploy (kullanıcı tarafı — `MODAL_SETUP.md`)
- [ ] Faz 9: react-native-mediapipe mobile bridge (uzun vade, 2-3 hafta)
