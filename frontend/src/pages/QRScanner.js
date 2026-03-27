// chat-app/src/pages/QRScanner.js — PREMIUM UI matching Chat.js aesthetic
import React, { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";

const CSS = `
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes fadeUp { 
  from { opacity: 0; transform: translateY(20px) } 
  to { opacity: 1; transform: translateY(0) } 
}
@keyframes scanMove { 
  0% { top: 0%; } 
  50% { top: calc(100% - 3px); } 
  100% { top: 0%; } 
}
@keyframes pulse { 
  0%, 100% { transform: scale(1); opacity: 1; } 
  50% { transform: scale(1.05); opacity: 0.8; } 
}
@keyframes slideIn { 
  from { opacity: 0; transform: scale(0.94) } 
  to { opacity: 1; transform: scale(1) } 
}
`;

const injectCSS = () => {
  if (document.getElementById("qrs-css")) return;
  const el = document.createElement("style");
  el.id = "qrs-css"; el.textContent = CSS;
  document.head.appendChild(el);
};

// Premium Neon UI Theme Colors mapping
const C = {
  cyan: "#06b6d4",
  cyanLight: "#67e8f9",
  blue: "#3b82f6",
  bgOverlay: "rgba(0, 0, 0, 0.8)",
  card: "rgba(30, 30, 50, 0.95)", // Glassmorphism dark background
  border: "rgba(255, 255, 255, 0.1)",
  text: "#e9edef",
  muted: "rgba(255, 255, 255, 0.5)",
  red: "#ef4444",
  success: "#22c55e",
};

export default function QRScanner({ user, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [phase, setPhase] = useState("scanning");
  const [scannedToken, setScannedToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: "QR code ko frame mein rakho...", type: "info" });
  const BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    injectCSS();
    startCamera();
    return () => { cancelAnimationFrame(rafRef.current); stopCamera(); };
  }, []);

  const stopCamera = () => {
    if (videoRef.current?.srcObject)
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      videoRef.current.onloadedmetadata = startScanLoop;
    } catch {
      try {
        const s2 = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = s2;
        videoRef.current.play();
        videoRef.current.onloadedmetadata = startScanLoop;
      } catch {
        setStatus({ msg: "Camera access nahi mila!", type: "error" });
        setPhase("error");
      }
    }
  };

  const startScanLoop = useCallback(() => {
    const scan = () => {
      const v = videoRef.current, c = canvasRef.current;
      if (!v || !c || v.readyState !== 4) { rafRef.current = requestAnimationFrame(scan); return; }
      c.width = v.videoWidth; c.height = v.videoHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(v, 0, 0);
      try {
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        if (window.jsQR) {
          const code = window.jsQR(imgData.data, imgData.width, imgData.height);
          if (code?.data) { handleQRDetected(code.data); return; }
        }
      } catch { }
      rafRef.current = requestAnimationFrame(scan);
    };
    rafRef.current = requestAnimationFrame(scan);
  }, []);

  const handleQRDetected = (qrData) => {
    cancelAnimationFrame(rafRef.current); stopCamera();
    if (!qrData.startsWith("securechat-qr:")) {
      setStatus({ msg: "SecureChat ka QR nahi hai!", type: "error" }); setPhase("error"); return;
    }
    setScannedToken(qrData.replace("securechat-qr:", ""));
    setPhase("confirm"); setStatus({ msg: "", type: "" });
  };

  const handleConfirm = async () => {
    setLoading(true); setStatus({ msg: "Confirm ho raha hai...", type: "info" });
    try {
      await axios.post(`${BASE}/qr/scan`, { qr_token: scannedToken, chat_token: user.token });
      await axios.post(`${BASE}/qr/confirm`, { qr_token: scannedToken, chat_token: user.token });
      setPhase("done"); setStatus({ msg: "✅ Web login confirm! Browser pe dekho.", type: "success" });
      setTimeout(() => onClose(), 2500);
    } catch (err) {
      setStatus({ msg: err.response?.data?.detail || "Confirm fail!", type: "error" }); setPhase("error");
    }
    setLoading(false);
  };

  const handleRetry = () => { setPhase("scanning"); setScannedToken(""); setStatus({ msg: "QR frame mein rakho...", type: "info" }); startCamera(); };

  const handleClose = () => { cancelAnimationFrame(rafRef.current); stopCamera(); onClose(); };

  // Status Box Styling generator
  const getStatusStyle = (type) => {
    if (type === "success") return { bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.3)", color: "#86efac" };
    if (type === "error") return { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", color: "#fca5a5" };
    return { bg: "rgba(255, 255, 255, 0.05)", border: "rgba(255, 255, 255, 0.1)", color: "#e9edef" };
  };

  const sStyle = status.msg ? getStatusStyle(status.type) : null;

  return (
    <>
      <style>{CSS}</style>
      
      {/* Overlay Background - Glassmorphic blur matching Chat.js Modal */}
      <div style={{
        position: "fixed", inset: 0, 
        background: C.bgOverlay, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        animation: "fadeIn 0.3s ease forwards"
      }}>
        
        {/* Main Card */}
        <div style={{
          background: C.card,
          backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
          border: `1px solid ${C.border}`,
          borderRadius: "24px", padding: "32px", width: "380px",
          textAlign: "center", color: C.text,
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          position: "relative",
          animation: "modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}>
          
          {/* Close Button */}
          <button onClick={handleClose}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(239, 68, 68, 0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
            style={{
              position: "absolute", top: "-14px", right: "-14px",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              border: "none", borderRadius: "50%",
              width: "32px", height: "32px", color: "#fff",
              fontWeight: "bold", cursor: "pointer", fontSize: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.3s ease", zIndex: 10
            }}>
            ✕
          </button>

          {/* Header Icon matching Chat.js QR button aesthetics */}
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15))",
            border: "2px solid rgba(6, 182, 212, 0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", margin: "0 auto 16px",
            boxShadow: "0 8px 25px rgba(6, 182, 212, 0.4)",
            color: C.cyanLight
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          
          <h3 style={{
            margin: "0 0 6px", fontSize: "20px", fontWeight: "700",
            background: "linear-gradient(135deg, #67e8f9, #93c5fd)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>QR Login Scanner</h3>
          <p style={{ color: C.muted, fontSize: "13px", margin: "0 0 20px" }}>
            Web browser pe dikhne wala QR yahan scan karo
          </p>

          {/* Status Alert */}
          {status.msg && (
            <div style={{
              padding: "12px 16px", borderRadius: "14px", marginBottom: "18px",
              fontSize: "13px", animation: "slideIn .3s ease",
              background: sStyle.bg,
              border: `1px solid ${sStyle.border}`,
              color: sStyle.color,
              fontWeight: "500",
            }}>{status.msg}</div>
          )}

          {/* ================= SCANNING PHASE ================= */}
          {phase === "scanning" && (
            <>
              <div style={{
                position: "relative", borderRadius: "16px", overflow: "hidden",
                border: `2px solid rgba(6, 182, 212, 0.4)`, marginBottom: "16px",
                paddingBottom: "75%", background: "#000",
                boxShadow: "0 4px 25px rgba(6, 182, 212, 0.2)"
              }}>
                <video ref={videoRef} muted playsInline style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover", borderRadius: "14px",
                }} />
                
                {/* Premium Scan Frame overlay */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "60%", height: "60%",
                  border: `2px solid rgba(255,255,255,0.1)`, borderRadius: "16px",
                  boxShadow: `0 0 0 9999px rgba(0,0,0,0.5)`,
                }}>
                  {/* Neon Scan Line */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                    background: `linear-gradient(90deg, transparent, ${C.cyanLight}, transparent)`,
                    animation: "scanMove 2s linear infinite",
                    borderRadius: "2px",
                    boxShadow: `0 0 10px ${C.cyanLight}`
                  }} />
                  
                  {/* Neon Corners */}
                  {[
                    { t: "-2px", l: "-2px", c1: "borderTop", c2: "borderLeft", br: "16px 0 0 0" },
                    { t: "-2px", r: "-2px", c1: "borderTop", c2: "borderRight", br: "0 16px 0 0" },
                    { b: "-2px", l: "-2px", c1: "borderBottom", c2: "borderLeft", br: "0 0 0 16px" },
                    { b: "-2px", r: "-2px", c1: "borderBottom", c2: "borderRight", br: "0 0 16px 0" }
                  ].map((pos, i) => (
                    <div key={i} style={{
                      position: "absolute", width: "24px", height: "24px",
                      [pos.c1]: `3px solid ${C.cyan}`, [pos.c2]: `3px solid ${C.cyan}`,
                      borderRadius: pos.br,
                      top: pos.t, left: pos.l, bottom: pos.b, right: pos.r,
                    }}/>
                  ))}
                </div>
              </div>
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </>
          )}

          {/* ================= CONFIRM PHASE ================= */}
          {phase === "confirm" && (
            <div style={{ animation: "modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
              <div style={{
                background: "rgba(34, 197, 94, 0.08)", border: `1px solid rgba(34, 197, 94, 0.2)`,
                borderRadius: "16px", padding: "24px", marginBottom: "20px",
              }}>
                <div style={{ fontSize: "48px", marginBottom: "12px", animation: "pulse 2s infinite" }}>🌐</div>
                <div style={{ color: "#e9edef", fontWeight: "700", fontSize: "16px", marginBottom: "8px" }}>
                  Web Login Confirm Karo?
                </div>
                <div style={{ color: C.muted, fontSize: "13px", lineHeight: "1.5" }}>
                  <strong style={{ color: "#22c55e", background: "rgba(34, 197, 94, 0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                    @{user.username}
                  </strong> ka session web browser mein start hoga
                </div>
              </div>
              
              <button onClick={handleConfirm} disabled={loading}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 8px 25px rgba(34, 197, 94, 0.4)")}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "0 4px 15px rgba(34, 197, 94, 0.3)")}
                style={{
                  width: "100%", padding: "14px", marginBottom: "12px",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff", border: "none", borderRadius: "14px",
                  fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)",
                  transition: "all 0.3s ease", fontFamily: "inherit",
              }}>
                {loading ? "Confirm ho raha hai..." : "✅ Haan, Login Karo"}
              </button>
              
              <button onClick={handleRetry}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                style={{
                  width: "100%", padding: "12px", background: "transparent",
                  color: "rgba(255, 255, 255, 0.6)", border: `1px solid rgba(255, 255, 255, 0.2)`,
                  borderRadius: "14px", fontSize: "14px", cursor: "pointer",
                  transition: "all 0.3s ease", fontFamily: "inherit",
              }}>✗ Cancel — Dobara Scan Karo</button>
            </div>
          )}

          {/* ================= DONE PHASE ================= */}
          {phase === "done" && (
            <div style={{ padding: "40px 0", animation: "modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
              <div style={{ fontSize: "72px", marginBottom: "16px", animation: "pulse 2s infinite" }}>✅</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: "700",
                background: "linear-gradient(135deg, #22c55e, #10b981)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>Login Confirm!</h3>
              <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px", margin: 0 }}>Browser tab check karo...</p>
            </div>
          )}

          {/* ================= ERROR PHASE ================= */}
          {phase === "error" && (
            <div style={{ padding: "20px 0", animation: "modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
              <div style={{ fontSize: "60px", marginBottom: "16px" }}>⚠️</div>
              <p style={{ color: "#ef4444", fontWeight: "700", fontSize: "18px", marginBottom: "20px" }}>Oops! Scan Failed</p>
              <button onClick={handleRetry}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(239, 68, 68, 0.4)" }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
                style={{
                  width: "100%", padding: "14px",
                  background: `linear-gradient(135deg, #ef4444, #dc2626)`,
                  color: "#fff", border: "none", borderRadius: "14px",
                  fontSize: "15px", fontWeight: "700", cursor: "pointer",
                  transition: "all 0.3s ease", fontFamily: "inherit"
              }}>🔄 Dobara Try Karo</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
