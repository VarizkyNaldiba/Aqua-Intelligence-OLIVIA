// Type definitions for the application

export type ThemeSetting = "system" | "light" | "dark";
export type Theme = "light" | "dark";
export type TabName = "dashboard" | "home" | "ponds" | "analytics" | "profile" | "notifications" | "dataset" | "actuators" | "user_management" | "activity_logs";
export type MetricType = "TEMPERATURE" | "pH" | "TURBIDITY";

export type SensorRow = {
    created_at: string;
    entry_id: string;
    TEMPERATURE: number;
    TURBIDITY: number;
    pH: number;
    NITRATE: number;
    Population: number;
    Length: number;
    Weight: number;
};

export type TodoItem = {
    id: number;
    text: string;
    checked: boolean;
};

export type AppUser = {
    id?: number;
    username: string;
    name?: string;
    email?: string;
    role?: "admin" | "user";
    [key: string]: unknown;
};

export type StatusInfo = {
    type: "success" | "warning" | "danger";
    title: string;
    text: string;
    actionList?: TodoItem[];
};

export type CsvRow = Record<string, string | number | null | undefined>;

export type PageProps = {
    auth?: {
        user: AppUser;
    };
    [key: string]: unknown;
};
