import { useState, useEffect } from "react";
import type { SensorRow } from "@/Types";
import PredictionOverviewCard from "./PredictionOverviewCard";
import ForecastChartsSection from "./ForecastChartsSection";
import MlCorrelationWidget from "./MlCorrelationWidget";

interface AnalyticsIndexProps {
    currentData?: SensorRow | null;
    rawData?: SensorRow[];
}

export default function AnalyticsIndex({ currentData, rawData = [] }: AnalyticsIndexProps) {
    const [forecastData, setForecastData] = useState([
        { time: "00:00", temperature: 25.2, ph: 7.30, turbidity: 16.5, tds: 410, water_level: 25.0 },
        { time: "04:00", temperature: 27.8, ph: 7.60, turbidity: 18.0, tds: 420, water_level: 24.8 },
        { time: "08:00", temperature: 27.2, ph: 7.02, turbidity: 22.4, tds: 450, water_level: 24.6 },
        { time: "12:00", temperature: 25.8, ph: 6.92, turbidity: 23.5, tds: 460, water_level: 24.4 },
        { time: "16:00", temperature: 25.1, ph: 7.15, turbidity: 19.5, tds: 430, water_level: 24.2 },
        { time: "20:00", temperature: 26.4, ph: 7.25, turbidity: 17.5, tds: 415, water_level: 24.0 },
    ]);

    const [forecastMeta, setForecastMeta] = useState({
        lastHistoryTime: "Terbaru (WIB)",
        source: "BiLSTM Neural Network (.keras)",
        generatedAt: "Live",
    });

    const [isLoading, setIsLoading] = useState(false);

    const fetchForecast = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/predictions/1");
            if (res.ok) {
                const data = await res.json();
                if (data.forecast) setForecastData(data.forecast);
                setForecastMeta({
                    lastHistoryTime: data.last_history_time_formatted || "Terbaru (WIB)",
                    source: data.source || "BiLSTM Neural Network (.keras)",
                    generatedAt: data.generated_at || new Date().toLocaleTimeString("id-ID"),
                });
            }
        } catch {
            // Keep state
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, [currentData?.pH]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Predictions & Machine Learning Forecast
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                    Projeksi telemetri kualitas air 24 jam ke depan menggunakan model BiLSTM
                </p>
            </div>

            <PredictionOverviewCard forecastMeta={forecastMeta} isLoading={isLoading} onRefresh={fetchForecast} />
            <ForecastChartsSection forecastData={forecastData} />
            <MlCorrelationWidget rawData={rawData} />
        </div>
    );
}
