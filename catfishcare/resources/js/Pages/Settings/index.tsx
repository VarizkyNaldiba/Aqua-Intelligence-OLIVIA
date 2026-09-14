import { useState } from "react";
import { Info } from "lucide-react";
import type { AppUser } from "@/Types";
import ThresholdConfigForm from "./ThresholdConfigForm";
import HardwareConfigForm from "./HardwareConfigForm";

interface SettingsIndexProps {
    currentUser?: AppUser | null;
    cameraUrl?: string;
    setCameraUrl?: (url: string) => void;
}

export default function SettingsIndex({ currentUser, cameraUrl = "", setCameraUrl }: SettingsIndexProps) {
    const [alertMessage, setAlertMessage] = useState("");

    const handleSaveSuccess = (msg: string) => {
        setAlertMessage(msg);
        setTimeout(() => setAlertMessage(""), 4000);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Settings & Hardware Configuration
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                    Pengaturan ambang batas sensor, profil operator, dan IP hardware ESP32
                </p>
            </div>

            {alertMessage && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "#047857",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "13px",
                        fontWeight: 600,
                    }}
                >
                    <Info size={18} />
                    <span>{alertMessage}</span>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", alignItems: "start" }}>
                <ThresholdConfigForm currentUser={currentUser} onSaveSuccess={handleSaveSuccess} />
                <HardwareConfigForm cameraUrl={cameraUrl} setCameraUrl={setCameraUrl} onSaveSuccess={handleSaveSuccess} />
            </div>
        </div>
    );
}
