// web-login/src/pages/LandingPage.js — PREMIUM UI matching Chat.js aesthetic
// Logic same — Face Login ya QR Login choose karo

import React, { useState } from "react";

const CSS = `
@keyframes fadeUp { 
  from { opacity: 0; transform: translateY(28px) } 
  to { opacity: 1; transform: translateY(0) } 
}
@keyframes iconFloat { 
  0%, 100% { transform: translateY(0) } 
  50% { transform: translateY(-12px) } 
}
@keyframes shimmer { 
  0% { left: -100% } 
  100% { left: 200% } 
}
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
`;

export default function LandingPage({ onFaceLogin, onQRLogin }) {
  const [hovFace, setHovFace] = useState(false);
  const [hovQR, setHovQR] = useState(false);

  // Floating Orbs Helper
  const orb = (color, size, top, left, animName, duration) => ({
    position: "absolute",
    width: size, height: size,
    background: color,
    borderRadius: "50%",
    filter: "blur(100px)",
    opacity: 0.4,
    top: top, left: left,
    animation: `${animName} ${duration}s ease-in-out infinite`,
    pointerEvents: "none", zIndex: 0,
  });

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #1a1a2e, #16213e, #0f3460)",
        backgroundSize: "400% 400%",
        animation: "gradientShift 15s ease infinite",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", padding: "20px",
        position: "relative", overflow: "hidden",
      }}>
        
        {/* Animated Background Orbs (Chat.js style) */}
        <div style={orb("radial-gradient(circle, #8b5cf6, transparent)", "500px", "-10%", "-5%", "float1", 20)} />
        <div style={orb("radial-gradient(circle, #ec4899, transparent)", "400px", "65%", "70%", "float2", 25)} />
        <div style={orb("radial-gradient(circle, #06b6d4, transparent)", "350px", "75%", "10%", "float3", 22)} />

        {/* Main Glassmorphism Card */}
        <div style={{
          background: "rgba(30, 30, 50, 0.75)",
          backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "24px",
          padding: "48px 40px", width: "400px", textAlign: "center",
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.05)",
          animation: "fadeUp 0.7s cubic-bezier(.16,1,.3,1) forwards",
          position: "relative", overflow: "hidden", zIndex: 10,
        }}>
          
          {/* Shimmer Effect */}
          <div style={{
            position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)",
            animation: "shimmer 5s ease-in-out infinite", pointerEvents: "none",
          }} />

          {/* Glowing Lock Icon */}
          <div style={{
            width: "72px", height: "72px", borderRadius: "20px",
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px", margin: "0 auto 24px",
            boxShadow: "0 12px 32px rgba(139, 92, 246, 0.4)",
            animation: "iconFloat 4s ease-in-out infinite",
            position: "relative", zIndex: 1
          }}>🔐</div>

          {/* Gradient Text Header */}
          <h1 style={{
            fontSize: "32px", fontWeight: "800", margin: "0 0 6px", letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #e9edef, #c4b5fd)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>SecureChat</h1>
          <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px", margin: "0 0 36px", lineHeight: "1.6" }}>
            Web Login Portal — Bina mobile ke secure access
          </p>

          {/* ================ Face Login Button ================ */}
          <button
            onMouseEnter={() => setHovFace(true)}
            onMouseLeave={() => setHovFace(false)}
            onClick={onFaceLogin}
            style={{
              width: "100%", padding: "18px", marginBottom: "14px",
              background: hovFace ? "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))" : "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))",
              color: "#c4b5fd",
              border: `2px solid ${hovFace ? "rgba(139, 92, 246, 0.5)" : "rgba(139, 92, 246, 0.2)"}`,
              borderRadius: "16px", fontSize: "16px", fontWeight: "700", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "14px",
              transition: "all 0.4s cubic-bezier(.16,1,.3,1)", fontFamily: "inherit",
              transform: hovFace ? "translateY(-4px)" : "none",
              boxShadow: hovFace ? "0 12px 30px rgba(139, 92, 246, 0.3)" : "none",
            }}
          >
            <span style={{ fontSize: "28px", filter: hovFace ? "drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))" : "none", transition: "all 0.3s" }}>🪪</span>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ color: "#e9edef" }}>Face se Login Karo</div>
              <div style={{ fontSize: "12px", fontWeight: "500", color: "#c4b5fd", marginTop: "2px" }}>
                Liveness → Face Scan → Password
              </div>
            </div>
            <div style={{ fontSize: "18px", opacity: hovFace ? 1 : 0.5, transform: hovFace ? "translateX(4px)" : "none", transition: "all 0.3s" }}>→</div>
          </button>

          {/* ================ QR Login Button ================ */}
          <button
            onMouseEnter={() => setHovQR(true)}
            onMouseLeave={() => setHovQR(false)}
            onClick={onQRLogin}
            style={{
              width: "100%", padding: "18px", marginBottom: "28px",
              background: hovQR ? "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))" : "linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1))",
              color: "#93c5fd",
              border: `2px solid ${hovQR ? "rgba(6, 182, 212, 0.5)" : "rgba(6, 182, 212, 0.2)"}`,
              borderRadius: "16px", fontSize: "16px", fontWeight: "700", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "14px",
              transition: "all 0.4s cubic-bezier(.16,1,.3,1)", fontFamily: "inherit",
              transform: hovQR ? "translateY(-4px)" : "none",
              boxShadow: hovQR ? "0 12px 30px rgba(6, 182, 212, 0.3)" : "none",
            }}
          >
            <span style={{ fontSize: "28px", filter: hovQR ? "drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))" : "none", transition: "all 0.3s" }}>📲</span>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ color: "#e9edef" }}>QR Code se Login Karo</div>
              <div style={{ fontSize: "12px", fontWeight: "500", color: "#93c5fd", marginTop: "2px" }}>
                Chat app se scan karo → Auto login
              </div>
            </div>
            <div style={{ fontSize: "18px", opacity: hovQR ? 1 : 0.5, transform: hovQR ? "translateX(4px)" : "none", transition: "all 0.3s" }}>→</div>
          </button>

          {/* ================ Info Box ================ */}
          <div style={{
            background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px", padding: "16px",
            display: "flex", flexDirection: "column", gap: "10px",
            textAlign: "left"
          }}>
            {[
              { icon: "🛡️", text: "AI threat detection — spoof attacks blocked" },
              { icon: "🔒", text: "Face embedding stored — raw image nahi" },
              { icon: "📱", text: "Mobile ki zaroorat nahi" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ 
                  width: "28px", height: "28px", background: "rgba(255, 255, 255, 0.05)", 
                  borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" 
                }}>
                  {item.icon}
                </div>
                <span style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "12px", fontWeight: "500" }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* ================ Link to Chat App ================ */}
          <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "13px", marginTop: "24px", marginBottom: 0 }}>
            Normal login ke liye{" "}
            <span
              onMouseEnter={(e) => e.target.style.color = "#c4b5fd"}
              onMouseLeave={(e) => e.target.style.color = "#8b5cf6"}
              onClick={() => window.open("http://localhost:3000", "_blank")}
              style={{ 
                color: "#8b5cf6", cursor: "pointer", textDecoration: "none", 
                fontWeight: "600", transition: "color 0.3s", paddingBottom: "2px", borderBottom: "1px dashed #8b5cf6" 
              }}
            >Chat App kholo →</span>
          </p>
          
        </div>
      </div>
    </>
  );
}
