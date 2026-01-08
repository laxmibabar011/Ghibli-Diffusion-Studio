"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
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
        body: JSON.stringify({
          username,
          password,
          first_name: firstName,
          last_name: lastName,
          email,
          dob
        }),
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black font-sans">

      {/* ANIMATED STARFIELD BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <StarField />
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* GLASS CARD */}
      <div className="relative z-10 w-full max-w-md p-8 bg-purple-950/10 backdrop-blur-2xl border border-purple-500/20 rounded-3xl shadow-2xl shadow-purple-900/30 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-purple-800/40">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 tracking-tight mb-3 drop-shadow-lg">
            GHIBLI STUDIO
          </h1>
          <p className="text-purple-300 text-sm font-medium">
            {view === "login" && "✨ Welcome back, Dreamer."}
            {view === "register" && "🎨 Start your creative journey."}
            {view === "forgot" && "🔐 Recover your access."}
            {view === "reset" && "🔑 Set a new password."}
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
                <button type="button" onClick={() => { clearState(); setView("forgot"); }} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot Password?
                </button>
              </div>

              <SubmitButton loading={loading} label="Log In" />
            </form>
          )}

          {view === "register" && (
            <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup type="text" placeholder="First Name" value={firstName} onChange={setFirstName} />
                <InputGroup type="text" placeholder="Last Name" value={lastName} onChange={setLastName} />
              </div>
              <InputGroup type="email" placeholder="Email Address" value={email} onChange={setEmail} />
              <InputGroup type="date" placeholder="Date of Birth" value={dob} onChange={setDob} />
              <InputGroup type="text" placeholder="Choose Username" value={username} onChange={setUsername} />
              <InputGroup type="password" placeholder="Choose Password" value={password} onChange={setPassword} />
              <SubmitButton loading={loading} label="Create Account" />
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {view === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in-slide-in-from-bottom-4 duration-500">
              <div className="text-xs text-purple-300 bg-purple-950/30 p-3 rounded-lg border border-purple-700/50">
                Enter your username. We'll simulate sending a reset token to the server console.
              </div>
              <InputGroup type="text" placeholder="Username" value={username} onChange={setUsername} />
              <SubmitButton loading={loading} label="Send Reset Link" />
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {view === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in-from-bottom-4 duration-500">
              <InputGroup type="text" placeholder="Paste Token Here" value={resetToken} onChange={setResetToken} />
              <InputGroup type="password" placeholder="New Password" value={newPassword} onChange={setNewPassword} />
              <SubmitButton loading={loading} label="Update Password" />
            </form>
          )}

          {/* FEEDBACK MESSAGES */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs text-center font-medium animate-pulse">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-xs text-center font-medium">
              {successMsg}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="mt-8 pt-6 border-t border-purple-800/30 text-center">
          {view === "login" && (
            <p className="text-purple-400 text-xs">
              New here? <button onClick={() => { clearState(); setView("register"); }} className="text-purple-300 hover:text-white font-bold ml-1 transition-colors">Create Account</button>
            </p>
          )}
          {view === "register" && (
            <p className="text-purple-400 text-xs">
              Already have an account? <button onClick={() => { clearState(); setView("login"); }} className="text-purple-300 hover:text-white font-bold ml-1 transition-colors">Log In</button>
            </p>
          )}
          {(view === "forgot" || view === "reset") && (
            <button onClick={() => { clearState(); setView("login"); }} className="text-purple-400 hover:text-white text-xs transition-colors flex items-center justify-center w-full gap-1">
              <span>←</span> Back to Login
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// --- ANIMATED STARFIELD COMPONENT ---
function StarField() {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; duration: number }>>([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// --- COMPONENTS ---

function InputGroup({ type, placeholder, value, onChange }: { type: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative group">
      <input
        type={isPassword && showPassword ? "text" : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-purple-700/50 text-white text-sm rounded-xl px-4 py-3 pr-10 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all placeholder-purple-400/50 group-hover:border-purple-600/70 backdrop-blur-sm"
        required
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean, label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:via-purple-400 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-900/50 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      ) : (
        label
      )}
    </button>
  );
}