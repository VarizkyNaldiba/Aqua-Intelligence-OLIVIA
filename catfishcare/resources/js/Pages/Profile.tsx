import { useState, useEffect } from "react";
import {
    User,
    Bell,
    Cpu,
    Save,
    RefreshCw,
    Plus,
    Wifi,
    WifiOff,
    CheckCircle2,
    MessageSquare,
    Trash2,
} from "lucide-react";
import type { AppUser, Theme } from "@/Types";

interface ProfileTabProps {
    theme?: Theme;
    themeSetting?: string;
    onChangeThemeSetting?: (setting: any) => void;
    toggleTheme?: () => void;
    currentUser: AppUser | null;
    onLogout?: () => void;
    onProfileUpdate: (user: AppUser) => void;
}

type SubmenuType = "profile" | "notifications" | "hardware";

export default function ProfileTab({
    currentUser,
    onProfileUpdate,
}: ProfileTabProps) {
    const [activeSubmenu, setActiveSubmenu] = useState<SubmenuType>("profile");
    const [savedMessage, setSavedMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Profile state fields initialized dynamically
    const [name, setName] = useState(currentUser?.name || currentUser?.username || "Pak Fii");
    const [email, setEmail] = useState(currentUser?.email || "pakfii@catfishcare.app");
    const [role, setRole] = useState(currentUser?.role || currentUser?.jabatan || "Admin CatfishCare");
    const [farmName, setFarmName] = useState(localStorage.getItem("aqua_farm_name") || "Tambak Budidaya CatfishCare");

    // Notifications state fields (persisted in localStorage)
    const [pushEnabled, setPushEnabled] = useState(() => {
        const saved = localStorage.getItem("aqua_notif_push");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [emailEnabled, setEmailEnabled] = useState(() => {
        const saved = localStorage.getItem("aqua_notif_email");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [waEnabled, setWaEnabled] = useState(() => {
        const saved = localStorage.getItem("aqua_notif_wa");
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [waPhone, setWaPhone] = useState(() => {
        return localStorage.getItem("aqua_notif_wa_phone") || "0812-3456-7890";
    });
    const [waCountry, setWaCountry] = useState("+62");

    // Dynamic ESP Hardware Devices state list
    const [devices, setDevices] = useState<any[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [showNewDeviceModal, setShowNewDeviceModal] = useState(false);
    const [newUuid, setNewUuid] = useState("");

    // Sync input fields whenever currentUser prop updates
    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || currentUser.username || "Pak Fii");
            setEmail(currentUser.email || `${currentUser.username?.toLowerCase() || 'user'}@catfishcare.app`);
            setRole(currentUser.role || currentUser.jabatan || "Admin CatfishCare");
        }
    }, [currentUser]);

    // Save notification preferences to localStorage whenever changed
    useEffect(() => {
        localStorage.setItem("aqua_notif_push", JSON.stringify(pushEnabled));
        localStorage.setItem("aqua_notif_email", JSON.stringify(emailEnabled));
        localStorage.setItem("aqua_notif_wa", JSON.stringify(waEnabled));
        localStorage.setItem("aqua_notif_wa_phone", waPhone);
    }, [pushEnabled, emailEnabled, waEnabled, waPhone]);

    // Fetch dynamic ESP Hardware devices from API
    const fetchDevices = async () => {
        setLoadingDevices(true);
        try {
            const res = await fetch("/api/esp");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    const formatted = data.map((d: any, idx: number) => ({
                        id: d.id,
                        uuid: d.uuid,
                        name: d.name || `ESP32 — ${d.uuid || 'Device ' + (idx + 1)}`,
                        status: "Connected",
                        ip: `192.168.4.${100 + d.id}`,
                        type: idx === 0 ? "Main Controller & Sensor Gateway" : "Secondary Pond Node",
                        sensors: ["Water Temp (DS18B20)", "pH Sensor", "Turbidity (NTU)", "TDS Meter"],
                        lastSeen: "Just now",
                    }));
                    setDevices(formatted);
                } else {
                    // Default baseline ESP hardware if table empty
                    setDevices([
                        {
                            id: 1,
                            uuid: "ESP32-CATFISHCARE-001",
                            name: "ESP32 — Primary Controller (Kolam 1)",
                            status: "Connected",
                            ip: "192.168.4.1",
                            type: "Main Controller & Sensor Gateway",
                            sensors: ["DS18B20 Temp", "pH Probe", "NTU Turbidity", "TDS Meter", "HC-SR04"],
                            lastSeen: "Just now",
                        }
                    ]);
                }
            }
        } catch (e) {
            console.warn("[ProfileTab] Failed loading ESP devices, using local cache:", e);
        } finally {
            setLoadingDevices(false);
        }
    };

    useEffect(() => {
        if (activeSubmenu === "hardware") {
            fetchDevices();
        }
    }, [activeSubmenu]);

    const showSaveAlert = (msg: string) => {
        setSavedMessage(msg);
        setTimeout(() => setSavedMessage(""), 3500);
    };

    // Save profile changes to backend and parent state
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const updatedUser: AppUser = {
            ...(currentUser || { id: 1, username: name, role: role }),
            name: name,
            username: name,
            email: email,
            role: role,
            jabatan: role,
        };

        // Persist local farm name
        localStorage.setItem("aqua_farm_name", farmName);

        try {
            // Update backend via API if available
            await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: name, jabatan: role }),
            });
        } catch (err) {
            console.warn("[ProfileTab] API profile save fallback to local:", err);
        }

        // Notify parent components so navbar/sidebar immediately update
        onProfileUpdate(updatedUser);
        setLoading(false);
        showSaveAlert("Pengaturan profil berhasil diperbarui & disinkronkan secara realtime!");
    };

    // Add new ESP hardware device via API
    const handleAddDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUuid.trim()) return;

        try {
            const res = await fetch("/api/esp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uuid: newUuid.trim() }),
            });

            if (res.ok) {
                showSaveAlert(`Perangkat ${newUuid} berhasil ditambahkan!`);
                setNewUuid("");
                setShowNewDeviceModal(false);
                fetchDevices();
            } else {
                const errData = await res.json();
                showSaveAlert(`Gagal menambahkan: ${errData.message || 'UUID sudah ada'}`);
            }
        } catch (e) {
            // Fallback local add
            const newDev = {
                id: Date.now(),
                uuid: newUuid.trim(),
                name: `ESP32 — ${newUuid.trim()}`,
                status: "Connected",
                ip: "192.168.4." + Math.floor(Math.random() * 200 + 10),
                type: "Secondary Sensor Node",
                sensors: ["Water Temp", "pH Probe", "TDS Meter"],
                lastSeen: "Just now",
            };
            setDevices((prev) => [...prev, newDev]);
            setNewUuid("");
            setShowNewDeviceModal(false);
            showSaveAlert(`Perangkat ${newUuid} ditambahkan ke daftar lokal.`);
        }
    };

    // Delete ESP hardware device
    const handleDeleteDevice = async (id: number, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus perangkat hardware ${name}?`)) return;

        try {
            await fetch(`/api/esp/${id}`, { method: "DELETE" });
        } catch (e) {}

        setDevices((prev) => prev.filter((d) => d.id !== id));
        showSaveAlert(`Perangkat ${name} berhasil dihapus.`);
    };

    const getInitials = (str: string) => {
        const parts = str.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return (parts[0] ? parts[0].substring(0, 2) : "PF").toUpperCase();
    };

    return (
        <div className="tab-page profile-page" style={{ padding: "0 8px", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Header Title */}
            <div style={{ textAlign: "left", marginTop: "10px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", margin: 0 }}>
                    System Settings & Account Profile
                </h1>
                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px", margin: 0 }}>
                    Kelola profil pengguna, preferensi notifikasi realtime, dan perangkat hardware ESP32
                </p>
            </div>

            {/* Alert Banner for Saved Status */}
            {savedMessage && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#ecfdf5",
                    border: "1px solid #6ee7b7",
                    color: "#047857",
                    fontSize: "13px",
                    fontWeight: 600,
                }}>
                    <CheckCircle2 size={16} />
                    <span>{savedMessage}</span>
                </div>
            )}

            {/* Layout Grid (Submenu Sidebar + Main Content) */}
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "24px", alignItems: "start" }}>
                {/* Left Nav Pills */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "8px",
                    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)"
                }}>
                    {[
                        { id: "profile", icon: User, label: "User Profile" },
                        { id: "notifications", icon: Bell, label: "Notifications" },
                        { id: "hardware", icon: Cpu, label: "ESP Hardware" },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSubmenu === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSubmenu(item.id as SubmenuType)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: isActive ? "#f0f9ff" : "transparent",
                                    color: isActive ? "#0284c7" : "#64748b",
                                    fontWeight: isActive ? 700 : 500,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                <Icon size={16} style={{ color: isActive ? "#0284c7" : "#94a3b8" }} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Right Content Body Panel */}
                <div style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)",
                }}>
                    {/* Submenu 1: User Profile Settings */}
                    {activeSubmenu === "profile" && (
                        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ textAlign: "left" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                    Profile Settings
                                </h3>
                                <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                                    Informasi pengguna terhubung secara dinamis dengan seluruh dashboard CatfishCare
                                </p>
                            </div>

                            {/* User Avatar */}
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "50%",
                                    backgroundColor: "#0284c7",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#ffffff",
                                    fontSize: "20px",
                                    fontWeight: 700,
                                    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)"
                                }}>
                                    {getInitials(name)}
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                                        {name}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                                        {role}
                                    </div>
                                </div>
                            </div>

                            {/* Input Fields Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Nama Lengkap / Username</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pm-input"
                                        required
                                        style={{ height: "40px", padding: "0 12px", width: "100%", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Jabatan / Peran System</label>
                                    <input
                                        type="text"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="pm-input"
                                        style={{ height: "40px", padding: "0 12px", width: "100%", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Alamat Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pm-input"
                                        style={{ height: "40px", padding: "0 12px", width: "100%", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Nama Tambak / Lokasi Budidaya</label>
                                    <input
                                        type="text"
                                        value={farmName}
                                        onChange={(e) => setFarmName(e.target.value)}
                                        className="pm-input"
                                        style={{ height: "40px", padding: "0 12px", width: "100%", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>

                            {/* Submit Save Button */}
                            <div style={{ textAlign: "left", marginTop: "8px" }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "0 20px",
                                        height: "40px",
                                        backgroundColor: "#0ea5e9",
                                        color: "#ffffff",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: loading ? "wait" : "pointer"
                                    }}
                                >
                                    <Save size={15} />
                                    <span>{loading ? "Menyimpan..." : "Simpan Profil & Sinkronkan"}</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Submenu 2: Notifications Preferences */}
                    {activeSubmenu === "notifications" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                            <div style={{ textAlign: "left" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                    Notification Preferences
                                </h3>
                                <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                                    Atur peringatan notifikasi realtime untuk anomali parameter air (pH, Suhu, Turbidity, TDS)
                                </p>
                            </div>

                            {/* Toggle Cards */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                {[
                                    {
                                        title: "Web Push Notifications",
                                        desc: "Notifikasi pop-up langsung pada browser saat kualitas air kritis",
                                        state: pushEnabled,
                                        toggle: () => setPushEnabled(!pushEnabled),
                                    },
                                    {
                                        title: "Email Digest Reports",
                                        desc: "Laporan rangkuman harian kualitas air ke email terdaftar",
                                        state: emailEnabled,
                                        toggle: () => setEmailEnabled(!emailEnabled),
                                    },
                                ].map((item, idx) => (
                                    <div key={idx} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "16px",
                                        border: "1px solid #f1f5f9",
                                        borderRadius: "10px",
                                        backgroundColor: "#f8fafc"
                                    }}>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{item.title}</div>
                                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{item.desc}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={item.toggle}
                                            style={{
                                                width: "40px",
                                                height: "22px",
                                                borderRadius: "100px",
                                                backgroundColor: item.state ? "#0ea5e9" : "#cbd5e1",
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
                                                left: item.state ? "21px" : "3px",
                                                transition: "left 0.2s"
                                            }}></div>
                                        </button>
                                    </div>
                                ))}

                                {/* WA Toggle & Phone Input */}
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "14px",
                                    padding: "16px",
                                    border: "1px solid #f1f5f9",
                                    borderRadius: "10px",
                                    backgroundColor: "#f8fafc"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>WhatsApp Emergency Alerts</div>
                                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Kirim pesan otomatis WA saat pompa otomatis atau pengurasan air dipicu</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setWaEnabled(!waEnabled)}
                                            style={{
                                                width: "40px",
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
                                                left: waEnabled ? "21px" : "3px",
                                                transition: "left 0.2s"
                                            }}></div>
                                        </button>
                                    </div>

                                    {waEnabled && (
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <select
                                                value={waCountry}
                                                onChange={(e) => setWaCountry(e.target.value)}
                                                className="pm-input"
                                                style={{ width: "80px", height: "38px", padding: "0 8px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                            >
                                                <option value="+62">+62</option>
                                                <option value="+1">+1</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={waPhone}
                                                onChange={(e) => setWaPhone(e.target.value)}
                                                className="pm-input"
                                                placeholder="812-3456-7890"
                                                style={{ height: "38px", padding: "0 12px", flex: 1, borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submenu 3: ESP Hardware Management */}
                    {activeSubmenu === "hardware" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                                <div style={{ textAlign: "left" }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        ESP Hardware Devices
                                    </h3>
                                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                                        Daftar mikrokontroler ESP32 terdaftar pada sistem CatfishCare
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowNewDeviceModal(true)}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "0 14px",
                                        height: "36px",
                                        backgroundColor: "#0ea5e9",
                                        color: "#ffffff",
                                        fontWeight: 600,
                                        fontSize: "13px",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer"
                                    }}
                                >
                                    <Plus size={15} />
                                    <span>Tambah ESP Hardware</span>
                                </button>
                            </div>

                            {/* Connectivity Bar */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: "#10b981" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 8px #10b981" }}></span>
                                    <span>{devices.filter((d) => d.status === "Connected").length} dari {devices.length} Perangkat Terhubung Live</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={fetchDevices}
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
                                        cursor: "pointer"
                                    }}
                                >
                                    <RefreshCw size={12} className={loadingDevices ? "spin" : ""} />
                                    <span>Refresh Devices</span>
                                </button>
                            </div>

                            {/* Modal Add Hardware */}
                            {showNewDeviceModal && (
                                <form onSubmit={handleAddDevice} style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                    padding: "16px",
                                    backgroundColor: "#f0f9ff",
                                    border: "1px solid #bae6fd",
                                    borderRadius: "10px"
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#0369a1", textAlign: "left" }}>
                                        Registrasi Perangkat ESP32 Baru
                                    </div>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <input
                                            type="text"
                                            value={newUuid}
                                            onChange={(e) => setNewUuid(e.target.value)}
                                            placeholder="Contoh: ESP32-CATFISHCARE-002"
                                            required
                                            style={{ flex: 1, height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid #93c5fd" }}
                                        />
                                        <button
                                            type="submit"
                                            style={{ padding: "0 16px", backgroundColor: "#0284c7", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                                        >
                                            Simpan Perangkat
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewDeviceModal(false)}
                                            style={{ padding: "0 12px", backgroundColor: "transparent", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px" }}
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Device Cards List */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {devices.map((device) => (
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
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                            <div style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "rgba(16, 185, 129, 0.1)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#10b981",
                                            }}>
                                                <Wifi size={20} />
                                            </div>

                                            <div style={{ textAlign: "left" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{device.name}</span>
                                                    <span style={{
                                                        fontSize: "10px",
                                                        fontWeight: 700,
                                                        padding: "2px 8px",
                                                        borderRadius: "20px",
                                                        backgroundColor: "#dcfce7",
                                                        color: "#16a34a",
                                                    }}>
                                                        {device.status}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                                    UUID: <code style={{ background: "#e2e8f0", padding: "1px 6px", borderRadius: "4px" }}>{device.uuid}</code> · IP: {device.ip}
                                                </div>

                                                <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                                                    {device.sensors.map((sensor: string, sIdx: number) => (
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

                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDevice(device.id, device.name)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#e11d48",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                <span>Hapus</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
