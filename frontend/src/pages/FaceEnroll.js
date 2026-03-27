// chat-app/src/pages/FaceEnroll.js
// Face Enrollment with Premium Glassmorphism UI
import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const keyframes = `
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes scanLine {
  0% { top: 10%; }
  50% { top: 85%; }
  100% { top: 10%; }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}
@keyframes borderGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
  50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.4), 0 0 60px rgba(236, 72, 153, 0.2); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes successPop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes stepComplete {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
`;

const Icons = {
  Camera: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  Lock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Check: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Refresh: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  ),
  FaceID: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8v.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h.01" />
      <path d="M8 12h.01" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
};

const STEPS = [
  { icon: "camera", label: "Capture" },
  { icon: "lock", label: "Password" },
  { icon: "check", label: "Done" },
];

const s = {
  card: {
    background: "linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #1a1a2e)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "28px",
    padding: "36px 32px",
    width: "420px",
    maxHeight: "85vh",
    overflowY: "auto",
    textAlign: "center",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
    animation: "slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
    position: "relative",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  hideScrollbar: `
    .face-enroll-card::-webkit-scrollbar {
      display: none;
    }
  `,
  logoContainer: {
    width: "68px",
    height: "68px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
    boxShadow: "0 10px 40px rgba(139, 92, 246, 0.4)",
    color: "#fff",
    position: "relative",
  },
  logoRing: {
    position: "absolute",
    inset: "-4px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b, #8b5cf6)",
    backgroundSize: "300% 300%",
    animation: "spin 3s linear infinite",
    zIndex: -1,
    opacity: 0.6,
  },
  title: {
    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontSize: "22px",
    fontWeight: "800",
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "12px",
    margin: "0 0 24px",
    lineHeight: "1.6",
  },
  stepsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
    gap: "0",
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
  stepCircle: (active, completed) => ({
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: completed
      ? "linear-gradient(135deg, #22c55e, #10b981)"
      : active
      ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
      : "rgba(255, 255, 255, 0.08)",
    border: completed || active ? "none" : "2px solid rgba(255, 255, 255, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: completed || active ? "#fff" : "rgba(255, 255, 255, 0.4)",
    fontSize: "14px",
    fontWeight: "700",
    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: completed
      ? "0 6px 20px rgba(34, 197, 94, 0.4)"
      : active
      ? "0 6px 20px rgba(139, 92, 246, 0.4)"
      : "none",
    animation: completed ? "stepComplete 0.5s ease" : "none",
  }),
  stepLabel: (active, completed) => ({
    fontSize: "10px",
    fontWeight: "600",
    color: completed ? "#86efac" : active ? "#c4b5fd" : "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  }),
  stepLine: (completed) => ({
    width: "40px",
    height: "3px",
    margin: "0 6px 20px",
    borderRadius: "2px",
    background: completed
      ? "linear-gradient(90deg, #22c55e, #10b981)"
      : "rgba(255, 255, 255, 0.1)",
    transition: "all 0.4s ease",
  }),
  status: (type) => ({
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "16px",
    fontSize: "12px",
    lineHeight: "1.6",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background:
      type === "success"
        ? "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))"
        : type === "error"
        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))"
        : "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))",
    border:
      type === "success"
        ? "1px solid rgba(34, 197, 94, 0.3)"
        : type === "error"
        ? "1px solid rgba(239, 68, 68, 0.3)"
        : "1px solid rgba(139, 92, 246, 0.2)",
    color:
      type === "success"
        ? "#86efac"
        : type === "error"
        ? "#fca5a5"
        : "#c4b5fd",
    animation: "fadeIn 0.4s ease forwards",
    textAlign: "left",
  }),
  videoContainer: {
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    border: "2px solid rgba(139, 92, 246, 0.3)",
    marginBottom: "16px",
    background: "rgba(0, 0, 0, 0.3)",
  },
  video: {
    width: "100%",
    display: "block",
    borderRadius: "14px",
  },
  scanLine: {
    position: "absolute",
    left: "10%",
    right: "10%",
    height: "3px",
    background: "linear-gradient(90deg, transparent, #8b5cf6, #ec4899, transparent)",
    animation: "scanLine 2s ease-in-out infinite",
    borderRadius: "2px",
    boxShadow: "0 0 20px rgba(139, 92, 246, 0.6)",
  },
  cornerBracket: (position) => {
    const base = {
      position: "absolute",
      width: "28px",
      height: "28px",
      border: "3px solid #8b5cf6",
      pointerEvents: "none",
    };
    switch (position) {
      case "tl": return { ...base, top: "10px", left: "10px", borderRight: "none", borderBottom: "none", borderRadius: "8px 0 0 0" };
      case "tr": return { ...base, top: "10px", right: "10px", borderLeft: "none", borderBottom: "none", borderRadius: "0 8px 0 0" };
      case "bl": return { ...base, bottom: "10px", left: "10px", borderRight: "none", borderTop: "none", borderRadius: "0 0 0 8px" };
      case "br": return { ...base, bottom: "10px", right: "10px", borderLeft: "none", borderTop: "none", borderRadius: "0 0 8px 0" };
      default: return base;
    }
  },
  canvas: { display: "none" },
  capturedImg: {
    width: "100%",
    borderRadius: "16px",
    marginBottom: "16px",
    border: "2px solid rgba(34, 197, 94, 0.4)",
    boxShadow: "0 10px 40px rgba(34, 197, 94, 0.2)",
  },
  infoBox: {
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.05))",
    border: "1px solid rgba(139, 92, 246, 0.2)",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "16px",
    textAlign: "left",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  infoIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#c4b5fd",
    flexShrink: 0,
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "11px",
    lineHeight: "1.7",
  },
  infoTitle: {
    color: "#e9edef",
    fontWeight: "700",
    marginBottom: "4px",
    fontSize: "12px",
  },
  inputWrapper: {
    marginBottom: "12px",
    position: "relative",
  },
  input: {
    width: "100%",
    padding: "14px 16px 14px 44px",
    borderRadius: "12px",
    border: "2px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#e9edef",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
  },
  inputFocused: {
    border: "2px solid rgba(139, 92, 246, 0.5)",
    boxShadow: "0 0 20px rgba(139, 92, 246, 0.2)",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(255, 255, 255, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "10px",
    boxShadow: "0 10px 40px rgba(139, 92, 246, 0.4)",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    letterSpacing: "0.3px",
  },
  btnSecondary: {
    width: "100%",
    padding: "12px",
    background: "rgba(255, 255, 255, 0.05)",
    color: "rgba(255, 255, 255, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  successContainer: {
    padding: "24px 0",
    animation: "fadeIn 0.6s ease forwards",
  },
  successIcon: {
    width: "90px",
    height: "90px",
    borderRadius: "26px",
    background: "linear-gradient(135deg, #22c55e, #10b981)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    color: "#fff",
    boxShadow: "0 15px 50px rgba(34, 197, 94, 0.4)",
    animation: "successPop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
  },
  successTitle: {
    background: "linear-gradient(135deg, #22c55e, #10b981)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontSize: "20px",
    fontWeight: "800",
    marginBottom: "8px",
  },
  successSub: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "13px",
    lineHeight: "1.6",
  },
};

export default function FaceEnroll({ user, onDone }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [step, setStep] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);
  const [facePass, setFacePass] = useState("");
  const [facePassC, setFacePassC] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [focused, setFocused] = useState(null);
  const [btnHover, setBtnHover] = useState(null);
  const BASE = "http://127.0.0.1:8000";

  useEffect(() => () => stopCam(), []);

  const stopCam = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setStreaming(true);
      setStatus({ msg: "Camera ready! Chehra frame mein seedha rakho.", type: "info" });
    } catch {
      setStatus({ msg: "Camera access denied! Browser mein allow karo.", type: "error" });
    }
  };

  const capturePhoto = () => {
    if (!streaming) {
      setStatus({ msg: "Pehle camera shuru karo!", type: "error" });
      return;
    }
    const cv = canvasRef.current,
      vd = videoRef.current;
    cv.width = vd.videoWidth;
    cv.height = vd.videoHeight;
    cv.getContext("2d").drawImage(vd, 0, 0);
    setCapturedImg(cv.toDataURL("image/jpeg", 0.95));
    stopCam();
    setStep(1);
    setStatus({ msg: "Chehra capture ho gaya! Ab face password set karo.", type: "success" });
  };

  const handleEnroll = async () => {
    if (!facePass || facePass.length < 4) {
      setStatus({ msg: "Face password kam se kam 4 characters ka hona chahiye!", type: "error" });
      return;
    }
    if (facePass !== facePassC) {
      setStatus({ msg: "Dono passwords match nahi kar rahe!", type: "error" });
      return;
    }
    setLoading(true);
    setStatus({ msg: "Face enroll ho raha hai...", type: "info" });
    try {
      const res = await axios.post(`${BASE}/enroll-face`, {
        username: user.username,
        image: capturedImg,
        face_password: facePass,
      });
      setStatus({ msg: res.data.message, type: "success" });
      setStep(2);
      setTimeout(() => onDone(), 2500);
    } catch (err) {
      const d = err.response?.data?.detail;
      const msg = typeof d === "string" ? d : Array.isArray(d) ? d[0]?.msg || "Error" : d?.msg || "Enrollment fail!";
      setStatus({ msg, type: "error" });
    }
    setLoading(false);
  };

  const retake = async () => {
    setCapturedImg(null);
    setStep(0);
    setStatus({ msg: "", type: "" });
    await startCam();
  };

  const handleSkip = () => {
    stopCam();
    onDone();
  };

  const getStepIcon = (icon) => {
    switch (icon) {
      case "camera": return <Icons.Camera />;
      case "lock": return <Icons.Lock />;
      case "check": return <Icons.Check />;
      default: return null;
    }
  };

  return (
    <>
      <style>{keyframes}{s.hideScrollbar}</style>
      <div style={s.card} className="face-enroll-card">
        {/* Logo */}
        <div style={s.logoContainer}>
          <div style={s.logoRing} />
          <Icons.FaceID />
        </div>

        <h2 style={s.title}>Face Enroll Karo</h2>
        <p style={s.subtitle}>
          Face + alag password set karo - phir web pe login karo bina mobile ke
        </p>

        {/* Steps Indicator */}
        <div style={s.stepsContainer}>
          {STEPS.map((stepData, i) => (
            <React.Fragment key={i}>
              <div style={s.stepItem}>
                <div style={s.stepCircle(i === step, i < step)}>
                  {i < step ? <Icons.Check /> : getStepIcon(stepData.icon)}
                </div>
                <span style={s.stepLabel(i === step, i < step)}>{stepData.label}</span>
              </div>
              {i < STEPS.length - 1 && <div style={s.stepLine(i < step)} />}
            </React.Fragment>
          ))}
        </div>

        {/* Status Message */}
        {status.msg && (
          <div style={s.status(status.type)}>
            {status.type === "success" ? <Icons.Check /> : status.type === "error" ? "!" : <Icons.Info />}
            {status.msg}
          </div>
        )}

        {/* STEP 0: Camera */}
        {step === 0 && (
          <>
            <div style={s.videoContainer}>
              <video ref={videoRef} style={s.video} muted playsInline />
              {streaming && (
                <>
                  <div style={s.scanLine} />
                  <div style={s.cornerBracket("tl")} />
                  <div style={s.cornerBracket("tr")} />
                  <div style={s.cornerBracket("bl")} />
                  <div style={s.cornerBracket("br")} />
                </>
              )}
            </div>
            <canvas ref={canvasRef} style={s.canvas} />

            {!streaming ? (
              <button
                style={{
                  ...s.btnPrimary,
                  ...(btnHover === "start" ? { transform: "translateY(-3px)", boxShadow: "0 15px 50px rgba(139, 92, 246, 0.5)" } : {}),
                }}
                onClick={startCam}
                onMouseEnter={() => setBtnHover("start")}
                onMouseLeave={() => setBtnHover(null)}
              >
                <Icons.Camera />
                Camera Shuru Karo
              </button>
            ) : (
              <button
                style={{
                  ...s.btnPrimary,
                  background: "linear-gradient(135deg, #22c55e, #10b981)",
                  boxShadow: "0 10px 40px rgba(34, 197, 94, 0.4)",
                  ...(btnHover === "capture" ? { transform: "translateY(-3px)", boxShadow: "0 15px 50px rgba(34, 197, 94, 0.5)" } : {}),
                }}
                onClick={capturePhoto}
                onMouseEnter={() => setBtnHover("capture")}
                onMouseLeave={() => setBtnHover(null)}
              >
                <Icons.Check />
                Chehra Capture Karo
              </button>
            )}

            <button
              style={{
                ...s.btnSecondary,
                ...(btnHover === "skip" ? { background: "rgba(255, 255, 255, 0.1)", color: "#fff" } : {}),
              }}
              onClick={handleSkip}
              onMouseEnter={() => setBtnHover("skip")}
              onMouseLeave={() => setBtnHover(null)}
            >
              Abhi Nahi - Baad Mein Karna
            </button>
          </>
        )}

        {/* STEP 1: Password */}
        {step === 1 && (
          <>
            {capturedImg && <img src={capturedImg} alt="face" style={s.capturedImg} />}

            <div style={s.infoBox}>
              <div style={s.infoIcon}>
                <Icons.Shield />
              </div>
              <div>
                <div style={s.infoTitle}>Face Password kya hai?</div>
                <div style={s.infoText}>
                  Sirf face login ke liye - account password se alag rakho. Yeh extra security ke liye hai.
                </div>
              </div>
            </div>

            <div style={s.inputWrapper}>
              <div style={s.inputIcon}>
                <Icons.Lock />
              </div>
              <input
                style={{
                  ...s.input,
                  ...(focused === "fp" ? s.inputFocused : {}),
                }}
                type="password"
                placeholder="Face Password (min 4 chars)"
                value={facePass}
                onChange={(e) => setFacePass(e.target.value)}
                onFocus={() => setFocused("fp")}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div style={s.inputWrapper}>
              <div style={s.inputIcon}>
                <Icons.Lock />
              </div>
              <input
                style={{
                  ...s.input,
                  ...(focused === "fpc" ? s.inputFocused : {}),
                }}
                type="password"
                placeholder="Confirm Face Password"
                value={facePassC}
                onChange={(e) => setFacePassC(e.target.value)}
                onFocus={() => setFocused("fpc")}
                onBlur={() => setFocused(null)}
                onKeyDown={(e) => e.key === "Enter" && handleEnroll()}
              />
            </div>

            <button
              style={{
                ...s.btnPrimary,
                ...(loading ? { opacity: 0.7, cursor: "not-allowed" } : {}),
                ...(btnHover === "enroll" && !loading ? { transform: "translateY(-3px)", boxShadow: "0 15px 50px rgba(139, 92, 246, 0.5)" } : {}),
              }}
              onClick={handleEnroll}
              disabled={loading}
              onMouseEnter={() => setBtnHover("enroll")}
              onMouseLeave={() => setBtnHover(null)}
            >
              {loading ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>@</span>
                  Enrolling...
                </>
              ) : (
                <>
                  <Icons.Check />
                  Enroll Karo
                </>
              )}
            </button>

            <button
              style={{
                ...s.btnSecondary,
                ...(btnHover === "retake" ? { background: "rgba(255, 255, 255, 0.1)", color: "#fff" } : {}),
              }}
              onClick={retake}
              onMouseEnter={() => setBtnHover("retake")}
              onMouseLeave={() => setBtnHover(null)}
            >
              <Icons.Refresh />
              Photo Dobara Lo
            </button>
          </>
        )}

        {/* STEP 2: Done */}
        {step === 2 && (
          <div style={s.successContainer}>
            <div style={s.successIcon}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={s.successTitle}>Face Enroll Complete!</div>
            <p style={s.successSub}>
              Ab web login page se face + password se login kar sakte ho.
            </p>
          </div>
        )}
      </div>
    </>
  );
}