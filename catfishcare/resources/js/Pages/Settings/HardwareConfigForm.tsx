import { useState } from "react";
import { Cpu, Save } from "lucide-react";

interface HardwareConfigFormProps {
    cameraUrl: string;
    setCameraUrl?: (url: string) => void;
    onSaveSuccess: (msg: string) => void;
}

export default function HardwareConfigForm({ cameraUrl, setCameraUrl, onSaveSuccess }: HardwareConfigFormProps) {
    const [urlInput, setUrlInput] = useState(cameraUrl || "http://192.168.1.100:8080/video");
    const [espIp, setEspIp] = useState("192.168.4.1");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem("catfish_camera_url", urlInput);
        if (setCameraUrl) setCameraUrl(urlInput);
        onSaveSuccess("Endpoint hardware ESP32 & Pond Camera berhasil diperbarui.");
    };

    return (
        <form onSubmit={handleSubmit} className="db-panel-card" style={{ padding: "24px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Cpu size={18} color="#0ea5e9" />
                Konfigurasi IP ESP32 & Camera Stream
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>IP Address ESP32 Gateway</label>
                    <input
                        type="text"
                        value={espIp}
                        onChange={(e) => setEspIp(e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>RTSP / MJPEG Camera Stream URL</label>
                    <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                </div>
            </div>

            <button
                type="submit"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 18px",
                    backgroundColor: "#0ea5e9",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                }}
            >
                <Save size={16} />
                <span>Simpan Konfigurasi Hardware</span>
            </button>
        </form>
    );
}
