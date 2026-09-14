import { useState, useEffect } from "react";
import { Plus, Fish, Info } from "lucide-react";
import PondCard, { type PondItem } from "./PondCard";
import PondFormModal from "./PondFormModal";
import { formatWibDetail } from "@/Utils/dateUtils";

export default function PondsIndex() {
    const [ponds, setPonds] = useState<PondItem[]>(() => {
        try {
            const saved = localStorage.getItem("catfish_ponds_list");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return [
            { id: 1, name: "Kolam TFS 1",        location: "Kolam Riset IoT TFS",   status: "Aman",    iot: "Aktif",       capacity: 1000, lastMaintained: "—", temp: 27.5, ph: 7.2, turbidity: 18 },
            { id: 2, name: "Kolam Bioflok 2",     location: "Sektor Utara No. 4",    status: "Aman",    iot: "Tidak Aktif", capacity: 1500, lastMaintained: "—", temp: 28.0, ph: 7.0, turbidity: 22 },
            { id: 3, name: "Kolam Pembibitan 3",  location: "Sektor Barat No. 2",    status: "Aman",    iot: "Tidak Aktif", capacity: 800,  lastMaintained: "—", temp: 27.2, ph: 6.9, turbidity: 15 },
            { id: 4, name: "Kolam Karantina 4",   location: "Fasilitas Isolasi",     status: "Waspada", iot: "Tidak Aktif", capacity: 500,  lastMaintained: "—", temp: 29.1, ph: 6.3, turbidity: 42 },
        ];
    });

    const [selectedPondId, setSelectedPondId] = useState<number>(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editingPond, setEditingPond] = useState<PondItem | null>(null);
    const [alertMessage, setAlertMessage] = useState("");

    // Fetch live telemetry for each pond and merge into pond state
    useEffect(() => {
        const fetchAllTelemetry = async () => {
            const updated = await Promise.all(
                ponds.map(async (pond) => {
                    if (pond.iot !== "Aktif") return pond; // only fetch for active IoT ponds
                    try {
                        const res = await fetch(`/api/telemetry/latest/${pond.id}`);
                        if (!res.ok) return pond;
                        const data = await res.json();
                        const raw = data.telemetry || data.data;
                        if (!raw) return pond;
                        const updatedAt = raw.updated_at
                            ? formatWibDetail(raw.updated_at)
                            : pond.lastMaintained;
                        return {
                            ...pond,
                            temp:          parseFloat(raw.suhu      ?? raw.TEMPERATURE ?? pond.temp),
                            ph:            parseFloat(raw.ph        ?? raw.pH          ?? pond.ph),
                            turbidity:     parseFloat(raw.kekeruhan ?? raw.TURBIDITY   ?? pond.turbidity),
                            lastMaintained: updatedAt,
                            status: (parseFloat(raw.risk_score ?? 0) > 60 ? "Bahaya" : parseFloat(raw.risk_score ?? 0) > 30 ? "Waspada" : "Aman") as PondItem["status"],
                        };
                    } catch {
                        return pond;
                    }
                })
            );
            setPonds(updated);
        };

        fetchAllTelemetry();
        const interval = setInterval(fetchAllTelemetry, 10000);
        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const savePondsToStorage = (nextPonds: PondItem[]) => {
        setPonds(nextPonds);
        try {
            localStorage.setItem("catfish_ponds_list", JSON.stringify(nextPonds));
            window.dispatchEvent(new Event("ponds_updated"));
        } catch {}
    };

    const handleCreateNew = () => {
        setFormMode("create");
        setEditingPond(null);
        setIsFormOpen(true);
    };

    const handleEditPond = (pond: PondItem) => {
        setFormMode("edit");
        setEditingPond(pond);
        setIsFormOpen(true);
    };

    const handleDeletePond = (id: number) => {
        if (id === 1) return;
        const next = ponds.filter((p) => p.id !== id);
        savePondsToStorage(next);
        if (selectedPondId === id) setSelectedPondId(1);
        setAlertMessage("Kolam berhasil dihapus.");
        setTimeout(() => setAlertMessage(""), 3000);
    };

    const handleSaveForm = (formData: Partial<PondItem>) => {
        if (formMode === "create") {
            const newPond: PondItem = {
                id: Date.now(),
                name:           formData.name     || "Kolam Baru",
                location:       formData.location || "Sektor Baru",
                status:         "Aman",
                iot:            "Tidak Aktif",
                capacity:       formData.capacity || 1000,
                lastMaintained: formatWibDetail(new Date()),
                temp:           28.0,
                ph:             7.0,
                turbidity:      20,
            };
            const next = [...ponds, newPond];
            savePondsToStorage(next);
            setAlertMessage(`Kolam ${newPond.name} berhasil ditambahkan!`);
        } else if (editingPond) {
            const next = ponds.map((p) =>
                p.id === editingPond.id
                    ? { ...p, name: formData.name || p.name, location: formData.location || p.location, capacity: formData.capacity || p.capacity }
                    : p
            );
            savePondsToStorage(next);
            setAlertMessage(`Kolam ${formData.name} berhasil diperbarui!`);
        }
        setTimeout(() => setAlertMessage(""), 3000);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header Area */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                        Pond Management
                    </h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                        Kelola unit kolam budidaya lele dan konfigurasi sensor IoT
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleCreateNew}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 18px",
                        backgroundColor: "#0ea5e9",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)",
                    }}
                >
                    <Plus size={16} />
                    <span>Tambah Kolam Baru</span>
                </button>
            </div>

            {/* Alert banner */}
            {alertMessage && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "#047857",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "13px",
                        fontWeight: 600,
                    }}
                >
                    <Info size={18} />
                    <span>{alertMessage}</span>
                </div>
            )}

            {/* Ponds Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                {ponds.map((pond) => (
                    <PondCard
                        key={pond.id}
                        pond={pond}
                        isSelected={selectedPondId === pond.id}
                        onSelect={() => setSelectedPondId(pond.id)}
                        onEdit={() => handleEditPond(pond)}
                        onDelete={() => handleDeletePond(pond.id)}
                    />
                ))}
            </div>

            {/* Add / Edit Form Modal */}
            <PondFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                mode={formMode}
                initialData={editingPond}
                onSave={handleSaveForm}
            />
        </div>
    );
}
