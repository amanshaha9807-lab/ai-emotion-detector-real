# AI Facial Emotion Detector

A Flask web application that captures webcam frames in the browser and predicts facial-expression categories using the FER Python package. The model is initialized lazily on the first `/detect` request.

## Features

- Live webcam preview in the browser
- Facial-expression prediction and confidence score
- Start/stop camera controls
- Server health endpoint (`/health`)
- Optional standalone OpenCV webcam script (`emotion_detector.py`)

## Requirements

- Python **3.10 or 3.11** recommended. TensorFlow 2.15.1 in this requirements file does not support Python 3.14.
- A working webcam and a modern browser
- Internet access may be needed on the first model/dependency setup, but the app itself runs locally

## Setup (Windows PowerShell)

```powershell
cd ai_emotion_detector
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5000** in Chrome or Edge, allow camera permission, then click **Start Camera**. Click **Stop Camera** to release the webcam.

If `py -3.11` is unavailable, install Python 3.11 first. Do not use Python 3.14 with the pinned TensorFlow version.

## Setup (macOS / Linux)

```bash
cd ai_emotion_detector
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

## API

- `GET /` — web interface
- `GET /health` — application and model initialization status
- `POST /detect` — multipart form upload with field name `frame` containing a JPEG image

Example response:

```json
{
  "status": "detected",
  "emotion": "happy",
  "confidence": 91.2,
  "faces_count": 1
}
```

The first request may take longer because the model is loaded then. A failed model initialization is reported in the response and `/health` output.

## Project structure

```text
ai_emotion_detector/
├── app.py
├── emotion_model.py
├── emotion_detector.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── script.js
    └── style.css
```

## Notes

- Browser webcam access works on `localhost` / `127.0.0.1` or HTTPS. It generally will not work from an ordinary insecure network IP address.
- The FER package predicts visible facial-expression categories; it cannot reliably determine a person's true internal emotional state.
- Model predictions are probabilistic and can be affected by lighting, pose, occlusion, image quality, and individual expression differences.
- This is an educational demo, not a medical or psychological assessment tool.
