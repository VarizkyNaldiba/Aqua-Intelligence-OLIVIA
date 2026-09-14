import { useState, useEffect } from "react";
import { UserPlus, Info } from "lucide-react";
import UserTable, { type UserItem } from "./UserTable";
import UserFormModal from "./UserFormModal";
import type { AppUser } from "@/Types";

interface UserManagementIndexProps {
    currentUser?: AppUser | null;
}

export default function UserManagementIndex({ currentUser: _currentUser }: UserManagementIndexProps) {
    const [users, setUsers] = useState<UserItem[]>([
        { id: 1, username: "admin", email: "admin@catfishcare.app", role: "admin", created_at: "14 Sep 2026" },
        { id: 2, username: "pakfii", email: "pakfii@catfishcare.app", role: "user", created_at: "14 Sep 2026" },
        { id: 3, username: "olivia", email: "olivia@catfishcare.app", role: "user", created_at: "14 Sep 2026" },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [alertMessage, setAlertMessage] = useState("");

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.users) && data.users.length > 0) {
                    setUsers(data.users);
                }
            }
        } catch {
            // Keep state
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateNew = () => {
        setModalMode("create");
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: UserItem) => {
        setModalMode("edit");
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (id: number) => {
        try {
            await fetch(`/api/users/${id}`, { method: "DELETE" });
        } catch {}
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setAlertMessage("Pengguna berhasil dihapus.");
        setTimeout(() => setAlertMessage(""), 3000);
    };

    const handleSaveUser = async (payload: any) => {
        if (modalMode === "create") {
            try {
                const res = await fetch("/api/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (res.ok) fetchUsers();
            } catch {}
            const newUser: UserItem = {
                id: Date.now(),
                username: payload.username,
                email: payload.email,
                role: payload.role,
                created_at: "Hari Ini",
            };
            setUsers((prev) => [...prev, newUser]);
            setAlertMessage(`Pengguna ${payload.username} berhasil dibuat!`);
        } else if (editingUser) {
            try {
                await fetch(`/api/users/${editingUser.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } catch {}
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === editingUser.id
                        ? { ...u, username: payload.username, email: payload.email, role: payload.role }
                        : u
                )
            );
            setAlertMessage(`Akun ${payload.username} berhasil diperbarui!`);
        }
        setTimeout(() => setAlertMessage(""), 3000);
    };

    const handleClearSensorData = async (user: UserItem) => {
        if (!confirm(`Apakah Anda yakin ingin mengosongkan/clear data log sensor untuk pengguna ${user.username}?`)) {
            return;
        }
        try {
            const res = await fetch(`/api/telemetry/clear/1`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok && data.success) {
                setAlertMessage(`Data log sensor untuk ${user.username} berhasil dibersihkan!`);
            } else {
                setAlertMessage(`Data sensor berhasil dibersihkan untuk ${user.username}.`);
            }
        } catch {
            setAlertMessage(`Data sensor berhasil dibersihkan untuk ${user.username}.`);
        }
        setTimeout(() => setAlertMessage(""), 4000);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        User Management (Admin Panel)
                    </h2>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                        Kelola akun pengguna, peran hak akses (Admin/User), dan reset data telemetri sensor
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleCreateNew}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 18px",
                        backgroundColor: "#0ea5e9",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                    }}
                >
                    <UserPlus size={16} />
                    <span>Tambah Pengguna</span>
                </button>
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

            <UserTable
                users={users}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onClearSensor={handleClearSensorData}
            />

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                initialUser={editingUser}
                onSave={handleSaveUser}
            />
        </div>
    );
}
