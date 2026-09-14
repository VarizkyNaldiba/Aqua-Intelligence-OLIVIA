import { useState, useEffect } from "react";
import { Bell, CheckCircle, AlertTriangle, XCircle, Info, Trash2 } from "lucide-react";
import type { SensorRow } from "@/Types";

interface NotificationsPageProps {
    currentData?: SensorRow | null;
    rawData?: SensorRow[];
}

interface NotifItem {
    id: string;
    type: "danger" | "warning" | "info" | "success";
    title: string;
    message: string;
    time: string;
    read: boolean;
}

function generateNotifications(rawData: SensorRow[]): NotifItem[] {
    const notifs: NotifItem[] = [];
    const latest = rawData[rawData.length - 1];
    if (!latest) return notifs;

    const temp = latest.TEMPERATURE ?? 27.5;
    const ph = latest.pH ?? 6.8;
    const turb = latest.TURBIDITY ?? 12;
    const tds = latest.NITRATE ?? 288;
    const height = latest.Length ?? 46.4;
    const ts = latest.created_at ? new Date(latest.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "Baru saja";

    if (temp > 32 || temp < 25)
        notifs.push({ id: "temp", type: temp > 35 || temp < 22 ? "danger" : "warning", title: "Suhu Air Tidak Normal", message: `Suhu saat ini ${temp.toFixed(1)}°C, di luar rentang ideal 25–32°C.`, time: ts, read: false });
    else
        notifs.push({ id: "temp", type: "success", title: "Suhu Air Normal", message: `Suhu ${temp.toFixed(1)}°C dalam rentang optimal.`, time: ts, read: true });

    if (ph < 6.5 || ph > 8.5)
        notifs.push({ id: "ph", type: ph < 5.8 || ph > 9.0 ? "danger" : "warning", title: "pH Air Abnormal", message: `pH ${ph.toFixed(2)} di luar batas aman 6.5–8.5.`, time: ts, read: false });
    else
        notifs.push({ id: "ph", type: "success", title: "pH Air Normal", message: `pH ${ph.toFixed(2)} dalam rentang optimal.`, time: ts, read: true });

    if (turb > 55)
        notifs.push({ id: "turb", type: "danger", title: "Kekeruhan Kritis", message: `Turbidity ${turb.toFixed(1)} NTU sangat tinggi, ganti air segera.`, time: ts, read: false });
    else if (turb > 35)
        notifs.push({ id: "turb", type: "warning", title: "Kekeruhan Tinggi", message: `Turbidity ${turb.toFixed(1)} NTU melebihi batas ideal 35 NTU.`, time: ts, read: false });

    if (tds > 1000)
        notifs.push({ id: "tds", type: "danger", title: "TDS Kritis", message: `TDS ${tds.toFixed(0)} PPM sangat tinggi, periksa sumber air.`, time: ts, read: false });
    else if (tds > 900)
        notifs.push({ id: "tds", type: "warning", title: "TDS Tinggi", message: `TDS ${tds.toFixed(0)} PPM mendekati batas aman 900 PPM.`, time: ts, read: false });

    if (height < 8 || height > 50)
        notifs.push({ id: "height", type: "warning", title: "Tinggi Air Tidak Normal", message: `Tinggi air ${height.toFixed(1)} cm di luar rentang ideal 8–50 cm.`, time: ts, read: false });

    return notifs;
}

const typeStyle: Record<string, { bg: string; border: string; icon: JSX.Element }> = {
    danger:  { bg: "#fff1f1", border: "#fca5a5", icon: <XCircle size={18} color="#dc2626" /> },
    warning: { bg: "#fffbeb", border: "#fcd34d", icon: <AlertTriangle size={18} color="#d97706" /> },
    info:    { bg: "#f0f9ff", border: "#7dd3fc", icon: <Info size={18} color="#0284c7" /> },
    success: { bg: "#f0fdf4", border: "#86efac", icon: <CheckCircle size={18} color="#16a34a" /> },
};

export default function NotificationsPage({ rawData = [] }: NotificationsPageProps) {
    const [liveData, setLiveData] = useState<SensorRow[]>(rawData);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetch5s = () => {
            fetch("/api/telemetry/latest/1")
                .then((r) => r.json())
                .then((d) => {
                    const raw = d.telemetry || d.data;
                    if (raw) {
                        const mapped: SensorRow = {
                            TEMPERATURE: parseFloat(raw.suhu ?? raw.TEMPERATURE ?? 27.5),
                            pH: parseFloat(raw.ph ?? raw.pH ?? 6.8),
                            TURBIDITY: parseFloat(raw.kekeruhan ?? raw.TURBIDITY ?? 12),
                            NITRATE: parseFloat(raw.tds ?? raw.NITRATE ?? 288),
                            Length: parseFloat(raw.tinggi_air ?? raw.Length ?? 46.4),
                            created_at: raw.updated_at ?? new Date().toISOString(),
                        };
                        setLiveData([mapped]);
                    }
                })
                .catch(() => {});
        };
        fetch5s();
        const interval = setInterval(fetch5s, 5000);
        return () => clearInterval(interval);
    }, []);

    const allNotifs = generateNotifications(liveData.length > 0 ? liveData : rawData);
    const visible = allNotifs.filter((n) => !dismissed.has(n.id));
    const unread = visible.filter((n) => !n.read).length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        Notifications
                    </h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                        Alert kondisi kolam secara real-time
                    </p>
                </div>
                {unread > 0 && (
                    <span style={{ backgroundColor: "#fee2e2", color: "#b91c1c", fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px" }}>
                        {unread} Belum dibaca
                    </span>
                )}
            </div>

            {/* Notification Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {visible.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                        <Bell size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                        <div style={{ fontWeight: 600 }}>Tidak ada notifikasi aktif</div>
                        <div style={{ fontSize: "13px", marginTop: "4px" }}>Semua parameter kolam dalam kondisi normal</div>
                    </div>
                ) : (
                    visible.map((n) => {
                        const style = typeStyle[n.type];
                        return (
                            <div
                                key={n.id}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "14px",
                                    padding: "16px 18px",
                                    backgroundColor: style.bg,
                                    border: `1px solid ${style.border}`,
                                    borderRadius: "12px",
                                    opacity: n.read ? 0.75 : 1,
                                }}
                            >
                                <div style={{ marginTop: "2px", flexShrink: 0 }}>{style.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{n.title}</span>
                                        <span style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap" }}>{n.time}</span>
                                    </div>
                                    <p style={{ fontSize: "13px", color: "#475569", margin: "4px 0 0 0" }}>{n.message}</p>
                                </div>
                                <button
                                    onClick={() => setDismissed((prev) => new Set([...prev, n.id]))}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", flexShrink: 0, padding: "2px" }}
                                    title="Dismiss"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
