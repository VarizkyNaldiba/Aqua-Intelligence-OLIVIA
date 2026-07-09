import { useState, useEffect } from "react";
import { 
    Database, Pencil, Trash2, X, Waves, Info, 
    Thermometer, Droplet, Eye, ShieldCheck, Wifi, Calendar, Fish 
} from "lucide-react";
import type { TabName } from "@/Types";

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
    selectedPondId: number;
    setSelectedPondId: (id: number) => void;
    setActiveTab: (tab: TabName) => void;
}

const PondsTab = ({
    selectedPondId,
    setSelectedPondId,
}: PondsTabProps) => {
    // Initial ponds data with Warning status and IoT states matching mockup directive
    const [ponds, setPonds] = useState<PondItem[]>([
        {
            id: 12,
            name: "Pond 12",
            location: "Sektor Utara, Blok 1",
            status: "Aman",
            iot: "Aktif",
            capacity: 1200,
            lastMaintained: "05 Jul 2026",
            temp: 28.2,
            ph: 7.2,
            turbidity: 18,
        },
        {
            id: 10,
            name: "Pond 10",
            location: "Sektor Utara, Blok 2",
            status: "Aman",
            iot: "Aktif",
            capacity: 950,
            lastMaintained: "03 Jul 2026",
            temp: 27.5,
            ph: 7.4,
            turbidity: 22,
        },
        {
            id: 9,
            name: "Pond 09",
            location: "Sektor Selatan, Blok 1",
            status: "Bahaya",
            iot: "Tidak Aktif",
            capacity: 800,
            lastMaintained: "20 Jun 2026",
            temp: 26.1,
            ph: 5.8,
            turbidity: 65,
        },
        {
            id: 4,
            name: "Pond 04",
            location: "Sektor Selatan, Blok 2",
            status: "Waspada",
            iot: "Aktif",
            capacity: 1500,
            lastMaintained: "08 Jul 2026",
            temp: 29.3,
            ph: 6.7,
            turbidity: 45,
        },
    ]);

    // Currently active selected pond for popup modal
    const [activePondId, setActivePondId] = useState<number>(9);
    
    // Popup modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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

    // Load active pond details into form when selection changes
    const activePond = ponds.find((p) => p.id === activePondId) || ponds[0];
    
    useEffect(() => {
        if (activePond) {
            setEditName(activePond.name);
            setEditLocation(activePond.location);
            setEditCapacity(activePond.capacity);
            setEditStatus(activePond.status);
            setEditIot(activePond.iot);
            setEditTemp(activePond.temp);
            setEditPh(activePond.ph);
            setEditTurbidity(activePond.turbidity);
        }
    }, [activePondId, ponds]);

    const handleSave = (e: React.FormEvent) => {
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

        setAlertMessage(`Pond ${editName} updated successfully.`);
        setIsModalOpen(false);
        setIsEditing(false);
        setTimeout(() => setAlertMessage(""), 4000);
    };

    const handleAddNewPond = () => {
        const nextNum = ponds.length + 1;
        const newPond: PondItem = {
            id: Date.now(),
            name: `Pond ${nextNum < 10 ? "0" : ""}${nextNum}`,
            location: `Sektor Selatan, Blok ${nextNum}`,
            status: "Aman",
            iot: "Aktif",
            capacity: 1000,
            lastMaintained: new Date().toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            temp: 28.0,
            ph: 7.2,
            turbidity: 30,
        };
        setPonds((prev) => [...prev, newPond]);
        setActivePondId(newPond.id);
        setIsEditing(true);
        setIsModalOpen(true);
        setAlertMessage(`New pond "${newPond.name}" added successfully!`);
        setTimeout(() => setAlertMessage(""), 4000);
    };

    const handleDeletePond = (id: number, name: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Avoid triggering row click details popup
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            setPonds((prev) => prev.filter((p) => p.id !== id));
            setAlertMessage(`Pond ${name} deleted.`);
            setTimeout(() => setAlertMessage(""), 4000);
        }
    };

    const handleEditClick = (pond: PondItem, e: React.MouseEvent) => {
        e.stopPropagation(); // Avoid triggering details popup
        setActivePondId(pond.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const getStatusClass = (status: "Aman" | "Waspada" | "Bahaya") => {
        if (status === "Aman") return "safe";
        if (status === "Waspada") return "warning";
        return "danger";
    };

    const handleRowClick = (id: number) => {
        setActivePondId(id);
        setIsEditing(false);
        setIsModalOpen(true);
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

            {/* Full-width Registered Ponds Table */}
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
                                return (
                                    <tr
                                        key={pond.id}
                                        onClick={() => handleRowClick(pond.id)}
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
                                                <div className="pm-pond-icon-circle">
                                                    <Waves size={16} />
                                                </div>
                                                <div style={{ textItems: "left", textAlign: "left" }}>
                                                    <div className="pm-pond-title">{pond.name}</div>
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

            {/* Popup Modal Dialog with Blurred Backdrop */}
            {isModalOpen && activePond && (
                <div className="pm-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="pm-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="pm-details-header">
                            <div>
                                <div className="pm-details-title">{activePond.name}</div>
                                <div className="pm-details-subtitle">
                                    {isEditing ? "Edit pond configuration" : "Real-time catfish pond overview"}
                                </div>
                            </div>
                            <button
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    padding: "4px",
                                    display: "flex"
                                }}
                                onClick={() => setIsModalOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {!isEditing ? (
                            /* READER MODE VIEWING ALL DETAILS */
                            <div className="pm-details-body">
                                {/* Subtitle location */}
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", marginTop: "-8px", marginBottom: "8px" }}>
                                    {activePond.location}
                                </div>

                                {/* 1. Parameter Sekarang (Current Parameters) */}
                                <div>
                                    <div className="pm-details-label" style={{ marginBottom: "12px", display: "block" }}>
                                        Parameter Sekarang
                                    </div>
                                    <div className="pm-details-param-grid">
                                        {/* Temp */}
                                        <div className="pm-details-param-card">
                                            <span className="pm-details-param-label">Suhu Air</span>
                                            <span className="pm-details-param-value" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", color: "#0ea5e9" }}>
                                                <Thermometer size={14} />
                                                {activePond.temp.toFixed(1)}°C
                                            </span>
                                        </div>
                                        {/* pH */}
                                        <div className="pm-details-param-card">
                                            <span className="pm-details-param-label">pH Air</span>
                                            <span className="pm-details-param-value" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", color: "#14b8a6" }}>
                                                <Droplet size={14} />
                                                {activePond.ph.toFixed(1)}
                                            </span>
                                        </div>
                                        {/* Turbidity */}
                                        <div className="pm-details-param-card">
                                            <span className="pm-details-param-label">Kekeruhan</span>
                                            <span className="pm-details-param-value" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", color: "#8b5cf6" }}>
                                                <Waves size={14} />
                                                {activePond.turbidity} NTU
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pm-details-divider" />

                                {/* 2. Detail Informasi List */}
                                <div>
                                    <div className="pm-details-label" style={{ marginBottom: "12px", display: "block" }}>
                                        Detail Informasi
                                    </div>

                                    {/* Jumlah Ikan */}
                                    <div className="pm-details-item-row">
                                        <span className="pm-details-item-label">
                                            <Fish size={15} color="#0ea5e9" />
                                            Jumlah Ikan
                                        </span>
                                        <span className="pm-details-item-value">
                                            {activePond.capacity.toLocaleString("id-ID")} ekor
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="pm-details-item-row">
                                        <span className="pm-details-item-label">
                                            <ShieldCheck size={15} color="#10b981" />
                                            Status Kolam
                                        </span>
                                        <span className={`pm-status-pill ${getStatusClass(activePond.status)}`}>
                                            <span
                                                style={{
                                                    width: "6px",
                                                    height: "6px",
                                                    backgroundColor: 
                                                        activePond.status === "Aman" ? "#10b981" : 
                                                        activePond.status === "Waspada" ? "#d97706" : "#ef4444",
                                                    borderRadius: "50%",
                                                    display: "inline-block",
                                                }}
                                            ></span>
                                            {activePond.status}
                                        </span>
                                    </div>

                                    {/* IoT */}
                                    <div className="pm-details-item-row">
                                        <span className="pm-details-item-label">
                                            <Wifi size={15} color="#0ea5e9" />
                                            IoT Connection
                                        </span>
                                        <span className={`pm-iot-pill ${activePond.iot === "Aktif" ? "active" : "inactive"}`}>
                                            <span
                                                style={{
                                                    width: "6px",
                                                    height: "6px",
                                                    backgroundColor: activePond.iot === "Aktif" ? "#0ea5e9" : "#64748b",
                                                    borderRadius: "50%",
                                                    display: "inline-block",
                                                }}
                                            ></span>
                                            {activePond.iot}
                                        </span>
                                    </div>

                                    {/* Last Maintenance */}
                                    <div className="pm-details-item-row" style={{ borderBottom: "none" }}>
                                        <span className="pm-details-item-label">
                                            <Calendar size={15} color="#8b5cf6" />
                                            Terakhir Diperbarui
                                        </span>
                                        <span className="pm-details-item-value" style={{ color: "#64748b" }}>
                                            {activePond.lastMaintained}
                                        </span>
                                    </div>
                                </div>

                                {/* Button Block to switch to edit mode */}
                                <div style={{ marginTop: "12px" }}>
                                    <button 
                                        className="pm-btn-full" 
                                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Pencil size={15} />
                                        <span>Edit Pond Configuration</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* EDIT MODE FORM */
                            <form onSubmit={handleSave} className="pm-details-body">
                                {/* Pond Name Input */}
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

                                {/* Location Input */}
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

                                {/* Fish Capacity Input */}
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

                                {/* Warning Status Select */}
                                <div className="pm-details-field">
                                    <label className="pm-details-label">Pond Status</label>
                                    <select
                                        className="pm-input"
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value as "Aman" | "Waspada" | "Bahaya")}
                                    >
                                        <option value="Aman">Aman</option>
                                        <option value="Waspada">Waspada</option>
                                        <option value="Bahaya">Bahaya</option>
                                    </select>
                                </div>

                                {/* IoT Connection Select */}
                                <div className="pm-details-field">
                                    <label className="pm-details-label">IoT Connection State</label>
                                    <select
                                        className="pm-input"
                                        value={editIot}
                                        onChange={(e) => setEditIot(e.target.value as "Aktif" | "Tidak Aktif")}
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Tidak Aktif">Tidak Aktif</option>
                                    </select>
                                </div>

                                {/* Static Telemetry Inputs for demo testing */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                                    <div className="pm-details-field">
                                        <label className="pm-details-label">Suhu (°C)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="pm-input"
                                            value={editTemp}
                                            onChange={(e) => setEditTemp(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="pm-details-field">
                                        <label className="pm-details-label">pH</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="pm-input"
                                            value={editPh}
                                            onChange={(e) => setEditPh(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="pm-details-field">
                                        <label className="pm-details-label">Kekeruhan</label>
                                        <input
                                            type="number"
                                            className="pm-input"
                                            value={editTurbidity}
                                            onChange={(e) => setEditTurbidity(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="pm-btn-block">
                                    <button type="submit" className="pm-btn-full">
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        className="pm-btn-cancel"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

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
