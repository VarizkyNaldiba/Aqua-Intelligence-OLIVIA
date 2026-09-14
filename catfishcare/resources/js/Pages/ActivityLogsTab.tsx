import { useState, useEffect } from "react";
import { Activity, Search, RefreshCw, Clock, Globe, User, ShieldAlert, CheckCircle2, LogIn, LogOut, UserPlus, Edit3, Trash2 } from "lucide-react";

interface LogItem {
    id: number;
    user_id: number | null;
    username: string;
    action: string;
    description: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

export default function ActivityLogsTab() {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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
            // Ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [search]);

    const getActionBadge = (action: string) => {
        switch (action) {
            case "LOGIN":
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                        <LogIn size={12} />
                        LOGIN
                    </span>
                );
            case "LOGOUT":
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(100, 116, 139, 0.15)", color: "#94a3b8", border: "1px solid rgba(100, 116, 139, 0.3)" }}>
                        <LogOut size={12} />
                        LOGOUT
                    </span>
                );
            case "CREATE_USER":
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(14, 165, 233, 0.15)", color: "#38bdf8", border: "1px solid rgba(14, 165, 233, 0.3)" }}>
                        <UserPlus size={12} />
                        CREATE USER
                    </span>
                );
            case "UPDATE_USER":
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                        <Edit3 size={12} />
                        UPDATE USER
                    </span>
                );
            case "DELETE_USER":
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                        <Trash2 size={12} />
                        DELETE USER
                    </span>
                );
            default:
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(148, 163, 184, 0.15)", color: "#cbd5e1", border: "1px solid rgba(148, 163, 184, 0.3)" }}>
                        <Activity size={12} />
                        {action}
                    </span>
                );
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
            {/* Title Area */}
            <div className="pm-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 className="db-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Activity color="#0ea5e9" size={26} />
                        <span>Log Activity Web</span>
                    </h2>
                    <p className="db-subtitle">Audit trail dan rekam jejak riwayat aktivitas pengguna pada sistem CatfishCare</p>
                </div>
                <button className="db-btn-cyan" onClick={fetchLogs} style={{ gap: "8px" }}>
                    <RefreshCw size={16} />
                    <span>Refresh Log</span>
                </button>
            </div>

            {/* Filter & Search Card */}
            <div className="pm-table-card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                    <div style={{ position: "relative", width: "360px" }}>
                        <Search size={16} color="#64748b" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                            type="text"
                            className="pm-input"
                            style={{ paddingLeft: "36px" }}
                            placeholder="Cari aktivitas, username, IP, deskripsi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                        Menampilkan <strong>{logs.length}</strong> catatan aktivitas terbaru
                    </div>
                </div>
            </div>

            {/* Activity Logs Table */}
            <div className="pm-table-card">
                <div style={{ overflowX: "auto" }}>
                    <table className="pm-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Pengguna</th>
                                <th>Aksi</th>
                                <th>Deskripsi Aktivitas</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                        Memuat log aktivitas...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                        Belum ada aktivitas tercatat.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td style={{ whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94a3b8" }}>
                                                <Clock size={14} color="#64748b" />
                                                <span>{log.created_at}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <div className="pm-pond-icon-circle" style={{ width: "28px", height: "28px", backgroundColor: "rgba(14, 165, 233, 0.15)" }}>
                                                    <User size={14} color="#38bdf8" />
                                                </div>
                                                <span style={{ fontWeight: 600, color: "#ffffff" }}>{log.username}</span>
                                            </div>
                                        </td>
                                        <td>{getActionBadge(log.action)}</td>
                                        <td>
                                            <div style={{ fontSize: "13px", color: "#cbd5e1" }}>{log.description}</div>
                                        </td>
                                        <td style={{ whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                                                <Globe size={14} />
                                                <span>{log.ip_address}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
