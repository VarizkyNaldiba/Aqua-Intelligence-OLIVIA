import os
import glob

BASE_DIR = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA"
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")

folders = [f for f in os.listdir(DATASETS_DIR) if f.startswith("catfishcare_dataset_")]

purged_count = 0
kept_count = 0

print("[Purge Script] Cleaning spurious candidates (top-wall Y < 50px, non-circular glare)...")

for folder in folders:
    cand_dir = os.path.join(DATASETS_DIR, folder, "auto_labeled_candidates", "candidate_labels")
    if not os.path.exists(cand_dir):
        continue
        
    cand_files = glob.glob(os.path.join(cand_dir, "*.txt"))
    for txt_file in cand_files:
        with open(txt_file, 'r') as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]
            
        clean_lines = []
        for line in lines:
            parts = line.split()
            if len(parts) >= 5:
                xc, yc, bw, bh = map(float, parts[1:5])
                
                # Check top wall (yc * 360 < 50)
                y_pixel = yc * 360.0
                h_pixel = bh * 360.0
                w_pixel = bw * 640.0
                
                if y_pixel < 50.0:
                    purged_count += 1
                    continue # Purge top wall glare
                    
                aspect_ratio = w_pixel / h_pixel if h_pixel > 0 else 0
                if aspect_ratio < 0.4 or aspect_ratio > 2.5:
                    purged_count += 1
                    continue # Purge long horizontal glare streaks
                    
                area_pixel = w_pixel * h_pixel
                if area_pixel < 30.0 or area_pixel > 900.0:
                    purged_count += 1
                    continue # Purge out of bound areas
                    
                clean_lines.append(" ".join(parts))
                kept_count += 1
                
        with open(txt_file, 'w') as f:
            f.write("\n".join(clean_lines))

print(f"[Purge Script] Done! Purged {purged_count} invalid candidates. Kept {kept_count} clean surface_activity candidates.")
