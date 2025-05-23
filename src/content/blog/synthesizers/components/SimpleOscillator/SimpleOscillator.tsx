import React, { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import VisuallyHidden from "@/components/VisuallyHidden";
import "./SimpleOscillator.module.css";
import "@/styles/shared/dark-mode.css";
import { Slider } from "@/components/Slider";
import IconButton from "@/components/Button/IconButton";

const SimpleOscillator = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const realWaveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440);
  const [waveform, setWaveform] = useState<OscillatorType>("sine");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(
        frequency,
        audioContextRef.current.currentTime
      );
    }
  }, [frequency]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = "#60a5fa"; // Always use the blue color
      ctx.lineWidth = 2;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const cycles = frequency / 100;

      for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * 2 * cycles;
        const y = centerY + Math.sin(t) * (height / 3) * 0.5;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    drawWaveform();
  }, [frequency]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const drawRealWaveform = () => {
    const canvas = realWaveformCanvasRef.current;
    const analyser = analyserRef.current;

    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getFloatTimeDomainData(dataArray);

      ctx.fillStyle = "rgb(17, 24, 39)"; // Always dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#60a5fa"; // Always use the blue color
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i];
        const y = ((v + 1) / 2) * canvas.height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;

    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    oscillatorRef.current = ctx.createOscillator();
    gainNodeRef.current = ctx.createGain();
    analyserRef.current = ctx.createAnalyser();

    if (
      !analyserRef.current ||
      !oscillatorRef.current ||
      !gainNodeRef.current
    ) {
      setError("Failed to initialize audio nodes");
      return;
    }

    analyserRef.current.fftSize = 2048;

    oscillatorRef.current.type = waveform;
    oscillatorRef.current.frequency.setValueAtTime(frequency, ctx.currentTime);

    oscillatorRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(analyserRef.current);
    analyserRef.current.connect(ctx.destination);

    const now = ctx.currentTime;
    gainNodeRef.current.gain.setValueAtTime(0, now);
    gainNodeRef.current.gain.linearRampToValueAtTime(0.5, now + 0.1);

    oscillatorRef.current.start();

    drawRealWaveform();

    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (
      oscillatorRef.current &&
      gainNodeRef.current &&
      audioContextRef.current
    ) {
      const now = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.1);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setTimeout(() => {
        if (oscillatorRef.current) {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
          oscillatorRef.current = null;
        }
      }, 100);
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      initAudio();
    }
  };

  return (
    <>
      <VisuallyHidden as="h3">Simple Oscillator</VisuallyHidden>
      <div className="visualizer-content">
        {error && (
          <div
            className="error-message"
            style={{ color: "red", marginBottom: "1rem" }}
          >
            {error}
          </div>
        )}
        <div className="controls">
          <IconButton
            onClick={togglePlay}
            icon={isPlaying ? <Pause /> : <Play />}
            aria-label={isPlaying ? "Stop" : "Play"}
          >
            {isPlaying ? "Stop" : "Play"}
          </IconButton>

          <div
            className="waveform-buttons"
            style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
          >
            {(["sine", "square", "triangle", "sawtooth"] as const).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => {
                    setWaveform(type);
                    if (oscillatorRef.current) {
                      oscillatorRef.current.type = type;
                    }
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    backgroundColor: waveform === type ? "#60a5fa" : "#1f2937",
                    color: waveform === type ? "#1f2937" : "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: waveform === type ? "bold" : "normal",
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              )
            )}
          </div>
        </div>

        <canvas
          ref={realWaveformCanvasRef}
          width={800}
          height={200}
          className="waveform-canvas"
        />

        <Slider
          value={frequency}
          onChange={(value) => setFrequency(value)}
          min={55}
          max={880}
          step={1}
          label="Frequency"
          showLabel={false}
          showValue={false}
        />
      </div>
    </>
  );
};

export default SimpleOscillator;
