<div align="center">

# 🔐 SecureChat
### Secure Face-Authenticated Messaging System

**Login without your phone. Authenticate with your face.**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Features](#-features) • [Demo Flow](#-how-it-works) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [API Docs](#-api-endpoints) • [Security](#-security-architecture)

</div>

---

## 🎯 What is SecureChat?

SecureChat is a **WhatsApp-inspired messaging platform** that solves a fundamental problem — *you shouldn't need your phone to access your messages on a computer.*

Instead of scanning a QR code with your phone (like WhatsApp Web), SecureChat lets you log in from **any browser, anywhere** using:

- 🪪 **Your face** (biometric recognition via FaceNet)
- 🔴 **Liveness detection** (random challenges — blink, smile, nod)
- 🤖 **AI threat detection** (blocks photo/screen/spoof attacks)
- 🔐 **A dedicated face password** (second factor, separate from your account password)

> **No phone. No QR scan. Just your face.**

---

## 🖼️ Project Structure

```
secure-chat/
├── backend/                    ← Python FastAPI (Port 8000)
│   ├── main.py                 ← All API routes + WebSocket
│   ├── face_utils.py           ← FaceNet embedding + strict matching
│   └── threat_detection.py     ← AI 4-layer spoof detection
│
├── chat-app/                   ← React Chat App (Port 3000)
│   └── src/pages/
│       ├── Auth.js             ← Login / Signup
│       ├── Chat.js             ← Real-time chat + sidebar
│       ├── FaceEnroll.js       ← Face enrollment + face password
│       └── QRScanner.js        ← Scan QR for web login
│
└── web-login/                  ← React Web Login Portal (Port 3001)
    └── src/pages/
        ├── LandingPage.js      ← Choose login method
        ├── FaceLogin.js        ← 4-step face authentication
        ├── LivenessCheck.js    ← Random liveness challenges
        └── QRLogin.js          ← QR display + session polling
```

---

## ✨ Features

### 💬 Chat Application (`localhost:3000`)
- ✅ Signup & login with username + password
- ✅ Real-time 1-to-1 messaging via WebSocket
- ✅ Online / offline status indicators
- ✅ Full message history (MongoDB)
- ✅ **Face Enrollment** — register face + set face password (sidebar)
- ✅ **QR Scanner** — authorize web login sessions (WhatsApp style)
- ✅ Auto-login when redirected from web portal

### 🌐 Web Login Portal (`localhost:3001`)
- ✅ **Face Login** — 4-step: username → liveness → face scan → password
- ✅ **QR Login** — scan from chat app → auto login
- ✅ Liveness detection (3 random challenges per session)
- ✅ AI threat detection (4-layer spoof prevention)
- ✅ Auto-redirect to chat after successful login

### 🛡️ Security
- ✅ JWT access tokens (2h) + refresh tokens (7d)
- ✅ Bcrypt password hashing
- ✅ Rate limiting (5 attempts / 5 min / IP)
- ✅ Audit logging (all events)
- ✅ L2-normalized face embeddings
- ✅ Dual-metric face matching (cosine + euclidean)
- ✅ 70% similarity threshold (strict)

---

## 🔄 How It Works

### Face Login Flow (Main Innovation)

```
1. USERNAME     →  Enter your username
                   Backend checks if face is enrolled

2. LIVENESS     →  Webcam opens
                   3 random challenges from:
                   [blink] [smile] [nod] [left] [right] [open mouth]
                   8 seconds per challenge
                   Blocks: photos, videos, deepfakes

3. FACE SCAN    →  AI Threat Detection runs first
                   ├── Blur check (Laplacian variance)
                   ├── Screen replay detection (FFT)
                   ├── Face count check (1 face only)
                   └── Lighting analysis
                   Then: FaceNet extracts 128-d embedding
                   Compared vs stored embedding:
                   ├── Cosine distance < 0.30 (70%+ similarity)
                   └── Euclidean distance < 10.0
                   BOTH must pass ✓

4. FACE PASS    →  Enter your dedicated face password
                   Verified against Bcrypt hash
                   JWT token issued on success

5. REDIRECT     →  localhost:3000?token=XXX&username=YYY
                   Chat app reads URL params → logged in ✅
```

### QR Login Flow

```
Web Portal → Generate QR (2 min expiry)
           ↓
Chat App  → 📷 Scan QR → Confirm popup
           ↓
Web Portal → Polling detects "confirmed"
           ↓
JWT issued → Chat app loads ✅
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React.js 18 | UI for both apps |
| **Backend** | Python FastAPI | REST API + WebSocket server |
| **Face AI** | DeepFace + FaceNet | 128-d face embedding |
| **Image Processing** | OpenCV + NumPy | Threat detection + image utils |
| **Database** | MongoDB | Users, messages, sessions, QR, audit |
| **Auth** | JWT (python-jose) | Secure session tokens |
| **Password** | Bcrypt (passlib) | Hashing account + face passwords |
| **Real-time** | WebSocket | Live chat delivery |
| **QR** | jsQR + quickchart.io | QR decode (camera) + generate |

---

## 🚀 Installation

### Prerequisites
- Python 3.11+
- Node.js v18+
- MongoDB running on `localhost:27017`

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/secure-chat.git
cd secure-chat
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install fastapi uvicorn pymongo python-jose "passlib[bcrypt]" \
            deepface opencv-python numpy tf-keras

# Start backend
uvicorn main:app --reload
# → Running on http://127.0.0.1:8000
```

### 3. Chat App Setup
```bash
cd ../chat-app
npm install
npm start
# → Running on http://localhost:3000
```

### 4. Web Login Setup
```bash
cd ../web-login
npm install
npm start
# → Press Y when asked about port → Running on http://localhost:3001
```

### 5. First Run Checklist
```
☐ Open http://localhost:3000
☐ Create an account (Signup)
☐ Login with your password
☐ Click "Enroll Your Face" in the sidebar
☐ Capture your face + set a Face Password
☐ Open http://localhost:3001
☐ Click "Face se Login Karo"
☐ Complete liveness + face scan + face password
☐ You're in! ✅
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/signup` | Create new account |
| `POST` | `/login` | Password-based login |
| `POST` | `/refresh` | Refresh access token |
| `POST` | `/logout` | End session |
| `GET` | `/users` | List all users + online status |
| `GET` | `/messages/{u1}/{u2}` | Fetch chat history |
| `POST` | `/enroll-face` | Save face embedding + face password |
| `POST` | `/face-login/verify-face` | Step 1 — face match |
| `POST` | `/face-login/verify-password` | Step 2 — face password |
| `GET` | `/face-status/{username}` | Check if face enrolled |
| `POST` | `/qr/generate` | Generate QR session token |
| `GET` | `/qr/status/{token}` | Poll QR session status |
| `POST` | `/qr/scan` | Mark QR as scanned |
| `POST` | `/qr/confirm` | Confirm QR login |
| `WS` | `/ws/{token}` | WebSocket real-time chat |

> Interactive docs available at: **http://127.0.0.1:8000/docs**

---

## 🛡️ Security Architecture

```
┌─────────────────────────────────────────────────────┐
│                 8-Layer Security                     │
├─────────────────────────────────────────────────────┤
│ 1. Rate Limiting     5 fails → 5 min IP block       │
│ 2. Bcrypt Hashing    Cost factor 12 — both passwords│
│ 3. Liveness Check    3 random challenges / session  │
│ 4. AI Threat         Blur + Screen + Count + Light  │
│ 5. Face Matching     Cosine + Euclidean (dual check)│
│ 6. 2-Factor Auth     Face biometric + face password │
│ 7. JWT Tokens        Short-lived, type-checked      │
│ 8. Audit Logging     Every event logged with IP     │
└─────────────────────────────────────────────────────┘
```

### Face Matching — How Strict Is It?

```python
# face_utils.py
COSINE_THRESHOLD    = 0.30   # cosine distance < 0.30 = 70%+ similarity
EUCLIDEAN_THRESHOLD = 10.0   # secondary validation

# BOTH must pass for login to succeed
match = cosine_ok AND euclidean_ok
```

**Only your enrolled face will work. Anyone else's face will be rejected.**

### What Gets Stored?

| Data | Stored? | Format |
|---|---|---|
| Face photo / image | ❌ Never | — |
| Face embedding | ✅ Yes | 128 float values (L2-normalized) |
| Account password | ✅ Yes | Bcrypt hash |
| Face password | ✅ Yes | Bcrypt hash |
| Messages | ✅ Yes | Plain text (encryption: future scope) |

---

## 📊 AI & ML Components

### FaceNet Embedding
- **Model:** FaceNet (via DeepFace)
- **Output:** 128-dimensional vector
- **Preprocessing:** Face alignment + L2 normalization
- **Comparison:** Dual-metric (cosine + euclidean)
- **Threshold:** 70% minimum similarity

### AI Threat Detection

| Check | Method | Risk Score |
|---|---|---|
| Blur Detection | Laplacian variance < 50 | +30 |
| Screen Replay | FFT frequency analysis | +40 |
| Multiple Faces | DeepFace detection count | +50 |
| Bad Lighting | Mean brightness < 40 or > 220 | +20 |

Risk score ≥ 50 → **Login blocked (HTTP 403)**

---

## 🗄️ Database Collections

```
securechat (MongoDB)
├── users          → credentials, face embedding, enrollment status
├── messages       → sender, receiver, message, timestamp
├── sessions       → refresh tokens, login method, expiry
├── qr_sessions    → qr_token, status, expiry (2 min)
└── audit_logs     → all events, IP, timestamp, similarity scores
```

---

## 🆚 SecureChat vs WhatsApp Web

| Feature | WhatsApp Web | SecureChat |
|---|---|---|
| Needs phone online | ✅ Yes | ❌ No |
| Web login method | QR (phone required) | Face + Password |
| Liveness detection | None | Random challenges |
| Spoof prevention | None | AI 4-layer detection |
| Face data storage | N/A | Math vectors only |
| 2-Factor Auth | None | Face + face password |
| QR login | Yes (needs phone) | Yes (optional) |
| Open source | ❌ No | ✅ Yes |

---

## 🔮 Roadmap

- [ ] End-to-end message encryption (AES-256)
- [ ] React Native mobile app
- [ ] Group chat support
- [ ] Push notifications
- [ ] Cloud deployment (Docker + AWS)
- [ ] Deepfake detection ML model
- [ ] WebRTC voice / video calls
- [ ] File and image sharing
- [ ] Admin dashboard
- [ ] GDPR data export / deletion

---

## 📁 Environment Variables (Production)

```env
SECRET_KEY=your_super_secret_key_here
REFRESH_SECRET_KEY=your_refresh_secret_key_here
MONGO_URI=mongodb://localhost:27017/
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Pranjul**

> Built as an innovation project demonstrating device-independent biometric authentication for messaging platforms.

---

<div align="center">

**⭐ Star this repo if you found it useful!**

*No raw images stored · No mobile required · No compromise on security*

</div>
