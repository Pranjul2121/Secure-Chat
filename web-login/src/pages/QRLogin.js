// web-login/src/pages/QRLogin.js — PREMIUM UI matching web-login aesthetic
// LOGIC STRUCTURE SAME — UI fully upgraded with Glassmorphism, Orbs & Neon Accents

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// ── Shared UI Constants (Matches Theme) ────────────────
const C_THEME = {
  primary: "#06b6d4",     // Cyan
  secondary: "#3b82f6",   // Blue
  bg: "rgba(0, 0, 0, 0.8)",
  card: "rgba(30, 30, 50, 0.75)",
  card2: "rgba(255, 255, 255, 0.05)",
  border: "rgba(255, 255, 255, 0.1)",
  text: "#e9edef",
  muted: "rgba(255, 255, 255, 0.5)",
  red: "#ef4444",
  success: "#22c55e",
  amber: "#f59e0b",
};

// ── CSS Animations ───────────────────────────────────────
const CSS = `
@keyframes fadeUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
@keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.2) } 50% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.5) } }
@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.6 } }
@keyframes shimmer { 0% { left: -100% } 100% { left: 200% } }
@keyframes slideIn { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
@keyframes timerDrain { from { stroke-dashoffset: 0 } }
@keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes float1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
@keyframes float2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-40px, 30px) scale(1.15); } 66% { transform: translate(25px, -40px) scale(0.85); } }
@keyframes float3 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(20px, 40px) scale(0.9); } 66% { transform: translate(-30px, -30px) scale(1.1); } }
`;

const injectCSS = () => {
  if (document.getElementById("qr-css")) return;
  const el = document.createElement("style");
  el.id = "qr-css"; el.textContent = CSS;
  document.head.appendChild(el);
};

const QR_EXPIRE = 120;

export default function QRLogin({ onLogin, onBack }) {
  const [phase, setPhase] = useState("idle");
  const [qrToken, setQrToken] = useState("");
  const [qrDataURL, setQrDataURL] = useState("");
  const [timeLeft, setTimeLeft] = useState(QR_EXPIRE);
  const [status, setStatus] = useState({ msg: "", type: "" });
  
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    injectCSS();
    return () => { clearInterval(pollRef.current); clearInterval(timerRef.current); };
  }, []);

  const generateQR = async () => {
    setPhase("waiting"); setStatus({ msg: "QR generate ho raha hai...", type: "info" });
    try {
      const res = await axios.post(`${BASE}/qr/generate`);
      const token = res.data.qr_token;
      if (!token) throw new Error("Token missing");
      setQrToken(token); setTimeLeft(QR_EXPIRE);
      setQrDataURL(`https://quickchart.io/qr?text=${encodeURIComponent("securechat-qr:" + token)}&size=200&margin=1`);
      setStatus({ msg: "📱 Chat app se scan karo", type: "info" });
      
      timerRef.current = setInterval(() => {
        setTimeLeft(p => {
          if (p <= 1) { 
            clearInterval(timerRef.current); clearInterval(pollRef.current);
            setPhase("expired"); setQrDataURL(""); setStatus({ msg: "QR expire ho gaya!", type: "error" }); return 0; 
          }
          return p - 1;
        });
      }, 1000);
      pollRef.current = setInterval(() => pollStatus(token), 1500);
    } catch (err) {
      setStatus({ msg: "QR generate fail ho gaya!", type: "error" }); setPhase("idle");
    }
  };

  const pollStatus = useCallback(async (token) => {
    try {
      const res = await axios.get(`${BASE}/qr/status/${token}`);
      const { status: s, access_token, username } = res.data;
      if (s === "scanned") { setPhase("scanned"); setStatus({ msg: "📱 Scan ho gaya! App mein confirm karo", type: "success" }); }
      if (s === "confirmed") {
        clearInterval(pollRef.current); clearInterval(timerRef.current);
        setPhase("confirmed"); setStatus({ msg: `✅ Welcome ${username}!`, type: "success" });
        setTimeout(() => onLogin({ username, token: access_token }), 1000);
      }
      if (s === "expired") {
        clearInterval(pollRef.current); clearInterval(timerRef.current);
        setPhase("expired"); setStatus({ msg: "QR expire ho gaya!", type: "error" });
      }
    } catch { }
  }, [onLogin]);

  const cancel = () => { clearInterval(pollRef.current); clearInterval(timerRef.current); setPhase("idle"); setQrDataURL(""); setStatus({ msg: "", type: "" }); };

  // Timer Math
  const CIRC = 163.4; // 2 * PI * 26
  const timerColor = timeLeft < 20 ? C_THEME.red : timeLeft < 40 ? C_THEME.amber : C_THEME.primary;
  const strokeDash = CIRC * (1 - timeLeft / QR_EXPIRE);

  // Helper arrays & styles
  const orb = (color, size, top, left, animName, duration) => ({
    position: "absolute", width: size, height: size, background: color,
    borderRadius: "50%", filter: "blur(100px)", opacity: 0.4, top, left,
    animation: `${animName} ${duration}s ease-in-out infinite`, pointerEvents: "none", zIndex: 0,
  });

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #1a1a2e, #16213e, #0f3460)",
        backgroundSize: "400% 400%", animation: "gradientShift 15s ease infinite",
        fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "20px", position: "relative", overflow: "hidden"
      }}>
        
        {/* Dynamic Background Orbs */}
        <div style={orb("radial-gradient(circle, #8b5cf6, transparent)", "500px", "5%", "0%", "float1", 20)} />
        <div style={orb("radial-gradient(circle, #ec4899, transparent)", "400px", "60%", "60%", "float2", 25)} />
        <div style={orb("radial-gradient(circle, #06b6d4, transparent)", "350px", "80%", "20%", "float3", 22)} />

        {/* Left Corner Floating Back Button */}
        <button 
          onClick={onBack} 
          style={{
            position: "absolute", top: "24px", left: "24px",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#e9edef", padding: "12px 18px", borderRadius: "14px",
            display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
            backdropFilter: "blur(10px)", transition: "all 0.3s ease", zIndex: 100,
            fontSize: "14px", fontWeight: "600", fontFamily: "inherit"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform="translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform="translateY(0)"; }}
        >
          <span>←</span> Landing Page
        </button>

        {/* Main Card */}
        <div style={{
          background: C_THEME.card, backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
          border: `1px solid ${C_THEME.border}`, borderRadius: "24px",
          padding: "40px 36px", width: "400px", textAlign: "center",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 0 20px rgba(255, 255, 255, 0.05)",
          animation: "fadeUp .6s cubic-bezier(.16,1,.3,1), glow 5s ease-in-out infinite",
          position: "relative", overflow: "hidden", zIndex: 10
        }}>
          
          {/* Shimmer Effect */}
          <div style={{
            position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
            background: "linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent)",
            animation: "shimmer 5s ease-in-out infinite", pointerEvents: "none"
          }} />

          {/* Icon Header */}
          <div style={{
            width: "64px", height: "64px", borderRadius: "18px",
            background: `linear-gradient(135deg, ${C_THEME.primary}, ${C_THEME.secondary})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", margin: "0 auto 20px",
            boxShadow: `0 8px 24px rgba(6, 182, 212, 0.4)`, animation: "pulse 3s infinite"
          }}>📲</div>

          <h2 style={{
            margin: "0 0 6px", fontSize: "24px", fontWeight: "800",
            background: `linear-gradient(135deg, #e9edef, #67e8f9)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
          }}>QR Code Login</h2>
          
          <p style={{ color: C_THEME.muted, fontSize: "14px", margin: "0 0 28px", lineHeight: "1.6" }}>
            Chat app se QR scan karo — auto login ho jaoge
          </p>

          {/* Status Alert */}
          {status.msg && (
            <div style={{
              padding: "12px 16px", borderRadius: "12px", marginBottom: "20px",
              fontSize: "13px", animation: "slideIn .3s ease forwards",
              background: status.type === "success" ? "rgba(34, 197, 94, 0.1)" : status.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(6, 182, 212, 0.1)",
              border: `1px solid ${status.type === "success" ? "rgba(34, 197, 94, 0.3)" : status.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(6, 182, 212, 0.3)"}`,
              color: status.type === "success" ? "#86efac" : status.type === "error" ? "#fca5a5" : "#67e8f9",
            }}>{status.msg}</div>
          )}

          {/* ── IDLE PHASE ── */}
          {phase === "idle" && (
            <div style={{ animation: "slideIn 0.4s ease forwards" }}>
              <div style={{
                background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: "16px", padding: "16px", marginBottom: "24px",
                display: "flex", flexDirection: "column", gap: "12px", textAlign: "left",
              }}>
                {[
                  { n: "1", t: "Yahan 'QR Generate Karo' click karo" },
                  { n: "2", t: "Chat App mein '📷 Scan QR' click karo" },
                  { n: "3", t: "QR scan karo aur confirm karo" },
                  { n: "4", t: "Web page pe auto login ho jaoge!" },
                ].map(({ n, t }) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "8px", flexShrink: 0,
                      background: `rgba(6, 182, 212, 0.15)`, border: `1px solid rgba(6, 182, 212, 0.4)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: "700", color: "#67e8f9",
                    }}>{n}</div>
                    <span style={{ color: C_THEME.muted, fontSize: "13px" }}>{t}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={generateQR}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(6, 182, 212, 0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(6, 182, 212, 0.3)"; }}
                style={{
                  width: "100%", padding: "16px", marginBottom: "12px",
                  background: `linear-gradient(135deg, ${C_THEME.primary}, ${C_THEME.secondary})`,
                  color: "#fff", border: "none", borderRadius: "14px",
                  fontSize: "15px", fontWeight: "700", cursor: "pointer",
                  boxShadow: `0 8px 24px rgba(6, 182, 212, 0.3)`, transition: "all .3s ease", fontFamily: "inherit",
              }}>📲 QR Generate Karo</button>
              
              <button 
                onClick={onBack}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                style={{
                  width: "100%", padding: "14px", background: "transparent",
                  color: C_THEME.muted, border: `1px solid ${C_THEME.border}`, borderRadius: "14px",
                  fontSize: "14px", cursor: "pointer", fontFamily: "inherit", transition: "all .3s ease",
              }}>← Wapas Jao</button>
            </div>
          )}

          {/* ── WAITING / SCANNED PHASE ── */}
          {(phase === "waiting" || phase === "scanned") && (
            <div style={{ animation: "slideIn 0.4s cubic-bezier(.16,1,.3,1) forwards" }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                {/* SVG Ring Timer */}
                <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
                  <svg width="72" height="72" style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 8px ${timerColor}66)` }}>
                    <circle cx="36" cy="36" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                    <circle cx="36" cy="36" r="26" fill="none" stroke={timerColor}
                      strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={CIRC} strokeDashoffset={strokeDash}
                      style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }} />
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", fontWeight: "700", color: timerColor,
                  }}>{timeLeft}</div>
                </div>

                {/* Secure QR Code Wrapper */}
                <div style={{
                  flex: 1, background: "#fff", borderRadius: "16px", padding: "12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 25px rgba(6, 182, 212, 0.3), inset 0 0 10px rgba(0,0,0,0.1)`,
                  border: `2px solid rgba(6, 182, 212, 0.5)`, position: "relative", minHeight: "150px"
                }}>
                  {qrDataURL
                    ? <img src={qrDataURL} alt="QR Code" style={{ width: "100%", maxWidth: "160px", display: "block", borderRadius: "4px" }} />
                    : <div style={{ color: "#333", fontSize: "13px", fontWeight: "600", animation: "pulse 1.5s infinite" }}>Loading QR...</div>}
                </div>
              </div>

              {phase === "scanned" && (
                <div style={{
                  background: "rgba(34, 197, 94, 0.1)", border: `1px solid rgba(34, 197, 94, 0.3)`,
                  borderRadius: "12px", padding: "14px", marginBottom: "16px",
                  color: "#86efac", fontSize: "14px", fontWeight: "600",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}>
                  📱 QR scan ho gaya! Chat app mein confirm karo...
                </div>
              )}

              <button 
                onClick={cancel}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)"; e.currentTarget.style.color = "#fca5a5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C_THEME.border; e.currentTarget.style.color = C_THEME.muted; }}
                style={{
                  width: "100%", padding: "14px", background: "transparent",
                  color: C_THEME.muted, border: `1px solid ${C_THEME.border}`, borderRadius: "14px",
                  fontSize: "14px", cursor: "pointer", marginBottom: "10px", transition: "all .3s ease", fontFamily: "inherit"
              }}>✗ Cancel Scan</button>

              <button 
                onClick={() => { cancel(); onBack(); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                style={{
                  width: "100%", padding: "14px", background: "transparent",
                  color: C_THEME.muted, border: `1px solid ${C_THEME.border}`, borderRadius: "14px",
                  fontSize: "14px", cursor: "pointer", transition: "all .3s ease", fontFamily: "inherit"
              }}>← Wapas Jao</button>
            </div>
          )}

          {/* ── EXPIRED PHASE ── */}
          {phase === "expired" && (
            <div style={{ animation: "slideIn 0.4s ease forwards" }}>
              <div style={{ fontSize: "56px", margin: "10px 0 16px" }}>⏰</div>
              <p style={{ color: C_THEME.muted, fontSize: "14px", marginBottom: "20px" }}>QR code ka samay samapt ho gaya.</p>
              <button 
                onClick={() => { setPhase("idle"); setStatus({ msg: "", type: "" }); }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(6, 182, 212, 0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(6, 182, 212, 0.3)"; }}
                style={{
                  width: "100%", padding: "15px",
                  background: `linear-gradient(135deg, ${C_THEME.primary}, ${C_THEME.secondary})`,
                  color: "#fff", border: "none", borderRadius: "14px",
                  fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "all .3s ease",
                  boxShadow: `0 8px 24px rgba(6, 182, 212, 0.3)`, fontFamily: "inherit"
              }}>🔄 Naya QR Generate Karo</button>
            </div>
          )}

          {/* ── CONFIRMED PHASE ── */}
          {phase === "confirmed" && (
            <div style={{ padding: "24px 0", animation: "slideIn 0.4s ease forwards" }}>
              <div style={{ fontSize: "72px", marginBottom: "16px", animation: "pulse 2s infinite" }}>✅</div>
              <p style={{ color: "#86efac", fontWeight: "800", fontSize: "20px", marginBottom: "6px", textShadow: "0 0 10px rgba(34, 197, 94, 0.5)" }}>Login Confirm!</p>
              <p style={{ color: C_THEME.muted, fontSize: "14px" }}>Chat app load ho raha hai...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
