import { Database, HardDrive } from "lucide-react";

interface DatasetTableProps {
    stats: { total_images: number; total_labels: number };
}

export default function DatasetTable({ stats }: DatasetTableProps) {
    return (
        <div className="db-panel-card" style={{ padding: "20px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Database size={18} color="#0ea5e9" />
                    Statistik & Galeri Dataset
                </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px", fontWeight: 700 }}>
                        <HardDrive size={16} /> Total Gambar Terkumpul
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "#0ea5e9", marginTop: "4px" }}>
                        {stats.total_images} <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748b" }}>Frames</span>
                    </div>
                </div>

                <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px", fontWeight: 700 }}>
                        <Database size={16} /> Anotasi Label (.txt)
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "#10b981", marginTop: "4px" }}>
                        {stats.total_labels} <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748b" }}>Annotations</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
