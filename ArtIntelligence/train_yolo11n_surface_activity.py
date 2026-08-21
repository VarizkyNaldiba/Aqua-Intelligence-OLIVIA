import os
from ultralytics import YOLO

# ==============================================================================
# CatfishCare YOLO11n Fine-Tuning & Pretrained Model Training Script
# ==============================================================================

# 1. Dataset Configuration & Runs Directory
DATA_YAML = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\datasets\catfishcare_surface_activity_final\data.yaml"
RUNS_DIR = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\runs"

def main():
    print("==============================================================================")
    print("   CatfishCare YOLO11n Pretrained Fine-Tuning Pipeline (Surface Activity)    ")
    print("==============================================================================")
    print(f"Dataset YAML Path : {DATA_YAML}")
    print(f"Output Runs Dir   : {RUNS_DIR}")
    print("------------------------------------------------------------------------------")

    # 2. Load Official Pretrained Weights (COCO Pretrained Initialization)
    # yolo11n.pt downloads official Ultralytics YOLO11 Nano pretrained weights
    model = YOLO("yolo11n.pt")

    # 3. Fine-Tune Model on CatfishCare Dataset
    results = model.train(
        data=DATA_YAML,               # Path to dataset configuration data.yaml
        epochs=100,                    # Target maximum training epochs
        patience=15,                   # Early stopping patience if validation loss stops improving
        imgsz=640,                     # Training resolution (640x360 scaled to 640x640)
        batch=16,                      # Batch size (set to 8 or 16 for memory efficiency)
        workers=2,                     # DataLoader worker threads
        device="cpu",                  # Use 'cpu' or '0' for CUDA GPU
        project=RUNS_DIR,              # Destination folder for trained weights and logs
        name="catfishcare_yolo11n_surface_activity", # Experiment run folder name
        exist_ok=True,                 # Overwrite/continue existing run folder
        verbose=True,                  # Print per-epoch metrics table
        
        # Data Augmentations tailored for murky catfish pond water
        hsv_h=0.015,                   # Moderate HSV Hue jitter
        hsv_s=0.5,                     # Saturation jitter
        hsv_v=0.4,                     # Value/Brightness jitter for lighting changes
        degrees=10.0,                  # Slight image rotation
        translate=0.1,                 # Image translation/shifting
        scale=0.2,                     # Scale jitter
        fliplr=0.5                    # Horizontal flip augmentation
    )

    print("\n==============================================================================")
    print("   Fine-Tuning Completed Successfully!")
    print(f"   Best Weights Saved At: {os.path.join(RUNS_DIR, 'catfishcare_yolo11n_surface_activity', 'weights', 'best.pt')}")
    print("==============================================================================")

if __name__ == "__main__":
    main()
