/**
 * Format ISO date string or Date object to detailed Indonesian WIB format.
 * Example input: "2026-09-14T09:59:48Z"
 * Example output: "14 September 2026, 16:59:48 WIB"
 */
export function formatWibDetail(dateInput?: string | Date | null): string {
    if (!dateInput) return "—";
    try {
        const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
        if (isNaN(d.getTime())) return String(dateInput);

        const dateStr = d.toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "numeric",
            month: "long",
            year: "numeric",
        });

        const timeStr = d.toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }).replace(/\./g, ":");

        return `${dateStr}, ${timeStr} WIB`;
    } catch {
        return String(dateInput);
    }
}

/**
 * Format ISO date string or Date object to standard short WIB format.
 * Example output: "14 Sep 2026, 16:59 WIB"
 */
export function formatWibShort(dateInput?: string | Date | null): string {
    if (!dateInput) return "—";
    try {
        const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
        if (isNaN(d.getTime())) return String(dateInput);

        const dateStr = d.toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        const timeStr = d.toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).replace(/\./g, ":");

        return `${dateStr}, ${timeStr} WIB`;
    } catch {
        return String(dateInput);
    }
}
