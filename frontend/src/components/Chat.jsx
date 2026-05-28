import { useState, useRef, useEffect } from "react";

// Color presets for special message logs
const SYSTEM_COLOR = "text-emerald-400 bg-emerald-950/40 border border-emerald-900/60";
const CORRECT_COLOR = "text-yellow-400 bg-yellow-950/40 border border-yellow-900/60";

/**
 * Chat Component
 * Manages the live game chat and guesses. 
 * Prevents active drawers from entering guesses or spamming chat.
 *
 * @param {Object} props
 * @param {Array} props.messages - List of { user, text, type } message objects
 * @param {Function} props.onSend - Callback to transmit a new guess/message
 * @param {String} props.currentUser - The username of the local player
 * @param {Boolean} props.isDrawer - Flag indicating if this player is drawing
 */
export default function Chat({
  messages = [],
  onSend,
  currentUser = "",
  isDrawer = false,
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // Keep chat viewport scrolled to the latest messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle message sending
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isDrawer) return;

    onSend?.(trimmed);
    setInput("");
  };

  // Keyboard shortcut (Enter)
  const handleKey = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="flex flex-col h-full bg-blue-950 select-none">
      
      {/* Chat Box Header */}
      <div className="px-4 py-4 border-b border-blue-800 flex-shrink-0 bg-blue-950">
        <h2
          className="text-center font-black text-white tracking-widest uppercase text-xs flex items-center justify-center gap-1.5"
          style={{ letterSpacing: "0.15em" }}
        >
          💬 GAME CHAT
        </h2>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {messages.map((msg, i) => {
          
          // System/Announcement message bubbles
          if (msg.type === "system") {
            return (
              <div
                key={i}
                className={`text-[10px] font-bold text-center py-1.5 px-3 rounded-lg uppercase tracking-wider ${SYSTEM_COLOR}`}
              >
                📢 {msg.text}
              </div>
            );
          }

          // Guess correct success messages
          if (msg.type === "correct") {
            return (
              <div
                key={i}
                className={`text-xs font-bold text-center py-2 px-3 rounded-lg shadow-sm ${CORRECT_COLOR}`}
              >
                🎉 {msg.user === currentUser ? "You" : msg.user} guessed the word!
              </div>
            );
          }

          // Regular player chat bubbles
          const isMe = msg.user === currentUser;
          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2 shadow-md ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-blue-900 border border-blue-800 text-blue-100 rounded-bl-none"
                }`}
              >
                {!isMe && (
                  <p className="text-[10px] font-bold text-blue-300 mb-0.5 tracking-wide">
                    {msg.user}
                  </p>
                )}
                <p className="text-xs leading-relaxed break-words font-medium">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input panel area */}
      <div className="p-3 border-t border-blue-800 flex-shrink-0 bg-blue-950">
        {isDrawer ? (
          // Disable typing panel for the active drawer
          <div className="text-center text-blue-400 text-xs py-3.5 font-bold uppercase tracking-wider bg-blue-900/30 rounded-lg border border-blue-900/60 flex items-center justify-center gap-1.5">
            🔒 You are painting — no clues!
          </div>
        ) : (
          // Active guesser text box
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your guess here..."
              maxLength={60}
              className="flex-1 rounded-lg px-3 py-2.5 text-xs bg-blue-900 text-white placeholder-blue-500 border border-blue-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all font-medium"
            />
            <button
              onClick={handleSend}
              className="px-4.5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 border border-blue-600 text-white font-bold text-xs transition-all flex items-center justify-center shadow-md active:scale-95"
            >
              ➤
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
