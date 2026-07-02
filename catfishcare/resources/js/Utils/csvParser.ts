import type { CsvRow, SensorRow } from "@/Types";

export const parseValueFromRow = (row: CsvRow, keys: string[]): number => {
    for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== "") {
            const parsed = Number.parseFloat(String(value));
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
    }
    return 0;
};

export const parseIntValueFromRow = (row: CsvRow, keys: string[]): number => {
    for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== "") {
            const parsed = Number.parseInt(String(value), 10);
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
    }
    return 0;
};

export const normalizeSensorRow = (row: CsvRow): SensorRow => ({
    created_at: String(row.created_at || ""),
    entry_id: String(row.entry_id || ""),
    TEMPERATURE: parseValueFromRow(row, ["TEMPERATURE", "Temperature (C)"]),
    TURBIDITY: parseValueFromRow(row, ["TURBIDITY", "Turbidity (NTU)"]),
    pH: parseValueFromRow(row, ["pH", "PH"]),
    NITRATE: parseValueFromRow(row, ["NITRATE", "Nitrate(g/ml)"]),
    Population: parseIntValueFromRow(row, ["Population"]),
    Length: parseValueFromRow(row, ["Length", "Fish_Length (cm)"]),
    Weight: parseValueFromRow(row, ["Weight", "Fish_Weight (g)"]),
});
