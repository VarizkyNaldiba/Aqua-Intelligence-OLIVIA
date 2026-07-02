import type { SensorRow, StatusInfo } from "@/Types";

// AI Decision Logic (Decision Support System based on AGENTS.md rules)
export const getPondStatus = (
    currentData: SensorRow | null,
    selectedPondId: number,
): StatusInfo => {
    if (!currentData)
        return {
            type: "success",
            text: "Mengambil data...",
            title: "SEDANG MEMUAT",
        };

    const tempVal = currentData.TEMPERATURE;
    const nitrateVal = currentData.NITRATE;
    const pHVal = currentData.pH;

    // Skenario A: Suhu kritis atau pH ekstrem atau Nitrate tinggi
    if (tempVal < 26 || pHVal < 5.5 || nitrateVal > 300) {
        return {
            type: "danger",
            title: "🔴 BAHAYA KRITIS",
            text: "Suhu terlalu rendah, pH terlalu asam, atau Nitrate beracun terdeteksi! Segera lakukan tindakan.",
            actionList: [
                {
                    id: 1,
                    text: `Segera periksa kondisi air di Kolam ${selectedPondId}.`,
                    checked: false,
                },
                {
                    id: 2,
                    text: "Lakukan pergantian air (Sifon) dasar kolam sebesar 30%.",
                    checked: false,
                },
                {
                    id: 3,
                    text: "Taburkan kapur Dolomit untuk menstabilkan pH air.",
                    checked: false,
                },
            ],
        };
    }

    // Skenario B: Suhu dingin/fluktuatif (potensi Upwelling) ATAU pH asam
    if (tempVal < 27.05 || pHVal < 6.05 || nitrateVal > 250) {
        return {
            type: "warning",
            title: "🟡 WASPADA UPWELLING",
            text: "Suhu dingin atau pH asam terdeteksi. Risiko kotoran naik dari dasar kolam.",
            actionList: [
                {
                    id: 1,
                    text: "Periksa penumpukan lumpur organik di dasar kolam.",
                    checked: false,
                },
                {
                    id: 2,
                    text: "Taburkan kapur Dolomit secukupnya untuk menaikkan pH.",
                    checked: false,
                },
                {
                    id: 3,
                    text: "Pertimbangkan pemberian probiotik air untuk menstabilkan bakteri pengurai.",
                    checked: false,
                },
            ],
        };
    }

    // Skenario C: Normal
    return {
        type: "success",
        title: "🟢 AMAN & OPTIMAL",
        text: "Seluruh parameter kualitas air dalam kondisi prima. Pertumbuhan berjalan normal.",
        actionList: [
            {
                id: 1,
                text: "Kondisi kolam sangat baik. Lanjutkan jadwal pakan standar.",
                checked: false,
            },
        ],
    };
};
