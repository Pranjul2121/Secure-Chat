import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import FaceEnroll from "./FaceEnroll";
import QRScanner from "./QRScanner";

const keyframes = `
@keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes float1 { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-50px) scale(1.1); } 66% { transform: translate(-20px,20px) scale(0.9); } }
@keyframes float2 { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-40px,30px) scale(1.15); } 66% { transform: translate(25px,-40px) scale(0.85); } }
@keyframes float3 { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(20px,40px) scale(0.9); } 66% { transform: translate(-30px,-30px) scale(1.1); } }
@keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } }
@keyframes messagePop { 0% { opacity: 0; transform: scale(0.8) translateY(10px); } 50% { transform: scale(1.02) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes onlinePulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.7); } 50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(34,197,94,0); } }
@keyframes modalIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes scanLine { 0%, 100% { top: 20%; } 50% { top: 70%; } }
@keyframes facePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.6); } 50% { box-shadow: 0 0 0 12px rgba(139,92,246,0); } }
@keyframes recording { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
@keyframes emojiPop { 0% { transform: scale(0) rotate(-180deg); opacity: 0; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
`;

const Icons = {
  QRScanner: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="3" height="3" rx="0.5"/><rect x="14" y="7" width="3" height="3" rx="0.5"/><rect x="7" y="14" width="3" height="3" rx="0.5"/><path d="M14 14h3v3"/></svg>,
  VideoCall: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>,
  VoiceCall: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Mic: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  Emoji: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>,
  Send: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  FaceID: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="4"/><path d="M12 8v.01"/><path d="M12 16v.01"/><path d="M16 12h.01"/><path d="M8 12h.01"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

const emojis = ["😀","😂","😍","🥰","😎","🤩","😢","😭","😡","🥺","👍","👎","❤️","🔥","💯","🎉","✨","💀","🙏","👏","🤝","💪","🤔","😴","🤮","🥳","😇","🤡","👀","💕"];
const stickers = ["🐱","🐶","🦊","🐻","🐼","🐨","🦁","🐸","🐵","🦄","🌈","⭐","🌙","☀️","🌸","🎈","🎁","🎵","💎","🏆"];

const s = {
  app: { display: "flex", height: "100vh", background: "linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #1a1a2e, #16213e, #0f3460)", backgroundSize: "400% 400%", animation: "gradientShift 15s ease infinite", fontFamily: "'Segoe UI', Tahoma, sans-serif", color: "#e9edef", position: "relative", overflow: "hidden" },
  orb: (color, size, top, left, animName, duration) => ({ position: "absolute", width: size, height: size, background: color, borderRadius: "50%", filter: "blur(100px)", opacity: 0.4, top, left, animation: `${animName} ${duration}s ease-in-out infinite`, pointerEvents: "none", zIndex: 0 }),
  sidebar: { width: "360px", background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", flexDirection: "column", position: "relative", zIndex: 10, animation: "slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" },
  sidebarHeader: { padding: "20px", background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  myName: { fontWeight: "700", fontSize: "18px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: "8px" },
  logoutBtn: { background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", cursor: "pointer", fontSize: "12px", padding: "8px 14px", borderRadius: "10px", fontWeight: "600", transition: "all 0.3s ease" },
  actionsRow: { display: "flex", gap: "10px" },
  faceEnrollBtn: { flex: 1, padding: "14px 16px", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))", border: "2px solid rgba(139, 92, 246, 0.4)", borderRadius: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.4s ease", position: "relative", overflow: "hidden" },
  faceEnrollBtnInner: { display: "flex", alignItems: "center", gap: "10px", zIndex: 1 },
  faceIconWrapper: { width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", animation: "facePulse 2s ease-in-out infinite" },
  faceEnrollText: { color: "#c4b5fd", fontSize: "13px", fontWeight: "600" },
  faceEnrolledBtn: { flex: 1, padding: "14px 16px", background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))", border: "2px solid rgba(34, 197, 94, 0.4)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", cursor: "pointer", transition: "all 0.4s ease" },
  enrolledLeft: { display: "flex", alignItems: "center", gap: "10px" },
  enrolledIconWrapper: { width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(135deg, #22c55e, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", position: "relative" },
  enrolledCheckBadge: { position: "absolute", bottom: "-4px", right: "-4px", width: "18px", height: "18px", borderRadius: "50%", background: "#22c55e", border: "2px solid #1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" },
  enrolledText: { color: "#86efac", fontSize: "13px", fontWeight: "600" },
  updateBtn: { padding: "6px 12px", background: "rgba(255, 255, 255, 0.1)", border: "none", borderRadius: "8px", color: "rgba(255, 255, 255, 0.6)", fontSize: "11px", cursor: "pointer", fontWeight: "500", transition: "all 0.3s ease" },
  qrBtn: { width: "56px", height: "56px", background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15))", color: "#67e8f9", border: "2px solid rgba(6, 182, 212, 0.4)", borderRadius: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.4s ease", position: "relative", overflow: "hidden" },
  qrScanLine: { position: "absolute", width: "60%", height: "2px", background: "linear-gradient(90deg, transparent, #67e8f9, transparent)", animation: "scanLine 2s ease-in-out infinite", borderRadius: "2px" },
  userList: { flex: 1, overflowY: "auto", padding: "10px" },
  userItem: { padding: "14px 16px", cursor: "pointer", borderRadius: "14px", display: "flex", alignItems: "center", gap: "14px", marginBottom: "6px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid transparent", transition: "all 0.3s ease" },
  userItemActive: { padding: "14px 16px", cursor: "pointer", borderRadius: "14px", display: "flex", alignItems: "center", gap: "14px", marginBottom: "6px", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))", border: "1px solid rgba(139, 92, 246, 0.3)", boxShadow: "0 4px 20px rgba(139, 92, 246, 0.2)" },
  avatar: { width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px", color: "#fff", flexShrink: 0, boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)" },
  userName: { fontWeight: "600", fontSize: "15px", color: "#e9edef" },
  onlineDot: { width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#22c55e", marginLeft: "auto", flexShrink: 0, animation: "onlinePulse 2s ease-in-out infinite" },
  emptyUsers: { padding: "30px 20px", color: "rgba(255, 255, 255, 0.5)", fontSize: "14px", textAlign: "center", lineHeight: "1.6" },

  // --- UPDATED NEW CHAT BACKGROUNDS ---
  chatArea: { flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 10, height: "100vh", overflow: "hidden", boxShadow: "-10px 0 30px rgba(0,0,0,0.3)" },
  chatHeader: { padding: "14px 24px", background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 },
  chatHeaderInfo: { flex: 1, display: "flex", alignItems: "center", gap: "14px" },
  chatHeaderName: { fontWeight: "700", fontSize: "17px", background: "linear-gradient(135deg, #e9edef, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  callBtns: { display: "flex", gap: "8px" },
  callBtn: { width: "44px", height: "44px", borderRadius: "12px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" },
  voiceCallBtn: { background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15))", color: "#86efac", border: "1px solid rgba(34, 197, 94, 0.3)" },
  videoCallBtn: { background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15))", color: "#93c5fd", border: "1px solid rgba(59, 130, 246, 0.3)" },
  
  messages: {
    flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "12px",
    backgroundColor: "rgba(10, 15, 25, 0.5)",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), radial-gradient(rgba(139, 92, 246, 0.05) 2px, transparent 2px)`,
    backgroundSize: "60px 60px, 20px 20px", backgroundPosition: "0 0, 10px 10px",
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderLeft: "1px solid rgba(255, 255, 255, 0.05)"
  },
  
  noChat: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(10, 15, 25, 0.5)",
    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 2px, transparent 2px), radial-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px)`,
    backgroundSize: "30px 30px, 15px 15px", backgroundPosition: "0 0, 15px 15px",
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderLeft: "1px solid rgba(255, 255, 255, 0.05)",
    color: "rgba(255, 255, 255, 0.6)", gap: "16px", position: "relative", zIndex: 10
  },
  
  msgSent: { alignSelf: "flex-end", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", padding: "12px 18px", borderRadius: "18px 4px 18px 18px", maxWidth: "65%", fontSize: "14px", lineHeight: "1.6", boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)", animation: "messagePop 0.4s ease forwards" },
  msgReceived: { alignSelf: "flex-start", background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "12px 18px", borderRadius: "4px 18px 18px 18px", maxWidth: "65%", fontSize: "14px", lineHeight: "1.6", animation: "messagePop 0.4s ease forwards" },
  msgSticker: { fontSize: "48px", padding: "8px", background: "transparent", border: "none", boxShadow: "none" },
  msgTime: { fontSize: "10px", color: "rgba(255, 255, 255, 0.5)", marginTop: "6px", textAlign: "right" },
  inputArea: { padding: "14px 20px", background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(20px)", display: "flex", gap: "10px", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", flexShrink: 0, position: "relative" },
  inputActions: { display: "flex", gap: "6px" },
  inputActionBtn: { width: "42px", height: "42px", borderRadius: "12px", border: "none", background: "rgba(255, 255, 255, 0.08)", color: "rgba(255, 255, 255, 0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" },
  inputActionBtnActive: { background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))", color: "#c4b5fd" },
  msgInput: { flex: 1, padding: "14px 18px", borderRadius: "14px", border: "2px solid rgba(255, 255, 255, 0.1)", background: "rgba(255, 255, 255, 0.05)", color: "#e9edef", fontSize: "15px", outline: "none", transition: "all 0.3s ease" },
  msgInputFocused: { border: "2px solid rgba(139, 92, 246, 0.5)", boxShadow: "0 0 20px rgba(139, 92, 246, 0.2)" },
  micBtn: { width: "42px", height: "42px", borderRadius: "12px", border: "none", background: "rgba(255, 255, 255, 0.08)", color: "rgba(255, 255, 255, 0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" },
  micBtnRecording: { background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", animation: "recording 1s ease-in-out infinite" },
  sendBtn: { width: "48px", height: "48px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", color: "#fff", border: "none", borderRadius: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)", transition: "all 0.3s ease" },
  pickerContainer: { position: "absolute", bottom: "80px", left: "20px", background: "rgba(30, 30, 50, 0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "16px", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)", zIndex: 100, animation: "fadeIn 0.3s ease forwards" },
  pickerTabs: { display: "flex", gap: "8px", marginBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "12px" },
  pickerTab: { padding: "8px 16px", borderRadius: "10px", border: "none", background: "transparent", color: "rgba(255, 255, 255, 0.5)", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.3s ease" },
  pickerTabActive: { background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))", color: "#fff" },
  pickerGrid: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", maxHeight: "200px", overflowY: "auto" },
  pickerItem: { width: "40px", height: "40px", borderRadius: "10px", border: "none", background: "rgba(255, 255, 255, 0.05)", cursor: "pointer", fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" },
  noChatIcon: { fontSize: "80px", animation: "pulse 2s ease-in-out infinite" },
  noChatTitle: { fontSize: "24px", fontWeight: "700", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  noChatSub: { fontSize: "14px", color: "rgba(255, 255, 255, 0.5)" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease forwards" },
  modalContent: { position: "relative", animation: "modalIn 0.4s ease forwards" },
  modalClose: { position: "absolute", top: "-14px", right: "-14px", zIndex: 10, background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", borderRadius: "50%", width: "32px", height: "32px", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: "18px", boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)", display: "flex", alignItems: "center", justifyContent: "center" },
  callModal: { background: "rgba(30, 30, 50, 0.95)", backdropFilter: "blur(30px)", borderRadius: "24px", padding: "40px", textAlign: "center", border: "1px solid rgba(255, 255, 255, 0.1)", minWidth: "300px" },
  callModalAvatar: { width: "100px", height: "100px", borderRadius: "30px", background: "linear-gradient(135deg, #8b5cf6, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", color: "#fff", margin: "0 auto 20px", boxShadow: "0 10px 40px rgba(139, 92, 246, 0.4)" },
  callModalTitle: { fontSize: "20px", fontWeight: "700", color: "#fff", marginBottom: "8px" },
  callModalSub: { fontSize: "14px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "30px" },
  callModalBtn: { padding: "14px 40px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
};

export default function Chat({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [ws, setWs] = useState(null);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [logoutHover, setLogoutHover] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState("emoji");
  const [isRecording, setIsRecording] = useState(false);
  const [showCallModal, setShowCallModal] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'hi-IN';
      recognitionRef.current.onresult = (e) => { setNewMsg(prev => prev + e.results[0][0].transcript); setIsRecording(false); };
      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  useEffect(() => {
    axios.get(`${BASE}/face-status/${user.username}`).then(res => setFaceEnrolled(res.data.enrolled)).catch(()=>{});
  }, [user.username]);

  useEffect(() => {
    const fetchUsers = async () => { const res = await axios.get(`${BASE}/users`); setUsers(res.data.filter(u => u.username !== user.username)); };
    fetchUsers();
    const iv = setInterval(fetchUsers, 5000);
    return () => clearInterval(iv);
  }, [user.username]);

  useEffect(() => {
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${user.token}`);
    socket.onmessage = (e) => { const data = JSON.parse(e.data); setMessages(prev => [...prev, { sender: data.sender, message: data.message, mine: false }]); };
    setWs(socket);
    return () => socket.close();
  }, [user.token]);

  useEffect(() => {
    if (!selectedUser) return;
    axios.get(`${BASE}/messages/${user.username}/${selectedUser.username}`).then(res => {
      setMessages(res.data.map(m => ({ sender: m.sender, message: m.message, mine: m.sender === user.username, timestamp: m.timestamp })));
    });
  }, [selectedUser, user.username]);

  useEffect(() => {
    if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!newMsg.trim() || !selectedUser || !ws) return;
    ws.send(`${selectedUser.username}|${newMsg}`);
    setMessages(prev => [...prev, { sender: user.username, message: newMsg, mine: true }]);
    setNewMsg(""); setShowEmojiPicker(false);
  };

  const sendSticker = (sticker) => {
    if (!selectedUser || !ws) return;
    ws.send(`${selectedUser.username}|${sticker}`);
    setMessages(prev => [...prev, { sender: user.username, message: sticker, mine: true, isSticker: true }]);
    setShowEmojiPicker(false);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) { alert("Speech recognition not supported in your browser!"); return; }
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); } 
    else { recognitionRef.current.start(); setIsRecording(true); }
  };

  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const isSticker = (msg) => stickers.includes(msg) || (msg.length <= 2 && /\p{Emoji}/u.test(msg));
  const handleEnrollDone = () => { setShowEnrollModal(false); axios.get(`${BASE}/face-status/${user.username}`).then(res => setFaceEnrolled(res.data.enrolled)); };

  return (
    <>
      <style>{keyframes}</style>
      <div style={s.app}>
        <div style={s.orb("radial-gradient(circle, #8b5cf6, transparent)", "500px", "5%", "0%", "float1", 20)} />
        <div style={s.orb("radial-gradient(circle, #ec4899, transparent)", "400px", "60%", "60%", "float2", 25)} />
        <div style={s.orb("radial-gradient(circle, #06b6d4, transparent)", "350px", "80%", "20%", "float3", 22)} />

        {showEnrollModal && (
          <div style={s.modalOverlay}>
            <div style={s.modalContent}>
              <button style={s.modalClose} onClick={() => setShowEnrollModal(false)}>x</button>
              <FaceEnroll user={user} onDone={handleEnrollDone} />
            </div>
          </div>
        )}
        {showQRScanner && <QRScanner user={user} onClose={() => setShowQRScanner(false)} />}
        {showCallModal && (
          <div style={s.modalOverlay} onClick={() => setShowCallModal(null)}>
            <div style={s.callModal} onClick={(e) => e.stopPropagation()}>
              <div style={s.callModalAvatar}>{selectedUser?.username[0].toUpperCase()}</div>
              <div style={s.callModalTitle}>{selectedUser?.username}</div>
              <div style={s.callModalSub}>{showCallModal === "voice" ? "Voice Calling..." : "Video Calling..."}</div>
              <button style={s.callModalBtn} onClick={() => setShowCallModal(null)}>End Call</button>
            </div>
          </div>
        )}

        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <div style={s.headerTop}>
              <div style={s.myName}><span style={{ fontSize: "20px" }}>@</span> {user.username}</div>
              <button style={{...s.logoutBtn, ...(logoutHover ? { background: "rgba(239, 68, 68, 0.3)", transform: "scale(1.05)" } : {})}} onClick={onLogout} onMouseEnter={() => setLogoutHover(true)} onMouseLeave={() => setLogoutHover(false)}>Logout</button>
            </div>
            <div style={s.actionsRow}>
              {faceEnrolled ? (
                <div style={s.faceEnrolledBtn} onClick={() => setShowEnrollModal(true)}>
                  <div style={s.enrolledLeft}><div style={s.enrolledIconWrapper}><Icons.FaceID /><div style={s.enrolledCheckBadge}><Icons.Check /></div></div><span style={s.enrolledText}>Face Verified</span></div>
                  <button style={s.updateBtn}>Update</button>
                </div>
              ) : (
                <button style={s.faceEnrollBtn} onClick={() => setShowEnrollModal(true)}>
                  <div style={s.faceEnrollBtnInner}><div style={s.faceIconWrapper}><Icons.FaceID /></div><span style={s.faceEnrollText}>Enroll Face</span></div>
                </button>
              )}
              <button style={s.qrBtn} onClick={() => setShowQRScanner(true)} title="Web Login ke liye QR Scanner"><Icons.QRScanner /><div style={s.qrScanLine} /></button>
            </div>
          </div>

          <div style={s.userList}>
            {users.length === 0 && <div style={s.emptyUsers}>Koi user nahi mila.<br />Dusre user se signup karwao!</div>}
            {users.map((u, i) => (
              <div key={u.username} style={{...(selectedUser?.username === u.username ? s.userItemActive : s.userItem), animation: `slideInLeft 0.4s ease forwards`, animationDelay: `${i * 0.05}s`, opacity: 0}} onClick={() => setSelectedUser(u)}>
                <div style={s.avatar}>{u.username[0].toUpperCase()}</div>
                <div style={s.userName}>{u.username}</div>
                {u.online && <div style={s.onlineDot} />}
              </div>
            ))}
          </div>
        </div>

        {!selectedUser ? (
          <div style={s.noChat}>
            <div style={s.noChatIcon}>&#128172;</div>
            <div style={s.noChatTitle}>Kisi se baat karo</div>
            <div style={s.noChatSub}>Left mein se koi user select karo</div>
          </div>
        ) : (
          <div style={s.chatArea}>
            <div style={s.chatHeader}>
              <div style={s.chatHeaderInfo}>
                <div style={{ ...s.avatar, width: "42px", height: "42px", fontSize: "16px", borderRadius: "12px" }}>{selectedUser.username[0].toUpperCase()}</div>
                <div>
                  <div style={s.chatHeaderName}>{selectedUser.username}</div>
                  {selectedUser.online && <div style={{fontSize: "12px", color: "#22c55e", display: "flex", alignItems: "center", gap: "4px"}}><span style={{width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e"}} />Online</div>}
                </div>
              </div>
              <div style={s.callBtns}>
                <button style={{ ...s.callBtn, ...s.voiceCallBtn }} onClick={() => setShowCallModal("voice")} title="Voice Call"><Icons.VoiceCall /></button>
                <button style={{ ...s.callBtn, ...s.videoCallBtn }} onClick={() => setShowCallModal("video")} title="Video Call"><Icons.VideoCall /></button>
              </div>
            </div>

            <div style={s.messages} ref={messagesContainerRef}>
              {messages.map((m, i) => (
                <div key={i} style={{...(m.mine ? s.msgSent : s.msgReceived), ...(isSticker(m.message) || m.isSticker ? s.msgSticker : {}), animationDelay: `${i * 0.03}s`}}>
                  {m.message}
                  {!isSticker(m.message) && !m.isSticker && <div style={s.msgTime}>{formatTime(m.timestamp)}</div>}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={s.inputArea}>
              {showEmojiPicker && (
                <div style={s.pickerContainer}>
                  <div style={s.pickerTabs}>
                    <button style={{...s.pickerTab, ...(pickerTab === "emoji" ? s.pickerTabActive : {})}} onClick={() => setPickerTab("emoji")}>Emojis</button>
                    <button style={{...s.pickerTab, ...(pickerTab === "sticker" ? s.pickerTabActive : {})}} onClick={() => setPickerTab("sticker")}>Stickers</button>
                  </div>
                  <div style={s.pickerGrid}>
                    {(pickerTab === "emoji" ? emojis : stickers).map((item, i) => (
                      <button key={i} style={{...s.pickerItem, animation: `emojiPop 0.3s ease forwards`, animationDelay: `${i * 0.01}s`, opacity: 0}} onClick={() => pickerTab === "emoji" ? setNewMsg(p => p + item) : sendSticker(item)}>{item}</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={s.inputActions}>
                <button style={{...s.inputActionBtn, ...(showEmojiPicker && pickerTab === "emoji" ? s.inputActionBtnActive : {})}} onClick={() => { setShowEmojiPicker(!showEmojiPicker); setPickerTab("emoji"); }}><Icons.Emoji /></button>
              </div>
              
              <input style={{...s.msgInput, ...(inputFocused ? s.msgInputFocused : {})}} placeholder="Message type karo..." value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
              
              <button style={{...s.micBtn, ...(isRecording ? s.micBtnRecording : {})}} onClick={toggleRecording} title={isRecording ? "Recording rokne ke liye click karein" : "Bol kar type karein"}>
                {isRecording ? <Icons.MicOff /> : <Icons.Mic />}
              </button>
              
              <button style={{...s.sendBtn, ...(newMsg.trim() ? { transform: "rotate(-10deg) scale(1.1)" } : {})}} onClick={sendMessage}><Icons.Send /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
