import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const QR_EXPIRE_SECONDS = 120;

export default function QRLogin({ onLogin, onBack }) {
  const [phase, setPhase]         = useState("idle");
  const [qrToken, setQrToken]     = useState("");
  const [qrDataURL, setQrDataURL] = useState("");
  const [timeLeft, setTimeLeft]   = useState(QR_EXPIRE_SECONDS);
  const [status, setStatus]       = useState({ msg: "", type: "" });

  const pollRef  = useRef(null);
  const timerRef = useRef(null);

  const BASE = "http://127.0.0.1:8000"; // SAME backend for both apps

  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  // 🚀 GENERATE QR
  const generateQR = async () => {
    setPhase("waiting");
    setStatus({ msg: "QR generate ho raha hai...", type: "info" });

    try {
      const res = await axios.post(`${BASE}/qr/generate`);
      console.log("QR Response:", res.data);

      const token = res.data.qr_token;
      if (!token) throw new Error("Token missing");

      setQrToken(token);
      setTimeLeft(QR_EXPIRE_SECONDS);

      const qrData = `securechat-qr:${token}`;

      // ✅ QR generate (fallback always works)
      setQrDataURL(`https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=200`);

      setStatus({ msg: "📱 Chat app se scan karo", type: "waiting" });

      // ⏱ TIMER
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            clearInterval(pollRef.current);
            setPhase("expired");
            setQrDataURL("");
            setStatus({ msg: "QR expire ho gaya!", type: "error" });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 🔁 POLLING
      pollRef.current = setInterval(() => pollStatus(token), 1500);

    } catch (err) {
      console.error(err);
      setStatus({ msg: "QR generate fail ho gaya!", type: "error" });
      setPhase("idle");
    }
  };

  // 🔁 CHECK STATUS
  const pollStatus = useCallback(async (token) => {
    try {
      const res = await axios.get(`${BASE}/qr/status/${token}`);
      const { status: qStatus, access_token, username } = res.data;

      if (qStatus === "scanned") {
        setPhase("scanned");
        setStatus({ msg: "📱 Scan ho gaya! Confirm karo app mein", type: "info" });
      }

      if (qStatus === "confirmed") {
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);
        setPhase("confirmed");
        setStatus({ msg: `✅ Welcome ${username}`, type: "success" });

        setTimeout(() => {
          onLogin({ username, token: access_token });
        }, 1000);
      }

      if (qStatus === "expired") {
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);
        setPhase("expired");
        setStatus({ msg: "QR expire ho gaya!", type: "error" });
      }

    } catch (e) {
      console.log("Polling error", e);
    }
  }, [onLogin]);

  const timerPct = (timeLeft / QR_EXPIRE_SECONDS) * 100;

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      height: "100vh", background: "#111b21", color: "white"
    }}>
      <div style={{
        background: "#202c33", padding: "30px",
        borderRadius: "12px", textAlign: "center", width: "350px"
      }}>

        <h2>📲 QR Login</h2>

        {status.msg && (
          <div style={{ marginBottom: "10px" }}>{status.msg}</div>
        )}

        {/* IDLE */}
        {phase === "idle" && (
          <>
            <button onClick={generateQR} style={{ width: "100%", padding: "10px", marginBottom: "10px" }}>
              Generate QR
            </button>

            <button onClick={onBack} style={{ width: "100%", padding: "10px" }}>
              ← Back
            </button>
          </>
        )}

        {/* WAITING / SCANNED */}
        {(phase === "waiting" || phase === "scanned") && (
          <>
            <div style={{ height: "5px", background: "#333", marginBottom: "10px" }}>
              <div style={{
                width: `${timerPct}%`,
                height: "100%",
                background: "green"
              }} />
            </div>

            <p>⏱ {timeLeft}s</p>

            <div style={{ background: "#fff", padding: "10px" }}>
              {qrDataURL ? (
                <img src={qrDataURL} alt="QR" width="200" />
              ) : (
                <p style={{ color: "red" }}>QR failed</p>
              )}
            </div>

            {/* CANCEL */}
            <button
              style={{ marginTop: "10px", width: "100%" }}
              onClick={() => {
                clearInterval(pollRef.current);
                clearInterval(timerRef.current);
                setPhase("idle");
                setQrDataURL("");
              }}
            >
              Cancel
            </button>

            {/* BACK */}
            <button
              style={{ marginTop: "5px", width: "100%" }}
              onClick={() => {
                clearInterval(pollRef.current);
                clearInterval(timerRef.current);
                setPhase("idle");
                setQrDataURL("");
                onBack();
              }}
            >
              ← Back
            </button>
          </>
        )}

        {/* EXPIRED */}
        {phase === "expired" && (
          <>
            <p>QR Expired</p>
            <button onClick={() => setPhase("idle")}>
              Regenerate
            </button>
          </>
        )}

        {/* CONFIRMED */}
        {phase === "confirmed" && (
          <h3>✅ Logged In</h3>
        )}

      </div>
    </div>
  );
}