// src/pages/LivenessCheck.js — Phase 4
// Liveness Detection — random challenges: blink, smile, head turn
// Yeh ensure karta hai ki koi photo se login na kare — real face chahiye

import React, { useRef, useState, useEffect, useCallback } from "react";

const CHALLENGES = [
  { id: "blink",     label: "😉 Ek baar Blink Karo",        icon: "👁️",  hint: "Dono aankhein band karo, phir kholo" },
  { id: "smile",     label: "😊 Muskurao (Smile Karo)",     icon: "😄",  hint: "Bade danto wali smile do" },
  { id: "left",      label: "◀️ Left Dekho",                icon: "👈",  hint: "Apna chehra left taraf ghhumao" },
  { id: "right",     label: "▶️ Right Dekho",               icon: "👉",  hint: "Apna chehra right taraf ghhumao" },
  { id: "nod",       label: "⬆️⬇️ Haan Karo (Sar Hilao)",  icon: "🔼",  hint: "Upar neeche sar hilao" },
];

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#111b21",
    fontFamily: "Segoe UI, sans-serif",
    color: "#e9edef",
    padding: "20px",
  },
  card: {
    backgroundColor: "#202c33",
    borderRadius: "16px",
    padding: "36px",
    width: "440px",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  title: {
    color: "#00a884",
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "6px",
  },
  subtitle: {
    color: "#8696a0",
    fontSize: "13px",
    marginBottom: "24px",
  },
  challengeBox: {
    backgroundColor: "#1a2530",
    border: "2px solid #00a884",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "18px",
    animation: "pulse 1.5s infinite",
  },
  challengeIcon: {
    fontSize: "36px",
    marginBottom: "6px",
  },
  challengeLabel: {
    color: "#00a884",
    fontWeight: "bold",
    fontSize: "16px",
    marginBottom: "4px",
  },
  challengeHint: {
    color: "#8696a0",
    fontSize: "12px",
  },
  timer: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#f0a84e",
    marginBottom: "12px",
  },
  timerLow: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#f15c6d",
    marginBottom: "12px",
  },
  video: {
    width: "100%",
    borderRadius: "10px",
    border: "2px solid #2a3942",
    marginBottom: "16px",
    transform: "scaleX(-1)", // Mirror effect
  },
  canvas: { display: "none" },
  progressBar: {
    height: "6px",
    borderRadius: "3px",
    backgroundColor: "#2a3942",
    marginBottom: "16px",
    overflow: "hidden",
  },
  progressFill: (pct, success) => ({
    height: "100%",
    width: `${pct}%`,
    borderRadius: "3px",
    backgroundColor: success ? "#00a884" : "#f0a84e",
    transition: "width 0.3s ease",
  }),
  steps: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "20px",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#2a3942",
  },
  dotDone: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#00a884",
  },
  dotActive: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#f0a84e",
  },
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
  btnRetry: {
    width: "100%",
    padding: "12px",
    backgroundColor: "transparent",
    color: "#f15c6d",
    border: "1px solid #f15c6d",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  status: {
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "14px",
    fontSize: "13px",
  },
  success: { backgroundColor: "#0d2e23", color: "#00a884" },
  error:   { backgroundColor: "#2d1515", color: "#f15c6d" },
  info:    { backgroundColor: "#1a2530", color: "#8696a0" },
};

function LivenessCheck({ onSuccess, onFail }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("start"); // start | challenge | success | fail
  const [challenges, setChallenges] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [completedSnapshots, setCompletedSnapshots] = useState([]);
  const [status, setStatus] = useState({ msg: "", type: "" });
  const CHALLENGE_COUNT = 3;
  const SECONDS_PER_CHALLENGE = 5;

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
  };

  // Pick random challenges
  const pickChallenges = () => {
    const shuffled = [...CHALLENGES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, CHALLENGE_COUNT);
  };

  const startLiveness = async () => {
    const selected = pickChallenges();
    setChallenges(selected);
    setCurrentIdx(0);
    setCompletedSnapshots([]);
    setPhase("challenge");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch {
      setStatus({ msg: "Camera access nahi mila!", type: "error" });
      setPhase("fail");
      return;
    }

    startTimer(selected, 0);
  };

  const startTimer = useCallback((challengeList, idx) => {
    setTimeLeft(SECONDS_PER_CHALLENGE);
    clearInterval(timerRef.current);

    let t = SECONDS_PER_CHALLENGE;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
        // Auto-capture when timer runs out
        captureSnapshot(challengeList, idx);
      }
    }, 1000);
  }, []);

  const captureSnapshot = (challengeList, idx) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.scale(-1, 1); // Unflip for server
    ctx.drawImage(video, -canvas.width, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const snapshot = canvas.toDataURL("image/jpeg", 0.8);

    setCompletedSnapshots((prev) => {
      const updated = [...prev, { challenge: challengeList[idx].id, snapshot }];

      const nextIdx = idx + 1;
      if (nextIdx >= challengeList.length) {
        // All challenges done
        clearInterval(timerRef.current);
        stopCamera();
        setPhase("success");
        setStatus({ msg: "Liveness confirm ho gaya! Real person detected ✅", type: "success" });
        setTimeout(() => onSuccess(updated), 1500);
      } else {
        setCurrentIdx(nextIdx);
        startTimer(challengeList, nextIdx);
      }
      return updated;
    });
  };

  const handleManualCapture = () => {
    clearInterval(timerRef.current);
    captureSnapshot(challenges, currentIdx);
  };

  const handleFail = () => {
    stopCamera();
    setPhase("fail");
    onFail();
  };

  const progressPct = challenges.length > 0
    ? (currentIdx / challenges.length) * 100
    : 0;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>🔴 Liveness Check</div>
        <div style={styles.subtitle}>
          Verify karo ki tum ek real insaan ho — photo nahi
        </div>

        {/* START */}
        {phase === "start" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤳</div>
            <div style={{ color: "#8696a0", fontSize: "14px", marginBottom: "24px", lineHeight: "1.7" }}>
              Tumhe {CHALLENGE_COUNT} random challenges complete karni hain.<br />
              Har challenge ke liye {SECONDS_PER_CHALLENGE} seconds milenge.<br />
              <strong style={{ color: "#e9edef" }}>Achi roshan jagah mein raho!</strong>
            </div>
            <button style={styles.btn} onClick={startLiveness}>
              🚀 Start Liveness Check
            </button>
          </>
        )}

        {/* CHALLENGE */}
        {phase === "challenge" && challenges.length > 0 && (
          <>
            {/* Progress dots */}
            <div style={styles.steps}>
              {challenges.map((_, i) => (
                <div
                  key={i}
                  style={i < currentIdx ? styles.dotDone : i === currentIdx ? styles.dotActive : styles.dot}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div style={styles.progressBar}>
              <div style={styles.progressFill(progressPct, false)} />
            </div>

            {/* Current challenge */}
            <div style={styles.challengeBox}>
              <div style={styles.challengeIcon}>{challenges[currentIdx].icon}</div>
              <div style={styles.challengeLabel}>{challenges[currentIdx].label}</div>
              <div style={styles.challengeHint}>{challenges[currentIdx].hint}</div>
            </div>

            {/* Timer */}
            <div style={timeLeft <= 2 ? styles.timerLow : styles.timer}>
              ⏱ {timeLeft}s
            </div>

            <video ref={videoRef} style={styles.video} muted />
            <canvas ref={canvasRef} style={styles.canvas} />

            <button style={styles.btn} onClick={handleManualCapture}>
              ✅ Done! Next Challenge
            </button>
            <button style={styles.btnRetry} onClick={handleFail}>
              ✗ Cancel
            </button>
          </>
        )}

        {/* SUCCESS */}
        {phase === "success" && (
          <>
            <div style={{ fontSize: "60px", margin: "20px 0" }}>✅</div>
            <div style={{ ...styles.status, ...styles.success }}>
              {status.msg}
            </div>
          </>
        )}

        {/* FAIL */}
        {phase === "fail" && (
          <>
            <div style={{ fontSize: "60px", margin: "20px 0" }}>❌</div>
            <div style={{ ...styles.status, ...styles.error }}>
              Liveness check fail ho gaya!
            </div>
            <button style={styles.btn} onClick={startLiveness}>
              🔄 Dobara Try Karo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default LivenessCheck;