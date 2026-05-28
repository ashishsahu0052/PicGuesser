import { useRef, useState, useEffect } from "react";
import socket from "../socket";

// Pre-defined color palette for drawing tools
const COLORS = ["#000000", "#ef4444", "#22c55e", "#3b82f6", "#eab308"];

// Pre-defined stroke widths
const BRUSH_SIZES = [3, 6, 10, 16];

/**
 * Whiteboard Component
 * Handles the interactive canvas for drawing and guessing. 
 * Relays coordinates to all room players in real-time.
 *
 * @param {Object} props
 * @param {Boolean} props.isDrawer - Flag indicating if this player can draw
 * @param {String} props.word - The secret word to paint or guess
 * @param {String} props.room - The socket room code
 */
export default function Whiteboard({ isDrawer = true, word = "APPLE", room }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);

  // Toolbar settings
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool] = useState("pen"); // 'pen' or 'eraser'

  // Initialize white background on canvas mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Listen to remote drawing strokes and canvas clears if this player is a guesser
  useEffect(() => {
    if (!isDrawer) {
      const handleDraw = ({ from, to, color, size }) => {
        drawLine(from, to, color, size);
      };

      const handleClear = () => {
        clearCanvas();
      };

      socket.on("draw", handleDraw);
      socket.on("clear-canvas", handleClear);

      return () => {
        socket.off("draw", handleDraw);
        socket.off("clear-canvas", handleClear);
      };
    }
  }, [isDrawer]);

  // Compute cursor positions relative to the canvas aspect ratio scaling
  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  // Perform stroke operations on the 2D canvas context
  const drawLine = (from, to, drawColor, size) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  // Handle drawing initiation
  const startDrawing = (e) => {
    if (!isDrawer) return;
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  // Process mouse/pen movements and broadcast paths
  const draw = (e) => {
    if (!isDrawing.current || !isDrawer) return;

    const pos = getPos(e);
    const drawColor = tool === "eraser" ? "#ffffff" : color;
    const drawSize = tool === "eraser" ? brushSize * 2 : brushSize;

    // Draw locally
    drawLine(lastPos.current, pos, drawColor, drawSize);

    // Relay strokes to all other players in the room
    socket.emit("draw", {
      room,
      from: lastPos.current,
      to: pos,
      color: drawColor,
      size: drawSize,
    });

    lastPos.current = pos;
  };

  // End active drawing strokes
  const stopDrawing = () => {
    isDrawing.current = false;
  };

  // Standard local canvas clear
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Process manual clears and sync with others
  const handleClearCanvas = () => {
    clearCanvas();
    if (isDrawer) {
      socket.emit("clear-canvas", room);
    }
  };

  return (
    <div className="flex flex-col h-full bg-blue-950 select-none">
      
      {/* Target Word Indicator Header */}
      <div className="bg-blue-900/60 text-white text-center py-4 text-2xl font-bold tracking-widest uppercase border-b border-blue-800">
        {isDrawer ? (
          <span className="text-yellow-300 font-black">WORD: {word}</span>
        ) : (
          <span className="text-blue-200 tracking-[0.3em]">
            {word ? word.split("").map(() => "_ ").join("") : "GUESS THE WORD"}
          </span>
        )}
      </div>

      {/* Main Canvas Drawing Area */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 bg-blue-950">
        <canvas
          ref={canvasRef}
          width={900}
          height={520}
          className="bg-white rounded-lg shadow-2xl border-4 border-blue-900 max-w-full max-h-full aspect-[900/520] cursor-crosshair transition-shadow hover:shadow-blue-500/10"
          style={{ touchAction: "none" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Drawer Control Toolbar */}
      {isDrawer && (
        <div className="flex items-center gap-4 px-6 py-3 bg-blue-900 border-t-2 border-blue-800 flex-shrink-0">
          
          {/* Colors palette selection */}
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool("pen");
                }}
                className={`w-7 h-7 rounded-full border-2 transition-all duration-150 hover:scale-110 active:scale-95 ${
                  color === c && tool === "pen"
                    ? "border-white scale-115 ring-2 ring-blue-500"
                    : "border-transparent"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>

          <div className="h-6 w-[1px] bg-blue-800" />

          {/* Stroke size selector */}
          <div className="flex items-center gap-1 bg-blue-950/60 p-1 rounded-lg border border-blue-800">
            {BRUSH_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                  brushSize === s && tool !== "eraser"
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                {s}px
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-blue-800" />

          {/* Eraser option */}
          <button
            onClick={() => setTool("eraser")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide border active:scale-95 ${
              tool === "eraser"
                ? "bg-yellow-400 border-yellow-300 text-blue-950 shadow-md"
                : "bg-blue-950/40 border-blue-800 text-blue-300 hover:text-white"
            }`}
          >
            🧹 Eraser
          </button>

          {/* Trash/Clear board option */}
          <button
            onClick={handleClearCanvas}
            className="ml-auto bg-red-600 hover:bg-red-500 border border-red-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            🗑️ Clear Board
          </button>

        </div>
      )}
    </div>
  );
}
