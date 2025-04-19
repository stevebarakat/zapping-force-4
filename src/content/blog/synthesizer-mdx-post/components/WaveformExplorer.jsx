import React, { useState, useEffect, useRef } from "react";

const WaveformExplorer = () => {
  const [waveform, setWaveform] = useState("sine");
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = 0; x < width; x += width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y < height; y += height / 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw center line
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Set line style for waveform
    ctx.strokeStyle = "#4F46E5";
    ctx.lineWidth = 3;

    // Start drawing path
    ctx.beginPath();

    // Calculate center Y position
    const centerY = height / 2;

    // Draw waveform (2 complete cycles)
    const cycles = 2;

    for (let x = 0; x < width; x++) {
      // Calculate the normalized position in the wave cycle
      const t = (x / width) * Math.PI * 2 * cycles;

      // Calculate Y position based on waveform type
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

    // Stroke the path
    ctx.stroke();

    // Add waveform label
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#1F2937";
    ctx.textAlign = "center";
    ctx.fillText(
      waveform.charAt(0).toUpperCase() + waveform.slice(1) + " Wave",
      width / 2,
      height - 10
    );
  }, [waveform]);

  return (
    <div className="waveform-explorer">
      <div className="waveform-buttons">
        <div className="button-group">
          {["sine", "square", "sawtooth", "triangle"].map((type) => (
            <button
              key={type}
              onClick={() => setWaveform(type)}
              className={`waveform-button ${
                waveform === type ? "selected" : ""
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="waveform-canvas"
        style={{
          width: "100%",
          maxWidth: "600px",
          height: "200px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          marginTop: "16px",
          marginBottom: "24px",
        }}
      />
      <style jsx>{`
        .waveform-explorer {
          margin: 24px 0;
          padding: 16px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .waveform-buttons {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }

        .button-group {
          display: flex;
          gap: 8px;
        }

        .waveform-button {
          padding: 8px 12px;
          background-color: #f3f4f6;
          border: none;
          border-radius: 4px;
          font-size: var(--font-size-xs);
          font-weight: 500;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .waveform-button:hover {
          background-color: #e5e7eb;
        }

        .waveform-button.selected {
          background-color: #4f46e5;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default WaveformExplorer;
