import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Bell, Info } from "lucide-react";
import type { SensorRow, StatusInfo, TodoItem } from "@/Types";

interface NotificationsTabProps {
    currentData: SensorRow | null;
    statusInfo: StatusInfo;
    todos: TodoItem[];
    toggleTodo: (id: number) => void;
}

export default function NotificationsTab({
    currentData,
    statusInfo,
    todos,
    toggleTodo,
}: NotificationsTabProps) {
    const [readNotifs, setReadNotifs] = useState<number[]>([]);

    const getAvatarIcon = (type: string) => {
        switch (type) {
            case "danger":
                return <AlertCircle size={18} className="text-red-500" />;
            case "warning":
                return <AlertTriangle size={18} className="text-amber-500" />;
            case "success":
                return <CheckCircle size={18} className="text-green-500" />;
            default:
                return <Info size={18} className="text-blue-500" />;
        }
    };

    // Generate notifications
    const notifications = [
        {
            id: 1,
            type: statusInfo.type,
            title: statusInfo.type === "danger" 
                ? "Kondisi Kolam Kritis" 
                : statusInfo.type === "warning" 
                ? "Peringatan Kondisi Kolam" 
                : "Sistem Optimal",
            text:
                statusInfo.type === "danger"
                    ? `Suhu terdeteksi ${currentData?.TEMPERATURE}°C dan pH ${currentData?.pH}. Diperlukan tindakan segera untuk memulihkan kondisi kualitas air.`
                    : statusInfo.type === "warning"
                      ? `Suhu terdeteksi turun ke ${currentData?.TEMPERATURE}°C dengan tingkat Nitrat tinggi. Waspada bahaya upwelling.`
                      : `Semua parameter kolam berada dalam batas normal. Suhu: ${currentData?.TEMPERATURE}°C, pH: ${currentData?.pH}, Turbidity: ${currentData?.TURBIDITY} NTU.`,
            time: "Baru saja",
            isSystem: true,
        },
        {
            id: 2,
            type: "info",
            title: "Pembaruan Biometrik Ikan",
            text: `Rata-rata panjang ikan lele bertambah menjadi ${currentData?.Length || 0} cm pada siklus pencatatan hari ini.`,
            time: "1 jam yang lalu",
            isSystem: false,
        },
        {
            id: 3,
            type: "info",
            title: "Pertumbuhan Berat Ikan",
            text: `Rata-rata berat ikan lele terpantau naik mencapai ${currentData?.Weight || 0} gram berdasarkan sensor estimasi berat lele.`,
            time: "4 jam yang lalu",
            isSystem: false,
        },
    ];

    const markAsRead = (id: number) => {
        if (!readNotifs.includes(id)) {
            setReadNotifs([...readNotifs, id]);
        }
    };

    const markAllAsRead = () => {
        setReadNotifs(notifications.map(n => n.id));
    };

    const getStatusClass = (type: string) => {
        switch (type) {
            case "danger": return "border-left-danger";
            case "warning": return "border-left-warning";
            case "success": return "border-left-success";
            default: return "border-left-info";
        }
    };

    return (
        <div className="tab-page notifications-page" style={{ padding: "30px", maxWidth: "980px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "32px", fontWeight: 600, letterSpacing: "-0.02em" }}>
                        <Bell size={28} /> Notifikasi Sistem
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginTop: "4px" }}>
                        Kelola peringatan kondisi air, pembaruan biometrik, dan rekomendasi aksi AI.
                    </p>
                </div>
                {readNotifs.length < notifications.length && (
                    <button 
                        onClick={markAllAsRead} 
                        className="btn-action" 
                        style={{ fontSize: "13px", padding: "8px 16px" }}
                    >
                        Tandai Semua Dibaca
                    </button>
                )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {notifications.map((notif) => {
                    const isRead = readNotifs.includes(notif.id);
                    return (
                        <div
                            key={notif.id}
                            className={`card ${getStatusClass(notif.type)}`}
                            style={{
                                opacity: isRead ? 0.6 : 1,
                                transition: "all 0.3s ease",
                                padding: "20px 24px",
                                borderLeft: `4px solid ${
                                    notif.type === "danger" ? "var(--color-danger)" :
                                    notif.type === "warning" ? "var(--color-warning)" :
                                    notif.type === "success" ? "var(--color-success)" :
                                    "var(--color-accent-soft)"
                                }`,
                                background: "var(--bg-card)",
                                borderRadius: "12px",
                                border: "1px solid var(--border-color)",
                                position: "relative"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                                <div style={{ display: "flex", gap: "16px" }}>
                                    <div style={{ marginTop: "3px" }}>
                                        {getAvatarIcon(notif.type)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.015em", display: "flex", alignItems: "center", gap: "8px" }}>
                                            {notif.title}
                                            {!isRead && (
                                                <span style={{ 
                                                    width: "6px", 
                                                    height: "6px", 
                                                    borderRadius: "50%", 
                                                    backgroundColor: "var(--color-primary)",
                                                    display: "inline-block" 
                                                }} />
                                            )}
                                        </h3>
                                        <p style={{ fontSize: "14px", marginTop: "6px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                                            {notif.text}
                                        </p>
                                        
                                        {/* Actionable items inside system alerts */}
                                        {notif.isSystem && statusInfo.type !== "success" && (
                                            <div style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(0, 0, 0, 0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                                                <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                                                    Rekomendasi Tindakan AI:
                                                </h4>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                    {todos.map((todo) => (
                                                        <label key={todo.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={todo.checked}
                                                                onChange={() => toggleTodo(todo.id)}
                                                                style={{ accentColor: "var(--color-primary)" }}
                                                            />
                                                            <span style={{ textDecoration: todo.checked ? "line-through" : "none", color: todo.checked ? "var(--color-text-muted)" : "inherit" }}>
                                                                {todo.text}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Clock size={12} /> {notif.time}
                                    </span>
                                    {!isRead && (
                                        <button
                                            onClick={() => markAsRead(notif.id)}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                color: "var(--color-primary)",
                                                fontSize: "12px",
                                                cursor: "pointer",
                                                fontWeight: 500,
                                                padding: "4px 8px",
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
                                        >
                                            Tandai dibaca
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
