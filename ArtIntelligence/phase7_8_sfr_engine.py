import os
import glob
import numpy as np
import cv2
from ultralytics import YOLO

# ==============================================================================
# PHASE 7 & 8 — SURFACE ACTIVITY RATIO (SFR) UNION AREA ENGINE SCRIPT
# ==============================================================================

WEIGHTS_PATH = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\runs\catfishcare_yolo11n_surface_activity\weights\best.pt"
TEST_IMG_DIR = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\datasets\catfishcare_surface_activity_final\test\images"

def run_sfr_engine():
    print("=== PHASE 7 & 8: SFR UNION AREA CALCULATION & 6-FRAME SIMULATION ===")
    model = YOLO(WEIGHTS_PATH)
    img_files = sorted(glob.glob(os.path.join(TEST_IMG_DIR, "*.jpg")) + glob.glob(os.path.join(TEST_IMG_DIR, "*.png")))[:12]

    frame_results = []
    for idx, img_path in enumerate(img_files):
        results = model.predict(img_path, conf=0.20, device="cpu", verbose=False)[0]
        boxes = []
        mask = np.zeros((360, 640), dtype=np.uint8)
        
        if results.boxes is not None and len(results.boxes) > 0:
            for b in results.boxes:
                xyxy = b.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = map(int, xyxy)
                cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
                boxes.append((x1, y1, x2, y2))
                
        union_pixel_area = np.count_nonzero(mask)
        sfr_frame = (union_pixel_area / float(640 * 360)) * 100.0
        frame_results.append(sfr_frame)
        print(f"Frame {idx+1:02d} ({os.path.basename(img_path)[:20]}..): {len(boxes)} bboxes | Union Pixels: {union_pixel_area}px | SFR_frame: {sfr_frame:.3f}%")

    print(f"\nMinute 1 (Frames 1-6)  Average SFR : {np.mean(frame_results[:6]):.4f}%")
    print(f"Minute 2 (Frames 7-12) Average SFR : {np.mean(frame_results[6:12]):.4f}%")

if __name__ == "__main__":
    run_sfr_engine()
