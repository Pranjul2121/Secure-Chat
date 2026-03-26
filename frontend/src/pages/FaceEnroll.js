// src/pages/FaceEnroll.js — Updated with Face Password
import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const s = {
  overlay: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh",
    backgroundColor: "#111b21", fontFamily: "Segoe UI, sans-serif",
    color: "#e9edef", padding: "20px",
  },
  card: {
    backgroundColor: "#202c33", borderRadius: "14px",
    padding: "36px", width: "420px", textAlign: "center",
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
  },
  title: { color: "#00a884", fontSize: "22px", fontWeight: "bold", marginBottom: "6px" },
  sub: { color: "#8696a0", fontSize: "13px", marginBottom: "22px", lineHeight: "1.6" },
  video: {
    width: "100%", borderRadius: "10px",
    border: "2px solid #2a3942", marginBottom: "14px",
  },
  canvas: { display: "none" },
  input: {
    width: "100%", padding: "11px 14px", marginBottom: "12px",
    borderRadius: "8px", border: "1px solid #2a3942",
    backgroundColor: "#2a3942", color: "#e9edef",
    fontSize: "14px", boxSizing: "border-box", outline: "none",
  },
  label: {
    color: "#8696a0", fontSize: "12px", textAlign: "left",
    display: "block", marginBottom: "5px",
  },
  hint: {
    backgroundColor: "#1a2530", border: "1px solid #2a3942",
    borderRadius: "8px", padding: "10px 14px",
    color: "#8696a0", fontSize: "12px", textAlign: "left",
    marginBottom: "14px", lineHeight: "1.6",
  },
  btn: {
    width: "100%", padding: "12px", backgroundColor: "#00a884",
    color: "#fff", border: "none", borderRadius: "8px",
    fontSize: "15px", fontWeight: "bold", cursor: "pointer", marginBottom: "10px",
  },
  btnSkip: {
    width: "100%", padding: "11px", backgroundColor: "transparent",
    color: "#8696a0", border: "1px solid #2a3942",
    borderRadius: "8px", fontSize: "13px", cursor: "pointer",
  },
  statusBox: { padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" },
  success: { backgroundColor: "#0d2e23", color: "#00a884" },
  error:   { backgroundColor: "#2d1515", color: "#f15c6d" },
  info:    { backgroundColor: "#1a2530", color: "#8696a0" },
  divider: { borderTop: "1px solid #2a3942", margin: "16px 0" },
  stepRow: {
    display: "flex", justifyContent: "center", gap: "8px",
    alignItems: "center", marginBottom: "20px",
  },
  stepActive: { color: "#00a884", fontWeight: "bold", fontSize: "13px" },
  stepDone:   { color: "#00a884", fontSize: "13px" },
  stepInactive:{ color: "#8696a0", fontSize: "13px" },
  arrow: { color: "#2a3942", fontSize: "14px" },
};

export default function FaceEnroll({ user, onDone }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const [step, setStep]               = useState("camera");  // camera | password | done
  const [streaming, setStreaming]     = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);
  const [facePass, setFacePass]       = useState("");
  const [facePassConfirm, setFacePassConfirm] = useState("");
  const [loading, setLoading]         = useState(false);
  const [status, setStatus]           = useState({ msg: "", type: "" });
  const BASE = "http://127.0.0.1:8000";

  useEffect(() => () => stopCamera(), []);

  const stopCamera = () => {
    if (videoRef.current?.srcObject)
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setStreaming(true);
      setStatus({ msg: "Camera ready! Apna chehra frame mein seedha rakho.", type: "info" });
    } catch {
      setStatus({ msg: "Camera access denied! Browser mein allow karo.", type: "error" });
    }
  };

  const capturePhoto = () => {
    if (!streaming) { setStatus({ msg: "Pehle camera shuru karo!", type: "error" }); return; }
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const img = canvas.toDataURL("image/jpeg");
    setCapturedImg(img);
    stopCamera();
    setStreaming(false);
    setStep("password");
    setStatus({ msg: "Chehra capture ho gaya! Ab face password set karo.", type: "success" });
  };

  const handleEnroll = async () => {
    if (!facePass || facePass.length < 4) {
      setStatus({ msg: "Face password kam se kam 4 characters ka hona chahiye!", type: "error" });
      return;
    }
    if (facePass !== facePassConfirm) {
      setStatus({ msg: "Dono passwords match nahi kar rahe!", type: "error" });
      return;
    }

    setLoading(true);
    setStatus({ msg: "Enrolling ho raha hai...", type: "info" });

    try {
      const res = await axios.post(`${BASE}/enroll-face`, {
        username: user.username,
        image: capturedImg,
        face_password: facePass,
      });
      setStatus({ msg: "✅ " + res.data.message, type: "success" });
      setStep("done");
      setTimeout(() => onDone(), 2000);
    } catch (err) {
      const detail = err.response?.data?.detail || "Enrollment fail ho gaya!";
      setStatus({ msg: detail, type: "error" });
    }
    setLoading(false);
  };

  const retakePhoto = async () => {
    setCapturedImg(null);
    setStep("camera");
    setStatus({ msg: "", type: "" });
    await startCamera();
  };

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        <div style={s.title}>🪪 Face Enroll Karo</div>
        <div style={s.sub}>
          Face + alag Face Password set karo<br />
          Phir web pe bina mobile ke login karo
        </div>

        {/* Step indicator */}
        <div style={s.stepRow}>
          <span style={step === "camera" ? s.stepActive : s.stepDone}>
            {step === "camera" ? "①" : "✓"} Chehra Capture
          </span>
          <span style={s.arrow}>→</span>
          <span style={step === "password" ? s.stepActive : step === "done" ? s.stepDone : s.stepInactive}>
            {step === "done" ? "✓" : "②"} Face Password
          </span>
          <span style={s.arrow}>→</span>
          <span style={step === "done" ? s.stepActive : s.stepInactive}>
            ③ Done
          </span>
        </div>

        {/* Status */}
        {status.msg && (
          <div style={{ ...s.statusBox, ...s[status.type] }}>{status.msg}</div>
        )}

        {/* STEP 1: Camera */}
        {step === "camera" && (
          <>
            <video ref={videoRef} style={s.video} muted />
            <canvas ref={canvasRef} style={s.canvas} />
            {!streaming ? (
              <button style={s.btn} onClick={startCamera}>📷 Camera Shuru Karo</button>
            ) : (
              <button style={s.btn} onClick={capturePhoto}>✅ Chehra Capture Karo</button>
            )}
            <button style={s.btnSkip} onClick={onDone}>Abhi Nahi — Baad Mein Karna</button>
          </>
        )}

        {/* STEP 2: Face Password */}
        {step === "password" && (
          <>
            {/* Preview of captured face */}
            {capturedImg && (
              <img
                src={capturedImg}
                alt="captured"
                style={{ width: "100%", borderRadius: "10px", marginBottom: "14px",
                  border: "2px solid #00a884" }}
              />
            )}

            <div style={s.hint}>
              💡 <strong style={{ color: "#e9edef" }}>Face Password kya hai?</strong><br />
              Yeh ek alag password hai — sirf Face Login ke liye.<br />
              Account password se alag rakhna better hai.
            </div>

            <div style={s.divider} />

            <label style={s.label}>Face Password (min 4 chars)</label>
            <input
              style={s.input} type="password"
              placeholder="Face ke liye alag password"
              value={facePass}
              onChange={e => setFacePass(e.target.value)}
            />
            <label style={s.label}>Confirm Face Password</label>
            <input
              style={s.input} type="password"
              placeholder="Dobara wahi password likho"
              value={facePassConfirm}
              onChange={e => setFacePassConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEnroll()}
            />

            <button style={s.btn} onClick={handleEnroll} disabled={loading}>
              {loading ? "Enrolling..." : "✅ Enroll Karo"}
            </button>
            <button style={s.btnSkip} onClick={retakePhoto}>
              🔄 Photo Dobara Kheencho
            </button>
          </>
        )}

        {/* STEP 3: Done */}
        {step === "done" && (
          <div style={{ fontSize: "48px", margin: "20px 0" }}>✅</div>
        )}
      </div>
    </div>
  );
}