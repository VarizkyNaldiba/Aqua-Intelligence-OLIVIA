import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import type { MetricType, CsvRow, Theme } from "@/Types";

interface MetricChartsProps {
    currentMetricType: MetricType;
    setCurrentMetricType: (type: MetricType) => void;
    latestRows: CsvRow[];
    theme: Theme;
}

const MetricCharts = ({
    currentMetricType,
    setCurrentMetricType,
    latestRows,
    theme,
}: MetricChartsProps) => {
    // Line chart data - use the latest rows (up to 15 entries)
    const lineChartData = latestRows.map((row: CsvRow) => ({
        time:
            String(row.created_at ?? "").split(" ")[1] ||
            String(row.created_at ?? ""),
        value: parseFloat(String(row[currentMetricType] ?? "0")),
        temperature: parseFloat(String(row.TEMPERATURE ?? "0")),
        pH: parseFloat(String(row.pH ?? "0")),
    }));

    // Skema warna dinamis untuk chart
    const colors =
        theme === "light"
            ? {
                  safe: "#059669", // Emerald
                  warning: "#DC2626", // Red
                  accentSoft: "#0284C7", // Sky Blue
                  accentBright: "#0F766E", // Deep Teal
                  tooltipBg: "#E2ECE9", // Soft Clay Teal
                  tooltipText: "#0F172A",
                  tooltipBorder: "rgba(20, 184, 166, 0.2)",
              }
            : {
                  safe: "#10B981", // Teal/Green
                  warning: "#EF4444", // Red
                  accentSoft: "#38BDF8", // Sky Blue
                  accentBright: "#14B8A6", // Organic Teal
                  tooltipBg: "#070D12", // Midnight Marine
                  tooltipText: "#F8FAFC",
                  tooltipBorder: "rgba(20, 184, 166, 0.15)",
              };

    // Donut chart data - e.g. safe vs warning/danger data point distribution in history
    const safeCount = latestRows.filter(
        (r) =>
            parseFloat(String(r.TEMPERATURE ?? "0")) >= 27.05 &&
            parseFloat(String(r.pH ?? "0")) >= 6.05,
    ).length;
    const safePercentage =
        Math.round((safeCount / latestRows.length) * 100) || 100;
    const warningPercentage = 100 - safePercentage;

    const pieData = [
        { name: "Kondisi Aman", value: safePercentage, color: colors.safe },
        {
            name: "Kondisi Rentan",
            value: warningPercentage,
            color: colors.warning,
        },
    ];

    return (
        <>
            {/* Card 2: Leads (Donut Chart) */}
            <div className="card card-donut">
                <h3>Proporsi Kesehatan Kolam</h3>
                <div className="donut-chart-container">
                    <ResponsiveContainer width="100%" height={160} minHeight={160}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={65}
                                paddingAngle={5}
                                dataKey="value"
                                animationDuration={400}
                                animationEasing="ease-out"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: colors.tooltipBg,
                                    borderColor: colors.tooltipBorder,
                                    color: colors.tooltipText,
                                    fontSize: "11px",
                                    borderRadius: "6px",
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: "center", marginTop: "10px" }}>
                        <span
                            style={{
                                fontSize: "24px",
                                fontWeight: "bold",
                                fontFamily: "var(--font-title)",
                                color: colors.safe,
                            }}
                        >
                            {safePercentage}%
                        </span>
                        <p
                            style={{
                                fontSize: "11px",
                                color: "var(--color-text-muted)",
                                marginTop: "2px",
                            }}
                        >
                            Status Kolam Aman di Siklus Ini
                        </p>
                    </div>
                </div>
            </div>

            {/* Card 3: Line Chart */}
            <div className="card card-line" style={{ gridColumn: "span 4" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px",
                    }}
                >
                    <h3>Tren Parameter Sensor</h3>
                    <select
                        value={currentMetricType}
                        onChange={(e) =>
                            setCurrentMetricType(e.target.value as MetricType)
                        }
                        style={{
                            backgroundColor: "var(--bg-sidebar)",
                            color: "var(--color-text-primary)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "11px",
                            cursor: "pointer",
                        }}
                    >
                        <option value="TEMPERATURE">Temperature (Suhu)</option>
                        <option value="pH">pH</option>
                        <option value="TURBIDITY">Turbidity (Kekeruhan)</option>
                    </select>
                </div>

                <div className="line-chart-container" style={{ minHeight: "220px", width: "100%" }}>
                    <ResponsiveContainer width="100%" height={220} minHeight={200}>
                        <AreaChart
                            data={lineChartData}
                            margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                        >
                            <defs>
                                <linearGradient
                                    id="colorVal"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor={colors.accentSoft}
                                        stopOpacity={0.4}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={colors.accentSoft}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="time"
                                stroke="var(--color-text-muted)"
                                fontSize={9}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="var(--color-text-muted)"
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: colors.tooltipBg,
                                    borderColor: colors.tooltipBorder,
                                    color: colors.tooltipText,
                                    fontSize: "11px",
                                    borderRadius: "6px",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={colors.accentSoft}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorVal)"
                                dot={{
                                    stroke: colors.accentSoft,
                                    strokeWidth: 1,
                                    r: 2,
                                }}
                                activeDot={{
                                    r: 4,
                                    stroke: colors.accentBright,
                                    strokeWidth: 2,
                                }}
                                animationDuration={400}
                                animationEasing="ease-out"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
};

export default MetricCharts;
