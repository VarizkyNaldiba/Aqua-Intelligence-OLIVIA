import { Link, Head } from "@inertiajs/react";
import { Fish, Cpu, TrendingUp, Droplets, ShieldCheck, ArrowRight, Activity, Brain } from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
    const [theme, setTheme] = useState("light");

    // Enforce light theme on the landing page for that crisp premium Apple vibe
    useEffect(() => {
        document.body.classList.add("light-theme");
        return () => {
            // Restore dark mode default if user navigates away
            document.body.classList.remove("light-theme");
        };
    }, []);

    return (
        <div className="landing-layout" style={{ backgroundColor: "#ffffff", color: "#1d1d1f", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
            <Head title="Pencegahan Gagal Panen Lele" />
            
            {/* Main Header (Frosted Glass, Single unified menu bar) */}
            <header style={{
                height: "60px",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                position: "sticky",
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                    <Link href="/" style={{ color: "#1d1d1f", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.015em" }}>
                        <Fish size={20} style={{ color: "#0066cc" }} />
                        <span>CATFISHCARE</span>
                    </Link>
                    <nav className="hidden-mobile" style={{ display: "flex", gap: "24px" }}>
                        <a href="#fitur" style={{ color: "#6e6e73", fontSize: "14px", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#0066cc"} onMouseOut={e=>e.currentTarget.style.color="#6e6e73"}>Fitur</a>
                        <a href="#sensor" style={{ color: "#6e6e73", fontSize: "14px", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#0066cc"} onMouseOut={e=>e.currentTarget.style.color="#6e6e73"}>Teknologi</a>
                        <a href="#solusi" style={{ color: "#6e6e73", fontSize: "14px", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#0066cc"} onMouseOut={e=>e.currentTarget.style.color="#6e6e73"}>Solusi IoT</a>
                    </nav>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <Link 
                        href="/login" 
                        style={{ 
                            fontSize: "14px", 
                            color: "#1d1d1f", 
                            textDecoration: "none",
                            fontWeight: 500,
                            padding: "6px 14px",
                            transition: "color 0.2s"
                        }}
                        onMouseOver={e=>e.currentTarget.style.color="#0066cc"}
                        onMouseOut={e=>e.currentTarget.style.color="#1d1d1f"}
                    >
                        Masuk
                    </Link>
                    <Link 
                        href="/dashboard" 
                        style={{ 
                            fontSize: "13px", 
                            fontWeight: 500, 
                            color: "#ffffff", 
                            backgroundColor: "#0066cc", 
                            padding: "8px 18px", 
                            borderRadius: "9999px", 
                            textDecoration: "none",
                            transition: "transform 0.1s ease"
                        }}
                        onClick={e => {
                            e.currentTarget.style.transform = "scale(0.95)";
                            setTimeout(() => { if(e.currentTarget) e.currentTarget.style.transform = "scale(1)"; }, 100);
                        }}
                    >
                        Buka Dashboard
                    </Link>
                </div>
            </header>

            {/* SECTION 1: White Hero Canvas (Apple-style bold title, minimal layout) */}
            <section style={{ padding: "80px 24px", textAlign: "center", backgroundColor: "#ffffff" }}>
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "#0066cc" }}>
                        Teknologi IoT Pintar
                    </span>
                    <h1 style={{ 
                        fontSize: "56px", 
                        fontWeight: 600, 
                        letterSpacing: "-0.025em", 
                        lineHeight: 1.07, 
                        marginTop: "16px",
                        color: "#1d1d1f"
                    }}>
                        Masa depan budidaya lele.<br />Dipandu oleh kecerdasan.
                    </h1>
                    <p style={{ 
                        fontSize: "24px", 
                        fontWeight: 300, 
                        lineHeight: 1.4, 
                        color: "#86868b", 
                        marginTop: "24px", 
                        maxWidth: "600px", 
                        margin: "24px auto 0" 
                    }}>
                        Pantau kualitas air kolam lele Anda secara real-time. Deteksi dini risiko penyakit dan gagal panen dengan analisis prediktif AI.
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "32px" }}>
                        <Link 
                            href="/dashboard" 
                            style={{ 
                                backgroundColor: "#0066cc", 
                                color: "#ffffff", 
                                fontSize: "17px", 
                                padding: "12px 24px", 
                                borderRadius: "9999px", 
                                textDecoration: "none", 
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            Coba Demo Sekarang <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>

                {/* Hero Illustration */}
                <div style={{ marginTop: "60px", maxWidth: "980px", margin: "60px auto 0", padding: "0 20px" }}>
                    <div style={{
                        background: "linear-gradient(135deg, #1d1d1f 0%, #000000 100%)",
                        borderRadius: "18px",
                        padding: "48px",
                        color: "#ffffff",
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                        textAlign: "left"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px" }}>
                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#2997ff", textTransform: "uppercase" }}>Tampilan Konsol Utama</h3>
                                <h2 style={{ fontSize: "32px", fontWeight: 600, marginTop: "8px", letterSpacing: "-0.015em" }}>CATFISHCARE Dashboard</h2>
                            </div>
                            <span style={{ fontSize: "12px", padding: "4px 10px", background: "rgba(255, 255, 255, 0.15)", borderRadius: "9999px" }}>v1.0 Live</span>
                        </div>

                        {/* Fake Dashboard UI */}
                        <div style={{ display: "flex", gap: "16px", marginTop: "32px", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "200px", padding: "20px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <span style={{ fontSize: "12px", color: "#86868b" }}>SUHU AIR</span>
                                <div style={{ fontSize: "28px", fontWeight: 600, marginTop: "8px", color: "#30d158" }}>28.4 °C</div>
                                <span style={{ fontSize: "11px", color: "#30d158" }}>Optimal</span>
                            </div>
                            <div style={{ flex: 1, minWidth: "200px", padding: "20px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <span style={{ fontSize: "12px", color: "#86868b" }}>KADAR pH</span>
                                <div style={{ fontSize: "28px", fontWeight: 600, marginTop: "8px", color: "#ff9f0a" }}>6.4</div>
                                <span style={{ fontSize: "11px", color: "#ff9f0a" }}>Waspada Asam</span>
                            </div>
                            <div style={{ flex: 1, minWidth: "200px", padding: "20px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <span style={{ fontSize: "12px", color: "#86868b" }}>KEKERUHAN (TURBIDITY)</span>
                                <div style={{ fontSize: "28px", fontWeight: 600, marginTop: "8px", color: "#ff453a" }}>182 NTU</div>
                                <span style={{ fontSize: "11px", color: "#ff453a" }}>Kritis - Segera Kuras</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2: Near-Black Dark Tile (Feature presentation) */}
            <section id="fitur" style={{ padding: "80px 24px", backgroundColor: "#1d1d1f", color: "#ffffff", textAlign: "center" }}>
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "#2997ff" }}>
                        Kekuatan Analitik AI
                    </span>
                    <h2 style={{ 
                        fontSize: "40px", 
                        fontWeight: 600, 
                        letterSpacing: "-0.02em", 
                        lineHeight: 1.1, 
                        marginTop: "16px"
                    }}>
                        Mencegah kematian massal lele<br />sebelum bahaya melanda.
                    </h2>
                    <p style={{ 
                        fontSize: "18px", 
                        color: "#cccccc", 
                        lineHeight: 1.5, 
                        marginTop: "20px", 
                        maxWidth: "600px", 
                        margin: "20px auto 0" 
                    }}>
                        Menggunakan data time-series dari sensor suhu, pH, dan kekeruhan untuk mendeteksi bahaya *upwelling* (pembalikan air dasar kolam) secara akurat.
                    </p>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap", marginTop: "48px", maxWidth: "1100px", margin: "48px auto 0" }}>
                    {/* Dark Feature Card 1 */}
                    <div style={{ flex: 1, minWidth: "300px", padding: "40px", backgroundColor: "#272729", borderRadius: "18px", textAlign: "left", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <Brain size={32} style={{ color: "#2997ff", marginBottom: "20px" }} />
                        <h3 style={{ fontSize: "21px", fontWeight: 600, marginBottom: "12px", letterSpacing: "-0.015em" }}>AI Recommendation Engine</h3>
                        <p style={{ color: "#cccccc", fontSize: "14px", lineHeight: 1.6 }}>
                            Sistem memberikan rekomendasi aksi praktis instan yang disesuaikan dengan kondisi kolam Anda, seperti panduan kurasi air, pengaturan debit aerator, dan penetralan pH.
                        </p>
                    </div>
                    {/* Dark Feature Card 2 */}
                    <div style={{ flex: 1, minWidth: "300px", padding: "40px", backgroundColor: "#272729", borderRadius: "18px", textAlign: "left", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <Activity size={32} style={{ color: "#2997ff", marginBottom: "20px" }} />
                        <h3 style={{ fontSize: "21px", fontWeight: 600, marginBottom: "12px", letterSpacing: "-0.015em" }}>Real-time Telemetry Graph</h3>
                        <p style={{ color: "#cccccc", fontSize: "14px", lineHeight: 1.6 }}>
                            Visualisasikan parameter vital lele Anda melalui grafik interaktif yang bersih dan akurat. Pantau tren peningkatan pH dan kekeruhan air tanpa hambatan.
                        </p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: Parchment Canvas (Interactive tech features grid) */}
            <section id="sensor" style={{ padding: "80px 24px", backgroundColor: "#f5f5f7", color: "#1d1d1f" }}>
                <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", marginBottom: "48px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: "#0066cc" }}>
                        Infrastruktur Perangkat Keras
                    </span>
                    <h2 style={{ fontSize: "40px", fontWeight: 600, letterSpacing: "-0.02em", marginTop: "12px" }}>
                        Integrasi Sensor Fleksibel
                    </h2>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", maxWidth: "1100px", margin: "0 auto" }}>
                    {/* Tech Card 1 */}
                    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "18px", padding: "32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                            <Droplets size={28} style={{ color: "#0066cc", marginBottom: "16px" }} />
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Sensor Kualitas Air</h3>
                            <p style={{ color: "#86868b", fontSize: "14px", lineHeight: 1.5 }}>
                                Kompatibel dengan probe pH industri dan sensor kekeruhan optik untuk pembacaan parameter fisik-kimia air yang presisi.
                            </p>
                        </div>
                    </div>
                    {/* Tech Card 2 */}
                    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "18px", padding: "32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                            <Cpu size={28} style={{ color: "#0066cc", marginBottom: "16px" }} />
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Arsitektur ESP Platform</h3>
                            <p style={{ color: "#86868b", fontSize: "14px", lineHeight: 1.5 }}>
                                Mendukung manajemen multi-perangkat ESP32 / ESP8266 secara modular, memudahkan skalabilitas kolam tanpa batas.
                            </p>
                        </div>
                    </div>
                    {/* Tech Card 3 */}
                    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "18px", padding: "32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                            <ShieldCheck size={28} style={{ color: "#0066cc", marginBottom: "16px" }} />
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Pencegahan Gagal Panen</h3>
                            <p style={{ color: "#86868b", fontSize: "14px", lineHeight: 1.5 }}>
                                Menurunkan risiko kegagalan tebar bibit dan memaksimalkan rasio FCR (Food Conversion Ratio) melalui optimalisasi ekosistem kolam.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER: Slate Parchment footer */}
            <footer style={{ backgroundColor: "#f5f5f7", borderTop: "1px solid #e0e0e0", padding: "64px 24px", color: "#86868b", fontSize: "12px" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "32px", marginBottom: "32px" }}>
                        <div>
                            <h4 style={{ color: "#1d1d1f", fontWeight: 600, marginBottom: "12px", fontSize: "14px" }}>CATFISHCARE Budidaya</h4>
                            <p style={{ maxWidth: "250px", lineHeight: 1.5 }}>Sistem pengawasan cerdas air kolam ikan lele dengan telemetri IoT dan mesin analisis AI.</p>
                        </div>
                        <div style={{ display: "flex", gap: "60px" }}>
                            <div>
                                <h5 style={{ color: "#1d1d1f", fontWeight: 600, marginBottom: "12px" }}>Tautan</h5>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <Link href="/login" style={{ color: "#86868b", textDecoration: "none" }}>Masuk Aplikasi</Link>
                                    <Link href="/dashboard" style={{ color: "#86868b", textDecoration: "none" }}>Dashboard</Link>
                                </div>
                            </div>
                            <div>
                                <h5 style={{ color: "#1d1d1f", fontWeight: 600, marginBottom: "12px" }}>Hukum</h5>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <span style={{ cursor: "pointer" }}>Syarat Layanan</span>
                                    <span style={{ cursor: "pointer" }}>Kebijakan Privasi</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "24px 0" }} />
                    <p>© 2026 CATFISHCARE. Seluruh hak cipta dilindungi undang-undang.</p>
                </div>
            </footer>
        </div>
    );
}
