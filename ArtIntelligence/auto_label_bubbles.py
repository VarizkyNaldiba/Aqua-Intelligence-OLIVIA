import os
import glob
import cv2
import json
import numpy as np

def run_auto_labeling(dataset_dir, output_dir=None, conf_high=0.75, conf_med=0.45):
    """
    Auto-labeling tool for surface activity/bubble detection in CatfishCare datasets.
    Generates candidate labels and preview images categorized by confidence levels:
    - High Confidence (>= 0.75)
    - Medium Confidence (0.45 <= conf < 0.75)
    - Low Confidence (< 0.45)
    """
    if output_dir is None:
        output_dir = os.path.join(dataset_dir, "auto_labeled_candidates")

    cand_labels_dir = os.path.join(output_dir, "candidate_labels")
    previews_dir = os.path.join(output_dir, "previews")
    
    os.makedirs(cand_labels_dir, exist_ok=True)
    os.makedirs(previews_dir, exist_ok=True)
    
    images_dir = os.path.join(dataset_dir, "images")
    img_files = glob.glob(os.path.join(images_dir, "*.jpg")) + glob.glob(os.path.join(images_dir, "*.png"))
    
    print(f"[Auto-Labeler] Processing {len(img_files)} images from {dataset_dir}...")
    
    summary = {
        "total_images": len(img_files),
        "high_conf_count": 0,
        "med_conf_count": 0,
        "low_conf_count": 0,
        "candidates_generated": 0
    }
    
    for img_path in img_files:
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        img = cv2.imread(img_path)
        if img is None:
            continue
            
        h, w = img.shape[:2]
        
        # Enhanced Baseline Bubble & Ripple Cluster Detector (Strict Geometry & Contrast Guard)
        # Exclude top wall region (Y < 50px)
        roi_mask = np.ones((h, w), dtype=np.uint8)
        roi_mask[:50, :] = 0 # Mask top 50px (pond wall border)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Adaptive contrast thresholding for white bubble spots
        thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                       cv2.THRESH_BINARY, 19, -8)
        thresh = cv2.bitwise_and(thresh, thresh, mask=roi_mask)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        cand_lines = []
        preview_img = img.copy()
        
        # Draw ROI Boundary on preview (blue line)
        cv2.line(preview_img, (0, 50), (w, 50), (255, 100, 0), 1)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Tighten area bounds for realistic bubble clusters (30px^2 to 900px^2)
            if 30 <= area <= 900:
                bx, by, bw, bh = cv2.boundingRect(cnt)
                
                # Exclude top wall
                if by < 50:
                    continue

                # Filter out long horizontal streaks (wall glare/light reflections) via Aspect Ratio
                aspect_ratio = float(bw) / float(bh) if bh > 0 else 0
                if aspect_ratio < 0.4 or aspect_ratio > 2.5:
                    continue # Ignore non-circular streaks/glare

                perimeter = cv2.arcLength(cnt, True)
                circularity = (4 * np.pi * area) / (perimeter ** 2) if perimeter > 0 else 0
                
                # Enforce minimum circularity for bubbles & round ripples (>= 0.45)
                if circularity < 0.45:
                    continue

                # Calculate normalized YOLO format
                x_center = (bx + bw / 2.0) / w
                y_center = (by + bh / 2.0) / h
                norm_w = bw / float(w)
                norm_h = bh / float(h)
                
                conf = float(np.clip(0.5 + 0.45 * circularity, 0.45, 0.95))
                
                # Class 0: surface_activity / bubble cluster
                cls_id = 0
                cand_lines.append(f"{cls_id} {x_center:.6f} {y_center:.6f} {norm_w:.6f} {norm_h:.6f} {conf:.4f}")
                
                if conf >= 0.75:
                    color = (0, 255, 0) # Green for High
                    summary["high_conf_count"] += 1
                elif conf >= 0.45:
                    color = (0, 255, 255) # Yellow for Medium
                    summary["med_conf_count"] += 1
                else:
                    color = (0, 0, 255) # Red for Low
                    summary["low_conf_count"] += 1
                    
                cv2.rectangle(preview_img, (bx, by), (bx + bw, by + bh), color, 2)
                cv2.putText(preview_img, f"surface_act {conf:.2f}", (bx, max(15, by - 5)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                            
        # Save candidate txt
        out_txt_path = os.path.join(cand_labels_dir, base_name + ".txt")
        with open(out_txt_path, "w") as f:
            f.write("\n".join(cand_lines))
            
        # Save preview image
        out_prev_path = os.path.join(previews_dir, base_name + "_preview.jpg")
        cv2.imwrite(out_prev_path, preview_img)
        summary["candidates_generated"] += len(cand_lines)
        
    print(f"[Auto-Labeler] Finished! Generated {summary['candidates_generated']} candidate bboxes across {summary['total_images']} images.")
    print(f"Summary: High={summary['high_conf_count']}, Med={summary['med_conf_count']}, Low={summary['low_conf_count']}\n")
    return summary

if __name__ == "__main__":
    base_datasets_dir = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA\datasets"
    folders = [os.path.join(base_datasets_dir, f) for f in os.listdir(base_datasets_dir) if f.startswith("catfishcare_dataset_")]
    for folder in folders:
        run_auto_labeling(folder)
