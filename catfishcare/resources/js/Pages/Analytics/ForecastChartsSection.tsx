import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface ForecastChartsSectionProps {
    forecastData: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#f8fafc", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <div style={{ fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>{label}</div>
            {payload.map((e: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "14px", marginBottom: "3px" }}>
                    <span style={{ color: e.color, fontWeight: 600 }}>{e.name}</span>
                    <span style={{ fontWeight: 800, color: "#fff" }}>{typeof e.value === "number" ? e.value.toFixed(2) : e.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function ForecastChartsSection({ forecastData }: ForecastChartsSectionProps) {
    return (
        <div className="db-panel-card" style={{ padding: "24px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            {/* Header */}
            <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                    24-Hour BiLSTM Forecast
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                    Projeksi 5 parameter kualitas air dalam 1 tampilan — dual axis (kiri: °C / pH / NTU, kanan: PPM / cm)
                </p>
            </div>

            {/* Legend pills */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
                {[
                    { color: "#f59e0b", label: "Suhu (°C)" },
                    { color: "#10b981", label: "pH Air" },
                    { color: "#0ea5e9", label: "Turbidity (NTU)" },
                    { color: "#a855f7", label: "TDS (PPM)" },
                    { color: "#22c55e", label: "Tinggi Air (cm)" },
                ].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ width: "28px", height: "3px", backgroundColor: item.color, borderRadius: "2px", display: "inline-block" }} />
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Combined Chart */}
            <div style={{ width: "100%", height: "320px" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData} margin={{ left: -10, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="time"
                            stroke="#94a3b8"
                            fontSize={11}
                            fontWeight={500}
                            tickLine={false}
                            axisLine={false}
                        />
                        {/* Left Y-axis: Suhu, pH, Turbidity (small values) */}
                        <YAxis
                            yAxisId="left"
                            stroke="#94a3b8"
                            fontSize={11}
                            fontWeight={500}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 50]}
                            tickCount={6}
                        />
                        {/* Right Y-axis: TDS, Water Level (large values) */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#94a3b8"
                            fontSize={11}
                            fontWeight={500}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 700]}
                            tickCount={6}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }} />

                        {/* Left axis lines */}
                        <Line yAxisId="left"  type="monotone" dataKey="temperature"  name="Suhu (°C)"       stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b" }} activeDot={{ r: 6 }} />
                        <Line yAxisId="left"  type="monotone" dataKey="ph"           name="pH Air"          stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} activeDot={{ r: 6 }} />
                        <Line yAxisId="left"  type="monotone" dataKey="turbidity"    name="Turbidity (NTU)" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, fill: "#0ea5e9" }} activeDot={{ r: 6 }} />

                        {/* Right axis lines */}
                        <Line yAxisId="right" type="monotone" dataKey="tds"          name="TDS (PPM)"       stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3, fill: "#a855f7" }} activeDot={{ r: 6 }} />
                        <Line yAxisId="right" type="monotone" dataKey="water_level"  name="Tinggi Air (cm)" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: "#22c55e" }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Axis labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>← °C / pH / NTU (kiri)</span>
                <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>PPM / cm (kanan) →</span>
            </div>
        </div>
    );
}
