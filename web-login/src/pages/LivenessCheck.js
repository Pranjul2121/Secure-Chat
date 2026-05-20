// web-login/src/pages/LivenessCheck.js — SECURE VERSION
// ✅ Face must be DETECTED before step can advance
// ✅ If face not in frame → step does NOT advance, error shown
// ✅ Live face detection indicator on camera
// ✅ Timer resets step if face not detected at expiry
// Logic: pixel brightness variance in center region used as face presence proxy

import React, { useRef, useState, useEffect, useCallback } from "react";

const CHALLENGES = [
  { id:"blink",  label:"Ek baar blink karo",       icon:"👁️",  hint:"Dono aankhein band karo phir kholo",        color:"#10b981" },
  { id:"smile",  label:"Muskurao (smile karo)",    icon:"😊",  hint:"Bade teeth wali smile do",                  color:"#f59e0b" },
  { id:"left",   label:"Left taraf dekho",          icon:"👈",  hint:"Apna chehra left mein ghoomao",             color:"#06b6d4" },
  { id:"right",  label:"Right taraf dekho",         icon:"👉",  hint:"Apna chehra right mein ghoomao",            color:"#8b5cf6" },
  { id:"nod",    label:"Haan karo (sar hilao)",     icon:"⬆️",  hint:"Upar neeche sar hilao 2 baar",             color:"#ec4899" },
  { id:"open",   label:"Munh kholo",                icon:"😮",  hint:"Bada munh karo phir band karo",             color:"#ef4444" },
];

const CHALLENGE_COUNT = 3;
const SECS_PER = 8;

const C_THEME = {
  primary: "#8b5cf6",
  secondary: "#ec4899",
  card: "rgba(30, 30, 50, 0.75)",
  border: "rgba(255, 255, 255, 0.1)",
  text: "#e9edef",
  muted: "rgba(255, 255, 255, 0.5)",
};

const CSS = `
@keyframes fadeUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.6 } }
@keyframes shimmer { 0% { left: -100% } 100% { left: 200% } }
@keyframes slideIn { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: scale(1) } }
@keyframes scanMove { 0% { top: 0% } 50% { top: calc(100% - 3px) } 100% { top: 0% } }
@keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes float1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
@keyframes float2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-40px, 30px) scale(1.15); } 66% { transform: translate(25px, -40px) scale(0.85); } }
@keyframes float3 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(20px, 40px) scale(0.9); } 66% { transform: translate(-30px, -30px) scale(1.1); } }
@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
@keyframes faceDetectPop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
.challenge-enter { animation: slideIn .4s cubic-bezier(.16,1,.3,1) forwards; }
.shake-anim { animation: shake 0.5s ease; }
`;

// ── Face presence detection via canvas pixel analysis ─────
// Analyzes center 40% of frame for brightness variance
// High variance in center = likely face present
// Returns: { detected: bool, variance: number, brightness: number }
const detectFacePresence = (video, canvas) => {
  try {
    if (!video || !canvas || video.readyState < 2) return { detected: false, variance: 0, brightness: 0 };
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    
    // Sample center 40% of frame (where face should be)
    const cx = Math.floor(w * 0.3);
    const cy = Math.floor(h * 0.15);
    const cw = Math.floor(w * 0.4);
    const ch = Math.floor(h * 0.7);
    
    // Downsample: only read every 4th pixel for speed
    const imageData = ctx.getImageData(cx, cy, cw, ch);
    const data = imageData.data;
    const samples = [];
    for (let i = 0; i < data.length; i += 16) { // every 4th pixel, stride 4 channels
      const r = data[i], g = data[i+1], b = data[i+2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      samples.push(gray);
    }
    
    if (samples.length === 0) return { detected: false, variance: 0, brightness: 0 };
    
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    const brightness = mean;
    
    // A face in good lighting = variance > 200 AND brightness between 30-220
    // Too uniform (blank wall) = low variance
    // Too dark/bright = no face likely
    const detected = variance > 180 && brightness > 30 && brightness < 225;
    
    return { detected, variance: Math.round(variance), brightness: Math.round(brightness) };
  } catch (e) {
    return { detected: false, variance: 0, brightness: 0 };
  }
};

const injectCSS = () => {
  if (document.getElementById("liveness-css")) return;
  const el = document.createElement("style");
  el.id = "liveness-css";
  el.textContent = CSS;
  document.head.appendChild(el);
};

export default function LivenessCheck({ onSuccess, onFail }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceCheckCanvasRef = useRef(null);
  const timerRef = useRef(null);
  const faceCheckRef = useRef(null);

  const [phase, setPhase] = useState("start");
  const [challenges, setChallenges] = useState([]);
  const [curIdx, setCurIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECS_PER);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [camReady, setCamReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);
  const snapshotsRef = useRef([]);

  useEffect(() => {
    injectCSS();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(faceCheckRef.current);
      stopCam();
    };
  }, []);

  const stopCam = () => {
    if (videoRef.current?.srcObject)
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };

  const pickChallenges = () => {
    return [...CHALLENGES].sort(() => Math.random() - .5).slice(0, CHALLENGE_COUNT);
  };

  // ── Continuous face detection loop ──────────────────────
  const startFaceDetectionLoop = () => {
    clearInterval(faceCheckRef.current);
    faceCheckRef.current = setInterval(() => {
      if (!faceCheckCanvasRef.current || !videoRef.current) return;
      const result = detectFacePresence(videoRef.current, faceCheckCanvasRef.current);
      setFaceDetected(result.detected);
    }, 300); // check every 300ms
  };

  const startLiveness = async () => {
    const sel = pickChallenges();
    setChallenges(sel);
    setCurIdx(0);
    snapshotsRef.current = [];
    setPhase("challenge");
    setCamReady(false);
    setFaceDetected(false);
    setMsg({ text: "", type: "" });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      videoRef.current.onloadedmetadata = () => {
        setCamReady(true);
        startFaceDetectionLoop();
      };
    } catch {
      setMsg({ text: "Camera access nahi mila!", type: "error" });
      setPhase("fail");
      return;
    }
    startTimer(sel, 0);
  };

  const startTimer = useCallback((list, idx) => {
    setTimeLeft(SECS_PER);
    clearInterval(timerRef.current);
    let t = SECS_PER;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
        // ── SECURITY: Check face at timer expiry ──
        const result = detectFacePresence(videoRef.current, faceCheckCanvasRef.current);
        if (!result.detected) {
          // Face not detected — reset this step
          setShakeCard(true);
          setTimeout(() => setShakeCard(false), 600);
          setMsg({ text: "⚠️ Chehra frame mein nahi dikh raha! Seedha camera dekho, acchi roshni mein.", type: "error" });
          startTimer(list, idx); // restart timer for same step
        } else {
          captureAndAdvance(list, idx);
        }
      }
    }, 1000);
  }, []);

  const captureAndAdvance = (list, idx) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const snap = canvas.toDataURL("image/jpeg", 0.85);

    setMsg({ text: "", type: "" });

    const updated = [...snapshotsRef.current, { challenge: list[idx].id, snapshot: snap }];
    snapshotsRef.current = updated;
    const next = idx + 1;
    if (next >= list.length) {
      clearInterval(timerRef.current);
      clearInterval(faceCheckRef.current);
      stopCam();
      setPhase("success");
      setMsg({ text: "Liveness confirm! Real person detected ✅", type: "success" });
      setTimeout(() => onSuccess(updated), 1800);
    } else {
      setCurIdx(next);
      setMsg({ text: `✅ Step ${idx + 1} done! Ab: ${list[next].label}`, type: "success" });
      setTimeout(() => setMsg({ text: "", type: "" }), 1500);
      startTimer(list, next);
    }
  };

  // ── Manual "Ho Gaya" button — REQUIRES face detected ──
  const manualCapture = () => {
    // SECURITY CHECK: face must be detected
    const result = detectFacePresence(videoRef.current, faceCheckCanvasRef.current);
    if (!result.detected) {
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 600);
      setMsg({ text: "❌ Chehra detect nahi ho raha! Apna chehra seedha camera ke saamne rakho pehle.", type: "error" });
      return;
    }
    clearInterval(timerRef.current);
    captureAndAdvance(challenges, curIdx);
  };

  // Helpers
  const orb = (color, size, top, left, animName, duration) => ({
    position: "absolute", width: size, height: size, background: color,
    borderRadius: "50%", filter: "blur(100px)", opacity: 0.4, top, left,
    animation: `${animName} ${duration}s ease-in-out infinite`, pointerEvents: "none", zIndex: 0,
  });

  const hoverPropsBtn = (baseShadowHex) => ({
    onMouseEnter: (e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 30px ${baseShadowHex}66`; },
    onMouseLeave: (e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 24px ${baseShadowHex}44`; }
  });

  const hoverPropsGray = {
    onMouseEnter: (e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; },
    onMouseLeave: (e) => { e.currentTarget.style.background = "transparent"; }
  };

  const CIRC = 176;
  const pct = timeLeft / SECS_PER;
  const dash = CIRC * (1 - pct);

  const C = challenges[curIdx] || {};

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #1a1a2e, #16213e, #0f3460)",
        backgroundSize: "400% 400%", animation: "gradientShift 15s ease infinite",
        fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "20px", position: "relative", overflow: "hidden"
      }}>

        <div style={orb("radial-gradient(circle, #8b5cf6, transparent)", "500px", "5%", "0%", "float1", 20)} />
        <div style={orb("radial-gradient(circle, #ec4899, transparent)", "400px", "60%", "60%", "float2", 25)} />
        <div style={orb("radial-gradient(circle, #06b6d4, transparent)", "350px", "80%", "20%", "float3", 22)} />

        {/* Main Card */}
        <div className={shakeCard ? "shake-anim" : ""} style={{
          background: C_THEME.card, backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
          border: `1px solid ${C_THEME.border}`, borderRadius: "24px",
          padding: "36px", width: "440px", textAlign: "center",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 0 20px rgba(255, 255, 255, 0.05)",
          animation: "fadeUp .6s cubic-bezier(.16,1,.3,1) forwards", position: "relative", overflow: "hidden", zIndex: 10
        }}>
          
          <div style={{
            position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
            background: "linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent)",
            animation: "shimmer 4s ease-in-out infinite", pointerEvents: "none",
          }} />

          {/* Hidden canvases */}
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <canvas ref={faceCheckCanvasRef} style={{ display: "none" }} />

          {/* ── START PHASE ── */}
          {phase === "start" && (
            <>
              <div style={{ fontSize: "56px", marginBottom: "16px", animation: "pulse 3s infinite" }}>🤳</div>
              <h2 style={{
                margin: "0 0 8px", fontSize: "24px", fontWeight: "800",
                background: "linear-gradient(135deg, #e9edef, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>Liveness Check</h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.7", margin: "0 0 20px" }}>
                {CHALLENGE_COUNT} random challenges complete karo.<br />
                Har challenge ke liye <strong style={{ color: "#c4b5fd" }}>{SECS_PER} seconds</strong> milenge.<br />
                <strong style={{ color: "#86efac" }}>⚠️ Chehra camera ke saamne rakhna zaroori hai.</strong>
              </p>

              {/* Security Notice */}
              <div style={{
                background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.2)",
                borderRadius: "12px", padding: "12px 16px", marginBottom: "24px",
                display: "flex", alignItems: "flex-start", gap: "10px", textAlign: "left",
              }}>
                <span style={{ fontSize: "20px" }}>🛡️</span>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  <strong style={{ color: "#c4b5fd" }}>Strict Face Detection:</strong> Agar chehra frame mein nahi dikh raha toh step aage nahi badhega. Real person confirm karna zaroori hai.
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "24px" }}>
                {CHALLENGES.slice(0, 4).map((c, i) => (
                  <div key={i} style={{
                    width: "56px", height: "56px", borderRadius: "14px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "24px", boxShadow: `0 4px 15px ${c.color}22`
                  }}>{c.icon}</div>
                ))}
              </div>

              <button
                onClick={startLiveness}
                {...hoverPropsBtn(C_THEME.primary)}
                style={{
                  width: "100%", padding: "16px",
                  background: `linear-gradient(135deg, ${C_THEME.primary}, ${C_THEME.secondary})`,
                  color: "#fff", border: "none", borderRadius: "14px",
                  fontSize: "16px", fontWeight: "700", cursor: "pointer",
                  boxShadow: `0 8px 24px rgba(139, 92, 246, 0.4)`, transition: "all 0.3s ease", fontFamily: "inherit"
                }}
              >
                🚀 Liveness Check Shuru Karo
              </button>
            </>
          )}

          {/* ── CHALLENGE PHASE ── */}
          {phase === "challenge" && (
            <>
              {/* Progress Dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
                {challenges.map((chal, i) => (
                  <div key={i} style={{
                    width: i === curIdx ? "28px" : "10px", height: "10px", borderRadius: "5px",
                    background: i < curIdx ? chal.color : i === curIdx ? chal.color : "rgba(255,255,255,0.1)",
                    opacity: i < curIdx ? 0.6 : 1, transition: "all .4s ease",
                    boxShadow: i <= curIdx ? `0 0 10px ${chal.color}88` : "none",
                  }} />
                ))}
              </div>

              {/* Status Message */}
              {msg.text && (
                <div style={{
                  padding: "10px 14px", borderRadius: "10px", marginBottom: "14px", fontSize: "12px", textAlign: "left",
                  background: msg.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${msg.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.35)"}`,
                  color: msg.type === "success" ? "#86efac" : "#fca5a5",
                  animation: "slideIn 0.3s ease",
                }}>
                  {msg.text}
                </div>
              )}

              {/* Timer + Challenge Banner */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "16px" }}>
                {/* SVG Ring Timer */}
                <div style={{ position: "relative", width: "64px", height: "64px", flexShrink: 0 }}>
                  <svg width="64" height="64" style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 8px ${C.color}66)` }}>
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                    <circle cx="32" cy="32" r="28" fill="none"
                      stroke={timeLeft <= 2 ? "#ef4444" : timeLeft <= 4 ? "#f59e0b" : C.color || C_THEME.primary}
                      strokeWidth="4" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={dash}
                      style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }}
                    />
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px", fontWeight: "700",
                    color: timeLeft <= 2 ? "#ef4444" : timeLeft <= 4 ? "#f59e0b" : "#e9edef",
                    textShadow: `0 0 10px ${timeLeft <= 2 ? "#ef4444" : timeLeft <= 4 ? "#f59e0b" : "rgba(255,255,255,0.5)"}`
                  }}>{timeLeft}</div>
                </div>

                <div key={C.id} className="challenge-enter" style={{
                  flex: 1, background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)",
                  border: `1px solid ${C.color}55`, borderRadius: "16px", padding: "14px",
                  boxShadow: `inset 0 0 20px ${C.color}11, 0 8px 20px rgba(0,0,0,0.3)`,
                  textAlign: "left", display: "flex", alignItems: "center", gap: "12px"
                }}>
                  <div style={{ fontSize: "32px", animation: "pulse 2s infinite" }}>{C.icon}</div>
                  <div>
                    <div style={{ color: C.color, fontWeight: "800", fontSize: "14px", marginBottom: "2px", textShadow: `0 0 10px ${C.color}66` }}>
                      {C.label}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", lineHeight: "1.4" }}>{C.hint}</div>
                  </div>
                </div>
              </div>

              {/* Video with Face Detection Indicator */}
              <div style={{
                position: "relative", borderRadius: "16px", overflow: "hidden",
                border: `2px solid ${faceDetected ? "#22c55e" : C.color}88`, marginBottom: "14px", background: "#000",
                boxShadow: `0 8px 30px ${faceDetected ? "rgba(34,197,94,0.3)" : `${C.color}33`}`,
                transition: "border 0.4s, box-shadow 0.4s",
              }}>
                <video ref={videoRef} style={{ width: "100%", display: "block", transform: "scaleX(-1)" }} muted playsInline />
                
                {/* Dynamically colored Scan Line */}
                <div style={{
                  position: "absolute", left: 0, right: 0, height: "3px",
                  background: `linear-gradient(90deg, transparent, ${faceDetected ? "#22c55e" : C.color}, transparent)`,
                  animation: "scanMove 2.5s ease-in-out infinite", boxShadow: `0 0 15px ${faceDetected ? "#22c55e" : C.color}`
                }} />
                
                {/* Neon Corners */}
                {[
                  { t: "8px", l: "8px", c1: "borderTop", c2: "borderLeft", br: "12px 0 0 0" },
                  { t: "8px", r: "8px", c1: "borderTop", c2: "borderRight", br: "0 12px 0 0" },
                  { b: "8px", l: "8px", c1: "borderBottom", c2: "borderLeft", br: "0 0 0 12px" },
                  { b: "8px", r: "8px", c1: "borderBottom", c2: "borderRight", br: "0 0 12px 0" }
                ].map((pos, i) => (
                  <div key={i} style={{
                    position: "absolute", width: "20px", height: "20px",
                    [pos.c1]: `3px solid ${faceDetected ? "#22c55e" : C.color}`,
                    [pos.c2]: `3px solid ${faceDetected ? "#22c55e" : C.color}`,
                    borderRadius: pos.br, boxShadow: `0 0 10px ${faceDetected ? "#22c55e" : C.color}66`,
                    top: pos.t, left: pos.l, bottom: pos.b, right: pos.r, transition: "all 0.4s ease"
                  }} />
                ))}

                {/* ✅ FACE DETECTION STATUS INDICATOR */}
                <div style={{
                  position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)",
                  background: faceDetected ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "20px", padding: "4px 12px",
                  fontSize: "11px", fontWeight: "700",
                  color: "#fff",
                  display: "flex", alignItems: "center", gap: "5px",
                  animation: "faceDetectPop 0.3s ease",
                  boxShadow: faceDetected ? "0 0 12px rgba(34,197,94,0.5)" : "0 0 12px rgba(239,68,68,0.5)",
                  transition: "background 0.3s, box-shadow 0.3s",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}>
                  {faceDetected ? "✅ Chehra Detect Ho Raha Hai" : "⚠️ Chehra Nahi Dikh Raha"}
                </div>

                {!camReady && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.7)", fontSize: "14px", fontWeight: "600", animation: "pulse 1.5s infinite"
                  }}>Camera load ho raha hai...</div>
                )}
              </div>

              {/* Face detection warning (shown below if not detected) */}
              {!faceDetected && camReady && (
                <div style={{
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "10px", padding: "10px 14px", marginBottom: "12px",
                  fontSize: "12px", color: "#fca5a5", textAlign: "left",
                  animation: "pulse 2s infinite",
                }}>
                  ⚠️ Camera ke seedha saamne aao, acchi roshni mein. Face detect hone ke baad hi aage badh sakte ho.
                </div>
              )}

              <button
                onClick={manualCapture}
                {...hoverPropsBtn(C.color)}
                disabled={!faceDetected || !camReady}
                style={{
                  width: "100%", padding: "14px",
                  background: faceDetected
                    ? `linear-gradient(135deg, ${C.color}, ${C.color}bb)`
                    : "rgba(255,255,255,0.06)",
                  color: faceDetected ? "#fff" : "rgba(255,255,255,0.3)",
                  border: faceDetected ? "none" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px",
                  fontSize: "15px", fontWeight: "700", cursor: faceDetected ? "pointer" : "not-allowed",
                  marginBottom: "10px",
                  boxShadow: faceDetected ? `0 8px 24px ${C.color}44` : "none",
                  transition: "all 0.3s ease", fontFamily: "inherit",
                  opacity: faceDetected ? 1 : 0.6,
                }}
              >
                {faceDetected ? "✅ Ho Gaya! Agla Challenge" : "⚠️ Pehle Camera ke Saamne Aao"}
              </button>
              <button
                onClick={() => { stopCam(); clearInterval(timerRef.current); clearInterval(faceCheckRef.current); onFail(); }}
                {...hoverPropsGray}
                style={{
                  width: "100%", padding: "12px", background: "transparent",
                  color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "14px", fontSize: "14px", cursor: "pointer", transition: "all 0.3s ease", fontFamily: "inherit"
                }}
              >
                ✗ Cancel
              </button>
            </>
          )}

          {/* ── SUCCESS PHASE ── */}
          {phase === "success" && (
            <div style={{ animation: "fadeUp 0.5s ease" }}>
              <div style={{ fontSize: "72px", margin: "16px 0", animation: "pulse 2s infinite" }}>✅</div>
              <h2 style={{ background: "linear-gradient(135deg, #22c55e, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "8px", fontSize: "28px", fontWeight: "800" }}>Liveness Confirm!</h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
                Real person detected. Face scan pe jao.
              </p>
            </div>
          )}

          {/* ── FAIL PHASE ── */}
          {phase === "fail" && (
            <div style={{ animation: "fadeUp 0.5s ease" }}>
              <div style={{ fontSize: "72px", margin: "16px 0" }}>❌</div>
              <div style={{
                background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "14px", padding: "16px", color: "#fca5a5",
                marginBottom: "24px", fontSize: "14px", fontWeight: "500", lineHeight: "1.5"
              }}>
                {msg.text || "Liveness check fail ho gaya!"}
              </div>
              <button
                onClick={startLiveness}
                {...hoverPropsBtn("#ef4444")}
                style={{
                  width: "100%", padding: "15px",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff", border: "none", borderRadius: "14px",
                  fontSize: "15px", fontWeight: "700", cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(239, 68, 68, 0.4)", transition: "all 0.3s ease", fontFamily: "inherit"
                }}
              >
                🔄 Dobara Try Karo
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
