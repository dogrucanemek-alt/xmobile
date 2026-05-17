"""
FastAPI wrapper — xmobile-proxy'den çağrılabilir HTTP endpoint.

Run:
    .venv\\Scripts\\python.exe -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload

Endpoints:
    POST /tryon/shoe
        form-data:
            model_image: file (JPG/PNG)
            shoe_image:  file (PNG with alpha)
        response: image/jpeg (composite result)

    POST /tryon/shoe/url
        body: { "model_url": "...", "shoe_url": "..." }
        response: { "result_b64": "data:image/jpeg;base64,..." }

    GET /health
        response: { "ok": true, "mediapipe": "<version>" }
"""
import base64
import io
import os
import urllib.request
from typing import Optional

import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel

from shoe_overlay import (
    detect_feet, load_shoe, warp_shoe_to_foot, alpha_composite,
    extract_single_shoe, apply_pants_occlusion,
)

app = FastAPI(title="xmobile Shoe Try-On", version="0.1.0")


def _img_from_bytes(data: bytes):
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise HTTPException(status_code=400, detail="Görsel decode edilemedi")
    return img


def _img_from_url(url: str):
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = resp.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"URL indirilemedi: {e}")
    return _img_from_bytes(data)


def _run_pipeline(model_img: np.ndarray, shoe_img: np.ndarray, vis_threshold: float = 0.3):
    if model_img.ndim == 3 and model_img.shape[2] == 4:
        model_img = cv2.cvtColor(model_img, cv2.COLOR_BGRA2BGR)
    H, W = model_img.shape[:2]

    feet, person_mask = detect_feet(model_img, with_segmentation=True)
    if feet is None:
        raise HTTPException(status_code=422, detail="Fotoğrafta kişi/pose tespit edilemedi")

    # shoe_img BGRA bekleniyor; değilse 3-kanaldan alpha üret
    if shoe_img.ndim == 3 and shoe_img.shape[2] == 3:
        gray = cv2.cvtColor(shoe_img, cv2.COLOR_BGR2GRAY)
        _, alpha = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
        shoe_img = cv2.merge([shoe_img[..., 0], shoe_img[..., 1], shoe_img[..., 2], alpha])

    shoe_img = extract_single_shoe(shoe_img)

    result = model_img.copy()
    skipped = []
    for side in ('left', 'right'):
        f = feet[side]
        min_vis = min(f['heel'][2], f['toe'][2])
        if min_vis < vis_threshold:
            skipped.append(side)
            continue
        warped = warp_shoe_to_foot(shoe_img, f, (W, H), mirror=(side == 'right'))
        warped = apply_pants_occlusion(result, warped, person_mask, ankle_y=f['ankle'][1])
        result = alpha_composite(result, warped)

    return result, skipped


def _encode_jpeg(img: np.ndarray, quality: int = 90) -> bytes:
    ok, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise HTTPException(status_code=500, detail="JPEG encode başarısız")
    return buf.tobytes()


@app.get("/health")
async def health():
    return {"ok": True, "mediapipe": mp.__version__}


@app.post("/tryon/shoe")
async def tryon_shoe_files(
    model_image: UploadFile = File(...),
    shoe_image: UploadFile = File(...),
):
    model_data = await model_image.read()
    shoe_data  = await shoe_image.read()
    model_img = _img_from_bytes(model_data)
    shoe_img  = _img_from_bytes(shoe_data)
    result, skipped = _run_pipeline(model_img, shoe_img)
    jpeg = _encode_jpeg(result)
    headers = {"X-Skipped-Feet": ",".join(skipped) if skipped else "none"}
    return Response(content=jpeg, media_type="image/jpeg", headers=headers)


class UrlReq(BaseModel):
    model_url: str
    shoe_url: str
    vis_threshold: Optional[float] = 0.3


@app.post("/tryon/shoe/url")
async def tryon_shoe_url(req: UrlReq):
    model_img = _img_from_url(req.model_url)
    shoe_img  = _img_from_url(req.shoe_url)
    result, skipped = _run_pipeline(model_img, shoe_img, req.vis_threshold or 0.3)
    jpeg = _encode_jpeg(result)
    b64 = base64.b64encode(jpeg).decode("ascii")
    return JSONResponse({
        "result_b64": f"data:image/jpeg;base64,{b64}",
        "skipped_feet": skipped,
    })
