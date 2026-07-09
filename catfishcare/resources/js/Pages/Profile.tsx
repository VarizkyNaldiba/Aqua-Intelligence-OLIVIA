import { useState, useEffect } from "react";
import {
    User,
    Bell,
    Clock,
    Cpu,
    Save,
    RefreshCw,
    Plus,
    Wifi,
    WifiOff,
    CheckCircle,
    ChevronRight,
    MessageSquare,
} from "lucide-react";
import type { AppUser, Theme } from "@/Types";

interface ProfileTabProps {
    theme: Theme;
    currentUser: AppUser | null;
    onLogout: () => void;
    onProfileUpdate: (user: AppUser) => void;
}

type SubmenuType = "profile" | "notifications" | "feeding" | "hardware";

export default function ProfileTab({
    currentUser,
    onProfileUpdate,
}: ProfileTabProps) {
    const [activeSubmenu, setActiveSubmenu] = useState<SubmenuType>("profile");
    const [savedMessage, setSavedMessage] = useState("");

    // Profile state fields
    const [firstName, setFirstName] = useState("Adé");
    const [lastName, setLastName] = useState("Bassey");
    const [email, setEmail] = useState("ade.bassey@catfishcare.id");
    const [farmName, setFarmName] = useState("Bassey Catfish Farm");

    // Notifications state fields
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [waEnabled, setWaEnabled] = useState(false);
    const [waPhone, setWaPhone] = useState("812-3456-7890");
    const [waCountry, setWaCountry] = useState("+62");

    // Feeding state fields
    const [feedingTime, setFeedingTime] = useState("10:00 AM");
    const [feedingAmount, setFeedingAmount] = useState("5");

    // Devices state list
    const [devices, setDevices] = useState([
        {
            id: 1,
            name: "ESP32 — Kolam A",
            status: "Connected",
            ip: "192.168.1.101",
            type: "Main Controller",
            sensors: ["Temp Sensor", "pH Probe"],
            lastSeen: "Just now",
        },
        {
            id: 2,
            name: "ESP32 — Kolam B",
            status: "Connected",
            ip: "192.168.1.102",
            type: "Main Controller",
            sensors: ["TDS Meter", "Turbidity"],
            lastSeen: "2 min ago",
        },
        {
            id: 3,
            name: "ESP32 — Kolam C",
            status: "Offline",
            ip: "192.168.1.103",
            type: "Backup Unit",
            sensors: ["Temp Sensor", "pH Probe"],
            lastSeen: "3 hours ago",
        },
        {
            id: 4,
            name: "ESP32 — Kolam D",
            status: "Connected",
            ip: "192.168.1.104",
            type: "Main Controller",
            sensors: ["Turbidity", "TDS Meter"],
            lastSeen: "Just now",
        },
    ]);

    const showSaveAlert = (message: string) => {
        setSavedMessage(message);
        setTimeout(() => setSavedMessage(""), 3000);
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (onProfileUpdate && currentUser) {
            onProfileUpdate({
                ...currentUser,
                name: `${firstName} ${lastName}`,
                username: `${firstName} ${lastName}`,
            });
        }
        showSaveAlert("Profile settings saved successfully.");
    };

    const handleSaveFeeding = (e: React.FormEvent) => {
        e.preventDefault();
        showSaveAlert("Feeding schedule updated successfully.");
    };

    const toggleDevice = (id: number) => {
        setDevices((prev) =>
            prev.map((d) =>
                d.id === id
                    ? {
                          ...d,
                          status: d.status === "Connected" ? "Offline" : "Connected",
                          lastSeen: d.status === "Connected" ? "3 hours ago" : "Just now",
                      }
                    : d
            )
        );
    };

    return (
        <div className="tab-page profile-page" style={{ padding: "0 8px", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Page Header */}
            <div style={{ textAlign: "left", marginTop: "10px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", margin: 0 }}>
                    Settings
                </h1>
                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px", margin: 0 }}>
                    Configure your CatfishCare account and hardware
                </p>
            </div>

            {/* Save Toast Feedback */}
            {savedMessage && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 16px",
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    color: "#16a34a",
                    fontSize: "13px",
                    fontWeight: 600
                }}>
                    <CheckCircle size={16} />
                    <span>{savedMessage}</span>
                </div>
            )}

            {/* Split Page Layout: Left Menu, Right Config Pane */}
            <div style={{ display: "flex", gap: "24px", width: "100%", alignItems: "flex-start", flexWrap: "wrap" }}>
                
                {/* Left Card: Vertical Menu options */}
                <div className="db-panel-card" style={{ width: "260px", padding: "12px 8px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {[
                            { id: "profile", icon: User, label: "Profile" },
                            { id: "notifications", icon: Bell, label: "Notifications" },
                            { id: "feeding", icon: Clock, label: "Feeding Schedule" },
                            { id: "hardware", icon: Cpu, label: "ESP Hardware" },
                        ].map((menu) => {
                            const Icon = menu.icon;
                            const isActive = activeSubmenu === menu.id;
                            return (
                                <button
                                    key={menu.id}
                                    onClick={() => setActiveSubmenu(menu.id as SubmenuType)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "none",
                                        cursor: "pointer",
                                        width: "100%",
                                        textAlign: "left",
                                        fontSize: "13px",
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? "#0ea5e9" : "#64748b",
                                        backgroundColor: isActive ? "#f0f9ff" : "transparent",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <Icon size={16} style={{ color: isActive ? "#0ea5e9" : "#94a3b8" }} />
                                        <span>{menu.label}</span>
                                    </div>
                                    {isActive && <ChevronRight size={14} />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Card: Dynamic Configuration Pane */}
                <div className="db-panel-card" style={{ flex: "1", minWidth: "320px", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)" }}>
                    
                    {/* Pane 1: Profile Settings */}
                    {activeSubmenu === "profile" && (
                        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ textAlign: "left" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                    Profile Settings
                                </h3>
                            </div>

                            {/* User Photo / Initial Avatar Row */}
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{
                                    width: "56px",
                                    height: "56px",
                                    borderRadius: "50%",
                                    backgroundColor: "#00bac7",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#ffffff",
                                    fontSize: "18px",
                                    fontWeight: 700,
                                }}>
                                    {firstName.substring(0,1)}{lastName.substring(0,1)}
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                                        {firstName} {lastName}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                                        Farm Manager
                                    </div>
                                    <button
                                        type="button"
                                        style={{ background: "none", border: "none", color: "#0ea5e9", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0, marginTop: "4px" }}
                                        onClick={() => alert("Photo upload functionality would open here.")}
                                    >
                                        Change photo
                                    </button>
                                </div>
                            </div>

                            {/* Form Input fields */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>First Name</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="pm-input"
                                        style={{ height: "40px", padding: "0 12px", width: "100%" }}
                                    />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Last Name</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="pm-input"
                                        style={{ height: "40px", padding: "0 12px", width: "100%" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pm-input"
                                    style={{ height: "40px", padding: "0 12px", width: "100%" }}
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Farm Name</label>
                                <input
                                    type="text"
                                    value={farmName}
                                    onChange={(e) => setFarmName(e.target.value)}
                                    className="pm-input"
                                    style={{ height: "40px", padding: "0 12px", width: "100%" }}
                                />
                            </div>

                            {/* Submit Save Button */}
                            <div style={{ textAlign: "left", marginTop: "8px" }}>
                                <button
                                    type="submit"
                                    className="db-btn-cyan"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "0 16px",
                                        height: "40px",
                                        backgroundColor: "#0ea5e9",
                                        color: "#ffffff",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer"
                                    }}
                                >
                                    <Save size={14} />
                                    <span>Save Profile</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Pane 2: Web Push Notifications */}
                    {activeSubmenu === "notifications" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                            
                            {/* Section A: Web Push */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ textAlign: "left" }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        Web Push Notifications
                                    </h3>
                                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                                        Receive real-time alerts in your browser when sensor values exceed safe thresholds.
                                    </p>
                                </div>

                                {/* Toggle Rows */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
                                    {[
                                        {
                                            title: "Web Push Notifications",
                                            desc: "Browser alerts for sensor anomalies",
                                            state: pushEnabled,
                                            toggle: () => setPushEnabled(!pushEnabled),
                                        },
                                        {
                                            title: "Email Digest",
                                            desc: "Daily summary sent to your registered email",
                                            state: emailEnabled,
                                            toggle: () => setEmailEnabled(!emailEnabled),
                                        },
                                    ].map((opt, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid #f1f5f9", borderRadius: "10px", backgroundColor: "#f8fafc" }}>
                                            <div style={{ textAlign: "left" }}>
                                                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{opt.title}</div>
                                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{opt.desc}</div>
                                            </div>
                                            
                                            {/* Custom Switch Toggle */}
                                            <button
                                                onClick={opt.toggle}
                                                style={{
                                                    width: "38px",
                                                    height: "22px",
                                                    borderRadius: "100px",
                                                    backgroundColor: opt.state ? "#0ea5e9" : "#cbd5e1",
                                                    border: "none",
                                                    position: "relative",
                                                    cursor: "pointer",
                                                    transition: "background-color 0.2s"
                                                }}
                                            >
                                                <div style={{
                                                    width: "16px",
                                                    height: "16px",
                                                    borderRadius: "50%",
                                                    backgroundColor: "#ffffff",
                                                    position: "absolute",
                                                    top: "3px",
                                                    left: opt.state ? "19px" : "3px",
                                                    transition: "left 0.2s"
                                                }}></div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section B: WhatsApp Alerts Card */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
                                <div style={{ textAlign: "left" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#16a34a", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                                        <MessageSquare size={16} />
                                        <span>WhatsApp Alerts</span>
                                    </h3>
                                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                                        Get critical pond alerts sent directly to your WhatsApp number via the CatfishCare bot.
                                    </p>
                                </div>

                                {/* WA Toggle Row */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid #f1f5f9", borderRadius: "10px", backgroundColor: "#f8fafc" }}>
                                    <div style={{ textAlign: "left" }}>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>WhatsApp Alerts</div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Instant alerts for ammonia spikes, pH drops, and offline sensors</div>
                                    </div>
                                    
                                    {/* WA Switch Toggle */}
                                    <button
                                        onClick={() => setWaEnabled(!waEnabled)}
                                        style={{
                                            width: "38px",
                                            height: "22px",
                                            borderRadius: "100px",
                                            backgroundColor: waEnabled ? "#10b981" : "#cbd5e1",
                                            border: "none",
                                            position: "relative",
                                            cursor: "pointer",
                                            transition: "background-color 0.2s"
                                        }}
                                    >
                                        <div style={{
                                            width: "16px",
                                            height: "16px",
                                            borderRadius: "50%",
                                            backgroundColor: "#ffffff",
                                            position: "absolute",
                                            top: "3px",
                                            left: waEnabled ? "19px" : "3px",
                                            transition: "left 0.2s"
                                        }}></div>
                                    </button>
                                </div>

                                {/* Form fields for WA */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left", opacity: waEnabled ? 1 : 0.6, pointerEvents: waEnabled ? "auto" : "none" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>WhatsApp Phone Number</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <select
                                            value={waCountry}
                                            onChange={(e) => setWaCountry(e.target.value)}
                                            className="pm-input"
                                            style={{ width: "80px", height: "40px", padding: "0 8px", fontWeight: 600 }}
                                        >
                                            <option value="+62">+62</option>
                                            <option value="+1">+1</option>
                                            <option value="+44">+44</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={waPhone}
                                            onChange={(e) => setWaPhone(e.target.value)}
                                            className="pm-input"
                                            placeholder="812-3456-7890"
                                            style={{ height: "40px", padding: "0 12px", flex: 1 }}
                                        />
                                    </div>
                                </div>

                                <div style={{ textAlign: "left", marginTop: "8px" }}>
                                    <button
                                        disabled={!waEnabled}
                                        onClick={() => showSaveAlert("WhatsApp integration activated.")}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "0 16px",
                                            height: "40px",
                                            backgroundColor: "transparent",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "8px",
                                            color: waEnabled ? "#10b981" : "#94a3b8",
                                            borderColor: waEnabled ? "#10b981" : "#cbd5e1",
                                            fontWeight: 600,
                                            fontSize: "13px",
                                            cursor: waEnabled ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        <MessageSquare size={14} />
                                        <span>Connect to WA</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pane 3: Feeding Schedule */}
                    {activeSubmenu === "feeding" && (
                        <form onSubmit={handleSaveFeeding} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ textAlign: "left" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                    Automated Feeding Schedule
                                </h3>
                                <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                                    Configure the daily feeding time and pellet amount for your automated dispenser across all ponds.
                                </p>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Feeding Time</label>
                                <input
                                    type="text"
                                    value={feedingTime}
                                    onChange={(e) => setFeedingTime(e.target.value)}
                                    className="pm-input"
                                    style={{ height: "40px", padding: "0 12px", width: "100%" }}
                                />
                                <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                                    24-hour format · local time (WIB)
                                </span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Amount of Pellets (kg)</label>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <input
                                        type="number"
                                        value={feedingAmount}
                                        onChange={(e) => setFeedingAmount(e.target.value)}
                                        className="pm-input"
                                        style={{ height: "40px", padding: "0 12px", width: "100px" }}
                                    />
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>kg per session</span>
                                </div>
                                <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                                    Distributed equally across all active ponds
                                </span>
                            </div>

                            {/* Schedule Preview Callout */}
                            <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", textAlign: "left" }}>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0369a1" }}>Schedule Preview</div>
                                <p style={{ fontSize: "13px", color: "#0369a1", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                                    Every day at <strong>10:00 WIB</strong> — <strong>{feedingAmount} kg</strong> of pellets will be dispensed.
                                </p>
                            </div>

                            {/* Save Button */}
                            <div style={{ textAlign: "left", marginTop: "8px" }}>
                                <button
                                    type="submit"
                                    className="db-btn-cyan"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "0 16px",
                                        height: "40px",
                                        backgroundColor: "#0ea5e9",
                                        color: "#ffffff",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer"
                                    }}
                                >
                                    <Save size={14} />
                                    <span>Save Schedule</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Pane 4: ESP Hardware */}
                    {activeSubmenu === "hardware" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            
                            {/* Title and Refresh Button header block */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                                <div style={{ textAlign: "left" }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        ESP Hardware
                                    </h3>
                                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                                        Configure your CatfishCare account and hardware
                                    </p>
                                </div>
                            </div>

                            {/* Connectivity Status and Network scan Row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: "#10b981" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }}></span>
                                    <span>3 of 4 devices online</span>
                                </div>
                                <button
                                    onClick={() => alert("Scanning WiFi network for devices...")}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "0 12px",
                                        height: "32px",
                                        backgroundColor: "transparent",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "#334155",
                                        cursor: "pointer",
                                    }}
                                >
                                    <RefreshCw size={12} />
                                    <span>Scan Network</span>
                                </button>
                            </div>

                            {/* Device Cards List */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {devices.map((device) => {
                                    const isConnected = device.status === "Connected";
                                    return (
                                        <div
                                            key={device.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "16px 20px",
                                                borderRadius: "12px",
                                                border: "1px solid #f1f5f9",
                                                backgroundColor: "#f8fafc",
                                                flexWrap: "wrap",
                                                gap: "16px",
                                            }}
                                        >
                                            {/* Wifi connection Indicator and details */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                <div style={{
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "50%",
                                                    backgroundColor: isConnected ? "rgba(16, 185, 129, 0.1)" : "rgba(148, 163, 184, 0.1)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: isConnected ? "#10b981" : "#94a3b8",
                                                }}>
                                                    {isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
                                                </div>

                                                <div style={{ textAlign: "left" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{device.name}</span>
                                                        <span style={{
                                                            fontSize: "10px",
                                                            fontWeight: 700,
                                                            padding: "2px 8px",
                                                            borderRadius: "20px",
                                                            backgroundColor: isConnected ? "#dcfce7" : "#f1f5f9",
                                                            color: isConnected ? "#16a34a" : "#64748b",
                                                        }}>
                                                            {device.status}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                                        {device.type} · IP {device.ip}
                                                    </div>
                                                    
                                                    {/* Connected sensors probes badges list */}
                                                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                                                        {device.sensors.map((sensor, sIdx) => (
                                                            <span
                                                                key={sIdx}
                                                                style={{
                                                                    fontSize: "11px",
                                                                    backgroundColor: "#ffffff",
                                                                    border: "1px solid #e2e8f0",
                                                                    borderRadius: "4px",
                                                                    padding: "2px 6px",
                                                                    color: "#475569"
                                                                }}
                                                            >
                                                                {sensor}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Disconnect/Reconnect Actions on Right */}
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Last seen {device.lastSeen}</span>
                                                <button
                                                    onClick={() => toggleDevice(device.id)}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: isConnected ? "#e11d48" : "#0ea5e9",
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        padding: 0,
                                                        marginTop: "4px",
                                                    }}
                                                    onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                                    onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
                                                >
                                                    {isConnected ? "Disconnect" : "Reconnect"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Register device dashed button */}
                            <button
                                onClick={() => alert("Hardware registration dialog opened.")}
                                style={{
                                    width: "100%",
                                    height: "44px",
                                    borderRadius: "10px",
                                    border: "1.5px dashed #cbd5e1",
                                    backgroundColor: "transparent",
                                    color: "#64748b",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    transition: "background-color 0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <Plus size={15} />
                                <span>Register New Device</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
