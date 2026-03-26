// chat-app/src/pages/Auth.js
// Sirf username + password login/signup
// Face Login web-login app (port 3001) pe hai

import React, { useState } from "react";
import axios from "axios";

const s = {
  wrap: {
    display: "flex", justifyContent: "center", alignItems: "center",
    height: "100vh", backgroundColor: "#111b21",
  },
  box: {
    backgroundColor: "#202c33", padding: "40px", borderRadius: "14px",
    width: "360px", boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
  },
  title: {
    color: "#00a884", textAlign: "center", fontSize: "26px",
    fontWeight: "bold", marginBottom: "6px",
  },
  sub: {
    color: "#8696a0", textAlign: "center", fontSize: "13px",
    marginBottom: "28px",
  },
  badge: {
    backgroundColor: "#1a2530", border: "1px solid #2a3942",
    borderRadius: "8px", padding: "8px 12px", marginBottom: "20px",
    color: "#8696a0", fontSize: "12px", textAlign: "center", lineHeight: "1.6",
  },
  badgeLink: {
    color: "#00a884", fontWeight: "bold", cursor: "pointer",
    textDecoration: "underline",
  },
  input: {
    width: "100%", padding: "12px", marginBottom: "12px",
    borderRadius: "8px", border: "1px solid #2a3942",
    backgroundColor: "#2a3942", color: "#e9edef",
    fontSize: "14px", boxSizing: "border-box", outline: "none",
  },
  btnGreen: {
    width: "100%", padding: "12px", backgroundColor: "#00a884",
    color: "#fff", border: "none", borderRadius: "8px",
    fontSize: "15px", fontWeight: "bold", cursor: "pointer", marginBottom: "12px",
  },
  error:   { color: "#f15c6d", fontSize: "13px", textAlign: "center", marginBottom: "10px" },
  success: { color: "#00a884", fontSize: "13px", textAlign: "center", marginBottom: "10px" },
  toggle: {
    color: "#8696a0", textAlign: "center", fontSize: "13px",
    marginTop: "8px", cursor: "pointer",
  },
  toggleSpan: { color: "#00a884", fontWeight: "bold" },
};

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg]     = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
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
        setUsername(""); setPassword("");
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || "Kuch gadbad!", type: "error" });
    }
    setLoading(false);
  };

  return (
    <div style={s.wrap}>
      <div style={s.box}>
        <div style={s.title}>💬 SecureChat</div>
        <div style={s.sub}>{isLogin ? "Chat App — Login" : "Naya account banao"}</div>

        {/* Info badge pointing to web login */}
        {isLogin && (
          <div style={s.badge}>
            Face ya QR se login karna hai?{" "}
            <span
              style={s.badgeLink}
              onClick={() => window.open("http://localhost:3001", "_blank")}
            >
              Web Login Page kholo →
            </span>
          </div>
        )}

        {msg.text && (
          <div style={msg.type === "error" ? s.error : s.success}>{msg.text}</div>
        )}

        <input style={s.input} placeholder="Username" value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        <input style={s.input} placeholder="Password" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />

        <button style={s.btnGreen} onClick={handleSubmit} disabled={loading}>
          {loading ? "Wait..." : isLogin ? "Login" : "Signup"}
        </button>

        <div style={s.toggle} onClick={() => { setIsLogin(!isLogin); setMsg({ text: "", type: "" }); }}>
          {isLogin
            ? <>Account nahi hai? <span style={s.toggleSpan}>Signup karo</span></>
            : <>Account hai? <span style={s.toggleSpan}>Login karo</span></>
          }
        </div>
      </div>
    </div>
  );
}