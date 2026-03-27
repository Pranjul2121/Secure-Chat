// chat-app/src/pages/Auth.js
// Sirf username + password login/signup
// Face Login web-login app (port 3001) pe hai

import React, { useState } from "react";
import axios from "axios";

// Keyframes as string for injection
const keyframes = `
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-40px, 30px) scale(1.15); }
  66% { transform: translate(25px, -40px) scale(0.85); }
}
@keyframes float3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, 40px) scale(0.9); }
  66% { transform: translate(-30px, -30px) scale(1.1); }
}
@keyframes float4 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-25px, -35px) scale(1.05); }
  66% { transform: translate(35px, 25px) scale(0.95); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}
@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
@keyframes borderGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(236, 72, 153, 0.3); }
}
@keyframes messageSlide {
  from { opacity: 0; transform: translateY(-10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

const s = {
  wrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #1a1a2e, #16213e, #0f3460)",
    backgroundSize: "400% 400%",
    animation: "gradientShift 15s ease infinite",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  orb: (color, size, top, left, animName, duration) => ({
    position: "absolute",
    width: size,
    height: size,
    background: color,
    borderRadius: "50%",
    filter: "blur(80px)",
    opacity: 0.6,
    top: top,
    left: left,
    animation: `${animName} ${duration}s ease-in-out infinite`,
    pointerEvents: "none",
  }),
  box: {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    padding: "45px 40px",
    borderRadius: "24px",
    width: "400px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
    animation: "slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, borderGlow 4s ease-in-out infinite",
    position: "relative",
    zIndex: 10,
    overflow: "hidden",
  },
  boxShimmer: {
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
    pointerEvents: "none",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "8px",
  },
  logoWrapper: {
    position: "relative",
    width: "70px",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoRing: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b, #8b5cf6)",
    animation: "spin 4s linear infinite",
    padding: "3px",
  },
  logoInner: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1a1a2e, #16213e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoIcon: {
    fontSize: "32px",
    animation: "pulse 2s ease-in-out infinite",
  },
  title: {
    background: "linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textAlign: "center",
    fontSize: "32px",
    fontWeight: "800",
    marginBottom: "6px",
    letterSpacing: "-0.5px",
  },
  sub: {
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    fontSize: "14px",
    marginBottom: "30px",
    fontWeight: "400",
  },
  badge: {
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "24px",
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "13px",
    textAlign: "center",
    lineHeight: "1.6",
    animation: "slideInLeft 0.6s ease forwards",
    animationDelay: "0.2s",
    opacity: 0,
  },
  badgeLink: {
    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  inputWrapper: {
    position: "relative",
    marginBottom: "16px",
  },
  input: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: "14px",
    border: "2px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    fontFamily: "inherit",
  },
  inputFocused: {
    border: "2px solid transparent",
    background: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0 0 0 2px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.2)",
  },
  btnGreen: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "16px",
    marginTop: "8px",
    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: "0 10px 40px -10px rgba(139, 92, 246, 0.5)",
    position: "relative",
    overflow: "hidden",
    fontFamily: "inherit",
    letterSpacing: "0.5px",
  },
  btnGreenHover: {
    transform: "translateY(-3px) scale(1.02)",
    boxShadow: "0 20px 50px -10px rgba(139, 92, 246, 0.6)",
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
    transform: "none",
  },
  error: {
    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    fontSize: "13px",
    textAlign: "center",
    marginBottom: "16px",
    padding: "12px 16px",
    borderRadius: "12px",
    animation: "messageSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
  },
  success: {
    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    color: "#86efac",
    fontSize: "13px",
    textAlign: "center",
    marginBottom: "16px",
    padding: "12px 16px",
    borderRadius: "12px",
    animation: "messageSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
  },
  toggle: {
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    fontSize: "14px",
    marginTop: "8px",
    cursor: "pointer",
    transition: "color 0.3s ease",
  },
  toggleSpan: {
    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontWeight: "700",
    marginLeft: "4px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "20px 0",
    gap: "12px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: "12px",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
};

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [btnHover, setBtnHover] = useState(false);
  const BASE = "http://127.0.0.1:8000";

  const handleSubmit = async () => {
    if (!username || !password) {
      setMsg({ text: "Dono fields bharo!", type: "error" });
      return;
    }
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      if (isLogin) {
        const res = await axios.post(`${BASE}/login`, { username, password });
        onLogin({ username: res.data.username, token: res.data.access_token });
      } else {
        await axios.post(`${BASE}/signup`, { username, password });
        setMsg({ text: "Account ban gaya! Login karo.", type: "success" });
        setIsLogin(true);
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || "Kuch gadbad!", type: "error" });
    }
    setLoading(false);
  };

  return (
    <>
      <style>{keyframes}</style>
      <div style={s.wrap}>
        {/* Floating Orbs */}
        <div style={s.orb("radial-gradient(circle, #8b5cf6, transparent)", "400px", "10%", "5%", "float1", 20)} />
        <div style={s.orb("radial-gradient(circle, #ec4899, transparent)", "350px", "60%", "70%", "float2", 25)} />
        <div style={s.orb("radial-gradient(circle, #f59e0b, transparent)", "300px", "70%", "10%", "float3", 22)} />
        <div style={s.orb("radial-gradient(circle, #06b6d4, transparent)", "280px", "5%", "75%", "float4", 28)} />

        <div style={s.box}>
          {/* Logo */}
          <div style={s.logoContainer}>
            <div style={s.logoWrapper}>
              <div style={s.logoRing}>
                <div style={s.logoInner}>
                  <span style={s.logoIcon}>💬</span>
                </div>
              </div>
            </div>
          </div>

          <div style={s.title}>SecureChat</div>
          <div style={s.sub}>{isLogin ? "Welcome back! Login to continue" : "Create your new account"}</div>

          {/* Info badge pointing to web login */}
          {isLogin && (
            <div style={s.badge}>
              Face ya QR se login karna hai?{" "}
              <span
                style={s.badgeLink}
                onClick={() => window.open("http://localhost:3001", "_blank")}
                onMouseEnter={(e) => (e.target.style.filter = "brightness(1.2)")}
                onMouseLeave={(e) => (e.target.style.filter = "brightness(1)")}
              >
                Web Login Page kholo →
              </span>
            </div>
          )}

          {msg.text && (
            <div style={msg.type === "error" ? s.error : s.success}>{msg.text}</div>
          )}

          <div
            style={{
              ...s.inputWrapper,
              animation: "slideInLeft 0.5s ease forwards",
              animationDelay: "0.3s",
              opacity: 0,
            }}
          >
            <input
              style={{
                ...s.input,
                ...(focusedInput === "username" ? s.inputFocused : {}),
              }}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              onFocus={() => setFocusedInput("username")}
              onBlur={() => setFocusedInput(null)}
            />
          </div>

          <div
            style={{
              ...s.inputWrapper,
              animation: "slideInLeft 0.5s ease forwards",
              animationDelay: "0.4s",
              opacity: 0,
            }}
          >
            <input
              style={{
                ...s.input,
                ...(focusedInput === "password" ? s.inputFocused : {}),
              }}
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
            />
          </div>

          <button
            style={{
              ...s.btnGreen,
              ...(btnHover && !loading ? s.btnGreenHover : {}),
              ...(loading ? s.btnDisabled : {}),
              animation: "slideInLeft 0.5s ease forwards",
              animationDelay: "0.5s",
              opacity: 0,
            }}
            onClick={handleSubmit}
            disabled={loading}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            {loading ? "Wait..." : isLogin ? "Login" : "Signup"}
          </button>

          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or</span>
            <div style={s.dividerLine} />
          </div>

          <div
            style={s.toggle}
            onClick={() => {
              setIsLogin(!isLogin);
              setMsg({ text: "", type: "" });
            }}
            onMouseEnter={(e) => (e.target.style.color = "rgba(255, 255, 255, 0.9)")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(255, 255, 255, 0.6)")}
          >
            {isLogin ? (
              <>
                Account nahi hai?<span style={s.toggleSpan}>Signup karo</span>
              </>
            ) : (
              <>
                Account hai?<span style={s.toggleSpan}>Login karo</span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}