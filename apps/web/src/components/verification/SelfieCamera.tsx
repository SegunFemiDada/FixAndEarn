"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SelfieCameraProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

function canvasToFile(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to capture selfie."));
          return;
        }

        resolve(
          new File(
            [blob],
            `selfie-${Date.now()}.jpg`,
            { type: "image/jpeg" },
          ),
        );
      },
      "image/jpeg",
      quality,
    );
  });
}

async function createCompressedSelfie(
  canvas: HTMLCanvasElement,
): Promise<File> {
  const qualities = [0.9, 0.8, 0.7, 0.6, 0.5];

  for (const quality of qualities) {
    const file = await canvasToFile(canvas, quality);

    if (file.size <= MAX_FILE_SIZE) {
      return file;
    }
  }

  throw new Error("Captured selfie is still larger than 2 MB.");
}

export default function SelfieCamera({
  open,
  onClose,
  onCapture,
}: SelfieCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setStarting(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Your browser does not support live camera capture.",
        );
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      const message =
        error instanceof DOMException &&
        error.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera access and try again."
          : error instanceof DOMException &&
              error.name === "NotFoundError"
            ? "No front camera was found on this device."
            : "Unable to open the camera. Please check your browser permissions and try again.";

      setCameraError(message);
      stopCamera();
    } finally {
      setStarting(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    void startCamera();

    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  function handleCapture() {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Camera is not ready yet. Please try again.");
      return;
    }

    setCapturing(true);
    setCameraError(null);

    try {
      const maxDimension = 1280;
      const scale = Math.min(
        1,
        maxDimension / Math.max(video.videoWidth, video.videoHeight),
      );

      const canvas = document.createElement("canvas");

      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to capture selfie.");
      }

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      void createCompressedSelfie(canvas)
        .then((file) => {
          onCapture(file);
          stopCamera();
          onClose();
        })
        .catch((error) => {
          setCameraError(
            error instanceof Error
              ? error.message
              : "Unable to capture selfie.",
          );
        })
        .finally(() => {
          setCapturing(false);
        });
    } catch {
      setCapturing(false);
      setCameraError("Unable to capture selfie.");
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-[#111827] shadow-2xl">
        <div className="relative aspect-3/4 w-full overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
          />

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-black/20" />

            <div className="absolute left-1/2 top-1/2 h-[58%] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-4 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.24)]" />

            <div className="absolute left-1/2 top-8 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-center text-xs font-semibold text-white">
              Position your face inside the frame
            </div>

            <div className="absolute bottom-8 left-1/2 w-[85%] -translate-x-1/2 rounded-2xl bg-black/55 px-4 py-3 text-center text-xs leading-5 text-white">
              Keep your face centered, look directly at the camera,
              and use good lighting.
            </div>
          </div>

          {starting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <p className="rounded-xl bg-black/60 px-4 py-3 text-sm font-medium text-white">
                Opening camera…
              </p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-x-4 bottom-24 rounded-2xl border border-red-400/40 bg-red-950/90 p-4 text-sm text-red-100">
              {cameraError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-4">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-xl border border-gray-600 bg-gray-800 px-4 py-3 text-sm font-semibold text-gray-100 transition hover:bg-gray-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCapture}
            disabled={starting || capturing || !!cameraError}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {capturing ? "Capturing…" : "Take selfie"}
          </button>
        </div>
      </div>
    </div>
  );
}