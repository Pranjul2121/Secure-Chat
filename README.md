# SecureChat — Full Project Documentation

## Project Title
**Secure Face-Authenticated Messaging System with Device-Independent Web Login**

---

## Problem Statement
WhatsApp jaise messaging platforms mobile device pe depend karte hain — QR scan ke liye phone zaroorat padti hai. Agar phone available nahi hai toh web access impossible hai. Ye project us problem ko solve karta hai — bina mobile ke, sirf face + password se login.

---

## Innovation / USP
| Feature | WhatsApp | SecureChat |
|---|---|---|
| Web Login | QR + Mobile required | Face + Password (no mobile) |
| Authentication | Phone OTP | Biometric + Password |
| Security | Device binding | AI Threat Detection |
| Liveness | None | Blink / Head move check |
| Spoof Prevention | None | Blur + Screen replay detection |

---

## System Architecture

```
Chat App (localhost:3000)          Web Login (localhost:3001)
        |                                    |
        |____________________________________| 
                         |
                  Backend (FastAPI :8000)
                  /       |        \
            Auth       Face AI    Chat
            JWT       DeepFace   WebSocket
                          |
                       MongoDB
                  Users | Chats | Embeddings | Sessions
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Chat Frontend | React.js | Chat UI, Face Enroll, QR Scanner |
| Web Login Frontend | React.js | Face Login, QR Login page |
| Backend | Python FastAPI | APIs, Auth, Face matching |
| Face Recognition | DeepFace + FaceNet | Embedding generation + matching |
| AI Threat Detection | OpenCV + NumPy | Spoof / attack prevention |
| Database | MongoDB | Users, messages, face embeddings |
| Auth | JWT (python-jose) | Session tokens |
| Password Hashing | Bcrypt (passlib) | Secure password storage |
| Real-time | WebSocket | Live chat messages |
| QR | jsQR + qrcode.js | QR generation and scanning |

---

## Project Structure

```
secure-chat/
├── backend/
│   ├── main.py              ← All API routes
│   ├── face_utils.py        ← Face embedding + matching
│   ├── threat_detection.py  ← AI threat analysis
│   └── requirements.txt
│
├── frontend/ (Chat App — port 3000)
│   └── src/
│       ├── App.js
│       └── pages/
│           ├── Auth.js          ← Login/Signup
│           ├── Chat.js          ← Main chat + sidebar
│           ├── FaceEnroll.js    ← Face enrollment
│           └── QRScanner.js     ← QR scanner
│
└── web-login/ (Web Login — port 3001)
    └── src/
        ├── App.js
        └── pages/
            ├── LandingPage.js      ← Login options
            ├── FaceLogin.js        ← Face verify flow
            ├── LivenessCheck.js    ← Liveness detection
            └── QRLogin.js          ← QR login page
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /signup | New user register |
| POST | /login | Password login |
| GET | /users | All users list |
| GET | /messages/{u1}/{u2} | Chat history |
| POST | /enroll-face | Save face embedding |
| POST | /verify-face | Face + AI threat check |
| GET | /face-status/{username} | Check enrollment |
| POST | /qr/generate | Generate QR session |
| POST | /qr/confirm | Confirm QR scan |
| GET | /qr/status/{session_id} | Check QR session |
| WS | /ws/{token} | Real-time chat |

---

## Login Flows

### Flow 1 — Password Login
```
Username + Password → JWT Token → Chat Access
```

### Flow 2 — Face Login (Device Independent)
```
Username → Liveness Check → AI Threat Scan → Face Match → Face Password → JWT → Chat
```

### Flow 3 — QR Login (WhatsApp Style)
```
Web: Generate QR → Show QR
Chat App: Scan QR → Confirm
Web: Auto Login → JWT → Chat
```

---

## AI Threat Detection System

### Checks Performed
| Check | Method | Risk Score |
|---|---|---|
| Blur Detection | Laplacian variance | +30 |
| Screen Replay | FFT frequency analysis | +40 |
| Multiple Faces | DeepFace detection | +50 |
| Lighting Attack | Brightness analysis | +20 |

### Risk Levels
- **LOW (0–24)** → Proceed with login
- **MEDIUM (25–49)** → Warning logged
- **HIGH (50+)** → Login blocked (403)

---

## Security Features

| Feature | Implementation |
|---|---|
| Face Embedding | Math vectors only — no raw image stored |
| Password | Bcrypt hash — never stored as plain text |
| Face Password | Separate from account password |
| JWT Session | 2 hour expiry |
| Liveness | Random challenge (blink/head move) |
| AI Threat | 4-layer spoof detection |
| QR Expiry | 2 minute session timeout |

---

## Database Schema

### Users Collection
```json
{
  "username": "string",
  "password": "bcrypt_hash",
  "face_embedding": [128 float values],
  "face_password": "bcrypt_hash",
  "face_enrolled": true,
  "online": false,
  "created_at": "datetime"
}
```

### Messages Collection
```json
{
  "sender": "string",
  "receiver": "string",
  "message": "string",
  "timestamp": "datetime"
}
```

### QR Sessions Collection
```json
{
  "session_id": "uuid",
  "status": "pending/confirmed",
  "username": "string",
  "token": "jwt",
  "created_at": "datetime"
}
```

---

## How to Run

```bash
# Terminal 1 — Backend
cd secure-chat/backend
venv\Scripts\activate
uvicorn main:app --reload

# Terminal 2 — Chat App
cd secure-chat/frontend
npm start        # localhost:3000

# Terminal 3 — Web Login
cd secure-chat/web-login
npm start        # localhost:3001 (press Y for different port)
```

---

## Domains Covered

- Artificial Intelligence (Face Recognition)
- Computer Vision (OpenCV, DeepFace)
- Cybersecurity (AI Threat Detection, Liveness)
- Real-Time Communication (WebSocket)
- Web Application Development (React, FastAPI)
- Database Design (MongoDB)
- Authentication Systems (JWT, Bcrypt, Biometric)

---

## Future Scope

- Mobile App (React Native) for face enrollment
- End-to-end message encryption (AES)
- Group chat support
- Push notifications
- Cloud deployment (AWS/GCP)
- Deepfake detection using deep learning model

---

*Project by: Pranjul | Stack: React + FastAPI + MongoDB + DeepFace*
