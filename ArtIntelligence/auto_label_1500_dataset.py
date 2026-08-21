import os
import glob
import cv2
import numpy as np

TARGET_DIR = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\datasets\dataset-1500\catfishcare_dataset_1787243240"
IMG_DIR = os.path.join(TARGET_DIR, "images")
CAND_DIR = os.path.join(TARGET_DIR, "auto_labeled_candidates", "candidate_labels")

os.makedirs(CAND_DIR, exist_ok=True)

# Purge old candidates in CAND_DIR
for f in glob.glob(os.path.join(CAND_DIR, "*.txt")):
    try:
        os.remove(f)
    except Exception:
        pass

img_files = glob.glob(os.path.join(IMG_DIR, "*.jpg")) + glob.glob(os.path.join(IMG_DIR, "*.png"))
print(f"Starting Enhanced Murky Water Auto-Labeling for {len(img_files)} images...")

total_candidates = 0
processed_images = 0

clahe = cv2.createCLAHE(clipLimit=3.5, tileGridSize=(8, 8))
kernel_tophat = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))

for img_path in img_files:
    base_name = os.path.splitext(os.path.basename(img_path))[0]
    out_txt = os.path.join(CAND_DIR, base_name + ".txt")

    img = cv2.imread(img_path)
    if img is None:
        continue

    h, w = img.shape[:2]

    # Convert to Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. CLAHE Contrast Enhancement for murky/dark water
    enhanced = clahe.apply(gray)

    # 2. Morphological Top-Hat Transform (isolates bright bubbles on murky/dark backgrounds)
    tophat = cv2.morphologyEx(enhanced, cv2.MORPH_TOPHAT, kernel_tophat)

    # 3. Adaptive Thresholding on Top-Hat
    blur_th = cv2.GaussianBlur(tophat, (3, 3), 0)
    _, thresh = cv2.threshold(blur_th, 20, 255, cv2.THRESH_BINARY)

    # Mask container outer border (Y < 12px and edges)
    mask_region = np.ones((h, w), dtype=np.uint8) * 255
    mask_region[0:12, :] = 0
    thresh = cv2.bitwise_and(thresh, thresh, mask=mask_region)

    # Morphological Close to merge bubble cluster droplets
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel_close)

    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    candidates = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        
        # Area filter for bubble clusters in murky water
        if area < 60 or area > 18000:
            continue

        bx, by, bw, bh = cv2.boundingRect(cnt)
        if bw == 0 or bh == 0:
            continue

        yc = (by + bh / 2.0) / float(h)
        xc = (bx + bw / 2.0) / float(w)
        
        # Ignore outer container frame border
        if xc < 0.015 or xc > 0.985 or yc < 0.02 or yc > 0.98:
            continue

        # Ignore container top border glare line
        if yc < 0.05 and (bw / float(w)) > 0.50:
            continue

        aspect_ratio = float(bw) / float(bh)
        if aspect_ratio < 0.20 or aspect_ratio > 4.5:
            continue

        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0:
            continue
        circularity = 4.0 * np.pi * area / (perimeter * perimeter)
        if circularity < 0.06:
            continue

        # Confidence metric
        norm_bw = bw / float(w)
        norm_bh = bh / float(h)
        conf = min(0.95, max(0.50, circularity * 0.40 + (area / 1000.0) * 0.30 + 0.30))

        candidates.append((0, xc, yc, norm_bw, norm_bh, conf))

    # Save candidates
    with open(out_txt, "w") as f:
        for c in candidates:
            f.write(f"{c[0]} {c[1]:.6f} {c[2]:.6f} {c[3]:.6f} {c[4]:.6f} {c[5]:.4f}\n")

    total_candidates += len(candidates)
    processed_images += 1

print(f"==================================================")
print(f"Murky Water Bubble Auto-Labeling Complete!")
print(f"Processed Images : {processed_images}")
print(f"Total Candidates Generated : {total_candidates}")
print(f"Average Candidates per Image : {total_candidates / max(1, processed_images):.2f}")
print(f"==================================================")
