import os
import json
from ultralytics import YOLO

# ==============================================================================
# PHASE 6 — CONFIDENCE THRESHOLD BENCHMARK SCRIPT
# ==============================================================================

WEIGHTS_PATH = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\runs\catfishcare_yolo11n_surface_activity\weights\best.pt"
DATA_YAML = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\datasets\catfishcare_surface_activity_final\data.yaml"

def run_conf_benchmark():
    print("=== PHASE 6: CONFIDENCE THRESHOLD BENCHMARK ===")
    model = YOLO(WEIGHTS_PATH)
    thresholds = [0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.70]

    for conf in thresholds:
        metrics = model.val(data=DATA_YAML, split="test", imgsz=640, conf=conf, device="cpu", verbose=False)
        p = float(metrics.box.p[0]) if len(metrics.box.p) > 0 else 0.0
        r = float(metrics.box.r[0]) if len(metrics.box.r) > 0 else 0.0
        f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0.0
        map50 = float(metrics.box.map50)
        print(f"Conf: {conf:.2f} -> P: {p:.4f} | R: {r:.4f} | F1: {f1:.4f} | mAP50: {map50:.4f}")

if __name__ == "__main__":
    run_conf_benchmark()
