// src/pages/FaceLogin.js — FINAL FIXED VERSION

import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import LivenessCheck from "./LivenessCheck";

const s = {
  wrap: {
    display: "flex", justifyContent: "center", alignItems: "center",
    height: "100vh", backgroundColor: "#111b21",
    fontFamily: "Segoe UI, sans-serif", color: "#e9edef",
  },
  card: {
    backgroundColor: "#202c33", borderRadius: "16px", padding: "40px",
    width: "420px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", textAlign: "center",
  },
  title: { color: "#00a884", fontSize: "24px", fontWeight: "bold", marginBottom: "6px" },
  sub: { color: "#8696a0", fontSize: "13px", marginBottom: "24px" },
  steps: { display: "flex", justifyContent: "center", gap: "6px", alignItems: "center", marginBottom: "24px" },
  sActive: { color: "#00a884", fontWeight: "bold", fontSize: "12px" },
  sDone: { color: "#00a884", fontSize: "12px" },
  sGray: { color: "#8696a0", fontSize: "12px" },
  arrow: { color: "#2a3942", fontSize: "12px" },
  input: {
    width: "100%", padding: "12px 16px", marginBottom: "12px",
    borderRadius: "8px", border: "1px solid #2a3942",
    backgroundColor: "#2a3942", color: "#e9edef",
    fontSize: "14px", boxSizing: "border-box", outline: "none",
  },
  btnGreen: {
    width: "100%", padding: "12px", backgroundColor: "#00a884",
    color: "#fff", border: "none", borderRadius: "8px",
    fontSize: "15px", fontWeight: "bold", cursor: "pointer", marginBottom: "10px",
  },
  btnGray: {
    width: "100%", padding: "11px", backgroundColor: "transparent",
    color: "#8696a0", border: "1px solid #2a3942",
    borderRadius: "8px", fontSize: "13px", cursor: "pointer", marginBottom: "8px",
  },
  video: {
    width: "100%", borderRadius: "10px",
    border: "2px solid #2a3942", marginBottom: "14px",
  },
  canvas: { display: "none" },
  status: { padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" },
  success: { backgroundColor: "#0d2e23", color: "#00a884" },
  error: { backgroundColor: "#2d1515", color: "#f15c6d" },
  info: { backgroundColor: "#1a2530", color: "#8696a0" },
  backLink: { color: "#8696a0", fontSize: "12px", marginTop: "12px", cursor: "pointer", textDecoration: "underline" },
  simBar: { height: "5px", borderRadius: "3px", backgroundColor: "#2a3942", marginTop: "6px", overflow: "hidden" },
  simFill: (p) => ({
    height: "100%", width: `${p}%`, borderRadius: "3px",
    backgroundColor: p > 70 ? "#00a884" : p > 50 ? "#f0a84e" : "#f15c6d",
    transition: "width 0.4s",
  }),
};

export default function FaceLogin({ onLogin, onBack }) {
  const [stage, setStage] = useState("username");
  const [username, setUsername] = useState("");
  const [faceTempToken, setFaceTempToken] = useState("");
  const [facePass, setFacePass] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [similarity, setSimilarity] = useState(null);
  const [status, setStatus] = useState({ msg: "", type: "" });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const BASE = "http://127.0.0.1:8000";

  useEffect(() => () => stopCam(), []);

  const stopCam = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleUsernameNext = async () => {
    if (!username.trim()) {
      setStatus({ msg: "Username dalo!", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/face-status/${username}`);
      if (!res.data.enrolled) {
        setStatus({ msg: "Face enroll nahi hai!", type: "error" });
      } else {
        setStage("liveness");
        setStatus({ msg: "", type: "" });
      }
    } catch {
      setStatus({ msg: "User nahi mila!", type: "error" });
    }
    setLoading(false);
  };

  const handleLivenessDone = () => {
    setStage("face_scan");
    setStatus({ msg: "Liveness pass! Ab face scan karo.", type: "success" });
  };

  const startCam = async () => {
    try {
      stopCam();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreaming(true);
      setStatus({ msg: "Camera ready!", type: "info" });
    } catch {
      setStatus({ msg: "Camera allow karo!", type: "error" });
    }
  };

  const scanFace = async () => {
    if (!streaming || loading) return;

    const cv = canvasRef.current;
    const vd = videoRef.current;

    cv.width = vd.videoWidth;
    cv.height = vd.videoHeight;

    const ctx = cv.getContext("2d");

    // ✅ mirror fix
    ctx.translate(cv.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(vd, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // ✅ high quality
    const img = cv.toDataURL("image/jpeg", 0.95).split(",")[1];

    setLoading(true);
    setStatus({ msg: "Face scan ho raha hai...", type: "info" });
    setSimilarity(null);

    try {
      const res = await axios.post(`${BASE}/face-login/verify-face`, {
        username,
        image: img,
      });

      setSimilarity(res.data.similarity);
      setFaceTempToken(res.data.face_temp_token);

      stopCam();
      setStreaming(false);

      setStage("face_password");
      setStatus({
        msg: `✅ Face match (${res.data.similarity}%)`,
        type: "success",
      });

    } catch (err) {
      const d = err.response?.data?.detail || "Face match fail!";
      setStatus({ msg: d, type: "error" });
    }

    setLoading(false);
  };

  const submitFacePassword = async () => {
    if (!facePass) {
      setStatus({ msg: "Face password dalo!", type: "error" });
      return;
    }

    setLoading(true);
    setStatus({ msg: "Verify ho raha hai...", type: "info" });

    try {
      const res = await axios.post(`${BASE}/face-login/verify-password`, {
        username,
        face_token: faceTempToken,
        face_password: facePass,
      });

      setStatus({ msg: "✅ Login successful!", type: "success" });

      setTimeout(() => {
        onLogin({
          username: res.data.username,
          token: res.data.access_token,
        });
      }, 800);

    } catch (err) {
      const d = err.response?.data?.detail || "Password galat!";
      setStatus({ msg: d, type: "error" });
    }

    setLoading(false);
  };

  const stageIdx = { username: 0, liveness: 1, face_scan: 2, face_password: 3 };
  const cur = stageIdx[stage] ?? 0;

  const stepLabel = (idx, label) => {
    if (idx < cur) return <span style={s.sDone}>✓ {label}</span>;
    if (idx === cur) return <span style={s.sActive}>● {label}</span>;
    return <span style={s.sGray}>○ {label}</span>;
  };

  if (stage === "liveness") {
    return (
      <LivenessCheck
        onSuccess={handleLivenessDone}
        onFail={() => {
          setStage("username");
          setStatus({ msg: "Liveness fail!", type: "error" });
        }}
      />
    );
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.title}>🪪 Face Login</div>
        <div style={s.sub}>Secure 4-step face authentication</div>

        <div style={s.steps}>
          {stepLabel(0, "User")}
          <span style={s.arrow}>→</span>
          {stepLabel(1, "Liveness")}
          <span style={s.arrow}>→</span>
          {stepLabel(2, "Face")}
          <span style={s.arrow}>→</span>
          {stepLabel(3, "Password")}
        </div>

        {status.msg && (
          <div style={{ ...s.status, ...s[status.type] }}>
            {status.msg}
            {similarity !== null && (
              <div style={s.simBar}>
                <div style={s.simFill(similarity)} />
              </div>
            )}
          </div>
        )}

        {stage === "username" && (
          <>
            <input
              style={s.input}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button style={s.btnGreen} onClick={handleUsernameNext}>
              Next →
            </button>
            <div style={s.backLink} onClick={onBack}>
              ← Password se login karo
            </div>
          </>
        )}

        {stage === "face_scan" && (
          <>
            <video ref={videoRef} style={s.video} muted />
            <canvas ref={canvasRef} style={s.canvas} />

            {!streaming ? (
              <button style={s.btnGreen} onClick={startCam}>
                📷 Camera Shuru Karo
              </button>
            ) : (
              <button style={s.btnGreen} onClick={scanFace} disabled={loading}>
                {loading ? "Scan ho raha hai..." : "🔍 Face Scan Karo"}
              </button>
            )}
          </>
        )}

        {stage === "face_password" && (
          <>
            <input
              style={s.input}
              type="password"
              placeholder="Face Password"
              value={facePass}
              onChange={(e) => setFacePass(e.target.value)}
            />
            <button style={s.btnGreen} onClick={submitFacePassword}>
              🔓 Login Karo
            </button>
          </>
        )}
      </div>
    </div>
  );
}