import { Edit3, Trash2, Shield, User as UserIcon, RotateCcw } from "lucide-react";

export interface UserItem {
    id: number;
    username: string;
    email: string;
    role: "admin" | "user";
    created_at: string;
}

interface UserTableProps {
    users: UserItem[];
    onEdit: (user: UserItem) => void;
    onDelete: (id: number) => void;
    onClearSensor?: (user: UserItem) => void;
}

export default function UserTable({ users, onEdit, onDelete, onClearSensor }: UserTableProps) {
    return (
        <div className="db-panel-card" style={{ padding: "20px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569", fontWeight: 700 }}>
                            <th style={{ padding: "10px 12px" }}>User</th>
                            <th style={{ padding: "10px 12px" }}>Email</th>
                            <th style={{ padding: "10px 12px" }}>Role</th>
                            <th style={{ padding: "10px 12px" }}>Tanggal Dibuat</th>
                            <th style={{ padding: "10px 12px", textAlign: "right" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0f172a" }}>{u.username}</td>
                                <td style={{ padding: "10px 12px", color: "#64748b" }}>{u.email}</td>
                                <td style={{ padding: "10px 12px" }}>
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            padding: "3px 8px",
                                            borderRadius: "10px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            backgroundColor: u.role === "admin" ? "rgba(168, 85, 247, 0.15)" : "rgba(14, 165, 233, 0.15)",
                                            color: u.role === "admin" ? "#a855f7" : "#0ea5e9",
                                        }}
                                    >
                                        {u.role === "admin" ? <Shield size={12} /> : <UserIcon size={12} />}
                                        {u.role === "admin" ? "ADMIN" : "USER"}
                                    </span>
                                </td>
                                <td style={{ padding: "10px 12px", color: "#64748b" }}>{u.created_at || "14 Sep 2026"}</td>
                                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                    {onClearSensor && (
                                        <button
                                            type="button"
                                            onClick={() => onClearSensor(u)}
                                            title={`Clear Data Sensor untuk ${u.username}`}
                                            style={{
                                                padding: "4px 10px",
                                                backgroundColor: "#fff7ed",
                                                color: "#ea580c",
                                                border: "1px solid #ffedd5",
                                                borderRadius: "6px",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                marginRight: "6px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px",
                                            }}
                                        >
                                            <RotateCcw size={12} />
                                            <span>Clear Data Sensor</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onEdit(u)}
                                        style={{ padding: "4px 8px", backgroundColor: "#e0f2fe", color: "#0284c7", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginRight: "6px" }}
                                    >
                                        <Edit3 size={13} />
                                    </button>
                                    {u.email !== "admin@catfishcare.app" && (
                                        <button
                                            type="button"
                                            onClick={() => onDelete(u.id)}
                                            style={{ padding: "4px 8px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
