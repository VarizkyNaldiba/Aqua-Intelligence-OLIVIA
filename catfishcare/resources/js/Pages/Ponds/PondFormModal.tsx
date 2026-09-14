import { useState, useEffect } from "react";
import { X, Save, Plus } from "lucide-react";
import type { PondItem } from "./PondCard";

interface PondFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    initialData?: PondItem | null;
    onSave: (data: Partial<PondItem>) => void;
}

export default function PondFormModal({ isOpen, onClose, mode, initialData, onSave }: PondFormModalProps) {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [capacity, setCapacity] = useState<number>(1000);

    useEffect(() => {
        if (mode === "edit" && initialData) {
            setName(initialData.name);
            setLocation(initialData.location);
            setCapacity(initialData.capacity);
        } else {
            setName("");
            setLocation("");
            setCapacity(1000);
        }
    }, [mode, initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, location, capacity });
        onClose();
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(6px)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
            onClick={onClose}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "480px",
                    padding: "24px",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
                    border: "1px solid #e2e8f0",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {mode === "create" ? "Tambah Kolam Baru" : `Edit Detail ${initialData?.name}`}
                    </h3>
                    <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Nama Kolam</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Kolam Pembesaran 5"
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Lokasi / Sektor</label>
                        <input
                            type="text"
                            required
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Contoh: Sektor Selatan No. 12"
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>Kapasitas Benih (Ekor)</label>
                        <input
                            type="number"
                            required
                            value={capacity}
                            onChange={(e) => setCapacity(Number(e.target.value))}
                            placeholder="1000"
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        />
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#0ea5e9", color: "#ffffff", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        {mode === "create" ? <Plus size={16} /> : <Save size={16} />}
                        <span>{mode === "create" ? "Simpan Kolam" : "Perbarui Data"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
