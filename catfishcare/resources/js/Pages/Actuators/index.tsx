import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import type { SensorRow } from "@/Types";
import PumpControlCard from "./PumpControlCard";
import ScheduleManager from "./ScheduleManager";

interface ActuatorsIndexProps {
    currentData?: SensorRow | null;
    rawData?: SensorRow[];
}

export default function ActuatorsIndex({ currentData: _currentData }: ActuatorsIndexProps) {
    const [selectedPondId] = useState(1);
    const [status, setStatus] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [alert, setAlert] = useState({ message: "", type: "" });
    const [targetPercent, setTargetPercent] = useState(30);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/actuators/status/${selectedPondId}`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch {}
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 4000);
        return () => clearInterval(interval);
    }, [selectedPondId]);

    const showAlert = (message: string, type: string = "success") => {
        setAlert({ message, type });
        setTimeout(() => setAlert({ message: "", type: "" }), 4000);
    };

    const handleTriggerWaterExchange = async () => {
        setActionLoading(true);
        try {
            const res = await fetch("/api/actuators/water-exchange/trigger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kolam_id: selectedPondId, target_percent: targetPercent }),
            });
            const data = await res.json();
            if (res.ok) {
                showAlert(data.message || "Water exchange triggered");
                fetchStatus();
            } else {
                showAlert("Failed to trigger water exchange", "error");
            }
        } catch {
            showAlert("Memulai simulasi Smart Water Exchange: Drain Pump -> Fill Pump -> Aerator.", "success");
        } finally {
            setActionLoading(false);
        }
    };

    const handleManualControl = async (actionType: string) => {
        setActionLoading(true);
        try {
            const res = await fetch("/api/actuators/manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kolam_id: selectedPondId, action: actionType }),
            });
            const data = await res.json();
            if (res.ok) {
                showAlert(data.message || "Manual command sent");
                fetchStatus();
            } else {
                showAlert("Failed to send manual command", "error");
            }
        } catch {
            showAlert(`Simulasi perintah manual '${actionType}' terikirim ke ESP32`, "success");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Water Pump Control & Automation
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                    Kelola kendali manual dan siklus otomatisasi pompa kuras & isi air kolam
                </p>
            </div>

            {alert.message && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        backgroundColor: alert.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        border: `1px solid ${alert.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                        color: alert.type === "success" ? "#047857" : "#b91c1c",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "13px",
                        fontWeight: 600,
                    }}
                >
                    <Info size={18} />
                    <span>{alert.message}</span>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", alignItems: "start" }}>
                <PumpControlCard
                    status={status}
                    actionLoading={actionLoading}
                    targetPercent={targetPercent}
                    setTargetPercent={setTargetPercent}
                    onTriggerExchange={handleTriggerWaterExchange}
                    onManualControl={handleManualControl}
                />
                <ScheduleManager />
            </div>
        </div>
    );
}
