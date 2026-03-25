// src/pages/QRScanner.js
// Chat app mein yeh component hai — QR code scan karke web ko login karta hai
// Uses jsQR library for QR decoding from webcam

import React, { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";

const s = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)", zIndex: 2000,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "Segoe UI, sans-serif",
  },
  card: {
    backgroundColor: "#202c33", borderRadius: "16px", padding: "32px",
    width: "380px", textAlign: "center", color: "#e9edef",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    position: "relative",
  },
  closeBtn: {
    position: "absolute", top: "12px", right: "12px",
    background: "#2a3942", border: "none", borderRadius: "50%",
    width: "30px", height: "30px", color: "#8696a0",
    fontWeight: "bold", cursor: "pointer", fontSize: "16px",
  },
  title: { color: "#00a884", fontSize: "20px", fontWeight: "bold", marginBottom: "6px" },
  sub:   { color: "#8696a0", fontSize: "13px", marginBottom: "20px" },
  videoWrap: {
    position: "relative", width: "100%",
    paddingBottom: "75%", marginBottom: "16px",
  },
  video: {
    position: "absolute", top: 0, left: 0,
    width: "100%", height: "100%",
    borderRadius: "12px", objectFit: "cover",
    border: "2px solid #2a3942",
  },
  scanFrame: {
    position: "absolute",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    width: "60%", height: "60%",
    border: "3px solid #00a884",
    borderRadius: "12px",
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
    pointerEvents: "none",
  },
  scanLine: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: "2px", backgroundColor: "#00a884",
    animation: "scanMove 2s linear infinite",
    borderRadius: "2px",
  },
  canvas: { display: "none" },
  status: { padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px" },
  success: { backgroundColor: "#0d2e23", color: "#00a884" },
  error:   { backgroundColor: "#2d1515", color: "#f15c6d" },
  info:    { backgroundColor: "#1a2530", color: "#8696a0" },
  scanning: { backgroundColor: "#1a2530", color: "#8696a0" },
  btn: {
    width: "100%", padding: "11px", backgroundColor: "#00a884",
    color: "#fff", border: "none", borderRadius: "8px",
    fontSize: "14px", fontWeight: "bold", cursor: "pointer", marginBottom: "8px",
  },
  btnGray: {
    width: "100%", padding: "11px", backgroundColor: "transparent",
    color: "#8696a0", border: "1px solid #2a3942",
    borderRadius: "8px", fontSize: "13px", cursor: "pointer",
  },
  confirmBox: {
    backgroundColor: "#1a3a30", border: "1px solid #00a884",
    borderRadius: "12px", padding: "20px", marginBottom: "16px",
  },
  confirmIcon: { fontSize: "40px", marginBottom: "8px" },
  confirmText: { color: "#e9edef", fontSize: "14px", fontWeight: "bold", marginBottom: "4px" },
  confirmSub:  { color: "#8696a0", fontSize: "12px" },
};

// Inject scan animation CSS
const injectStyles = () => {
  if (document.getElementById("qr-scanner-styles")) return;
  const style = document.createElement("style");
  style.id = "qr-scanner-styles";
  style.textContent = `
    @keyframes scanMove {
      0%   { top: 0%; }
      50%  { top: calc(100% - 2px); }
      100% { top: 0%; }
    }
  `;
  document.head.appendChild(style);
};

export default function QRScanner({ user, onClose }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const [phase, setPhase]       = useState("scanning");  // scanning | confirm | done | error
  const [scannedToken, setScannedToken] = useState("");
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState({ msg: "QR code ko frame mein rakho...", type: "scanning" });
  const BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    injectStyles();
    startCamera();
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current?.srcObject)
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // Back camera prefer karo
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      videoRef.current.onloadedmetadata = () => {
        startScanLoop();
      };
    } catch {
      // Fallback to any camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        videoRef.current.onloadedmetadata = () => startScanLoop();
      } catch {
        setStatus({ msg: "Camera access nahi mila!", type: "error" });
        setPhase("error");
      }
    }
  };

  const startScanLoop = useCallback(() => {
    const scan = () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      // Try jsQR decode
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // jsQR is loaded via CDN in index.html
        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleQRDetected(code.data);
            return; // Stop loop
          }
        }
      } catch (e) {
        // Keep scanning
      }
      rafRef.current = requestAnimationFrame(scan);
    };
    rafRef.current = requestAnimationFrame(scan);
  }, []);

  const handleQRDetected = (qrData) => {
    cancelAnimationFrame(rafRef.current);
    stopCamera();

    // QR data format: "securechat-qr:TOKEN"
    if (!qrData.startsWith("securechat-qr:")) {
      setStatus({ msg: "Yeh SecureChat ka QR nahi hai! Sahi QR scan karo.", type: "error" });
      setPhase("error");
      return;
    }

    const token = qrData.replace("securechat-qr:", "");
    setScannedToken(token);
    setPhase("confirm");
    setStatus({ msg: "", type: "" });
  };

  const handleConfirm = async () => {
    setLoading(true);
    setStatus({ msg: "Confirm ho raha hai...", type: "info" });
    try {
      await axios.post(`${BASE}/qr/scan`, {
        qr_token: scannedToken,
        chat_token: user.token,
      });
      await axios.post(`${BASE}/qr/confirm`, {
        qr_token: scannedToken,
        chat_token: user.token,
      });
      setPhase("done");
      setStatus({ msg: "✅ Web login confirm ho gaya! Browser pe dekho.", type: "success" });
      setTimeout(() => onClose(), 2500);
    } catch (err) {
      const d = err.response?.data?.detail || "Confirm fail ho gaya!";
      setStatus({ msg: d, type: "error" });
      setPhase("error");
    }
    setLoading(false);
  };

  const handleRetry = () => {
    setPhase("scanning");
    setScannedToken("");
    setStatus({ msg: "QR code ko frame mein rakho...", type: "scanning" });
    startCamera();
  };

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        <button
  style={s.closeBtn}
  onClick={() => {
    cancelAnimationFrame(rafRef.current); // stop scanning loop
    stopCamera();                         // stop webcam
    onClose();                            // close component
  }}
>
  ×
</button>

        <div style={s.title}>📱 QR Login</div>
        <div style={s.sub}>Web browser pe dikhne wala QR yahan scan karo</div>

        {/* Status */}
        {status.msg && (
          <div style={{ ...s.status, ...s[status.type] }}>{status.msg}</div>
        )}

        {/* SCANNING */}
        {phase === "scanning" && (
          <>
            <div style={s.videoWrap}>
              <video ref={videoRef} style={s.video} muted playsInline />
              <div style={s.scanFrame}>
                <div style={s.scanLine} />
              </div>
            </div>
            <canvas ref={canvasRef} style={s.canvas} />
            <div style={{ color: "#8696a0", fontSize: "12px" }}>
              🔍 Web browser pe "QR Login" pe click karo, QR aayega — usse yahan scan karo
            </div>
          </>
        )}

        {/* CONFIRM */}
        {phase === "confirm" && (
          <>
            <div style={s.confirmBox}>
              <div style={s.confirmIcon}>🌐</div>
              <div style={s.confirmText}>Web pe Login Confirm Karo?</div>
              <div style={s.confirmSub}>
                <strong style={{ color: "#00a884" }}>{user.username}</strong> ka session<br />
                web browser mein start hoga
              </div>
            </div>
            <button style={s.btn} onClick={handleConfirm} disabled={loading}>
              {loading ? "Confirm ho raha hai..." : "✅ Haan, Login Karo"}
            </button>
            <button style={s.btnGray} onClick={handleRetry}>
              ✗ Cancel — Dobara Scan Karo
            </button>
          </>
        )}

        {/* DONE */}
        {phase === "done" && (
          <div style={{ fontSize: "48px", margin: "20px 0" }}>✅</div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <button style={s.btn} onClick={handleRetry}>🔄 Dobara Try Karo</button>
        )}
      </div>
    </div>
  );
}