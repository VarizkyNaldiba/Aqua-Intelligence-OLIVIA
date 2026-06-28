import { useState, useEffect } from "react";
import {
    User,
    Sliders,
    Database,
    Save,
    CheckCircle,
    LogOut,
} from "lucide-react";
import { TextInput, Button, RadioGroup, RangeSlider } from "@/Components/ui";
import type { AppUser, Theme, ThemeSetting } from "@/Types";

interface ProfileTabProps {
    theme: Theme;
    themeSetting: ThemeSetting;
    onChangeThemeSetting: (setting: ThemeSetting) => void;
    toggleTheme: () => void;
    currentUser: AppUser | null;
    onLogout: () => void;
    onProfileUpdate: (user: AppUser) => void;
}

const ProfileTab = ({
    themeSetting,
    onChangeThemeSetting,
    currentUser,
    onLogout,
    onProfileUpdate,
}: ProfileTabProps) => {
    const [farmerName, setFarmerName] = useState("");
    const [role, setRole] = useState("");
    const [doThreshold, setDoThreshold] = useState(2.0);
    const [ammoniaThreshold, setAmmoniaThreshold] = useState(0.0005);
    const [tempThreshold, setTempThreshold] = useState(27.0);
    const [phThreshold, setPhThreshold] = useState(6.0);
    const [saved, setSaved] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch authenticated user data from the database API
    useEffect(() => {
        const token = localStorage.getItem("aqua_token");
        if (!token) {
            setIsLoadingProfile(false);
            return;
        }

        fetch("/api/profile", {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data) {
                    setFarmerName(data.username || "");
                    setRole(data.jabatan || "");
                }
            })
            .catch(() => {})
            .finally(() => setIsLoadingProfile(false));
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const token = localStorage.getItem("aqua_token");
            await fetch("/api/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
        } catch {
            // Proceed with local cleanup even if the API call fails
        } finally {
            localStorage.removeItem("aqua_token");
            setIsLoggingOut(false);
            onLogout();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("aqua_token");
        if (!token) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: farmerName,
                    jabatan: role,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setFarmerName(data.username || "");
                setRole(data.jabatan || "");
                if (onProfileUpdate && currentUser) {
                    onProfileUpdate({
                        ...currentUser,
                        username: data.username,
                        name: data.username,
                        role: data.jabatan,
                    });
                }
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch {
            // silently fail — toast will not show
        } finally {
            setIsSaving(false);
        }
    };

    const themeOptions = [
        { value: "dark", label: "Tema Gelap" },
        { value: "light", label: "Tema Terang" },
        { value: "system", label: "Ikuti Sistem" },
    ];

    const sliders = [
        {
            label: "Oksigen Terlarut (DO) Minimum",
            value: doThreshold,
            set: setDoThreshold,
            min: "1.0",
            max: "4.0",
            step: "0.1",
            cls: "text-danger",
            fmt: (v: number) => `${v.toFixed(1)} mg/L`,
        },
        {
            label: "Kadar Ammonia Maksimum",
            value: ammoniaThreshold,
            set: setAmmoniaThreshold,
            min: "0.0001",
            max: "0.002",
            step: "0.0001",
            cls: "text-danger",
            fmt: (v: number) => v.toFixed(5),
        },
        {
            label: "Suhu Air Pemicu Upwelling",
            value: tempThreshold,
            set: setTempThreshold,
            min: "25.0",
            max: "28.5",
            step: "0.1",
            cls: "text-warning",
            fmt: (v: number) => `${v.toFixed(1)}°C`,
        },
        {
            label: "Ambang Asam Minimum (pH)",
            value: phThreshold,
            set: setPhThreshold,
            min: "5.0",
            max: "7.0",
            step: "0.1",
            cls: "text-warning",
            fmt: (v: number) => v.toFixed(1),
        },
    ];

    return (
        <div className="tab-page profile-page">
            <div className="profile-header-row">
                <div>
                    <h2>Profil & Pengaturan Sistem</h2>
                    <p>
                        Ubah identitas pengguna, sesuaikan nilai ambang batas
                        sensor, dan lihat status API Laravel.
                    </p>
                </div>
            </div>

            <div className="profile-main-grid">
                <div className="card profile-settings-card">
                    <div className="card-header-icon">
                        <User size={20} className="icon-blue" />
                        <h3>Identitas Peternak</h3>
                    </div>
                    <form onSubmit={handleSave} style={{ marginTop: "20px" }}>
                        <TextInput
                            label="Nama Lengkap"
                            value={farmerName}
                            onChange={(e) => setFarmerName(e.target.value)}
                            disabled={isLoadingProfile}
                            placeholder={isLoadingProfile ? "Memuat..." : ""}
                            wrapperClassName={""}
                        />
                        <TextInput
                            label="Peran / Jabatan"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={isLoadingProfile}
                            placeholder={isLoadingProfile ? "Memuat..." : ""}
                            wrapperClassName={""}
                        />
                        <RadioGroup
                            label="Mode Tampilan"
                            name="themeSetting"
                            options={themeOptions}
                            value={themeSetting}
                            onChange={(val) =>
                                onChangeThemeSetting(val as ThemeSetting)
                            }
                            wrapperClassName={""}
                        />
                        <div
                            style={{
                                display: "flex",
                                gap: "15px",
                                marginTop: "25px",
                                alignItems: "center",
                            }}
                        >
                            <Button
                                type="submit"
                                variant="action"
                                icon={<Save size={14} />}
                                isLoading={isSaving || isLoadingProfile}
                                loadingText="Menyimpan..."
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                    margin: 0,
                                }}
                            >
                                <span>Simpan Profil</span>
                            </Button>
                            <Button
                                variant="logout"
                                icon={<LogOut size={14} />}
                                isLoading={isLoggingOut}
                                loadingText="Memproses..."
                                onClick={handleLogout}
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                    margin: 0,
                                }}
                            >
                                <span>Keluar (Logout)</span>
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="card profile-thresholds-card">
                    <div className="card-header-icon">
                        <Sliders size={20} className="icon-teal" />
                        <h3>Ambang Batas Pemicu AI (Alarm Thresholds)</h3>
                    </div>
                    <div
                        className="thresholds-sliders-list"
                        style={{ marginTop: "20px" }}
                    >
                        {sliders.map((s, i) => (
                            <RangeSlider
                                key={i}
                                label={s.label}
                                value={s.value}
                                onChange={s.set}
                                min={s.min}
                                max={s.max}
                                step={s.step}
                                displayValue={s.fmt(s.value)}
                                valueClassName={s.cls}
                                wrapperClassName={i > 0 ? "" : ""}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div
                className="card integration-status-card"
                style={{ marginTop: "25px" }}
            >
                <div className="card-header-icon">
                    <Database size={20} style={{ color: "#F59E0B" }} />
                    <h3>Sinkronisasi Backend Laravel & Database</h3>
                </div>
                <div
                    className="integration-status-row"
                    style={{
                        marginTop: "15px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "15px",
                    }}
                >
                    <div>
                        <p style={{ fontSize: "13px", lineHeight: "1.5" }}>
                            Frontend React terkoneksi ke backend Laravel
                            menggunakan Inertia.js. Data sensor IoT dibaca dari
                            PostgreSQL.
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: "20px",
                                marginTop: "12px",
                            }}
                        >
                            <span className="status-indicator-tag active">
                                <CheckCircle size={12} />
                                <span>Laravel API: Terhubung</span>
                            </span>
                            <span className="status-indicator-tag active">
                                <CheckCircle size={12} />
                                <span>Postgres DB: Terhubung</span>
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() =>
                            alert(
                                "Mengambil data sensor terbaru dari Laravel endpoint...",
                            )
                        }
                    >
                        <span>Uji Koneksi API</span>
                    </Button>
                </div>
            </div>

            {saved && (
                <div className="toast-success">
                    <CheckCircle size={16} />
                    <span>Pengaturan berhasil disimpan!</span>
                </div>
            )}
        </div>
    );
};

export default ProfileTab;
