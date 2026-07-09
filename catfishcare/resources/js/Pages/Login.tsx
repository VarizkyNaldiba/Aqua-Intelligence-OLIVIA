import { useState } from "react";
import { Fish, Info, Eye, EyeOff } from "lucide-react";
import { Link, Head } from "@inertiajs/react";
import type { AppUser } from "@/Types";

interface AuthProps {
    onLoginSuccess?: (user: AppUser) => void;
}

const Auth = ({ onLoginSuccess }: AuthProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ message: "", type: "" });

    const showAlert = (message: string, type = "error") => {
        setAlert({ message, type });
        setTimeout(() => setAlert({ message: "", type: "" }), 4000);
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            showAlert("Please enter your email and password.", "error");
            return;
        }

        setIsLoading(true);
        setAlert({ message: "", type: "" });

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg =
                    data.message ||
                    data.error ||
                    "Invalid email/username or password.";
                showAlert(errorMsg, "error");
                return;
            }

            // Store the Sanctum token for subsequent API requests
            localStorage.setItem("aqua_token", data.token);

            showAlert("Login successful! Redirecting...", "success");

            const user: AppUser = {
                username: data.user.username,
                name: data.user.username,
                id: data.user.id,
            };

            localStorage.setItem("aqua_current_user", JSON.stringify(user));

            setTimeout(() => {
                if (onLoginSuccess) {
                    onLoginSuccess(user);
                } else {
                    window.location.href = "/dashboard";
                }
            }, 800);
        } catch {
            showAlert(
                "Failed to connect to server. Please verify the Laravel server is running.",
                "error",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLoginPlaceholder = () => {
        showAlert("Google Sign-In is currently in demo mode. Please use your email and password.", "error");
    };

    const handleRequestAccessPlaceholder = (e: React.MouseEvent) => {
        e.preventDefault();
        showAlert("Registration is currently restricted. Please contact your system administrator to request access.", "success");
    };

    return (
        <div className="auth-page">
            <Head title="Log In" />

            {/* Back Button */}
            <Link href="/" className="auth-back-btn">
                ← Back
            </Link>

            {/* Login Card */}
            <div className="auth-card-new">
                {/* Logo circle */}
                <div className="auth-logo-circle">
                    <Fish size={24} color="#ffffff" style={{ transform: "rotate(-30deg)" }} />
                </div>

                <h2 className="auth-title-new">Welcome back</h2>
                <p className="auth-subtitle-new">Sign in to your CatfishCare account</p>

                {alert.message && (
                    <div className="auth-alert-new">
                        <Info size={16} style={{ flexShrink: 0 }} />
                        <span>{alert.message}</span>
                    </div>
                )}

                {/* Google Authentication Button */}
                <button type="button" className="auth-google-btn" onClick={handleGoogleLoginPlaceholder}>
                    <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: 2 }}>
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div className="auth-divider-new">
                    or sign in with email
                </div>

                {/* Form */}
                <form onSubmit={handleLoginSubmit}>
                    {/* Email Input */}
                    <div className="auth-form-group-new">
                        <div className="auth-label-bar">
                            <label htmlFor="login-email" className="auth-label-new">Email Address</label>
                        </div>
                        <div className="auth-input-container">
                            <input
                                type="text"
                                id="login-email"
                                className="auth-input-new"
                                placeholder="you@example.com"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="auth-form-group-new">
                        <div className="auth-label-bar">
                            <label htmlFor="login-pwd" className="auth-label-new">Password</label>
                            <a href="#forgot" className="auth-link-cyan" onClick={(e) => { e.preventDefault(); showAlert("Password reset instructions have been simulated to your email.", "success"); }}>
                                Forgot Password?
                            </a>
                        </div>
                        <div className="auth-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="login-pwd"
                                className="auth-input-new"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                style={{ paddingRight: "46px" }}
                            />
                            <button
                                type="button"
                                className="auth-eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        className="auth-submit-btn-new"
                        disabled={isLoading}
                    >
                        <span>{isLoading ? "Signing In..." : "Sign In"}</span>
                    </button>
                </form>

                {/* Footer link */}
                <div className="auth-footer-text-new">
                    Don't have an account?{" "}
                    <a href="#request" className="auth-link-cyan" onClick={handleRequestAccessPlaceholder}>
                        Request access
                    </a>
                </div>
            </div>

            {/* Security Compliance Footer */}
            <div className="auth-security-footer">
                <span>🔒</span>
                <span>256-bit SSL encryption • SOC 2 compliant • Data hosted in Indonesia</span>
            </div>
        </div>
    );
};

export default Auth;
