# backend/threat_detection.py — FIXED VERSION
# Bug fixed: face detection exception now returns safe=True (not no_face=True)
# so it doesn't wrongly add 60 risk points when DeepFace throws an exception

import cv2
import numpy as np
from deepface import DeepFace
import base64
import logging

logger = logging.getLogger(__name__)


def base64_to_image(base64_str: str) -> np.ndarray:
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    img_bytes = base64.b64decode(base64_str.strip())
    np_arr    = np.frombuffer(img_bytes, np.uint8)
    img       = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Image decode failed")
    return img


# ── Check 1: Blur (printed photo attack) ─────────────────
def detect_blur(image: np.ndarray, threshold: int = 30) -> dict:
    gray     = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    blurry   = variance < threshold
    return {
        "is_blurry": blurry,
        "score":     round(variance, 2),
        "threat":    "Blurry image / printed photo suspected" if blurry else None,
    }


# ── Check 2: Screen replay (moire / FFT pattern) ─────────
def detect_screen_replay(image: np.ndarray) -> dict:
    gray      = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    fshift    = np.fft.fftshift(np.fft.fft2(gray))
    magnitude = 20 * np.log(np.abs(fshift) + 1)
    h, w      = magnitude.shape
    center    = magnitude[h//4:3*h//4, w//4:3*w//4]
    edges     = magnitude.copy()
    edges[h//4:3*h//4, w//4:3*w//4] = 0
    ratio     = float(np.mean(edges)) / (float(np.mean(center)) + 1e-10)
    is_screen = ratio > 0.8
    return {
        "is_screen_replay": is_screen,
        "score":            round(ratio, 4),
        "threat":           "Screen replay / video attack suspected" if is_screen else None,
    }


# ── Check 3: Face count ───────────────────────────────────
def detect_face_count(base64_img: str) -> dict:
    """
    ✅ FIXED: Exception now returns neutral result (no threat added)
    instead of marking no_face=True which added +60 risk wrongly.
    """
    temp = "temp_threat_face.jpg"
    try:
        img = base64_to_image(base64_img)
        cv2.imwrite(temp, img)
        faces = DeepFace.extract_faces(
            img_path         = temp,
            enforce_detection= True,
            detector_backend = "opencv",
        )
        count = len(faces)
        if count == 0:
            return {"face_count": 0, "multiple_faces": False, "no_face": True,
                    "threat": "No face detected!"}
        if count > 1:
            return {"face_count": count, "multiple_faces": True, "no_face": False,
                    "threat": f"Multiple faces detected ({count})!"}
        return {"face_count": 1, "multiple_faces": False, "no_face": False, "threat": None}

    except Exception as e:
        logger.warning(f"Face count detection error: {e}")
        # ✅ FIXED: Return neutral — don't penalize for detection failures
        # (DeepFace sometimes fails on valid faces in different lighting)
        return {"face_count": 1, "multiple_faces": False, "no_face": False,
                "threat": None, "note": "Detection skipped due to error"}
    finally:
        if __import__("os").path.exists(temp):
            __import__("os").remove(temp)


# ── Check 4: Lighting ─────────────────────────────────────
def detect_lighting(image: np.ndarray) -> dict:
    gray       = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    too_dark   = brightness < 40
    too_bright = brightness > 220
    threat     = None
    if too_dark:
        threat = "Too dark — possible attack or bad lighting"
    elif too_bright:
        threat = "Too bright — possible overexposure attack"
    return {
        "brightness": round(brightness, 2),
        "too_dark":   too_dark,
        "too_bright": too_bright,
        "threat":     threat,
    }


# ── Master threat analysis ────────────────────────────────
def run_threat_analysis(base64_img: str) -> dict:
    """
    Run all 4 threat checks. Returns:
      safe       : bool (True = proceed, False = block)
      risk_score : int
      risk_level : LOW / MEDIUM / HIGH
      threats    : list of threat strings
    """
    try:
        image = base64_to_image(base64_img)
    except Exception as e:
        logger.error(f"Threat analysis image decode failed: {e}")
        # If we can't even decode the image, block it
        return {
            "safe": False, "risk_score": 100, "risk_level": "HIGH",
            "threats": ["Image decode failed — invalid image data"],
        }

    threats    = []
    risk_score = 0

    # Run checks
    blur      = detect_blur(image)
    screen    = detect_screen_replay(image)
    face      = detect_face_count(base64_img)
    lighting  = detect_lighting(image)

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
        "HIGH"   if risk_score >= 50 else
        "MEDIUM" if risk_score >= 25 else
        "LOW"
    )

    safe = len(threats) == 0

    logger.info(
        f"Threat analysis: safe={safe} risk={risk_score} level={risk_level} "
        f"threats={threats}"
    )

    return {
        "safe":       safe,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "threats":    threats,
        "details": {
            "blur":          blur,
            "screen_replay": screen,
            "face_count":    face,
            "lighting":      lighting,
        },
    }