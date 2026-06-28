import { Activity } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { Button } from "./ui";

interface PondCardProps {
    pond: {
        id: number;
        name: string;
        type: string;
        population: number;
        density: string;
        status: string;
        temp: string;
        ph: string;
        do: string;
        fcr: string;
    };
    isSelected: boolean;
    index: number;
    onSelect: (id: number) => void;
}

const PondCard = ({ pond, isSelected, index, onSelect }: PondCardProps) => (
    <div
        key={pond.id}
        className={`pond-card status-${pond.status.toLowerCase()} ${isSelected ? "active-pond-card" : ""}`}
        style={{
            animation: "cardFadeIn 0.5s var(--transition-ease) both",
            animationDelay: `${index * 0.04}s`,
        }}
    >
        <div className="pond-card-header">
            <div>
                <h4>
                    {pond.name}
                    {isSelected && (
                        <span className="active-tag-card">Monitor Aktif</span>
                    )}
                </h4>
                <span className="pond-type-label">{pond.type}</span>
            </div>
            <StatusBadge status={pond.status} variant="dot" />
        </div>

        <div className="pond-card-metrics">
            <div className="pond-sub-stat">
                <span className="label">Populasi</span>
                <span className="val">
                    {pond.population.toLocaleString("id-ID")} ekor
                </span>
            </div>
            <div className="pond-sub-stat">
                <span className="label">Kepadatan</span>
                <span className="val">{pond.density}</span>
            </div>
            <div className="pond-sub-stat">
                <span className="label">Target FCR</span>
                <span className="val">{pond.fcr}</span>
            </div>
        </div>

        <div className="pond-card-divider"></div>

        <div className="pond-sensor-readings">
            <div className="sensor-read-item">
                <span className="lbl">Suhu</span>
                <span className="val">{pond.temp}</span>
            </div>
            <div className="sensor-read-item">
                <span className="lbl">pH</span>
                <span className="val">{pond.ph || "7.0"}</span>
            </div>
            <div className="sensor-read-item">
                <span className="lbl">DO</span>
                <span className="val">{pond.do}</span>
            </div>
        </div>

        <div className="pond-card-actions">
            <Button
                variant="inline"
                icon={<Activity size={12} />}
                onClick={() => onSelect(pond.id)}
            >
                Detail Sensor
            </Button>
        </div>
    </div>
);

export default PondCard;
