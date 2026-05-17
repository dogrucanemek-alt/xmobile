# MediaPipe Shoe Try-On POC

xmobile için açık kaynak ayakkabı sanal deneme prototipi. Fashn AI ayakkabı desteklemiyor; bunun yerine MediaPipe Pose ile ayak keypoint tespiti + affine warp + alpha composite.

## Lisans
- MediaPipe: Apache 2.0 ✅ ticari serbest
- OpenCV: Apache 2.0
- Pillow: HPND (BSD benzeri)

## Kurulum

```powershell
cd C:\Users\emek.dogru\Desktop\mediapipe-tryon-poc
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Demo

```powershell
.venv\Scripts\python.exe shoe_overlay.py inputs/model.jpg inputs/shoe.png outputs/result.png
```

### Demo dosyaları
- `inputs/model.jpg` — Tam boy, ayakta, baştan ayağa fotoğraf
- `inputs/shoe.png` — Transparent BG'li ayakkabı PNG (rembg sonrası)

## Pipeline

1. **Pose Detection** (MediaPipe Pose Heavy)
   - Ayak landmarks: ankle (27/28), heel (29/30), foot_index (31/32) — sol+sağ
   - Confidence eşiği: 0.5

2. **Shoe Warp**
   - Heel→foot_index vektör = ayak yönü + uzunluk
   - Affine transform: ayakkabı PNG → ayak ekseni
   - Sol ve sağ ayak için ayrı warp

3. **Composite**
   - Alpha blend ile ayakkabıyı yerleştir
   - (TODO) Selfie Segmentation ile pantolon paçası occlusion

4. **FastAPI Wrapper** (Faz 4)
   - `POST /api/shoe-tryon` { model_url, shoe_url } → { result_b64 }

## Roadmap

- [x] Setup + venv
- [ ] Faz 1: Pose Detection + debug overlay
- [ ] Faz 2: Shoe Warp + Composite
- [ ] Faz 3: Occlusion mask
- [ ] Faz 4: FastAPI wrapper
- [ ] Faz 5: Modal/Runpod deploy (POC kapsamı dışı)
