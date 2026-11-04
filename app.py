"""Flask web application for live facial-expression recognition."""
from flask import Flask, jsonify, render_template, request
import cv2
import numpy as np

from emotion_model import detect_emotion, get_model_status

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB per frame


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify({"application": "running", "model": get_model_status()})


@app.post("/detect")
def detect():
    uploaded = request.files.get("frame")
    if uploaded is None:
        return jsonify({"status": "invalid_request", "emotion": "Unavailable",
                        "confidence": 0, "message": "Frame is missing"}), 400

    data = uploaded.read()
    if not data:
        return jsonify({"status": "invalid_frame", "emotion": "Unavailable",
                        "confidence": 0, "message": "Uploaded frame is empty"}), 400

    image = np.frombuffer(data, dtype=np.uint8)
    frame = cv2.imdecode(image, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({"status": "invalid_frame", "emotion": "Unavailable",
                        "confidence": 0, "message": "Could not decode the image"}), 400

    result = detect_emotion(frame)
    if result.get("status") == "error":
        return jsonify(result), 503
    return jsonify(result)


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"status": "error", "message": "Frame is too large (maximum 5 MB)."}), 413


if __name__ == "__main__":
    # Use http://127.0.0.1:5000; webcam access is permitted on localhost.
    app.run(host="127.0.0.1", port=5000, debug=False)
