"""Optional standalone webcam version (does not use the Flask web page)."""
import cv2
from emotion_model import detect_emotion


def main():
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        raise RuntimeError("Could not open webcam. Check camera permissions or device index.")

    print("Emotion detector started. Press Q to quit.")
    try:
        while True:
            ok, frame = camera.read()
            if not ok:
                print("Could not read a frame from the webcam.")
                break

            result = detect_emotion(frame)
            if result["status"] == "detected":
                label = f'{result["emotion"].upper()}  {result["confidence"]:.1f}%'
                color = (0, 220, 100)
            else:
                label = result.get("emotion", "Unavailable")
                color = (0, 180, 255)

            cv2.putText(frame, label, (20, 40), cv2.FONT_HERSHEY_SIMPLEX,
                        0.9, color, 2, cv2.LINE_AA)
            cv2.imshow("AI Facial Emotion Detector", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        camera.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
