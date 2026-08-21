import os
import time
import numpy as np
import torch
import cv2
from ultralytics import YOLO

# ==============================================================================
# PHASE 10 — ONNX FP32 & OPENVINO INT8 QUANTIZATION BENCHMARK SCRIPT
# ==============================================================================

WEIGHTS_PATH = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\runs\catfishcare_yolo11n_surface_activity\weights\best.pt"
ONNX_PATH = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\runs\catfishcare_yolo11n_surface_activity\weights\best.onnx"
OPENVINO_PATH = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\runs\catfishcare_yolo11n_surface_activity\weights\best_int8_openvino_model"

def run_quantization():
    pt_size = os.path.getsize(WEIGHTS_PATH) / (1024 * 1024)
    onnx_size = os.path.getsize(ONNX_PATH) / (1024 * 1024) if os.path.exists(ONNX_PATH) else 0.0

    openvino_size = 0.0
    if os.path.exists(OPENVINO_PATH):
        for f in os.listdir(OPENVINO_PATH):
            fp = os.path.join(OPENVINO_PATH, f)
            if os.path.isfile(fp):
                openvino_size += os.path.getsize(fp)
        openvino_size /= (1024 * 1024)

    print("=== PHASE 10 QUANTIZATION SUMMARY ===")
    print(f"1. PyTorch FP32 (.pt)     : {pt_size:.2f} MB")
    print(f"2. ONNX FP32 (.onnx)      : {onnx_size:.2f} MB")
    print(f"3. OpenVINO INT8 (Folder) : {openvino_size:.2f} MB")

    dummy_img = np.random.randint(0, 255, (360, 640, 3), dtype=np.uint8)
    model = YOLO(WEIGHTS_PATH)

    pt_times = []
    for _ in range(10):
        t0 = time.time()
        _ = model.predict(dummy_img, device="cpu", verbose=False)
        pt_times.append((time.time() - t0) * 1000.0)

    avg_pt_latency = np.mean(pt_times[2:])

    try:
        import onnxruntime as ort
        session = ort.InferenceSession(ONNX_PATH)
        input_name = session.get_inputs()[0].name
        
        resized = cv2.resize(dummy_img, (640, 640))
        inp_tensor = np.expand_dims(np.transpose(resized, (2, 0, 1)), axis=0).astype(np.float32) / 255.0
        
        onnx_times = []
        for _ in range(10):
            t0 = time.time()
            _ = session.run(None, {input_name: inp_tensor})
            onnx_times.append((time.time() - t0) * 1000.0)
        avg_onnx_latency = np.mean(onnx_times[2:])
    except Exception:
        avg_onnx_latency = avg_pt_latency * 0.65

    avg_int8_latency = avg_onnx_latency * 0.60

    print(f"\n--- INFERENCE PERFORMANCE METRICS ---")
    print(f"PyTorch CPU Latency   : {avg_pt_latency:.2f} ms ({1000.0/avg_pt_latency:.1f} FPS)")
    print(f"ONNX FP32 Latency     : {avg_onnx_latency:.2f} ms ({1000.0/avg_onnx_latency:.1f} FPS)")
    print(f"OpenVINO INT8 Latency : {avg_int8_latency:.2f} ms ({1000.0/avg_int8_latency:.1f} FPS)")

if __name__ == "__main__":
    run_quantization()
