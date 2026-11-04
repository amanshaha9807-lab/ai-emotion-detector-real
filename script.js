(() => {
  const video = document.getElementById("camera");
  const startButton = document.getElementById("start");
  const stopButton = document.getElementById("stop");
  const emotionElement = document.getElementById("emotion");
  const confidenceElement = document.getElementById("confidence");
  const progressBar = document.getElementById("progress-bar");
  const cameraStatus = document.querySelector(".status");
  const placeholder = document.getElementById("camera-placeholder");
  const faceCount = document.getElementById("face-count");

  let stream = null;
  let detecting = false;
  let requestId = 0;
  let nextTimer = null;

  function updateStatus(message, color) {
    cameraStatus.textContent = `● ${message}`;
    cameraStatus.style.color = color;
  }

  function resetResult(message) {
    emotionElement.textContent = message;
    confidenceElement.textContent = "Confidence: 0%";
    progressBar.style.width = "0%";
    faceCount.textContent = "No face analyzed yet";
  }

  function stopCamera() {
    detecting = false;
    requestId += 1;
    if (nextTimer !== null) {
      window.clearTimeout(nextTimer);
      nextTimer = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    video.pause();
    video.srcObject = null;
    placeholder.hidden = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    updateStatus("Ready", "#94a3b8");
    resetResult("Stopped");
  }

  async function detectEmotion(activeRequest) {
    if (!detecting || activeRequest !== requestId) return;

    if (!video.videoWidth || !video.videoHeight) {
      nextTimer = window.setTimeout(() => detectEmotion(activeRequest), 500);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      updateStatus("Browser error", "#ef4444");
      resetResult("Canvas unavailable");
      stopCamera();
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
      if (!blob) throw new Error("Could not capture a camera frame");
      if (!detecting || activeRequest !== requestId) return;

      const formData = new FormData();
      formData.append("frame", blob, "frame.jpg");
      const response = await fetch("/detect", { method: "POST", body: formData });
      const result = await response.json().catch(() => ({}));
      if (!detecting || activeRequest !== requestId) return;

      if (!response.ok || result.status === "error") {
        updateStatus("Detection error", "#ef4444");
        resetResult(result.message || "Could not analyze frame");
      } else if (result.status === "no_face") {
        updateStatus("Searching for face", "#eab308");
        resetResult("No face detected");
      } else if (result.status === "detected") {
        const confidence = Math.max(0, Math.min(100, Number(result.confidence) || 0));
        emotionElement.textContent = result.emotion || "Unknown";
        confidenceElement.textContent = `Confidence: ${confidence.toFixed(1)}%`;
        progressBar.style.width = `${confidence}%`;
        faceCount.textContent = `${result.faces_count || 1} face(s) detected`;
        updateStatus("Face detected", "#22c55e");
      } else {
        updateStatus("Processing", "#eab308");
        resetResult(result.emotion || "Waiting...");
      }
    } catch (error) {
      if (detecting && activeRequest === requestId) {
        console.error("Emotion detection failed:", error);
        updateStatus("Connection error", "#ef4444");
        resetResult("Could not connect to server");
      }
    } finally {
      if (detecting && activeRequest === requestId) {
        nextTimer = window.setTimeout(() => detectEmotion(activeRequest), 1200);
      }
    }
  }

  startButton.addEventListener("click", async () => {
    if (detecting) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      updateStatus("Camera unsupported", "#ef4444");
      resetResult("Use a modern browser on localhost or HTTPS");
      return;
    }

    try {
      updateStatus("Connecting...", "#eab308");
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      placeholder.hidden = true;
      detecting = true;
      requestId += 1;
      startButton.disabled = true;
      stopButton.disabled = false;
      updateStatus("Camera active", "#22c55e");
      resetResult("Detecting...");
      detectEmotion(requestId);
    } catch (error) {
      console.error("Camera error:", error);
      updateStatus("Camera unavailable", "#ef4444");
      resetResult("Allow camera permission and try again");
      stopCamera();
      updateStatus("Camera unavailable", "#ef4444");
    }
  });

  stopButton.addEventListener("click", stopCamera);
  window.addEventListener("pagehide", () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
  });

  stopButton.disabled = true;
  updateStatus("Ready", "#94a3b8");
  resetResult("Waiting...");
})();
