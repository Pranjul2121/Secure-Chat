import React, { useState } from "react";
import axios from "axios";

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#111b21",
  },
  box: {
    backgroundColor: "#202c33",
    padding: "40px",
    borderRadius: "12px",
    width: "360px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  title: {
    color: "#00a884",
    textAlign: "center",
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#8696a0",
    textAlign: "center",
    fontSize: "13px",
    marginBottom: "28px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "14px",
    borderRadius: "8px",
    border: "1px solid #2a3942",
    backgroundColor: "#2a3942",
    color: "#e9edef",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },
  btnGreen: {
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
  btnOutline: {
    width: "100%",
    padding: "12px",
    backgroundColor: "transparent",
    color: "#00a884",
    border: "1px solid #00a884",
    borderRadius: "8px",
    fontSize: "15px",
    cursor: "pointer",
  },
  error: {
    color: "#f15c6d",
    fontSize: "13px",
    textAlign: "center",
    marginBottom: "10px",
  },
  success: {
    color: "#00a884",
    fontSize: "13px",
    textAlign: "center",
    marginBottom: "10px",
  },
  toggle: {
    color: "#8696a0",
    textAlign: "center",
    fontSize: "13px",
    marginTop: "16px",
    cursor: "pointer",
  },
  toggleSpan: {
    color: "#00a884",
    fontWeight: "bold",
  },
};

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const BASE = "http://127.0.0.1:8000";

  const handleSubmit = async () => {
    if (!username || !password) {
      setMsg({ text: "Username aur password dono bharo!", type: "error" });
      return;
    }
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      if (isLogin) {
        const res = await axios.post(`${BASE}/login`, { username, password });
        onLogin({ username: res.data.username, token: res.data.access_token });
      } else {
        await axios.post(`${BASE}/signup`, { username, password });
        setMsg({ text: "Account ban gaya! Ab login karo.", type: "success" });
        setIsLogin(true);
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      const detail = err.response?.data?.detail || "Kuch gadbad ho gayi!";
      setMsg({ text: detail, type: "error" });
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.title}>💬 SecureChat</div>
        <div style={styles.subtitle}>
          {isLogin ? "Apne account mein login karo" : "Naya account banao"}
        </div>

        {msg.text && (
          <div style={msg.type === "error" ? styles.error : styles.success}>
            {msg.text}
          </div>
        )}

        <input
          style={styles.input}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <input
          style={styles.input}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        <button style={styles.btnGreen} onClick={handleSubmit} disabled={loading}>
          {loading ? "Wait karo..." : isLogin ? "Login" : "Signup"}
        </button>

        <div
          style={styles.toggle}
          onClick={() => {
            setIsLogin(!isLogin);
            setMsg({ text: "", type: "" });
          }}
        >
          {isLogin ? (
            <>Account nahi hai? <span style={styles.toggleSpan}>Signup karo</span></>
          ) : (
            <>Pehle se account hai? <span style={styles.toggleSpan}>Login karo</span></>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;