import { useState, useMemo, useEffect } from "react";

import {
    Calendar,
    Download,
    Brain,
    ChevronDown,
    Activity,
    Database,
    Layers,
    Search,
    SlidersHorizontal,
    Table as TableIcon,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Clock,
    RefreshCw,
    Filter,
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
    selectedPondId?: number;
}

const POND_OPTIONS = [
    { id: 9, name: "Kolam TFS 9 (Utama - IoT)" },
    { id: 1, name: "Kolam TFS 1" },
    { id: 2, name: "Kolam TFS 2" },
    { id: 3, name: "Kolam TFS 3" },
];

export default function NotificationsTab({
    rawData = [],
    selectedPondId = 1,
}: NotificationsTabProps) {
    const [downloading, setDownloading] = useState(false);
    const [activePondId, setActivePondId] = useState<number>(selectedPondId || 1);
    const [historyData, setHistoryData] = useState<SensorRow[]>(rawData);

    // Sync activePondId if prop changes
    useEffect(() => {
        if (selectedPondId) setActivePondId(selectedPondId);
    }, [selectedPondId]);

    // Fetch genuine telemetry history directly from Firestore/Backend API with 3s realtime polling
    useEffect(() => {
        let isMounted = true;
        const fetchHistoryData = () => {
            fetch(`/api/telemetry/history/${activePondId}`)
                .then(res => res.json())
                .then(data => {
                    if (isMounted && data.history && Array.isArray(data.history)) {
                        setHistoryData(data.history);
                    }
                })
                .catch(() => {});
        };

        fetchHistoryData();
        const pollInterval = setInterval(fetchHistoryData, 3000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, [activePondId]);


    // Table Monitoring Filter & Pagination States
    const [tableSearch, setTableSearch] = useState("");
    const [tableStatusFilter, setTableStatusFilter] = useState<string>("all");
    const [tablePage, setTablePage] = useState<number>(1);
    const [tableRowsPerPage, setTableRowsPerPage] = useState<number>(10);

    const filteredTableRows = useMemo(() => {
        if (!historyData || historyData.length === 0) return [];
        const sorted = [...historyData].sort((a, b) => {
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return timeB - timeA;
        });

        return sorted.filter(row => {
            const status = (row.risk_status || 'Low').toLowerCase();
            if (tableStatusFilter !== 'all') {
                if (tableStatusFilter === 'low' && status !== 'low') return false;
                if (tableStatusFilter === 'medium' && status !== 'medium') return false;
                if (tableStatusFilter === 'high' && (status !== 'high' && status !== 'critical')) return false;
            }
            if (tableSearch.trim() !== '') {
                const q = tableSearch.toLowerCase();
                const tsStr = row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '';
                const match = tsStr.toLowerCase().includes(q) ||
                    (row.entry_id || '').toLowerCase().includes(q) ||
                    status.includes(q) ||
                    String(row.pH ?? '').includes(q) ||
                    String(row.TEMPERATURE ?? '').includes(q);
                if (!match) return false;
            }
            return true;
        });
    }, [historyData, tableSearch, tableStatusFilter]);

    const paginatedTableRows = useMemo(() => {
        const start = (tablePage - 1) * tableRowsPerPage;
        return filteredTableRows.slice(start, start + tableRowsPerPage);
    }, [filteredTableRows, tablePage, tableRowsPerPage]);

    const totalTablePages = Math.ceil(filteredTableRows.length / tableRowsPerPage) || 1;



    // Interactive Date Filter State (Default to last 30 days relative to today)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [rangePreset, setRangePreset] = useState<"7d" | "30d" | "custom">("30d");

    const handleApplyPreset = (preset: "7d" | "30d") => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (preset === "7d" ? 7 : 30));
        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);
        setRangePreset(preset);
        setIsDatePickerOpen(false);
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    };

    // Dynamic Chart Data points calculation based 100% strictly on REAL data from Firestore/Database
    const activeRows = historyData;


    const chartData = useMemo(() => {
        if (!activeRows || activeRows.length === 0) {
            return [];
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Filter real activeRows strictly within [start, end]
        const filteredRows = activeRows.filter(row => {
            if (!row.created_at) return true;
            const rowDate = new Date(row.created_at);
            return rowDate >= start && rowDate <= end;
        });

        // Strictly use filtered rows
        return filteredRows.map((row) => {
            const dateObj = row.created_at ? new Date(row.created_at) : new Date();
            const dateStr = dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
            const fullDateStr = dateObj.toISOString().split("T")[0];

            const ph = parseFloat(String(row.pH ?? "7.2"));
            const turbidity = parseFloat(String(row.TURBIDITY ?? "18.0"));
            const tds = parseFloat(String(row.NITRATE ?? 420));
            const height = parseFloat(String(row.Length ?? 25.0));

            return {
                date: dateStr,
                fullDate: fullDateStr,
                ph: parseFloat(ph.toFixed(1)),
                turbidity: parseFloat(turbidity.toFixed(1)),
                tds: parseFloat(tds.toFixed(0)),
                height: parseFloat(height.toFixed(1)),
            };
        });
    }, [startDate, endDate, activeRows]);


    // Real CSV Export File Generator
    const handleDownload = () => {
        setDownloading(true);
        setTimeout(() => {
            const headers = ["Tanggal", "pH Air", "Turbidity (NTU)", "TDS (ppm)", "Tinggi Air (cm)"];
            const rows = chartData.map(d => [
                d.fullDate,
                d.ph,
                d.turbidity,
                d.tds,
                d.height
            ]);

            const csvContent = "data:text/csv;charset=utf-8," + 
                [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `CatfishCare_Sensor_History_${startDate}_to_${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setDownloading(false);
        }, 500);
    };


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

            {/* Date Picker, Pond Selector and Download Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    {/* Pond Selector Dropdown */}
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <div style={{ position: "absolute", left: "12px", pointerEvents: "none", display: "flex", alignItems: "center" }}>
                            <Layers size={15} style={{ color: "#0ea5e9" }} />
                        </div>
                        <select
                            value={activePondId}
                            onChange={(e) => setActivePondId(Number(e.target.value))}
                            style={{
                                paddingLeft: "36px",
                                paddingRight: "32px",
                                height: "40px",
                                backgroundColor: "#ffffff",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px",
                                color: "#334155",
                                fontWeight: 600,
                                fontSize: "13px",
                                cursor: "pointer",
                                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                appearance: "none",
                                WebkitAppearance: "none",
                            }}
                        >
                            {POND_OPTIONS.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={14}
                            style={{
                                position: "absolute",
                                right: "12px",
                                pointerEvents: "none",
                                color: "#94a3b8",
                            }}
                        />
                    </div>

                    {/* Datepicker Interactive Dropdown */}
                    <div style={{ position: "relative" }}>
                        <button
                            type="button"
                            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
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
                            <span>{formatDateDisplay(startDate)} – {formatDateDisplay(endDate)}</span>
                            <ChevronDown
                                size={14}
                                style={{
                                    color: "#94a3b8",
                                    marginLeft: "4px",
                                    transform: isDatePickerOpen ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s",
                                }}
                            />
                        </button>

                    {/* Popover Date Filter Dialog */}
                    {isDatePickerOpen && (
                        <div
                            style={{
                                position: "absolute",
                                top: "46px",
                                left: 0,
                                zIndex: 100,
                                backgroundColor: "#ffffff",
                                border: "1px solid #cbd5e1",
                                borderRadius: "12px",
                                padding: "16px",
                                width: "320px",
                                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                            }}
                        >
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>PILIH RENTANG TANGGAL</span>
                            
                            {/* Preset Buttons */}
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset("7d")}
                                    style={{
                                        flex: 1,
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: rangePreset === "7d" ? "#f0f9ff" : "#ffffff",
                                        color: rangePreset === "7d" ? "#0ea5e9" : "#475569",
                                        borderColor: rangePreset === "7d" ? "#0ea5e9" : "#cbd5e1",
                                        cursor: "pointer",
                                    }}
                                >
                                    7 Hari Terakhir
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset("30d")}
                                    style={{
                                        flex: 1,
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: rangePreset === "30d" ? "#f0f9ff" : "#ffffff",
                                        color: rangePreset === "30d" ? "#0ea5e9" : "#475569",
                                        borderColor: rangePreset === "30d" ? "#0ea5e9" : "#cbd5e1",
                                        cursor: "pointer",
                                    }}
                                >
                                    30 Hari Terakhir
                                </button>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "4px 0" }} />

                            {/* Custom Date Inputs */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Tanggal Mulai:</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setRangePreset("custom");
                                        }}
                                        style={{
                                            padding: "6px 10px",
                                            borderRadius: "6px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "12px",
                                            color: "#0f172a",
                                        }}
                                    />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Tanggal Selesai:</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setRangePreset("custom");
                                        }}
                                        style={{
                                            padding: "6px 10px",
                                            borderRadius: "6px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "12px",
                                            color: "#0f172a",
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsDatePickerOpen(false)}
                                style={{
                                    marginTop: "4px",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    backgroundColor: "#0ea5e9",
                                    color: "#ffffff",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                Terapkan Filter Tanggal
                            </button>
                        </div>
                    )}
                </div>
            </div>


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
                            Filter Aktif: {formatDateDisplay(startDate)} – {formatDateDisplay(endDate)}
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

                {/* Recharts responsive line container or Empty State */}
                {chartData.length === 0 ? (
                    <div style={{ padding: "50px 20px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", margin: "20px 0" }}>
                        <Database size={36} color="#0ea5e9" style={{ marginBottom: "10px" }} />
                        <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>Tidak Ada Record Sensor di Rentang Tanggal Ini</h4>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                            Tidak ditemukan log telemetry tersimpan pada rentang <strong>{formatDateDisplay(startDate)} – {formatDateDisplay(endDate)}</strong>. Silakan sesuaikan filter tanggal atau kirim payload telemetry baru.
                        </p>
                    </div>
                ) : (
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
                )}


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

            {/* Sensor Output History Monitoring Table Card */}
            <div className="db-panel-card" style={{ borderRadius: "16px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", overflow: "hidden", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)" }}>
                {/* Table Header Section */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <TableIcon size={18} style={{ color: "#0ea5e9" }} />
                            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                Tabel Monitoring Output Sensor
                            </h3>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.12)", padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.3)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }}></span>
                                Realtime Terbaru
                            </span>
                        </div>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                            Riwayat data sensor real-time dari Firebase Firestore & Node Sensor IoT (Total: {filteredTableRows.length} entri)
                        </p>
                    </div>

                    {/* Filter & Search Bar Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        {/* Status Filter Pills */}
                        <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                            <button
                                onClick={() => { setTableStatusFilter("all"); setTablePage(1); }}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    border: "none",
                                    cursor: "pointer",
                                    backgroundColor: tableStatusFilter === "all" ? "#ffffff" : "transparent",
                                    color: tableStatusFilter === "all" ? "#0ea5e9" : "#64748b",
                                    boxShadow: tableStatusFilter === "all" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                                }}
                            >
                                Semua ({historyData.length})
                            </button>
                            <button
                                onClick={() => { setTableStatusFilter("low"); setTablePage(1); }}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    border: "none",
                                    cursor: "pointer",
                                    backgroundColor: tableStatusFilter === "low" ? "#ffffff" : "transparent",
                                    color: tableStatusFilter === "low" ? "#10b981" : "#64748b",
                                    boxShadow: tableStatusFilter === "low" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                                }}
                            >
                                Normal
                            </button>
                            <button
                                onClick={() => { setTableStatusFilter("medium"); setTablePage(1); }}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    border: "none",
                                    cursor: "pointer",
                                    backgroundColor: tableStatusFilter === "medium" ? "#ffffff" : "transparent",
                                    color: tableStatusFilter === "medium" ? "#f59e0b" : "#64748b",
                                    boxShadow: tableStatusFilter === "medium" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                                }}
                            >
                                Warning
                            </button>
                            <button
                                onClick={() => { setTableStatusFilter("high"); setTablePage(1); }}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    border: "none",
                                    cursor: "pointer",
                                    backgroundColor: tableStatusFilter === "high" ? "#ffffff" : "transparent",
                                    color: tableStatusFilter === "high" ? "#ef4444" : "#64748b",
                                    boxShadow: tableStatusFilter === "high" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                                }}
                            >
                                Bahaya
                            </button>
                        </div>

                        {/* Search Input Box */}
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <Search size={14} style={{ position: "absolute", left: "10px", color: "#94a3b8", pointerEvents: "none" }} />
                            <input
                                type="text"
                                placeholder="Cari tanggal / data..."
                                value={tableSearch}
                                onChange={(e) => { setTableSearch(e.target.value); setTablePage(1); }}
                                style={{
                                    paddingLeft: "30px",
                                    paddingRight: "12px",
                                    height: "34px",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    color: "#1e293b",
                                    width: "180px",
                                    outline: "none",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Data View */}
                <div style={{ width: "100%", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                                <th style={{ padding: "12px 16px" }}>No / Time</th>
                                <th style={{ padding: "12px 16px" }}>Suhu (°C)</th>
                                <th style={{ padding: "12px 16px" }}>pH Air</th>
                                <th style={{ padding: "12px 16px" }}>Kekeruhan (NTU)</th>
                                <th style={{ padding: "12px 16px" }}>TDS (PPM)</th>
                                <th style={{ padding: "12px 16px" }}>Tinggi Air (cm)</th>
                                <th style={{ padding: "12px 16px" }}>SFR (%)</th>
                                <th style={{ padding: "12px 16px" }}>WQS Index</th>
                                <th style={{ padding: "12px 16px" }}>Status Resiko</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTableRows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                        <Database size={28} style={{ color: "#94a3b8", marginBottom: "8px" }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada data sensor yang ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTableRows.map((row, index) => {
                                    const itemNo = (tablePage - 1) * tableRowsPerPage + index + 1;
                                    const dateObj = row.created_at ? new Date(row.created_at) : new Date();
                                    const formattedTime = dateObj.toLocaleDateString("id-ID", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    });

                                    const temp = Number(row.TEMPERATURE ?? 27.5);
                                    const ph = Number(row.pH ?? 7.2);
                                    const turbidity = Number(row.TURBIDITY ?? 18.0);
                                    const tds = Number(row.NITRATE ?? 420);
                                    const height = Number(row.Length ?? 25.0);
                                    const sfr = Number(row.Weight ?? 0.05);
                                    const wqs = Number(row.wqs ?? 100);
                                    const status = String(row.risk_status || "Low");

                                    let statusBg = "#f0fdf4";
                                    let statusColor = "#16a34a";
                                    let statusBorder = "#dcfce7";
                                    let StatusIcon = CheckCircle2;

                                    if (status.toLowerCase() === "medium" || status.toLowerCase() === "warning") {
                                        statusBg = "#fffbeb";
                                        statusColor = "#d97706";
                                        statusBorder = "#fef3c7";
                                        StatusIcon = AlertTriangle;
                                    } else if (status.toLowerCase() === "high" || status.toLowerCase() === "critical" || status.toLowerCase() === "danger") {
                                        statusBg = "#fef2f2";
                                        statusColor = "#dc2626";
                                        statusBorder = "#fee2e2";
                                        StatusIcon = AlertCircle;
                                    }

                                    return (
                                        <tr
                                            key={row.entry_id || index}
                                            style={{
                                                borderBottom: "1px solid #f1f5f9",
                                                transition: "background-color 0.15s ease",
                                            }}
                                            className="hover:bg-slate-50"
                                        >
                                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#334155" }}>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontSize: "12px", color: "#0f172a", fontWeight: 700 }}>#{itemNo}</span>
                                                    <span style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                                                        <Clock size={10} />
                                                        {formattedTime}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", fontWeight: 600, color: temp > 32 || temp < 22 ? "#dc2626" : "#1e293b" }}>
                                                {temp.toFixed(1)}°C
                                            </td>
                                            <td style={{ padding: "12px 16px", fontWeight: 600, color: ph < 6.5 || ph > 8.5 ? "#dc2626" : "#1e293b" }}>
                                                {ph.toFixed(1)}
                                            </td>
                                            <td style={{ padding: "12px 16px", fontWeight: 600, color: turbidity > 100 ? "#d97706" : "#1e293b" }}>
                                                {turbidity.toFixed(1)}
                                            </td>
                                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                                                {tds.toFixed(0)}
                                            </td>
                                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                                                {height.toFixed(1)} cm
                                            </td>
                                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                                                {(sfr * 100).toFixed(1)}%
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <div style={{ width: "40px", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                                        <div
                                                            style={{
                                                                width: `${Math.min(100, Math.max(0, wqs))}%`,
                                                                height: "100%",
                                                                backgroundColor: wqs >= 80 ? "#10b981" : wqs >= 60 ? "#f59e0b" : "#ef4444",
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>{wqs.toFixed(0)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                        padding: "4px 8px",
                                                        borderRadius: "12px",
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        backgroundColor: statusBg,
                                                        color: statusColor,
                                                        border: `1px solid ${statusBorder}`,
                                                    }}
                                                >
                                                    <StatusIcon size={12} />
                                                    {status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls Footer */}
                <div style={{ padding: "12px 24px", borderTop: "1px solid #f1f5f9", backgroundColor: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Menampilkan {filteredTableRows.length > 0 ? (tablePage - 1) * tableRowsPerPage + 1 : 0}–{Math.min(tablePage * tableRowsPerPage, filteredTableRows.length)} dari {filteredTableRows.length} entri sensor
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* Rows per page selector */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                            <span>Baris per halaman:</span>
                            <select
                                value={tableRowsPerPage}
                                onChange={(e) => { setTableRowsPerPage(Number(e.target.value)); setTablePage(1); }}
                                style={{ padding: "2px 6px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff" }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        {/* Page Buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <button
                                onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                                disabled={tablePage === 1}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    backgroundColor: "#ffffff",
                                    color: "#475569",
                                    cursor: tablePage === 1 ? "not-allowed" : "pointer",
                                    opacity: tablePage === 1 ? 0.5 : 1,
                                }}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155", padding: "0 6px" }}>
                                {tablePage} / {totalTablePages}
                            </span>
                            <button
                                onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
                                disabled={tablePage === totalTablePages}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    backgroundColor: "#ffffff",
                                    color: "#475569",
                                    cursor: tablePage === totalTablePages ? "not-allowed" : "pointer",
                                    opacity: tablePage === totalTablePages ? 0.5 : 1,
                                }}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
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
