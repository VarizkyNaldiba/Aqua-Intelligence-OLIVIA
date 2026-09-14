import { Link, Head } from "@inertiajs/react";
import { Activity, Zap, Wifi, Fish } from "lucide-react";
import { useEffect } from "react";

export default function LandingPage() {
    // Ensure body background is light for the landing page theme
    useEffect(function syncLandingPageTheme() {
        document.body.classList.add("light-theme");
        return function cleanupLandingPageTheme() {
            document.body.classList.remove("light-theme");
        };
    }, []);

    return (
        <div className="lp-layout">
            <Head title="Presisi Kualitas Air Kolam Lele — CatfishCare" />

            {/* Header Navigation */}
            <header className="lp-header">
                <Link href="/" className="lp-logo-container">
                    <div className="lp-logo-circle">
                        <Fish size={20} color="#ffffff" style={{ transform: "rotate(-30deg)" }} />
                    </div>
                    <span className="lp-logo-text">CatfishCare</span>
                </Link>

                <nav className="lp-nav">
                    <a href="#features" className="lp-nav-link">Fitur Utama</a>
                    <a href="#telemetry" className="lp-nav-link">Telemetri</a>
                    <a href="#about" className="lp-nav-link">Tentang Platform</a>
                </nav>

                <div className="lp-header-actions">
                    <Link href="/login" className="lp-login-btn">
                        Masuk
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="lp-hero-section">
                {/* Hero Left Column */}
                <div className="lp-hero-left">
                    <div className="lp-hero-badge">
                        <span style={{ width: "8px", height: "8px", backgroundColor: "#0284c7", borderRadius: "50%" }}></span>
                        Telemetri Cerdas & Sirkulasi Otomatis ESP32
                    </div>
                    <h1 className="lp-hero-heading">
                        Presisi Kualitas Air Kolam Lele, Panen Maksimal Tanpa Ragu.
                    </h1>
                    <p className="lp-hero-subtext">
                        CatfishCare mengintegrasikan telemetri sensor multi-parameter, aktuator sirkulasi air otomatis, dan pemodelan prediktif BiLSTM untuk membantu pembudidaya lele menekan mortalitas dan meningkatkan rasio konversi pakan.
                    </p>
                    <div className="lp-hero-actions">
                        <Link href="/login" className="lp-btn-gradient">
                            Masuk ke Dashboard
                        </Link>
                        <a href="#features" className="lp-btn-outline">
                            Pelajari Fitur
                        </a>
                    </div>
                    <div className="lp-hero-footnotes">
                        <div className="lp-footnote-item">
                            <span className="lp-footnote-icon">✓</span>
                            <span>Protokol MQTT & REST API ESP32</span>
                        </div>
                        <div className="lp-footnote-item">
                            <span className="lp-footnote-icon">✓</span>
                            <span>Otomasi Kuras Sirkulasi 20–30%</span>
                        </div>
                        <div className="lp-footnote-item">
                            <span className="lp-footnote-icon">✓</span>
                            <span>Prediksi Kualitas Air 24 Jam</span>
                        </div>
                    </div>
                </div>

                {/* Hero Right Column (Live Dashboard Widget) */}
                <div className="lp-hero-right" id="telemetry">
                    {/* Floating badge */}
                    <div className="lp-widget-live-badge">
                        <span className="lp-live-dot"></span>
                        Kolam TFS 1 Aktif
                    </div>

                    <div className="lp-dashboard-widget">
                        {/* Widget Header */}
                        <div className="lp-widget-header">
                            <div className="lp-widget-header-title">
                                <span style={{ width: "8px", height: "8px", backgroundColor: "#0d9488", borderRadius: "50%" }}></span>
                                Kolam Riset TFS 1
                            </div>
                            <div className="lp-widget-header-status">
                                <span style={{ width: "6px", height: "6px", backgroundColor: "#0d9488", borderRadius: "50%" }}></span>
                                Sensor Terhubung
                            </div>
                        </div>

                        {/* Widget Body */}
                        <div className="lp-widget-body">
                            {/* Sensors Grid */}
                            <div className="lp-sensor-grid">
                                {/* Card 1: pH Air */}
                                <div className="lp-sensor-card">
                                    <div className="lp-sensor-label">pH Air</div>
                                    <div className="lp-sensor-value">7.2 pH</div>
                                    <div className="lp-capsule-bar">
                                        <span className="lp-capsule-pill lp-pill-blue filled"></span>
                                        <span className="lp-capsule-pill lp-pill-blue filled"></span>
                                        <span className="lp-capsule-pill lp-pill-blue filled"></span>
                                        <span className="lp-capsule-pill lp-pill-blue filled"></span>
                                        <span className="lp-capsule-pill"></span>
                                    </div>
                                </div>

                                {/* Card 2: Turbidity */}
                                <div className="lp-sensor-card">
                                    <div className="lp-sensor-label">Kekeruhan (Turbidity)</div>
                                    <div className="lp-sensor-value">18.0 NTU</div>
                                    <div className="lp-capsule-bar">
                                        <span className="lp-capsule-pill lp-pill-teal filled"></span>
                                        <span className="lp-capsule-pill lp-pill-teal filled"></span>
                                        <span className="lp-capsule-pill lp-pill-teal filled"></span>
                                        <span className="lp-capsule-pill lp-pill-teal filled"></span>
                                        <span className="lp-capsule-pill"></span>
                                    </div>
                                </div>

                                {/* Card 3: TDS */}
                                <div className="lp-sensor-card">
                                    <div className="lp-sensor-label">Total Dissolved Solids</div>
                                    <div className="lp-sensor-value">420 PPM</div>
                                    <div className="lp-capsule-bar">
                                        <span className="lp-capsule-pill lp-pill-purple filled"></span>
                                        <span className="lp-capsule-pill lp-pill-purple filled"></span>
                                        <span className="lp-capsule-pill lp-pill-purple filled"></span>
                                        <span className="lp-capsule-pill lp-pill-purple filled"></span>
                                        <span className="lp-capsule-pill"></span>
                                    </div>
                                </div>

                                {/* Card 4: Suhu Air */}
                                <div className="lp-sensor-card">
                                    <div className="lp-sensor-label">Suhu Air Kolam</div>
                                    <div className="lp-sensor-value">27.8°C</div>
                                    <div className="lp-capsule-bar">
                                        <span className="lp-capsule-pill lp-pill-teal filled"></span>
                                        <span className="lp-capsule-pill lp-pill-teal filled"></span>
                                        <span className="lp-capsule-pill lp-pill-teal filled"></span>
                                        <span className="lp-capsule-pill lp-pill-teal filled"></span>
                                        <span className="lp-capsule-pill"></span>
                                    </div>
                                </div>
                            </div>

                            {/* Forecast Section */}
                            <div className="lp-forecast-section">
                                <div className="lp-forecast-header">
                                    <div className="lp-forecast-title">Proyeksi 24 Jam BiLSTM</div>
                                    <div className="lp-forecast-badge">Prediksi Akurat 94.2%</div>
                                </div>
                                <div className="lp-forecast-graph">
                                    <svg viewBox="0 0 400 100" style={{ width: "100%", height: "100%" }}>
                                        {/* Horizontal grid lines */}
                                        <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeDasharray="3,3" />
                                        <line x1="0" y1="50" x2="400" y2="50" stroke="#f1f5f9" strokeDasharray="3,3" />
                                        <line x1="0" y1="80" x2="400" y2="80" stroke="#f1f5f9" strokeDasharray="3,3" />
                                        
                                        {/* Blue/Cyan forecast path */}
                                        <path 
                                            d="M 10,75 C 60,75 100,30 160,35 C 220,40 260,85 320,65 C 360,50 380,25 390,25" 
                                            fill="none" 
                                            stroke="#0284c7" 
                                            strokeWidth="3" 
                                            strokeLinecap="round"
                                        />
                                        
                                        {/* Teal forecast path */}
                                        <path 
                                            d="M 10,85 C 60,85 100,42 160,47 C 220,52 260,95 320,75 C 360,60 380,35 390,35" 
                                            fill="none" 
                                            stroke="#0d9488" 
                                            strokeWidth="3" 
                                            strokeLinecap="round"
                                            opacity="0.85"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Status Recommendation Banner */}
                            <div className="lp-alert-banner">
                                <span>Status Otomasi: Siklus kuras sirkulasi standby otomatis jika TDS melebihi 900 PPM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="lp-stats-section">
                <div className="lp-stats-grid">
                    <div className="lp-stats-card">
                        <div className="lp-stats-value">12 Kolam</div>
                        <div className="lp-stats-label">Kapasitas Monitoring Terpadu</div>
                    </div>
                    <div className="lp-stats-card">
                        <div className="lp-stats-value">99.8%</div>
                        <div className="lp-stats-label">Uptime Sensor & Gateway</div>
                    </div>
                    <div className="lp-stats-card">
                        <div className="lp-stats-value">&lt; 2.5 Detik</div>
                        <div className="lp-stats-label">Latensi Telemetri Real-Time</div>
                    </div>
                    <div className="lp-stats-card">
                        <div className="lp-stats-value">24 Jam</div>
                        <div className="lp-stats-label">Horizon Prediksi BiLSTM</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="lp-features-section">
                <div className="lp-features-header">
                    <span className="lp-features-subtitle">Kapabilitas Utama Platform</span>
                    <h2 className="lp-features-heading">Sistem Cerdas untuk Efisiensi Budidaya Lele</h2>
                </div>
                <div className="lp-features-grid">
                    {/* Feature 1 */}
                    <div className="lp-feature-card">
                        <div className="lp-feature-icon-container">
                            <Activity size={24} />
                        </div>
                        <h3 className="lp-feature-card-title">Telemetri Sensor Multi-Parameter</h3>
                        <p className="lp-feature-card-text">
                            Pantau parameter krusial pH air, turbiditas, TDS, suhu, dan ketinggian air dari mikrokontroler ESP32 secara instan tanpa pencatatan manual.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="lp-feature-card">
                        <div className="lp-feature-icon-container">
                            <Zap size={24} />
                        </div>
                        <h3 className="lp-feature-card-title">Otomasi Sirkulasi Air Cerdas</h3>
                        <p className="lp-feature-card-text">
                            Kontrol pompa pengurasan dan pengisian air baru secara otomatis berdasarkan ambang batas risiko untuk menjaga kejernihan dan kesehatan kolam.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="lp-feature-card">
                        <div className="lp-feature-icon-container">
                            <Wifi size={24} />
                        </div>
                        <h3 className="lp-feature-card-title">Prediksi BiLSTM & Studio Dataset</h3>
                        <p className="lp-feature-card-text">
                            Algoritma deep learning BiLSTM memproyeksikan tren kualitas air 24 jam ke depan, didukung kamera ESP32-CAM untuk pemantauan visual lele.
                        </p>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="lp-cta-section" id="about">
                <h2 className="lp-cta-heading">Siap mengoptimalkan budidaya kolam lele Anda?</h2>
                <p className="lp-cta-subtext">
                    Pantau telemetri kolam, kendalikan aktuator air, dan minimalkan risiko gagal panen dalam satu antarmuka terpadu.
                </p>
                <Link href="/login" className="lp-btn-gradient" style={{ padding: "16px 36px" }}>
                    Akses Dashboard CatfishCare
                </Link>
            </section>

            {/* Footer Section */}
            <footer className="lp-footer">
                <p>© 2026 CatfishCare — Aqua-Intelligence OLIVIA. Sistem Manajemen &amp; Otomasi Kolam Lele Terpadu.</p>
            </footer>
        </div>
    );
}
