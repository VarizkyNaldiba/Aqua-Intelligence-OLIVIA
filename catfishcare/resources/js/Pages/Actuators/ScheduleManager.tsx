import { useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";

interface ScheduleItem {
    id: number;
    time: string;
    action: "Ganti Air 30%" | "Pengurasan 50%" | "Sirkulasi Aerasi";
    repeat: string;
    active: boolean;
}

export default function ScheduleManager() {
    const [schedules, setSchedules] = useState<ScheduleItem[]>([
        { id: 1, time: "06:00 WIB", action: "Ganti Air 30%", repeat: "Setiap Hari", active: true },
        { id: 2, time: "16:00 WIB", action: "Sirkulasi Aerasi", repeat: "Setiap Hari", active: true },
    ]);

    const toggleSchedule = (id: number) => {
        setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    };

    const deleteSchedule = (id: number) => {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
    };

    return (
        <div className="db-panel-card" style={{ padding: "24px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={20} color="#a855f7" />
                    Jadwal Otomatisasi Pompa
                </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {schedules.map((sch) => (
                    <div
                        key={sch.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            backgroundColor: sch.active ? "#f8fafc" : "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            opacity: sch.active ? 1 : 0.6,
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{sch.time} — {sch.action}</div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>{sch.repeat}</div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => toggleSchedule(sch.id)}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    border: "none",
                                    backgroundColor: sch.active ? "#dcfce7" : "#e2e8f0",
                                    color: sch.active ? "#15803d" : "#64748b",
                                    cursor: "pointer",
                                }}
                            >
                                {sch.active ? "AKTIF" : "NONAKTIF"}
                            </button>

                            <button
                                type="button"
                                onClick={() => deleteSchedule(sch.id)}
                                style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
