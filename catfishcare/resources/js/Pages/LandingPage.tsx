import { Link, Head } from "@inertiajs/react";
import { ArrowRight, Activity, Zap, Wifi, Fish } from "lucide-react";
import { useEffect } from "react";

export default function LandingPage() {
    // Ensure body background is light for the landing page theme
    useEffect(() => {
        document.body.classList.add("light-theme");
        return () => {
            document.body.classList.remove("light-theme");
        };
    }, []);

    return (
        <div className="lp-layout">
            <Head title="Smarter Catfish Ponds, Better Harvests" />

            {/* Header Navigation */}
            <header className="lp-header">
                <Link href="/" className="lp-logo-container">
                    <div className="lp-logo-circle">
                        <Fish size={20} color="#ffffff" style={{ transform: "rotate(-30deg)" }} />
                    </div>
                    <span className="lp-logo-text">CatfishCare</span>
                </Link>

                <nav className="lp-nav">
                    <a href="#features" className="lp-nav-link">Features</a>
                    <a href="#pricing" className="lp-nav-link">Pricing</a>
                    <a href="#about" className="lp-nav-link">About</a>
                </nav>

                <div className="lp-header-actions">
                    <Link href="/login" className="lp-login-btn">
                        Log In
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="lp-hero-section">
                {/* Hero Left Column */}
                <div className="lp-hero-left">
                    <div className="lp-hero-badge">
                        <span style={{ width: "6px", height: "6px", backgroundColor: "#0ea5e9", borderRadius: "50%" }}></span>
                        AI-Powered Aquaculture Platform
                    </div>
                    <h1 className="lp-hero-heading">
                        Smarter Catfish<br />
                        <span className="lp-ponds-highlight">Ponds</span>,<br />
                        Better Harvests.
                    </h1>
                    <p className="lp-hero-subtext">
                        CatfishCare combines AI-driven water monitoring, automated feeding schedules, and real-time ESP32 sensor data to help aquaculture farmers reduce losses and maximize yield — with zero guesswork.
                    </p>
                    <div className="lp-hero-actions">
                        <Link href="/login" className="lp-btn-gradient">
                            Get Started <ArrowRight size={18} />
                        </Link>
                        <a href="#demo" className="lp-btn-outline">
                            Watch Demo
                        </a>
                    </div>
                    <div className="lp-hero-footnotes">
                        <div className="lp-footnote-item">
                            <span className="lp-footnote-icon">✓</span>
                            <span>Free 14-day trial</span>
                        </div>
                        <div className="lp-footnote-item">
                            <span className="lp-footnote-icon">✓</span>
                            <span>No credit card required</span>
                        </div>
                        <div className="lp-footnote-item">
                            <span className="lp-footnote-icon">✓</span>
                            <span>Cancel anytime</span>
                        </div>
                    </div>
                </div>

                {/* Hero Right Column (Live Dashboard Widget) */}
                <div className="lp-hero-right">
                    {/* Floating badge */}
                    <div className="lp-widget-live-badge">
                        <span className="lp-live-dot"></span>
                        4 ponds live
                    </div>

                    <div className="lp-dashboard-widget">
                        {/* Widget Header */}
                        <div className="lp-widget-header">
                            <div className="lp-widget-header-title">
                                <span style={{ width: "8px", height: "8px", backgroundColor: "#34d399", borderRadius: "50%" }}></span>
                                CatfishCare • Live
                            </div>
                            <div className="lp-widget-header-status">
                                <span style={{ width: "6px", height: "6px", backgroundColor: "#34d399", borderRadius: "50%" }}></span>
                                All systems online
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
                                    <div className="lp-sensor-label">Turbidity</div>
                                    <div className="lp-sensor-value">18 NTU</div>
                                    <div className="lp-capsule-bar">
                                        <span className="lp-capsule-pill lp-pill-orange filled"></span>
                                        <span className="lp-capsule-pill lp-pill-orange filled"></span>
                                        <span className="lp-capsule-pill lp-pill-orange filled"></span>
                                        <span className="lp-capsule-pill lp-pill-orange filled"></span>
                                        <span className="lp-capsule-pill"></span>
                                    </div>
                                </div>

                                {/* Card 3: TDS */}
                                <div className="lp-sensor-card">
                                    <div className="lp-sensor-label">TDS</div>
                                    <div className="lp-sensor-value">910 PPM</div>
                                    <div className="lp-capsule-bar">
                                        <span className="lp-capsule-pill lp-pill-purple filled"></span>
                                        <span className="lp-capsule-pill lp-pill-purple filled"></span>
                                        <span className="lp-capsule-pill lp-pill-purple filled"></span>
                                        <span className="lp-capsule-pill lp-pill-purple filled"></span>
                                        <span className="lp-capsule-pill"></span>
                                    </div>
                                </div>

                                {/* Card 4: Tinggi Air */}
                                <div className="lp-sensor-card">
                                    <div className="lp-sensor-label">Tinggi Air</div>
                                    <div className="lp-sensor-value">105 cm</div>
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
                                    <div className="lp-forecast-title">24-Hour Forecast</div>
                                    <div className="lp-forecast-badge">ML Active</div>
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
                                            stroke="#0ea5e9" 
                                            strokeWidth="3" 
                                            strokeLinecap="round"
                                        />
                                        
                                        {/* Teal forecast path */}
                                        <path 
                                            d="M 10,85 C 60,85 100,42 160,47 C 220,52 260,95 320,75 C 360,60 380,35 390,35" 
                                            fill="none" 
                                            stroke="#14b8a6" 
                                            strokeWidth="3" 
                                            strokeLinecap="round"
                                            opacity="0.85"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Warning Alert Banner */}
                            <div className="lp-alert-banner">
                                <span>⚡</span>
                                <span>AI suggests water change in Pond A — high TDS detected</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="lp-stats-section">
                <div className="lp-stats-grid">
                    <div className="lp-stats-card">
                        <div className="lp-stats-value">4,200+</div>
                        <div className="lp-stats-label">Ponds Monitored</div>
                    </div>
                    <div className="lp-stats-card">
                        <div className="lp-stats-value">98.7%</div>
                        <div className="lp-stats-label">Sensor Uptime</div>
                    </div>
                    <div className="lp-stats-card">
                        <div className="lp-stats-value">31%</div>
                        <div className="lp-stats-label">Avg. Yield Increase</div>
                    </div>
                    <div className="lp-stats-card">
                        <div className="lp-stats-value">{"<2s"}</div>
                        <div className="lp-stats-label">Alert Latency</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="lp-features-section">
                <div className="lp-features-header">
                    <span className="lp-features-subtitle">Platform Features</span>
                    <h2 className="lp-features-heading">Everything your farm needs, in one platform</h2>
                </div>
                <div className="lp-features-grid">
                    {/* Feature 1 */}
                    <div className="lp-feature-card">
                        <div className="lp-feature-icon-container">
                            <Activity size={24} />
                        </div>
                        <h3 className="lp-feature-card-title">Real-Time Monitoring</h3>
                        <p className="lp-feature-card-text">
                            Track pH, turbidity, TDS, and water level across all ponds from a single dashboard.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="lp-feature-card">
                        <div className="lp-feature-icon-container">
                            <Zap size={24} />
                        </div>
                        <h3 className="lp-feature-card-title">AI-Driven Predictions</h3>
                        <p className="lp-feature-card-text">
                            Our ML models forecast water quality shifts 24 hours in advance to prevent fish loss.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="lp-feature-card">
                        <div className="lp-feature-icon-container">
                            <Wifi size={24} />
                        </div>
                        <h3 className="lp-feature-card-title">ESP32 Integration</h3>
                        <p className="lp-feature-card-text">
                            Plug-and-play hardware sensors sync automatically over Wi-Fi — no manual uploads needed.
                        </p>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="lp-cta-section">
                <h2 className="lp-cta-heading">Ready to transform your pond farm?</h2>
                <p className="lp-cta-subtext">
                    Join hundreds of aquaculture farmers already using CatfishCare to grow smarter.
                </p>
                <Link href="/login" className="lp-btn-gradient" style={{ padding: "16px 36px" }}>
                    Get Started Free <ArrowRight size={18} />
                </Link>
            </section>

            {/* Footer Section */}
            <footer className="lp-footer">
                <p>© 2028 CatfishCare. All rights reserved.</p>
            </footer>
        </div>
    );
}
