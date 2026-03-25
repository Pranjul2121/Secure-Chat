// chat-app/src/App.js — UPDATED
// Web-login se redirect hone pe URL params se token read karta hai

import React, { useState, useEffect } from "react";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";

export default function App() {
  const [user, setUser] = useState(null);

  // On load: check if web-login redirected us with token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token    = params.get("token");
    const username = params.get("username");
    if (token && username) {
      setUser({ username, token });
      // Clean up URL — token URL se hata do
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const handleLogin  = (userData) => setUser(userData);
  const handleLogout = () => setUser(null);

  if (!user) return <Auth onLogin={handleLogin} />;
  return <Chat user={user} onLogout={handleLogout} />;
}