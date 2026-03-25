import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#111b21",
    color: "#e9edef",
    fontFamily: "Segoe UI, sans-serif",
    padding: "20px",
  },
  card: {
    backgroundColor: "#202c33",
    borderRadius: "12px",
    padding: "36px",
    width: "420px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  title: {
    color: "#00a884",
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#8696a0",
    fontSize: "13px",
    marginBottom: "24px",
  },
  video: {
    width: "100%",
    borderRadius: "10px",
    border: "2px solid #2a3942",
    marginBottom: "16px",
  },
  canvas: { display: "none" },
  btn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#00a884",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "10px",
  },
  btnSkip: {
    width: "100%",
    padding: "12px",
    backgroundColor: "transparent",
    color: "#8696a0",
    border: "1px solid #2a3942",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  status: {
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "13px",
  },
  success: { backgroundColor: "#0d2e23", color: "#00a884" },
  error: { backgroundColor: "#2d1515", color: "#f15c6d" },
  info: { backgroundColor: "#1a2530", color: "#8696a0" },
};

function FaceEnroll({ user, onDone }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState({ msg: "Webcam shuru karo", type: "info" });
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setStreaming(true);
      setStatus({ msg: "Camera ready! Apna chehra frame mein rakho", type: "info" });
    } catch {
      setStatus({ msg: "Camera access nahi mila. Allow karo!", type: "error" });
    }
  };

  const captureAndEnroll = async () => {
    if (!streaming) {
      setStatus({ msg: "Pehle camera shuru karo!", type: "error" });
      return;
    }
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const imageBase64 = canvas.toDataURL("image/jpeg");

    setLoading(true);
    setStatus({ msg: "Face process ho raha hai...", type: "info" });

    try {
      const res = await axios.post(`${BASE}/enroll-face`, {
        username: user.username,
        image: imageBase64,
      });
      setStatus({ msg: res.data.message, type: "success" });
      setTimeout(() => onDone(), 1500);
    } catch (err) {
      const detail = err.response?.data?.detail || "Kuch gadbad ho gayi!";
      setStatus({ msg: detail, type: "error" });
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>🪪 Face Enroll Karo</div>
        <div style={styles.subtitle}>
          Ek baar face enroll karo — phir mobile ke bina login kar sakte ho
        </div>

        <div style={{ ...styles.status, ...styles[status.type] }}>
          {status.msg}
        </div>

        <video ref={videoRef} style={styles.video} muted />
        <canvas ref={canvasRef} style={styles.canvas} />

        {!streaming ? (
          <button style={styles.btn} onClick={startCamera}>
            📷 Camera Shuru Karo
          </button>
        ) : (
          <button style={styles.btn} onClick={captureAndEnroll} disabled={loading}>
            {loading ? "Process ho raha hai..." : "✅ Face Capture Karo"}
          </button>
        )}

        <button style={styles.btnSkip} onClick={onDone}>
          Abhi Nahi — Baad Mein Karna
        </button>
      </div>
    </div>
  );
}

export default FaceEnroll;
