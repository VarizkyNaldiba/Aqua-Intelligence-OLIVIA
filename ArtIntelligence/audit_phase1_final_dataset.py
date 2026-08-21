import os
import glob
import numpy as np
import json

# ==============================================================================
# PHASE 1 — FINAL DATASET AUDIT SCRIPT
# ==============================================================================

TARGET_DIR = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\datasets\dataset-1500\catfishcare_dataset_1787243240"

def run_audit():
    img_files = sorted(glob.glob(os.path.join(TARGET_DIR, "images", "*.jpg")) + glob.glob(os.path.join(TARGET_DIR, "images", "*.png")))
    print(f"=== PHASE 1: FINAL DATASET AUDIT ===")
    print(f"Dataset Location : {TARGET_DIR}")
    print(f"Total Images     : {len(img_files)}")

    state_file = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\ArtIntelligence\human_review_state.json"
    state_reviews = {}
    if os.path.exists(state_file):
        with open(state_file, "r") as f:
            state_data = json.load(f)
            state_reviews = state_data.get("reviews", {})

    total_images = len(img_files)
    positive_images = 0
    negative_images = 0
    total_bboxes = 0
    areas, widths, heights = [], [], []

    cand_dir = os.path.join(TARGET_DIR, "auto_labeled_candidates", "candidate_labels")

    for img_path in img_files:
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        rel_path = f"dataset-1500/catfishcare_dataset_1787243240/images/{os.path.basename(img_path)}"
        
        bboxes = []
        if rel_path in state_reviews:
            info = state_reviews[rel_path]
            if info.get("action") == "APPROVED":
                bboxes = info.get("bboxes", [])
        else:
            cand_txt = os.path.join(cand_dir, base_name + ".txt")
            if os.path.exists(cand_txt):
                with open(cand_txt, "r") as f:
                    for line in f.readlines():
                        parts = line.strip().split()
                        if len(parts) >= 5:
                            xc, yc, bw, bh = map(float, parts[1:5])
                            bboxes.append({"xc": xc, "yc": yc, "bw": bw, "bh": bh})

        num_b = len(bboxes)
        total_bboxes += num_b
        if num_b > 0:
            positive_images += 1
            for b in bboxes:
                widths.append(b["bw"])
                heights.append(b["bh"])
                areas.append(b["bw"] * b["bh"])
        else:
            negative_images += 1

    print(f"Total Bounding Boxes : {total_bboxes}")
    print(f"Positive Images      : {positive_images} ({positive_images/total_images*100:.1f}%)")
    print(f"Negative Images      : {negative_images} ({negative_images/total_images*100:.1f}%)")
    print(f"Mean Area            : {np.mean(areas):.6f}")

if __name__ == "__main__":
    run_audit()
