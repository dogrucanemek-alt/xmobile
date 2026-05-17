"""
MediaPipe Face Mesh ile şapka + gözlük composite.

Usage:
    python accessory_overlay.py <model_image> <accessory_png> <type> <output> [--debug]
    type ∈ {glasses, hat}

Face Mesh landmark indices (468-point):
    - Outer eye corners: 33 (sol dış), 263 (sağ dış)
    - Nose bridge: 168 (kaşlar arası)
    - Temples: 127 (sol), 356 (sağ)
    - Forehead arc: 10 (üst-orta), 151, 9
    - Chin: 152
"""
import argparse
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

import cv2
import numpy as np
import mediapipe as mp

from shoe_overlay import load_shoe, alpha_composite, add_drop_shadow

# Face Mesh anahtar indices
LEFT_EYE_OUTER  = 33
RIGHT_EYE_OUTER = 263
NOSE_BRIDGE     = 168
LEFT_TEMPLE     = 127
RIGHT_TEMPLE    = 356
FOREHEAD_TOP    = 10
CHIN            = 152


def detect_face_landmarks(image_bgr: np.ndarray):
    """
    Face Mesh ile 468-point landmark dön.
    Returns: dict | None — key landmarklar pixel koordinatında
    """
    h, w = image_bgr.shape[:2]
    with mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
    ) as face_mesh:
        results = face_mesh.process(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))

    if not results.multi_face_landmarks:
        return None

    lms = results.multi_face_landmarks[0].landmark

    def pt(idx):
        lm = lms[idx]
        return (int(lm.x * w), int(lm.y * h))

    return {
        'left_eye_outer':  pt(LEFT_EYE_OUTER),
        'right_eye_outer': pt(RIGHT_EYE_OUTER),
        'nose_bridge':     pt(NOSE_BRIDGE),
        'left_temple':     pt(LEFT_TEMPLE),
        'right_temple':    pt(RIGHT_TEMPLE),
        'forehead_top':    pt(FOREHEAD_TOP),
        'chin':            pt(CHIN),
    }


def warp_glasses(glasses_bgra: np.ndarray, face, target_size):
    """
    Gözlüğü yüze affine warp et. 3 anchor:
      - Sol dış göz köşesi
      - Sağ dış göz köşesi
      - Burun köprüsü (Y referansı için biraz aşağı)
    """
    H_target = target_size[1]
    W_target = target_size[0]

    # Gözlük PNG'sinin alpha bbox'undan src anchor'ları al
    alpha = glasses_bgra[..., 3]
    ys, xs = np.where(alpha > 20)
    if len(xs) == 0:
        raise ValueError("Gözlük PNG'sinde görünür piksel yok.")
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    src_left  = (x0, (y0 + y1) // 2)
    src_right = (x1, (y0 + y1) // 2)
    src_nose  = ((x0 + x1) // 2, y1)  # PNG'de gözlüğün alt-orta noktası

    # Hedef anchor'lar
    dst_left  = face['left_eye_outer']
    dst_right = face['right_eye_outer']
    dst_nose  = face['nose_bridge']

    src_pts = np.array([src_left, src_right, src_nose], dtype=np.float32)
    dst_pts = np.array([dst_left, dst_right, dst_nose], dtype=np.float32)
    M = cv2.getAffineTransform(src_pts, dst_pts)
    return cv2.warpAffine(
        glasses_bgra, M, (W_target, H_target),
        flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0),
    )


def warp_hat(hat_bgra: np.ndarray, face, target_size, lift_ratio=0.85):
    """
    Şapkayı başa affine warp et. Anchor'lar:
      - Sol şakak
      - Sağ şakak
      - Alın üst noktası (Y için, biraz yukarı)
    lift_ratio: şapkanın forehead_top yukarısına ne kadar 'kayacağı' (0.85 = saç boşluğu).
    """
    W_target, H_target = target_size

    alpha = hat_bgra[..., 3]
    ys, xs = np.where(alpha > 20)
    if len(xs) == 0:
        raise ValueError("Şapka PNG'sinde görünür piksel yok.")
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    # PNG'de şapka geniş kenarı yatay → src anchor'lar alt-sol, alt-sağ, üst-orta
    src_bl = (x0, y1)
    src_br = (x1, y1)
    src_top = ((x0 + x1) // 2, y0)

    # Hedef: şakaklar + alın üstünden biraz yukarı
    dst_bl = face['left_temple']
    dst_br = face['right_temple']
    fh = face['forehead_top']
    # Şapkanın üstü forehead_top'tan saç boşluğu kadar yukarı
    head_height = abs(fh[1] - face['chin'][1])
    lift = int(head_height * lift_ratio)
    dst_top = (fh[0], fh[1] - lift)

    src_pts = np.array([src_bl, src_br, src_top], dtype=np.float32)
    dst_pts = np.array([dst_bl, dst_br, dst_top], dtype=np.float32)
    M = cv2.getAffineTransform(src_pts, dst_pts)
    return cv2.warpAffine(
        hat_bgra, M, (W_target, H_target),
        flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0),
    )


def draw_debug_face(image: np.ndarray, face):
    out = image.copy()
    for name, color in [
        ('left_eye_outer', (255, 0, 0)),
        ('right_eye_outer', (255, 0, 0)),
        ('nose_bridge', (0, 255, 0)),
        ('left_temple', (0, 200, 255)),
        ('right_temple', (0, 200, 255)),
        ('forehead_top', (255, 255, 0)),
        ('chin', (255, 0, 255)),
    ]:
        cv2.circle(out, face[name], 5, color, -1)
        cv2.putText(out, name, face[name], cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('model',  help='Yüz fotoğrafı (JPG/PNG)')
    ap.add_argument('accessory', help='Aksesuar PNG (transparent BG)')
    ap.add_argument('type', choices=['glasses', 'hat'])
    ap.add_argument('output', help='Sonuç görsel yolu')
    ap.add_argument('--debug', action='store_true')
    args = ap.parse_args()

    model = cv2.imread(args.model)
    if model is None:
        print(f"HATA: Model okunamadı: {args.model}", file=sys.stderr)
        sys.exit(1)
    H, W = model.shape[:2]
    print(f"[*] Model: {W}x{H}")

    face = detect_face_landmarks(model)
    if face is None:
        print("HATA: Yüz bulunamadı.", file=sys.stderr)
        sys.exit(2)
    print(f"[*] Yüz landmarks: sol göz dış {face['left_eye_outer']}, sağ göz dış {face['right_eye_outer']}")

    if args.debug:
        dbg = draw_debug_face(model, face)
        debug_path = str(Path(args.output).with_stem(Path(args.output).stem + '_debug'))
        cv2.imwrite(debug_path, dbg)
        print(f"[debug] Yüz keypoints -> {debug_path}")

    accessory = load_shoe(args.accessory)  # load_shoe = PNG/JPEG yükle + alpha fallback
    print(f"[*] Aksesuar: {accessory.shape[1]}x{accessory.shape[0]} alpha={'var' if accessory.shape[2]==4 else 'yok'}")

    if args.type == 'glasses':
        warped = warp_glasses(accessory, face, (W, H))
    else:
        warped = warp_hat(accessory, face, (W, H))

    warped = add_drop_shadow(warped, offset=(2, 4), blur=9, opacity=0.25)
    result = alpha_composite(model, warped)
    cv2.imwrite(args.output, result)
    print(f"[OK] Sonuç -> {args.output}")


if __name__ == '__main__':
    main()
