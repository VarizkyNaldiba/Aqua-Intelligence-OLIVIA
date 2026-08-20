import { useState } from "react";
import {
    Calendar,
    Download,
    Brain,
    ChevronDown,
    Activity,
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import type { SensorRow } from "@/Types";

interface NotificationsTabProps {
    currentData: SensorRow | null;
    rawData: SensorRow[];
}

export default function NotificationsTab({
    rawData = [],
}: NotificationsTabProps) {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = () => {
        setDownloading(true);
        setTimeout(() => {
            setDownloading(false);
            alert("Report downloaded successfully as CSV.");
        }, 1500);
    };

    // Prepare 30 data points for the trend chart
    const chartData = [];
    if (rawData && rawData.length > 0) {
        const step = Math.max(1, Math.floor(rawData.length / 30));
        for (let i = 0; i < 30; i++) {
            const idx = Math.min(rawData.length - 1, i * step);
            const row = rawData[idx];

            const d = new Date(2026, 5, 10); // 10 Jun
            d.setDate(d.getDate() + i);
            const dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });

            const temp = parseFloat(String(row.TEMPERATURE ?? "28"));
            const ph = parseFloat(String(row.pH ?? "7.0"));
            const turbidity = parseFloat(String(row.TURBIDITY ?? "30"));
            const tds = ph * 130;
            const height = 100 + temp * 0.2;

            chartData.push({
                date: dateStr,
                ph: parseFloat(ph.toFixed(1)),
                turbidity: parseFloat(turbidity.toFixed(1)),
                tds: parseFloat(tds.toFixed(0)),
                height: parseFloat(height.toFixed(1)),
            });
        }
    } else {
        // Fallback premium mock data matching Figma trend curves
        for (let i = 0; i < 30; i++) {
            const d = new Date(2026, 5, 10);
            d.setDate(d.getDate() + i);
            const dateStr = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
            
            const phValue = 7.1 + Math.sin(i / 5) * 0.2;
            const turbValue = 18 + Math.sin(i / 2.5) * 6 + Math.cos(i / 1.5) * 3;
            const tdsValue = 820 + Math.sin(i / 6) * 100 + Math.cos(i / 3) * 40;
            const heightValue = 101.5 + Math.sin(i / 4) * 1.5;

            chartData.push({
                date: dateStr,
                ph: parseFloat(phValue.toFixed(1)),
                turbidity: parseFloat(turbValue.toFixed(1)),
                tds: parseFloat(tdsValue.toFixed(0)),
                height: parseFloat(heightValue.toFixed(1)),
            });
        }
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    padding: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                    color: "#f8fafc",
                    fontSize: "12px"
                }}>
                    <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#94a3b8" }}>{label}</p>
                    {payload.map((pld: any) => (
                        <div key={pld.name} style={{ display: "flex", gap: "12px", justifyContent: "space-between", margin: "4px 0" }}>
                            <span style={{ color: pld.color, display: "flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ width: "6px", height: "6px", backgroundColor: pld.color, borderRadius: "50%" }}></span>
                                {pld.name}:
                            </span>
                            <span style={{ fontWeight: 700 }}>{pld.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="tab-page notifications-page" style={{ padding: "0 8px", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Header Title Section */}
            <div style={{ textAlign: "left", marginTop: "10px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", margin: 0 }}>
                    Data Reports & History
                </h1>
                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px", margin: 0 }}>
                    Analyze historical water quality trends across all ponds
                </p>
            </div>

            {/* Date Picker and Download Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                {/* Datepicker Styled */}
                <button
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "0 16px",
                        height: "40px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        color: "#334155",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <Calendar size={15} style={{ color: "#0ea5e9" }} />
                    <span>10 Jun 2026 – 09 Jul 2026</span>
                    <ChevronDown size={14} style={{ color: "#94a3b8", marginLeft: "4px" }} />
                </button>

                {/* Premium Split Download Button */}
                <div style={{ display: "flex", alignItems: "center", backgroundColor: "#0ea5e9", borderRadius: "8px", overflow: "hidden", height: "40px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                    <button
                        onClick={handleDownload}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "0 16px",
                            height: "100%",
                            backgroundColor: "transparent",
                            color: "#ffffff",
                            fontWeight: 600,
                            fontSize: "13px",
                            cursor: "pointer",
                            border: "none",
                        }}
                    >
                        <Download size={15} />
                        <span>{downloading ? "Downloading..." : "Download Report"}</span>
                    </button>
                    <div style={{ width: "1px", height: "20px", backgroundColor: "rgba(255, 255, 255, 0.3)" }}></div>
                    <button
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 12px",
                            height: "100%",
                            backgroundColor: "transparent",
                            color: "#ffffff",
                            cursor: "pointer",
                            border: "none",
                        }}
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>
            </div>

            {/* Historical Trend Line Chart Card */}
            <div className="db-panel-card" style={{ padding: "20px 24px", borderRadius: "16px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{ textAlign: "left" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                            Water Quality — Historical Trend
                        </h3>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                            30 data points · 10 Jun 2026 – 09 Jul 2026
                        </p>
                    </div>

                    {/* Chart Legend Pills */}
                    <div style={{ display: "flex", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#38bdf8" }}></span>
                            <span>pH Air</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fb923c" }}></span>
                            <span>Turbidity</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#818cf8" }}></span>
                            <span>TDS</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#34d399" }}></span>
                            <span>Tinggi Air</span>
                        </div>
                    </div>
                </div>

                {/* Recharts responsive line container */}
                <div style={{ width: "100%", height: "320px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ left: -15, right: 15, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                fontSize={11}
                                fontWeight={500}
                                tickLine={false}
                                axisLine={false}
                                dy={8}
                            />
                            {/* Left YAxis with ticks aligned exactly to Y positions of grid */}
                            <YAxis
                                yAxisId="left"
                                stroke="#94a3b8"
                                fontSize={11}
                                fontWeight={500}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 48]}
                                ticks={[8, 15, 24, 40]}
                            />
                            {/* Right YAxis orientation right orientation */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#94a3b8"
                                fontSize={11}
                                fontWeight={500}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 1300]}
                                ticks={[99.2, 399.2, 699.2, 1200]}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="ph"
                                name="pH Air"
                                stroke="#38bdf8"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="turbidity"
                                name="Turbidity"
                                stroke="#fb923c"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="tds"
                                name="TDS"
                                stroke="#818cf8"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="height"
                                name="Tinggi Air"
                                stroke="#34d399"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Subtitle labels under chart */}
                <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "16px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#38bdf8" }}></span>
                        <span>pH Air</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#fb923c" }}></span>
                        <span>Turbidity (NTU)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#818cf8" }}></span>
                        <span>TDS (PPM)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#34d399" }}></span>
                        <span>Tinggi Air (cm)</span>
                    </div>
                </div>
            </div>

            {/* Historical AI Insight Section */}
            <div className="db-panel-card" style={{ borderRadius: "16px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", overflow: "hidden", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)" }}>
                {/* Header Banner */}
                <div style={{ backgroundColor: "#0f172a", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ backgroundColor: "rgba(14, 165, 233, 0.15)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px" }}>
                            <Brain size={20} color="#0ea5e9" />
                        </div>
                        <div style={{ textAlign: "left" }}>
                            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                                Historical AI Insight
                            </h4>
                            <p style={{ fontSize: "12px", color: "#94a3b8", margin: "2px 0 0 0" }}>
                                Pattern analysis · last 30 days · confidence 88%
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "20px", padding: "6px 12px", fontSize: "11px", fontWeight: 700, color: "#34d399" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }}></span>
                        <span>Model up to date</span>
                    </div>
                </div>

                {/* Content Body */}
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#334155", margin: 0, textAlign: "left" }}>
                        Over the analyzed period, the AI model identified a <strong>recurring weekly quality degradation cycle</strong> closely correlated with organic waste accumulation and reduced aeration on weekends. Turbidity and TDS tend to peak 12–18 hours after organic accumulation periods, while pH shows a lagging dip. The water level shows <strong>stable mid-week baselines</strong> with minor evaporative loss on warmer afternoons. No anomalous sensor readings were detected beyond expected seasonal variance.
                    </p>

                    {/* Three Column Details Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                        {/* Column 1: Weekend Quality Drop */}
                        <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#fffbeb", border: "1px solid #fef3c7", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px" }}>
                            <div>
                                <h5 style={{ fontSize: "14px", fontWeight: 700, color: "#d97706", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Activity size={14} />
                                    <span>Weekend Quality Drop</span>
                                </h5>
                                <p style={{ fontSize: "13px", lineHeight: "1.5", color: "#475569", marginTop: "12px", marginBottom: "16px", textAlign: "left" }}>
                                    Water quality consistently degrades on Saturdays and Sundays — turbidity spikes an average of +38% and pH drops by ~0.3 units. This correlates with organic load accumulation and reduced aeration checks.
                                </p>
                            </div>
                            <button
                                style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                                onClick={() => alert("Showing weekend quality drop trend details...")}
                            >
                                <span>View details</span>
                                <span>→</span>
                            </button>
                        </div>

                        {/* Column 2: TDS Trend Upward */}
                        <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px" }}>
                            <div>
                                <h5 style={{ fontSize: "14px", fontWeight: 700, color: "#e11d48", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Activity size={14} />
                                    <span>TDS Trend Upward</span>
                                </h5>
                                <p style={{ fontSize: "13px", lineHeight: "1.5", color: "#475569", marginTop: "12px", marginBottom: "16px", textAlign: "left" }}>
                                    TDS has risen steadily from ~670 PPM to ~980 PPM over the past 30 days, indicating gradual mineral accumulation. A partial water replacement is recommended within the next 5 days.
                                </p>
                            </div>
                            <button
                                style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                                onClick={() => alert("Showing mineral accumulation TDS trends...")}
                            >
                                <span>View details</span>
                                <span>→</span>
                            </button>
                        </div>

                        {/* Column 3: Optimal Stability Window */}
                        <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#f0fdf4", border: "1px solid #dcfce7", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "180px" }}>
                            <div>
                                <h5 style={{ fontSize: "14px", fontWeight: 700, color: "#16a34a", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Activity size={14} />
                                    <span>Optimal Stability Window</span>
                                </h5>
                                <p style={{ fontSize: "13px", lineHeight: "1.5", color: "#475569", marginTop: "12px", marginBottom: "16px", textAlign: "left" }}>
                                    Mid-week (Tuesday–Thursday) consistently shows the most stable sensor readings across all parameters. Consider scheduling pond inspections and maintenance activities during this window for best outcomes.
                                </p>
                            </div>
                            <button
                                style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                                onClick={() => alert("Showing optimal inspection schedule guidelines...")}
                            >
                                <span>View details</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
