"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const clearState = () => {
    setError("");
    setSuccessMsg("");
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch("http://localhost:8000/token", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Username already taken");

      setSuccessMsg("Account created! Please log in.");
      setTimeout(() => setView("login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      // Always show success to prevent user enumeration
      setSuccessMsg("If an account exists, a reset token has been sent to the server console.");
      setTimeout(() => setView("reset"), 3000);
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, new_password: newPassword }),
      });

      if (!res.ok) throw new Error("Invalid or expired token");

      setSuccessMsg("Password reset successful! Redirecting to login...");
      setTimeout(() => setView("login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900 font-sans">

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/30 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px] animate-bounce duration-[10s]"></div>
      </div>

      {/* GLASS CARD */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transform transition-all duration-500 hover:scale-[1.01]">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 tracking-tight mb-2">
            GHIBLI STUDIO
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            {view === "login" && "Welcome back, Dreamer."}
            {view === "register" && "Start your creative journey."}
            {view === "forgot" && "Recover your access."}
            {view === "reset" && "Set a new password."}
          </p>
        </div>

        {/* FORMS */}
        <div className="space-y-6">

          {/* LOGIN FORM */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <InputGroup type="text" placeholder="Username" value={username} onChange={setUsername} />
              <InputGroup type="password" placeholder="Password" value={password} onChange={setPassword} />

              <div className="flex justify-end">
                <button type="button" onClick={() => { clearState(); setView("forgot"); }} className="text-xs text-gray-400 hover:text-orange-400 transition-colors">
                  Forgot Password?
                </button>
              </div>

              <SubmitButton loading={loading} label="Log In" />
            </form>
          )}

          {/* REGISTER FORM */}
          {view === "register" && (
            <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <InputGroup type="text" placeholder="Choose Username" value={username} onChange={setUsername} />
              <InputGroup type="password" placeholder="Choose Password" value={password} onChange={setPassword} />
              <SubmitButton loading={loading} label="Create Account" />
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {view === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-xs text-gray-400 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                Enter your username. We'll simulate sending a reset token to the server console.
              </div>
              <InputGroup type="text" placeholder="Username" value={username} onChange={setUsername} />
              <SubmitButton loading={loading} label="Send Reset Link" />
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {view === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <InputGroup type="text" placeholder="Paste Token Here" value={resetToken} onChange={setResetToken} />
              <InputGroup type="password" placeholder="New Password" value={newPassword} onChange={setNewPassword} />
              <SubmitButton loading={loading} label="Update Password" />
            </form>
          )}

          {/* FEEDBACK MESSAGES */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium animate-pulse">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs text-center font-medium">
              {successMsg}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          {view === "login" && (
            <p className="text-gray-500 text-xs">
              New here? <button onClick={() => { clearState(); setView("register"); }} className="text-orange-400 hover:text-orange-300 font-bold ml-1 transition-colors">Create Account</button>
            </p>
          )}
          {view === "register" && (
            <p className="text-gray-500 text-xs">
              Already have an account? <button onClick={() => { clearState(); setView("login"); }} className="text-orange-400 hover:text-orange-300 font-bold ml-1 transition-colors">Log In</button>
            </p>
          )}
          {(view === "forgot" || view === "reset") && (
            <button onClick={() => { clearState(); setView("login"); }} className="text-gray-500 hover:text-white text-xs transition-colors flex items-center justify-center w-full gap-1">
              <span>←</span> Back to Login
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// --- COMPONENTS ---

function InputGroup({ type, placeholder, value, onChange }: { type: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="relative group">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-900/50 border border-gray-700 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder-gray-600 group-hover:border-gray-600"
        required
      />
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean, label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-900/20 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      ) : (
        label
      )}
    </button>
  );
}