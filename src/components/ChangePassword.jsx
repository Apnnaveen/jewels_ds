import React, { useState, useEffect } from "react";
import { change_password, check_token_status } from "../api";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

export default function ChangePassword() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [captchaValue, setCaptchaValue] = useState(null);
    const onChange = (value) => {
        setCaptchaValue(value);
    };
    // Token verification (link expired)
    useEffect(() => {
        async function verifyToken() {
            try {
                const res = await check_token_status(token);
                if (res.status_code !== 200) {
                    setError(res.error || "Password reset already done for this account.");
                }
            } catch (err) {
                setError(err.error || "Password reset already done for this account.");
            } finally {
                setChecking(false);
            }
        }
        if (token) verifyToken();
    }, [token]);

    // Show alert only if token expired
    useEffect(() => {
        if (error) {
            alert(error);
            navigate("/");
        }
    }, [error, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!captchaValue) {
            setMessage('Please verify the captcha');
            return;
        }
        setMessage(""); // clear old message

        if (password !== confirm) {
            setMessage("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await change_password(token, password);
            if (res.status_code === 200) {
                setMessage("Password updated successfully. Redirecting to login...");
                setTimeout(() => navigate("/"), 2000);
            } else {
                // Show backend error under confirm password
                setMessage(res.error || res.message || "Failed to reset password.");
            }
        } catch (err) {
            setMessage(err.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return <div className="text-center mt-20">Checking link...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Reset Password</h2>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New password"
                        required
                        className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Confirm password"
                        required
                        className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <div className="flex justify-center">
                        <ReCAPTCHA
                            sitekey="6LekW28rAAAAAEPx5QXzSP8HDYv_eRDik9o2zQId " // Replace with your actual site key
                            onChange={onChange}
                        />
                    </div>
                    {/* Error message below confirm password */}
                    {message && (
                        <div
                            className={`mt-4 p-3 rounded-lg ${message.includes("successfully")
                                    ? "bg-green-50"
                                    : "bg-red-50"
                                }`}
                        >
                            <p
                                className={`text-sm text-center ${message.includes("successfully")
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                            >
                                {message}
                            </p>
                        </div>
                    )}

                    
                    <button
                        type="submit"
                        disabled={loading}
                        className={`py-3 rounded-lg text-white font-semibold ${loading ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
