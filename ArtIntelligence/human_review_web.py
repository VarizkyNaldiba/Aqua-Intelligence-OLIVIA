import os
import glob
import json
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR = r"e:\lele dumbo\Aqua-Intelligence-OLIVIA"
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
REVIEWED_DIR = os.path.join(DATASETS_DIR, "catfishcare_surface_activity_reviewed")
STATE_FILE = os.path.join(BASE_DIR, "ArtIntelligence", "human_review_state.json")

# Ensure reviewed dataset directories exist
for split in ["train", "val", "test"]:
    os.makedirs(os.path.join(REVIEWED_DIR, split, "images"), exist_ok=True)
    os.makedirs(os.path.join(REVIEWED_DIR, split, "labels"), exist_ok=True)

# Ensure data.yaml exists
data_yaml_path = os.path.join(REVIEWED_DIR, "data.yaml")
with open(data_yaml_path, "w") as f:
    f.write(f"path: {REVIEWED_DIR}\ntrain: train/images\nval: val/images\ntest: test/images\n\nnames:\n  0: surface_activity\n")

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                state = json.load(f)
                # Normalize all review keys to POSIX slashes
                norm_reviews = {}
                for k, v in state.get("reviews", {}).items():
                    norm_reviews[k.replace("\\", "/")] = v
                state["reviews"] = norm_reviews
                return state
        except Exception:
            pass
    return {"reviews": {}, "stats": {"approved": 0, "rejected": 0, "edited": 0, "total_reviewed": 0}, "last_rel_path": ""}

def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    norm_reviews = {}
    for k, v in state.get("reviews", {}).items():
        norm_reviews[k.replace("\\", "/")] = v
    state["reviews"] = norm_reviews
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

ALL_DATASET_ITEMS = []

def init_dataset_cache():
    global ALL_DATASET_ITEMS
    target_folder = os.path.join(DATASETS_DIR, "dataset-1500", "catfishcare_dataset_1787243240")
    img_dir = os.path.join(target_folder, "images")
    cand_dir = os.path.join(target_folder, "auto_labeled_candidates", "candidate_labels")
    lbl_dir = os.path.join(target_folder, "labels")
    split = "train"

    state = load_state()
    items = []

    img_files = glob.glob(os.path.join(img_dir, "*.jpg")) + glob.glob(os.path.join(img_dir, "*.png"))

    for img_path in img_files:
        rel_path = os.path.relpath(img_path, DATASETS_DIR).replace("\\", "/")
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        cand_txt = os.path.join(cand_dir, base_name + ".txt")
        lbl_txt = os.path.join(lbl_dir, base_name + ".txt")

        bboxes = []
        max_conf = 0.0

        if os.path.exists(cand_txt):
            with open(cand_txt, "r") as f:
                for l in f.readlines():
                    parts = l.strip().split()
                    if len(parts) >= 5:
                        xc, yc, bw, bh = map(float, parts[1:5])
                        conf = float(parts[5]) if len(parts) >= 6 else 1.0
                        bboxes.append({"xc": xc, "yc": yc, "bw": bw, "bh": bh, "conf": conf})
                        if conf > max_conf:
                            max_conf = conf
        elif os.path.exists(lbl_txt):
            with open(lbl_txt, "r") as f:
                for l in f.readlines():
                    parts = l.strip().split()
                    if len(parts) >= 5:
                        xc, yc, bw, bh = map(float, parts[1:5])
                        conf = 1.0
                        bboxes.append({"xc": xc, "yc": yc, "bw": bw, "bh": bh, "conf": conf})
                        max_conf = 1.0

        rev_info = state["reviews"].get(rel_path, {})
        status = rev_info.get("action", "PENDING")
        if status != "PENDING" and "bboxes" in rev_info:
            bboxes = rev_info["bboxes"]

        items.append({
            "rel_path": rel_path,
            "filename": os.path.basename(img_path),
            "folder": "dataset-1500/catfishcare_dataset_1787243240",
            "split": split,
            "max_conf": max_conf,
            "bboxes": bboxes,
            "status": status,
            "reviewer": rev_info.get("reviewer", "Unknown")
        })

    ALL_DATASET_ITEMS = items

class HumanReviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ["/", "/index.html"]:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            self.end_headers()
            self.wfile.write(APP_HTML.encode("utf-8"))
            return

        elif path == "/api/list":
            batch = query.get("batch", ["all"])[0]
            status_filter = query.get("status", ["all"])[0]
            reviewer = query.get("reviewer", ["all"])[0]
            items = self.get_items(batch, status_filter, reviewer)
            state = load_state()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.end_headers()
            self.wfile.write(json.dumps({
                "items": items,
                "stats": state["stats"],
                "last_rel_path": state.get("last_rel_path", "")
            }).encode("utf-8"))
            return

        elif path.startswith("/img/"):
            rel_path = urllib.parse.unquote(path[5:])
            full_path = os.path.join(DATASETS_DIR, rel_path)
            if os.path.exists(full_path):
                self.send_response(200)
                self.send_header("Content-Type", "image/jpeg")
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()
                with open(full_path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "Image Not Found")
            return

        super().do_GET()

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        post_bytes = self.rfile.read(content_len)
        
        if self.path == "/api/save":
            payload = json.loads(post_bytes.decode("utf-8"))
            rel_path = payload.get("rel_path", "").replace("\\", "/")
            action = payload.get("action") # APPROVED, REJECTED, EDITED
            bboxes = payload.get("bboxes", [])
            split = payload.get("split", "train")
            reviewer = payload.get("reviewer", "Unknown")

            state = load_state()
            prev_action = state["reviews"].get(rel_path, {}).get("action")

            state["reviews"][rel_path] = {
                "action": action,
                "bboxes": bboxes,
                "split": split,
                "reviewer": reviewer
            }
            state["last_rel_path"] = rel_path

            # Update in-memory RAM cache instantly
            for item in ALL_DATASET_ITEMS:
                if item["rel_path"] == rel_path:
                    item["status"] = action
                    item["bboxes"] = bboxes
                    item["reviewer"] = reviewer
                    break

            # Update stats
            if prev_action != action:
                if prev_action:
                    state["stats"][prev_action.lower()] = max(0, state["stats"].get(prev_action.lower(), 0) - 1)
                else:
                    state["stats"]["total_reviewed"] += 1
                state["stats"][action.lower()] = state["stats"].get(action.lower(), 0) + 1

            save_state(state)

            # Copy image and label to ground truth dataset folder
            src_img = os.path.join(DATASETS_DIR, rel_path)
            base_name = os.path.splitext(os.path.basename(rel_path))[0]
            dest_img = os.path.join(REVIEWED_DIR, split, "images", os.path.basename(rel_path))
            dest_lbl = os.path.join(REVIEWED_DIR, split, "labels", base_name + ".txt")

            if os.path.exists(src_img):
                import shutil
                shutil.copy2(src_img, dest_img)

            if action == "REJECTED":
                # Save empty txt for negative background sample
                with open(dest_lbl, "w") as f:
                    f.write("")
            else:
                lines = [f"0 {b['xc']:.6f} {b['yc']:.6f} {b['bw']:.6f} {b['bh']:.6f}" for b in bboxes]
                with open(dest_lbl, "w") as f:
                    f.write("\n".join(lines))

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "stats": state["stats"]}).encode("utf-8"))
            return

        elif self.path == "/api/reset":
            state = {"reviews": {}, "stats": {"approved": 0, "rejected": 0, "edited": 0, "total_reviewed": 0}}
            save_state(state)
            init_dataset_cache() # Reset RAM cache
            if os.path.exists(REVIEWED_DIR):
                import shutil
                shutil.rmtree(REVIEWED_DIR, ignore_errors=True)
                for split in ["train", "val", "test"]:
                    os.makedirs(os.path.join(REVIEWED_DIR, split, "images"), exist_ok=True)
                    os.makedirs(os.path.join(REVIEWED_DIR, split, "labels"), exist_ok=True)
                with open(os.path.join(REVIEWED_DIR, "data.yaml"), "w") as f:
                    f.write(f"path: {REVIEWED_DIR}\ntrain: train/images\nval: val/images\ntest: test/images\n\nnames:\n  0: surface_activity\n")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "stats": state["stats"]}).encode("utf-8"))
            return

    def get_items(self, batch, status_filter="all", reviewer="all"):
        if len(ALL_DATASET_ITEMS) == 0:
            init_dataset_cache()
        all_raw = ALL_DATASET_ITEMS[:]

        # Partition dataset among 3 Team Members if requested (iir, variz, gopar)
        if reviewer.lower() in ["iir", "variz", "gopar"]:
            total = len(all_raw)
            chunk_size = (total + 2) // 3
            if reviewer.lower() == "iir":
                all_raw = all_raw[0:chunk_size]
            elif reviewer.lower() == "variz":
                all_raw = all_raw[chunk_size:chunk_size*2]
            elif reviewer.lower() == "gopar":
                all_raw = all_raw[chunk_size*2:]

        items = []
        for item in all_raw:
            status = item["status"]
            max_conf = item["max_conf"]

            # Status Filter Guard
            if status_filter != "all" and status.lower() != status_filter.lower():
                continue

            # Filter batch
            match = False
            if batch == "all":
                match = True
            elif batch == "high" and max_conf >= 0.75:
                match = True
            elif batch == "med" and 0.45 <= max_conf < 0.75:
                match = True
            elif batch == "negative" and len(item["bboxes"]) == 0:
                match = True
            elif batch == "pending" and status == "PENDING":
                match = True

            if match:
                items.append(item)

        return items

APP_HTML = """<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CatfishCare Ground-Truth Review Studio</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #090d16; color: #e2e8f0; height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
        header { background: #131c2e; border-bottom: 1px solid #1e293b; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
        h1 { font-size: 18px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
        .batch-selector { display: flex; gap: 8px; }
        .btn { background: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
        .btn:hover { background: #334155; color: #f8fafc; }
        .btn.active { background: #0284c7; color: white; border-color: #38bdf8; }
        .btn-approve { background: #059669; color: white; border: none; } .btn-approve:hover { background: #047857; }
        .btn-reject { background: #dc2626; color: white; border: none; } .btn-reject:hover { background: #b91c1c; }
        .btn-reset { background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b; } .btn-reset:hover { background: #991b1b; }

        .main-layout { display: flex; flex: 1; overflow: hidden; }
        .canvas-area { flex: 1; background: #050811; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; position: relative; }
        .canvas-container { position: relative; border: 2px solid #334155; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); cursor: crosshair; }
        canvas { display: block; }
        
        .sidebar { width: 320px; background: #0f172a; border-left: 1px solid #1e293b; display: flex; flex-direction: column; padding: 16px; gap: 16px; overflow-y: auto; }
        .panel-card { background: #1e293b; border-radius: 8px; padding: 14px; border: 1px solid #334155; }
        .panel-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .stat-box { background: #0f172a; padding: 10px; border-radius: 6px; border: 1px solid #1e293b; text-align: center; }
        .stat-value { font-size: 20px; font-weight: 800; color: #38bdf8; }
        .stat-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }

        .bbox-list { display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; }
        .bbox-item { background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
        .bbox-item:hover { border-color: #38bdf8; }
        .bbox-tag { font-weight: 700; color: #10b981; }
        .btn-del-box { background: #334155; color: #ef4444; border: none; padding: 4px 8px; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .btn-del-box:hover { background: #ef4444; color: white; }

        .action-toolbar { display: flex; gap: 12px; width: 100%; justify-content: center; margin-top: 15px; }
        .status-pill { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }
        .status-APPROVED { background: #065f46; color: #6ee7b7; }
        .status-REJECTED { background: #881337; color: #fda4af; }
        .status-PENDING { background: #1e293b; color: #94a3b8; }
        
        .instructions { font-size: 12px; color: #94a3b8; line-height: 1.5; background: #0f172a; padding: 10px; border-radius: 6px; }
    </style>
</head>
<body>

<header>
    <div>
        <h1>🐟 CatfishCare Review Studio <span style="font-size:12px; font-weight:normal; color:#64748b;">(Class 0: surface_activity)</span></h1>
        <div style="display:flex; gap:6px; margin-top:6px; align-items:center;">
            <span style="font-size:12px; font-weight:bold; color:#38bdf8;">Tim Reviewer:</span>
            <button class="btn active" id="btn-user-iir" onclick="setReviewer('Iir')">👤 Iir (#1 - #551)</button>
            <button class="btn" id="btn-user-variz" onclick="setReviewer('Variz')">👤 Variz (#552 - #1102)</button>
            <button class="btn" id="btn-user-gopar" onclick="setReviewer('Gopar')">👤 Gopar (#1103 - #1653)</button>
        </div>
    </div>
    
    <div class="batch-selector">
        <button class="btn active" id="btn-status-pending" onclick="setFilter('all', 'pending')">🟡 Pending Only</button>
        <button class="btn" id="btn-status-approved" onclick="setFilter('all', 'approved')">🟢 Approved Only</button>
        <button class="btn" id="btn-status-rejected" onclick="setFilter('all', 'rejected')">🔴 Rejected Only</button>
        <button class="btn" id="btn-status-all" onclick="setFilter('all', 'all')">🌐 All Samples</button>
    </div>
</header>

<div class="main-layout">
    <div class="canvas-area">
        <div style="margin-bottom: 10px; font-size: 13px; color: #cbd5e1; display: flex; gap: 20px;">
            <div>Image: <strong id="lbl-filename">-</strong></div>
            <div>Status: <span id="lbl-status" class="status-pill status-PENDING">PENDING</span></div>
            <div>Index: <strong id="lbl-index">0 / 0</strong></div>
        </div>

        <div class="canvas-container">
            <canvas id="canvas" width="640" height="360"></canvas>
        </div>

        <div class="action-toolbar">
            <button class="btn btn-approve" style="padding: 10px 24px; font-size: 14px;" onclick="submitReview('APPROVED')">✓ APPROVE (Save BBoxes)</button>
            <button class="btn btn-reject" style="padding: 10px 24px; font-size: 14px;" onclick="submitReview('REJECTED')">✕ REJECT (Pure Background / Glare)</button>
            <button class="btn" style="padding: 10px 18px;" onclick="clearAllBBoxes()">🗑 Clear All BBoxes</button>
            <button class="btn" style="padding: 10px 18px;" onclick="prevImage()">&larr; Prev</button>
            <button class="btn" style="padding: 10px 18px;" onclick="nextImage()">Next &rarr;</button>
        </div>
    </div>

    <div class="sidebar">
        <div class="panel-card">
            <div class="panel-title">Review Statistics</div>
            <div class="stats-grid">
                <div class="stat-box"><div class="stat-value" id="st-approved">0</div><div class="stat-label">Approved</div></div>
                <div class="stat-box"><div class="stat-value" id="st-rejected">0</div><div class="stat-label">Rejected</div></div>
                <div class="stat-box"><div class="stat-value" id="st-total">0</div><div class="stat-label">Total Done</div></div>
                <div class="stat-box"><div class="stat-value" id="st-gt">0</div><div class="stat-label">BBoxes Saved</div></div>
            </div>
        </div>

        <div class="panel-card">
            <div class="panel-title">
                <span>Active BBoxes (<span id="box-count">0</span>)</span>
            </div>
            <div class="bbox-list" id="bbox-list-container">
                <!-- BBox Items render here -->
            </div>
        </div>

        <div class="instructions">
            <strong>💡 Quick Controls:</strong><br>
            • <strong>Draw Box</strong>: Click & Drag on Canvas.<br>
            • <strong>Delete Single Box</strong>: Click red 🗑 button next to box in list.<br>
            • <strong>APPROVE</strong>: Save boxes as Ground Truth.<br>
            • <strong>REJECT</strong>: Mark as clean background image (noise/glare/wall deleted).
        </div>
    </div>
</div>

<script>
    let items = [];
    let currentIndex = 0;
    let currentImg = new Image();
    let activeBBoxes = [];
    let isDrawing = false;
    let startX = 0, startY = 0;
    let currentBatch = 'all';
    let currentStatus = 'pending';
    let currentReviewer = 'Iir';

    // Auto detect ?user=Iir / ?user=Variz / ?user=Gopar from URL query params
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let userParam = urlParams.get('user') || urlParams.get('reviewer');
        if (userParam) {
            currentReviewer = userParam;
        }
    } catch(err) {
        console.log("URL param parse error:", err);
    }

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    function getCoords(e) {
        let rect = canvas.getBoundingClientRect();
        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    canvas.addEventListener('mousedown', function(e) {
        let c = getCoords(e);
        startX = c.x;
        startY = c.y;
        isDrawing = true;
    });

    canvas.addEventListener('mousemove', function(e) {
        if (!isDrawing) return;
        let c = getCoords(e);
        render();
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(startX, startY, c.x - startX, c.y - startY);
        ctx.setLineDash([]);
    });

    canvas.addEventListener('mouseup', function(e) {
        if (!isDrawing) return;
        isDrawing = false;
        let c = getCoords(e);
        let bw = Math.abs(c.x - startX);
        let bh = Math.abs(c.y - startY);
        let bx = Math.min(startX, c.x);
        let by = Math.min(startY, c.y);

        if (bw > 6 && bh > 6) {
            activeBBoxes.push({
                xc: (bx + bw / 2.0) / 640,
                yc: (by + bh / 2.0) / 360,
                bw: bw / 640,
                bh: bh / 360,
                conf: 1.0
            });
        }
        render();
    });

    function setReviewer(name) {
        currentReviewer = name;
        document.querySelectorAll('header div div button').forEach(b => b.classList.remove('active'));
        let btn = document.getElementById('btn-user-' + name.toLowerCase());
        if (btn) btn.classList.add('active');
        fetchList(true);
    }

    function setFilter(batch, status) {
        currentBatch = batch;
        currentStatus = status;
        document.querySelectorAll('.batch-selector .btn').forEach(b => b.classList.remove('active'));
        let activeBtn = document.getElementById('btn-status-' + status) || document.getElementById('btn-batch-' + batch);
        if (activeBtn) activeBtn.classList.add('active');
        fetchList(true);
    }

    function fetchList(restoreState = true) {
        fetch('/api/list?batch=' + currentBatch + '&status=' + currentStatus + '&reviewer=' + currentReviewer)
            .then(res => res.json())
            .then(data => {
                items = data.items;
                updateStats(data.stats);

                if (restoreState && items.length > 0) {
                    let targetRel = data.last_rel_path || localStorage.getItem('catfishcare_last_rel_path');
                    let foundIdx = -1;
                    if (targetRel) {
                        foundIdx = items.findIndex(it => it.rel_path === targetRel);
                    }
                    if (foundIdx !== -1) {
                        currentIndex = foundIdx;
                    } else {
                        currentIndex = 0;
                    }
                } else {
                    currentIndex = 0;
                }
                renderCurrent();
            });
    }

    function renderCurrent() {
        if (items.length === 0) {
            ctx.fillStyle = "#050811";
            ctx.fillRect(0,0,640,360);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "14px sans-serif";
            ctx.fillText("No images found in this batch", 220, 180);
            document.getElementById('lbl-filename').innerText = "-";
            document.getElementById('lbl-index').innerText = "0 / 0";
            return;
        }

        let item = items[currentIndex];
        document.getElementById('lbl-filename').innerText = item.filename;
        document.getElementById('lbl-index').innerText = `${currentIndex + 1} / ${items.length}`;
        let statusEl = document.getElementById('lbl-status');
        statusEl.innerText = item.status;
        statusEl.className = 'status-pill status-' + item.status;

        activeBBoxes = JSON.parse(JSON.stringify(item.bboxes));

        currentImg.onload = function() {
            render();
        };
        currentImg.src = '/img/' + item.rel_path;
    }

    function render(highlightIdx = -1) {
        ctx.drawImage(currentImg, 0, 0, 640, 360);
        let listContainer = document.getElementById('bbox-list-container');
        listContainer.innerHTML = '';
        document.getElementById('box-count').innerText = activeBBoxes.length;

        activeBBoxes.forEach((b, idx) => {
            let w = 640, h = 360;
            let bw = b.bw * w, bh = b.bh * h;
            let bx = (b.xc * w) - (bw / 2);
            let by = (b.yc * h) - (bh / 2);
            let confStr = b.conf ? b.conf.toFixed(2) : '1.0';

            let isHighlighted = (idx === highlightIdx);
            let color = isHighlighted ? '#38bdf8' : (b.conf >= 0.75 ? '#10b981' : (b.conf >= 0.45 ? '#f59e0b' : '#ef4444'));
            ctx.strokeStyle = color;
            ctx.lineWidth = isHighlighted ? 3.5 : 2;
            ctx.strokeRect(bx, by, bw, bh);

            // Draw label background box for high visibility
            let labelText = `#${idx + 1} surface_act ${confStr}`;
            ctx.font = "bold 11px sans-serif";
            let txtWidth = ctx.measureText(labelText).width;
            
            ctx.fillStyle = color;
            ctx.fillRect(bx, Math.max(0, by - 16), txtWidth + 6, 16);

            ctx.fillStyle = '#0f172a';
            ctx.fillText(labelText, bx + 3, Math.max(12, by - 3));

            // Render matching list item in sidebar
            let div = document.createElement('div');
            div.className = 'bbox-item';
            div.style.borderLeft = `4px solid ${color}`;
            if (isHighlighted) div.style.borderColor = '#38bdf8';
            div.onmouseenter = function() { render(idx); };
            div.onmouseleave = function() { render(-1); };

            div.innerHTML = `
                <div>
                    <span class="bbox-tag" style="color:${color};">#${idx + 1} surface_activity</span>
                    <span style="color:#cbd5e1; font-size:11px; margin-left:2px;">(conf: ${confStr})</span>
                    <div style="color:#64748b; font-size:10px;">Ukuran: ${Math.round(bw)} &times; ${Math.round(bh)} px</div>
                </div>
                <button class="btn-del-box" style="cursor:pointer;" title="Hapus Kotak #${idx + 1}">🗑 Hapus</button>
            `;
            let delBtn = div.querySelector('.btn-del-box');
            delBtn.onclick = function(e) {
                deleteSingleBox(e, idx);
            };
            listContainer.appendChild(div);
        });
    }

    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        let c = getCoords(e);
        let clickedIdx = -1;
        for (let i = activeBBoxes.length - 1; i >= 0; i--) {
            let b = activeBBoxes[i];
            let bw = b.bw * 640, bh = b.bh * 360;
            let bx = (b.xc * 640) - (bw / 2);
            let by = (b.yc * 360) - (bh / 2);
            if (c.x >= bx && c.x <= bx + bw && c.y >= by && c.y <= by + bh) {
                clickedIdx = i;
                break;
            }
        }
        if (clickedIdx !== -1) {
            deleteSingleBox(null, clickedIdx);
        }
    });

    function deleteSingleBox(e, idx) {
        if (e) {
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
        }
        if (idx >= 0 && idx < activeBBoxes.length) {
            activeBBoxes.splice(idx, 1);
            if (items.length > 0 && items[currentIndex]) {
                items[currentIndex].bboxes = JSON.parse(JSON.stringify(activeBBoxes));
            }
            render(-1);
        }
    }
    window.deleteSingleBox = deleteSingleBox;

    function clearAllBBoxes() {
        activeBBoxes = [];
        if (items.length > 0 && items[currentIndex]) {
            items[currentIndex].bboxes = [];
        }
        render(-1);
    }

    function submitReview(action) {
        if (items.length === 0) return;
        let item = items[currentIndex];

        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rel_path: item.rel_path,
                action: action,
                bboxes: activeBBoxes,
                split: item.split,
                reviewer: currentReviewer
            })
        }).then(res => res.json()).then(data => {
            item.status = action;
            item.bboxes = [...activeBBoxes];
            updateStats(data.stats);
            nextImage();
        });
    }

    function resetAll() {
        if (confirm("Reset ALL review progress and start fresh from 0?")) {
            fetch('/api/reset', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    updateStats(data.stats);
                    fetchList();
                });
        }
    }

    function updateStats(stats) {
        if (!stats) return;
        document.getElementById('st-approved').innerText = stats.approved || 0;
        document.getElementById('st-rejected').innerText = stats.rejected || 0;
        document.getElementById('st-total').innerText = stats.total_reviewed || 0;
        document.getElementById('st-gt').innerText = (stats.approved || 0) + (stats.edited || 0);
    }

    function prevImage() {
        if (currentIndex > 0) {
            currentIndex--;
            renderCurrent();
        }
    }

    function nextImage() {
        if (currentIndex < items.length - 1) {
            currentIndex++;
            renderCurrent();
        }
    }

    if (currentReviewer !== 'all') {
        let btn = document.getElementById('btn-user-' + currentReviewer.toLowerCase());
        if (btn) {
            document.querySelectorAll('header div div button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
    }

    fetchList();
</script>
</body>
</html>"""

from socketserver import ThreadingMixIn

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

def run(port=5055):
    import threading
    print("[Server] Building RAM dataset cache in background...")
    threading.Thread(target=init_dataset_cache, daemon=True).start()
    
    server = ThreadedHTTPServer(('0.0.0.0', port), HumanReviewHandler)
    print(f"==================================================")
    print(f"CatfishCare Review Studio Running at http://127.0.0.1:{port}")
    print(f"Team / LAN Access: http://<YOUR_IP_ADDRESS>:{port}")
    print(f"==================================================")
    server.serve_forever()

if __name__ == "__main__":
    run()
