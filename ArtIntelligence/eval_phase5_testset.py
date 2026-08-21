import os
import json
from ultralytics import YOLO

# ==============================================================================
# PHASE 5 — INDEPENDENT TEST SET EVALUATION SCRIPT
# ==============================================================================

WEIGHTS_PATH = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\runs\catfishcare_yolo11n_surface_activity\weights\best.pt"
DATA_YAML = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\datasets\catfishcare_surface_activity_final\data.yaml"

def run_evaluation():
    print("=== PHASE 5: INDEPENDENT TEST SET EVALUATION ===")
    model = YOLO(WEIGHTS_PATH)
    metrics = model.val(data=DATA_YAML, split="test", imgsz=640, device="cpu", verbose=True)

    p = float(metrics.box.p[0]) if len(metrics.box.p) > 0 else 0.0
    r = float(metrics.box.r[0]) if len(metrics.box.r) > 0 else 0.0
    f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0.0
    map50 = float(metrics.box.map50)
    map50_95 = float(metrics.box.map)

    print(f"\n--- TEST SET METRICS ---")
    print(f"Precision (P) : {p:.4f}")
    print(f"Recall (R)    : {r:.4f}")
    print(f"F1 Score      : {f1:.4f}")
    print(f"mAP@50        : {map50:.4f}")
    print(f"mAP@50-95     : {map50_95:.4f}")

if __name__ == "__main__":
    run_evaluation()
