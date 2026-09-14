import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, User as UserIcon, Key, Trash2, Edit3, Search, CheckCircle, AlertCircle, Info, X } from "lucide-react";

interface UserItem {
    id: number;
    username: string;
    email: string;
    role: "admin" | "user";
    created_at: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] = useState<"success" | "danger">("success");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [activeUserId, setActiveUserId] = useState<number | null>(null);

    // Form inputs
    const [usernameInput, setUsernameInput] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [roleInput, setRoleInput] = useState<"admin" | "user">("user");
    const [passwordInput, setPasswordInput] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch {
            showAlert("Gagal memuat daftar pengguna.", "danger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showAlert = (msg: string, type: "success" | "danger" = "success") => {
        setAlertMessage(msg);
        setAlertType(type);
        setTimeout(() => setAlertMessage(""), 4000);
    };

    const handleOpenCreateModal = () => {
        setModalMode("create");
        setActiveUserId(null);
        setUsernameInput("");
        setEmailInput("");
        setRoleInput("user");
        setPasswordInput("password");
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: UserItem) => {
        setModalMode("edit");
        setActiveUserId(user.id);
        setUsernameInput(user.username);
        setEmailInput(user.email);
        setRoleInput(user.role);
        setPasswordInput("");
        setIsModalOpen(true);
    };

    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload: any = {
            username: usernameInput,
            email: emailInput,
            role: roleInput,
        };

        if (passwordInput) {
            payload.password = passwordInput;
        }

        try {
            const url = modalMode === "create" ? "/api/users" : `/api/users/${activeUserId}`;
            const method = modalMode === "create" ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (res.ok) {
                showAlert(json.message || "Pengguna berhasil disimpan!", "success");
                setIsModalOpen(false);
                fetchUsers();
            } else {
                showAlert(json.message || "Gagal menyimpan pengguna.", "danger");
            }
        } catch {
            showAlert("Terjadi kesalahan jaringan.", "danger");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (id: number, username: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${username}"?`)) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            const json = await res.json();

            if (res.ok) {
                showAlert(json.message || `Pengguna "${username}" telah dihapus.`, "success");
                fetchUsers();
            } else {
                showAlert(json.message || "Gagal menghapus pengguna.", "danger");
            }
        } catch {
            showAlert("Terjadi kesalahan jaringan.", "danger");
        }
    };

    const filteredUsers = users.filter(
        (u) =>
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.role.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
            {/* Title Area */}
            <div className="pm-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 className="db-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Users color="#0ea5e9" size={26} />
                        <span>User Management</span>
                    </h2>
                    <p className="db-subtitle">Kelola akun pengguna, hak akses role (Admin & User), dan kata sandi aplikasi</p>
                </div>
                <button className="db-btn-cyan" onClick={handleOpenCreateModal} style={{ gap: "8px" }}>
                    <UserPlus size={16} />
                    <span>+ Add New User</span>
                </button>
            </div>

            {alertMessage && (
                <div
                    className="auth-alert-new"
                    style={{
                        backgroundColor: alertType === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        borderColor: alertType === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: alertType === "success" ? "#34d399" : "#f87171",
                    }}
                >
                    <Info size={16} />
                    <span>{alertMessage}</span>
                </div>
            )}

            {/* Filter & Search Card */}
            <div className="pm-table-card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                    <div style={{ position: "relative", width: "320px" }}>
                        <Search size={16} color="#64748b" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                            type="text"
                            className="pm-input"
                            style={{ paddingLeft: "36px" }}
                            placeholder="Cari username, email, atau role..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                        Total: <strong>{filteredUsers.length}</strong> akun terdaftar
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="pm-table-card">
                <div style={{ overflowX: "auto" }}>
                    <table className="pm-table">
                        <thead>
                            <tr>
                                <th>User Info</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created At</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                        Memuat daftar pengguna...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                                        Tidak ada pengguna ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="pm-pond-name-cell">
                                                <div className="pm-pond-icon-circle" style={{ backgroundColor: user.role === "admin" ? "rgba(14, 165, 233, 0.2)" : "rgba(100, 116, 139, 0.2)" }}>
                                                    {user.role === "admin" ? <Shield size={16} color="#0ea5e9" /> : <UserIcon size={16} color="#94a3b8" />}
                                                </div>
                                                <div style={{ textAlign: "left" }}>
                                                    <div className="pm-pond-title">{user.username}</div>
                                                    <div className="pm-pond-location">ID #{user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: "13px", color: "#e2e8f0" }}>{user.email}</div>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    backgroundColor: user.role === "admin" ? "rgba(14, 165, 233, 0.15)" : "rgba(148, 163, 184, 0.15)",
                                                    color: user.role === "admin" ? "#38bdf8" : "#94a3b8",
                                                    border: user.role === "admin" ? "1px solid rgba(14, 165, 233, 0.3)" : "1px solid rgba(148, 163, 184, 0.3)",
                                                }}
                                            >
                                                {user.role === "admin" ? <Shield size={12} /> : <UserIcon size={12} />}
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: "12px", color: "#64748b" }}>{user.created_at}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                <button
                                                    className="pm-action-btn"
                                                    title="Edit user"
                                                    onClick={() => handleOpenEditModal(user)}
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    className="pm-action-btn delete"
                                                    title="Delete user"
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Create/Edit User */}
            {isModalOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        backdropFilter: "blur(4px)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                >
                    <div
                        className="pm-table-card"
                        style={{
                            width: "100%",
                            maxWidth: "460px",
                            padding: "24px",
                            position: "relative",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                                {modalMode === "create" ? "Tambah Akun Pengguna Baru" : "Edit Akun Pengguna"}
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitForm}>
                            <div className="pm-details-field">
                                <label className="pm-details-label">Username</label>
                                <input
                                    type="text"
                                    className="pm-input"
                                    value={usernameInput}
                                    onChange={(e) => setUsernameInput(e.target.value)}
                                    placeholder="Contoh: pakfii"
                                    required
                                />
                            </div>

                            <div className="pm-details-field">
                                <label className="pm-details-label">Email</label>
                                <input
                                    type="email"
                                    className="pm-input"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="Contoh: pakfii@catfishcare.app"
                                    required
                                />
                            </div>

                            <div className="pm-details-field">
                                <label className="pm-details-label">Hak Akses Role</label>
                                <select
                                    className="pm-input"
                                    value={roleInput}
                                    onChange={(e) => setRoleInput(e.target.value as "admin" | "user")}
                                    style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
                                >
                                    <option value="user">User (Monitoring & Control)</option>
                                    <option value="admin">Admin (Full System & User Management)</option>
                                </select>
                            </div>

                            <div className="pm-details-field">
                                <label className="pm-details-label">
                                    {modalMode === "create" ? "Kata Sandi (Password)" : "Reset Password (Opsional)"}
                                </label>
                                <input
                                    type="password"
                                    className="pm-input"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder={modalMode === "create" ? "Masukkan password (misal: password)" : "Kosongkan jika tidak ingin mengubah"}
                                    required={modalMode === "create"}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                                <button
                                    type="button"
                                    className="pm-btn-cancel"
                                    style={{ flex: 1 }}
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="pm-btn-full"
                                    style={{ flex: 1 }}
                                    disabled={saving}
                                >
                                    {saving ? "Menyimpan..." : modalMode === "create" ? "+ Simpan User" : "Simpan Perubahan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
