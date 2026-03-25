import cv2
import numpy as np
from deepface import DeepFace
import base64
import time

def base64_to_image(base64_str):
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    img_bytes = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

# ── 1. Blur Detection (printed photo attack) ──────────
def detect_blur(image, threshold=80):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return {
        "is_blurry": bool(variance < threshold),
        "score": round(float(variance), 2),
        "threat": "Blurry image / printed photo suspected" if variance < threshold else None
    }

# ── 2. Screen Replay Detection (moire pattern) ────────
def detect_screen_replay(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    f = np.fft.fft2(gray)
    fshift = np.fft.fftshift(f)
    magnitude = 20 * np.log(np.abs(fshift) + 1)
    h, w = magnitude.shape
    center_region = magnitude[h//4:3*h//4, w//4:3*w//4]
    edge_region = magnitude.copy()
    edge_region[h//4:3*h//4, w//4:3*w//4] = 0
    ratio = float(np.mean(edge_region)) / (float(np.mean(center_region)) + 1e-10)
    is_screen = ratio > 0.8
    return {
        "is_screen_replay": is_screen,
        "score": round(ratio, 4),
        "threat": "Screen replay / video attack suspected" if is_screen else None
    }

# ── 3. Face Spoofing (multiple faces / no face) ───────
def detect_face_count(base64_img):
    image = base64_to_image(base64_img)
    temp_path = "temp_threat.jpg"
    cv2.imwrite(temp_path, image)
    try:
        faces = DeepFace.extract_faces(
            img_path=temp_path,
            enforce_detection=True,
            detector_backend="opencv"
        )
        count = len(faces)
        return {
            "face_count": count,
            "multiple_faces": count > 1,
            "no_face": count == 0,
            "threat": "Multiple faces detected!" if count > 1 else (
                "No face detected!" if count == 0 else None
            )
        }
    except Exception:
        return {
            "face_count": 0,
            "multiple_faces": False,
            "no_face": True,
            "threat": "No face detected in image!"
        }

# ── 4. Lighting Analysis ──────────────────────────────
def detect_lighting(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mean_brightness = float(np.mean(gray))
    too_dark = mean_brightness < 40
    too_bright = mean_brightness > 220
    return {
        "brightness": round(mean_brightness, 2),
        "too_dark": too_dark,
        "too_bright": too_bright,
        "threat": "Too dark — possible attack" if too_dark else (
            "Too bright — possible overexposure attack" if too_bright else None
        )
    }

# ── 5. Master Threat Check ────────────────────────────
def run_threat_analysis(base64_img):
    image = base64_to_image(base64_img)
    threats = []
    risk_score = 0

    # Run all checks
    blur = detect_blur(image)
    screen = detect_screen_replay(image)
    face = detect_face_count(base64_img)
    lighting = detect_lighting(image)

    if blur["is_blurry"]:
        threats.append(blur["threat"])
        risk_score += 30

    if screen["is_screen_replay"]:
        threats.append(screen["threat"])
        risk_score += 40

    if face["multiple_faces"]:
        threats.append(face["threat"])
        risk_score += 50

    if face["no_face"]:
        threats.append(face["threat"])
        risk_score += 60

    if lighting["too_dark"] or lighting["too_bright"]:
        threats.append(lighting["threat"])
        risk_score += 20

    risk_level = (
        "HIGH" if risk_score >= 50 else
        "MEDIUM" if risk_score >= 25 else
        "LOW"
    )

    return {
        "safe": len(threats) == 0,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "threats": threats,
        "details": {
            "blur": blur,
            "screen_replay": screen,
            "face_count": face,
            "lighting": lighting
        }
    }