import { useState, useEffect, useRef } from "react";
import type { SensorRow } from "@/Types";

export const useSensorData = (selectedPondId: number = 1) => {
    const [rawData, setRawData] = useState<SensorRow[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [liveData, setLiveData] = useState<SensorRow | null>(null);
    // Store last seen timestamp as a number for reliable comparison
    const lastTimestampRef = useRef<number>(0);

    // Load initial time-series telemetry history from backend
    useEffect(() => {
        let isMounted = true;
        setCurrentIndex(0);
        setIsPlaying(false);

        fetch(`/api/telemetry/history/${selectedPondId}`)
            .then((res) => res.json())
            .then((data) => {
                if (isMounted && data.history && Array.isArray(data.history) && data.history.length > 0) {
                    setRawData(data.history);
                    setCurrentIndex(data.history.length - 1);
                    const latest = data.history[data.history.length - 1];
                    setLiveData(latest);
                }
            })
            .catch(() => {
                // Fallback initial baseline
                const now = new Date();
                const baseline: SensorRow[] = Array.from({ length: 15 }, (_, i) => ({
                    created_at: new Date(now.getTime() - (15 - i) * 10000).toISOString(),
                    entry_id: `init-${selectedPondId}-${i}`,
                    TEMPERATURE: 27.5,
                    TURBIDITY: 18.0,
                    pH: 7.2,
                    NITRATE: 420.0,
                    Population: 1000,
                    Length: 25.0,
                    Weight: 0.05,
                }));
                if (isMounted) {
                    setRawData(baseline);
                    setCurrentIndex(baseline.length - 1);
                    setLiveData(baseline[baseline.length - 1]);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [selectedPondId]);

    // Live Telemetry Polling (Every 2.5s)
    useEffect(() => {
        let isMounted = true;
        const fetchLiveTelemetry = async () => {
            try {
                const res = await fetch(`/api/telemetry/latest/${selectedPondId}`);
                if (res.ok) {
                    const json = await res.json();
                    const telem = json.telemetry;
                    if (telem && isMounted) {
                        // Use numeric UNIX timestamp for reliable "new data" detection
                        const updatedAtMs = telem.updated_at
                            ? new Date(telem.updated_at).getTime()
                            : 0;

                        const newRow: SensorRow = {
                            created_at: telem.updated_at || new Date().toISOString(),
                            entry_id: `live-${selectedPondId}-${updatedAtMs}`,
                            TEMPERATURE: Number(telem.suhu ?? 27.5),
                            TURBIDITY: Number(telem.kekeruhan ?? 18.0),
                            pH: Number(telem.ph ?? 7.2),
                            NITRATE: Number(telem.tds ?? 420.0),
                            Population: 1000,
                            Length: Number(telem.tinggi_air ?? 25.0),
                            Weight: Number(telem.sfr ?? 0.05),
                        };

                        // Always update the live card display
                        setLiveData(newRow);
                        setIsLiveActive(!telem.is_simulated);

                        // Only append to chart history if this is genuinely newer data
                        if (updatedAtMs > lastTimestampRef.current) {
                            lastTimestampRef.current = updatedAtMs;
                            setRawData((prev) => {
                                const next = [...prev, newRow];
                                return next.length > 30 ? next.slice(-30) : next;
                            });
                            setCurrentIndex((prev) => prev + 1);
                        }
                    }
                }
            } catch {
                // Ignore network glitch
            }
        };

        fetchLiveTelemetry();
        const pollInterval = setInterval(fetchLiveTelemetry, 2500);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, [selectedPondId]);

    const currentData = liveData || (rawData[rawData.length - 1] ?? null);

    // Dynamic rolling window of last 15 elements for charts
    const latestRows = rawData.length > 15 ? rawData.slice(-15) : rawData;

    return {
        rawData,
        currentData,
        currentIndex,
        setCurrentIndex,
        isPlaying,
        setIsPlaying,
        latestRows,
        isLiveActive,
    };
};
