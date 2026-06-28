import { useState } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    Line,
    CartesianGrid,
} from "recharts";
import { Sparkles, Calendar, TrendingUp, Info } from "lucide-react";
import { Select } from "@/Components/ui";
import type { SensorRow, Theme } from "@/Types";

interface AnalyticsTabProps {
    currentData: SensorRow | null;
    theme: Theme;
}

const AnalyticsTab = ({ currentData, theme }: AnalyticsTabProps) => {
    const [modelType, setModelType] = useState("LSTM");

    const growthProjection = [
        {
            week: "Minggu 1",
            actualWeight: 12.0,
            targetWeight: 12.0,
            predictedWeight: 12.0,
            length: 11.2,
        },
        {
            week: "Minggu 2",
            actualWeight: 28.5,
            targetWeight: 27.0,
            predictedWeight: 28.5,
            length: 13.8,
        },
        {
            week: "Minggu 3",
            actualWeight: 52.1,
            targetWeight: 50.0,
            predictedWeight: 52.1,
            length: 16.4,
        },
        {
            week: "Minggu 4",
            actualWeight: currentData?.Weight || 88.0,
            targetWeight: 85.0,
            predictedWeight: currentData?.Weight || 88.0,
            length: currentData?.Length || 19.5,
        },
        {
            week: "Minggu 5 (AI Proyeksi)",
            actualWeight: null,
            targetWeight: 130.0,
            predictedWeight: 132.5,
            length: 22.8,
        },
        {
            week: "Minggu 6 (AI Proyeksi)",
            actualWeight: null,
            targetWeight: 190.0,
            predictedWeight: 195.0,
            length: 26.2,
        },
        {
            week: "Minggu 7 (Panen)",
            actualWeight: null,
            targetWeight: 250.0,
            predictedWeight: 256.0,
            length: 29.5,
        },
    ];

    const colors =
        theme === "light"
            ? {
                  actual: "#0284C7",
                  target: "#64748B",
                  predicted: "#0D9488",
                  tooltipBg: "#E2ECE9",
                  tooltipBorder: "rgba(20, 184, 166, 0.2)",
                  tooltipText: "#0F172A",
                  gridColor: "#E2E8F0",
              }
            : {
                  actual: "#38BDF8",
                  target: "#64748B",
                  predicted: "#5DF8D8",
                  tooltipBg: "#070D12",
                  tooltipBorder: "rgba(20, 184, 166, 0.15)",
                  tooltipText: "#F8FAFC",
                  gridColor: "rgba(255, 255, 255, 0.05)",
              };

    const tooltipStyle = {
        backgroundColor: colors.tooltipBg,
        borderColor: colors.tooltipBorder,
        color: colors.tooltipText,
        fontSize: "11px",
        borderRadius: "6px",
    };

    return (
        <div className="tab-page analytics-page">
            <div className="analytics-header-row">
                <div>
                    <h2>Pertumbuhan & Analitik FCR</h2>
                    <p>
                        Prediksi bobot biomassa lele, performa konversi pakan,
                        dan estimasi waktu panen menggunakan model LSTM.
                    </p>
                </div>
                <Select
                    label="Model AI:"
                    icon={<Sparkles size={14} className="sparkle-icon" />}
                    options={[
                        { value: "LSTM", label: "LSTM (Waktu-Deret Proyeksi)" },
                        {
                            value: "XGBoost",
                            label: "XGBoost (Klasifikasi Kesehatan)",
                        },
                    ]}
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                />
            </div>

            <div className="analytics-overview-grid">
                {[
                    {
                        header: "FCR Saat Ini",
                        value: "1.15",
                        desc: "Lebih efisien 4% dibanding target (1.20)",
                        icon: TrendingUp,
                        cls: "text-success",
                        delay: "0.05s",
                    },
                    {
                        header: "Proyeksi Bobot",
                        value: `${(currentData?.Weight || 88.0).toFixed(1)} g`,
                        desc: "Prediksi minggu depan: 132.5 gram",
                        icon: Sparkles,
                        cls: "",
                        delay: "0.1s",
                    },
                    {
                        header: "Estimasi Panen",
                        value: "18 Juni 2026",
                        desc: "Sisa 28 hari menuju bobot ideal (250g)",
                        icon: Calendar,
                        cls: "text-warning",
                        delay: "0.15s",
                    },
                ].map((card, i) => (
                    <div
                        key={i}
                        className="card analytics-overview-card"
                        style={{
                            animation:
                                "cardFadeIn 0.5s var(--transition-ease) both",
                            animationDelay: card.delay,
                        }}
                    >
                        <div className="overview-header">
                            <span>{card.header}</span>
                            <card.icon size={16} color={colors.predicted} />
                        </div>
                        <h3>{card.value}</h3>
                        <p className={`overview-desc ${card.cls}`}>
                            {card.desc}
                        </p>
                    </div>
                ))}
            </div>

            <div className="card analytics-chart-card">
                <div className="chart-card-header">
                    <div>
                        <h3>Kurva Pertumbuhan Bobot Lele (Weight)</h3>
                        <p>
                            Membandingkan berat aktual vs target ideal vs
                            prediksi LSTM.
                        </p>
                    </div>
                    <div className="chart-legend-custom">
                        <span className="legend-item">
                            <span className="dot actual"></span>Aktual
                        </span>
                        <span className="legend-item">
                            <span className="dot target"></span>Target
                        </span>
                        <span className="legend-item">
                            <span className="dot predicted"></span>AI Prediksi
                        </span>
                    </div>
                </div>
                <div
                    className="analytics-chart-container"
                    style={{ height: "300px", marginTop: "20px" }}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={growthProjection}
                            margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={colors.gridColor}
                            />
                            <XAxis
                                dataKey="week"
                                stroke="var(--color-text-muted)"
                                fontSize={11}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="var(--color-text-muted)"
                                fontSize={11}
                                tickLine={false}
                                unit="g"
                            />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line
                                type="monotone"
                                dataKey="actualWeight"
                                name="Berat Aktual"
                                stroke={colors.actual}
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                animationDuration={500}
                            />
                            <Line
                                type="monotone"
                                dataKey="targetWeight"
                                name="Target Ideal"
                                stroke={colors.target}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ r: 2 }}
                                animationDuration={500}
                            />
                            <Line
                                type="monotone"
                                dataKey="predictedWeight"
                                name="AI Prediksi (LSTM)"
                                stroke={colors.predicted}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                animationDuration={500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="home-main-grid">
                <div className="card analytics-half-card">
                    <h3>Kurva Panjang Ikan (Length)</h3>
                    <div
                        className="analytics-chart-container"
                        style={{ height: "200px", marginTop: "15px" }}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={growthProjection}
                                margin={{
                                    top: 5,
                                    right: 5,
                                    left: -25,
                                    bottom: 5,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="colorLength"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor={colors.actual}
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor={colors.actual}
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="week"
                                    stroke="var(--color-text-muted)"
                                    fontSize={10}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="var(--color-text-muted)"
                                    fontSize={10}
                                    tickLine={false}
                                    unit="cm"
                                />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area
                                    type="monotone"
                                    dataKey="length"
                                    name="Panjang Ikan"
                                    stroke={colors.actual}
                                    fillOpacity={1}
                                    fill="url(#colorLength)"
                                    strokeWidth={2}
                                    animationDuration={500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card analytics-half-card analytics-info-card">
                    <div style={{ display: "flex", gap: "10px" }}>
                        <Info
                            size={24}
                            className="info-icon"
                            style={{ color: colors.actual }}
                        />
                        <div>
                            <h3>Catatan Algoritma AI</h3>
                            <p
                                style={{
                                    fontSize: "13px",
                                    color: "var(--color-text-muted)",
                                    marginTop: "5px",
                                    lineHeight: "1.5",
                                }}
                            >
                                Model prediktif dijalankan secara asinkron dari
                                backend Laravel dengan scheduler setiap jam ke
                                engine Python ML.
                            </p>
                            <ul
                                style={{
                                    fontSize: "12px",
                                    color: "var(--color-text-muted)",
                                    marginTop: "10px",
                                    paddingLeft: "20px",
                                    lineHeight: "1.6",
                                }}
                            >
                                <li>
                                    <strong>LSTM</strong>: Memetakan dependensi
                                    temporal pertumbuhan berat lele.
                                </li>
                                <li>
                                    <strong>XGBoost Regressor</strong>:
                                    Menganalisis korelasi multivariat pakan,
                                    kualitas air, dan FCR.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;
