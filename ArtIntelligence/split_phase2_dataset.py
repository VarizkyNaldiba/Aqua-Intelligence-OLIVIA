import os
import glob
import shutil
import json

# ==============================================================================
# PHASE 2 — CONTIGUOUS SEQUENTIAL DATASET SPLIT & DATA.YAML GENERATOR
# ==============================================================================

DATASETS_DIR = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\datasets"
SRC_DIR = os.path.join(DATASETS_DIR, "dataset-1500", "catfishcare_dataset_1787243240")
DEST_DIR = os.path.join(DATASETS_DIR, "catfishcare_surface_activity_final")
STATE_FILE = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\ArtIntelligence\human_review_state.json"

def run_split():
    state_reviews = {}
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            state_reviews = json.load(f).get("reviews", {})

    if os.path.exists(DEST_DIR):
        shutil.rmtree(DEST_DIR, ignore_errors=True)

    for split in ["train", "val", "test"]:
        os.makedirs(os.path.join(DEST_DIR, split, "images"), exist_ok=True)
        os.makedirs(os.path.join(DEST_DIR, split, "labels"), exist_ok=True)

    img_files = sorted(glob.glob(os.path.join(SRC_DIR, "images", "*.jpg")) + glob.glob(os.path.join(SRC_DIR, "images", "*.png")))
    total_files = len(img_files)

    # 75% Train, 12.5% Val, 12.5% Test
    train_idx = int(total_files * 0.75)
    val_idx = int(total_files * 0.875)

    train_files = img_files[:train_idx]
    val_files = img_files[train_idx:val_idx]
    test_files = img_files[val_idx:]

    print(f"=== PHASE 2: DATASET SPLIT ===")
    print(f"Total Images : {total_files}")
    print(f"Train (75%)  : {len(train_files)} | Val (12.5%): {len(val_files)} | Test (12.5%): {len(test_files)}")

    cand_dir = os.path.join(SRC_DIR, "auto_labeled_candidates", "candidate_labels")
    lbl_dir = os.path.join(SRC_DIR, "labels")

    def process_files(files, split_name):
        for img_path in files:
            base_name = os.path.splitext(os.path.basename(img_path))[0]
            rel_path = f"dataset-1500/catfishcare_dataset_1787243240/images/{os.path.basename(img_path)}"
            
            dest_img = os.path.join(DEST_DIR, split_name, "images", os.path.basename(img_path))
            dest_lbl = os.path.join(DEST_DIR, split_name, "labels", base_name + ".txt")
            
            shutil.copy2(img_path, dest_img)
            
            bboxes = []
            if rel_path in state_reviews:
                info = state_reviews[rel_path]
                if info.get("action") == "APPROVED":
                    bboxes = info.get("bboxes", [])
            else:
                cand_txt = os.path.join(cand_dir, base_name + ".txt")
                lbl_txt = os.path.join(lbl_dir, base_name + ".txt")
                target_txt = cand_txt if os.path.exists(cand_txt) else (lbl_txt if os.path.exists(lbl_txt) else None)
                
                if target_txt and os.path.exists(target_txt):
                    with open(target_txt, "r") as f:
                        for l in f.readlines():
                            parts = l.strip().split()
                            if len(parts) >= 5:
                                xc, yc, bw, bh = map(float, parts[1:5])
                                bboxes.append({"xc": xc, "yc": yc, "bw": bw, "bh": bh})
            
            if len(bboxes) > 0:
                lines = [f"0 {b['xc']:.6f} {b['yc']:.6f} {b['bw']:.6f} {b['bh']:.6f}" for b in bboxes]
                with open(dest_lbl, "w") as f:
                    f.write("\n".join(lines))
            else:
                with open(dest_lbl, "w") as f:
                    f.write("")

    process_files(train_files, "train")
    process_files(val_files, "val")
    process_files(test_files, "test")

    yaml_content = f"""path: {DEST_DIR}
train: train/images
val: val/images
test: test/images

names:
  0: surface_activity
"""
    with open(os.path.join(DEST_DIR, "data.yaml"), "w") as f:
        f.write(yaml_content)

    print(f"data.yaml created at {os.path.join(DEST_DIR, 'data.yaml')}")

if __name__ == "__main__":
    run_split()
