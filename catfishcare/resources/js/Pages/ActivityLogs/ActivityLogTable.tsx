import { LogIn, LogOut, UserPlus, Edit3, Trash2, Activity } from "lucide-react";

export interface LogItem {
    id: number;
    user_id: number | null;
    username: string;
    action: string;
    description: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

interface ActivityLogTableProps {
    logs: LogItem[];
}

export default function ActivityLogTable({ logs }: ActivityLogTableProps) {
    const getActionBadge = (action: string) => {
        switch (action) {
            case "LOGIN":
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "#dcfce7", color: "#15803d" }}>
                        <LogIn size={12} />
                        LOGIN
                    </span>
                );
            case "LOGOUT":
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "#f1f5f9", color: "#64748b" }}>
                        <LogOut size={12} />
                        LOGOUT
                    </span>
                );
            case "CREATE_USER":
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "#e0f2fe", color: "#0284c7" }}>
                        <UserPlus size={12} />
                        CREATE USER
                    </span>
                );
            case "UPDATE_USER":
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "#fef3c7", color: "#b45309" }}>
                        <Edit3 size={12} />
                        UPDATE USER
                    </span>
                );
            case "DELETE_USER":
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "#fee2e2", color: "#dc2626" }}>
                        <Trash2 size={12} />
                        DELETE USER
                    </span>
                );
            default:
                return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, backgroundColor: "#e2e8f0", color: "#475569" }}>
                        <Activity size={12} />
                        {action}
                    </span>
                );
        }
    };

    return (
        <div className="db-panel-card" style={{ padding: "20px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569", fontWeight: 700 }}>
                            <th style={{ padding: "10px 12px" }}>Waktu Log</th>
                            <th style={{ padding: "10px 12px" }}>User</th>
                            <th style={{ padding: "10px 12px" }}>Aksi</th>
                            <th style={{ padding: "10px 12px" }}>Deskripsi Audit</th>
                            <th style={{ padding: "10px 12px" }}>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                                    Belum ada log aktivitas ter-rekam.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 600 }}>{log.created_at}</td>
                                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0284c7" }}>{log.username}</td>
                                    <td style={{ padding: "10px 12px" }}>{getActionBadge(log.action)}</td>
                                    <td style={{ padding: "10px 12px", color: "#334155" }}>{log.description}</td>
                                    <td style={{ padding: "10px 12px", color: "#64748b", fontFamily: "monospace" }}>{log.ip_address}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
