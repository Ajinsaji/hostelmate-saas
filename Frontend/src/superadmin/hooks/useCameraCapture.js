import { useState, useRef, useEffect, useCallback } from "react";
import { compressImage } from "../../utils/imageCompressor";

export function useCameraCapture({ defaultFacingMode = "user" } = {}) {
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState(defaultFacingMode); // 'user' (front) or 'environment' (back)
  const [capturedImage, setCapturedImage] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async (mode = facingMode) => {
    setError(null);
    setPermissionDenied(false);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setError("Camera API is not supported on this browser.");
      return false;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setHasCamera(true);
      setFacingMode(mode);
      return true;
    } catch (err) {
      // Gracefully handle permission dismissal & hardware availability without console error spam
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError" || err.name === "PermissionDismissedError") {
        setPermissionDenied(true);
        setError("Camera access was not granted.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setHasCamera(false);
        setError("No camera device was found.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setHasCamera(false);
        setError("Camera is currently in use by another application.");
      } else if (err.name === "SecurityError") {
        setHasCamera(false);
        setError("Camera access restricted due to security settings.");
      } else {
        setHasCamera(false);
        setError("Camera access was not granted.");
      }
      setIsActive(false);
      return false;
    }
  }, [facingMode]);

  const switchCamera = useCallback(() => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    startCamera(nextMode);
  }, [facingMode, startCamera]);

  const captureFrame = useCallback(async () => {
    if (!videoRef.current) return null;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Flip horizontally if front camera for natural mirror preview
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.85);

    // Validate captured frame basic quality
    if (!rawDataUrl || rawDataUrl.length < 500) {
      setError("Image looks blurry or empty. Please retake photo.");
      return null;
    }

    // Compress image to prevent giant payloads
    const compressed = await compressImage(rawDataUrl, { maxDimension: 1000, quality: 0.72 });
    const finalImage = compressed || rawDataUrl;

    setCapturedImage(finalImage);
    stopCamera();
    return finalImage;
  }, [facingMode, stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera(facingMode);
  }, [facingMode, startCamera]);

  const clearCaptured = useCallback(() => {
    setCapturedImage(null);
    stopCamera();
  }, [stopCamera]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    isActive,
    facingMode,
    capturedImage,
    hasCamera,
    permissionDenied,
    error,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    captureFrame,
    retake,
    clearCaptured,
    setCapturedImage,
  };
}

export default useCameraCapture;
