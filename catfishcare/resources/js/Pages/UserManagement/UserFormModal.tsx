import { useState, useEffect } from "react";
import { X, UserPlus, Save } from "lucide-react";
import type { UserItem } from "./UserTable";

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    initialUser?: UserItem | null;
    onSave: (payload: any) => void;
}

export default function UserFormModal({ isOpen, onClose, mode, initialUser, onSave }: UserFormModalProps) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "user">("user");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (mode === "edit" && initialUser) {
            setUsername(initialUser.username);
            setEmail(initialUser.email);
            setRole(initialUser.role);
            setPassword("");
        } else {
            setUsername("");
            setEmail("");
            setRole("user");
            setPassword("password");
        }
    }, [mode, initialUser, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ username, email, role, password });
        onClose();
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(6px)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
            onClick={onClose}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "460px",
                    padding: "24px",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {mode === "create" ? "Tambah Akun Pengguna" : `Edit Pengguna (${initialUser?.username})`}
                    </h3>
                    <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Username</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Role Hak Akses</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as "admin" | "user")}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 600 }}
                        >
                            <option value="user">User (Operator Farm)</option>
                            <option value="admin">Admin (Full Control)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                            {mode === "create" ? "Password" : "Password Baru (Opsional)"}
                        </label>
                        <input
                            type="password"
                            required={mode === "create"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={mode === "edit" ? "Kosongkan jika tidak diubah" : "password"}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                        />
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#0ea5e9", color: "#ffffff", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        {mode === "create" ? <UserPlus size={16} /> : <Save size={16} />}
                        <span>{mode === "create" ? "Simpan Akun" : "Perbarui Akun"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
