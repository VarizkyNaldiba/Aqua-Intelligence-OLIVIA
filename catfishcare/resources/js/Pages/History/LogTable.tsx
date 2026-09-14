import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { SensorRow } from "@/Types";
import { formatWibDetail } from "@/Utils/dateUtils";

interface LogTableProps {
    historyData: SensorRow[];
}

export default function LogTable({ historyData }: LogTableProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const filteredRows = useMemo(() => {
        if (!historyData || historyData.length === 0) return [];
        return historyData.filter((row) => {
            const status = (row.risk_status || "Low").toLowerCase();
            const matchesStatus = statusFilter === "all" || status === statusFilter.toLowerCase();
            const formattedTime = formatWibDetail(row.created_at);
            const matchesSearch =
                search === "" ||
                String(row.created_at || "").toLowerCase().includes(search.toLowerCase()) ||
                formattedTime.toLowerCase().includes(search.toLowerCase()) ||
                String(row.pH || "").includes(search) ||
                String(row.TEMPERATURE || "").includes(search);
            return matchesStatus && matchesSearch;
        });
    }, [historyData, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredRows.slice(start, start + rowsPerPage);
    }, [filteredRows, currentPage]);

    const handleExportCSV = () => {
        if (historyData.length === 0) return;
        const headers = "ID,Timestamp,Suhu,pH,Turbidity,TDS,TinggiAir,RiskStatus\n";
        const csvRows = historyData
            .map((r) => `${r.id},${r.created_at},${r.TEMPERATURE},${r.pH},${r.TURBIDITY},${r.NITRATE || 0},${r.Length || 0},${r.risk_status || "Low"}`)
            .join("\n");
        const blob = new Blob([headers + csvRows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Telemetry_History_Export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <div className="db-panel-card" style={{ padding: "24px", borderRadius: "16px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        Tabel Log Telemetri Ter-Rekam
                    </h3>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                        History log data sensor tersimpan di database
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
                        <input
                            type="text"
                            placeholder="Cari timestamp/data..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{ padding: "6px 12px 6px 30px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 600 }}
                    >
                        <option value="all">Semua Status</option>
                        <option value="low">Low (Aman)</option>
                        <option value="medium">Medium (Waspada)</option>
                        <option value="high">High (Bahaya)</option>
                    </select>

                    <button
                        type="button"
                        onClick={handleExportCSV}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            backgroundColor: "#10b981",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "12px",
                            cursor: "pointer",
                        }}
                    >
                        <Download size={14} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569", fontWeight: 700 }}>
                            <th style={{ padding: "10px 12px" }}>Waktu Log</th>
                            <th style={{ padding: "10px 12px" }}>Suhu Air</th>
                            <th style={{ padding: "10px 12px" }}>pH Air</th>
                            <th style={{ padding: "10px 12px" }}>Kekeruhan</th>
                            <th style={{ padding: "10px 12px" }}>TDS</th>
                            <th style={{ padding: "10px 12px" }}>Tinggi Air</th>
                            <th style={{ padding: "10px 12px" }}>Status Risiko</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRows.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                                    Tidak ada data log telemetri yang cocok.
                                </td>
                            </tr>
                        ) : (
                            paginatedRows.map((r, i) => (
                                <tr key={r.id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 600 }}>{formatWibDetail(r.created_at)}</td>
                                    <td style={{ padding: "10px 12px" }}>{Number(r.TEMPERATURE || 0).toFixed(1)} °C</td>
                                    <td style={{ padding: "10px 12px" }}>{Number(r.pH || 0).toFixed(2)}</td>
                                    <td style={{ padding: "10px 12px" }}>{Number(r.TURBIDITY || 0).toFixed(0)} NTU</td>
                                    <td style={{ padding: "10px 12px" }}>{Number(r.NITRATE || 288).toFixed(0)} PPM</td>
                                    <td style={{ padding: "10px 12px" }}>{Number(r.Length || 46.4).toFixed(1)} cm</td>
                                    <td style={{ padding: "10px 12px" }}>
                                        <span
                                            style={{
                                                padding: "3px 8px",
                                                borderRadius: "10px",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                backgroundColor: r.risk_status === "Critical" || r.risk_status === "High" ? "#fee2e2" : r.risk_status === "Medium" ? "#fef3c7" : "#dcfce7",
                                                color: r.risk_status === "Critical" || r.risk_status === "High" ? "#dc2626" : r.risk_status === "Medium" ? "#b45309" : "#15803d",
                                            }}
                                        >
                                            {r.risk_status || "Low"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Menampilkan Halaman {currentPage} dari {totalPages}
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                    <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", cursor: "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", cursor: "pointer", opacity: currentPage === totalPages ? 0.5 : 1 }}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
