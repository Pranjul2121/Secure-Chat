from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from threat_detection import run_threat_analysis
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from collections import defaultdict
from face_utils import get_face_embedding, compare_faces
import time
import secrets
import string

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MongoDB ────────────────────────────────────────────────
client = MongoClient("mongodb://localhost:27017/")
db           = client["securechat"]
users_col    = db["users"]
messages_col = db["messages"]
sessions_col = db["sessions"]
audit_col    = db["audit_logs"]
qr_col       = db["qr_sessions"]

# ── Crypto ────────────────────────────────────────────────
pwd_context        = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY         = "supersecretkey123_change_in_prod"
REFRESH_SECRET_KEY = "refreshsecretkey456_change_in_prod"
ALGORITHM          = "HS256"

# ── Rate limiting ─────────────────────────────────────────
login_attempts: dict = defaultdict(list)
MAX_ATTEMPTS    = 5
WINDOW_SECONDS  = 300

# ── Active WebSocket connections ──────────────────────────
active_users: dict = {}


# ══════════════════════════════════════════════════════════
# Pydantic Models
# ══════════════════════════════════════════════════════════
class UserModel(BaseModel):
    username: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class FaceEnrollModel(BaseModel):
    username: str
    image: str
    face_password: str

class FaceLoginStep1(BaseModel):
    username: str
    image: str

class FaceLoginStep2(BaseModel):
    username: str
    face_token: str
    face_password: str

class QRScanModel(BaseModel):
    qr_token: str
    chat_token: str


# ══════════════════════════════════════════════════════════
# Helper Functions
# ══════════════════════════════════════════════════════════
def now_utc():
    return datetime.now(timezone.utc)

def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    return pwd_context.verify(pw, hashed)

def create_access_token(username: str) -> str:
    exp = now_utc() + timedelta(hours=2)
    return jwt.encode({"sub": username, "exp": exp, "type": "access"}, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(username: str) -> str:
    exp = now_utc() + timedelta(days=7)
    return jwt.encode({"sub": username, "exp": exp, "type": "refresh"}, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

def create_face_temp_token(username: str) -> str:
    exp = now_utc() + timedelta(minutes=5)
    return jwt.encode({"sub": username, "exp": exp, "type": "face_temp"}, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> str:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") not in ("access", "face_temp"):
        raise JWTError("Wrong token type")
    return payload.get("sub")

def decode_refresh_token(token: str) -> str:
    payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
    return payload.get("sub")

def get_ip(request: Request) -> str:
    fwd = request.headers.get("X-Forwarded-For")
    return fwd.split(",")[0].strip() if fwd else request.client.host

def check_rate_limit(ip: str):
    t = time.time()
    recent = [x for x in login_attempts[ip] if t - x < WINDOW_SECONDS]
    login_attempts[ip] = recent
    if len(recent) >= MAX_ATTEMPTS:
        wait = int(WINDOW_SECONDS - (t - recent[0]))
        raise HTTPException(429, f"Bahut zyada attempts! {wait}s baad try karo.")

def record_fail(ip: str):
    login_attempts[ip].append(time.time())

def log_audit(event: str, username: str, ip: str, extra: dict = None):
    audit_col.insert_one({
        "event": event, "username": username, "ip": ip,
        "timestamp": now_utc(), "extra": extra or {}
    })

def gen_token(n=32) -> str:
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(n))


# ══════════════════════════════════════════════════════════
# Auth Routes
# ══════════════════════════════════════════════════════════
@app.get("/")
def home():
    return {"message": "SecureChat Backend v2.0"}


@app.post("/signup")
def signup(user: UserModel, request: Request):
    ip = get_ip(request)
    if len(user.username) < 3 or len(user.username) > 20:
        raise HTTPException(400, "Username 3-20 characters ka hona chahiye")
    if len(user.password) < 6:
        raise HTTPException(400, "Password kam se kam 6 characters")
    if users_col.find_one({"username": user.username}):
        raise HTTPException(400, "Username already exists")
    users_col.insert_one({
        "username": user.username,
        "password": hash_password(user.password),
        "online": False,
        "face_enrolled": False,
        "face_embedding": None,
        "face_password": None,
        "created_at": now_utc(),
        "last_login": None,
    })
    log_audit("signup", user.username, ip)
    return {"message": "Account ban gaya!"}


@app.post("/login")
def login(user: UserModel, request: Request):
    ip = get_ip(request)
    check_rate_limit(ip)
    db_user = users_col.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        record_fail(ip)
        log_audit("login_fail", user.username, ip)
        raise HTTPException(401, "Username ya password galat hai")
    login_attempts[ip] = []
    access  = create_access_token(user.username)
    refresh = create_refresh_token(user.username)
    sessions_col.insert_one({
        "username": user.username, "refresh_token": refresh, "ip": ip,
        "created_at": now_utc(),
        "expires_at": now_utc() + timedelta(days=7),
        "active": True
    })
    users_col.update_one({"username": user.username}, {"$set": {"last_login": now_utc()}})
    log_audit("login_success", user.username, ip)
    return {"access_token": access, "refresh_token": refresh, "username": user.username}


@app.post("/refresh")
def refresh_token_route(body: RefreshRequest):
    try:
        username = decode_refresh_token(body.refresh_token)
    except JWTError:
        raise HTTPException(401, "Invalid refresh token")
    session = sessions_col.find_one({"refresh_token": body.refresh_token, "active": True})
    if not session:
        raise HTTPException(401, "Session expired")
    return {"access_token": create_access_token(username), "username": username}


@app.post("/logout")
def logout(body: RefreshRequest, request: Request):
    sessions_col.update_one({"refresh_token": body.refresh_token}, {"$set": {"active": False}})
    try:
        username = decode_refresh_token(body.refresh_token)
        users_col.update_one({"username": username}, {"$set": {"online": False}})
        log_audit("logout", username, get_ip(request))
    except:
        pass
    return {"message": "Logout ho gaye!"}


# ══════════════════════════════════════════════════════════
# User / Message Routes
# ══════════════════════════════════════════════════════════
@app.get("/users")
def get_users():
    return list(users_col.find({}, {"_id": 0, "username": 1, "online": 1}))


@app.get("/messages/{user1}/{user2}")
def get_messages(user1: str, user2: str):
    msgs = messages_col.find({
        "$or": [
            {"sender": user1, "receiver": user2},
            {"sender": user2, "receiver": user1}
        ]
    }, {"_id": 0}).sort("timestamp", 1)
    return list(msgs)


# ══════════════════════════════════════════════════════════
# Face Routes
# ══════════════════════════════════════════════════════════
@app.post("/enroll-face")
def enroll_face(data: FaceEnrollModel):
    if len(data.face_password) < 4:
        raise HTTPException(400, "Face password kam se kam 4 characters")
    user = users_col.find_one({"username": data.username})
    if not user:
        raise HTTPException(404, "User nahi mila")
    try:
        embedding = get_face_embedding(data.image)
    except ValueError as e:
        raise HTTPException(400, str(e))
    users_col.update_one(
        {"username": data.username},
        {"$set": {
            "face_embedding": embedding,
            "face_enrolled": True,
            "face_password": hash_password(data.face_password)
        }}
    )
    return {"message": "Face aur face password set ho gaya!"}


@app.post("/face-login/verify-face")
def face_login_step1(data: FaceLoginStep1, request: Request):
    ip = get_ip(request)
    check_rate_limit(ip)
    user = users_col.find_one({"username": data.username})
    if not user:
        record_fail(ip)
        raise HTTPException(404, "User nahi mila")
    if not user.get("face_enrolled"):
        raise HTTPException(400, "Face enroll nahi hai")
    try:
        new_emb = get_face_embedding(data.image)
    except ValueError as e:
        raise HTTPException(400, str(e))
    result = compare_faces(user["face_embedding"], new_emb)
    log_audit("face_verify", data.username, ip, {"match": result["match"]})
    if not result["match"]:
        record_fail(ip)
        raise HTTPException(401, f"Face match nahi hua. Similarity: {round(result['similarity'], 2)}%")
    face_temp = create_face_temp_token(data.username)
    return {
        "face_verified": True,
        "face_temp_token": face_temp,
        "similarity": round(result["similarity"], 2),
        "message": "Face verify ho gaya! Ab face password dalo."
    }


@app.post("/face-login/verify-password")
def face_login_step2(data: FaceLoginStep2, request: Request):
    ip = get_ip(request)
    try:
        payload = jwt.decode(data.face_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "face_temp":
            raise JWTError("wrong type")
        username = payload.get("sub")
        if username != data.username:
            raise JWTError("mismatch")
    except JWTError:
        raise HTTPException(401, "Face token invalid ya expired. Dobara face scan karo.")
    user = users_col.find_one({"username": data.username})
    if not user or not user.get("face_password"):
        raise HTTPException(400, "Face password set nahi hai")
    if not verify_password(data.face_password, user["face_password"]):
        record_fail(ip)
        log_audit("face_password_fail", data.username, ip)
        raise HTTPException(401, "Face password galat hai!")
    login_attempts[ip] = []
    access  = create_access_token(data.username)
    refresh = create_refresh_token(data.username)
    sessions_col.insert_one({
        "username": data.username, "refresh_token": refresh, "ip": ip,
        "created_at": now_utc(),
        "expires_at": now_utc() + timedelta(days=7),
        "active": True, "login_method": "face"
    })
    users_col.update_one({"username": data.username}, {"$set": {"last_login": now_utc()}})
    log_audit("face_login_success", data.username, ip)
    return {"access_token": access, "refresh_token": refresh, "username": data.username}


@app.get("/face-status/{username}")
def face_status(username: str):
    user = users_col.find_one({"username": username})
    if not user:
        raise HTTPException(404, "User nahi mila")
    return {
        "enrolled": user.get("face_enrolled", False),
        "has_face_password": bool(user.get("face_password"))
    }


# ══════════════════════════════════════════════════════════
# QR Login Routes  ← FIXED
# ══════════════════════════════════════════════════════════
@app.post("/qr/generate")
def qr_generate():
    """Web browser isko call karta hai — QR token generate hota hai"""
    try:
        token = gen_token(32)
        expires_at = now_utc() + timedelta(minutes=2)
        qr_col.insert_one({
            "qr_token": token,
            "status": "pending",
            "username": None,
            "access_token": None,
            "created_at": now_utc(),
            "expires_at": expires_at
        })
        return {"qr_token": token, "expires_in": 120}
    except Exception as e:
        raise HTTPException(500, f"QR generate nahi hua: {str(e)}")


@app.get("/qr/status/{qr_token}")
def qr_status(qr_token: str):
    """Web browser har 1.5s mein poll karta hai"""
    session = qr_col.find_one({"qr_token": qr_token}, {"_id": 0})
    if not session:
        raise HTTPException(404, "QR session nahi mili")

    # Timezone-aware comparison fix
    exp = session["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    if now_utc() > exp:
        qr_col.update_one({"qr_token": qr_token}, {"$set": {"status": "expired"}})
        return {"status": "expired"}

    if session["status"] == "confirmed":
        return {
            "status": "confirmed",
            "access_token": session["access_token"],
            "username": session["username"]
        }
    return {"status": session["status"]}


@app.post("/qr/scan")
def qr_scan(data: QRScanModel, request: Request):
    """Chat app se scan karne pe call hota hai"""
    ip = get_ip(request)
    try:
        username = decode_access_token(data.chat_token)
    except JWTError:
        raise HTTPException(401, "Chat session invalid. Pehle login karo.")

    session = qr_col.find_one({"qr_token": data.qr_token})
    if not session:
        raise HTTPException(404, "QR code nahi mila")
    if session["status"] != "pending":
        raise HTTPException(400, f"QR already {session['status']} hai")

    exp = session["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if now_utc() > exp:
        raise HTTPException(400, "QR expire ho gaya. Naya QR lo.")

    qr_col.update_one(
        {"qr_token": data.qr_token},
        {"$set": {"status": "scanned", "username": username}}
    )
    log_audit("qr_scan", username, ip)
    return {"message": f"Scan ho gaya! Confirm karo."}


@app.post("/qr/confirm")
def qr_confirm(data: QRScanModel, request: Request):
    """Chat app confirm button pe call hota hai"""
    ip = get_ip(request)
    try:
        username = decode_access_token(data.chat_token)
    except JWTError:
        raise HTTPException(401, "Chat token invalid")

    session = qr_col.find_one({"qr_token": data.qr_token})
    if not session:
        raise HTTPException(404, "QR session nahi mili")
    if session["status"] not in ("pending", "scanned"):
        raise HTTPException(400, "QR already used ya expired")

    exp = session["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if now_utc() > exp:
        raise HTTPException(400, "QR expire ho gaya")

    web_token = create_access_token(username)
    qr_col.update_one(
        {"qr_token": data.qr_token},
        {"$set": {
            "status": "confirmed",
            "username": username,
            "access_token": web_token,
            "confirmed_at": now_utc()
        }}
    )
    log_audit("qr_login_confirmed", username, ip)
    return {"message": "Web login confirm ho gaya!"}


# ══════════════════════════════════════════════════════════
# WebSocket
# ══════════════════════════════════════════════════════════
@app.websocket("/ws/{token}")
async def websocket_handler(websocket: WebSocket, token: str):
    try:
        username = decode_access_token(token)
    except JWTError:
        await websocket.close()
        return

    await websocket.accept()
    active_users[username] = websocket
    users_col.update_one({"username": username}, {"$set": {"online": True}})
    print(f"✅ {username} connected")

    try:
        while True:
            data = await websocket.receive_text()
            parts = data.split("|", 1)
            if len(parts) != 2:
                continue
            receiver, message = parts
            message = message.strip()
            if not message or len(message) > 2000:
                continue
            messages_col.insert_one({
                "sender": username, "receiver": receiver,
                "message": message, "timestamp": now_utc()
            })
            if receiver in active_users:
                await active_users[receiver].send_text(
                    f'{{"sender":"{username}","message":"{message}"}}'
                )
    except WebSocketDisconnect:
        active_users.pop(username, None)
        users_col.update_one({"username": username}, {"$set": {"online": False}})
        print(f"❌ {username} disconnected")

@app.post("/verify-face")
def verify_face(data: dict):
    username = data.get("username")
    image_base64 = data.get("image")

    if not username or not image_base64:
        raise HTTPException(status_code=400, detail="Username aur image dono chahiye")

    # ── AI Threat Check pehle ──
    threat = run_threat_analysis(image_base64)
    if not threat["safe"]:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Security threat detected! Login block ho gaya.",
                "risk_level": threat["risk_level"],
                "risk_score": threat["risk_score"],
                "threats": threat["threats"]
            }
        )

    user = users_col.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User nahi mila")

    if not user.get("face_enrolled"):
        raise HTTPException(status_code=400, detail="Face enroll nahi hai")

    try:
        from face_utils import get_face_embedding, compare_faces
        new_embedding = get_face_embedding(image_base64)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = compare_faces(user["face_embedding"], new_embedding)

    if result["match"]:
        return {
            "verified": True,
            "similarity": round(result["similarity"], 2),
            "message": "Face verify ho gaya!",
            "security": {
                "risk_level": threat["risk_level"],
                "risk_score": threat["risk_score"]
            }
        }
    else:
        raise HTTPException(
            status_code=401,
            detail=f"Face match nahi hua. Similarity: {round(result['similarity'], 2)}%"
        )