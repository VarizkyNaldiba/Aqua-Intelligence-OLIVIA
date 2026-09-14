import React, { useState, useEffect } from "react";
import { 
    Database, 
    Cloud, 
    HardDrive, 
    ExternalLink, 
    CheckCircle2, 
    RefreshCw, 
    Layers, 
    Server,
    Activity,
    Info,
    Folder
} from "lucide-react";
import { formatWibDetail } from "@/Utils/dateUtils";

interface StorageStats {
    sqlite?: {
        total_records: number;
        pond_records: number;
        today_records: number;
        first_record?: string | null;
        last_record?: string | null;
        db_size_bytes: number;
        db_size_formatted: string;
    };
    firestore?: {
        connected: boolean;
        project_id: string;
        sensor_documents: number;
        user_documents: number;
        total_documents: number;
        storage_used_bytes: number;
        storage_limit_bytes: number;
        storage_used_percent: number;
        plan_name: string;
        quota_storage: string;
        quota_daily_reads: string;
        quota_daily_writes: string;
        quota_daily_deletes: string;
    };
    rtdb?: {
        connected: boolean;
        url: string;
        storage_quota: string;
        bandwidth_quota: string;
        active_nodes: string[];
    };
    google_drive?: {
        folder_id: string;
        folder_url: string;
    };
}

export default function StorageUsageCard() {
    const [stats, setStats] = useState<StorageStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/telemetry/stats/1");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch {
            // Keep existing state on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 15000); // Polling update every 15s
        return () => clearInterval(interval);
    }, []);

    const sqlite = stats?.sqlite;
    const firestore = stats?.firestore;
    const rtdb = stats?.rtdb;
    const gdrive = stats?.google_drive;

    const firestorePercent = firestore?.storage_used_percent ?? 0.01;
    const formattedPercent = firestorePercent < 0.01 ? "< 0.01%" : `${firestorePercent}%`;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Header and Refresh Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div 
                        style={{ 
                            width: "32px", 
                            height: "32px", 
                            borderRadius: "8px", 
                            backgroundColor: "rgba(14, 165, 233, 0.15)", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            color: "#0284c7" 
                        }}
                    >
                        <Layers size={18} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            Penyimpanan Data & Status Penggunaan Firebase Cloud
                        </h3>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                            Statistik log data tersimpan di SQLite lokal dan sinkronisasi Google Firebase
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={fetchStats}
                        disabled={loading}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: loading ? "wait" : "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                        <span>{loading ? "Memuat..." : "Refresh"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            backgroundColor: showDetails ? "#e0f2fe" : "#ffffff",
                            color: "#0284c7",
                            border: "1px solid #bae6fd",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        <Info size={13} />
                        <span>{showDetails ? "Sembunyikan Rincian" : "Rincian Kuota"}</span>
                    </button>
                </div>
            </div>

            {/* Metric Overview Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                {/* CARD 1: SQLite Database Local */}
                <div 
                    className="db-panel-card" 
                    style={{ 
                        padding: "18px 20px", 
                        borderRadius: "14px", 
                        backgroundColor: "#ffffff", 
                        border: "1px solid #e2e8f0",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Database SQLite Lokal
                            </span>
                            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                                {sqlite?.total_records?.toLocaleString("id-ID") ?? 0} <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Log</span>
                            </div>
                        </div>
                        <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#f0fdf4", color: "#16a34a" }}>
                            <HardDrive size={20} />
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Ukuran File DB:</span>
                            <strong style={{ color: "#0f172a" }}>{sqlite?.db_size_formatted ?? "0 KB"}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Terekam Hari Ini:</span>
                            <strong style={{ color: "#16a34a" }}>+{sqlite?.today_records ?? 0} Log</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Data Terakhir:</span>
                            <strong style={{ color: "#0f172a" }}>
                                {sqlite?.last_record ? formatWibDetail(sqlite.last_record) : "—"}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* CARD 2: Firestore Document Usage */}
                <div 
                    className="db-panel-card" 
                    style={{ 
                        padding: "18px 20px", 
                        borderRadius: "14px", 
                        backgroundColor: "#ffffff", 
                        border: "1px solid #e2e8f0",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Firestore Cloud
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "8px", backgroundColor: "#ecfdf5", color: "#059669" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                                    Active
                                </span>
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                                {firestore?.total_documents ?? 0} <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Dokumen</span>
                            </div>
                        </div>
                        <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#2563eb" }}>
                            <Cloud size={20} />
                        </div>
                    </div>

                    {/* Storage Progress Bar */}
                    <div style={{ marginTop: "4px", marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                            <span>Pemakaian Kuota (1 GiB):</span>
                            <strong style={{ color: "#2563eb" }}>{formattedPercent}</strong>
                        </div>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div 
                                style={{ 
                                    width: `${Math.max(firestorePercent, 1)}%`, 
                                    height: "100%", 
                                    backgroundColor: "#2563eb", 
                                    borderRadius: "4px" 
                                }} 
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Koleksi sensor_history:</span>
                            <strong style={{ color: "#0f172a" }}>{firestore?.sensor_documents ?? 0} dok</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Koleksi users:</span>
                            <strong style={{ color: "#0f172a" }}>{firestore?.user_documents ?? 0} dok</strong>
                        </div>
                    </div>
                </div>

                {/* CARD 3: Firebase Realtime Database */}
                <div 
                    className="db-panel-card" 
                    style={{ 
                        padding: "18px 20px", 
                        borderRadius: "14px", 
                        backgroundColor: "#ffffff", 
                        border: "1px solid #e2e8f0",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Realtime DB (RTDB)
                                </span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "8px", backgroundColor: "#ecfdf5", color: "#059669" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                                    Live Sync
                                </span>
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                                4 <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Active Nodes</span>
                            </div>
                        </div>
                        <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#fff7ed", color: "#ea580c" }}>
                            <Activity size={20} />
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Batas Kuota Storage:</span>
                            <strong style={{ color: "#0f172a" }}>{rtdb?.storage_quota ?? "1 GB"}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Batas Bandwidth:</span>
                            <strong style={{ color: "#0f172a" }}>{rtdb?.bandwidth_quota ?? "10 GB / bln"}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Protokol Sinkronisasi:</span>
                            <strong style={{ color: "#ea580c" }}>WebSocket / REST Sync</strong>
                        </div>
                    </div>
                </div>

                {/* CARD 4: Google Cloud & Drive Sync */}
                <div 
                    className="db-panel-card" 
                    style={{ 
                        padding: "18px 20px", 
                        borderRadius: "14px", 
                        backgroundColor: "#ffffff", 
                        border: "1px solid #e2e8f0",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Google Drive Backup
                            </span>
                            <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                                Folder Terhubung
                            </div>
                        </div>
                        <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
                            <Folder size={20} />
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Target Folder:</span>
                            <span style={{ fontFamily: "monospace", color: "#0f172a", fontSize: "10px" }}>
                                {gdrive?.folder_id ? `${gdrive.folder_id.slice(0, 14)}...` : "1vLtZgdbAC-KY..."}
                            </span>
                        </div>
                        <a
                            href={gdrive?.folder_url || "https://drive.google.com/drive/folders/1vLtZgdbAC-KYVoksBQ2cMq8x7Pg6GudW"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                marginTop: "4px",
                                padding: "6px 12px",
                                backgroundColor: "#f5f3ff",
                                color: "#7c3aed",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontWeight: 700,
                                fontSize: "11px",
                                border: "1px solid #ddd6fe",
                                transition: "all 0.2s",
                            }}
                        >
                            <ExternalLink size={12} />
                            <span>Buka Folder Google Drive</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* EXPANDABLE DETAILS PANEL */}
            {showDetails && (
                <div 
                    style={{ 
                        padding: "18px 20px", 
                        borderRadius: "12px", 
                        backgroundColor: "#f8fafc", 
                        border: "1px solid #e2e8f0", 
                        fontSize: "12px",
                        color: "#334155"
                    }}
                >
                    <div style={{ fontWeight: 800, fontSize: "13px", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle2 size={16} color="#10b981" />
                        <span>Rincian Kuota & Konfigurasi Google Cloud Firebase (Project: {firestore?.project_id || "explora-be1a0"})</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                        <div style={{ padding: "10px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontWeight: 700, color: "#64748b", fontSize: "11px" }}>PAKET FIREBASE</div>
                            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "13px", marginTop: "2px" }}>
                                {firestore?.plan_name || "Spark Plan (Gratis)"}
                            </div>
                            <div style={{ color: "#10b981", fontSize: "11px", marginTop: "2px" }}>Batas kuota aktif tanpa biaya bulanan</div>
                        </div>

                        <div style={{ padding: "10px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontWeight: 700, color: "#64748b", fontSize: "11px" }}>KUOTA BACA FIRESTORE (READS)</div>
                            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "13px", marginTop: "2px" }}>
                                {firestore?.quota_daily_reads || "50,000 / hari"}
                            </div>
                            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>Cukup untuk polling interval real-time</div>
                        </div>

                        <div style={{ padding: "10px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontWeight: 700, color: "#64748b", fontSize: "11px" }}>KUOTA TULIS FIRESTORE (WRITES)</div>
                            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "13px", marginTop: "2px" }}>
                                {firestore?.quota_daily_writes || "20,000 / hari"}
                            </div>
                            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>Mencakup perekaman log telemetri sensor</div>
                        </div>

                        <div style={{ padding: "10px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontWeight: 700, color: "#64748b", fontSize: "11px" }}>REALTIME DATABASE BANDWIDTH</div>
                            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "13px", marginTop: "2px" }}>
                                {rtdb?.bandwidth_quota || "10 GB / bulan"}
                            </div>
                            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>Koneksi langsung dari mikrokontroler ESP32</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
