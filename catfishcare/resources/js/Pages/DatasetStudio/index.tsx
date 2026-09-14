import { useState, useEffect } from "react";
import StreamRecorder from "./StreamRecorder";
import DatasetTable from "./DatasetTable";

interface DatasetStudioIndexProps {
    initialCameraUrl?: string;
}

export default function DatasetStudioIndex({ initialCameraUrl }: DatasetStudioIndexProps) {
    const DEFAULT_CAMERA_URL = "http://192.168.1.100:8080/video";
    const [cameraUrl] = useState<string>(() => {
        return localStorage.getItem("catfish_camera_url") || initialCameraUrl || DEFAULT_CAMERA_URL;
    });

    const [stats, setStats] = useState({ total_images: 142, total_labels: 142 });

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/dataset/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch {
            // Keep state
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleSnapshot = () => {
        setStats((prev) => ({
            total_images: prev.total_images + 1,
            total_labels: prev.total_labels + 1,
        }));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Studio Dataset AI & Pengumpulan Data Training Lele
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                    Pengumpulan frame foto live camera untuk pengawasan kesehatan lele & training ML
                </p>
            </div>

            <StreamRecorder cameraUrl={cameraUrl} onSnapshot={handleSnapshot} />
            <DatasetTable stats={stats} />
        </div>
    );
}
