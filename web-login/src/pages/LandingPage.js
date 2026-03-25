// web-login/src/pages/LandingPage.js
// Web login ka main page — Face Login ya QR Login choose karo

import React from "react";

const s = {
  wrap: {
    display: "flex", justifyContent: "center", alignItems: "center",
    height: "100vh", backgroundColor: "#111b21",
    fontFamily: "Segoe UI, sans-serif",
  },
  card: {
    backgroundColor: "#202c33", borderRadius: "16px", padding: "48px 40px",
    width: "400px", textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  logo: { fontSize: "48px", marginBottom: "16px" },
  title: { color: "#00a884", fontSize: "28px", fontWeight: "bold", marginBottom: "6px" },
  sub:   { color: "#8696a0", fontSize: "14px", marginBottom: "36px", lineHeight: "1.6" },
  divider: {
    display: "flex", alignItems: "center", gap: "12px",
    margin: "0 0 24px",
  },
  divLine: { flex: 1, height: "1px", backgroundColor: "#2a3942" },
  divText: { color: "#8696a0", fontSize: "12px" },
  btnFace: {
    width: "100%", padding: "16px", marginBottom: "14px",
    backgroundColor: "#1a3a30", color: "#00a884",
    border: "2px solid #00a884", borderRadius: "12px",
    fontSize: "16px", fontWeight: "bold", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
    transition: "background 0.2s",
  },
  btnQR: {
    width: "100%", padding: "16px", marginBottom: "14px",
    backgroundColor: "#1a2a3a", color: "#7eb8f5",
    border: "2px solid #2a5080", borderRadius: "12px",
    fontSize: "16px", fontWeight: "bold", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
  },
  infoBox: {
    backgroundColor: "#1a2530", border: "1px solid #2a3942",
    borderRadius: "10px", padding: "14px 16px",
    color: "#8696a0", fontSize: "12px", lineHeight: "1.7",
    marginTop: "8px", textAlign: "left",
  },
  backLink: {
    marginTop: "20px", color: "#8696a0", fontSize: "12px",
    cursor: "pointer",
  },
  backSpan: { color: "#00a884", textDecoration: "underline" },
};

export default function LandingPage({ onFaceLogin, onQRLogin }) {
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>🔐</div>
        <div style={s.title}>SecureChat</div>
        <div style={s.sub}>Web Login Portal — Bina password ke login karo</div>

        <button style={s.btnFace} onClick={onFaceLogin}>
          🪪 Face se Login Karo
        </button>
        <button style={s.btnQR} onClick={onQRLogin}>
          📲 QR Code se Login Karo
        </button>

        <div style={s.infoBox}>
          <strong style={{ color: "#e9edef" }}>Face Login:</strong> Liveness check → Face scan → Face password → Chat access<br />
          <strong style={{ color: "#e9edef" }}>QR Login:</strong> QR scan karo chat app se → Auto login ho jaoge
        </div>

        <div style={s.backLink}>
          Normal login ke liye{" "}
          <span style={s.backSpan} onClick={() => window.open("http://localhost:3000", "_blank")}>
            Chat App kholo →
          </span>
        </div>
      </div>
    </div>
  );
}