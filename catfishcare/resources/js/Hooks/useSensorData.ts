import { useState, useEffect } from "react";
import Papa from "papaparse";
import type { SensorRow, CsvRow } from "@/Types";
import { normalizeSensorRow } from "@/Utils/csvParser";

export const useSensorData = (selectedPondId: number) => {
    const [rawData, setRawData] = useState<SensorRow[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [liveData, setLiveData] = useState<SensorRow | null>(null);

    // Load and parse the CSV data
    useEffect(() => {
        // Reset simulation index and playing state on pond change
        setCurrentIndex(0);
        setIsPlaying(false);
        setLiveData(null);
        setIsLiveActive(false);

        fetch(`/datasets/IoTPond${selectedPondId}.csv`)
            .then((response) => response.text())
            .then((csvText) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results: { data: CsvRow[] }) => {
                        const cleanedData = results.data.map(normalizeSensorRow);
                        setRawData(cleanedData);
                    },
                });
            })
            .catch((error) => console.error("Error fetching CSV:", error));
    }, [selectedPondId]);

    // Live Telemetry Polling (Every 2.5s when not playing dataset simulation)
    useEffect(() => {
        let isMounted = true;
        const fetchLiveTelemetry = async () => {
            if (isPlaying) return;
            try {
                const res = await fetch(`/api/telemetry/latest/${selectedPondId}`);
                if (res.ok) {
                    const json = await res.json();
                    const telem = json.telemetry;
                    if (telem && isMounted) {
                        const row: SensorRow = {
                            created_at: telem.updated_at || new Date().toISOString(),
                            entry_id: `live-${selectedPondId}-${Date.now()}`,
                            TEMPERATURE: Number(telem.suhu ?? 27.5),
                            TURBIDITY: Number(telem.kekeruhan ?? 18.0),
                            pH: Number(telem.ph ?? 7.2),
                            NITRATE: Number(telem.tds ?? 420.0),
                            Population: 10000,
                            Length: Number(telem.tinggi_air ?? 100.0),
                            Weight: Number(telem.sfr ?? 0.05),
                        };
                        setLiveData(row);
                        setIsLiveActive(!telem.is_simulated);
                    }
                }
            } catch {
                // Silently fallback to dataset CSV
            }
        };

        fetchLiveTelemetry();
        const pollInterval = setInterval(fetchLiveTelemetry, 2500);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, [selectedPondId, isPlaying]);

    // Simulation loop
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined;
        if (isPlaying && rawData.length > 0) {
            intervalId = setInterval(() => {
                setCurrentIndex((prevIndex) => {
                    if (prevIndex >= rawData.length - 1) {
                        setIsPlaying(false);
                        return prevIndex;
                    }
                    return prevIndex + 1;
                });
            }, 2000); // Step every 2 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, rawData.length]);

    const currentData = (!isPlaying && liveData) ? liveData : (rawData[currentIndex] ?? null);

    // Sliding window of exactly 15 elements for charts
    const latestRows = rawData.slice(
        Math.max(0, currentIndex - 14),
        Math.max(15, currentIndex + 1),
    );

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

