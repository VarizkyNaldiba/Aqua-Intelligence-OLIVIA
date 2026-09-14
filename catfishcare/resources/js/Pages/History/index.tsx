import { useState, useEffect } from "react";
import type { SensorRow } from "@/Types";
import LogTable from "./LogTable";

interface HistoryIndexProps {
    currentData?: SensorRow | null;
    rawData?: SensorRow[];
}

export default function HistoryIndex({ rawData = [] }: HistoryIndexProps) {
    const [historyData, setHistoryData] = useState<SensorRow[]>(rawData);

    useEffect(() => {
        let isMounted = true;
        const fetchHistory = () => {
            fetch("/api/telemetry/history/1")
                .then((res) => res.json())
                .then((data) => {
                    if (isMounted && data.history && Array.isArray(data.history)) {
                        setHistoryData(data.history);
                    }
                })
                .catch(() => {});
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 3000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    History & Telemetry Reports
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                    Riwayat log data sensor, peringatan bahaya, dan laporan ekspor
                </p>
            </div>

            <LogTable historyData={historyData} />
        </div>
    );
}
