// web-login/src/App.js
// PORT 3001 — Sirf Web Login Page
// Features: Face Login (Liveness → Face Scan → Face Password) + QR Login
// Yahan Chat nahi hai — login hone ke baad chat-app (port 3000) pe redirect hoga

import React, { useState } from "react";
import LandingPage from "./pages/LandingPage";
import FaceLogin from "./pages/FaceLogin";
import QRLogin from "./pages/QRLogin";

export default function App() {
  // mode: "landing" | "face" | "qr"
  const [mode, setMode] = useState("landing");

  const handleLoginSuccess = (userData) => {
    // Login hone ke baad → chat-app pe redirect karo
    // Token URL params mein pass karo (chat-app wahan se read karega)
    const chatUrl = `http://localhost:3000?token=${userData.token}&username=${userData.username}`;
    window.location.href = chatUrl;
  };

  if (mode === "face") return <FaceLogin onLogin={handleLoginSuccess} onBack={() => setMode("landing")} />;
  if (mode === "qr")   return <QRLogin   onLogin={handleLoginSuccess} onBack={() => setMode("landing")} />;
  return <LandingPage onFaceLogin={() => setMode("face")} onQRLogin={() => setMode("qr")} />;
}