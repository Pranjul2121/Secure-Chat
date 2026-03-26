// chat-app/src/pages/Chat.js
// IMPORTANT: URL se token read karta hai (web-login se redirect hone pe)
// Sidebar: Face Enroll button + QR Scanner button

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import FaceEnroll from "./FaceEnroll";
import QRScanner from "./QRScanner";

const s = {
  app: {
    display: "flex", height: "100vh", backgroundColor: "#111b21",
    fontFamily: "Segoe UI, sans-serif", color: "#e9edef",
  },
  sidebar: {
    width: "350px", borderRight: "1px solid #2a3942",
    display: "flex", flexDirection: "column", backgroundColor: "#111b21",
  },
  sidebarHeader: {
    padding: "14px 18px", backgroundColor: "#202c33",
    borderBottom: "1px solid #2a3942",
  },
  headerTop: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "10px",
  },
  myName: { fontWeight: "bold", fontSize: "16px", color: "#e9edef" },
  logoutBtn: {
    background: "none", border: "none", color: "#8696a0",
    cursor: "pointer", fontSize: "12px",
  },
  actionsRow: { display: "flex", gap: "8px" },
  enrollBtn: {
    flex: 1, padding: "7px 10px", backgroundColor: "#1a3a30",
    color: "#00a884", border: "1px solid #00a884", borderRadius: "7px",
    fontSize: "12px", fontWeight: "600", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
  },
  enrolledBadge: {
    flex: 1, padding: "7px 10px", backgroundColor: "#0d2e23",
    color: "#00a884", border: "1px solid #0d4030", borderRadius: "7px",
    fontSize: "12px", display: "flex", alignItems: "center",
    justifyContent: "center", gap: "5px",
  },
  updateLink: {
    marginLeft: "auto", fontSize: "10px",
    cursor: "pointer", color: "#8696a0",
  },
  qrBtn: {
    padding: "7px 12px", backgroundColor: "#1a2530",
    color: "#7eb8f5", border: "1px solid #2a5080", borderRadius: "7px",
    fontSize: "13px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  userList: { flex: 1, overflowY: "auto" },
  userItem: {
    padding: "13px 18px", cursor: "pointer",
    borderBottom: "1px solid #1e2c34",
    display: "flex", alignItems: "center", gap: "12px",
  },
  userItemActive: {
    padding: "13px 18px", cursor: "pointer",
    borderBottom: "1px solid #1e2c34",
    display: "flex", alignItems: "center", gap: "12px",
    backgroundColor: "#2a3942",
  },
  avatar: {
    width: "42px", height: "42px", borderRadius: "50%",
    backgroundColor: "#00a884", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontWeight: "bold", fontSize: "16px", color: "#fff", flexShrink: 0,
  },
  userName: { fontWeight: "500", fontSize: "15px" },
  onlineDot: {
    width: "8px", height: "8px", borderRadius: "50%",
    backgroundColor: "#00a884", marginLeft: "auto", flexShrink: 0,
  },
  chatArea: { flex: 1, display: "flex", flexDirection: "column" },
  chatHeader: {
    padding: "14px 20px", backgroundColor: "#202c33",
    borderBottom: "1px solid #2a3942",
    display: "flex", alignItems: "center", gap: "12px",
  },
  chatHeaderName: { fontWeight: "bold", fontSize: "16px" },
  messages: {
    flex: 1, overflowY: "auto", padding: "20px",
    display: "flex", flexDirection: "column", gap: "8px",
    backgroundColor: "#0b141a",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
  msgSent: {
    alignSelf: "flex-end", backgroundColor: "#005c4b",
    padding: "8px 14px", borderRadius: "8px 0px 8px 8px",
    maxWidth: "65%", fontSize: "14px", lineHeight: "1.5",
  },
  msgReceived: {
    alignSelf: "flex-start", backgroundColor: "#202c33",
    padding: "8px 14px", borderRadius: "0px 8px 8px 8px",
    maxWidth: "65%", fontSize: "14px", lineHeight: "1.5",
  },
  msgTime: { fontSize: "11px", color: "#8696a0", marginTop: "4px", textAlign: "right" },
  inputArea: {
    padding: "12px 20px", backgroundColor: "#202c33",
    display: "flex", gap: "12px", alignItems: "center",
    borderTop: "1px solid #2a3942",
  },
  msgInput: {
    flex: 1, padding: "11px 16px", borderRadius: "8px", border: "none",
    backgroundColor: "#2a3942", color: "#e9edef", fontSize: "15px", outline: "none",
  },
  sendBtn: {
    padding: "11px 20px", backgroundColor: "#00a884", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer",
    fontWeight: "bold", fontSize: "15px",
  },
  noChat: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#0b141a", color: "#8696a0", gap: "12px",
  },
};

export default function Chat({ user, onLogout }) {
  const [users, setUsers]           = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [newMsg, setNewMsg]         = useState("");
  const [ws, setWs]                 = useState(null);
  const [faceEnrolled, setFaceEnrolled]   = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showQRScanner, setShowQRScanner]     = useState(false);
  const messagesEndRef = useRef(null);
  const BASE = "http://127.0.0.1:8000";

  // Check face enrollment status
  useEffect(() => {
    axios.get(`${BASE}/face-status/${user.username}`)
      .then(res => setFaceEnrolled(res.data.enrolled))
      .catch(() => {});
  }, [user.username]);

  // Load users
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await axios.get(`${BASE}/users`);
      setUsers(res.data.filter(u => u.username !== user.username));
    };
    fetchUsers();
    const iv = setInterval(fetchUsers, 5000);
    return () => clearInterval(iv);
  }, [user.username]);

  // WebSocket
  useEffect(() => {
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${user.token}`);
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages(prev => [...prev, { sender: data.sender, message: data.message, mine: false }]);
    };
    setWs(socket);
    return () => socket.close();
  }, [user.token]);

  // Message history
  useEffect(() => {
    if (!selectedUser) return;
    axios.get(`${BASE}/messages/${user.username}/${selectedUser.username}`)
      .then(res => {
        setMessages(res.data.map(m => ({
          sender: m.sender, message: m.message,
          mine: m.sender === user.username, timestamp: m.timestamp,
        })));
      });
  }, [selectedUser, user.username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMsg.trim() || !selectedUser || !ws) return;
    ws.send(`${selectedUser.username}|${newMsg}`);
    setMessages(prev => [...prev, { sender: user.username, message: newMsg, mine: true }]);
    setNewMsg("");
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleEnrollDone = () => {
    setShowEnrollModal(false);
    axios.get(`${BASE}/face-status/${user.username}`)
      .then(res => setFaceEnrolled(res.data.enrolled));
  };

  return (
    <div style={s.app}>
      {/* Face Enroll Modal */}
      {showEnrollModal && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowEnrollModal(false)} style={{
              position: "absolute", top: "-12px", right: "-12px", zIndex: 10,
              background: "#f15c6d", border: "none", borderRadius: "50%",
              width: "28px", height: "28px", color: "#fff",
              fontWeight: "bold", cursor: "pointer", fontSize: "16px",
            }}>×</button>
            <FaceEnroll user={user} onDone={handleEnrollDone} />
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner user={user} onClose={() => setShowQRScanner(false)} />
      )}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <div style={s.headerTop}>
            <div style={s.myName}>👤 {user.username}</div>
            <button style={s.logoutBtn} onClick={onLogout}>Logout</button>
          </div>

          <div style={s.actionsRow}>
            {/* Face Enroll */}
            {faceEnrolled ? (
              <div style={s.enrolledBadge}>
                ✅ Face Enrolled
                <span style={s.updateLink} onClick={() => setShowEnrollModal(true)}>Update</span>
              </div>
            ) : (
              <button style={s.enrollBtn} onClick={() => setShowEnrollModal(true)}>
                🪪 Enroll Face
              </button>
            )}

            {/* QR Scanner — web-login page se QR scan karne ke liye */}
            <button
              style={s.qrBtn}
              onClick={() => setShowQRScanner(true)}
              title="Web Login ke liye QR Scanner"
            >
              📷
            </button>
          </div>
        </div>

        <div style={s.userList}>
          {users.length === 0 && (
            <div style={{ padding: "20px", color: "#8696a0", fontSize: "13px" }}>
              Koi user nahi mila. Dusre user se signup karwao!
            </div>
          )}
          {users.map(u => (
            <div
              key={u.username}
              style={selectedUser?.username === u.username ? s.userItemActive : s.userItem}
              onClick={() => setSelectedUser(u)}
            >
              <div style={s.avatar}>{u.username[0].toUpperCase()}</div>
              <div style={s.userName}>{u.username}</div>
              {u.online && <div style={s.onlineDot} />}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {!selectedUser ? (
        <div style={s.noChat}>
          <div style={{ fontSize: "60px" }}>💬</div>
          <div style={{ fontSize: "18px" }}>Kisi se baat karo</div>
          <div style={{ fontSize: "13px" }}>Left mein se koi user select karo</div>
        </div>
      ) : (
        <div style={s.chatArea}>
          <div style={s.chatHeader}>
            <div style={{ ...s.avatar, width: "36px", height: "36px", fontSize: "14px" }}>
              {selectedUser.username[0].toUpperCase()}
            </div>
            <div style={s.chatHeaderName}>{selectedUser.username}</div>
            {selectedUser.online && (
              <div style={{ fontSize: "12px", color: "#00a884" }}>● Online</div>
            )}
          </div>

          <div style={s.messages}>
            {messages.map((m, i) => (
              <div key={i} style={m.mine ? s.msgSent : s.msgReceived}>
                {m.message}
                <div style={s.msgTime}>{formatTime(m.timestamp)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={s.inputArea}>
            <input
              style={s.msgInput} placeholder="Message likho..."
              value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button style={s.sendBtn} onClick={sendMessage}>Send ➤</button>
          </div>
        </div>
      )}
    </div>
  );
}