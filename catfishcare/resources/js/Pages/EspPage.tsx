import { useState, useCallback } from "react";
import { Plus, Cpu } from "lucide-react";
import { DataTable, Modal, TextInput, Button } from "@/Components/ui";
import type { DataTableColumn } from "@/Components/ui";
import AppLayout from "@/Layouts/AppLayout";

interface EspRecord {
    id: number;
    uuid: string;
    [key: string]: unknown;
}

interface EspPageProps {
    espList?: EspRecord[];
}

const EspPage = ({ espList: initialData }: EspPageProps) => {
    const [espList, setEspList] = useState<EspRecord[]>(initialData ?? []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEsp, setEditingEsp] = useState<EspRecord | null>(null);
    const [uuidValue, setUuidValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const refreshList = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/esp");
            if (res.ok) setEspList(await res.json());
        } catch (e) {
            console.error("Gagal memuat data ESP:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const openAddModal = useCallback(() => {
        setEditingEsp(null);
        setUuidValue("");
        setIsModalOpen(true);
    }, []);

    const openEditModal = useCallback((row: EspRecord) => {
        setEditingEsp(row);
        setUuidValue(row.uuid);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingEsp(null);
        setUuidValue("");
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!uuidValue.trim()) return;
        setIsSubmitting(true);

        try {
            const url = editingEsp ? `/api/esp/${editingEsp.id}` : "/api/esp";
            const method = editingEsp ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uuid: uuidValue.trim() }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                const msg =
                    err?.errors?.uuid?.[0] ??
                    err?.message ??
                    "Terjadi kesalahan.";
                alert(msg);
                return;
            }

            await refreshList();
            closeModal();
        } catch (e) {
            console.error("Gagal menyimpan ESP:", e);
            alert("Gagal menyimpan data. Periksa koneksi dan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    }, [uuidValue, editingEsp, closeModal, refreshList]);

    const handleDelete = useCallback(
        async (row: EspRecord) => {
            if (!window.confirm(`Hapus ESP "${row.uuid}"?`)) return;

            try {
                const res = await fetch(`/api/esp/${row.id}`, {
                    method: "DELETE",
                });
                if (!res.ok) {
                    alert("Gagal menghapus data ESP.");
                    return;
                }
                await refreshList();
            } catch (e) {
                console.error("Gagal menghapus ESP:", e);
                alert("Gagal menghapus data. Periksa koneksi dan coba lagi.");
            }
        },
        [refreshList],
    );

    const columns: DataTableColumn<EspRecord>[] = [
        { key: "id", header: "ID", sortable: true },
        {
            key: "uuid",
            header: "UUID",
            sortable: true,
            render: (row) => (
                <span
                    style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}
                >
                    {row.uuid}
                </span>
            ),
        },
    ];

    return (
        <AppLayout>
            <div className="tab-page esp-page" style={{ padding: "2rem" }}>
                <div
                    className="ponds-header-row"
                    style={{ marginBottom: "1.5rem" }}
                >
                    <div>
                        <h2
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}
                        >
                            <Cpu size={22} />
                            Manajemen ESP
                        </h2>
                        <p>
                            Kelola perangkat Electronic Sensor Platform (ESP)
                            untuk monitoring kolam.
                        </p>
                    </div>
                    <Button
                        variant="add"
                        icon={<Plus size={16} />}
                        onClick={openAddModal}
                    >
                        <span>Tambah ESP</span>
                    </Button>
                </div>

                <DataTable<EspRecord>
                    data={espList}
                    columns={columns}
                    title={
                        isLoading ? "Memuat data..." : "Daftar Perangkat ESP"
                    }
                    showRowNumber
                    showActions
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    pageSize={10}
                    searchPlaceholder="Cari UUID..."
                    emptyMessage="Belum ada data ESP. Klik tombol 'Tambah ESP' untuk menambahkan."
                />

                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={editingEsp ? "Edit ESP" : "Tambah ESP Baru"}
                    onSubmit={handleSubmit}
                    submitText={
                        isSubmitting
                            ? "Menyimpan..."
                            : editingEsp
                              ? "Simpan Perubahan"
                              : "Tambah"
                    }
                    isSubmitting={isSubmitting}
                    size="small"
                >
                    <TextInput
                        label="UUID ESP"
                        placeholder="Contoh: ESP-28A4-B1F0-006"
                        value={uuidValue}
                        onChange={(e) => setUuidValue(e.target.value)}
                        required
                        autoFocus
                    />
                    <p
                        style={{
                            fontSize: "0.8rem",
                            opacity: 0.7,
                            marginTop: "0.5rem",
                        }}
                    >
                        Masukkan UUID unik perangkat ESP. UUID ini akan
                        digunakan sebagai referensi ke data kolam.
                    </p>
                </Modal>
            </div>
        </AppLayout>
    );
};

export default EspPage;
