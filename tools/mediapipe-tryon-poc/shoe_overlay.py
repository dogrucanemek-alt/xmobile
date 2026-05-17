"""
MediaPipe Shoe Try-On POC

Usage:
    python shoe_overlay.py <model_image> <shoe_png> <output_path> [--debug]

Pipeline:
    1. Pose detection (MediaPipe Pose Heavy) → ankle/heel/foot_index keypoints
    2. Heel→foot_index vector defines foot orientation + length
    3. Shoe PNG warped via affine transform to foot axis
    4. Alpha composite onto model image
"""
import argparse
import sys
from pathlib import Path

# Windows console UTF-8 — print() içindeki → ✓ gibi karakterler için
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

import cv2
import numpy as np
import mediapipe as mp


# MediaPipe Pose landmark indices (33-point full body)
LM_LEFT_ANKLE = 27
LM_RIGHT_ANKLE = 28
LM_LEFT_HEEL = 29
LM_RIGHT_HEEL = 30
LM_LEFT_FOOT_INDEX = 31
LM_RIGHT_FOOT_INDEX = 32


def detect_feet(image_bgr: np.ndarray, with_segmentation: bool = True):
    """
    MediaPipe Pose ile ayak landmarklarını + opsiyonel kişi segmentasyon maskesi.
    Returns: (feet_dict, segmentation_mask | None)
        feet_dict: { 'left':  {'ankle': (x,y,vis), 'heel': (x,y,vis), 'toe': (x,y,vis)},
                     'right': {...} }
        mask: uint8 array (H,W) — kişi 255, arka plan 0; segmentation kapatıldıysa None
    """
    h, w = image_bgr.shape[:2]
    with mp.solutions.pose.Pose(
        static_image_mode=True,
        model_complexity=2,        # Heavy model — daha doğru keypoint
        enable_segmentation=with_segmentation,
        min_detection_confidence=0.5,
    ) as pose:
        results = pose.process(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))

    if not results.pose_landmarks:
        return None, None

    lms = results.pose_landmarks.landmark

    def pt(idx):
        lm = lms[idx]
        return (int(lm.x * w), int(lm.y * h), float(lm.visibility))

    feet = {
        'left':  {
            'ankle': pt(LM_LEFT_ANKLE),
            'heel':  pt(LM_LEFT_HEEL),
            'toe':   pt(LM_LEFT_FOOT_INDEX),
        },
        'right': {
            'ankle': pt(LM_RIGHT_ANKLE),
            'heel':  pt(LM_RIGHT_HEEL),
            'toe':   pt(LM_RIGHT_FOOT_INDEX),
        },
    }

    mask = None
    if with_segmentation and results.segmentation_mask is not None:
        mask = (results.segmentation_mask * 255).astype(np.uint8)

    return feet, mask


def extract_single_shoe(shoe_bgra: np.ndarray) -> np.ndarray:
    """
    Çift ayakkabı içeren PNG'den TEK ayakkabıyı kes.
    İki yaklaşım:
      1) Connected components: 2 büyük blob varsa öndeki (alt-tarafta olan) seçilir
      2) Aspect ratio fallback: bbox çok geniş (W > H * 1.3) ise çift varsayılır,
         alpha kütlesi merkezine göre sağ yarı (foreground) kırpılır.
    """
    alpha = shoe_bgra[..., 3]
    mask = (alpha > 20).astype(np.uint8) * 255

    # Önce morphological erosion ile birbirine değen blob'ları ayırmaya çalış
    kernel = np.ones((9, 9), np.uint8)
    eroded = cv2.erode(mask, kernel, iterations=2)
    num, labels, stats, _ = cv2.connectedComponentsWithStats(eroded, connectivity=8)

    if num >= 3:  # background + en az 2 blob
        areas = sorted([(stats[i, cv2.CC_STAT_AREA], i) for i in range(1, num)], reverse=True)
        biggest_area = areas[0][0]
        second_area = areas[1][0] if len(areas) > 1 else 0
        if second_area > biggest_area * 0.3:
            # 2 ayakkabı tespit edildi — foreground'u seç (alt-y'si büyük olan)
            candidates = areas[:2]
            chosen_label = max(candidates, key=lambda x: stats[x[1], cv2.CC_STAT_TOP] + stats[x[1], cv2.CC_STAT_HEIGHT])[1]
            # Erosion sonrası kalan blob'u dilate ederek orijinal şekline geri getir
            chosen_mask = (labels == chosen_label).astype(np.uint8) * 255
            chosen_mask = cv2.dilate(chosen_mask, kernel, iterations=3)
            # Orijinal alpha ile AND
            final_alpha = np.minimum(alpha, chosen_mask).astype(np.uint8)
            result = shoe_bgra.copy()
            result[..., 3] = final_alpha
            return result

    # K-means fallback: iki sneaker birbirine değiyorsa connected components
    # ayırmayı başaramaz. Alpha pikselleri (x,y) koordinatlarında 2 cluster'a böl;
    # foreground = alt-y'de olan centroid (yere daha yakın = öndeki sneaker).
    ys, xs = np.where(mask > 0)
    if len(xs) < 200:
        return shoe_bgra
    points = np.float32(np.column_stack([xs, ys]))
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 50, 0.5)
    _, labels_k, centers = cv2.kmeans(points, 2, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    labels_k = labels_k.flatten()

    # İki cluster'ın centroid y koordinatlarını karşılaştır
    fg_label = int(np.argmax(centers[:, 1]))  # daha alt-y = foreground

    # Cluster ayırma anlamlı mı? Centroid mesafesi yeterli + her cluster büyük olmalı
    cluster_sep = np.linalg.norm(centers[0] - centers[1])
    cluster_sizes = np.bincount(labels_k, minlength=2)
    min_size = cluster_sizes.min()
    total_size = cluster_sizes.sum()
    # En küçük cluster en az %20 büyük olsun ki "asymmetric noise + 1 shoe" durumunda bölmeyelim
    if cluster_sep < 100 or min_size < total_size * 0.2:
        return shoe_bgra

    fg_indices = np.where(labels_k == fg_label)[0]
    fg_y = ys[fg_indices]
    fg_x = xs[fg_indices]
    fg_mask = np.zeros_like(alpha)
    fg_mask[fg_y, fg_x] = 255
    # Cluster sınırındaki ufak boşlukları kapat
    fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))

    final_alpha = np.minimum(alpha, fg_mask).astype(np.uint8)
    result = shoe_bgra.copy()
    result[..., 3] = final_alpha
    return result


def apply_pants_occlusion(base_bgr: np.ndarray, shoe_warped: np.ndarray, person_mask: np.ndarray, ankle_y: int):
    """
    Ayakkabının ankle seviyesinden YUKARI kalan kısmını maskeleyip pantolonun
    arkasında kalmasını sağla. Bu basit yaklaşım: ankle_y'den yukarıdaki
    shoe pixel'lerinin alpha'sını 0'la.
    """
    if shoe_warped.shape[2] < 4:
        return shoe_warped
    out = shoe_warped.copy()
    # Ankle seviyesinden ~%10 yukarı kadar olan kısmı kes (alpha 0)
    # ankle keypointi ayağın üst kısmında — bu noktadan yukarısı pantolon
    cutoff_y = max(0, ankle_y - 5)
    out[:cutoff_y, :, 3] = 0
    return out


def load_shoe(shoe_path: str):
    """
    Ayakkabı PNG'yi alpha kanalıyla yükle.
    PNG transparent değilse, beyaz arka planı alpha'ya çevir (fallback).
    """
    img = cv2.imread(shoe_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Ayakkabı PNG okunamadı: {shoe_path}")

    if img.shape[2] == 3:
        # Alpha kanal yok → beyaz pikselleri şeffaf yap (basit fallback)
        bgr = img
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        _, alpha = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
        img = cv2.merge([bgr[..., 0], bgr[..., 1], bgr[..., 2], alpha])

    return img  # BGRA, uint8


def shoe_orientation_box(shoe_bgra: np.ndarray):
    """
    Ayakkabı PNG'sinde alpha > 0 olan pikselleri saran tight bbox + içindeki "ayak ekseni" yön vektörünü tahmin et.

    Basit varsayım: PNG ürün fotoğrafı yandan profil çekilmiş (paragraph topuk solda/sağda).
    Heel (topuk) = bbox'ın sol kısa kenarı orta noktası
    Toe (parmak ucu) = bbox'ın sağ kısa kenarı orta noktası
    """
    alpha = shoe_bgra[..., 3]
    ys, xs = np.where(alpha > 20)
    if len(xs) == 0:
        raise ValueError("Ayakkabı PNG'sinde görünür piksel yok (alpha hep 0).")

    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    box_w = x1 - x0
    box_h = y1 - y0

    # Yatay mı (yan profil) yoksa dikey mi?
    if box_w >= box_h:
        # Yatay → heel solda, toe sağda
        heel = (x0, (y0 + y1) // 2)
        toe  = (x1, (y0 + y1) // 2)
    else:
        # Dikey → heel altta, toe yukarıda (genelde olmaz ama defensive)
        heel = ((x0 + x1) // 2, y1)
        toe  = ((x0 + x1) // 2, y0)

    return (x0, y0, x1, y1), heel, toe


def warp_shoe_to_foot(shoe_bgra: np.ndarray, foot, target_size, mirror=False):
    """
    Ayakkabıyı ayak vektörüne uygun affine warp et.

    foot: { 'ankle': (x,y,vis), 'heel': (x,y,vis), 'toe': (x,y,vis) }
    target_size: (W, H) of model image
    mirror: True ise yatay flip (sağ ayak için sol-profilden çevirme)

    Returns: BGRA mat aynı boyutta (model image), shoe placed.
    """
    src_box, src_heel, src_toe = shoe_orientation_box(shoe_bgra)

    if mirror:
        shoe_bgra = cv2.flip(shoe_bgra, 1)
        # mirror sonrası heel/toe x koordinatları flip
        w_shoe = shoe_bgra.shape[1]
        src_heel = (w_shoe - 1 - src_heel[0], src_heel[1])
        src_toe  = (w_shoe - 1 - src_toe[0],  src_toe[1])

    # Hedef: foot.heel → foot.toe vektörü
    dst_heel = np.array(foot['heel'][:2], dtype=np.float32)
    dst_toe  = np.array(foot['toe'][:2],  dtype=np.float32)

    # 3. nokta — ayak normal yönü (vektöre dik, biraz yukarı)
    # Bu, ayakkabı "yüksekliği" için referans
    src_h_vec = np.array([src_heel[0] - src_box[0], src_heel[1] - src_box[1]])
    src_dx = src_toe[0] - src_heel[0]
    src_dy = src_toe[1] - src_heel[1]
    # Source ayakkabı yüksekliği (perpendicular up)
    src_perp = np.array([-src_dy, src_dx], dtype=np.float32)
    src_perp_len = np.linalg.norm(src_perp)
    if src_perp_len > 1e-6:
        src_perp = src_perp / src_perp_len
    box_h = src_box[3] - src_box[1]
    src_up = np.array([src_heel[0], src_heel[1]], dtype=np.float32) + src_perp * (box_h * 0.4)

    dst_dx = dst_toe[0] - dst_heel[0]
    dst_dy = dst_toe[1] - dst_heel[1]
    dst_perp = np.array([-dst_dy, dst_dx], dtype=np.float32)
    dst_perp_len = np.linalg.norm(dst_perp)
    if dst_perp_len > 1e-6:
        dst_perp = dst_perp / dst_perp_len
    # Hedef yükseklik = ayak uzunluğunun ~%40'ı (ayakkabı tipik oranı)
    dst_height = np.linalg.norm([dst_dx, dst_dy]) * 0.4
    dst_up = dst_heel + dst_perp * dst_height

    src_pts = np.array([src_heel, src_toe, [src_up[0], src_up[1]]], dtype=np.float32)
    dst_pts = np.array([dst_heel, dst_toe, dst_up], dtype=np.float32)

    M = cv2.getAffineTransform(src_pts, dst_pts)
    W, H = target_size
    warped = cv2.warpAffine(
        shoe_bgra, M, (W, H),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0),
    )
    return warped


def alpha_composite(base_bgr: np.ndarray, overlay_bgra: np.ndarray):
    """Alpha-blend overlay (BGRA) onto base (BGR). In-place safe."""
    alpha = overlay_bgra[..., 3:4].astype(np.float32) / 255.0
    overlay_bgr = overlay_bgra[..., :3].astype(np.float32)
    base_f = base_bgr.astype(np.float32)
    out = base_f * (1 - alpha) + overlay_bgr * alpha
    return np.clip(out, 0, 255).astype(np.uint8)


def draw_debug_keypoints(image: np.ndarray, feet):
    """Debug: ayak landmarklarını görsele çiz."""
    out = image.copy()
    for side, color in [('left', (0, 255, 0)), ('right', (0, 200, 255))]:
        f = feet[side]
        cv2.circle(out, f['ankle'][:2], 6, color, -1)
        cv2.circle(out, f['heel'][:2],  6, color, -1)
        cv2.circle(out, f['toe'][:2],   6, color, -1)
        cv2.line(out, f['heel'][:2], f['toe'][:2], color, 2)
        cv2.putText(out, f"{side[0].upper()}-heel", f['heel'][:2],
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
        cv2.putText(out, f"{side[0].upper()}-toe",  f['toe'][:2],
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('model',  help='Tam boy model fotoğrafı (JPG/PNG)')
    ap.add_argument('shoe',   help='Ayakkabı PNG (transparent BG)')
    ap.add_argument('output', help='Sonuç görsel yolu')
    ap.add_argument('--debug', action='store_true', help='Pose keypoints overlay debug')
    ap.add_argument('--vis-threshold', type=float, default=0.3,
                    help='Minimum visibility eşiği — düşükse o ayak atlanır')
    args = ap.parse_args()

    model = cv2.imread(args.model)
    if model is None:
        print(f"HATA: Model fotoğrafı okunamadı: {args.model}", file=sys.stderr)
        sys.exit(1)
    H, W = model.shape[:2]
    print(f"[*] Model: {W}x{H}")

    feet, person_mask = detect_feet(model, with_segmentation=True)
    if feet is None:
        print("HATA: Pose tespit edilemedi (kişi yok veya fotoğraf çok karanlık?).", file=sys.stderr)
        sys.exit(2)

    print(f"[*] Sol ayak vis: ankle={feet['left']['ankle'][2]:.2f} heel={feet['left']['heel'][2]:.2f} toe={feet['left']['toe'][2]:.2f}")
    print(f"[*] Sağ ayak vis: ankle={feet['right']['ankle'][2]:.2f} heel={feet['right']['heel'][2]:.2f} toe={feet['right']['toe'][2]:.2f}")
    if person_mask is not None:
        print(f"[*] Person mask: {person_mask.shape}")

    if args.debug:
        dbg = draw_debug_keypoints(model, feet)
        debug_path = str(Path(args.output).with_stem(Path(args.output).stem + '_debug'))
        cv2.imwrite(debug_path, dbg)
        print(f"[debug] Keypoint overlay -> {debug_path}")
        if person_mask is not None:
            mask_path = str(Path(args.output).with_stem(Path(args.output).stem + '_mask'))
            cv2.imwrite(mask_path, person_mask)
            print(f"[debug] Person mask -> {mask_path}")

    shoe_raw = load_shoe(args.shoe)
    print(f"[*] Ayakkabı (raw): {shoe_raw.shape[1]}x{shoe_raw.shape[0]} alpha={'var' if shoe_raw.shape[2]==4 else 'yok'}")

    shoe = extract_single_shoe(shoe_raw)
    # Tek ayakkabıyı kestiysen alpha pixel sayısı düştüyse log
    raw_pixels  = int((shoe_raw[..., 3] > 20).sum())
    kept_pixels = int((shoe[..., 3]  > 20).sum())
    if kept_pixels < raw_pixels:
        print(f"[*] Tek ayakkabıya kesildi: {raw_pixels} -> {kept_pixels} px ({100*kept_pixels/raw_pixels:.0f}%)")
    if args.debug:
        shoe_path = str(Path(args.output).with_stem(Path(args.output).stem + '_shoe'))
        cv2.imwrite(shoe_path, shoe)
        print(f"[debug] Cropped shoe -> {shoe_path}")

    result = model.copy()
    skipped = []
    for side in ('left', 'right'):
        f = feet[side]
        min_vis = min(f['heel'][2], f['toe'][2])
        if min_vis < args.vis_threshold:
            skipped.append(f"{side} (vis={min_vis:.2f})")
            continue
        # Sağ ayak için ayakkabıyı yatay flip
        warped = warp_shoe_to_foot(shoe, f, (W, H), mirror=(side == 'right'))
        # Ankle seviyesinden yukarısını kes — pantolon paçası ayakkabının üstünde kalsın
        warped = apply_pants_occlusion(result, warped, person_mask, ankle_y=f['ankle'][1])
        result = alpha_composite(result, warped)

    if skipped:
        print(f"[!] Atlandı (düşük confidence): {', '.join(skipped)}")

    cv2.imwrite(args.output, result)
    print(f"[OK] Sonuç -> {args.output}")


if __name__ == '__main__':
    main()
