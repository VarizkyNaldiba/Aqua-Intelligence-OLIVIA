import { useState } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { Sparkles, Play, Info, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import type { SensorRow } from "@/Types";

interface AnalyticsTabProps {
    currentData: SensorRow | null;
}

const AnalyticsTab = ({ currentData }: AnalyticsTabProps) => {
    // 24-Hour Forecast Data matching Figma curves
    const forecastData = [
        { time: "00:00", temperature: 25.2, pH: 7.30 },
        { time: "02:00", temperature: 26.5, pH: 7.48 },
        { time: "04:00", temperature: 27.8, pH: 7.60 },
        { time: "06:00", temperature: 28.5, pH: 7.35 },
        { time: "08:00", temperature: 27.2, pH: 7.02 },
        { time: "10:00", temperature: 26.5, pH: 6.85 },
        { time: "12:00", temperature: 25.8, pH: 6.92 },
        { time: "14:00", temperature: 24.9, pH: 7.08 },
        { time: "16:00", temperature: 25.1, pH: 7.15 },
        { time: "17:00", temperature: 25.3, pH: 7.08 }, // Hover target in Figma mockup
        { time: "18:00", temperature: 25.6, pH: 7.01 },
        { time: "20:00", temperature: 26.4, pH: 7.25 },
        { time: "22:00", temperature: 27.1, pH: 7.42 },
    ];

    // Correlation Selector state
    const [var1, setVar1] = useState("");
    const [var2, setVar2] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        r: number;
        strength: string;
        text: string;
    } | null>(null);

    const handleRunAnalysis = () => {
        if (!var1 || !var2) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);

        setTimeout(() => {
            setIsAnalyzing(false);
            if (var1 === var2) {
                setAnalysisResult({
                    r: 1.0,
                    strength: "Perfect positive correlation",
                    text: `Comparing ${var1} with itself yields a perfect correlation coefficient of 1.00. Use two different parameters to explore environmental linkages.`,
                });
                return;
            }

            const key = `${var1}-${var2}`;
            const reverseKey = `${var2}-${var1}`;

            if (key === "Temperature-pH" || reverseKey === "Temperature-pH") {
                setAnalysisResult({
                    r: -0.73,
                    strength: "Moderate inverse correlation",
                    text: "Photosynthetic activity and thermal shifts show an inverse correlation. Higher daylight temperatures trigger water pH drops due to bicarbonate assimilation and CO2 respiration loops.",
                });
            } else if (key === "Weight-Length" || reverseKey === "Weight-Length") {
                setAnalysisResult({
                    r: 0.92,
                    strength: "Strong positive correlation",
                    text: "Excellent biometric scaling observed. Weight increments correspond strongly with fish length growth, indicating highly efficient metabolic feed absorption.",
                });
            } else if (key === "Turbidity-pH" || reverseKey === "Turbidity-pH") {
                setAnalysisResult({
                    r: -0.45,
                    strength: "Weak negative correlation",
                    text: "Increased optical turbidity slightly suppresses algae activity, leading to lower pH fluctuation bounds due to reduced daylight carbon fixation rates.",
                });
            } else {
                // Default pseudo-random correlation based on parameter names
                const sum = var1.length + var2.length;
                const mockR = parseFloat(((sum % 7) / 10 - 0.3).toFixed(2));
                const absR = Math.abs(mockR);
                const strength =
                    absR > 0.7
                        ? "Strong correlation"
                        : absR > 0.4
                        ? "Moderate correlation"
                        : "Weak correlation";

                setAnalysisResult({
                    r: mockR,
                    strength: `${strength} (${mockR >= 0 ? "positive" : "inverse"})`,
                    text: `Pearson correlation coefficient (r = ${mockR}) indicates a ${strength.toLowerCase()} between ${var1.toLowerCase()} and ${var2.toLowerCase()} inside the current crop cycle.`,
                });
            }
        }, 1000);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Title Block */}
            <div className="db-heading-area">
                <h2 className="db-title">Predictions & Analysis</h2>
                <p className="db-subtitle">AI-generated 24-hour forecast for your catfish pond parameters</p>
            </div>

            {/* Upper Grid Panels */}
            <div className="db-main-grid">
                {/* Left Panel: 24-Hour Forecast Chart */}
                <div className="db-panel-card" style={{ height: "450px" }}>
                    <div className="db-panel-header">
                        <div className="db-panel-title">
                            <TrendingUp size={18} color="#0ea5e9" />
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                <span style={{ fontSize: "16px", fontWeight: 700 }}>24-Hour Forecast</span>
                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Water Temperature & pH — Pond A</span>
                            </div>
                        </div>
                        <span 
                            style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#0284c7",
                                backgroundColor: "#f0f9ff",
                                padding: "4px 10px",
                                borderRadius: "9999px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            ● ML Forecast
                        </span>
                    </div>
                    <div className="db-panel-body" style={{ height: "calc(100% - 75px)", position: "relative" }}>
                        {/* Custom double axis Recharts container */}
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart
                                data={forecastData}
                                margin={{ top: 15, right: 5, left: 5, bottom: 5 }}
                            >
                                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="time" 
                                    stroke="#64748b" 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                {/* Left axis for Temperature */}
                                <YAxis
                                    yAxisId="left"
                                    orientation="left"
                                    domain={[24, 32]}
                                    ticks={[24, 26, 28, 30, 32]}
                                    stroke="#0ea5e9"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${val}°C`}
                                />
                                {/* Right axis for pH */}
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    domain={[6.6, 7.8]}
                                    ticks={[6.6, 6.9, 7.2, 7.5, 7.8]}
                                    stroke="#14b8a6"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "12px",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                        fontSize: "12px",
                                        color: "#0f172a",
                                        padding: "10px 14px",
                                    }}
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="temperature"
                                    name="temperature"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="pH"
                                    name="pH"
                                    stroke="#14b8a6"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div 
                            style={{ 
                                display: "flex", 
                                justifyContent: "center", 
                                gap: "24px", 
                                fontSize: "12px", 
                                color: "#64748b",
                                fontWeight: 600,
                                marginTop: "-10px"
                            }}
                        >
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "12px", height: "3px", backgroundColor: "#0ea5e9", display: "inline-block", borderRadius: "2px" }}></span>
                                Water Temperature (°C)
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "12px", height: "3px", backgroundColor: "#14b8a6", display: "inline-block", borderRadius: "2px" }}></span>
                                pH Level
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Panel: AI Analysis Report */}
                <div className="db-panel-card">
                    <div className="db-panel-header">
                        <div className="db-panel-title">
                            <div className="auth-logo-circle" style={{ width: "32px", height: "32px", borderRadius: "8px", marginBottom: 0, boxShadow: "none" }}>
                                <Sparkles size={16} color="#ffffff" />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                <span style={{ fontSize: "16px", fontWeight: 700 }}>AI Analysis Report</span>
                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Generated 09 Jul 2026, 09:45 AM</span>
                            </div>
                        </div>
                    </div>
                    <div className="db-panel-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#475569", textAlign: "left", marginBottom: "8px" }}>
                            The 24-hour model reveals a <strong style={{ color: "#0f172a" }}>moderate inverse correlation</strong> between water temperature and pH (r = -0.73). As midday heat raises temperature, photosynthetic activity declines post-sunset causing CO₂ buildup and pH drop. This pattern poses a <strong style={{ color: "#d97706" }}>moderate risk</strong> of catfish respiratory stress in the early morning hours (03:00–06:00). Proactive aeration is recommended.
                        </p>

                        {/* List items */}
                        {/* 1. Trend Detected */}
                        <div className="db-schedule-card" style={{ margin: 0, padding: "16px" }}>
                            <div className="db-schedule-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <TrendingUp size={14} />
                                TREND DETECTED
                            </div>
                            <div className="db-schedule-text" style={{ fontSize: "13px", margin: 0, color: "#334155" }}>
                                Water temperature is projected to peak at 29.1°C between 12:00–14:00. This is within safe range for Clarias sp., but sustained exposure above 30°C can trigger stress.
                            </div>
                        </div>

                        {/* 2. pH Risk Window */}
                        <div className="db-alert-suggests" style={{ margin: 0, padding: "16px" }}>
                            <div className="db-alert-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <AlertTriangle size={14} />
                                PH RISK WINDOW
                            </div>
                            <div className="db-alert-text" style={{ fontSize: "13px", margin: 0, color: "#334155" }}>
                                pH levels are expected to dip to ~6.9 at 04:00–06:00 due to overnight CO₂ accumulation. Consider aeration adjustments before dawn to buffer acidic drift.
                            </div>
                        </div>

                        {/* 3. Mitigation Ready */}
                        <div className="db-schedule-card" style={{ margin: 0, padding: "16px", backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}>
                            <div className="db-schedule-title" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a" }}>
                                <ShieldCheck size={14} />
                                MITIGATION READY
                            </div>
                            <div className="db-schedule-text" style={{ fontSize: "13px", margin: 0, color: "#334155" }}>
                                AI model confidence: 91%. Recommend proactive water-change cycle at 03:30 AM (Pond A) and feeding suppression if temperature exceeds 28.5°C during peak hours.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lower Panel: ML Correlation Analysis */}
            <div className="db-panel-card">
                <div className="db-panel-header">
                    <div className="db-panel-title">
                        <Sparkles size={18} color="#0ea5e9" />
                        <span style={{ fontSize: "16px", fontWeight: 700 }}>ML Correlation Analysis</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, backgroundColor: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "6px", marginLeft: "4px" }}>Beta</span>
                    </div>
                </div>
                <div className="db-panel-body" style={{ textAlign: "left" }}>
                    <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
                        Select two pond variables to compute their Pearson correlation coefficient and generate a machine-learning cross-analysis report.
                    </p>

                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-end" }}>
                        {/* Selector 1 */}
                        <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Select Variable 1</label>
                            <select
                                className="auth-input-new"
                                style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                                value={var1}
                                onChange={(e) => setVar1(e.target.value)}
                            >
                                <option value="">Choose a variable...</option>
                                <option value="Temperature">Water Temperature</option>
                                <option value="pH">pH Level</option>
                                <option value="Turbidity">Turbidity (Kekeruhan)</option>
                                <option value="Nitrate">Nitrate level</option>
                                <option value="Population">Population</option>
                                <option value="Weight">Average Weight</option>
                            </select>
                        </div>

                        {/* Selector 2 */}
                        <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Select Variable 2</label>
                            <select
                                className="auth-input-new"
                                style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
                                value={var2}
                                onChange={(e) => setVar2(e.target.value)}
                            >
                                <option value="">Choose a variable...</option>
                                <option value="Temperature">Water Temperature</option>
                                <option value="pH">pH Level</option>
                                <option value="Turbidity">Turbidity (Kekeruhan)</option>
                                <option value="Nitrate">Nitrate level</option>
                                <option value="Population">Population</option>
                                <option value="Weight">Average Weight</option>
                            </select>
                        </div>

                        {/* Run Analysis Button */}
                        <button
                            type="button"
                            className="db-btn-cyan"
                            style={{ height: "46px", padding: "0 24px", gap: "8px", opacity: (!var1 || !var2) ? 0.6 : 1 }}
                            disabled={!var1 || !var2 || isAnalyzing}
                            onClick={handleRunAnalysis}
                        >
                            <Play size={14} fill="currentColor" />
                            <span>{isAnalyzing ? "Computing..." : "Run Analysis"}</span>
                        </button>
                    </div>

                    {/* Result output block */}
                    {analysisResult && (
                        <div 
                            className="db-schedule-card" 
                            style={{ 
                                marginTop: "32px", 
                                borderLeftWidth: "4px", 
                                borderLeftColor: "#0ea5e9", 
                                animation: "cardFadeIn 0.3s ease both" 
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                <Info size={16} color="#0ea5e9" />
                                <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Correlation Coefficient: r = {analysisResult.r.toFixed(2)}</span>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>({analysisResult.strength})</span>
                            </div>
                            <p style={{ fontSize: "14px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                                {analysisResult.text}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;
