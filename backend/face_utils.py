import cv2
import numpy as np
from deepface import DeepFace
import base64
import uuid
import os

# 🔹 Convert base64 → OpenCV image
def base64_to_image(base64_str):
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]

        img_bytes = base64.b64decode(base64_str)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Image decode failed")

        return img

    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")


# 🔹 Generate face embedding
def get_face_embedding(base64_img):
    img = base64_to_image(base64_img)

    # ✅ Unique temp file (no overwrite issue)
    temp_path = f"temp_{uuid.uuid4().hex}.jpg"
    cv2.imwrite(temp_path, img)

    try:
        result = DeepFace.represent(
            img_path=temp_path,
            model_name="Facenet",   # Fast + accurate
            enforce_detection=False # ✅ avoids crash on slight issues
        )

        if not result or len(result) == 0:
            raise ValueError("Face detect nahi hua")

        embedding = result[0]["embedding"]

        return embedding

    except Exception as e:
        raise ValueError(f"Face detect nahi hua: {str(e)}")

    finally:
        # ✅ Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


# 🔹 Compare two face embeddings
def compare_faces(embedding1, embedding2, threshold=0.6):
    e1 = np.array(embedding1)
    e2 = np.array(embedding2)

    # Normalize vectors (important for stability)
    e1 = e1 / np.linalg.norm(e1)
    e2 = e2 / np.linalg.norm(e2)

    # Cosine similarity
    cosine_sim = np.dot(e1, e2)
    distance = 1 - cosine_sim

    similarity_percent = cosine_sim * 100

    # ✅ Debug logs (VERY IMPORTANT)
    print("----- FACE MATCH DEBUG -----")
    print(f"Similarity: {similarity_percent:.2f}%")
    print(f"Distance: {distance:.4f}")
    print("----------------------------")

    return {
        "match": bool(distance < threshold),
        "distance": float(distance),
        "similarity": float(similarity_percent)
    }