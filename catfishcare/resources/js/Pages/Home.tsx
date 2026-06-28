import {
    Fish,
    Thermometer,
    ShieldAlert,
    CloudRain,
    Calendar,
    Plus,
    FileText,
    ClipboardList,
} from "lucide-react";
import StatCard from "@/Components/StatCard";
import StatusBadge from "@/Components/StatusBadge";
import { Button } from "@/Components/ui";
import type { SensorRow, TabName } from "@/Types";

interface HomeTabProps {
    rawData: SensorRow[];
    currentData: SensorRow | null;
    setActiveTab: (tab: TabName) => void;
    selectedPondId: number;
    setSelectedPondId: (id: number) => void;
}

const HomeTab = ({
    currentData,
    setActiveTab,
    selectedPondId,
    setSelectedPondId,
}: HomeTabProps) => {
    const isPondCritical =
        (currentData?.DO ?? Infinity) <= 2.0 ||
        (currentData?.AMMONIA ?? 0) > 0.0005;
    const isPondWarning =
        (currentData?.TEMPERATURE ?? Infinity) < 27.05 ||
        (currentData?.pH ?? Infinity) < 6.05;

    const farmStats = [
        {
            label: "Total Kolam",
            value: "12 Kolam",
            icon: Fish,
            color: "#38BDF8",
        },
        {
            label: "Total Populasi",
            value: "120.000 Ekor",
            icon: Fish,
            color: "#14B8A6",
        },
        {
            label: "Status Kritis",
            value: isPondCritical
                ? `1 Kolam (Kolam ${selectedPondId})`
                : "0 Kolam Kritis",
            icon: ShieldAlert,
            color: isPondCritical ? "#EF4444" : "#14B8A6",
        },
        {
            label: `Suhu Kolam ${selectedPondId}`,
            value: `${currentData?.TEMPERATURE.toFixed(1) || "28.5"}°C`,
            icon: Thermometer,
            color: "#F59E0B",
        },
    ];

    const quickActions = [
        {
            label: "Catat Pemberian Pakan",
            icon: ClipboardList,
            action: () =>
                alert(
                    "Fitur mencatat pakan terintegrasi dengan Laravel backend.",
                ),
        },
        {
            label: "Lihat Detail Monitoring",
            icon: FileText,
            action: () => setActiveTab("dashboard"),
        },
        {
            label: "Kelola Seluruh Kolam",
            icon: Plus,
            action: () => setActiveTab("ponds"),
        },
    ];

    const activePondsList = [
        {
            id: 12,
            name: "Kolam 12",
            type: "Bioflok Bulat D3",
            population: "10.000 Ekor",
            defaultTemp: 28.2,
            defaultPh: 7.1,
            defaultDo: 4.5,
        },
        {
            id: 11,
            name: "Kolam 11",
            type: "Tanah Tradisional",
            population: "15.000 Ekor",
            defaultTemp: 28.5,
            defaultPh: 7.2,
            defaultDo: 4.8,
        },
        {
            id: 10,
            name: "Kolam 10",
            type: "Terpal Kotak",
            population: "8.000 Ekor",
            defaultTemp: 29.0,
            defaultPh: 7.4,
            defaultDo: 5.1,
        },
        {
            id: 9,
            name: "Kolam 09",
            type: "Bioflok Bulat D3",
            population: "10.000 Ekor",
            defaultTemp: 26.9,
            defaultPh: 6.4,
            defaultDo: 4.2,
        },
    ];

    return (
        <div className="tab-page home-page">
            <div className="welcome-banner-home">
                <div className="welcome-text">
                    <h2>Selamat Datang Kembali, Pak Fii! 👋</h2>
                    {isPondCritical ? (
                        <p>
                            Kondisi pertanian Anda stabil, namun{" "}
                            <strong>Kolam {selectedPondId}</strong> memerlukan
                            tindakan segera terkait kadar oksigen
                            terlarut/amonia!
                        </p>
                    ) : isPondWarning ? (
                        <p>
                            <strong>Kolam {selectedPondId}</strong> terpantau
                            dalam status <strong>WASPADA</strong>. Silakan
                            periksa sirkulasi air.
                        </p>
                    ) : (
                        <p>
                            Kondisi pemantauan Kolam {selectedPondId} saat ini
                            dalam keadaan <strong>AMAN & OPTIMAL</strong>.
                            Pertumbuhan lele sangat stabil.
                        </p>
                    )}
                </div>
                <div className="current-date-badge">
                    <Calendar size={16} />
                    <span>Kamis, 21 Mei 2026</span>
                </div>
            </div>

            <div className="home-stats-grid">
                {farmStats.map((stat, index) => (
                    <StatCard key={index} {...stat} index={index} />
                ))}
            </div>

            <div className="home-main-grid">
                <div
                    className="card weather-advisory-card"
                    style={{
                        animation:
                            "cardFadeIn 0.5s var(--transition-ease) both",
                        animationDelay: "0.2s",
                    }}
                >
                    <div className="card-header-advisory">
                        <CloudRain size={28} className="weather-icon" />
                        <div>
                            <h3>Rekomendasi Cuaca & Pakan AI</h3>
                            <p>Prakiraan: Hujan Sedang Sore Hari</p>
                        </div>
                    </div>
                    <div className="advisory-content">
                        <p>
                            <strong>Instruksi AI:</strong> Suhu air diperkirakan
                            turun 1.5°C sore ini akibat hujan.
                        </p>
                        <ul>
                            <li>
                                Kurangi dosis pakan sore <strong>20%</strong>{" "}
                                pada kolam aktif.
                            </li>
                            <li>Jangan beri pakan saat hujan deras.</li>
                            <li>Pantau pH setelah hujan reda.</li>
                        </ul>
                    </div>
                </div>

                <div
                    className="card quick-actions-card"
                    style={{
                        animation:
                            "cardFadeIn 0.5s var(--transition-ease) both",
                        animationDelay: "0.25s",
                    }}
                >
                    <h3>Pintasan Cepat</h3>
                    <div className="actions-list">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <Button
                                    key={index}
                                    variant="action-row"
                                    onClick={action.action}
                                    style={{
                                        animation:
                                            "todoFadeIn 0.4s var(--transition-ease) both",
                                        animationDelay: `${0.3 + index * 0.05}s`,
                                    }}
                                >
                                    <div className="action-btn-left">
                                        <Icon size={18} />
                                        <span>{action.label}</span>
                                    </div>
                                    <span className="arrow">→</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div
                className="card active-ponds-overview-card"
                style={{
                    animation: "cardFadeIn 0.5s var(--transition-ease) both",
                    animationDelay: "0.35s",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px",
                    }}
                >
                    <h3>Ringkasan Status Kolam Aktif</h3>
                    <span
                        style={{
                            fontSize: "12px",
                            color: "var(--color-text-muted)",
                        }}
                    >
                        *Klik baris untuk memantau
                    </span>
                </div>
                <div className="table-responsive">
                    <table className="home-ponds-table">
                        <thead>
                            <tr>
                                <th>Nama Kolam</th>
                                <th>Tipe</th>
                                <th>Kepadatan</th>
                                <th>Suhu</th>
                                <th>pH</th>
                                <th>DO</th>
                                <th>Status AI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activePondsList.map((pond) => {
                                const isSelected = pond.id === selectedPondId;
                                const temp =
                                    isSelected && currentData
                                        ? currentData.TEMPERATURE
                                        : pond.defaultTemp;
                                const ph =
                                    isSelected && currentData
                                        ? currentData.pH
                                        : pond.defaultPh;
                                const doVal =
                                    isSelected && currentData
                                        ? currentData.DO
                                        : pond.defaultDo;
                                const isCritical =
                                    doVal <= 2.0 ||
                                    (isSelected &&
                                        (currentData?.AMMONIA ?? 0) > 0.0005);
                                const isWarning = temp < 27.05 || ph < 6.05;
                                const badgeClass = isCritical
                                    ? "danger"
                                    : isWarning
                                      ? "warning"
                                      : "success";

                                return (
                                    <tr
                                        key={`${selectedPondId}-${pond.id}`}
                                        onClick={() => {
                                            setSelectedPondId(pond.id);
                                            setActiveTab("dashboard");
                                        }}
                                        style={{ cursor: "pointer" }}
                                        className={
                                            isSelected ? "active-pond-row" : ""
                                        }
                                    >
                                        <td>
                                            <strong>{pond.name}</strong>
                                            {isSelected && (
                                                <span className="active-tag-inline">
                                                    IoT Terkoneksi
                                                </span>
                                            )}
                                        </td>
                                        <td>{pond.type}</td>
                                        <td>{pond.population}</td>
                                        <td>{temp.toFixed(1)}°C</td>
                                        <td>{ph.toFixed(1)}</td>
                                        <td
                                            className={
                                                isCritical
                                                    ? "text-danger font-bold"
                                                    : badgeClass === "warning"
                                                      ? "text-warning"
                                                      : "text-success"
                                            }
                                        >
                                            {doVal.toFixed(1)} mg/L
                                        </td>
                                        <td>
                                            <StatusBadge
                                                status={badgeClass}
                                                variant="inline"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HomeTab;
