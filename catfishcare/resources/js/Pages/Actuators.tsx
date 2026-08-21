import { useState, useEffect } from "react";
import { Droplets, RefreshCw, Power, Settings, Info, Activity } from "lucide-react";

interface ActuatorsProps {
    selectedPondId: number;
}

export default function Actuators({ selectedPondId }: ActuatorsProps) {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [alert, setAlert] = useState({ message: "", type: "" });
    const [targetPercent, setTargetPercent] = useState(30);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/actuators/status/${selectedPondId}`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch actuator status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
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
                body: JSON.stringify({ kolam_id: selectedPondId, target_percent: targetPercent })
            });
            const data = await res.json();
            if (res.ok) {
                showAlert(data.message || "Water exchange triggered successfully");
                fetchStatus();
            } else {
                showAlert(data.message || "Failed to trigger water exchange", "error");
            }
        } catch (error) {
            showAlert("Error communicating with server", "error");
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
                body: JSON.stringify({ kolam_id: selectedPondId, action: actionType })
            });
            const data = await res.json();
            if (res.ok) {
                showAlert(data.message || "Manual command sent successfully");
                fetchStatus();
            } else {
                showAlert(data.message || "Failed to send manual command", "error");
            }
        } catch (error) {
            showAlert("Error communicating with server", "error");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="tab-pane">
            <div className="db-heading-area" style={{ marginBottom: "24px" }}>
                <h2 className="db-title">Water Pump Control</h2>
                <p className="db-subtitle">Control and monitor your smart water exchange system</p>
            </div>

            {alert.message && (
                <div
                    className="auth-alert-new"
                    style={{
                        backgroundColor: alert.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        borderColor: alert.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: alert.type === "success" ? "#34d399" : "#f87171",
                        marginBottom: "24px",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <Info size={18} />
                    <span style={{ fontWeight: 500 }}>{alert.message}</span>
                </div>
            )}

            <div className="db-main-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Status Card */}
                <div className="db-panel-card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Activity size={20} color="#0ea5e9" />
                            System Status & Manual Override
                        </h3>
                        <button 
                            onClick={fetchStatus} 
                            disabled={loading}
                            style={{ 
                                background: "none", border: "none", cursor: "pointer", 
                                color: "#64748b", display: "flex", alignItems: "center", 
                                padding: "4px", borderRadius: "6px" 
                            }}
                        >
                            <RefreshCw size={16} className={loading ? "spin" : ""} />
                        </button>
                    </div>

                    {loading && !status ? (
                        <p style={{ color: "#64748b", fontStyle: "italic" }}>Loading status...</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "var(--bg-card-alt)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ padding: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "6px", color: "#ef4444" }}>
                                        <Droplets size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>Drain Pump (OUT)</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Removes dirty water</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ fontWeight: 700, color: status?.drain_pump ? "#ef4444" : "#64748b", minWidth: "60px", textAlign: "right" }}>
                                        {status?.drain_pump ? "ACTIVE" : "OFF"}
                                    </div>
                                    <button 
                                        onClick={() => handleManualControl(status?.drain_pump ? "pump_out_off" : "pump_out_on")}
                                        disabled={actionLoading}
                                        className="btn"
                                        style={{ 
                                            padding: "6px 12px", 
                                            fontSize: "12px", 
                                            backgroundColor: status?.drain_pump ? "rgba(239, 68, 68, 0.1)" : "rgba(100, 116, 139, 0.1)",
                                            color: status?.drain_pump ? "#ef4444" : "var(--text-main)",
                                            border: `1px solid ${status?.drain_pump ? "rgba(239, 68, 68, 0.3)" : "rgba(100, 116, 139, 0.3)"}`,
                                            minHeight: "unset", height: "auto"
                                        }}
                                    >
                                        {status?.drain_pump ? "Turn OFF" : "Turn ON"}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "var(--bg-card-alt)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ padding: "8px", backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: "6px", color: "#10b981" }}>
                                        <Droplets size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>Fill Pump (IN)</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Adds clean water</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ fontWeight: 700, color: status?.fill_pump ? "#10b981" : "#64748b", minWidth: "60px", textAlign: "right" }}>
                                        {status?.fill_pump ? "ACTIVE" : "OFF"}
                                    </div>
                                    <button 
                                        onClick={() => handleManualControl(status?.fill_pump ? "pump_in_off" : "pump_in_on")}
                                        disabled={actionLoading}
                                        className="btn"
                                        style={{ 
                                            padding: "6px 12px", 
                                            fontSize: "12px", 
                                            backgroundColor: status?.fill_pump ? "rgba(16, 185, 129, 0.1)" : "rgba(100, 116, 139, 0.1)",
                                            color: status?.fill_pump ? "#10b981" : "var(--text-main)",
                                            border: `1px solid ${status?.fill_pump ? "rgba(16, 185, 129, 0.3)" : "rgba(100, 116, 139, 0.3)"}`,
                                            minHeight: "unset", height: "auto"
                                        }}
                                    >
                                        {status?.fill_pump ? "Turn OFF" : "Turn ON"}
                                    </button>
                                </div>
                            </div>
                            
                            <div style={{ marginTop: "12px" }}>
                                <button
                                    onClick={() => handleManualControl("all_pumps_off")}
                                    disabled={actionLoading || (!status?.drain_pump && !status?.fill_pump)}
                                    className="btn"
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        backgroundColor: (!status?.drain_pump && !status?.fill_pump) ? "rgba(100, 116, 139, 0.05)" : "rgba(239, 68, 68, 0.1)",
                                        color: (!status?.drain_pump && !status?.fill_pump) ? "#94a3b8" : "#ef4444",
                                        border: `1px solid ${(!status?.drain_pump && !status?.fill_pump) ? "rgba(100, 116, 139, 0.1)" : "rgba(239, 68, 68, 0.3)"}`,
                                        fontWeight: 600
                                    }}
                                >
                                    Emergency Stop All Pumps
                                </button>
                            </div>

                            <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
                                Last updated: {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Card */}
                <div className="db-panel-card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                        <Settings size={20} color="#8b5cf6" />
                        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>Smart Auto Cycle</h3>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "var(--text-main)" }}>
                                Target Water Exchange (%)
                            </label>
                            <input 
                                type="range" 
                                min="10" 
                                max="100" 
                                step="10"
                                value={targetPercent} 
                                onChange={(e) => setTargetPercent(Number(e.target.value))}
                                style={{ width: "100%", accentColor: "#0ea5e9" }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                                <span>10%</span>
                                <span style={{ fontWeight: 700, color: "#0ea5e9", fontSize: "14px" }}>{targetPercent}%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        <div style={{ backgroundColor: "rgba(14, 165, 233, 0.05)", padding: "16px", borderRadius: "8px", border: "1px dashed rgba(14, 165, 233, 0.3)" }}>
                            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-main)", lineHeight: 1.5 }}>
                                This will trigger the smart water exchange cycle. The system will automatically drain {targetPercent}% of the water and refill it with clean water.
                            </p>
                            
                            <button 
                                onClick={handleTriggerWaterExchange}
                                disabled={actionLoading || status?.drain_pump || status?.fill_pump}
                                className="btn btn-primary"
                                style={{ 
                                    width: "100%", 
                                    display: "flex", 
                                    justifyContent: "center", 
                                    alignItems: "center", 
                                    gap: "8px",
                                    padding: "12px",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    backgroundColor: (status?.drain_pump || status?.fill_pump) ? "#94a3b8" : "#0ea5e9",
                                    opacity: actionLoading ? 0.7 : 1
                                }}
                            >
                                <Power size={18} />
                                {actionLoading ? "Triggering..." : (status?.drain_pump || status?.fill_pump) ? "Cycle in Progress" : "Start Water Exchange"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
