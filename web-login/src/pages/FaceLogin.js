// web-login/src/pages/FaceLogin.js — FIXED + PREMIUM UI
// FIX: image mirror problem fixed — same orientation as enrollment
// LOGIC STRUCTURE SAME — sirf UI improved + bug fixed + Left corner back button

import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import LivenessCheck from "./LivenessCheck";

// ── Keyframes ──────────────────────────────────────────────
const KF = `
@keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.6} }
@keyframes scanLine { 0%{top:0%} 50%{top:calc(100% - 3px)} 100%{top:0%} }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes shimmer { 0%{left:-100%} 100%{left:200%} }
@keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(139, 92, 246, 0.2)} 50%{box-shadow:0 0 40px rgba(139, 92, 246, 0.5)} }
@keyframes stepIn { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
@keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes float1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
@keyframes float2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-40px, 30px) scale(1.15); } 66% { transform: translate(25px, -40px) scale(0.85); } }
@keyframes float3 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(20px, 40px) scale(0.9); } 66% { transform: translate(-30px, -30px) scale(1.1); } }
`;

const C = {
  primary:      "#8b5cf6",
  primaryHover: "#7c3aed",
  secondary:    "#ec4899",
  bg:           "#0b1117",
  card:         "rgba(30, 30, 50, 0.75)",
  card2:        "rgba(255, 255, 255, 0.05)",
  border:       "rgba(255, 255, 255, 0.1)",
  borderFocus:  "rgba(139, 92, 246, 0.5)",
  text:         "#e9edef",
  muted:        "rgba(255, 255, 255, 0.5)",
  red:          "#ef4444",
  success:      "#22c55e",
  amber:        "#f59e0b",
};

const s = {
  page: {
    minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
    background: "linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #1a1a2e, #16213e, #0f3460)",
    backgroundSize: "400% 400%", animation: "gradientShift 15s ease infinite",
    fontFamily:"'Segoe UI', system-ui, sans-serif", padding:"20px", position:"relative", overflow:"hidden"
  },
  orb: (color, size, top, left, animName, duration) => ({
    position: "absolute", width: size, height: size, background: color,
    borderRadius: "50%", filter: "blur(100px)", opacity: 0.4, top, left,
    animation: `${animName} ${duration}s ease-in-out infinite`, pointerEvents: "none", zIndex: 0,
  }),
  card: {
    background: C.card, backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
    border:`1px solid ${C.border}`, borderRadius:"24px", padding:"40px 36px", width:"420px",
    boxShadow:"0 32px 80px rgba(0,0,0,0.6), inset 0 0 20px rgba(255, 255, 255, 0.05)",
    animation:"fadeUp .6s cubic-bezier(.16,1,.3,1) forwards",
    position:"relative", overflow:"hidden", zIndex: 10
  },
  cardGlow: {
    position:"absolute", top:0, left:"-100%", width:"50%", height:"100%",
    background:"linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent)",
    animation:"shimmer 4s ease-in-out infinite", pointerEvents:"none",
  },
  logo: {
    width:"56px", height:"56px", borderRadius:"16px",
    background:`linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:"28px", margin:"0 auto 20px", boxShadow:`0 8px 24px rgba(139, 92, 246, 0.4)`,
    animation: "pulse 3s infinite"
  },
  title: { 
    fontSize:"24px", fontWeight:"800", textAlign:"center", marginBottom:"6px",
    background: "linear-gradient(135deg, #e9edef, #c4b5fd)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  sub: { color:C.muted, fontSize:"13px", textAlign:"center", marginBottom:"28px" },

  // Steps bar
  stepsRow: { display:"flex", alignItems:"center", justifyContent:"center", gap:"0", marginBottom:"32px" },
  stepItem: (active, done) => ({
    display:"flex", flexDirection:"column", alignItems:"center", gap:"6px",
    opacity: done || active ? 1 : 0.4, transform: active ? "scale(1.05)" : "scale(1)", transition: "all 0.3s ease"
  }),
  stepCircle: (active, done) => ({
    width:"36px", height:"36px", borderRadius:"12px",
    background: done ? `linear-gradient(135deg, ${C.primary}, ${C.secondary})` : active ? "rgba(139, 92, 246, 0.1)" : C.card2,
    border: active ? `2px solid ${C.primary}` : done ? "none" : `2px solid ${C.border}`,
    display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:"600",
    color: done ? "#fff" : active ? "#c4b5fd" : C.muted,
    animation: active ? "glow 2s ease-in-out infinite" : "none", transition:"all .4s",
    boxShadow: done ? "0 4px 15px rgba(139, 92, 246, 0.4)" : "none"
  }),
  stepLabel: (active, done) => ({
    fontSize:"11px", color: active ? "#c4b5fd" : done ? C.text : C.muted, fontWeight: active ? "600" : "500",
  }),
  stepLine: (done) => ({
    flex:1, height:"3px", margin:"0 8px", marginBottom:"22px", borderRadius: "2px",
    background: done ? `linear-gradient(90deg, ${C.primary}, ${C.secondary})` : C.border,
    transition:"background .4s", boxShadow: done ? "0 0 10px rgba(139, 92, 246, 0.3)" : "none"
  }),

  // Inputs
  input: {
    width:"100%", padding:"14px 18px", borderRadius:"14px", border:`2px solid ${C.border}`, background:C.card2,
    color:C.text, fontSize:"15px", boxSizing:"border-box", outline:"none", transition:"all .3s ease",
    marginBottom:"14px", fontFamily:"inherit",
  },
  inputFocus: { border:`2px solid ${C.borderFocus}`, boxShadow:`0 0 20px rgba(139, 92, 246, 0.2)` },

  // Buttons
  btnPrimary: {
    width:"100%", padding:"15px", background:`linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
    color:"#fff", border:"none", borderRadius:"14px", fontSize:"15px", fontWeight:"700", cursor:"pointer", marginBottom:"12px",
    boxShadow:"0 8px 24px rgba(139, 92, 246, 0.4)", transition:"all 0.3s ease", fontFamily:"inherit",
  },
  btnGray: {
    width:"100%", padding:"14px", background:"transparent", color:C.muted, border:`1px solid ${C.border}`,
    borderRadius:"14px", fontSize:"14px", cursor:"pointer", marginBottom:"8px", fontFamily:"inherit", transition:"all .3s ease",
  },

  // Video Premium Scan Frame
  videoWrap: { 
    position:"relative", marginBottom:"16px", borderRadius:"16px", overflow:"hidden", 
    border: `2px solid rgba(139, 92, 246, 0.4)`, boxShadow: "0 4px 25px rgba(139, 92, 246, 0.2)", background: "#000" 
  },
  video: { width:"100%", borderRadius:"14px", display:"block", objectFit: "cover" },
  scanOverlay: {
    position:"absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60%", height: "60%",
    border:`2px solid rgba(255,255,255,0.1)`, borderRadius:"16px", boxShadow:`0 0 0 9999px rgba(0,0,0,0.5)`,
  },
  scanBar: {
    position:"absolute", top: 0, left:0, right:0, height:"3px",
    background:`linear-gradient(90deg,transparent, #c4b5fd, transparent)`,
    animation:"scanLine 2s linear infinite", boxShadow: "0 0 10px #c4b5fd", borderRadius: "2px"
  },
  cornerTL: { position:"absolute", top:"-2px", left:"-2px", width:"24px", height:"24px", borderTop:`3px solid ${C.primary}`, borderLeft:`3px solid ${C.primary}`, borderRadius:"16px 0 0 0" },
  cornerTR: { position:"absolute", top:"-2px", right:"-2px", width:"24px", height:"24px", borderTop:`3px solid ${C.primary}`, borderRight:`3px solid ${C.primary}`, borderRadius:"0 16px 0 0" },
  cornerBL: { position:"absolute", bottom:"-2px", left:"-2px", width:"24px", height:"24px", borderBottom:`3px solid ${C.primary}`, borderLeft:`3px solid ${C.primary}`, borderRadius:"0 0 0 16px" },
  cornerBR: { position:"absolute", bottom:"-2px", right:"-2px", width:"24px", height:"24px", borderBottom:`3px solid ${C.primary}`, borderRight:`3px solid ${C.primary}`, borderRadius:"0 0 16px 0" },

  canvas: { display:"none" },

  // Status
  status: (type) => ({
    padding:"12px 16px", borderRadius:"12px", marginBottom:"16px", fontSize:"13px", lineHeight:"1.5",
    background: type==="success" ? "rgba(34, 197, 94, 0.1)" : type==="error" ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.05)",
    border: `1px solid ${type==="success" ? "rgba(34, 197, 94, 0.3)" : type==="error" ? "rgba(239, 68, 68, 0.3)" : C.border}`,
    color: type==="success" ? "#86efac" : type==="error" ? "#fca5a5" : C.text,
    animation:"stepIn .3s ease",
  }),

  // Similarity bar
  simBar: { height:"6px", borderRadius:"3px", background:C.card2, marginTop:"10px", overflow:"hidden", boxShadow: "inset 0 0 4px rgba(0,0,0,0.5)" },
  simFill: (p) => ({
    height:"100%", borderRadius:"3px", transition:"width .6s cubic-bezier(.16,1,.3,1)", width:`${p}%`,
    background: p>=70 ? `linear-gradient(90deg, #22c55e, #10b981)` : p>=50 ? `linear-gradient(90deg, #f59e0b, #fbbf24)` : `linear-gradient(90deg, #ef4444, #f87171)`,
    boxShadow: p>=70 ? "0 0 10px rgba(34, 197, 94, 0.5)" : "none"
  }),

  backLink: { textAlign:"center", marginTop:"16px", color:C.muted, fontSize:"13px", cursor:"pointer", transition: "color 0.3s" },
  backSpan: { color:"#c4b5fd", textDecoration:"underline", fontWeight: "600" },

  // Security badge
  secBadge: {
    display:"flex", alignItems:"center", gap:"10px",
    background:"rgba(139, 92, 246, 0.08)", border:`1px solid rgba(139, 92, 246, 0.2)`,
    borderRadius:"12px", padding:"12px 16px", marginBottom:"24px", color:C.muted, fontSize:"12px", lineHeight: "1.5"
  },
};

export default function FaceLogin({ onLogin, onBack }) {
  const [stage, setStage]             = useState("username");
  const [username, setUsername]       = useState("");
  const [faceTempToken, setFaceTempToken] = useState("");
  const [facePass, setFacePass]       = useState("");
  const [streaming, setStreaming]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [similarity, setSimilarity]   = useState(null);
  const [status, setStatus]           = useState({ msg:"", type:"" });
  const [focusedInput, setFocusedInput] = useState(null);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const BASE = "http://127.0.0.1:8000";

  useEffect(() => () => stopCam(), []);

  const stopCam = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  // ── Step 1: Username check ─────────────────────────────
  const handleUsernameNext = async () => {
    if (!username.trim()) { setStatus({ msg:"Username dalo!", type:"error" }); return; }
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/face-status/${username}`);
      if (!res.data.enrolled) {
        setStatus({ msg:"Is user ka face enroll nahi hai! Pehle chat app se enroll karo.", type:"error" });
      } else {
        setStage("liveness");
        setStatus({ msg:"", type:"" });
      }
    } catch {
      setStatus({ msg:"User nahi mila! Username check karo.", type:"error" });
    }
    setLoading(false);
  };

  // ── Step 2: Liveness done ──────────────────────────────
  const handleLivenessDone = () => {
    setStage("face_scan");
    setStatus({ msg:"Liveness pass! Camera se face scan karo.", type:"success" });
  };

  // ── Step 3: Camera ─────────────────────────────────────
  const startCam = async () => {
    try {
      stopCam();
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ width:640, height:480 } });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreaming(true);
      setStatus({ msg:"Camera ready! Chehra seedha rakho aur scan karo.", type:"info" });
    } catch {
      setStatus({ msg:"Camera allow karo browser mein!", type:"error" });
    }
  };

  // ── Step 3: Face scan ─────────────────────────────────
  // BUG FIX: NO mirror flip — same as enrollment (no ctx.scale(-1,1))
  const scanFace = async () => {
    if (!streaming || loading) return;
    const cv = canvasRef.current;
    const vd = videoRef.current;
    cv.width  = vd.videoWidth;
    cv.height = vd.videoHeight;

    // ✅ FIX: draw WITHOUT mirror — same as how face_utils.py processes
    const ctx = cv.getContext("2d");
    ctx.drawImage(vd, 0, 0);  // No flip — enrollment bhi flip nahi karta

    // Send full base64 with header — backend splits on ","
    const img = cv.toDataURL("image/jpeg", 0.95);

    setLoading(true);
    setStatus({ msg:"Face scan ho raha hai...", type:"info" });
    setSimilarity(null);

    try {
      const res = await axios.post(`${BASE}/face-login/verify-face`, {
        username,
        image: img,   // Full base64 with data:image/jpeg;base64, prefix
      });
      setSimilarity(res.data.similarity);
      setFaceTempToken(res.data.face_temp_token);
      stopCam();
      setStreaming(false);
      setStage("face_password");
      setStatus({ msg:`✅ Face match! Similarity: ${res.data.similarity}%`, type:"success" });
    } catch (err) {
      const d = err.response?.data?.detail;
      const msg = typeof d === "string" ? d : d?.msg || "Face match nahi hua! Phir se try karo.";
      setStatus({ msg, type:"error" });
    }
    setLoading(false);
  };

  // ── Step 4: Face password ──────────────────────────────
  const submitFacePassword = async () => {
    if (!facePass) { setStatus({ msg:"Face password dalo!", type:"error" }); return; }
    setLoading(true);
    setStatus({ msg:"Verify ho raha hai...", type:"info" });
    try {
      const res = await axios.post(`${BASE}/face-login/verify-password`, {
        username, face_token: faceTempToken, face_password: facePass,
      });
      setStatus({ msg:"✅ Login successful!", type:"success" });
      setTimeout(() => onLogin({ username: res.data.username, token: res.data.access_token }), 800);
    } catch (err) {
      const d = err.response?.data?.detail;
      const msg = typeof d === "string" ? d : d?.msg || "Password galat hai!";
      setStatus({ msg, type:"error" });
    }
    setLoading(false);
  };

  // Helper logic for Buttons
  const hoverPropsPrimary = {
    onMouseEnter: (e) => { 
      if (!loading && !e.currentTarget.disabled) {
        e.currentTarget.style.transform = "translateY(-2px)"; 
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(139, 92, 246, 0.5)";
      }
    },
    onMouseLeave: (e) => { 
      if (!loading && !e.currentTarget.disabled) {
        e.currentTarget.style.transform = "translateY(0)"; 
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(139, 92, 246, 0.4)";
      }
    }
  };

  const hoverPropsGray = {
    onMouseEnter: (e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; },
    onMouseLeave: (e) => { e.currentTarget.style.background = "transparent"; }
  };

  // ── Stage indexes for step bar ─────────────────────────
  const STAGES = ["username","liveness","face_scan","face_password"];
  const curIdx  = STAGES.indexOf(stage);
  const LABELS  = ["User","Liveness","Face","Password"];
  const ICONS   = ["👤","👁️","🔍","🔐"];

  // Liveness renders separately (full page component)
  if (stage === "liveness") {
    return (
      <LivenessCheck
        onSuccess={handleLivenessDone}
        onFail={() => { setStage("username"); setStatus({ msg:"Liveness fail! Dobara try karo.", type:"error" }); }}
      />
    );
  }

  return (
    <>
      <style>{KF}</style>
      <div style={s.page}>

        {/* Animated Background Orbs */}
        <div style={s.orb("radial-gradient(circle, #8b5cf6, transparent)", "500px", "5%", "0%", "float1", 20)} />
        <div style={s.orb("radial-gradient(circle, #ec4899, transparent)", "400px", "60%", "60%", "float2", 25)} />
        <div style={s.orb("radial-gradient(circle, #06b6d4, transparent)", "350px", "80%", "20%", "float3", 22)} />

        {/* Left Corner Floating Back Button */}
        <button 
          onClick={onBack} 
          style={{
            position: "absolute", top: "24px", left: "24px",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#e9edef", padding: "12px 18px", borderRadius: "14px",
            display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
            backdropFilter: "blur(10px)", transition: "all 0.3s ease", zIndex: 100,
            fontSize: "14px", fontWeight: "600", fontFamily: "inherit"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform="translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform="translateY(0)"; }}
        >
          <span>←</span> Landing Page
        </button>

        <div style={s.card}>
          <div style={s.cardGlow} />

          {/* Logo */}
          <div style={s.logo}>🪪</div>
          <div style={s.title}>Face Login</div>
          <div style={s.sub}>4-step biometric authentication</div>

          {/* Step bar */}
          <div style={s.stepsRow}>
            {LABELS.map((lbl, i) => (
              <React.Fragment key={i}>
                <div style={s.stepItem(i===curIdx, i<curIdx)}>
                  <div style={s.stepCircle(i===curIdx, i<curIdx)}>
                    {i < curIdx ? "✓" : ICONS[i]}
                  </div>
                  <span style={s.stepLabel(i===curIdx, i<curIdx)}>{lbl}</span>
                </div>
                {i < LABELS.length-1 && <div style={s.stepLine(i < curIdx)} />}
              </React.Fragment>
            ))}
          </div>

          {/* Status Alert with Similarity Bar */}
          {status.msg && (
            <div style={s.status(status.type)}>
              {status.msg}
              {similarity !== null && (
                <div style={s.simBar}><div style={s.simFill(similarity)} /></div>
              )}
            </div>
          )}

          {/* ── STAGE: username ── */}
          {stage === "username" && (
            <div style={{ animation: "stepIn 0.4s ease forwards" }}>
              <div style={s.secBadge}>
                <span style={{ fontSize: "20px" }}>🛡️</span>
                <span>Face + Password — double layer security. Mobile ki zaroorat nahi.</span>
              </div>
              <input
                style={{ ...s.input, ...(focusedInput==="u" ? s.inputFocus : {}) }}
                placeholder="Apna username likho"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setFocusedInput("u")}
                onBlur={() => setFocusedInput(null)}
                onKeyDown={e => e.key==="Enter" && handleUsernameNext()}
              />
              <button style={s.btnPrimary} onClick={handleUsernameNext} disabled={loading} {...hoverPropsPrimary}>
                {loading ? "Check ho raha hai..." : "Aage Badho →"}
              </button>
              <div 
                style={s.backLink} 
                onClick={onBack}
                onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
                onMouseLeave={(e) => e.currentTarget.style.color = C.muted}
              >
                ← <span style={s.backSpan}>Password se login karo</span>
              </div>
            </div>
          )}

          {/* ── STAGE: face_scan ── */}
          {stage === "face_scan" && (
            <div style={{ animation: "stepIn 0.4s ease forwards" }}>
              <div style={s.videoWrap}>
                <video ref={videoRef} style={s.video} muted playsInline />
                {streaming && (
                  <div style={s.scanOverlay}>
                    <div style={s.scanBar} />
                    <div style={s.cornerTL} />
                    <div style={s.cornerTR} />
                    <div style={s.cornerBL} />
                    <div style={s.cornerBR} />
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} style={s.canvas} />

              {!streaming ? (
                <button style={s.btnPrimary} onClick={startCam} {...hoverPropsPrimary}>📷 Camera Shuru Karo</button>
              ) : (
                <button style={s.btnPrimary} onClick={scanFace} disabled={loading} {...hoverPropsPrimary}>
                  {loading
                    ? <span>⏳ Scan ho raha hai...</span>
                    : "🔍 Face Scan Karo"}
                </button>
              )}
              <button style={s.btnGray} onClick={() => { stopCam(); setStage("username"); }} {...hoverPropsGray}>
                ← Wapas Jao
              </button>
            </div>
          )}

          {/* ── STAGE: face_password ── */}
          {stage === "face_password" && (
            <div style={{ animation: "stepIn 0.4s ease forwards" }}>
              <div style={{
                background:"rgba(139, 92, 246, 0.08)", border:`1px solid rgba(139, 92, 246, 0.2)`,
                borderRadius:"12px", padding:"14px 16px", marginBottom:"18px",
                color:C.muted, fontSize:"13px", lineHeight:"1.6"
              }}>
                <span style={{ fontSize: "18px", verticalAlign: "middle" }}>🔐</span> <strong style={{color:"#c4b5fd", verticalAlign: "middle", marginLeft: "4px"}}>Face verify ho gaya!</strong><br/>
                <span style={{ display: "block", marginTop: "6px" }}>Ab woh password dalo jo tumne face enroll karte waqt set kiya tha.</span>
              </div>
              <input
                style={{ ...s.input, ...(focusedInput==="fp" ? s.inputFocus : {}) }}
                type="password"
                placeholder="Face Password"
                value={facePass}
                onChange={e => setFacePass(e.target.value)}
                onFocus={() => setFocusedInput("fp")}
                onBlur={() => setFocusedInput(null)}
                onKeyDown={e => e.key==="Enter" && submitFacePassword()}
              />
              <button style={s.btnPrimary} onClick={submitFacePassword} disabled={loading} {...hoverPropsPrimary}>
                {loading ? "Verify ho raha hai..." : "🔓 Login Karo"}
              </button>
              <button style={s.btnGray} onClick={() => {
                setStage("face_scan"); setFacePass(""); setFaceTempToken("");
                setSimilarity(null); setStatus({ msg:"", type:"" });
              }} {...hoverPropsGray}>
                ← Dobara Face Scan Karo
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
