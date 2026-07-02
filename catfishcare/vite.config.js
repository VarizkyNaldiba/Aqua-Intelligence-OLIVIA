import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./resources/js", import.meta.url)),
        },
    },
    plugins: [
        laravel({
            input: "resources/js/main.tsx",
            refresh: true,
        }),
        react(),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
                            return "react-vendor";
                        }
                        if (id.includes("recharts") || id.includes("d3") || id.includes("victory")) {
                            return "charts-vendor";
                        }
                        if (id.includes("lucide-react")) {
                            return "icons-vendor";
                        }
                        return "vendor";
                    }
                },
            },
        },
    },
});
