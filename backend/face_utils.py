# backend/face_utils.py — FINAL FIXED VERSION
# All bugs fixed:
# 1. COSINE_THRESHOLD = 0.30 (70% minimum similarity)
# 2. EUCLIDEAN_THRESHOLD = 0.77 (correct for normalized vectors, was 10.0 = useless)
# 3. L2 normalization on both enrollment and verification
# 4. Separate temp files for enroll vs verify

import cv2
import numpy as np
from deepface import DeepFace
import base64
import os
import logging

logger = logging.getLogger(__name__)

# ── Thresholds ────────────────────────────────────────────
# For L2-normalized unit vectors: euclidean = sqrt(2 * cosine_dist)
# cosine_dist < 0.30 → similarity > 70% → euclidean < 0.775
COSINE_THRESHOLD    = 0.30    # cosine distance threshold (primary)
EUCLIDEAN_THRESHOLD = 0.77    # ✅ FIXED: was 10.0 (always passed!) → now 0.77 (strict)

TEMP_ENROLL = "temp_enroll.jpg"
TEMP_VERIFY = "temp_verify.jpg"


def base64_to_image(base64_str: str) -> np.ndarray:
    """Handle both 'data:image/jpeg;base64,XXX' and plain base64."""
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
    """Basic quality gate before embedding extraction."""
    gray       = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))
    issues     = []
    if blur_score < 40:
        issues.append("Image blurry hai — seedha dekho aur camera stable rakho")
    if brightness < 35:
        issues.append("Bahut dark hai — zyada roshni karo")
    if brightness > 235:
        issues.append("Bahut bright hai — direct light se door raho")
    return {"ok": len(issues) == 0, "issues": issues}


def _extract_normalized_embedding(temp_path: str, base64_img: str) -> list:
    """
    Core embedding extraction:
    1. Decode base64 → image
    2. Quality check
    3. FaceNet embedding (128-d)
    4. L2-normalize → unit vector
    5. Return as list
    """
    img = base64_to_image(base64_img)

    quality = check_image_quality(img)
    if not quality["ok"]:
        raise ValueError(quality["issues"][0])

    # Save to disk (DeepFace needs file path)
    cv2.imwrite(temp_path, img)

    try:
        result = DeepFace.represent(
            img_path          = temp_path,
            model_name        = "Facenet",
            enforce_detection = True,
            detector_backend  = "opencv",
            align             = True,       # align face landmarks for consistency
        )

        if not result:
            raise ValueError("Face detect nahi hua!")

        raw_emb = np.array(result[0]["embedding"], dtype=np.float64)

        # Validate
        norm = np.linalg.norm(raw_emb)
        if norm == 0:
            raise ValueError("Face embedding invalid (zero vector)")

        # ✅ L2-normalize → unit vector (makes cosine = dot product)
        normalized = raw_emb / norm

        logger.info(f"Embedding extracted: norm={float(np.linalg.norm(normalized)):.4f} (should be 1.0)")
        return normalized.tolist()

    except Exception as e:
        msg = str(e).lower()
        if any(k in msg for k in ["face", "detect", "could not", "no face"]):
            raise ValueError("Chehra clearly nahi dikh raha — seedha camera dekho, acchi roshni mein")
        raise ValueError(f"Face process nahi hua: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def get_face_embedding(base64_img: str) -> list:
    """Called during ENROLLMENT — uses temp_enroll.jpg"""
    return _extract_normalized_embedding(TEMP_ENROLL, base64_img)


def get_face_embedding_for_verify(base64_img: str) -> list:
    """Called during VERIFICATION — uses temp_verify.jpg (separate file to avoid race)"""
    return _extract_normalized_embedding(TEMP_VERIFY, base64_img)


def compare_faces(stored_embedding: list, new_embedding: list) -> dict:
    """
    STRICT dual-metric face comparison.

    Both embeddings should already be L2-normalized unit vectors.
    We re-normalize defensively to handle old non-normalized stored embeddings.

    Match criteria (BOTH must pass):
      1. Cosine distance < 0.30  (similarity > 70%)
      2. Euclidean distance < 0.77  (mathematically equivalent for unit vectors)

    Returns:
      match      : bool
      similarity : float (0-100%)
      distance   : cosine distance
      euclidean  : euclidean distance
      confidence : HIGH / MEDIUM / LOW
      reason     : why rejected (if no match)
    """
    e1 = np.array(stored_embedding, dtype=np.float64)
    e2 = np.array(new_embedding,    dtype=np.float64)

    # Defensive re-normalization (handles old non-normalized stored embeddings)
    n1, n2 = np.linalg.norm(e1), np.linalg.norm(e2)
    if n1 == 0 or n2 == 0:
        return {
            "match": False, "similarity": 0.0, "distance": 1.0,
            "euclidean": 2.0, "confidence": "NONE",
            "reason": "Invalid embedding — re-enroll karo"
        }
    e1 = e1 / n1
    e2 = e2 / n2

    # ── Metric 1: Cosine similarity (dot product of unit vectors) ──
    cosine_sim  = float(np.dot(e1, e2))
    cosine_dist = 1.0 - cosine_sim
    similarity  = round(cosine_sim * 100, 2)

    # ── Metric 2: Euclidean distance ──────────────────────────────
    # For unit vectors: euclidean = sqrt(2 * cosine_dist)
    # So both metrics are mathematically linked, but we check both
    # to catch any numerical edge cases
    euclidean_dist = float(np.linalg.norm(e1 - e2))

    # ── Decision (BOTH must pass) ─────────────────────────────────
    cosine_ok    = cosine_dist    < COSINE_THRESHOLD     # < 0.30 → sim > 70%
    euclidean_ok = euclidean_dist < EUCLIDEAN_THRESHOLD  # < 0.77 (was 10.0!)
    match        = cosine_ok and euclidean_ok

    # Confidence
    if cosine_dist < 0.15:
        confidence = "VERY HIGH"
    elif cosine_dist < 0.20:
        confidence = "HIGH"
    elif cosine_dist < 0.30:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    # Reason for rejection
    reason = ""
    if not match:
        min_sim = round((1 - COSINE_THRESHOLD) * 100)
        reason = (
            f"Face match nahi hua — similarity {similarity}% hai, "
            f"minimum {min_sim}% chahiye. "
            f"Seedha camera dekho, same angle mein jiasme enroll kiya tha."
        )

    logger.info(
        f"compare_faces → sim={similarity}% cos_dist={cosine_dist:.4f} "
        f"eucl={euclidean_dist:.4f} match={match} conf={confidence}"
    )

    return {
        "match":      match,
        "similarity": similarity,
        "distance":   round(cosine_dist, 4),
        "euclidean":  round(euclidean_dist, 4),
        "confidence": confidence,
        "reason":     reason,
    }