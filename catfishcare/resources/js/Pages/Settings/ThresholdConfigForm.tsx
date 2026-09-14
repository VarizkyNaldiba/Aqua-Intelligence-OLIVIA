import { useState } from "react";
import { Save, Info } from "lucide-react";
import type { AppUser } from "@/Types";

interface ThresholdConfigFormProps {
    currentUser?: AppUser | null;
    onSaveSuccess: (msg: string) => void;
}

export default function ThresholdConfigForm({ currentUser, onSaveSuccess }: ThresholdConfigFormProps) {
    const [name, setName] = useState(currentUser?.name || currentUser?.username || "Admin");
    const [email, setEmail] = useState(currentUser?.email || "admin@catfishcare.app");
    const [tempMin, setTempMin] = useState(25.0);
    const [tempMax, setTempMax] = useState(32.0);
    const [phMin, setPhMin] = useState(6.5);
    const [phMax, setPhMax] = useState(8.5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveSuccess("Pengaturan threshold & profil pengguna berhasil disimpan.");
    };

    return (
        <form onSubmit={handleSubmit} className="db-panel-card" style={{ padding: "24px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginBottom: "16px" }}>
                Pengaturan Profil & Ambang Batas Parameter Air
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Nama Pengguna</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Email Akun</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Suhu Air Minimal (°C)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={tempMin}
                        onChange={(e) => setTempMin(Number(e.target.value))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Suhu Air Maksimal (°C)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={tempMax}
                        onChange={(e) => setTempMax(Number(e.target.value))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>pH Minimal</label>
                    <input
                        type="number"
                        step="0.1"
                        value={phMin}
                        onChange={(e) => setPhMin(Number(e.target.value))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>pH Maksimal</label>
                    <input
                        type="number"
                        step="0.1"
                        value={phMax}
                        onChange={(e) => setPhMax(Number(e.target.value))}
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
                <span>Simpan Pengaturan</span>
            </button>
        </form>
    );
}
