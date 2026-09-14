import { useState, useEffect } from "react";
import { 
    Database, Pencil, Trash2, X, Waves, Info, 
    Thermometer, Droplet, ShieldCheck, Wifi, Calendar, Fish 
} from "lucide-react";
import type { TabName, SensorRow } from "@/Types";

interface PondItem {
    id: number;
    name: string;
    location: string;
    status: "Aman" | "Waspada" | "Bahaya";
    iot: "Aktif" | "Tidak Aktif";
    capacity: number;
    lastMaintained: string;
    // Current parameters for telemetry details
    temp: number;
    ph: number;
    turbidity: number;
}

interface PondsTabProps {
    currentData?: SensorRow | null;
    selectedPondId: number;
    setSelectedPondId: (id: number) => void;
    setActiveTab: (tab: TabName) => void;
}

const PondsTab = ({
    currentData: _currentData,
    selectedPondId: _selectedPondId,
    setSelectedPondId: _setSelectedPondId,
}: PondsTabProps) => {
    // Single active dynamic IoT pond
    // Dynamic IoT Ponds list state
    const [ponds, setPonds] = useState<PondItem[]>([
        {
            id: 1,
            name: "Kolam TFS 1",
            location: "Kolam Riset IoT TFS (ESP32-CATFISHCARE-001)",
            status: "Aman",
            iot: "Aktif",
            capacity: 1000,
            lastMaintained: "19 Agu 2026",
            temp: 27.5,
            ph: 7.2,
            turbidity: 18,
        },
    ]);

    // Live Telemetry Sync for Pond list based on active IoT ESP32 devices
    useEffect(function syncPondTelemetry() {
        const syncTelemetry = async () => {
            try {
                // 1. Fetch latest telemetry for Kolam 1
                const telemRes = await fetch("/api/telemetry/latest/1");
                let telem: any = null;
                if (telemRes.ok) {
                    const json = await telemRes.json();
                    telem = json.telemetry;
                }

                const isPrimaryOnline = telem && !telem.is_simulated;
                const statusVal = telem
                    ? (telem.risk_status === "High" || telem.risk_status === "Critical" ? "Bahaya" : telem.risk_status === "Medium" ? "Waspada" : "Aman")
                    : "Aman";

                setPonds((prevPonds) =>
                    prevPonds.map((p) => {
                        if (p.id === 1) {
                            return {
                                ...p,
                                status: telem ? statusVal : p.status,
                                iot: isPrimaryOnline ? "Aktif" : "Tidak Aktif",
                                temp: telem ? Number(telem.suhu ?? p.temp) : p.temp,
                                ph: telem ? Number(telem.ph ?? p.ph) : p.ph,
                                turbidity: telem ? Number(telem.kekeruhan ?? p.turbidity) : p.turbidity,
                            };
                        }
                        return p;
                    })
                );
            } catch {
                // Ignore
            }
        };

        syncTelemetry();
        const interval = setInterval(syncTelemetry, 3000);
        return function cleanupPondTelemetry() {
            clearInterval(interval);
        };
    }, []);

    // Currently active selected pond
    const [activePondId, setActivePondId] = useState<number>(1);
    
    // Panel mode: "edit" for active pond, "create" for adding new pond
    const [panelMode, setPanelMode] = useState<"edit" | "create">("edit");
    const [createName, setCreateName] = useState("");
    const [createLocation, setCreateLocation] = useState("");
    const [createCapacity, setCreateCapacity] = useState<number>(1000);
    const [createPondHeight, setCreatePondHeight] = useState<number>(40.0);

    // Form fields state for editing
    const [editName, setEditName] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editCapacity, setEditCapacity] = useState<number>(0);
    const [editStatus, setEditStatus] = useState<"Aman" | "Waspada" | "Bahaya">("Aman");
    const [editIot, setEditIot] = useState<"Aktif" | "Tidak Aktif">("Aktif");
    const [editTemp, setEditTemp] = useState<number>(28.0);
    const [editPh, setEditPh] = useState<number>(7.0);
    const [editTurbidity, setEditTurbidity] = useState<number>(30);

    const [alertMessage, setAlertMessage] = useState("");

    // Custom cursor-following tooltip state
    const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipCoords, setTooltipCoords] = useState({ x: 0, y: 0 });

    // Threshold Settings state
    const [thresholdData, setThresholdData] = useState<any>(null);
    const [isCustomThreshold, setIsCustomThreshold] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState<"info" | "thresholds" | "calibration">("info");
    const [thresholdSaving, setThresholdSaving] = useState(false);

    // Hardware Calibration state (Buffer 7.0/4.01, V_clear, TDS, Height, Temp Offset)
    const [calibrationData, setCalibrationData] = useState<any>({
        ph_v7: 2.50,
        ph_v4: 3.05,
        turbidity_v_clear: 4.20,
        tds_factor: 0.50,
        pond_height: 100.0,
        temp_offset: 0.0,
    });
    const [isCustomCalibration, setIsCustomCalibration] = useState(false);
    const [calibrationSaving, setCalibrationSaving] = useState(false);

    const activePond = ponds.find((p) => p.id === activePondId) || ponds[0];

    // Load active pond details into form ONLY when activePondId changes
    useEffect(() => {
        const found = ponds.find((p) => p.id === activePondId) || ponds[0];
        if (found) {
            setEditName(found.name);
            setEditLocation(found.location);
            setEditCapacity(found.capacity);
            setEditStatus(found.status);
            setEditIot(found.iot);
            setEditTemp(found.temp);
            setEditPh(found.ph);
            setEditTurbidity(found.turbidity);
        }
    }, [activePondId]);

    // Fetch pond thresholds & hardware calibration when selected pond changes
    useEffect(() => {
        if (activePondId) {
            fetch(`/api/thresholds/${activePondId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.thresholds) {
                        setThresholdData(data.thresholds);
                        setIsCustomThreshold(Boolean(data.is_custom));
                    }
                })
                .catch(() => {});

            fetch(`/api/calibration/${activePondId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.calibration) {
                        setCalibrationData(data.calibration);
                        setIsCustomCalibration(Boolean(data.is_custom));
                    }
                })
                .catch(() => {});
        }
    }, [activePondId]);

    const handleSaveThresholds = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!thresholdData) return;
        setThresholdSaving(true);
        try {
            const res = await fetch("/api/thresholds/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kolam_id: activePondId,
                    thresholds: thresholdData,
                }),
            });
            if (res.ok) {
                const json = await res.json();
                setAlertMessage(json.message || "Threshold updated successfully!");
                setIsCustomThreshold(true);
                setTimeout(() => setAlertMessage(""), 4000);
            }
        } catch {
            setAlertMessage("Gagal menyimpan threshold.");
        } finally {
            setThresholdSaving(false);
        }
    };

    const handleResetThresholds = async () => {
        if (!confirm("Kembalikan ambang batas kolam ke nilai Paper Default (CatfishCare 2026)?")) return;
        setThresholdSaving(true);
        try {
            const res = await fetch("/api/thresholds/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kolam_id: activePondId }),
            });
            if (res.ok) {
                const json = await res.json();
                setAlertMessage(json.message || "Threshold reset to Paper Default!");
                setIsCustomThreshold(false);
                const getRes = await fetch(`/api/thresholds/${activePondId}`);
                const getJson = await getRes.json();
                if (getJson.thresholds) setThresholdData(getJson.thresholds);
                setTimeout(() => setAlertMessage(""), 4000);
            }
        } catch {
            setAlertMessage("Gagal reset threshold.");
        } finally {
            setThresholdSaving(false);
        }
    };

    const handleSaveCalibration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!calibrationData) return;
        setCalibrationSaving(true);
        try {
            const res = await fetch("/api/calibration/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kolam_id: activePondId,
                    calibration: calibrationData,
                }),
            });
            if (res.ok) {
                const json = await res.json();
                setAlertMessage(json.message || "Hardware calibration updated successfully!");
                setIsCustomCalibration(true);
                setTimeout(() => setAlertMessage(""), 4000);
            }
        } catch {
            setAlertMessage("Gagal menyimpan kalibrasi hardware.");
        } finally {
            setCalibrationSaving(false);
        }
    };

    const handleResetCalibration = async () => {
        if (!confirm("Kembalikan kalibrasi hardware ke nilai standar pengujian (pH 7=2.50V, pH 4=3.05V, V_clear=4.20V, TDS=0.50, Height=100cm, Temp=0°C)?")) return;
        setCalibrationSaving(true);
        try {
            const res = await fetch("/api/calibration/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kolam_id: activePondId }),
            });
            if (res.ok) {
                const json = await res.json();
                setAlertMessage(json.message || "Hardware calibration reset to tested defaults!");
                setIsCustomCalibration(false);
                setCalibrationData({
                    ph_v7: 2.50,
                    ph_v4: 3.05,
                    turbidity_v_clear: 4.20,
                    tds_factor: 0.50,
                    pond_height: 100.0,
                    temp_offset: 0.0,
                });
                setTimeout(() => setAlertMessage(""), 4000);
            }
        } catch {
            setAlertMessage("Gagal reset kalibrasi hardware.");
        } finally {
            setCalibrationSaving(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setPonds((prev) =>
            prev.map((p) =>
                p.id === activePondId
                    ? {
                          ...p,
                          name: editName,
                          location: editLocation,
                          capacity: editCapacity,
                          status: editStatus,
                          iot: editIot,
                          temp: editTemp,
                          ph: editPh,
                          turbidity: editTurbidity,
                      }
                    : p
            )
        );

        try {
            await fetch("/api/calibration/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kolam_id: activePondId,
                    calibration: calibrationData,
                }),
            });
            setIsCustomCalibration(true);
        } catch (err) {
            console.error("Gagal menyimpan tinggi kolam ke API:", err);
        }

        setAlertMessage(`Pond ${editName} updated successfully.`);
        setTimeout(() => setAlertMessage(""), 4000);
    };

    const handleAddNewPond = () => {
        const nextNum = ponds.length + 1;
        setCreateName(`Kolam TFS ${nextNum}`);
        setCreateLocation(`Sektor Utama (ESP32-00${nextNum})`);
        setCreateCapacity(1000);
        setCreatePondHeight(40.0);
        setPanelMode("create");
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newId = Date.now();
        const newPond: PondItem = {
            id: newId,
            name: createName || `Kolam TFS ${ponds.length + 1}`,
            location: createLocation || "Sektor Utama",
            status: "Aman",
            iot: "Tidak Aktif",
            capacity: createCapacity || 1000,
            lastMaintained: new Date().toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            temp: 27.5,
            ph: 7.2,
            turbidity: 18.0,
        };
        setPonds((prev) => [...prev, newPond]);
        setActivePondId(newId);

        try {
            await fetch("/api/calibration/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kolam_id: newId,
                    calibration: { ...calibrationData, pond_height: createPondHeight },
                }),
            });
        } catch {}

        setPanelMode("edit");
        setActiveModalTab("info");
        setAlertMessage(`Kolam baru "${newPond.name}" berhasil ditambahkan!`);
        setTimeout(() => setAlertMessage(""), 4000);
    };

    const handleDeletePond = (id: number, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            setPonds((prev) => prev.filter((p) => p.id !== id));
            setAlertMessage(`Pond ${name} deleted.`);
            setTimeout(() => setAlertMessage(""), 4000);
        }
    };

    const handleEditClick = (pond: PondItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setActivePondId(pond.id);
        setPanelMode("edit");
    };

    const getStatusClass = (status: "Aman" | "Waspada" | "Bahaya") => {
        if (status === "Aman") return "safe";
        if (status === "Waspada") return "warning";
        return "danger";
    };

    const handleRowClick = (id: number) => {
        setActivePondId(id);
        setPanelMode("edit");
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", width: "100%" }}>
            {/* Title Area */}
            <div className="pm-header-row">
                <div>
                    <h2 className="db-title">Manage Your Catfish Ponds</h2>
                    <p className="db-subtitle">View, edit, and monitor all registered ponds</p>
                </div>
                <button className="db-btn-cyan" onClick={handleAddNewPond} style={{ gap: "6px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700 }}>+</span>
                    <span>Add New Pond</span>
                </button>
            </div>

            {alertMessage && (
                <div
                    className="auth-alert-new"
                    style={{
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        borderColor: "rgba(16, 185, 129, 0.2)",
                        color: "#34d399",
                        marginBottom: "0",
                    }}
                >
                    <Info size={16} />
                    <span>{alertMessage}</span>
                </div>
            )}

            {/* Split Page Container Layout */}
            <div className="pm-split-container">
                {/* Left Column: Registered Ponds Table */}
                <div className="pm-table-card" style={{ width: "100%", boxSizing: "border-box" }}>
                    <div className="pm-table-card-header">
                        <Database size={16} />
                        <span>{ponds.length} ponds registered</span>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table className="pm-table">
                            <thead>
                                <tr>
                                    <th>Pond Name</th>
                                    <th>Status</th>
                                    <th>IoT</th>
                                    <th>Capacity (Fish)</th>
                                    <th>Last Maintained</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ponds.map((pond) => {
                                    const isSelected = pond.id === activePondId;
                                    return (
                                        <tr
                                            key={pond.id}
                                            onClick={() => handleRowClick(pond.id)}
                                            className={isSelected ? "pm-table-row-selected" : ""}
                                            style={{ cursor: "pointer" }}
                                            onMouseEnter={() => {
                                                setHoveredRowId(pond.id);
                                                setTooltipVisible(true);
                                            }}
                                            onMouseMove={(e) => {
                                                setTooltipCoords({ x: e.clientX + 15, y: e.clientY + 15 });
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredRowId(null);
                                                setTooltipVisible(false);
                                            }}
                                        >
                                            <td>
                                                <div className="pm-pond-name-cell">
                                                    <div className="pm-pond-icon-circle" style={{ backgroundColor: isSelected ? "rgba(14, 165, 233, 0.2)" : undefined }}>
                                                        <Waves size={16} color={isSelected ? "#0ea5e9" : undefined} />
                                                    </div>
                                                    <div style={{ textAlign: "left" }}>
                                                        <div className="pm-pond-title" style={{ fontWeight: isSelected ? 700 : 600 }}>{pond.name}</div>
                                                        <div className="pm-pond-location">{pond.location}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`pm-status-pill ${getStatusClass(pond.status)}`}>
                                                    <span
                                                        style={{
                                                            width: "6px",
                                                            height: "6px",
                                                            backgroundColor: 
                                                                pond.status === "Aman" ? "#10b981" : 
                                                                pond.status === "Waspada" ? "#d97706" : "#ef4444",
                                                            borderRadius: "50%",
                                                            display: "inline-block",
                                                        }}
                                                    ></span>
                                                    {pond.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`pm-iot-pill ${pond.iot === "Aktif" ? "active" : "inactive"}`}>
                                                    <span
                                                        style={{
                                                            width: "6px",
                                                            height: "6px",
                                                            backgroundColor: pond.iot === "Aktif" ? "#0ea5e9" : "#64748b",
                                                            borderRadius: "50%",
                                                            display: "inline-block",
                                                        }}
                                                    ></span>
                                                    {pond.iot}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="pm-capacity-text">
                                                    {pond.capacity.toLocaleString("id-ID")} ekor
                                                </div>
                                            </td>
                                            <td>
                                                <div className="pm-maintained-text">{pond.lastMaintained}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                    <button
                                                        className="pm-action-btn"
                                                        title="Edit configuration"
                                                        onClick={(e) => handleEditClick(pond, e)}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        className="pm-action-btn delete"
                                                        title="Delete pond"
                                                        onClick={(e) => handleDeletePond(pond.id, pond.name, e)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Active Pond Configuration (Split View Panel 30% Landscape) */}
                <div className="pm-table-card" style={{ width: "100%", boxSizing: "border-box", padding: "20px" }}>
                    <div className="pm-details-header" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div className="pm-details-title" style={{ fontSize: "18px", fontWeight: 700 }}>
                                {panelMode === "create" ? "Tambah Kolam Baru" : activePond?.name}
                            </div>
                            <div className="pm-details-subtitle" style={{ fontSize: "12px", color: "#64748b" }}>
                                {panelMode === "create" ? "Form pendaftaran kolam lele baru" : activePond?.location}
                            </div>
                        </div>
                        {panelMode === "create" && (
                            <div>
                                <button
                                    type="button"
                                    className="pm-btn-cancel"
                                    style={{ padding: "4px 10px", fontSize: "11px" }}
                                    onClick={() => setPanelMode("edit")}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {panelMode === "create" ? (
                        /* CREATE FORM IN STATIC PANEL */
                        <form onSubmit={handleCreateSubmit}>
                            <div className="pm-details-field">
                                <label className="pm-details-label">Pond Name</label>
                                <input
                                    type="text"
                                    className="pm-input"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    placeholder="Contoh: Kolam TFS 2"
                                    required
                                />
                            </div>

                            <div className="pm-details-field">
                                <label className="pm-details-label">Location</label>
                                <input
                                    type="text"
                                    className="pm-input"
                                    value={createLocation}
                                    onChange={(e) => setCreateLocation(e.target.value)}
                                    placeholder="Contoh: Sektor Utama, Blok 2"
                                    required
                                />
                            </div>

                            <div className="pm-details-field">
                                <label className="pm-details-label">Fish Capacity (ekor)</label>
                                <input
                                    type="number"
                                    className="pm-input"
                                    value={createCapacity}
                                    onChange={(e) => setCreateCapacity(Number(e.target.value))}
                                    placeholder="1000"
                                    required
                                />
                            </div>

                            <div className="pm-details-field">
                                <label className="pm-details-label">Tinggi Kolam (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="pm-input"
                                    value={createPondHeight}
                                    onChange={(e) => setCreatePondHeight(Number(e.target.value))}
                                    placeholder="40.0"
                                    required
                                />
                            </div>

                            <div className="pm-btn-block" style={{ marginTop: "20px" }}>
                                <button type="submit" className="pm-btn-full">
                                    + Create Pond
                                </button>
                            </div>
                        </form>                    ) : (
                        /* EDIT FORM IN STATIC PANEL (ONLY 4 FIELDS, NO EXTRA TABS) */
                        <form onSubmit={handleSave}>
                            <div className="pm-details-field">
                                <label className="pm-details-label">Pond Name</label>
                                <input
                                    type="text"
                                    className="pm-input"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter pond name"
                                    required
                                />
                            </div>

                            <div className="pm-details-field">
                                <label className="pm-details-label">Location</label>
                                <input
                                    type="text"
                                    className="pm-input"
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    placeholder="Enter sector and block location"
                                    required
                                />
                            </div>

                            <div className="pm-details-field">
                                <label className="pm-details-label">Fish Capacity (ekor)</label>
                                <input
                                    type="number"
                                    className="pm-input"
                                    value={editCapacity}
                                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                                    placeholder="Enter capacity limit"
                                    required
                                />
                            </div>

                            <div className="pm-details-field">
                                <label className="pm-details-label">Tinggi Kolam (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="pm-input"
                                    value={calibrationData?.pond_height ?? 100.0}
                                    onChange={(e) =>
                                        setCalibrationData({
                                            ...calibrationData,
                                            pond_height: Number(e.target.value),
                                        })
                                    }
                                    placeholder="Contoh: 40.0"
                                    required
                                />
                            </div>

                            <div className="pm-btn-block" style={{ marginTop: "20px" }}>
                                <button type="submit" className="pm-btn-full">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Custom cursor-following tooltip */}
            {tooltipVisible && hoveredRowId !== null && (
                <div 
                    style={{
                        position: "fixed",
                        left: tooltipCoords.x,
                        top: tooltipCoords.y,
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        color: "#ffffff",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        pointerEvents: "none",
                        zIndex: 9999,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                    }}
                >
                    <Info size={14} color="#38bdf8" />
                    <span>Tekan untuk melihat detail</span>
                </div>
            )}
        </div>
    );
};

export default PondsTab;
