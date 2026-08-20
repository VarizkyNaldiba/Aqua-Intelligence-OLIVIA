import os
import glob
import json
import random
import numpy as np
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse
from PIL import Image

BASE_DIR = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA"
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
REVIEWED_DIR = os.path.join(DATASETS_DIR, "catfishcare_surface_activity_reviewed")

# Ensure reviewed dataset structure exists
for split in ["train", "val", "test"]:
    os.makedirs(os.path.join(REVIEWED_DIR, split, "images"), exist_ok=True)
    os.makedirs(os.path.join(REVIEWED_DIR, split, "labels"), exist_ok=True)

# Write data.yaml for reviewed dataset
data_yaml_path = os.path.join(REVIEWED_DIR, "data.yaml")
with open(data_yaml_path, "w") as f:
    f.write(f"path: {REVIEWED_DIR}\ntrain: train/images\nval: val/images\ntest: test/images\n\nnames:\n  0: surface_activity\n")

REVIEW_STATE_FILE = os.path.join(BASE_DIR, "ArtIntelligence", "review_state.json")

def load_review_state():
    if os.path.exists(REVIEW_STATE_FILE):
        with open(REVIEW_STATE_FILE, "r") as f:
            return json.load(f)
    return {"reviews": {}, "stats": {"keep": 0, "edit": 0, "reject": 0, "add": 0}}

def save_review_state(state):
    with open(REVIEW_STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

class ReviewRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        if path == "/" or path == "/index.html":
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(HTML_TEMPLATE.encode("utf-8"))
            return

        elif path == "/api/samples":
            batch_type = query.get("batch", ["high"])[0]
            samples = self.get_batch_samples(batch_type)
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(samples).encode("utf-8"))
            return

        elif path == "/api/stats":
            state = load_review_state()
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(state["stats"]).encode("utf-8"))
            return

        elif path.startswith("/image/"):
            # Serve local image
            rel_path = urllib.parse.unquote(path[7:])
            full_img_path = os.path.join(DATASETS_DIR, rel_path)
            if os.path.exists(full_img_path):
                self.send_response(200)
                self.send_header("Content-type", "image/jpeg")
                self.end_headers()
                with open(full_img_path, "rb") as img_f:
                    self.wfile.write(img_f.read())
            else:
                self.send_error(404, "Image not found")
            return

        super().do_GET()

    def do_POST(self):
        if self.path == "/api/review":
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data.decode("utf-8"))
            
            img_rel_path = payload.get("image_path")
            action = payload.get("action") # KEEP, EDIT, REJECT, ADD
            bboxes = payload.get("bboxes", [])
            split = payload.get("split", "train")

            state = load_review_state()
            state["reviews"][img_rel_path] = {
                "action": action,
                "bboxes": bboxes,
                "split": split
            }
            state["stats"][action.lower()] = state["stats"].get(action.lower(), 0) + 1
            save_review_state(state)

            # Write to reviewed ground-truth dataset
            base_name = os.path.splitext(os.path.basename(img_rel_path))[0]
            dest_img_path = os.path.join(REVIEWED_DIR, split, "images", os.path.basename(img_rel_path))
            dest_lbl_path = os.path.join(REVIEWED_DIR, split, "labels", base_name + ".txt")

            src_img_path = os.path.join(DATASETS_DIR, img_rel_path)
            if os.path.exists(src_img_path) and not os.path.exists(dest_img_path):
                import shutil
                shutil.copy2(src_img_path, dest_img_path)

            if action == "REJECT":
                # Pure negative background sample (empty txt)
                with open(dest_lbl_path, "w") as f:
                    f.write("")
            else:
                lines = []
                for box in bboxes:
                    cls_id = 0 # surface_activity
                    xc, yc, bw, bh = box["xc"], box["yc"], box["bw"], box["bh"]
                    lines.append(f"{cls_id} {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}")
                with open(dest_lbl_path, "w") as f:
                    f.write("\n".join(lines))

            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "stats": state["stats"]}).encode("utf-8"))
            return

    def get_batch_samples(self, batch_type):
        folders = [f for f in os.listdir(DATASETS_DIR) if f.startswith("catfishcare_dataset_")]
        samples = []

        folder_splits = {
            "catfishcare_dataset_1787213105": "train",
            "catfishcare_dataset_1787196851": "val",
            "catfishcare_dataset_1787199872": "test"
        }

        state = load_review_state()

        for folder in folders:
            img_dir = os.path.join(DATASETS_DIR, folder, "images")
            cand_dir = os.path.join(DATASETS_DIR, folder, "auto_labeled_candidates", "candidate_labels")
            split = folder_splits.get(folder, "train")

            img_files = glob.glob(os.path.join(img_dir, "*.jpg")) + glob.glob(os.path.join(img_dir, "*.png"))

            for img_path in img_files:
                rel_path = os.path.relpath(img_path, DATASETS_DIR)
                base_name = os.path.splitext(os.path.basename(img_path))[0]
                cand_txt = os.path.join(cand_dir, base_name + ".txt")

                bboxes = []
                max_conf = 0.0

                if os.path.exists(cand_txt):
                    with open(cand_txt, "r") as f:
                        for l in f.readlines():
                            parts = l.strip().split()
                            if len(parts) >= 6:
                                xc, yc, bw, bh, conf = map(float, parts[1:6])
                                bboxes.append({"xc": xc, "yc": yc, "bw": bw, "bh": bh, "conf": conf})
                                if conf > max_conf:
                                    max_conf = conf

                # Filter by batch type
                is_match = False
                if batch_type == "high" and max_conf >= 0.75:
                    is_match = True
                elif batch_type == "med" and 0.45 <= max_conf < 0.75:
                    is_match = True
                elif batch_type == "low" and 0.0 < max_conf < 0.45:
                    is_match = True
                elif batch_type == "negative" and len(bboxes) == 0:
                    is_match = True
                elif batch_type == "temporal":
                    is_match = True

                if is_match:
                    reviewed_status = state["reviews"].get(rel_path, {}).get("action", "PENDING")
                    samples.append({
                        "rel_path": rel_path,
                        "filename": os.path.basename(img_path),
                        "folder": folder,
                        "split": split,
                        "max_conf": max_conf,
                        "bboxes": bboxes,
                        "status": reviewed_status
                    })

        random.seed(42)
        if batch_type == "high":
            samples = samples[:200]
        elif batch_type == "med":
            samples = samples[:300]
        elif batch_type == "low":
            samples = samples[:100]
        elif batch_type == "negative":
            samples = samples[:100]
        elif batch_type == "temporal":
            samples = samples[:100]

        return samples

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>CatfishCare Surface Activity — Human Review Tool</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #38bdf8; text-align: center; margin-bottom: 5px; }
        .subtitle { text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
        .controls-bar { display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 15px 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #334155; }
        .btn-group { display: flex; gap: 10px; }
        button { background: #3b82f6; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        button:hover { background: #2563eb; }
        button.active { background: #0284c7; ring: 2px #38bdf8; }
        .btn-keep { background: #10b981; } .btn-keep:hover { background: #059669; }
        .btn-edit { background: #f59e0b; } .btn-edit:hover { background: #d97706; }
        .btn-reject { background: #ef4444; } .btn-reject:hover { background: #dc2626; }
        .btn-add { background: #8b5cf6; } .btn-add:hover { background: #7c3aed; }
        .viewer-card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; display: flex; flex-direction: column; align-items: center; }
        .canvas-wrapper { position: relative; display: inline-block; border-radius: 8px; overflow: hidden; border: 2px solid #475569; }
        canvas { display: block; }
        .stats-panel { display: flex; gap: 20px; background: #0f172a; padding: 10px 20px; border-radius: 8px; margin-top: 15px; font-size: 14px; }
        .stat-item span { font-weight: bold; color: #38bdf8; }
        .action-bar { margin-top: 20px; display: flex; gap: 15px; }
    </style>
</head>
<body>
<div class="container">
    <h1>🐟 CatfishCare Surface Activity Review Tool</h1>
    <div class="subtitle">Human Review & Ground Truth Verification Interface (No Overwrite Guarantee)</div>

    <div class="controls-bar">
        <div class="btn-group">
            <button onclick="loadBatch('high')" id="btn-high">Batch A (High Conf &ge; 0.75)</button>
            <button onclick="loadBatch('med')" id="btn-med">Batch B (Med Conf 0.45-0.74)</button>
            <button onclick="loadBatch('low')" id="btn-low">Batch C (Low Conf &lt; 0.45)</button>
            <button onclick="loadBatch('negative')" id="btn-negative">Batch D (Negative Background)</button>
        </div>
        <div id="counter-badge" style="color: #cbd5e1; font-weight: 600;">Sample: 0 / 0</div>
    </div>

    <div class="viewer-card">
        <div class="canvas-wrapper">
            <canvas id="reviewCanvas" width="640" height="360"></canvas>
        </div>

        <div class="stats-panel">
            <div class="stat-item">KEEP: <span id="stat-keep">0</span></div>
            <div class="stat-item">EDIT: <span id="stat-edit">0</span></div>
            <div class="stat-item">REJECT (FP/Noise): <span id="stat-reject">0</span></div>
            <div class="stat-item">ADD (FN): <span id="stat-add">0</span></div>
        </div>

        <div class="action-bar">
            <button class="btn-keep" onclick="submitReview('KEEP')">✓ KEEP (Accept BBox)</button>
            <button class="btn-reject" onclick="submitReview('REJECT')">✕ REJECT (False Positive/Noise)</button>
            <button class="btn-edit" onclick="submitReview('EDIT')">✎ EDIT BBox</button>
            <button onclick="nextSample()">&rarr; Next Sample</button>
        </div>
    </div>
</div>

<script>
    let samples = [];
    let currentIndex = 0;
    let currentImage = new Image();

    function loadBatch(type) {
        fetch('/api/samples?batch=' + type)
            .then(res => res.json())
            .then(data => {
                samples = data;
                currentIndex = 0;
                renderCurrent();
            });
    }

    function renderCurrent() {
        if (samples.length === 0) return;
        let item = samples[currentIndex];
        document.getElementById('counter-badge').innerText = `Sample: ${currentIndex + 1} / ${samples.length} | Status: ${item.status}`;
        
        currentImage.onload = function() {
            let canvas = document.getElementById('reviewCanvas');
            let ctx = canvas.getContext('2d');
            ctx.drawImage(currentImage, 0, 0, 640, 360);

            // Draw candidates
            item.bboxes.forEach(b => {
                let w = 640, h = 360;
                let bw = b.bw * w, bh = b.bh * h;
                let bx = (b.xc * w) - (bw / 2);
                let by = (b.yc * h) - (bh / 2);

                ctx.strokeStyle = b.conf >= 0.75 ? '#10b981' : (b.conf >= 0.45 ? '#f59e0b' : '#ef4444');
                ctx.lineWidth = 2;
                ctx.strokeRect(bx, by, bw, bh);

                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = "12px sans-serif";
                ctx.fillText(`surface_activity ${b.conf.toFixed(2)}`, bx, Math.max(15, by - 5));
            });
        };
        currentImage.src = '/image/' + item.rel_path;
    }

    function submitReview(action) {
        if (samples.length === 0) return;
        let item = samples[currentIndex];

        fetch('/api/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_path: item.rel_path,
                action: action,
                bboxes: item.bboxes,
                split: item.split
            })
        }).then(res => res.json()).then(res => {
            updateStats(res.stats);
            nextSample();
        });
    }

    function updateStats(stats) {
        if (!stats) return;
        document.getElementById('stat-keep').innerText = stats.keep || 0;
        document.getElementById('stat-edit').innerText = stats.edit || 0;
        document.getElementById('stat-reject').innerText = stats.reject || 0;
        document.getElementById('stat-add').innerText = stats.add || 0;
    }

    function nextSample() {
        if (currentIndex < samples.length - 1) {
            currentIndex++;
            renderCurrent();
        }
    }

    loadBatch('high');
    fetch('/api/stats').then(res => res.json()).then(updateStats);
</script>
</body>
</html>"""

def run_server(port=5050):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ReviewRequestHandler)
    print(f"CatfishCare Human Review Tool running on http://127.0.0.1:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
