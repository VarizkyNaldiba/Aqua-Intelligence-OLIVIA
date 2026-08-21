import os
import sys
import time
import json
import requests
import cv2
import numpy as np
from ultralytics import YOLO

# Configuration
ONNX_WEIGHTS = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\runs\catfishcare_yolo11n_surface_activity\weights\best.onnx"
PT_WEIGHTS = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\runs\catfishcare_yolo11n_surface_activity\weights\best.pt"
LARAVEL_API_URL = "http://127.0.0.1:8000/api/sfr/update"

CONFIDENCE_THRESHOLD = 0.20
KOLAM_ID = 1

print("==================================================")
print("   CatfishCare Computer Vision Production Daemon  ")
print("==================================================")

# Determine model weights format
if os.path.exists(ONNX_WEIGHTS):
    model_path = ONNX_WEIGHTS
    print(f"Loading ONNX Model: {ONNX_WEIGHTS}")
elif os.path.exists(PT_WEIGHTS):
    model_path = PT_WEIGHTS
    print(f"Loading PyTorch Model: {PT_WEIGHTS}")
else:
    print("ERROR: Model weights file not found!")
    sys.exit(1)

model = YOLO(model_path)
print(f"Confidence Threshold : {CONFIDENCE_THRESHOLD}")
print(f"Target Laravel API   : {LARAVEL_API_URL}")
print("==================================================")

def compute_sfr_union_area(boxes_xyxy, img_w=640, img_h=360):
    if len(boxes_xyxy) == 0:
        return 0, 0.0
        
    mask = np.zeros((img_h, img_w), dtype=np.uint8)
    for box in boxes_xyxy:
        x1, y1, x2, y2 = map(int, box)
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img_w, x2), min(img_h, y2)
        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
        
    union_pixels = np.count_nonzero(mask)
    total_roi_pixels = img_w * img_h
    sfr_percent = (union_pixels / float(total_roi_pixels)) * 100.0
    return union_pixels, sfr_percent

def start_cv_pipeline(source=0):
    """
    Continuous 10-second sampling loop sending 1-minute rolling average SFR to Laravel.
    """
    cap = cv2.VideoCapture(source)
    sfr_buffer = []
    
    print("\nStarting Live Camera / Video Stream Pipeline (Press Ctrl+C to stop)...")
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                # Loop back video stream if offline sample video
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
                
            frame_resized = cv2.resize(frame, (640, 360))
            
            # Predict surface activity using optimized YOLO model
            results = model.predict(frame_resized, conf=CONFIDENCE_THRESHOLD, device="cpu", verbose=False)[0]
            
            boxes_xyxy = []
            if results.boxes is not None and len(results.boxes) > 0:
                for b in results.boxes:
                    boxes_xyxy.append(b.xyxy[0].cpu().numpy())
                    
            union_px, sfr_frame = compute_sfr_union_area(boxes_xyxy, 640, 360)
            sfr_buffer.append(sfr_frame)
            
            if len(sfr_buffer) > 6:
                sfr_buffer.pop(0)
                
            sfr_1min_avg = float(np.mean(sfr_buffer))
            
            print(f"[{time.strftime('%H:%M:%S')}] Detections: {len(boxes_xyxy)} | SFR Frame: {sfr_frame:.3f}% | 1-Min Rolling SFR: {sfr_1min_avg:.3f}%")
            
            # POST to Laravel API
            try:
                payload = {
                    "kolam_id": KOLAM_ID,
                    "sfr": round(sfr_1min_avg / 100.0, 4), # Ratio 0.0 - 1.0
                    "sfr_percent": round(sfr_1min_avg, 2),
                    "surface_fish": len(boxes_xyxy),
                    "total_fish": 15
                }
                res = requests.post(LARAVEL_API_URL, json=payload, timeout=3)
                if res.status_code == 200:
                    print(" -> Sent to Laravel API: Success")
            except Exception as e:
                print(f" -> Laravel API Connection Notice: {e}")
                
            # Sleep 10 seconds between capture frames (6 frames per minute)
            time.sleep(10)
            
    except KeyboardInterrupt:
        print("\nStopping CV Service Daemon...")
    finally:
        cap.release()

if __name__ == "__main__":
    start_cv_pipeline()
