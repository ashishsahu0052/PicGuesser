import { useEffect, useState } from "react";

export default function Timer({ seconds = 60, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const pct = (remaining / seconds) * 100;
  const urgentColor =
    remaining <= 10 ? "#ef4444" : remaining <= 20 ? "#f97316" : "#22c55e";

  return (
    <div className="flex items-center gap-3 px-4">
      {/* Circular timer */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke={urgentColor}
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.3s" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-black text-xs text-white"
          style={{ fontFamily: "'Fredoka One', cursive" }}
        >
          {remaining}
        </span>
      </div>
    </div>
  );
}
