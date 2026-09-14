import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { SensorRow } from "@/Types";

interface TelemetryChartsSectionProps {
    rawData: SensorRow[];
}

export default function TelemetryChartsSection({ rawData }: TelemetryChartsSectionProps) {
    const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

    // Filter by selected time range then map for Recharts
    const now = Date.now();
    const msWindow: Record<string, number> = { "24h": 86400000, "7d": 604800000, "30d": 2592000000 };

    const filteredData = rawData.filter((row) => {
        const rawTime = row.created_at || row.timestamp || "";
        if (!rawTime) return true; // keep rows without timestamp
        const t = new Date(rawTime).getTime();
        return !isNaN(t) && now - t <= msWindow[timeRange];
    });

    // If time filter yields nothing fall back to last 50 rows
    const source = filteredData.length > 0 ? filteredData : rawData.slice(-50);

    const chartData = source.map((row) => {
        const rawTime = row.created_at || row.timestamp || "";
        let timeStr = "";
        if (rawTime) {
            const dateObj = new Date(rawTime);
            if (!isNaN(dateObj.getTime())) {
                timeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            } else {
                timeStr = String(rawTime).split(" ")[1] || String(rawTime);
            }
        } else {
            timeStr = "Live";
        }

        return {
            date: timeStr,
            ph: typeof row.pH === "number" ? row.pH : parseFloat(String(row.pH)) || 7.0,
            turbidity: typeof row.TURBIDITY === "number" ? row.TURBIDITY : parseFloat(String(row.TURBIDITY)) || 12,
            tds: typeof row.NITRATE === "number" ? row.NITRATE : parseFloat(String(row.NITRATE)) || 288,
            height: typeof row.Length === "number" ? row.Length : parseFloat(String(row.Length)) || 46.4,
            temp: typeof row.TEMPERATURE === "number" ? row.TEMPERATURE : parseFloat(String(row.TEMPERATURE)) || 28.5,
        };
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div
                    style={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                        color: "#f8fafc",
                        fontSize: "13px",
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: "8px", color: "#94a3b8", fontSize: "12px" }}>
                        Time: {label}
                    </div>
                    {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
                            <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}:</span>
                            <span style={{ fontWeight: 800, color: "#ffffff" }}>
                                {entry.value} {entry.name === "pH Air" ? "" : entry.name === "Turbidity" ? "NTU" : entry.name === "TDS" ? "PPM" : "cm"}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="db-panel-card" style={{ padding: "24px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
                        Water Quality — Historical Trend
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                        Real-time parameter fluctuation & history logs
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {/* Time filter buttons */}
                    <div style={{ display: "flex", gap: "4px", backgroundColor: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                        {(["24h", "7d", "30d"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                style={{
                                    padding: "4px 10px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    borderRadius: "6px",
                                    border: "none",
                                    cursor: "pointer",
                                    backgroundColor: timeRange === r ? "#ffffff" : "transparent",
                                    color: timeRange === r ? "#0284c7" : "#64748b",
                                    boxShadow: timeRange === r ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                                    transition: "all 0.2s",
                                }}
                            >
                                {r.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart Legend Indicators */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#38bdf8" }}></span>
                    <span>pH Air</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#fb923c" }}></span>
                    <span>Turbidity</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#818cf8" }}></span>
                    <span>TDS</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#34d399" }}></span>
                    <span>Tinggi Air</span>
                </div>
            </div>

            {/* Chart Area */}
            <div style={{ flex: 1, minHeight: "380px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: -15, right: 15, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} dy={8} />
                        <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} domain={[0, 50]} />
                        <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} fontWeight={500} tickLine={false} axisLine={false} domain={[0, 1200]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }} />
                        <Line yAxisId="left" type="monotone" dataKey="ph" name="pH Air" stroke="#38bdf8" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                        <Line yAxisId="left" type="monotone" dataKey="turbidity" name="Turbidity" stroke="#fb923c" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                        <Line yAxisId="right" type="monotone" dataKey="tds" name="TDS" stroke="#818cf8" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                        <Line yAxisId="right" type="monotone" dataKey="height" name="Tinggi Air" stroke="#34d399" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
