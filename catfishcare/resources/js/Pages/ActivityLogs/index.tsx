import { useState, useEffect } from "react";
import { Search, RefreshCw } from "lucide-react";
import ActivityLogTable, { type LogItem } from "./ActivityLogTable";
import type { AppUser } from "@/Types";

interface ActivityLogsIndexProps {
    currentUser?: AppUser | null;
}

export default function ActivityLogsIndex({ currentUser: _currentUser }: ActivityLogsIndexProps) {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const url = search ? `/api/activity-logs?search=${encodeURIComponent(search)}` : "/api/activity-logs";
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }
        } catch {
            // Keep state
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [search]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        Log Activity Web (Audit Trail)
                    </h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                        Rekam jejak riwayat aktivitas dan peristiwa sistem pengguna CatfishCare
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
                        <input
                            type="text"
                            placeholder="Cari aktivitas/user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: "6px 12px 6px 30px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={fetchLogs}
                        disabled={loading}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            backgroundColor: "#0ea5e9",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                        }}
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        <span>Refresh Log</span>
                    </button>
                </div>
            </div>

            <ActivityLogTable logs={logs} />
        </div>
    );
}
