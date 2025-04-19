import React, { useState, useEffect, useRef } from "react";
import styles from "./WaveformExplorer.module.css";

const WaveformExplorer = () => {
  const [waveform, setWaveform] = useState("sine");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get the computed styles to access CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle
      .getPropertyValue("--component-bg-darker")
      .trim();
    const primaryBlue = computedStyle.getPropertyValue("--primary-blue").trim();

    // Clear with background color from CSS
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = primaryBlue;
    ctx.lineWidth = 2;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Draw waveform (2 complete cycles)
    const cycles = 2;

    for (let x = 0; x < width; x++) {
      const t = (x / width) * Math.PI * 2 * cycles;
      let y = centerY;

      switch (waveform) {
        case "sine":
          y = centerY + Math.sin(t) * (height / 3);
          break;
        case "square":
          y = centerY + (Math.sin(t) > 0 ? 1 : -1) * (height / 3);
          break;
        case "sawtooth":
          y =
            centerY +
            ((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) * height * 0.6;
          break;
        case "triangle":
          y =
            centerY +
            (Math.abs((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) - 0.25) *
              height *
              1.2;
          break;
        default:
          y = centerY;
      }

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [waveform]);

  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        {["sine", "square", "sawtooth", "triangle"].map((type) => (
          <button
            key={type}
            onClick={() => setWaveform(type)}
            className={`${styles.button} ${
              waveform === type ? styles.selected : ""
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className={styles.canvas}
      />
    </div>
  );
};

export default WaveformExplorer;
