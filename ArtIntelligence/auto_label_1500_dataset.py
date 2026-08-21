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
print(f"Starting High-Precision Auto-Labeling for {len(img_files)} images in dataset-1500...")

total_candidates = 0
processed_images = 0

for img_path in img_files:
    base_name = os.path.splitext(os.path.basename(img_path))[0]
    out_txt = os.path.join(CAND_DIR, base_name + ".txt")

    img = cv2.imread(img_path)
    if img is None:
        continue

    h, w = img.shape[:2]

    # Convert to Grayscale & LAB color space for glare vs bubble detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    # 1. Mask top wall border region (Y < 50px)
    mask_region = np.ones((h, w), dtype=np.uint8) * 255
    mask_region[0:50, :] = 0

    # 2. Adaptive Gaussian Thresholding for bubble clusters & water ripples
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 19, 3
    )

    # Apply top wall exclusion mask
    thresh = cv2.bitwise_and(thresh, thresh, mask=mask_region)

    # Morphological Close & Open to unite bubble clusters & remove speckle noise
    kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    kernel_med = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel_small)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel_med)

    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    candidates = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        
        # Area filter: Exclude tiny noise/speckles (< 120px) and huge static glare/reflections (> 12000px)
        if area < 120 or area > 12000:
            continue

        bx, by, bw, bh = cv2.boundingRect(cnt)
        if bw == 0 or bh == 0:
            continue

        # Top Y center guard (YC < 0.14 is top wall)
        yc = (by + bh / 2.0) / float(h)
        xc = (bx + bw / 2.0) / float(w)
        if yc < 0.14:
            continue

        # Aspect Ratio Filter: Exclude glare lines & long horizontal light streaks
        aspect_ratio = float(bw) / float(bh)
        if aspect_ratio < 0.40 or aspect_ratio > 2.40:
            continue

        # Circularity Filter: Exclude non-circular light streaks & hardware shadows
        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0:
            continue
        circularity = 4.0 * np.pi * area / (perimeter * perimeter)
        if circularity < 0.40:
            continue

        # Intensity Variance & Glare Filter: Exclude solid bright white glare without bubble texture
        roi_gray = gray[by:by+bh, bx:bx+bw]
        std_dev = np.std(roi_gray)
        mean_val = np.mean(roi_gray)

        # Pure white glare has high mean (> 235) and low std_dev (< 12) -> Skip
        if mean_val > 235 and std_dev < 12:
            continue

        # Compute candidate confidence
        norm_bw = bw / float(w)
        norm_bh = bh / float(h)
        conf = min(0.95, max(0.50, circularity * 0.70 + (std_dev / 50.0) * 0.30))

        candidates.append((0, xc, yc, norm_bw, norm_bh, conf))

    # Save candidates to file
    with open(out_txt, "w") as f:
        for c in candidates:
            f.write(f"{c[0]} {c[1]:.6f} {c[2]:.6f} {c[3]:.6f} {c[4]:.6f} {c[5]:.4f}\n")

    total_candidates += len(candidates)
    processed_images += 1

print(f"==================================================")
print(f"Auto-Labeling Complete for dataset-1500/catfishcare_dataset_1787243240!")
print(f"Processed Images : {processed_images}")
print(f"Total Candidates Generated : {total_candidates}")
print(f"Average Candidates per Image : {total_candidates / max(1, processed_images):.2f}")
print(f"==================================================")
