"""Facial-expression detection wrapper around the FER package."""
from __future__ import annotations

from threading import Lock
from typing import Any

import cv2

_detector: Any | None = None
_model_error: str | None = None
_detector_lock = Lock()


def initialize_detector():
    """Load FER only once, on the first detection request."""
    global _detector, _model_error
    if _detector is not None:
        return _detector

    with _detector_lock:
        if _detector is not None:
            return _detector
        try:
            from fer import FER
            _detector = FER(mtcnn=True)
            _model_error = None
            return _detector
        except Exception as exc:  # dependency/model initialization errors
            _model_error = f"{type(exc).__name__}: {exc}"
            raise RuntimeError("Emotion model could not be loaded. Check the installed dependencies.") from exc


def get_model_status() -> dict[str, Any]:
    return {"loaded": _detector is not None, "error": _model_error}


def detect_emotion(frame) -> dict[str, Any]:
    """Return the strongest predicted facial-expression class for the first face."""
    if frame is None or not hasattr(frame, "shape") or frame.size == 0:
        return {"status": "invalid_frame", "emotion": "Unavailable", "confidence": 0}

    try:
        detector = initialize_detector()
        # FER accepts OpenCV BGR frames. Keep the aspect ratio while limiting work.
        height, width = frame.shape[:2]
        scale = min(1.0, 640 / max(width, height))
        if scale < 1.0:
            frame = cv2.resize(frame, (int(width * scale), int(height * scale)))

        results = detector.detect_emotions(frame)
        if not results:
            return {"status": "no_face", "emotion": "No face", "confidence": 0, "faces_count": 0}

        face = results[0]
        emotions = face.get("emotions") or {}
        if not emotions:
            return {"status": "no_result", "emotion": "Unavailable", "confidence": 0,
                    "faces_count": len(results)}

        emotion = max(emotions, key=emotions.get)
        confidence = max(0.0, min(1.0, float(emotions[emotion])))
        return {
            "status": "detected",
            "emotion": str(emotion),
            "confidence": round(confidence * 100, 1),
            "faces_count": len(results),
        }
    except Exception as exc:
        return {
            "status": "error",
            "emotion": "Unavailable",
            "confidence": 0,
            "message": f"{type(exc).__name__}: {exc}",
        }
