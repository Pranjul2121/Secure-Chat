# 🔐 SecureChat ### Secure Face-Authenticated Messaging System **Login without your phone. Authenticate with your face.** [![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org) [![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com) [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev) [![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com) --- ## 🎯 What is SecureChat? SecureChat is a **secure messaging platform** built to remove the dependency on phone-based login. It combines: - 🪪 **Face authentication** using FaceNet embeddings - 🔴 **Liveness challenges** to prevent spoofing - 🤖 **AI threat detection** to block low-quality or replay attacks - 🔐 **Dedicated face password** as a second biometric guard - 📡 **QR login support** to authorize browser sessions from the chat app --- ## 🧩 Current modules delivered ### Backend - backend/main.py - Accounts: /signup, /login, /refresh, /logout - User/message APIs: /users, /messages/{user1}/{user2} - Face enrollment: /enroll-face - Face login step 1: /face-login/verify-face - Face login step 2: /face-login/verify-password - Face status: /face-status/{username} - QR login: /qr/generate, /qr/status/{qr_token}, /qr/scan, /qr/confirm - WebSocket chat: /ws/{token} - backend/face_utils.py - FaceNet embedding extraction and normalization - Image quality checks and face verification - Strict matching using cosine and euclidean thresholds - backend/threat_detection.py - Spoof detection via blur, screen replay, face count, and lighting checks - Risk scoring and safe/blocked decision support ### Chat app (frontend) - frontend/src/App.js — handles login state and web-login redirect token - frontend/src/pages/Auth.js — username/password signup and login UI - frontend/src/pages/Chat.js — real-time messaging interface, contact list, message feed, face enrollment status, QR scanner modal - frontend/src/pages/FaceEnroll.js — face enrollment flow with camera capture and face password registration - frontend/src/pages/QRScanner.js — scan a QR code from the web login portal and confirm web session ### Web login portal (web-login) - web-login/src/App.js — navigation between landing, face login, and QR login - web-login/src/pages/LandingPage.js — choose login method screen - web-login/src/pages/FaceLogin.js — face authentication flow with username check, camera scan, and password verify - web-login/src/pages/LivenessCheck.js — random liveness challenge engine with face presence verification - web-login/src/pages/QRLogin.js — QR generation, timer, polling, and confirmed login redirect --- ## ✨ What is implemented - Backend auth and chat infrastructure - Full face enrollment and verification flows - Face login portal with liveness challenge - QR login flow between chat app and web portal - Real-time chat via WebSocket - Audit logging and rate limiting - Biometric security checks and spoof detection --- ## 📁 Project structure
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
└── web-login/
    ├── package.json
    └── src/
        ├── App.js
        └── pages/
            ├── LandingPage.js
            ├── FaceLogin.js
            ├── LivenessCheck.js
            └── QRLogin.js
--- ## 🚀 Setup ### Prerequisites - Python 3.11+ - Node.js 18+ - MongoDB running on mongodb://localhost:27017 ### Backend
bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn pymongo python-jose passlib[bcrypt] deepface opencv-python numpy
Start backend:
bash
uvicorn main:app --reload
### Chat app
bash
cd frontend
npm install
npm start
### Web login portal
bash
cd web-login
npm install
npm start
--- ## 📡 API Endpoints ### Auth and user - POST /signup - POST /login - POST /refresh - POST /logout - GET /users - GET /messages/{user1}/{user2} ### Face login - POST /enroll-face - POST /face-login/verify-face - POST /face-login/verify-password - GET /face-status/{username} ### QR login - POST /qr/generate - GET /qr/status/{qr_token} - POST /qr/scan - POST /qr/confirm --- ## 🔧 Notes - The chat app is the main messaging interface. - The web-login portal is a separate browser app for biometric or QR login. - Face login is currently built into the web-login portal, while chat app login remains username/password plus QR scanning. - The root package.json is minimal; the main front-end apps live in frontend/ and web-login/.
