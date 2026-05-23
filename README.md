# 🔐 SecureChat
### Secure Face-Authenticated Messaging System

**SecureChat** is a hybrid messaging solution with both a chat client and a biometric web login portal.
It is designed to let users sign in with face authentication and/or QR approval, while the chat app maintains real-time messages over WebSocket.

---

## 🧠 What this project contains

- `backend/` — FastAPI backend with:
  - username/password auth
  - face enrollment and face-login flow
  - QR login flow
  - WebSocket real-time chat
  - MongoDB persistence for users, messages, sessions, QR tokens, and audit logs
- `frontend/` — React chat app with:
  - signup/login page
  - messaging interface
  - face enrollment screen
  - QR scanner integration
- `web-login/` — React web login portal with:
  - landing page for login choice
  - face login + liveness check
  - QR login for browser-based session approval

---

## 🔧 Project structure

```
Secure-Chat/
├── backend/
│   ├── main.py
│   ├── face_utils.py
│   └── threat_detection.py
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.js
│       └── pages/
│           ├── Auth.js
│           ├── Chat.js
│           ├── FaceEnroll.js
│           └── QRScanner.js
├── web-login/
│   ├── package.json
│   └── src/
│       ├── App.js
│       └── pages/
│           ├── LandingPage.js
│           ├── FaceLogin.js
│           ├── LivenessCheck.js
│           └── QRLogin.js
└── package.json
```

> Note: the root `package.json` includes MediaPipe dependencies, while the two main React applications are in `frontend/` and `web-login/`.

---

## 🚀 Core functionality

### Backend
- `backend/main.py`
  - `POST /signup` — register new users
  - `POST /login` — standard login with access and refresh tokens
  - `POST /refresh` — renew access token
  - `POST /logout` — invalidate refresh session
  - `GET /users` — fetch available users and online status
  - `GET /messages/{user1}/{user2}` — fetch conversation history
  - `POST /enroll-face` — capture face embedding and face password
  - `POST /face-login/verify-face` — verify live face image and return temporary face token
  - `POST /face-login/verify-password` — verify face password and issue chat tokens
  - `GET /face-status/{username}` — check face enrollment status
  - `POST /qr/generate` — create QR session token
  - `GET /qr/status/{qr_token}` — poll QR login status
  - `POST /qr/scan` — scan QR from chat session
  - `POST /qr/confirm` — confirm QR login approval
  - `WebSocket /ws/{token}` — connect to chat messaging channel
- `backend/face_utils.py`
  - converts base64 camera images to FaceNet embeddings
  - normalizes embeddings for strict matching
  - checks image quality before enrollment/verification
- `backend/threat_detection.py`
  - runs spoof defenses: blur, screen replay, face count, lighting
  - returns safe/block decisions and risk scores

### Frontend chat app (`frontend`)
- Provides signup and login forms
- Displays user list and online status
- Supports sending and receiving messages in real time
- Offers face enrollment flow
- Supports scanning a QR code for browser login approval
- Reads login token returned from `web-login` via URL params

### Web login portal (`web-login`)
- Lets users choose face login or QR login
- Face login includes camera scan and face password entry
- QR login uses generated QR session tokens and polling
- On successful login, it redirects back to the chat app with token and username

---

## 📦 Dependencies

### Backend
- Python 3.11+
- FastAPI
- Uvicorn
- PyMongo
- Python-JOSE
- Passlib[bcrypt]
- DeepFace
- OpenCV-Python
- NumPy

### Frontend apps
- React 19
- React DOM
- Axios
- `react-scripts`
- QR code support in `frontend`
- Testing libraries in both apps

---

## 🧪 Environment variables

The backend currently reads configuration from hard-coded values. For a safer local or production setup, replace the values in `backend/main.py` or add environment variable support.

Suggested variables:
- `MONGODB_URI` — MongoDB connection string, e.g. `mongodb://localhost:27017/`
- `SECRET_KEY` — JWT access token signing key
- `REFRESH_SECRET_KEY` — JWT refresh token signing key
- `BACKEND_HOST` — backend host (e.g. `0.0.0.0`)
- `BACKEND_PORT` — backend port (e.g. `8000`)

---

## 🛠️ Installation guide

### 1. Clone repository

```bash
git clone https://github.com/<your-repo>/Secure-Chat.git
cd Secure-Chat
```

### 2. Start MongoDB

Make sure MongoDB is running on:

```text
mongodb://localhost:27017
```

### 3. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn pymongo python-jose passlib[bcrypt] deepface opencv-python numpy
```

### 4. Start backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Chat app setup

```bash
cd ../frontend
npm install
npm start
```

### 6. Web login portal setup

```bash
cd ../web-login
npm install
npm start
```

---

## 🌐 Local app URLs

- Chat app: `http://localhost:3000`
- Web login portal: `http://localhost:3001`
- Backend API: `http://localhost:8000`

---

## 🔄 How the flows work

1. User signs up in the chat app with `username` and `password`.
2. User can enroll face data and a face password from the chat app.
3. The backend stores a normalized FaceNet embedding and hashed face password.
4. Web login portal uses either:
   - `Face login`: live camera scan → threat detection → face token → face password → chat tokens
   - `QR login`: generate QR token → chat app scans QR with current session → confirm approval
5. After success, `web-login` redirects to the chat app with `token` and `username` query params.
6. Chat app uses the token to connect to `backend` WebSocket `/ws/{token}`.

---

## 📡 API summary

### Auth and user endpoints
- `POST /signup`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `GET /users`
- `GET /messages/{user1}/{user2}`

### Face login endpoints
- `POST /enroll-face`
- `POST /face-login/verify-face`
- `POST /face-login/verify-password`
- `GET /face-status/{username}`

### QR login endpoints
- `POST /qr/generate`
- `GET /qr/status/{qr_token}`
- `POST /qr/scan`
- `POST /qr/confirm`

### Real-time chat
- `WebSocket /ws/{token}`

---

## ⚠️ Important notes

- `backend/main.py` currently contains hard-coded `SECRET_KEY` and `REFRESH_SECRET_KEY` values.
- The MongoDB connection string is fixed to `mongodb://localhost:27017/`.
- Face login is performed by the `web-login` portal, while the chat app is the messaging client.
- The `frontend` app uses the token passed from `web-login` URL parameters to log into chat.

---

## 🪪 Security behavior

- Face images are converted from base64 camera capture into embeddings.
- Embeddings are normalized before comparison.
- Face match requires both:
  - cosine distance < 0.30
  - euclidean distance < 0.77
- Threat detection checks for:
  - blur / printed photo
  - screen replay
  - multiple faces or no face
  - bad lighting

---

## 🧪 Troubleshooting

- If face enrollment fails, allow camera access and use good lighting.
- If QR login expires, generate a new QR code.
- If tokens fail, restart backend and refresh the browser.
- If MongoDB does not connect, verify the database is running locally.
