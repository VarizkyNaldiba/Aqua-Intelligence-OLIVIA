import os
import glob
import cv2
import numpy as np

TARGET_DIR = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\datasets\dataset-1500\catfishcare_dataset_1787243240"
IMG_DIR = os.path.join(TARGET_DIR, "images")
CAND_DIR = os.path.join(TARGET_DIR, "auto_labeled_candidates", "candidate_labels")

os.makedirs(CAND_DIR, exist_ok=True)

# Purge old candidate label files
for f in glob.glob(os.path.join(CAND_DIR, "*.txt")):
    try:
        os.remove(f)
    except Exception:
        pass

img_files = glob.glob(os.path.join(IMG_DIR, "*.jpg")) + glob.glob(os.path.join(IMG_DIR, "*.png"))
print(f"Starting Micro-Bubble & Yellow Leaf Free Detector for {len(img_files)} images...")

total_candidates = 0
processed_images = 0
images_with_bubbles = 0

clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
kernel_tophat = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))

for img_path in img_files:
    base_name = os.path.splitext(os.path.basename(img_path))[0]
    out_txt = os.path.join(CAND_DIR, base_name + ".txt")

    img = cv2.imread(img_path)
    if img is None:
        continue

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. CLAHE Contrast Enhancement for murky/dark water
    enhanced = clahe.apply(gray)

    # 2. Morphological Top-Hat Transform (isolates bright micro-bubbles on dark/murky water)
    tophat = cv2.morphologyEx(enhanced, cv2.MORPH_TOPHAT, kernel_tophat)

    # 3. Thresholding for micro-bubbles
    blur_th = cv2.GaussianBlur(tophat, (3, 3), 0)
    _, thresh = cv2.threshold(blur_th, 22, 255, cv2.THRESH_BINARY)

    # Mask outer container border (top, bottom, left, right)
    mask = np.ones((h, w), dtype=np.uint8) * 255
    mask[0:15, :] = 0
    mask[h-15:, :] = 0
    mask[:, 0:15] = 0
    mask[:, w-15:] = 0
    thresh = cv2.bitwise_and(thresh, thresh, mask=mask)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    candidates = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        bx, by, bw, bh = cv2.boundingRect(cnt)

        norm_bw = bw / float(w)
        norm_bh = bh / float(h)
        xc = (bx + bw / 2.0) / float(w)
        yc = (by + bh / 2.0) / float(h)

        # A. Micro-Bubble Area & Size Filter (15px to 4000px, max 14% width/height)
        if area < 15 or area > 4000 or norm_bw > 0.14 or norm_bh > 0.14:
            continue

        # B. Container Border Edge Guard
        if xc < 0.02 or xc > 0.98 or yc < 0.03 or yc > 0.97:
            continue

        # C. Yellow Leaf RGB Color Test (Leaf has strong yellow pigment: G > B + 25 and R > B + 25)
        roi_bgr = img[by:by+bh, bx:bx+bw]
        mean_b = np.mean(roi_bgr[:, :, 0])
        mean_g = np.mean(roi_bgr[:, :, 1])
        mean_r = np.mean(roi_bgr[:, :, 2])
        if (mean_g - mean_b > 25.0) and (mean_r - mean_b > 25.0):
            continue

        # D. Aspect Ratio Filter: 0.35 <= BW/BH <= 2.80 (Eliminates long vertical shadows & streaks)
        aspect_ratio = norm_bw / norm_bh
        if aspect_ratio < 0.35 or aspect_ratio > 2.80:
            continue

        # Compute confidence based on area & contrast
        conf = min(0.95, max(0.60, (area / 100.0) * 0.35 + 0.55))

        candidates.append((0, xc, yc, norm_bw, norm_bh, conf))

    # Keep top 4 micro-bubble candidates per image sorted by confidence
    candidates.sort(key=lambda c: c[5], reverse=True)
    top_candidates = candidates[:4]

    # Save to candidate file
    with open(out_txt, "w") as f:
        for c in top_candidates:
            f.write(f"{c[0]} {c[1]:.6f} {c[2]:.6f} {c[3]:.6f} {c[4]:.6f} {c[5]:.4f}\n")

    total_candidates += len(top_candidates)
    if len(top_candidates) > 0:
        images_with_bubbles += 1
    processed_images += 1

print(f"==================================================")
print(f"Micro-Bubble & Yellow Leaf Free Auto-Labeling Complete!")
print(f"Processed Images : {processed_images}")
print(f"Images with Bubble Candidates : {images_with_bubbles} / {processed_images}")
print(f"Total Candidates Kept : {total_candidates}")
print(f"Average Candidates per Image : {total_candidates / max(1, processed_images):.2f}")
print(f"==================================================")
