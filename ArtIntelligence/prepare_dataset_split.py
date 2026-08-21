import os
import shutil
import glob

base_datasets_dir = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\datasets"
target_dataset_dir = os.path.join(base_datasets_dir, "catfishcare_surface_activity")

# Clean or create target structure
for split in ["train", "val", "test"]:
    os.makedirs(os.path.join(target_dataset_dir, split, "images"), exist_ok=True)
    os.makedirs(os.path.join(target_dataset_dir, split, "labels"), exist_ok=True)

# Create data.yaml
data_yaml_content = f"""path: {target_dataset_dir}
train: train/images
val: val/images
test: test/images

names:
  0: surface_activity
"""

with open(os.path.join(target_dataset_dir, "data.yaml"), "w") as f:
    f.write(data_yaml_content)

print(f"Created data.yaml and dataset directory at {target_dataset_dir}")

# Folder allocation to prevent sequence data leakage
folder_splits = {
    "catfishcare_dataset_1787213105": "train", # ~11,706 images (81.2%)
    "catfishcare_dataset_1787196851": "val",   # ~1,523 images (10.6%)
    "catfishcare_dataset_1787199872": "test"   # ~1,178 images (8.2%)
}

stats = {"train": 0, "val": 0, "test": 0}

for folder, split in folder_splits.items():
    src_folder = os.path.join(base_datasets_dir, folder)
    img_dir = os.path.join(src_folder, "images")
    lbl_dir = os.path.join(src_folder, "labels")
    
    img_files = glob.glob(os.path.join(img_dir, "*.jpg")) + glob.glob(os.path.join(img_dir, "*.png"))
    
    dest_img_dir = os.path.join(target_dataset_dir, split, "images")
    dest_lbl_dir = os.path.join(target_dataset_dir, split, "labels")
    
    print(f"Linking/Copying {len(img_files)} images from {folder} to {split} split...")
    
    for img_path in img_files:
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        lbl_path = os.path.join(lbl_dir, base_name + ".txt")
        
        target_img_path = os.path.join(dest_img_dir, os.path.basename(img_path))
        target_lbl_path = os.path.join(dest_lbl_dir, base_name + ".txt")
        
        shutil.copy2(img_path, target_img_path)
        
        # Copy existing ground truth label if exists, converting class 1 to 0 (surface_activity)
        if os.path.exists(lbl_path):
            with open(lbl_path, 'r') as f_in:
                lines = [l.strip() for l in f_in.readlines() if l.strip()]
            new_lines = []
            for l in lines:
                parts = l.split()
                if len(parts) >= 5:
                    parts[0] = "0" # Class 0: surface_activity
                    new_lines.append(" ".join(parts[:5]))
            with open(target_lbl_path, 'w') as f_out:
                f_out.write("\n".join(new_lines))
        else:
            with open(target_lbl_path, 'w') as f_out:
                f_out.write("")
                
        stats[split] += 1

print("\n=== DATASET PREPARATION SUMMARY ===")
print(f"Train set images : {stats['train']}")
print(f"Val set images   : {stats['val']}")
print(f"Test set images  : {stats['test']}")
print(f"Total dataset    : {sum(stats.values())}")
