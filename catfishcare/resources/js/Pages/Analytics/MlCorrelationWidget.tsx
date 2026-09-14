import { useState, useMemo } from "react";
import { GitBranch, Play, AlertTriangle, TrendingUp, Minus, TrendingDown } from "lucide-react";
import type { SensorRow } from "@/Types";

interface MlCorrelationWidgetProps {
    rawData: SensorRow[];
}

type VarKey = "TEMPERATURE" | "pH" | "TURBIDITY" | "NITRATE" | "Length";

const VARIABLES: { key: VarKey; label: string; unit: string }[] = [
    { key: "TEMPERATURE", label: "Suhu Air",    unit: "°C"  },
    { key: "pH",          label: "pH Air",       unit: "pH"  },
    { key: "TURBIDITY",   label: "Kekeruhan",   unit: "NTU" },
    { key: "NITRATE",     label: "TDS (Nitrat)", unit: "PPM" },
    { key: "Length",      label: "Tinggi Air",   unit: "cm"  },
];

/** Pearson correlation coefficient */
function pearson(xs: number[], ys: number[]): number {
    const n = xs.length;
    if (n < 2) return 0;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const dx  = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
    const dy  = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
    if (dx === 0 || dy === 0) return 0;
    return num / (dx * dy);
}

function interpretCorrelation(r: number, v1: string, v2: string): { strength: string; direction: string; insight: string; color: string; icon: JSX.Element } {
    const abs = Math.abs(r);
    const pos = r > 0;

    const direction = pos ? "Positif" : "Negatif";
    let strength: string;
    let color: string;
    let icon: JSX.Element;

    if (abs >= 0.8)      { strength = "Sangat Kuat"; color = "#dc2626"; icon = <TrendingUp size={16} />; }
    else if (abs >= 0.6) { strength = "Kuat";         color = "#d97706"; icon = <TrendingUp size={16} />; }
    else if (abs >= 0.4) { strength = "Sedang";       color = "#2563eb"; icon = <Minus      size={16} />; }
    else if (abs >= 0.2) { strength = "Lemah";        color = "#64748b"; icon = <TrendingDown size={16} />; }
    else                 { strength = "Tidak Ada";    color = "#94a3b8"; icon = <Minus      size={16} />; }

    const insight = abs < 0.2
        ? `${v1} dan ${v2} tidak memiliki hubungan linear yang signifikan dalam dataset ini.`
        : pos
            ? `Ketika ${v1} meningkat, ${v2} cenderung ikut meningkat (korelasi ${strength.toLowerCase()}).`
            : `Ketika ${v1} meningkat, ${v2} cenderung menurun (korelasi ${strength.toLowerCase()}).`;

    return { strength, direction, insight, color, icon };
}

export default function MlCorrelationWidget({ rawData }: MlCorrelationWidgetProps) {
    const [var1, setVar1] = useState<VarKey | "">("");
    const [var2, setVar2] = useState<VarKey | "">("");
    const [result, setResult] = useState<{ r: number; n: number; v1label: string; v2label: string } | null>(null);
    const [error, setError] = useState("");

    const handleRun = () => {
        setError("");
        setResult(null);

        if (!var1 || !var2) { setError("Pilih dua variabel terlebih dahulu."); return; }
        if (var1 === var2)  { setError("Pilih dua variabel yang berbeda."); return; }
        if (rawData.length < 5) { setError("Data terlalu sedikit (minimal 5 baris diperlukan)."); return; }

        const xs = rawData.map(r => parseFloat(String(r[var1] ?? 0))).filter(v => !isNaN(v));
        const ys = rawData.map(r => parseFloat(String(r[var2] ?? 0))).filter(v => !isNaN(v));
        const n  = Math.min(xs.length, ys.length);

        const r = pearson(xs.slice(0, n), ys.slice(0, n));
        const v1label = VARIABLES.find(v => v.key === var1)!.label;
        const v2label = VARIABLES.find(v => v.key === var2)!.label;

        setResult({ r, n, v1label, v2label });
    };

    // Full correlation matrix (for mini heatmap)
    const matrix = useMemo(() => {
        if (rawData.length < 3) return null;
        return VARIABLES.map(v1 =>
            VARIABLES.map(v2 => {
                const xs = rawData.map(r => parseFloat(String(r[v1.key] ?? 0)));
                const ys = rawData.map(r => parseFloat(String(r[v2.key] ?? 0)));
                return pearson(xs, ys);
            })
        );
    }, [rawData]);

    const heatColor = (r: number) => {
        if (r >= 0.8)  return "#dc2626";
        if (r >= 0.6)  return "#f97316";
        if (r >= 0.4)  return "#facc15";
        if (r >= 0.2)  return "#86efac";
        if (r >= 0)    return "#d1fae5";
        if (r >= -0.2) return "#dbeafe";
        if (r >= -0.4) return "#93c5fd";
        if (r >= -0.6) return "#3b82f6";
        if (r >= -0.8) return "#1d4ed8";
        return "#1e3a8a";
    };

    const interp = result ? interpretCorrelation(result.r, result.v1label, result.v2label) : null;

    return (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <GitBranch size={20} color="#6366f1" />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>ML Correlation Analysis</h3>
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", backgroundColor: "#ede9fe", color: "#7c3aed" }}>Beta</span>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
                Pilih dua variabel kolam untuk menghitung Pearson correlation coefficient dan menghasilkan laporan cross-analysis machine learning.
            </p>

            {/* Variable Selectors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "end", marginBottom: "20px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Select Variable 1</label>
                    <select
                        value={var1}
                        onChange={e => setVar1(e.target.value as VarKey)}
                        style={{ width: "100%", padding: "10px 14px", fontSize: "13px", fontWeight: 500, color: "#0f172a", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", appearance: "none", cursor: "pointer" }}
                    >
                        <option value="">Choose a variable...</option>
                        {VARIABLES.map(v => <option key={v.key} value={v.key}>{v.label} ({v.unit})</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Select Variable 2</label>
                    <select
                        value={var2}
                        onChange={e => setVar2(e.target.value as VarKey)}
                        style={{ width: "100%", padding: "10px 14px", fontSize: "13px", fontWeight: 500, color: "#0f172a", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", appearance: "none", cursor: "pointer" }}
                    >
                        <option value="">Choose a variable...</option>
                        {VARIABLES.map(v => <option key={v.key} value={v.key}>{v.label} ({v.unit})</option>)}
                    </select>
                </div>
                <button
                    onClick={handleRun}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#6366f1", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
                >
                    <Play size={14} fill="#fff" />
                    Run Analysis
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "#b91c1c", fontWeight: 600 }}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* Result */}
            {result && interp && (
                <div style={{ border: "1px solid #e0e7ff", borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
                    {/* Score bar */}
                    <div style={{ padding: "16px 20px", backgroundColor: "#f5f3ff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#4c1d95" }}>{result.v1label} ↔ {result.v2label}</span>
                            <span style={{ fontSize: "11px", color: "#6b7280" }}>n = {result.n} data points</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "36px", fontWeight: 900, color: interp.color, lineHeight: 1 }}>
                                {result.r.toFixed(3)}
                            </span>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: interp.color, fontWeight: 700, fontSize: "13px" }}>
                                    {interp.icon}
                                    {interp.strength} · {interp.direction}
                                </div>
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Pearson r coefficient</div>
                            </div>
                        </div>
                        {/* Bar visual */}
                        <div style={{ marginTop: "12px", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.abs(result.r) * 100}%`, backgroundColor: interp.color, borderRadius: "99px", transition: "width 0.6s ease" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "#94a3b8" }}>
                            <span>0</span><span>Tidak Berkorelasi</span><span>±1</span>
                        </div>
                    </div>
                    {/* Insight */}
                    <div style={{ padding: "14px 20px", backgroundColor: "#ffffff", borderTop: "1px solid #e0e7ff" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>ML Insight</div>
                        <p style={{ fontSize: "13px", color: "#374151", margin: 0, lineHeight: 1.6 }}>{interp.insight}</p>
                    </div>
                </div>
            )}

            {/* Mini Correlation Heatmap */}
            {matrix && (
                <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                        Correlation Matrix — All Parameters
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ borderCollapse: "collapse", fontSize: "11px", width: "100%" }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: "6px 8px", color: "#94a3b8", fontWeight: 600, textAlign: "left" }}></th>
                                    {VARIABLES.map(v => <th key={v.key} style={{ padding: "6px 8px", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>{v.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {VARIABLES.map((v1, i) => (
                                    <tr key={v1.key}>
                                        <td style={{ padding: "4px 8px", fontWeight: 700, color: "#475569", whiteSpace: "nowrap" }}>{v1.label}</td>
                                        {VARIABLES.map((_, j) => {
                                            const r = matrix[i][j];
                                            return (
                                                <td key={j} style={{ padding: "4px 6px", textAlign: "center" }}>
                                                    <div style={{ width: "52px", height: "28px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", backgroundColor: heatColor(r), fontWeight: 700, fontSize: "11px", color: Math.abs(r) > 0.5 ? "#fff" : "#1e293b" }}>
                                                        {r.toFixed(2)}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Legend */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Legend:</span>
                        {[{c:"#1d4ed8",l:"Kuat Neg"},{c:"#93c5fd",l:"Lemah Neg"},{c:"#d1fae5",l:"Tdk Ada"},{c:"#facc15",l:"Sedang"},{c:"#f97316",l:"Kuat"},{c:"#dc2626",l:"Sangat Kuat"}].map(item => (
                            <div key={item.l} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: item.c, display: "inline-block" }} />
                                <span style={{ fontSize: "10px", color: "#64748b" }}>{item.l}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
