import { useState } from "react";
import { Plus, HelpCircle } from "lucide-react";
import PondCard from "@/Components/PondCard";
import { SearchInput, Button } from "@/Components/ui";
import type { SensorRow, TabName } from "@/Types";

interface PondsTabProps {
    currentData: SensorRow | null;
    selectedPondId: number;
    setSelectedPondId: (id: number) => void;
    setActiveTab: (tab: TabName) => void;
}

const PondsTab = ({
    currentData,
    selectedPondId,
    setSelectedPondId,
    setActiveTab,
}: PondsTabProps) => {
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const initialPonds = [
        {
            id: 12,
            name: "Kolam 12",
            type: "Bioflok Bulat D3",
            population: 10000,
            size: "D: 3m, T: 1.2m",
            density: "141/m³",
            status: "SAFE",
            temp: "28.2°C",
            ph: "7.1",
            do: "4.5 mg/L",
            fcr: "1.15",
        },
        {
            id: 11,
            name: "Kolam 11",
            type: "Tanah Tradisional",
            population: 15000,
            size: "8m x 10m",
            density: "187/m³",
            status: "SAFE",
            temp: "28.5°C",
            ph: "7.2",
            do: "4.8 mg/L",
            fcr: "1.22",
        },
        {
            id: 10,
            name: "Kolam 10",
            type: "Terpal Kotak",
            population: 8000,
            size: "4m x 6m",
            density: "166/m³",
            status: "SAFE",
            temp: "29.0°C",
            ph: "7.4",
            do: "5.1 mg/L",
            fcr: "1.18",
        },
        {
            id: 9,
            name: "Kolam 09",
            type: "Bioflok Bulat D3",
            population: 10000,
            size: "D: 3m, T: 1.2m",
            density: "141/m³",
            status: "WARNING",
            temp: "26.9°C",
            ph: "6.4",
            do: "4.2 mg/L",
            fcr: "1.28",
        },
        {
            id: 8,
            name: "Kolam 08",
            type: "Bioflok Bulat D3",
            population: 9500,
            size: "D: 3m, T: 1.2m",
            density: "134/m³",
            status: "SAFE",
            temp: "28.2°C",
            ph: "7.1",
            do: "4.9 mg/L",
            fcr: "1.16",
        },
        {
            id: 7,
            name: "Kolam 07",
            type: "Terpal Kotak",
            population: 12000,
            size: "6m x 6m",
            density: "166/m³",
            status: "SAFE",
            temp: "28.0°C",
            ph: "7.0",
            do: "4.6 mg/L",
            fcr: "1.20",
        },
        {
            id: 6,
            name: "Kolam 06",
            type: "Tanah Tradisional",
            population: 20000,
            size: "10m x 12m",
            density: "166/m³",
            status: "SAFE",
            temp: "27.8°C",
            ph: "6.9",
            do: "4.4 mg/L",
            fcr: "1.25",
        },
        {
            id: 5,
            name: "Kolam 05",
            type: "Bioflok Bulat D3",
            population: 10500,
            size: "D: 3m, T: 1.2m",
            density: "148/m³",
            status: "SAFE",
            temp: "28.4°C",
            ph: "7.3",
            do: "5.0 mg/L",
            fcr: "1.13",
        },
        {
            id: 4,
            name: "Kolam 04",
            type: "Bioflok Bulat D3",
            population: 10000,
            size: "D: 3m, T: 1.2m",
            density: "141/m³",
            status: "WARNING",
            temp: "26.8°C",
            ph: "6.3",
            do: "4.1 mg/L",
            fcr: "1.30",
        },
        {
            id: 3,
            name: "Kolam 03",
            type: "Terpal Kotak",
            population: 8000,
            size: "4m x 6m",
            density: "166/m³",
            status: "SAFE",
            temp: "28.7°C",
            ph: "7.1",
            do: "4.7 mg/L",
            fcr: "1.19",
        },
        {
            id: 2,
            name: "Kolam 02",
            type: "Bioflok Bulat D3",
            population: 10000,
            size: "D: 3m, T: 1.2m",
            density: "141/m³",
            status: "SAFE",
            temp: "28.1°C",
            ph: "7.2",
            do: "4.8 mg/L",
            fcr: "1.14",
        },
        {
            id: 1,
            name: "Kolam 01",
            type: "Bioflok Bulat D3",
            population: 10000,
            size: "D: 3m, T: 1.2m",
            density: "141/m³",
            status: "SAFE",
            temp: "28.3°C",
            ph: "7.2",
            do: "4.9 mg/L",
            fcr: "1.15",
        },
    ];

    const pondsWithData = initialPonds.map((pond) => {
        if (pond.id === selectedPondId && currentData) {
            const isCritical =
                currentData.DO <= 2.0 || currentData.AMMONIA > 0.0005;
            const isWarning =
                currentData.TEMPERATURE < 27.05 || currentData.pH < 6.05;
            return {
                ...pond,
                status: isCritical ? "DANGER" : isWarning ? "WARNING" : "SAFE",
                temp: `${currentData.TEMPERATURE.toFixed(1)}°C`,
                ph: currentData.pH.toFixed(1),
                do: `${currentData.DO.toFixed(1)} mg/L`,
            };
        }
        return pond;
    });

    const filteredPonds = pondsWithData.filter((pond) => {
        const matchesStatus =
            filterStatus === "ALL" || pond.status === filterStatus;
        const matchesSearch =
            pond.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pond.type.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handlePondSelect = (id: number) => {
        setSelectedPondId(id);
        setActiveTab("dashboard");
    };

    const filterButtons = [
        { status: "ALL", label: "Semua", cls: "" },
        { status: "DANGER", label: "🔴 Bahaya", cls: "danger" },
        { status: "WARNING", label: "🟡 Waspada", cls: "warning" },
        { status: "SAFE", label: "🟢 Aman", cls: "success" },
    ];

    return (
        <div className="tab-page ponds-page">
            <div className="ponds-header-row">
                <div>
                    <h2>Daftar Kolam Lele</h2>
                    <p>
                        Kelola konfigurasi kolam, populasi tebar, dan status
                        monitoring kualitas air.
                    </p>
                </div>
                <Button
                    variant="add"
                    icon={<Plus size={16} />}
                    onClick={() =>
                        alert(
                            "Fitur tambah kolam akan menghubungkan modul Laravel Controller untuk menyimpan data ke database.",
                        )
                    }
                >
                    <span>Tambah Kolam</span>
                </Button>
            </div>

            <div className="filter-search-container">
                <SearchInput
                    placeholder="Cari kolam berdasarkan nama atau tipe..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="filter-tags">
                    {filterButtons.map((btn) => (
                        <button
                            key={btn.status}
                            className={`filter-tag ${btn.cls} ${filterStatus === btn.status ? "active" : ""}`}
                            onClick={() => setFilterStatus(btn.status)}
                        >
                            {btn.label} (
                            {
                                pondsWithData.filter(
                                    (p) =>
                                        btn.status === "ALL" ||
                                        p.status === btn.status,
                                ).length
                            }
                            )
                        </button>
                    ))}
                </div>
            </div>

            <div className="ponds-grid">
                {filteredPonds.map((pond, index) => (
                    <PondCard
                        key={`${filterStatus}-${pond.id}`}
                        pond={pond}
                        isSelected={pond.id === selectedPondId}
                        index={index}
                        onSelect={handlePondSelect}
                    />
                ))}
                {filteredPonds.length === 0 && (
                    <div className="no-ponds-fallback">
                        <HelpCircle size={48} />
                        <p>
                            Tidak ada kolam yang cocok dengan filter atau
                            pencarian Anda.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PondsTab;
