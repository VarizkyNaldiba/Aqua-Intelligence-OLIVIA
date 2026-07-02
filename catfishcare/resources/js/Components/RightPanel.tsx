import { AlertCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { SensorRow, StatusInfo, TodoItem } from "@/Types";

interface RightPanelProps {
    currentData: SensorRow | null;
    statusInfo: StatusInfo;
    todos: TodoItem[];
    toggleTodo: (id: number) => void;
}

const RightPanel = ({
    currentData,
    statusInfo,
    todos,
    toggleTodo,
}: RightPanelProps) => {
    const getAvatarIcon = (type: string) => {
        switch (type) {
            case "danger":
                return <AlertCircle size={16} />;
            case "warning":
                return <AlertTriangle size={16} />;
            default:
                return <CheckCircle size={16} />;
        }
    };

    // Generate historical notifications based on current data warning levelsno
    const notifications = [
        {
            id: 1,
            type: statusInfo.type,
            text:
                statusInfo.type === "danger"
                    ? `Sistem mendeteksi kondisi kritis pada Kolam! Suhu ${currentData?.TEMPERATURE}°C, pH ${currentData?.pH}. Segera tindaklanjuti!`
                    : statusInfo.type === "warning"
                      ? `Suhu terdeteksi turun (${currentData?.TEMPERATURE}°C) dan Nitrat tinggi. Waspada upwelling!`
                      : `Kondisi kolam terpantau optimal. Suhu ${currentData?.TEMPERATURE}°C, pH ${currentData?.pH}.`,
            time: "Baru saja",
        },
        {
            id: 2,
            type: "info",
            text: `Panjang rata-rata ikan lele bertambah menjadi ${currentData?.Length || 0} cm.`,
            time: "1 jam yang lalu",
        },
        {
            id: 3,
            type: "info",
            text: `Berat rata-rata ikan lele saat ini mencapai ${currentData?.Weight || 0} gram.`,
            time: "4 jam yang lalu",
        },
    ];

    return (
        <aside className="right-panel">
            <div className="panel-section">
                <h3>AI Actionable Insights</h3>
                <div className="todo-list">
                    {todos.length === 0 ? (
                        <p
                            style={{
                                fontSize: "13px",
                                color: "var(--color-text-muted)",
                                textAlign: "center",
                            }}
                        >
                            Tidak ada tugas mendesak dari AI.
                        </p>
                    ) : (
                        todos.map((todo, index) => (
                            <div
                                key={`${statusInfo.type}-${todo.id}`}
                                className="todo-item"
                                onClick={() => toggleTodo(todo.id)}
                                style={{
                                    animation:
                                        "todoFadeIn 0.4s var(--transition-ease) both",
                                    animationDelay: `${index * 0.05}s`,
                                }}
                            >
                                <div
                                    className={`todo-checkbox ${todo.checked ? "checked" : ""}`}
                                >
                                    {todo.checked && <span>✓</span>}
                                </div>
                                <div
                                    className={`todo-text ${todo.checked ? "checked" : ""}`}
                                >
                                    {todo.text}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
};

export default RightPanel;
