"""
Pytest test suite for shoe_overlay + accessory_overlay.

Run:
    .venv\\Scripts\\python.exe -m pytest tests/ -v

Tests cover: pure-function units (no MediaPipe model load required) + integration
smoke tests (requires inputs/model.jpg + inputs/shoe.png).
"""
import os
import sys
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import shoe_overlay  # noqa: E402

INPUTS = ROOT / 'inputs'
HAS_DEMO = (INPUTS / 'model.jpg').exists() and (INPUTS / 'shoe.png').exists()


# ── PURE-FUNCTION UNITS ──────────────────────────────────────────────────────

def test_validate_input_high_confidence_ok():
    feet = {
        'left':  {'ankle': (100, 900, 0.99), 'heel': (90, 920, 0.95), 'toe': (130, 920, 0.99)},
        'right': {'ankle': (200, 900, 0.98), 'heel': (210, 920, 0.95), 'toe': (240, 920, 0.99)},
    }
    image_shape = (1000, 500, 3)  # H,W,C — ankles at y=900 = %90 alt
    res = shoe_overlay.validate_input_for_tryon(feet, image_shape)
    assert res['valid'] is True
    assert res['fatal'] is False


def test_validate_input_low_confidence_fatal():
    feet = {
        'left':  {'ankle': (100, 900, 0.1), 'heel': (90, 920, 0.1), 'toe': (130, 920, 0.1)},
        'right': {'ankle': (200, 900, 0.1), 'heel': (210, 920, 0.1), 'toe': (240, 920, 0.1)},
    }
    res = shoe_overlay.validate_input_for_tryon(feet, (1000, 500, 3))
    assert res['valid'] is False
    assert res['fatal'] is True


def test_validate_input_ankles_too_high_warning_not_fatal():
    feet = {
        'left':  {'ankle': (100, 300, 0.9), 'heel': (90, 320, 0.9), 'toe': (130, 320, 0.9)},
        'right': {'ankle': (200, 300, 0.9), 'heel': (210, 320, 0.9), 'toe': (240, 320, 0.9)},
    }
    res = shoe_overlay.validate_input_for_tryon(feet, (1000, 500, 3))
    assert res['valid'] is False
    assert res['fatal'] is False


def test_perspective_scale_in_range():
    feet = {
        'left':  {'ankle': (100, 700, 0.99), 'heel': (90, 720, 0.95), 'toe': (130, 720, 0.99)},
        'right': {'ankle': (200, 700, 0.98), 'heel': (210, 720, 0.95), 'toe': (240, 720, 0.99)},
    }
    s = shoe_overlay.estimate_perspective_scale(feet, (1000, 500, 3))
    assert 0.25 <= s <= 0.55


def test_perspective_scale_far_subject_smaller():
    # Yukarıda ankle → kişi uzakta → küçük ölçek
    far = shoe_overlay.estimate_perspective_scale(
        {'left':  {'ankle': (100, 500, 1)},
         'right': {'ankle': (200, 500, 1)},
         # diğer keypoint gerekmez bu test için
        }, (1000, 500, 3))
    near = shoe_overlay.estimate_perspective_scale(
        {'left':  {'ankle': (100, 950, 1)},
         'right': {'ankle': (200, 950, 1)},
        }, (1000, 500, 3))
    assert near > far


def test_add_drop_shadow_changes_bgra_outside_alpha():
    shoe = np.zeros((100, 100, 4), dtype=np.uint8)
    shoe[40:60, 40:60, :3] = 100
    shoe[40:60, 40:60, 3] = 255
    out = shoe_overlay.add_drop_shadow(shoe, offset=(5, 5), blur=5, opacity=0.5)
    # Gölge alanı orijinalde alpha=0 olan yerlere yayılmış olmalı
    diff = (out[..., 3] != shoe[..., 3]).sum()
    assert diff > 0


def test_alpha_composite_preserves_base_where_overlay_transparent():
    base = np.full((50, 50, 3), 128, dtype=np.uint8)
    overlay = np.zeros((50, 50, 4), dtype=np.uint8)  # tamamen şeffaf
    out = shoe_overlay.alpha_composite(base, overlay)
    assert np.array_equal(out, base)


def test_alpha_composite_overlay_full_opaque_replaces():
    base = np.full((10, 10, 3), 128, dtype=np.uint8)
    overlay = np.zeros((10, 10, 4), dtype=np.uint8)
    overlay[..., :3] = [255, 0, 0]
    overlay[..., 3] = 255
    out = shoe_overlay.alpha_composite(base, overlay)
    assert np.array_equal(out[0, 0], [255, 0, 0])


def test_extract_single_shoe_tek_blob_no_change():
    bgra = np.zeros((100, 100, 4), dtype=np.uint8)
    bgra[30:70, 30:70, :3] = 80
    bgra[30:70, 30:70, 3] = 255
    out = shoe_overlay.extract_single_shoe(bgra)
    assert (out[..., 3] > 0).sum() == (bgra[..., 3] > 0).sum()


def test_extract_single_shoe_kmeans_split():
    """İki ayrı blob — k-means ile alt-y'deki seçilmeli."""
    bgra = np.zeros((400, 400, 4), dtype=np.uint8)
    # Üst blob (arka ayakkabı)
    bgra[50:150, 100:200, :3] = 80
    bgra[50:150, 100:200, 3] = 255
    # Alt blob (foreground ayakkabı)
    bgra[250:350, 200:300, :3] = 80
    bgra[250:350, 200:300, 3] = 255
    out = shoe_overlay.extract_single_shoe(bgra)
    # Alt blob korunmalı, üst blob alpha=0 olmalı
    upper_alpha_sum = out[50:150, 100:200, 3].sum()
    lower_alpha_sum = out[250:350, 200:300, 3].sum()
    assert lower_alpha_sum > upper_alpha_sum * 3


# ── INTEGRATION SMOKE (gerçek MediaPipe model yükler, demo dosyaları varsa) ──

@pytest.mark.skipif(not HAS_DEMO, reason="demo inputs/ dosyaları eksik")
def test_full_pipeline_smoke(tmp_path):
    import cv2
    model = cv2.imread(str(INPUTS / 'model.jpg'))
    assert model is not None
    feet, mask = shoe_overlay.detect_feet(model, with_segmentation=True)
    assert feet is not None
    assert mask is not None
    assert mask.shape[:2] == model.shape[:2]

    shoe = shoe_overlay.load_shoe(str(INPUTS / 'shoe.png'))
    shoe = shoe_overlay.extract_single_shoe(shoe)
    H, W = model.shape[:2]
    height_ratio = shoe_overlay.estimate_perspective_scale(feet, model.shape)

    result = model.copy()
    for side in ('left', 'right'):
        warped = shoe_overlay.warp_shoe_to_foot(shoe, feet[side], (W, H),
                                                 mirror=(side == 'right'),
                                                 height_ratio=height_ratio)
        warped = shoe_overlay.apply_pants_occlusion(result, warped, mask,
                                                     ankle_y=feet[side]['ankle'][1])
        result = shoe_overlay.alpha_composite(result, warped)

    out_path = tmp_path / 'smoke.png'
    cv2.imwrite(str(out_path), result)
    assert out_path.exists() and out_path.stat().st_size > 1000
