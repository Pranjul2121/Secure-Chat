# backend/face_utils.py — PRODUCTION GRADE FACE MATCHING
# FIX: Strict threshold + multi-metric verification + quality checks

import cv2
import numpy as np
from deepface import DeepFace
import base64
import os
import logging

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────
COSINE_THRESHOLD    = 0.30   # cosine distance < 0.30 = same person (STRICT)
EUCLIDEAN_THRESHOLD = 10.0   # secondary check
TEMP_ENROLL = "temp_enroll.jpg"
TEMP_VERIFY = "temp_verify.jpg"


def base64_to_image(base64_str: str) -> np.ndarray:
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    base64_str = base64_str.strip()
    img_bytes  = base64.b64decode(base64_str)
    np_arr     = np.frombuffer(img_bytes, np.uint8)
    img        = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Image decode nahi hua — invalid image data")
    return img


def check_image_quality(img: np.ndarray) -> dict:
    gray       = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))
    issues     = []
    if blur_score < 50:
        issues.append("Image blurry hai — acche light mein seedha dekho")
    if brightness < 40:
        issues.append("Bahut dark hai — zyada roshni karo")
    if brightness > 230:
        issues.append("Bahut bright hai — direct light se door raho")
    return {"ok": len(issues) == 0, "issues": issues}


def _extract_embedding(temp_path: str, base64_img: str) -> list:
    img     = base64_to_image(base64_img)
    quality = check_image_quality(img)
    if not quality["ok"]:
        raise ValueError(quality["issues"][0])
    cv2.imwrite(temp_path, img)
    try:
        result = DeepFace.represent(
            img_path          = temp_path,
            model_name        = "Facenet",
            enforce_detection = True,
            detector_backend  = "opencv",
            align             = True,
        )
        if not result:
            raise ValueError("Face detect nahi hua!")
        emb_arr = np.array(result[0]["embedding"])
        if np.linalg.norm(emb_arr) == 0:
            raise ValueError("Invalid face embedding")
        # L2-normalize for consistent cosine comparison
        return (emb_arr / np.linalg.norm(emb_arr)).tolist()
    except Exception as e:
        err = str(e).lower()
        if "face" in err and ("detect" in err or "could not" in err):
            raise ValueError("Chehra clearly nahi dikh raha — seedha camera dekho, acchi roshni mein")
        raise ValueError(f"Face process nahi hua: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def get_face_embedding(base64_img: str) -> list:
    """Used during ENROLLMENT."""
    return _extract_embedding(TEMP_ENROLL, base64_img)


def get_face_embedding_for_verify(base64_img: str) -> list:
    """Used during VERIFICATION — separate temp file."""
    return _extract_embedding(TEMP_VERIFY, base64_img)


def compare_faces(stored_embedding: list, new_embedding: list) -> dict:
    """
    STRICT multi-metric face comparison.
    Both embeddings must be L2-normalized.
    Returns match=True ONLY if cosine AND euclidean both pass.
    """
    e1 = np.array(stored_embedding)
    e2 = np.array(new_embedding)

    n1, n2 = np.linalg.norm(e1), np.linalg.norm(e2)
    if n1 == 0 or n2 == 0:
        return {"match": False, "similarity": 0.0, "distance": 1.0,
                "confidence": "NONE", "reason": "Invalid embedding"}

    e1, e2 = e1 / n1, e2 / n2

    cosine_sim    = float(np.dot(e1, e2))
    cosine_dist   = 1.0 - cosine_sim
    euclidean_dist = float(np.linalg.norm(e1 - e2))
    similarity    = round(cosine_sim * 100, 2)

    cosine_ok    = cosine_dist < COSINE_THRESHOLD       # < 0.30
    euclidean_ok = euclidean_dist < EUCLIDEAN_THRESHOLD  # < 10.0
    match        = cosine_ok and euclidean_ok

    confidence = ("HIGH" if cosine_dist < 0.20 else
                  "MEDIUM" if cosine_dist < 0.30 else "LOW")

    reason = ""
    if not match:
        if not cosine_ok:
            reason = (f"Face match nahi hua (similarity {similarity}% — "
                      f"minimum {round((1-COSINE_THRESHOLD)*100)}% chahiye). "
                      f"Kisi aur ka chehra use mat karo.")
        else:
            reason = "Face secondary verification fail."

    logger.info(f"compare_faces: cos_dist={cosine_dist:.4f} eucl={euclidean_dist:.4f} match={match}")
    return {
        "match":      match,
        "similarity": similarity,
        "distance":   round(cosine_dist, 4),
        "euclidean":  round(euclidean_dist, 4),
        "confidence": confidence,
        "reason":     reason,
    }