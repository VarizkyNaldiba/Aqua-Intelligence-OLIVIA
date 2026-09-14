import type { SensorRow } from "@/Types";

interface MetricCardsGridProps {
    currentData: SensorRow;
}

type StatusLevel = "Aman" | "Waspada" | "Bahaya";

const getTempStatus = (v: number): StatusLevel =>
    v >= 25 && v <= 32 ? "Aman" : v >= 22 && v <= 35 ? "Waspada" : "Bahaya";
const getPhStatus = (v: number): StatusLevel =>
    v >= 6.5 && v <= 8.5 ? "Aman" : v >= 5.8 && v <= 9.0 ? "Waspada" : "Bahaya";
const getTurbidityStatus = (v: number): StatusLevel =>
    v <= 35 ? "Aman" : v <= 55 ? "Waspada" : "Bahaya";
const getTdsStatus = (v: number): StatusLevel =>
    v <= 900 ? "Aman" : v <= 1000 ? "Waspada" : "Bahaya";
const getHeightStatus = (v: number): StatusLevel =>
    v >= 8 && v <= 50 ? "Aman" : v >= 4 && v <= 60 ? "Waspada" : "Bahaya";

const statusStyle: Record<StatusLevel, React.CSSProperties> = {
    Aman:    { backgroundColor: "#dcfce7", color: "#15803d" },
    Waspada: { backgroundColor: "#fef3c7", color: "#b45309" },
    Bahaya:  { backgroundColor: "#fee2e2", color: "#b91c1c" },
};

const statusLabel: Record<StatusLevel, string> = {
    Aman:    "Optimal",
    Waspada: "Waspada",
    Bahaya:  "Kritis",
};

const accentColor: Record<string, string> = {
    temp:   "#f59e0b",
    ph:     "#10b981",
    turb:   "#0ea5e9",
    tds:    "#a855f7",
    height: "#22c55e",
};

interface CardProps {
    label: string;
    value: string;
    unit: string;
    status: StatusLevel;
    accent: string;
    ideal: string;
}

function MetricCard({ label, value, unit, status, accent, ideal }: CardProps) {
    return (
        <div
            className="db-metric-card"
            style={{
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                padding: "10px 12px",
                borderTop: `2px solid ${accent}`,
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span className="db-metric-label" style={{ fontSize: "13px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                </span>
                <span
                    className="db-metric-badge"
                    style={{ ...statusStyle[status], fontWeight: 700, fontSize: "11px", padding: "1px 7px", borderRadius: "99px" }}
                >
                    {statusLabel[status]}
                </span>
            </div>

            {/* Value */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                <span
                    className="db-metric-value"
                    style={{ fontSize: "26px", fontWeight: 800, color: accent, lineHeight: 1.1 }}
                >
                    {value}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>{unit}</span>
            </div>

            {/* Footer */}
            <div className="db-metric-footer" style={{ fontSize: "11px", color: "#94a3b8" }}>
                {ideal}
            </div>
        </div>
    );
}

export default function MetricCardsGrid({ currentData }: MetricCardsGridProps) {
    const tempVal   = currentData.TEMPERATURE ?? 27.5;
    const phVal     = currentData.pH          ?? 6.8;
    const turbVal   = currentData.TURBIDITY   ?? 12.0;
    const tdsVal    = currentData.NITRATE     ?? 288;
    const heightVal = currentData.Length      ?? 46.4;

    const cards: CardProps[] = [
        {
            label:  "Suhu Air",
            value:  tempVal.toFixed(1),
            unit:   "°C",
            status: getTempStatus(tempVal),
            accent: accentColor.temp,
            ideal:  "Ideal: 25.0 – 32.0 °C",
        },
        {
            label:  "pH Air",
            value:  phVal.toFixed(2),
            unit:   "pH",
            status: getPhStatus(phVal),
            accent: accentColor.ph,
            ideal:  "Ideal: 6.50 – 8.50 pH",
        },
        {
            label:  "Kekeruhan",
            value:  turbVal.toFixed(1),
            unit:   "NTU",
            status: getTurbidityStatus(turbVal),
            accent: accentColor.turb,
            ideal:  "Ideal: < 35 NTU",
        },
        {
            label:  "TDS",
            value:  tdsVal.toFixed(0),
            unit:   "PPM",
            status: getTdsStatus(tdsVal),
            accent: accentColor.tds,
            ideal:  "Ideal: < 900 PPM",
        },
        {
            label:  "Tinggi Air",
            value:  heightVal.toFixed(1),
            unit:   "cm",
            status: getHeightStatus(heightVal),
            accent: accentColor.height,
            ideal:  "Ideal: 8.0 – 50.0 cm",
        },
    ];

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "8px",
                width: "100%",
            }}
        >
            {cards.map((card) => (
                <MetricCard key={card.label} {...card} />
            ))}
        </div>
    );
}
